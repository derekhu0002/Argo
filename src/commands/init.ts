import * as vscode from 'vscode';
import { DefaultSemanticUmlEngine } from '../engine/defaultEngine';
import { StitchJudge } from '../engine/stitchJudge';
import { buildFixHandoffPrompt, buildMainAgentHandoffPrompt, parseCommitPrompt } from '../utils/agentHandoff';
import { commitExists, getChangedSourceUrisForCommit, getHeadCommit } from '../utils/git';
import { syncGovernanceReports } from '../utils/governance';
import {
    intentUri,
    readIntentArchitecture,
    writeCandidateImplementationUml,
    writeImplementationUml,
} from '../utils/workspaceFs';

/**
 * `/init` — Architecture-Guided Implementation Handoff
 *
 * Pipeline:
 *   1. Resolve the canonical intent file path.
 *   2. Hand off implementation work to the Copilot main agent.
 *   3. Require the main agent to commit and return the commit id.
 *   4. Resolve source files changed by that commit.
 *   5. Rebuild the full implementation UML from the current workspace.
 */
export async function handleInit(
    request: vscode.ChatRequest,
    _context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
): Promise<void> {
    stream.markdown('## 🏗️ /init — Full Build from ArchiMate Intent\n\n');

    // ── Resolve canonical intent path ───────────────────────────────
    const intentFile = intentUri();
    try {
        await vscode.workspace.fs.stat(intentFile);
    } catch {
        stream.markdown(
            '⚠️ 找不到 `design/architecture-intent.puml`，请先创建它。\n\n' +
            '示例：在工作区根目录下创建 `design/architecture-intent.puml`，写入 ArchiMate 意图描述。\n',
        );
        return;
    }

    const { commitId, extraContext } = parseCommitPrompt(request.prompt);
    let archiMateIntent: string;
    try {
        archiMateIntent = await readIntentArchitecture();
    } catch (err) {
        stream.markdown(`❌ 无法读取架构意图：\`${String(err)}\`\n`);
        return;
    }

    if (!commitId) {
        const handoffPrompt = buildMainAgentHandoffPrompt(intentFile, 'init', extraContext);
        stream.markdown(
            '### Step 1 — Handoff To Copilot Main Agent\n\n' +
            '当前稳定 VS Code API 不支持由 Argo 直接编程式拉起 GitHub Copilot 主 agent 并等待其完成代码修改。\n\n' +
            '请将下面这段指令交给 Copilot 主 agent 执行。Argo 只接受 **commit id** 作为下一步输入：commit 中的变更文件用于定位本次实现范围，而正式裁判始终基于当前工作区全量源码重建完整实现架构。\n\n',
        );
        stream.markdown('```text\n' + handoffPrompt + '\n```\n\n');
        stream.markdown(
            '主 agent 完成后，请重新运行：\n\n' +
            '`@argo /init commit:<commit-id>`\n',
        );
        return;
    }

    // ── Step 1: Resolve commit and changed files ───────────────────
    stream.markdown(`### Step 1 — Resolving commit \`${commitId}\` …\n\n`);
    if (!(await commitExists(commitId))) {
        stream.markdown(`❌ 找不到 commit: \`${commitId}\`\n`);
        return;
    }

    const headCommit = await getHeadCommit();
    if (!headCommit.startsWith(commitId)) {
        stream.markdown(
            `⚠️ 当前工作区 HEAD 是 \`${headCommit.slice(0, 12)}\`，不是 \`${commitId}\`。` +
            'Argo 将基于**当前工作区中这些文件的实际内容**提取实现架构，而不是从 git 对象中重建临时快照。\n\n',
        );
    }

    const changedUris = await getChangedSourceUrisForCommit(commitId);
    if (changedUris.length === 0) {
        stream.markdown(
            `⚠️ commit \`${commitId}\` 没有检测到可分析的源码文件变更，无法提取实现架构。\n`,
        );
        return;
    }

    stream.markdown(
        `发现 **${changedUris.length}** 个变更源码文件。Argo 将以这些变更定位本次实现范围，但正式裁判会基于当前工作区全量源码重建完整实现架构。\n\n`,
    );

    // ── Step 2: Extract UML from real workspace code ───────────────
    const engine = new DefaultSemanticUmlEngine();
    const judge = new StitchJudge();
    try {
        const result = await engine.extract({
            targetUris: [],
            incremental: false,
            token,
            stream,
        });

        const implementationUml = result.plantUml;

        stream.markdown('### Step 3 — Judging architecture stitching …\n\n');
        const judgement = await judge.judge(archiMateIntent, implementationUml, token);

        if (judgement.verdict === 'pass') {
            const savedUri = await writeImplementationUml(implementationUml);
            stream.markdown(
                `✅ 架构缝合通过。commit \`${commitId}\` 的实现与当前意图一致。\n\n` +
                `✅ 新的正式实现架构已写入 [design/implementation-uml.puml](${savedUri.toString()})。\n\n` +
                `> 变更文件：${changedUris.length} 个 · UML 重建范围：当前工作区全量源码 · 耗时 ${result.elapsedMs}ms\n`,
            );
            try {
                await syncGovernanceReports(archiMateIntent, implementationUml, stream, token);
            } catch (err) {
                if (err instanceof vscode.CancellationError) {
                    throw err;
                }
                stream.markdown(
                    `⚠️ 正式实现架构已保存，但治理资产自动同步失败：\`${String(err)}\`\n\n` +
                    '你可以稍后运行 `@argo /link` 手动再次同步治理资产。\n\n',
                );
            }
            return;
        }

        const candidateUri = await writeCandidateImplementationUml(implementationUml);

        stream.markdown('❌ 架构缝合失败，检测到以下违规项：\n\n');
        for (const violation of judgement.violations) {
            stream.markdown(
                `- **${violation.intentComponent}** ↔ \`${violation.codeElement}\`：${violation.description}\n` +
                `  - 修复建议：${violation.suggestedFix}\n`,
            );
        }

        stream.markdown(
            `\n⚠️ 候选实现架构已单独存档至 [design/implementation-uml.candidate.puml](${candidateUri.toString()})，` +
            '正式实现架构文件尚未被覆盖。该候选 UML 同样是基于当前工作区全量源码重建的完整视图。\n\n',
        );

        const fixPrompt = buildFixHandoffPrompt(intentFile, judgement.violations, 'init');
        stream.markdown(
            '\n❌ 架构缝合失败！请将以下指令交接给 Copilot 主 Agent 进行修复。' +
            '修复完成后，请使用新的 commit id 重新运行 `@argo /init commit:<new-id>`。\n\n',
        );
        stream.markdown('```text\n' + fixPrompt + '\n```\n');
    } catch (err) {
        if (err instanceof vscode.CancellationError) {
            stream.markdown('⚠️ Operation cancelled.\n');
            return;
        }
        stream.markdown(`❌ 实现架构提取失败：\`${String(err)}\`\n`);
    }
}

import * as vscode from 'vscode';
import { DefaultSemanticUmlEngine } from '../engine/defaultEngine';
import { buildMainAgentHandoffPrompt, parseCommitPrompt } from '../utils/agentHandoff';
import { commitExists, getChangedSourceUrisForCommit, getHeadCommit } from '../utils/git';
import { intentUri, writeImplementationUml } from '../utils/workspaceFs';

/**
 * `/init` — Architecture-Guided Implementation Handoff
 *
 * Pipeline:
 *   1. Resolve the canonical intent file path.
 *   2. Hand off implementation work to the Copilot main agent.
 *   3. Require the main agent to commit and return the commit id.
 *   4. Resolve source files changed by that commit.
 *   5. Extract implementation UML from real workspace code and persist it.
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

    if (!commitId) {
        const handoffPrompt = buildMainAgentHandoffPrompt(intentFile, 'init', extraContext);
        stream.markdown(
            '### Step 1 — Handoff To Copilot Main Agent\n\n' +
            '当前稳定 VS Code API 不支持由 Argo 直接编程式拉起 GitHub Copilot 主 agent 并等待其完成代码修改。\n\n' +
            '请将下面这段指令交给 Copilot 主 agent 执行。Argo 只接受 **commit id** 作为下一步输入，并会基于该 commit 对真实代码做实现架构提取。\n\n',
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

    const targetUris = await getChangedSourceUrisForCommit(commitId);
    if (targetUris.length === 0) {
        stream.markdown(
            `⚠️ commit \`${commitId}\` 没有检测到可分析的源码文件变更，无法提取实现架构。\n`,
        );
        return;
    }

    stream.markdown(
        `发现 **${targetUris.length}** 个变更源码文件，开始基于真实代码提取实现架构。\n\n`,
    );

    // ── Step 2: Extract UML from real workspace code ───────────────
    const engine = new DefaultSemanticUmlEngine();
    try {
        const result = await engine.extract({
            targetUris,
            incremental: false,
            token,
            stream,
        });

        const savedUri = await writeImplementationUml(result.plantUml);
        stream.markdown(
            `✅ 基于 commit \`${commitId}\` 相关真实代码提取的实现架构已自动存档至 [design/implementation-uml.puml](${savedUri.toString()})。\n\n`,
        );
        stream.markdown(
            `> 提取范围：${targetUris.length} 个变更源码文件 · 耗时 ${result.elapsedMs}ms\n`,
        );
    } catch (err) {
        if (err instanceof vscode.CancellationError) {
            stream.markdown('⚠️ Operation cancelled.\n');
            return;
        }
        stream.markdown(`❌ 实现架构提取失败：\`${String(err)}\`\n`);
    }
}

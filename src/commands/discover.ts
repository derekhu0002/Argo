import * as vscode from 'vscode';
import { sendLlmRequest } from '../lm/chatModelHelper';
import {
    buildDiscoverIntentUserPrompt,
    DISCOVER_INTENT_SYSTEM_PROMPT,
} from '../lm/prompts';
import { syncGovernanceReports } from '../utils/governance';
import {
    intentUri,
    readImplementationUml,
    writeIntentArchitectureDetailed,
} from '../utils/workspaceFs';

const DISCOVERY_TOKEN_BUDGET = 8192;

/**
 * `/discover` — Architecture Discovery Workflow
 *
 * Pipeline:
 *   1. Read the formal implementation UML from design/implementation-uml.puml.
 *   2. Ask the LLM to abstract a high-level ArchiMate-style intent architecture.
 *   3. Persist the discovered intent to design/architecture-intent.puml.
 *   4. Auto-sync governance artifacts from the newly discovered baseline.
 */
export async function handleDiscover(
    _request: vscode.ChatRequest,
    _context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
): Promise<void> {
    stream.markdown('## 🧭 /discover — Architecture Discovery Workflow\n\n');

    let implementationUml: string;
    try {
        stream.markdown('### Step 1 — Loading formal implementation architecture …\n\n');
        implementationUml = await readImplementationUml();
    } catch (err) {
        if (err instanceof vscode.CancellationError) {
            return;
        }
        stream.markdown(
            `❌ 无法读取正式实现架构：\`${String(err)}\`\n\n` +
            '请先运行 `@argo /baseline`、`@argo /init` 或 `@argo /evolve` 生成 `design/implementation-uml.puml`。\n',
        );
        return;
    }

    let overwriteNotice = false;
    try {
        await vscode.workspace.fs.stat(intentUri());
        overwriteNotice = true;
    } catch {
        overwriteNotice = false;
    }

    if (overwriteNotice) {
        stream.markdown('⚠️ 检测到已存在的 `design/architecture-intent.puml`。`/discover` 将覆盖该文件，并以当前实现架构反推的新意图作为新的基线。\n\n');
    }

    let discoveredIntent: string;
    try {
        stream.markdown('### Step 2 — Inferring high-level ArchiMate intent from implementation UML …\n\n');
        const raw = await sendLlmRequest(
            DISCOVER_INTENT_SYSTEM_PROMPT,
            buildDiscoverIntentUserPrompt(implementationUml),
            token,
            DISCOVERY_TOKEN_BUDGET,
        );
        discoveredIntent = cleanPlantUml(raw);
        if (!discoveredIntent.includes('@startuml') || !discoveredIntent.includes('@enduml')) {
            throw new Error('LLM did not return a valid PlantUML document.');
        }
    } catch (err) {
        if (err instanceof vscode.CancellationError) {
            return;
        }
        stream.markdown(
            `❌ 意图架构推导失败：\`${String(err)}\`\n\n` +
            '未写入 `design/architecture-intent.puml`，也未启动追溯/偏离分析。\n',
        );
        return;
    }

    let savedIntentUri: vscode.Uri;
    try {
        const persistResult = await writeIntentArchitectureDetailed(discoveredIntent);
        savedIntentUri = persistResult.uri;
        discoveredIntent = persistResult.prepared;
        if (persistResult.corrections.length > 0) {
            stream.markdown('### Step 3 — Rule-based PlantUML normalization …\n\n');
            stream.markdown(
                '⚠️ 在保存前已应用确定性修正规则，以通过 PlantUML 编译校验：\n' +
                persistResult.corrections.map(item => `- ${item}`).join('\n') +
                '\n\n',
            );
        }
    } catch (err) {
        if (err instanceof vscode.CancellationError) {
            return;
        }
        stream.markdown(
            `❌ 无法写入意图架构文件：\`${String(err)}\`\n\n` +
            '请检查工作区写入权限后重试。\n',
        );
        return;
    }

    stream.markdown('### Step 4 — Auto-syncing governance artifacts …\n\n');
    try {
        stream.markdown('### 🏛️ Discovered Intent Baseline\n\n');
        stream.markdown(
            `${overwriteNotice ? '⚠️ 已覆盖' : '✅ 已生成'} [design/architecture-intent.puml](${savedIntentUri.toString()})。\n\n` +
            '✅ 该意图文件已通过真实 PlantUML 编译验证后写入磁盘。\n\n',
        );
        await syncGovernanceReports(discoveredIntent, implementationUml, stream, token);
    } catch (err) {
        if (err instanceof vscode.CancellationError) {
            return;
        }
        stream.markdown(
            `❌ 自动追溯与偏离分析失败：\`${String(err)}\`\n\n` +
            `已保存新的意图文件 [design/architecture-intent.puml](${savedIntentUri.toString()})，但治理资产同步未成功完成。\n`,
        );
    }
}

function cleanPlantUml(raw: string): string {
    return raw.replace(/```plantuml?\s*/g, '').replace(/```/g, '').trim();
}

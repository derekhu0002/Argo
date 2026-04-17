import * as vscode from 'vscode';
import {
    readImplementationUml,
    readIntentArchitecture,
} from '../utils/workspaceFs';
import { syncGovernanceReports } from '../utils/governance';

/**
 * `/link` — Build Traceability Matrix
 *
 * Pipeline:
 *   1. Read the canonical intent architecture from design/architecture-intent.puml.
 *   2. Read the persisted implementation UML from design/implementation-uml.puml.
 *   3. Refresh the governance artifacts under design/.
 */
export async function handleLink(
    _request: vscode.ChatRequest,
    _context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
): Promise<void> {
    stream.markdown('## 🔗 /link — Traceability Matrix\n\n');

    let archiMateIntent: string;
    try {
        archiMateIntent = await readIntentArchitecture();
    } catch (err) {
        stream.markdown(
            `❌ 无法读取架构意图：\`${String(err)}\`\n\n` +
            '请先创建 `design/architecture-intent.puml`，再运行 `@argo /link`。\n',
        );
        return;
    }

    // ── Step 1: Load current intent and implementation baseline ────
    stream.markdown('### Step 1 — Loading canonical architecture assets …\n\n');

    let implementationUml: string;
    try {
        implementationUml = await readImplementationUml();
    } catch (err) {
        if (err instanceof vscode.CancellationError) return;
        stream.markdown(
            `❌ 无法读取正式实现架构：\`${String(err)}\`\n\n` +
            '请先运行 `@argo /baseline`、`@argo /init` 或 `@argo /evolve` 生成 `design/implementation-uml.puml`。\n',
        );
        return;
    }

    try {
        await syncGovernanceReports(archiMateIntent, implementationUml, stream, token);
    } catch (err) {
        if (err instanceof vscode.CancellationError) return;
        stream.markdown(`❌ Failed to build traceability analysis: \`${String(err)}\`\n`);
    }
}

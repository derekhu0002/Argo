import * as vscode from 'vscode';
import { StitchJudge } from '../engine/stitchJudge';
import {
    writeArchitectureDriftReport,
    readImplementationUml,
    readIntentArchitecture,
    writeTraceabilityMatrix,
} from '../utils/workspaceFs';

/**
 * `/link` — Build Traceability Matrix
 *
 * Pipeline:
 *   1. Read the canonical intent architecture from design/architecture-intent.puml.
 *   2. Read the persisted implementation UML from design/implementation-uml.puml.
 *   3. LLM maps each ArchiMate component to concrete code classes.
 *   4. Analyse drift/deviation and remediation suggestions.
 *   5. Persist both governance artifacts under design/.
 */
export async function handleLink(
    request: vscode.ChatRequest,
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

    // ── Step 2: Build traceability matrix and drift report ─────────
    stream.markdown('### Step 2 — Building traceability matrix …\n\n');
    const judge = new StitchJudge();

    try {
        const matrix = await judge.buildTraceabilityMatrix(
            archiMateIntent,
            implementationUml,
            token,
        );

        if (matrix.entries.length === 0) {
            stream.markdown('⚠️ No mappings could be established. Argo will still generate a drift report because zero mappings may itself indicate severe architectural deviation.\n\n');
        }

        stream.markdown('### Step 3 — Analysing architecture drift …\n\n');
        const driftReport = await judge.analyseDrift(
            archiMateIntent,
            implementationUml,
            matrix,
            token,
        );

        const matrixUri = await writeTraceabilityMatrix(matrix);
        const driftUri = await writeArchitectureDriftReport(driftReport);
        stream.markdown('### 📋 Traceability Matrix\n\n');
        stream.markdown(
            `✅ Traceability Matrix 已自动存档至 [design/traceability-matrix.md](${matrixUri.toString()})。\n\n`,
        );
        stream.markdown(
            `✅ Architecture Drift Report 已自动存档至 [design/architecture-drift-report.md](${driftUri.toString()})。\n\n`,
        );

        stream.markdown(
            `### 🧭 Drift Summary\n\n` +
            `- **Overall status:** ${driftReport.overallStatus}\n` +
            `- **Drift score:** ${Math.round(driftReport.driftScore * 100)}%\n` +
            `- **Deviation count:** ${driftReport.deviations.length}\n\n` +
            `${driftReport.summary || ''}\n\n`,
        );

        stream.markdown(
            `\n> Generated at ${matrix.generatedAt.toISOString()} · ${matrix.entries.length} mapping(s)\n\n` +
            '> 💡 **Next step:** Review the drift report, then use `@argo /evolve` to remediate the detected deviations with governance context.\n',
        );
    } catch (err) {
        if (err instanceof vscode.CancellationError) return;
        stream.markdown(`❌ Failed to build traceability analysis: \`${String(err)}\`\n`);
    }
}

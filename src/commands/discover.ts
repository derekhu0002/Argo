import * as vscode from 'vscode';
import { StitchJudge } from '../engine/stitchJudge';
import { sendLlmRequest } from '../lm/chatModelHelper';
import {
    buildDiscoverIntentUserPrompt,
    DISCOVER_INTENT_SYSTEM_PROMPT,
} from '../lm/prompts';
import {
    driftReportUri,
    intentUri,
    readImplementationUml,
    traceabilityMatrixUri,
    writeArchitectureDriftReport,
    writeIntentArchitecture,
    writeTraceabilityMatrix,
} from '../utils/workspaceFs';

const DISCOVERY_TOKEN_BUDGET = 8192;

/**
 * `/discover` — Architecture Discovery Workflow
 *
 * Pipeline:
 *   1. Read the formal implementation UML from design/implementation-uml.puml.
 *   2. Ask the LLM to abstract a high-level ArchiMate-style intent architecture.
 *   3. Persist the discovered intent to design/architecture-intent.puml.
 *   4. Reuse StitchJudge to immediately build traceability and drift baselines.
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
        savedIntentUri = await writeIntentArchitecture(discoveredIntent);
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

    stream.markdown('### Step 3 — Auto-linking discovered intent back to implementation …\n\n');

    const judge = new StitchJudge();
    try {
        const matrix = await judge.buildTraceabilityMatrix(
            discoveredIntent,
            implementationUml,
            token,
        );
        const driftReport = await judge.analyseDrift(
            discoveredIntent,
            implementationUml,
            matrix,
            token,
        );

        const matrixUri = await writeTraceabilityMatrix(matrix);
        const driftUri = await writeArchitectureDriftReport(driftReport);

        stream.markdown('### 🏛️ Discovered Intent Baseline\n\n');
        stream.markdown(
            `${overwriteNotice ? '⚠️ 已覆盖' : '✅ 已生成'} [design/architecture-intent.puml](${savedIntentUri.toString()})。\n\n`,
        );
        stream.markdown(
            `✅ Traceability Matrix 已自动存档至 [design/traceability-matrix.md](${matrixUri.toString()})。\n\n`,
        );
        stream.markdown(
            `✅ Architecture Drift Report 已自动存档至 [design/architecture-drift-report.md](${driftUri.toString()})。\n\n`,
        );

        stream.markdown(
            `### 📈 Discovery Summary\n\n` +
            `- **Intent file:** ${overwriteNotice ? 'overwritten from implementation-derived discovery' : 'created from implementation-derived discovery'}\n` +
            `- **Traceability mappings:** ${matrix.entries.length}\n` +
            `- **Drift score:** ${Math.round(driftReport.driftScore * 100)}%\n` +
            `- **Overall status:** ${driftReport.overallStatus}\n\n`,
        );

        if (driftReport.driftScore > 0.05) {
            stream.markdown(
                '⚠️ 由于这份意图是从实现反推得到的，理论上 Drift Score 应接近 0。当前结果偏高，通常意味着发现阶段抽象过强、实现 UML 不完整，或追溯映射未完全收敛。\n\n',
            );
        } else {
            stream.markdown('✅ 该发现结果已形成一份可作为后续演进基线的低偏离意图架构。\n\n');
        }

        stream.markdown(
            `> Generated artifacts: [design/architecture-intent.puml](${savedIntentUri.toString()}), ` +
            `[design/traceability-matrix.md](${matrixUri.toString()}), ` +
            `[design/architecture-drift-report.md](${driftUri.toString()})\n`,
        );
    } catch (err) {
        if (err instanceof vscode.CancellationError) {
            return;
        }
        stream.markdown(
            `❌ 自动追溯与偏离分析失败：\`${String(err)}\`\n\n` +
            `已保存新的意图文件 [design/architecture-intent.puml](${savedIntentUri.toString()})，` +
            `但未能成功更新 [design/traceability-matrix.md](${traceabilityMatrixUri().toString()}) ` +
            `或 [design/architecture-drift-report.md](${driftReportUri().toString()})。\n`,
        );
    }
}

function cleanPlantUml(raw: string): string {
    return raw.replace(/```plantuml?\s*/g, '').replace(/```/g, '').trim();
}
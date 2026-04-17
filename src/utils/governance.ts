import * as vscode from 'vscode';
import { StitchJudge } from '../engine/stitchJudge';
import {
    writeArchitectureDriftReport,
    writeTraceabilityMatrix,
} from './workspaceFs';

/**
 * Refresh governance artifacts from the current intent and implementation UML.
 */
export async function syncGovernanceReports(
    intentUml: string,
    implUml: string,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
): Promise<void> {
    const judge = new StitchJudge();

    stream.markdown('### Governance Sync — Refreshing traceability and drift artifacts …\n\n');

    const matrix = await judge.buildTraceabilityMatrix(intentUml, implUml, token);
    const driftReport = await judge.analyseDrift(intentUml, implUml, matrix, token);

    const matrixUri = await writeTraceabilityMatrix(matrix);
    const driftUri = await writeArchitectureDriftReport(driftReport);

    if (matrix.entries.length === 0) {
        stream.markdown('⚠️ 未建立到任何追溯映射。Argo 仍已刷新偏离报告，因为零映射本身可能意味着显著偏离。\n\n');
    }

    stream.markdown(
        `✅ 架构治理资产已自动同步至最新状态 ` +
        `[Traceability Matrix](${matrixUri.toString()}) | ` +
        `[Drift Report](${driftUri.toString()})\n\n`,
    );

    stream.markdown(
        `- **Mappings:** ${matrix.entries.length}\n` +
        `- **Drift score:** ${Math.round(driftReport.driftScore * 100)}%\n` +
        `- **Overall status:** ${driftReport.overallStatus}\n\n`,
    );
}
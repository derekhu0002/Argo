import * as vscode from 'vscode';
import { DefaultSemanticUmlEngine } from '../engine/defaultEngine';
import { StitchJudge } from '../engine/stitchJudge';

/**
 * `/link` — Build Traceability Matrix
 *
 * Pipeline:
 *   1. User provides ArchiMate intent (after reviewing /baseline output).
 *   2. Run ExtractSemanticUML() to get current implementation UML.
 *   3. LLM maps each ArchiMate component to concrete code classes.
 *   4. Produce a TraceabilityMatrix with confidence scores.
 */
export async function handleLink(
    request: vscode.ChatRequest,
    _context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
): Promise<void> {
    stream.markdown('## 🔗 /link — Traceability Matrix\n\n');

    const archiMateIntent = request.prompt.trim();
    if (!archiMateIntent) {
        stream.markdown(
            '⚠️ Please provide your ArchiMate intent in the message.\n\n' +
            'Example:\n```\n@argo /link\n' +
            'Application Component "OrderService" serves Business Process "Place Order".\n' +
            'Application Component "PaymentGateway" serves Business Process "Process Payment".\n```\n',
        );
        return;
    }

    // ── Step 1: Extract current implementation UML ─────────────────
    stream.markdown('### Step 1 — Extracting implementation UML from workspace …\n\n');
    const engine = new DefaultSemanticUmlEngine();

    let implementationUml: string;
    try {
        const result = await engine.extract({
            targetUris: [],
            incremental: false,
            token,
            stream,
        });
        implementationUml = result.plantUml;
    } catch (err) {
        if (err instanceof vscode.CancellationError) return;
        stream.markdown(`❌ Failed to extract UML: \`${String(err)}\`\n`);
        return;
    }

    stream.markdown('```plantuml\n' + implementationUml + '\n```\n\n');

    // ── Step 2: Build traceability matrix ──────────────────────────
    stream.markdown('### Step 2 — Building traceability matrix …\n\n');
    const judge = new StitchJudge();

    try {
        const matrix = await judge.buildTraceabilityMatrix(
            archiMateIntent,
            implementationUml,
            token,
        );

        if (matrix.entries.length === 0) {
            stream.markdown('⚠️ No mappings could be established. Ensure your ArchiMate intent references components found in the codebase.\n');
            return;
        }

        // Output as a structured table
        stream.markdown('### 📋 Traceability Matrix\n\n');
        stream.markdown('| ArchiMate Component | Code Elements | Confidence | Rationale |\n');
        stream.markdown('|---------------------|--------------|------------|----------|\n');

        for (const entry of matrix.entries) {
            const confidence = `${Math.round(entry.confidence * 100)}%`;
            const codeEls = entry.codeElements.map(e => `\`${e}\``).join(', ');
            stream.markdown(
                `| **${entry.intentComponent}** | ${codeEls} | ${confidence} | ${entry.rationale} |\n`,
            );
        }

        stream.markdown(
            `\n> Generated at ${matrix.generatedAt.toISOString()} · ${matrix.entries.length} mapping(s)\n\n` +
            '> 💡 **Next step:** Review low-confidence mappings, then use `@argo /init` or `@argo /evolve` to enforce stitching.\n',
        );
    } catch (err) {
        if (err instanceof vscode.CancellationError) return;
        stream.markdown(`❌ Failed to build traceability matrix: \`${String(err)}\`\n`);
    }
}

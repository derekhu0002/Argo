import * as vscode from 'vscode';
import { DefaultSemanticUmlEngine } from '../engine/defaultEngine';
import { writeImplementationUml, writeSymbolSummaries } from '../utils/workspaceFs';

/**
 * `/baseline` — Legacy Codebase Reverse-Engineering (X-Ray Mode)
 *
 * Pipeline:
 *   1. Resolve target URIs (workspace root or user-specified).
 *   2. Run full ExtractSemanticUML() via DefaultSemanticUmlEngine.
 *   3. Stream the richly annotated PlantUML result back to the user.
 */
export async function handleBaseline(
    request: vscode.ChatRequest,
    _context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
): Promise<void> {
    stream.markdown('## 🔬 /baseline — Legacy Code X-Ray\n\n');

    // Resolve target URIs from the prompt or fall back to workspace root.
    const targetUris = resolveTargetUris(request.prompt);

    stream.markdown(
        `Scanning **${targetUris.length === 0 ? 'entire workspace' : targetUris.length + ' target(s)'}** …\n\n`,
    );

    const engine = new DefaultSemanticUmlEngine();

    try {
        const result = await engine.extract({
            targetUris,
            incremental: false,
            token,
            stream,
        });

        // Auto-save the PlantUML diagram to design/implementation-uml.puml
        const savedUri = await writeImplementationUml(result.plantUml);
        const summariesUri = await writeSymbolSummaries(result.summaries);
        stream.markdown('\n### 📊 Extracted Semantic UML\n\n');
        stream.markdown(
            `✅ 提取的实现架构已自动存档至 [design/implementation-uml.puml](${savedUri.toString()})。\n\n`,
        );
        stream.markdown(
            `✅ Symbol Summaries 已自动存档至 [design/symbol-summaries.md](${summariesUri.toString()})。\n\n`,
        );

        // Output summary stats
        stream.markdown(
            `### 📈 Extraction Summary\n\n` +
            `- **Symbols analysed:** ${result.summaries.length}\n` +
            `- **Call-graph edges:** ${countEdges(result.callGraph)}\n` +
            `- **Notes generated:** ${result.notes.length}\n` +
            `- **Elapsed:** ${result.elapsedMs}ms\n\n`,
        );

        stream.markdown(
            '> 💡 **Next step:** Review this UML, draft your ArchiMate intent, then run `@argo /link` to build a traceability matrix.\n',
        );
    } catch (err) {
        if (err instanceof vscode.CancellationError) {
            stream.markdown('⚠️ Operation cancelled.\n');
            return;
        }
        stream.markdown(`❌ **Error during baseline extraction:**\n\n\`${String(err)}\`\n`);
    }
}

function resolveTargetUris(prompt: string): vscode.Uri[] {
    const uris: vscode.Uri[] = [];
    const pathPattern = /(?:^|\s)((?:\.\/|\/|[a-zA-Z]:\\)[^\s]+)/g;
    let match: RegExpExecArray | null;
    while ((match = pathPattern.exec(prompt)) !== null) {
        uris.push(vscode.Uri.file(match[1]));
    }
    return uris;
}

function countEdges(callGraph: Map<string, string[]>): number {
    let count = 0;
    for (const targets of callGraph.values()) {
        count += targets.length;
    }
    return count;
}

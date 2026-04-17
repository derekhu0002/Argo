import * as vscode from 'vscode';
import { DefaultSemanticUmlEngine } from '../engine/defaultEngine';
import { syncGovernanceReports } from '../utils/governance';
import {
    readIntentArchitecture,
    writeImplementationUml,
    writeSymbolSummaries,
} from '../utils/workspaceFs';

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

        try {
            const archiMateIntent = await readIntentArchitecture();
            await syncGovernanceReports(archiMateIntent, result.plantUml, stream, token);
        } catch (err) {
            if (err instanceof vscode.CancellationError) {
                throw err;
            }
            if (String(err).includes('找不到意图架构文件')) {
                stream.markdown('💡 尚未发现意图架构，已跳过同步映射与偏离报告。\n\n');
            } else {
                stream.markdown(
                    `⚠️ 实现架构已保存，但治理资产自动同步失败：\`${String(err)}\`\n\n` +
                    '你可以稍后运行 `@argo /link` 手动再次同步治理资产。\n\n',
                );
            }
        }

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

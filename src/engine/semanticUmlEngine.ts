import * as vscode from 'vscode';
import {
    CodeSymbolNode,
    BusinessSummary,
    SemanticUmlResult,
    SemanticUmlEngineOptions,
} from './types';

/**
 * Abstract base class for the Semantic UML extraction engine.
 *
 * Pipeline:  LSP topology  ──▶  Map (LLM summarise)  ──▶  Reduce (LLM → PlantUML)
 *
 * Concrete implementations will be built in Phase 2+.
 */
export abstract class SemanticUmlEngine {

    // ------------------------------------------------------------------ //
    //  Public entry point                                                 //
    // ------------------------------------------------------------------ //

    /**
     * Run the full three-step extraction pipeline and return a rich
     * PlantUML result with stereotypes, notes, and call-graph metadata.
     */
    async extract(options: SemanticUmlEngineOptions): Promise<SemanticUmlResult> {
        const start = Date.now();

        options.stream.markdown('🔍 Step 1/3 — Collecting symbol topology via LSP …\n');
        const symbols = await this.collectTopology(options.targetUris, options.token);

        if (options.token.isCancellationRequested) {
            throw new vscode.CancellationError();
        }

        options.stream.markdown(`📝 Step 2/3 — Map phase: summarising ${symbols.length} symbols with LLM …\n`);
        const summaries = await this.mapSummarise(symbols, options);

        if (options.token.isCancellationRequested) {
            throw new vscode.CancellationError();
        }

        options.stream.markdown('🧩 Step 3/3 — Reduce phase: generating PlantUML …\n');
        const result = await this.reduceToPlantUml(symbols, summaries, options);

        result.elapsedMs = Date.now() - start;
        return result;
    }

    // ------------------------------------------------------------------ //
    //  Step 1 — LSP Topology Collection (abstract)                       //
    // ------------------------------------------------------------------ //

    /**
     * Use the VS Code LSP APIs (DocumentSymbol, CallHierarchy, etc.)
     * to build a typed symbol graph for all target URIs.
     */
    protected abstract collectTopology(
        uris: vscode.Uri[],
        token: vscode.CancellationToken,
    ): Promise<CodeSymbolNode[]>;

    // ------------------------------------------------------------------ //
    //  Step 2 — Map Phase: LLM Business Summarisation (abstract)         //
    // ------------------------------------------------------------------ //

    /**
     * For each symbol, send its source text to the Copilot LLM
     * (via `vscode.lm` API) and ask it to produce a one-sentence
     * business side-effect summary plus stereotype classification.
     */
    protected abstract mapSummarise(
        symbols: CodeSymbolNode[],
        options: SemanticUmlEngineOptions,
    ): Promise<BusinessSummary[]>;

    // ------------------------------------------------------------------ //
    //  Step 3 — Reduce Phase: PlantUML Generation (abstract)             //
    // ------------------------------------------------------------------ //

    /**
     * Combine the topology graph and per-symbol summaries, then call
     * the LLM once more to synthesise a complete PlantUML diagram
     * with <<Stereotype>> tags and `note` annotations.
     */
    protected abstract reduceToPlantUml(
        symbols: CodeSymbolNode[],
        summaries: BusinessSummary[],
        options: SemanticUmlEngineOptions,
    ): Promise<SemanticUmlResult>;
}

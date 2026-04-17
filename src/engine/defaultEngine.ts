import * as vscode from 'vscode';
import { SemanticUmlEngine } from './semanticUmlEngine';
import { collectTopologyFromUris, resolveSourceUris } from './lspCollector';
import {
    CodeSymbolNode,
    BusinessSummary,
    SemanticUmlResult,
    SemanticUmlEngineOptions,
    UmlNote,
} from './types';
import { sendLlmRequest } from '../lm/chatModelHelper';
import {
    MAP_SYSTEM_PROMPT,
    buildMapUserPrompt,
    REDUCE_SYSTEM_PROMPT,
    buildReduceUserPrompt,
} from '../lm/prompts';

interface MapPromptSymbol {
    symbolName: string;
    sourceText: string;
    callees: string[];
}

interface BatchMapResponseItem {
    symbolName: string;
    effectSummary?: unknown;
    stereotypes?: unknown;
    sideEffects?: unknown;
}

interface TrivialSummaryHint {
    stereotype: string;
}

/**
 * Default concrete implementation of the three-step
 * Semantic UML extraction pipeline.
 */
export class DefaultSemanticUmlEngine extends SemanticUmlEngine {

    private static readonly MAP_BATCH_SIZE = 15;
    private static readonly MAP_CONCURRENCY = 2;
    private static readonly TRIVIAL_SYMBOL_MAX_CHARS = 220;
    private static readonly DTO_CLASS_MAX_CHARS = 600;

    // ------------------------------------------------------------------ //
    //  Step 1 — LSP Topology Collection                                  //
    // ------------------------------------------------------------------ //

    protected async collectTopology(
        uris: vscode.Uri[],
        token: vscode.CancellationToken,
    ): Promise<CodeSymbolNode[]> {
        const resolved = await resolveSourceUris(uris);
        return collectTopologyFromUris(resolved, token);
    }

    // ------------------------------------------------------------------ //
    //  Step 2 — Map Phase: LLM Business Summarisation                    //
    // ------------------------------------------------------------------ //

    protected async mapSummarise(
        symbols: CodeSymbolNode[],
        options: SemanticUmlEngineOptions,
    ): Promise<BusinessSummary[]> {
        const summariesByName = new Map<string, BusinessSummary>();
        const llmCandidates: CodeSymbolNode[] = [];

        for (const symbol of symbols) {
            const trivialSummary = this.buildTrivialSummary(symbol);
            if (trivialSummary) {
                summariesByName.set(symbol.name, trivialSummary);
            } else {
                llmCandidates.push(symbol);
            }
        }

        const skippedCount = summariesByName.size;
        const llmBatchCount = Math.ceil(llmCandidates.length / DefaultSemanticUmlEngine.MAP_BATCH_SIZE);
        options.stream.markdown(
            `  Fast-path skipped ${skippedCount} trivial symbol(s); ${llmCandidates.length} symbol(s) remain for LLM analysis in ${llmBatchCount} batch(es).\n`,
        );

        if (llmCandidates.length > 0) {
            const batches = this.chunkSymbols(llmCandidates, DefaultSemanticUmlEngine.MAP_BATCH_SIZE);
            const batchResults = await this.runMapBatchesWithConcurrency(batches, options);
            for (const summary of batchResults.flat()) {
                summariesByName.set(summary.symbolName, summary);
            }
        }

        for (const symbol of symbols) {
            if (!summariesByName.has(symbol.name)) {
                summariesByName.set(symbol.name, this.createFallbackSummary(symbol));
            }
        }

        return symbols.map(symbol => summariesByName.get(symbol.name) ?? this.createFallbackSummary(symbol));
    }

    private async runMapBatchesWithConcurrency(
        batches: CodeSymbolNode[][],
        options: SemanticUmlEngineOptions,
    ): Promise<BusinessSummary[][]> {
        const results: BusinessSummary[][] = new Array(batches.length);
        const totalSymbols = this.countSymbols(batches);
        let nextBatchIndex = 0;
        const workerCount = Math.min(DefaultSemanticUmlEngine.MAP_CONCURRENCY, batches.length);

        const workers = Array.from({ length: workerCount }, async () => {
            while (true) {
                if (options.token.isCancellationRequested) {
                    throw new vscode.CancellationError();
                }

                const currentIndex = nextBatchIndex;
                nextBatchIndex += 1;
                if (currentIndex >= batches.length) {
                    return;
                }

                const batch = batches[currentIndex];
                const start = currentIndex * DefaultSemanticUmlEngine.MAP_BATCH_SIZE + 1;
                const end = start + batch.length - 1;
                options.stream.markdown(
                    `  Summarising symbols ${start}–${end} of ${totalSymbols} in batch ${currentIndex + 1}/${batches.length} …\n`,
                );
                results[currentIndex] = await this.summariseBatch(batch, options);
            }
        });

        await Promise.all(workers);
        return results;
    }

    private async summariseBatch(
        symbols: CodeSymbolNode[],
        options: SemanticUmlEngineOptions,
    ): Promise<BusinessSummary[]> {
        const promptSymbols = symbols.map(symbol => this.toMapPromptSymbol(symbol, options));
        const userPrompt = buildMapUserPrompt(promptSymbols);

        try {
            const raw = await sendLlmRequest(
                MAP_SYSTEM_PROMPT,
                userPrompt,
                options.token,
                options.mapBudgetTokens ?? 4096,
            );
            return this.parseBatchMapResponse(symbols, raw);
        } catch {
            return symbols.map(symbol => this.createFallbackSummary(symbol));
        }
    }

    private parseBatchMapResponse(symbols: CodeSymbolNode[], raw: string): BusinessSummary[] {
        try {
            const cleaned = raw.replace(/```json?\s*/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleaned);
            const items = Array.isArray(parsed) ? parsed as BatchMapResponseItem[] : [];
            const byName = new Map(items.map(item => [String(item.symbolName ?? ''), item]));
            return symbols.map(symbol => {
                const item = byName.get(symbol.name);
                if (!item) {
                    return this.createFallbackSummary(symbol);
                }
                return {
                    symbolName: symbol.name,
                    effectSummary: String(item.effectSummary ?? ''),
                    stereotypes: Array.isArray(item.stereotypes)
                        ? item.stereotypes.map(String).filter(Boolean)
                        : [this.guessStereotype(symbol)],
                    sideEffects: Array.isArray(item.sideEffects)
                        ? item.sideEffects.map(String).filter(Boolean)
                        : [],
                };
            });
        } catch {
            return symbols.map(symbol => this.createFallbackSummary(symbol));
        }
    }

    private toMapPromptSymbol(
        symbol: CodeSymbolNode,
        options: SemanticUmlEngineOptions,
    ): MapPromptSymbol {
        const maxChars = Math.max(600, (options.mapBudgetTokens ?? 4096) * 2);
        const sourceText = symbol.sourceText.length > maxChars
            ? symbol.sourceText.slice(0, maxChars) + '\n// … (truncated)'
            : symbol.sourceText;
        return {
            symbolName: symbol.name,
            sourceText,
            callees: symbol.callees,
        };
    }

    private buildTrivialSummary(symbol: CodeSymbolNode): BusinessSummary | undefined {
        const hint = this.classifyTrivialSymbol(symbol);
        if (!hint) {
            return undefined;
        }

        return {
            symbolName: symbol.name,
            effectSummary: '',
            stereotypes: [hint.stereotype],
            sideEffects: [],
        };
    }

    private classifyTrivialSymbol(symbol: CodeSymbolNode): TrivialSummaryHint | undefined {
        const source = symbol.sourceText.trim();
        const normalized = source.replace(/\s+/g, ' ').trim();
        const lowerName = symbol.name.toLowerCase();

        if (symbol.kind === vscode.SymbolKind.Interface) {
            return { stereotype: this.guessStereotype(symbol, '<<ValueObject>>') };
        }

        if (source.length <= DefaultSemanticUmlEngine.TRIVIAL_SYMBOL_MAX_CHARS && this.isSimpleAccessor(normalized)) {
            return { stereotype: '<<Utility>>' };
        }

        if (source.length <= DefaultSemanticUmlEngine.TRIVIAL_SYMBOL_MAX_CHARS && this.isSimplePassThrough(normalized)) {
            return { stereotype: this.guessStereotype(symbol) };
        }

        if (
            (symbol.kind === vscode.SymbolKind.Class || symbol.kind === vscode.SymbolKind.Struct) &&
            source.length <= DefaultSemanticUmlEngine.DTO_CLASS_MAX_CHARS &&
            (/(dto|request|response|payload|viewmodel|view-model|params|command|query|record|message)$/i.test(lowerName) ||
                this.isDtoLikeType(source))
        ) {
            return { stereotype: '<<ValueObject>>' };
        }

        return undefined;
    }

    private isSimpleAccessor(source: string): boolean {
        return /^((public|private|protected|static|async|readonly|get|set)\s+)*[\w$<>\[\],:?]+\s*\([^)]*\)\s*\{\s*(return\s+(this\.)?[\w$.[\]]+;|(this\.)?[\w$.[\]]+\s*=\s*[\w$.[\]]+;|return;)?\s*\}$/i.test(source);
    }

    private isSimplePassThrough(source: string): boolean {
        return /^(public|private|protected|static|async|readonly|constructor|function|def|func)?[\s\w$<>\[\],:?()=-]*\{\s*(super\([^)]*\);\s*)?(return\s+[^;]+;)?\s*\}$/i.test(source)
            && !/(await\s|for\s*\(|while\s*\(|switch\s*\(|catch\s*\(|throw\s|new\s+[A-Z]|fetch\(|axios\.|repository\.|db\.|query\(|execute\(|publish\(|emit\()/i.test(source);
    }

    private isDtoLikeType(source: string): boolean {
        const bodyMatch = source.match(/\{([\s\S]*)\}/);
        if (!bodyMatch) {
            return false;
        }
        const body = bodyMatch[1].trim();
        if (!body) {
            return true;
        }
        if (/(=>|await\s|return\s+[^\n]*\(|throw\s|for\s*\(|while\s*\(|switch\s*\(|catch\s*\(|publish\(|emit\(|query\(|execute\()/i.test(body)) {
            return false;
        }
        const lines = body.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
        return lines.length > 0 && lines.every(line =>
            /^((public|private|protected|readonly|static)\s+)*[\w$]+[!?]?\s*[:=][^;]*;?$/i.test(line) ||
            /^constructor\([^)]*\)\s*\{\s*\}$/i.test(line),
        );
    }

    private chunkSymbols(symbols: CodeSymbolNode[], batchSize: number): CodeSymbolNode[][] {
        const chunks: CodeSymbolNode[][] = [];
        for (let i = 0; i < symbols.length; i += batchSize) {
            chunks.push(symbols.slice(i, i + batchSize));
        }
        return chunks;
    }

    private createFallbackSummary(symbol: CodeSymbolNode): BusinessSummary {
        return {
            symbolName: symbol.name,
            effectSummary: '',
            stereotypes: [this.guessStereotype(symbol)],
            sideEffects: [],
        };
    }

    private countSymbols(batches: CodeSymbolNode[][]): number {
        let total = 0;
        for (const batch of batches) {
            total += batch.length;
        }
        return total;
    }

    private guessStereotype(sym: CodeSymbolNode, fallback: string = '<<Utility>>'): string {
        const lower = sym.name.toLowerCase();
        if (lower.includes('controller')) return '<<Controller>>';
        if (lower.includes('appservice') || lower.includes('applicationservice')) return '<<ApplicationService>>';
        if (lower.includes('domainservice')) return '<<DomainService>>';
        if (lower.includes('service')) return '<<Service>>';
        if (lower.includes('repository') || lower.includes('repo')) return '<<Repository>>';
        if (lower.includes('gateway') || lower.includes('client')) return '<<Gateway>>';
        if (lower.includes('handler')) return '<<EventHandler>>';
        if (lower.includes('factory')) return '<<Factory>>';
        if (lower.includes('adapter')) return '<<Adapter>>';
        if (lower.includes('aggregate')) return '<<Aggregate>>';
        if (lower.includes('specification')) return '<<Specification>>';
        if (lower.includes('entity') || lower.includes('model')) return '<<Entity>>';
        if (/(dto|request|response|payload|valueobject|value-object|record|message)$/i.test(lower)) return '<<ValueObject>>';
        return fallback;
    }

    // ------------------------------------------------------------------ //
    //  Step 3 — Reduce Phase: PlantUML Generation                        //
    // ------------------------------------------------------------------ //

    protected async reduceToPlantUml(
        symbols: CodeSymbolNode[],
        summaries: BusinessSummary[],
        options: SemanticUmlEngineOptions,
    ): Promise<SemanticUmlResult> {
        const callGraph = new Map<string, string[]>();
        for (const sym of symbols) {
            callGraph.set(sym.name, sym.callees);
        }

        const summaryLookup = new Map(summaries.map(s => [s.symbolName, s]));
        const symbolSummaries = symbols.map(sym => {
            const s = summaryLookup.get(sym.name);
            return {
                name: sym.name,
                stereotypes: s?.stereotypes ?? [],
                effectSummary: s?.effectSummary ?? '',
                sideEffects: s?.sideEffects ?? [],
            };
        });

        const userPrompt = buildReduceUserPrompt(symbolSummaries, callGraph);

        let plantUml: string;
        try {
            plantUml = await sendLlmRequest(
                REDUCE_SYSTEM_PROMPT,
                userPrompt,
                options.token,
                8192,
            );
            plantUml = plantUml.replace(/```plantuml?\s*/g, '').replace(/```/g, '').trim();
        } catch {
            plantUml = this.generateFallbackPlantUml(symbolSummaries, callGraph);
        }

        const notes: UmlNote[] = summaries.map(s => ({
            targetElement: s.symbolName,
            content: `${s.effectSummary}\nSide effects: ${s.sideEffects.join(', ') || 'none detected'}`,
        }));

        return {
            plantUml,
            summaries,
            notes,
            callGraph,
            elapsedMs: 0,
        };
    }

    /** Deterministic fallback when LLM is not available. */
    private generateFallbackPlantUml(
        symbols: Array<{ name: string; stereotypes: string[]; effectSummary: string; sideEffects: string[] }>,
        callGraph: Map<string, string[]>,
    ): string {
        const lines: string[] = ['@startuml', ''];

        for (const sym of symbols) {
            const stereo = sym.stereotypes[0] ?? '';
            const alias = sym.name.replace(/\./g, '_');
            lines.push(`class "${sym.name}" as ${alias} ${stereo} {`);
            lines.push('}');
            if (sym.effectSummary) {
                lines.push(`note right of ${alias} : ${sym.effectSummary}`);
            }
            lines.push('');
        }

        for (const [src, targets] of callGraph) {
            const srcAlias = src.replace(/\./g, '_');
            for (const tgt of targets) {
                const tgtAlias = tgt.replace(/\./g, '_');
                if (symbols.some(s => s.name === tgt)) {
                    lines.push(`${srcAlias} --> ${tgtAlias}`);
                }
            }
        }

        lines.push('', '@enduml');
        return lines.join('\n');
    }
}

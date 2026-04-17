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

/**
 * Default concrete implementation of the three-step
 * Semantic UML extraction pipeline.
 */
export class DefaultSemanticUmlEngine extends SemanticUmlEngine {

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
        const summaries: BusinessSummary[] = [];
        const batchSize = 5;

        for (let i = 0; i < symbols.length; i += batchSize) {
            if (options.token.isCancellationRequested) break;

            const batch = symbols.slice(i, i + batchSize);
            options.stream.markdown(
                `  Summarising symbols ${i + 1}–${Math.min(i + batchSize, symbols.length)} of ${symbols.length} …\n`,
            );

            const batchResults = await Promise.all(
                batch.map(sym => this.summariseOneSymbol(sym, options)),
            );
            summaries.push(...batchResults);
        }
        return summaries;
    }

    private async summariseOneSymbol(
        sym: CodeSymbolNode,
        options: SemanticUmlEngineOptions,
    ): Promise<BusinessSummary> {
        // Truncate very large source bodies to stay within token budget.
        const maxChars = (options.mapBudgetTokens ?? 4096) * 3;
        const source = sym.sourceText.length > maxChars
            ? sym.sourceText.slice(0, maxChars) + '\n// … (truncated)'
            : sym.sourceText;

        const userPrompt = buildMapUserPrompt(sym.name, source, sym.callees);

        try {
            const raw = await sendLlmRequest(
                MAP_SYSTEM_PROMPT,
                userPrompt,
                options.token,
                options.mapBudgetTokens ?? 4096,
            );
            return this.parseMapResponse(sym.name, raw);
        } catch {
            // Fallback if LLM is unavailable or returns garbage.
            return {
                symbolName: sym.name,
                effectSummary: `(auto) Code symbol: ${sym.name}`,
                stereotypes: [this.guessStereotype(sym)],
                sideEffects: [],
            };
        }
    }

    private parseMapResponse(symbolName: string, raw: string): BusinessSummary {
        try {
            // Strip potential markdown code fences
            const cleaned = raw.replace(/```json?\s*/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleaned);
            return {
                symbolName,
                effectSummary: String(parsed.effectSummary ?? ''),
                stereotypes: Array.isArray(parsed.stereotypes) ? parsed.stereotypes : [],
                sideEffects: Array.isArray(parsed.sideEffects) ? parsed.sideEffects : [],
            };
        } catch {
            return {
                symbolName,
                effectSummary: raw.slice(0, 200),
                stereotypes: [],
                sideEffects: [],
            };
        }
    }

    /** Simple heuristic when LLM is unavailable. */
    private guessStereotype(sym: CodeSymbolNode): string {
        const lower = sym.name.toLowerCase();
        if (lower.includes('controller')) return '<<Controller>>';
        if (lower.includes('service')) return '<<Service>>';
        if (lower.includes('repository') || lower.includes('repo')) return '<<Repository>>';
        if (lower.includes('gateway') || lower.includes('client')) return '<<Gateway>>';
        if (lower.includes('handler')) return '<<EventHandler>>';
        if (lower.includes('factory')) return '<<Factory>>';
        if (lower.includes('adapter')) return '<<Adapter>>';
        if (lower.includes('entity') || lower.includes('model')) return '<<Entity>>';
        return '<<Utility>>';
    }

    // ------------------------------------------------------------------ //
    //  Step 3 — Reduce Phase: PlantUML Generation                        //
    // ------------------------------------------------------------------ //

    protected async reduceToPlantUml(
        symbols: CodeSymbolNode[],
        summaries: BusinessSummary[],
        options: SemanticUmlEngineOptions,
    ): Promise<SemanticUmlResult> {
        // Build call graph
        const callGraph = new Map<string, string[]>();
        for (const sym of symbols) {
            callGraph.set(sym.name, sym.callees);
        }

        // Prepare symbol summaries for the prompt
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
            // Clean potential markdown wrapping
            plantUml = plantUml.replace(/```plantuml?\s*/g, '').replace(/```/g, '').trim();
        } catch {
            // Fallback: generate a minimal but correct PlantUML
            plantUml = this.generateFallbackPlantUml(symbolSummaries, callGraph);
        }

        // Extract notes from summaries for structured output
        const notes: UmlNote[] = summaries.map(s => ({
            targetElement: s.symbolName,
            content: `${s.effectSummary}\nSide effects: ${s.sideEffects.join(', ') || 'none detected'}`,
        }));

        return {
            plantUml,
            summaries,
            notes,
            callGraph,
            elapsedMs: 0, // Will be set by the base class extract()
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
                // Only add edge if target is in our symbol set
                if (symbols.some(s => s.name === tgt)) {
                    lines.push(`${srcAlias} --> ${tgtAlias}`);
                }
            }
        }

        lines.push('', '@enduml');
        return lines.join('\n');
    }
}

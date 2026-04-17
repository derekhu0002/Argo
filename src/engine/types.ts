import * as vscode from 'vscode';

// ============================================================================
// 1. Semantic UML Engine — Input / Output Contracts
// ============================================================================

/** A single code symbol enriched with LSP-derived topology. */
export interface CodeSymbolNode {
    /** Fully-qualified symbol name (e.g. `com.example.OrderService.placeOrder`). */
    name: string;
    /** The kind reported by VS Code (class, method, function, etc.). */
    kind: vscode.SymbolKind;
    /** File URI where the symbol is defined. */
    uri: vscode.Uri;
    /** Range within the file. */
    range: vscode.Range;
    /** Direct outgoing calls (call-graph edges). */
    callees: string[];
    /** Direct incoming callers. */
    callers: string[];
    /** Raw source text of the symbol body. */
    sourceText: string;
}

/** Business-side summary produced by the LLM in the Map phase. */
export interface BusinessSummary {
    /** The symbol this summary belongs to. */
    symbolName: string;
    /** One-sentence plain-language summary of real side effects. */
    effectSummary: string;
    /** Detected stereotypes (e.g. `<<Service>>`, `<<Repository>>`, `<<Gateway>>`). */
    stereotypes: string[];
    /** Key observations: RPC calls, DB writes, event emissions, etc. */
    sideEffects: string[];
}

/** A single note annotation to attach to a UML element. */
export interface UmlNote {
    /** Which PlantUML element this note attaches to. */
    targetElement: string;
    /** The note body text. */
    content: string;
}

/** Complete output of the ExtractSemanticUML engine. */
export interface SemanticUmlResult {
    /** The generated PlantUML source code (includes stereotypes & notes). */
    plantUml: string;
    /** Structured business summaries per symbol (Map phase output). */
    summaries: BusinessSummary[];
    /** Structured notes embedded in the PlantUML. */
    notes: UmlNote[];
    /** Topology: adjacency list keyed by symbol name -> callee names. */
    callGraph: Map<string, string[]>;
    /** Milliseconds elapsed for the full extraction. */
    elapsedMs: number;
}

// ============================================================================
// 2. Architecture Stitching (Judge) Contracts
// ============================================================================

export type StitchVerdict = 'pass' | 'fail';

/** One specific mismatch between intent and implementation. */
export interface StitchViolation {
    /** Which ArchiMate component is affected. */
    intentComponent: string;
    /** Which code-level element is mismatched. */
    codeElement: string;
    /** Human-readable description of the violation. */
    description: string;
    /** Suggested fix (PlantUML diff or code patch hint). */
    suggestedFix: string;
}

/** Result of a stitching / anti-corruption judgement. */
export interface StitchJudgement {
    verdict: StitchVerdict;
    violations: StitchViolation[];
    /** Full LLM reasoning trace (for debugging / audit). */
    reasoning: string;
}

// ============================================================================
// 3. Traceability Matrix (for /link command)
// ============================================================================

/** One row in the traceability matrix. */
export interface TraceabilityEntry {
    /** ArchiMate component id or name. */
    intentComponent: string;
    /** Mapped code-level classes / modules. */
    codeElements: string[];
    /** Confidence score 0–1. */
    confidence: number;
    /** LLM rationale for the mapping. */
    rationale: string;
}

export interface TraceabilityMatrix {
    entries: TraceabilityEntry[];
    generatedAt: Date;
}

export type DriftSeverity = 'low' | 'medium' | 'high';
export type DriftStatus = 'aligned' | 'minor-drift' | 'major-drift';

export interface ArchitectureDeviation {
    intentComponent: string;
    codeElements: string[];
    category: string;
    severity: DriftSeverity;
    description: string;
    impact: string;
    recommendation: string;
}

export interface ArchitectureDriftReport {
    summary: string;
    overallStatus: DriftStatus;
    driftScore: number;
    deviations: ArchitectureDeviation[];
    recommendations: string[];
    generatedAt: Date;
}

// ============================================================================
// 4. Engine Configuration
// ============================================================================

export interface SemanticUmlEngineOptions {
    /** URI list of files / folders to analyse. */
    targetUris: vscode.Uri[];
    /** If true, run incremental extraction (for /evolve). */
    incremental: boolean;
    /** Optional: only analyse symbols that changed since this git ref. */
    sinceRef?: string;
    /** Max tokens budget per LLM call in Map phase. */
    mapBudgetTokens?: number;
    /** Cancellation support. */
    token: vscode.CancellationToken;
    /** Stream for reporting progress to the chat UI. */
    stream: vscode.ChatResponseStream;
}

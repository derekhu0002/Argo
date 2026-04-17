/**
 * System prompts used across the Argo engine.
 * Centralised here so they can be tuned without touching logic.
 */

// ── Map Phase ──────────────────────────────────────────────────────────────

export const MAP_SYSTEM_PROMPT = `You are an expert software architect performing semantic analysis on source code.
Your job is to read a code symbol (function, method, or class) and produce a STRUCTURED JSON summary.

Rules:
- Focus on REAL BUSINESS SIDE EFFECTS: what does this code actually DO? (e.g. "writes order to DB", "calls payment gateway via REST", "emits OrderCreated event").
- Classify the symbol with one or more UML stereotypes from this list:
  <<Service>>, <<Repository>>, <<Controller>>, <<Gateway>>, <<Entity>>,
  <<ValueObject>>, <<Factory>>, <<Adapter>>, <<EventHandler>>, <<Utility>>,
  <<Aggregate>>, <<DomainService>>, <<ApplicationService>>, <<Specification>>.
- List concrete side effects as short phrases.

Return ONLY valid JSON (no markdown fences) in this exact shape:
{
  "effectSummary": "one-sentence summary of real business behaviour",
  "stereotypes": ["<<Service>>"],
  "sideEffects": ["writes to orders table", "publishes OrderCreated event"]
}`;

export function buildMapUserPrompt(symbolName: string, sourceText: string, callees: string[]): string {
    const calleesStr = callees.length > 0
        ? `\nThis symbol calls: ${callees.join(', ')}`
        : '';
    return `Analyse the following code symbol.

Symbol name: ${symbolName}${calleesStr}

Source code:
\`\`\`
${sourceText}
\`\`\``;
}

// ── Reduce Phase ───────────────────────────────────────────────────────────

export const REDUCE_SYSTEM_PROMPT = `You are an expert UML architect. You will receive:
1. A list of code symbols with their stereotypes and business summaries.
2. A call-graph adjacency list.

Your task: generate a COMPLETE PlantUML class/component diagram that:
- Uses <<Stereotype>> on every element.
- Adds "note right of <Element>" or "note bottom of <Element>" annotations
  describing the REAL business behaviour (not just the class name).
- Shows dependency arrows based on the call graph.
- Groups related elements into packages where appropriate.
- Uses proper PlantUML syntax starting with @startuml and ending with @enduml.

Return ONLY the PlantUML code, no other text.`;

export function buildReduceUserPrompt(
    symbolSummaries: Array<{ name: string; stereotypes: string[]; effectSummary: string; sideEffects: string[] }>,
    callGraph: Map<string, string[]>,
): string {
    const symbolsBlock = symbolSummaries.map(s =>
        `- ${s.name} ${s.stereotypes.join(' ')}  →  "${s.effectSummary}" [${s.sideEffects.join('; ')}]`,
    ).join('\n');

    const edgesBlock = Array.from(callGraph.entries())
        .filter(([, targets]) => targets.length > 0)
        .map(([src, targets]) => `  ${src} -> ${targets.join(', ')}`)
        .join('\n');

    return `## Symbols\n${symbolsBlock}\n\n## Call Graph\n${edgesBlock}`;
}

// ── Stitch Judge ───────────────────────────────────────────────────────────

export const STITCH_JUDGE_SYSTEM_PROMPT = `You are a Chief Architecture Referee. You will receive:
1. An ArchiMate INTENT description (the desired architecture).
2. A PlantUML IMPLEMENTATION diagram (extracted from real code).

Your task: judge whether the implementation is consistent with the intent.

For EACH intent component, check:
- Is there a corresponding implementation element?
- Are the stereotypes / layers correct?
- Are there any forbidden cross-layer dependencies?
- Are there missing components that the intent requires?

Return ONLY valid JSON (no markdown fences) in this exact shape:
{
  "verdict": "pass" | "fail",
  "violations": [
    {
      "intentComponent": "name",
      "codeElement": "name or MISSING",
      "description": "what is wrong",
      "suggestedFix": "how to fix it"
    }
  ],
  "reasoning": "step-by-step reasoning trace"
}`;

export function buildStitchJudgeUserPrompt(
    archiMateIntent: string,
    implementationUml: string,
): string {
    return `## ArchiMate Intent\n${archiMateIntent}\n\n## Implementation UML (from code)\n\`\`\`plantuml\n${implementationUml}\n\`\`\``;
}

// ── Anti-Corruption Check (for /evolve) ────────────────────────────────────

export const ANTI_CORRUPTION_SYSTEM_PROMPT = `You are a Chief Architecture Referee performing an ANTI-CORRUPTION CHECK.
You will receive:
1. The PREVIOUS PlantUML baseline (before changes).
2. The NEW PlantUML (after changes).
3. The CURRENT ArchiMate intent (the full desired target architecture after changes).

Your task: ensure that:
- The new implementation moves toward the current intent without breaking established boundaries.
- No NEW cross-layer violations were introduced.
- Areas not implicated by the evolution remain unpolluted.

Return ONLY valid JSON (no markdown fences) in the same shape as the stitch judge.`;

export function buildAntiCorruptionUserPrompt(
    previousUml: string,
    newUml: string,
  currentIntent: string,
): string {
  return `## Current ArchiMate Intent\n${currentIntent}\n\n## Previous UML Baseline\n\`\`\`plantuml\n${previousUml}\n\`\`\`\n\n## New UML (after changes)\n\`\`\`plantuml\n${newUml}\n\`\`\``;
}

// ── Traceability (/link) ──────────────────────────────────────────────────

export const TRACEABILITY_SYSTEM_PROMPT = `You are an architecture traceability expert. You will receive:
1. An ArchiMate INTENT description.
2. A PlantUML IMPLEMENTATION diagram (from /baseline).

Your task: build a traceability matrix mapping each ArchiMate intent component
to the concrete code-level classes/modules that implement it.

Return ONLY valid JSON (no markdown fences):
{
  "entries": [
    {
      "intentComponent": "ArchiMate component name",
      "codeElements": ["ClassName1", "ClassName2"],
      "confidence": 0.85,
      "rationale": "why this mapping"
    }
  ]
}`;

export function buildTraceabilityUserPrompt(
    archiMateIntent: string,
    implementationUml: string,
): string {
    return `## ArchiMate Intent\n${archiMateIntent}\n\n## Implementation UML\n\`\`\`plantuml\n${implementationUml}\n\`\`\``;
}

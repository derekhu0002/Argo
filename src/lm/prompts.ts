/**
 * System prompts used across the Argo engine.
 * Centralised here so they can be tuned without touching logic.
 */

interface PromptSection {
    title: string;
    body: string;
    language?: string;
}

function buildPromptSections(sections: PromptSection[]): string {
    return sections.map(section => {
        const trimmedBody = section.body.trim();
        if (!section.language) {
            return `## ${section.title}\n${trimmedBody}`;
        }
        return `## ${section.title}\n\`\`\`${section.language}\n${trimmedBody}\n\`\`\``;
    }).join('\n\n');
}

function buildGovernanceJudgementSystemPrompt(
    title: string,
    inputs: string[],
    checks: string[],
): string {
    return `You are a Chief Architecture Referee performing ${title}.
You will receive:
${inputs.map((input, index) => `${index + 1}. ${input}`).join('\n')}

Your task: judge the architecture using the following checks:
${checks.map(check => `- ${check}`).join('\n')}

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
}

// ── Map Phase ──────────────────────────────────────────────────────────────

export const MAP_SYSTEM_PROMPT = `You are an expert software architect performing semantic analysis on code.
Your job is to read a BATCH of class/module-level code SKELETONS and produce a STRUCTURED JSON array summary.

IMPORTANT: You are receiving LIGHTWEIGHT SKELETONS — method bodies have been removed; only signatures,
properties, and type information remain. You also receive CLASS-LEVEL dependency topology (aggregated
callees from all internal methods elevated to their owning class/module).

Rules:
- Infer REAL BUSINESS SIDE EFFECTS from method signatures, property types, and the dependency topology (callees).
- Classify the container with one or more UML stereotypes from this list:
  <<Service>>, <<Repository>>, <<Controller>>, <<Gateway>>, <<Entity>>,
  <<ValueObject>>, <<Factory>>, <<Adapter>>, <<EventHandler>>, <<Utility>>,
  <<Aggregate>>, <<DomainService>>, <<ApplicationService>>, <<Specification>>.
- List concrete side effects inferred from signatures and dependencies as short phrases.
- Return one item for every input symbol, preserving the original symbolName exactly.

Return ONLY valid JSON (no markdown fences) in this exact shape:
[
  {
    "symbolName": "Exact.Input.SymbolName",
    "effectSummary": "one-sentence summary of real business behaviour",
    "stereotypes": ["<<Service>>"],
    "sideEffects": ["writes to orders table", "publishes OrderCreated event"]
  }
]`;

export function buildMapUserPrompt(symbols: Array<{ symbolName: string; skeleton: string; callees: string[] }>): string {
    const rendered = symbols.map((symbol, index) => {
        const callees = symbol.callees.length > 0
            ? symbol.callees.join(', ')
            : '(none)';
        return [
            `### Symbol ${index + 1}`,
            `symbolName: ${symbol.symbolName}`,
            `callees: ${callees}`,
            'skeleton:',
            '```',
            symbol.skeleton,
            '```',
        ].join('\n');
    }).join('\n\n');

    return `Analyse the following batch of class/module skeletons and return a JSON array with one summary per container.\n\n${rendered}`;
}

// ── Reduce Phase ───────────────────────────────────────────────────────────

export const REDUCE_SYSTEM_PROMPT = `You are an expert UML architect. You will receive:
1. A list of class/module-level symbols with their stereotypes and business summaries.
2. A class-level call-graph adjacency list (dependencies between classes/modules).

Your task: generate a COMPLETE PlantUML class/component diagram that:
- Uses <<Stereotype>> on every element.
- Adds "note right of <Element>" or "note bottom of <Element>" annotations
  describing the REAL business behaviour (not just the class name).
- Shows dependency arrows based on the class-level call graph.
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

export const STITCH_JUDGE_SYSTEM_PROMPT = buildGovernanceJudgementSystemPrompt(
  'an ARCHITECTURE STITCHING CHECK',
  [
    'An ArchiMate INTENT description (the desired architecture).',
    'A PlantUML IMPLEMENTATION diagram (extracted from real code).',
  ],
  [
    'For each intent component, verify that there is a corresponding implementation element.',
    'Validate stereotypes, layers, and architectural boundaries.',
    'Detect forbidden cross-layer dependencies.',
    'Detect missing implementation for required intent components.',
  ],
);

export function buildStitchJudgeUserPrompt(
    archiMateIntent: string,
    implementationUml: string,
): string {
  return buildPromptSections([
    { title: 'ArchiMate Intent', body: archiMateIntent },
    { title: 'Implementation UML (from code)', body: implementationUml, language: 'plantuml' },
  ]);
}

// ── Anti-Corruption Check (for /evolve) ────────────────────────────────────

export const ANTI_CORRUPTION_SYSTEM_PROMPT = buildGovernanceJudgementSystemPrompt(
  'an ANTI-CORRUPTION CHECK',
  [
    'The PREVIOUS PlantUML baseline (before changes).',
    'The NEW PlantUML (after changes).',
    'The CURRENT ArchiMate intent (the full desired target architecture after changes).',
    'Optionally, the latest architecture drift report from /link.',
  ],
  [
    'Ensure the new implementation moves toward the current intent without breaking established boundaries.',
    'Detect newly introduced cross-layer violations.',
    'Ensure areas not implicated by the evolution remain unpolluted.',
    'Use the drift report as governance context when it is provided.',
  ],
);

export function buildAntiCorruptionUserPrompt(
    previousUml: string,
    newUml: string,
    currentIntent: string,
    driftReport?: string,
): string {
  const sections: PromptSection[] = [
    { title: 'Current ArchiMate Intent', body: currentIntent },
    { title: 'Previous UML Baseline', body: previousUml, language: 'plantuml' },
    { title: 'New UML (after changes)', body: newUml, language: 'plantuml' },
  ];
  if (driftReport) {
    sections.push({ title: 'Latest Architecture Drift Report', body: driftReport });
  }
  return buildPromptSections(sections);
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
  return buildPromptSections([
    { title: 'ArchiMate Intent', body: archiMateIntent },
    { title: 'Implementation UML', body: implementationUml, language: 'plantuml' },
  ]);
}

export const DRIFT_ANALYSIS_SYSTEM_PROMPT = `You are an architecture governance referee.
You will receive:
1. The canonical ArchiMate INTENT.
2. The current PlantUML IMPLEMENTATION view.
3. The current traceability matrix between intent and code.

Your task: analyse architectural drift and deviation between the intent and implementation.

You must:
- assess the overall drift severity
- identify concrete deviations and why they matter
- suggest specific remediation actions that would move the implementation toward the intent
- produce a driftScore between 0 and 1, where 0 means fully aligned and 1 means severely drifted

Return ONLY valid JSON (no markdown fences) in this exact shape:
{
  "summary": "short executive summary",
  "overallStatus": "aligned" | "minor-drift" | "major-drift",
  "driftScore": 0.35,
  "deviations": [
    {
      "intentComponent": "name",
      "codeElements": ["ClassA", "ClassB"],
      "category": "missing-component | layer-violation | stereotype-mismatch | unexpected-dependency | traceability-gap | other",
      "severity": "low" | "medium" | "high",
      "description": "what drift was detected",
      "impact": "why this matters",
      "recommendation": "how to fix it"
    }
  ],
  "recommendations": ["action 1", "action 2"]
}`;

export function buildDriftAnalysisUserPrompt(
    archiMateIntent: string,
    implementationUml: string,
    traceabilityMatrix: string,
): string {
  return buildPromptSections([
    { title: 'ArchiMate Intent', body: archiMateIntent },
    { title: 'Implementation UML', body: implementationUml, language: 'plantuml' },
    { title: 'Traceability Matrix', body: traceabilityMatrix, language: 'json' },
  ]);
}

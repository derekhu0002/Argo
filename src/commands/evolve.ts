import * as vscode from 'vscode';
import { DefaultSemanticUmlEngine } from '../engine/defaultEngine';
import { StitchJudge } from '../engine/stitchJudge';
import { sendLlmRequestStreaming, sendLlmRequest } from '../lm/chatModelHelper';

const MAX_EVOLVE_ITERATIONS = 3;

/**
 * `/evolve` — Incremental Architecture Evolution
 *
 * Pipeline:
 *   1. User provides delta ArchiMate (changed intent).
 *   2. Capture current baseline UML.
 *   3. LLM refactors only affected code and injects new logic.
 *   4. Incremental ExtractSemanticUML() on changed areas.
 *   5. Anti-Corruption Check: ensure no cross-layer violations or
 *      pollution of unmodified core domains.
 *   6. On violation → auto-retry & fix → loop until clean.
 */
export async function handleEvolve(
    request: vscode.ChatRequest,
    _context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
): Promise<void> {
    stream.markdown('## 🔄 /evolve — Architecture Evolution\n\n');

    const deltaIntent = request.prompt.trim();
    if (!deltaIntent) {
        stream.markdown(
            '⚠️ Please describe the **delta ArchiMate** changes you want to apply.\n\n' +
            'Example:\n```\n@argo /evolve\n' +
            'Add Application Component "NotificationService" that the existing "OrderService" calls\n' +
            'after order placement. It uses Infrastructure Service "SMTP".\n```\n',
        );
        return;
    }

    const engine = new DefaultSemanticUmlEngine();
    const judge = new StitchJudge();

    // ── Step 1: Capture current baseline UML ───────────────────────
    stream.markdown('### Step 1 — Capturing current architecture baseline …\n\n');

    let baselineResult;
    try {
        baselineResult = await engine.extract({
            targetUris: [],
            incremental: false,
            token,
            stream,
        });
    } catch (err) {
        if (err instanceof vscode.CancellationError) return;
        stream.markdown(`❌ Failed to capture baseline: \`${String(err)}\`\n`);
        return;
    }

    const previousUml = baselineResult.plantUml;
    stream.markdown('```plantuml\n' + previousUml + '\n```\n\n');

    // ── Step 2: LLM generates refactoring code ─────────────────────
    stream.markdown('### Step 2 — Generating incremental refactoring …\n\n');
    let currentRefactoring = await sendLlmRequestStreaming(
        `You are an expert software engineer performing an incremental architecture evolution.
Given the current architecture (as PlantUML) and a delta intent (new ArchiMate changes),
produce ONLY the code changes needed. Keep unrelated code untouched.
Output ONLY code with file-path comments.`,
        `## Current Architecture UML\n\`\`\`plantuml\n${previousUml}\n\`\`\`\n\n## Delta Intent\n${deltaIntent}`,
        stream,
        token,
    );

    if (token.isCancellationRequested) return;

    // ── Step 3+4: Extract new UML → Anti-Corruption Check → Iterate
    for (let iteration = 1; iteration <= MAX_EVOLVE_ITERATIONS; iteration++) {
        if (token.isCancellationRequested) return;

        stream.markdown(`\n---\n### Anti-Corruption Loop — Iteration ${iteration}/${MAX_EVOLVE_ITERATIONS}\n\n`);

        // Extract UML from the refactored code
        stream.markdown('**Extracting new semantic UML …**\n\n');
        const newUml = await extractUmlFromCodeText(currentRefactoring, token);

        stream.markdown('```plantuml\n' + newUml + '\n```\n\n');

        // Anti-corruption check
        stream.markdown('**Running anti-corruption check …**\n\n');
        const judgement = await judge.antiCorruptionCheck(previousUml, newUml, deltaIntent, token);

        stream.markdown(`**Verdict:** ${judgement.verdict === 'pass' ? '✅ PASS' : '❌ FAIL'}\n\n`);

        if (judgement.verdict === 'pass') {
            stream.markdown(
                '### ✅ Anti-Corruption Check Passed\n\n' +
                `Evolution completed cleanly in **${iteration}** iteration(s).\n\n` +
                '**Reasoning:**\n' + judgement.reasoning + '\n',
            );
            return;
        }

        // Show violations
        stream.markdown('**Violations found:**\n\n');
        for (const v of judgement.violations) {
            stream.markdown(
                `- **${v.intentComponent}** ↔ \`${v.codeElement}\`: ${v.description}\n` +
                `  - 💡 Fix: ${v.suggestedFix}\n`,
            );
        }

        if (iteration < MAX_EVOLVE_ITERATIONS) {
            stream.markdown('\n**Auto-fixing violations …**\n\n');
            currentRefactoring = await sendLlmRequestStreaming(
                `You are an expert software engineer. Fix the following anti-corruption violations
in the refactored code. Do NOT touch unrelated areas. Output ONLY the corrected code.`,
                `## Delta Intent\n${deltaIntent}\n\n` +
                `## Current Refactored Code\n\`\`\`\n${currentRefactoring}\n\`\`\`\n\n` +
                `## Violations to Fix\n${judgement.violations.map(v =>
                    `- ${v.intentComponent} ↔ ${v.codeElement}: ${v.description} → ${v.suggestedFix}`
                ).join('\n')}`,
                stream,
                token,
            );
        }
    }

    stream.markdown(
        `\n### ⚠️ Max iterations reached\n\n` +
        `Could not pass anti-corruption check in ${MAX_EVOLVE_ITERATIONS} iterations. ` +
        'Review the violations above and adjust manually.\n',
    );
}

async function extractUmlFromCodeText(
    codeText: string,
    token: vscode.CancellationToken,
): Promise<string> {
    const raw = await sendLlmRequest(
        `You are an expert UML architect. Read the following code and produce a PlantUML class diagram.
Include <<Stereotype>> on every element and add "note" annotations describing real business behaviour.
Return ONLY the PlantUML code.`,
        `\`\`\`\n${codeText}\n\`\`\``,
        token,
        8192,
    );
    return raw.replace(/```plantuml?\s*/g, '').replace(/```/g, '').trim();
}

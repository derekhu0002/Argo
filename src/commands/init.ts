import * as vscode from 'vscode';
import { DefaultSemanticUmlEngine } from '../engine/defaultEngine';
import { StitchJudge } from '../engine/stitchJudge';
import { sendLlmRequestStreaming } from '../lm/chatModelHelper';
import { readIntentArchitecture, writeImplementationUml } from '../utils/workspaceFs';

const MAX_STITCH_ITERATIONS = 3;

/**
 * `/init` — Full Build from ArchiMate Intent
 *
 * Pipeline:
 *   1. Read intent from design/architecture-intent.puml (+ optional user prompt).
 *   2. LLM generates initial code.
 *   3. ExtractSemanticUML() produces implementation UML.
 *   4. LLM judges stitching between intent UML ↔ implementation UML.
 *   5. On mismatch → LLM emits code diff → loop until stitched.
 */
export async function handleInit(
    request: vscode.ChatRequest,
    _context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
): Promise<void> {
    stream.markdown('## 🏗️ /init — Full Build from ArchiMate Intent\n\n');

    // ── Read intent from convention path ───────────────────────────
    let archiMateIntent: string;
    try {
        archiMateIntent = await readIntentArchitecture();
    } catch {
        stream.markdown(
            '⚠️ 找不到 `design/architecture-intent.puml`，请先创建它。\n\n' +
            '示例：在工作区根目录下创建 `design/architecture-intent.puml`，写入 ArchiMate 意图描述。\n',
        );
        return;
    }

    // Append user prompt as extra context if provided
    const extraContext = request.prompt.trim();
    if (extraContext) {
        archiMateIntent += `\n\n[用户补充说明] ${extraContext}`;
    }

    // ── Step 1: Generate initial code from intent ──────────────────
    stream.markdown('### Step 1 — Generating code from ArchiMate intent …\n\n');
    const generatedCode = await sendLlmRequestStreaming(
        `You are an expert software engineer. The user provides an ArchiMate architectural intent. 
Generate TypeScript/JavaScript code that implements this architecture. 
Include classes, interfaces, and module structure that map to the ArchiMate components.
Output ONLY code (with file-path comments like "// file: src/services/OrderService.ts").`,
        archiMateIntent,
        stream,
        token,
    );

    if (token.isCancellationRequested) return;

    // ── Step 2+3+4: Extract UML → Judge → Iterate ─────────────────
    const engine = new DefaultSemanticUmlEngine();
    const judge = new StitchJudge();
    let currentCode = generatedCode;

    for (let iteration = 1; iteration <= MAX_STITCH_ITERATIONS; iteration++) {
        if (token.isCancellationRequested) return;

        stream.markdown(`\n---\n### Stitch Loop — Iteration ${iteration}/${MAX_STITCH_ITERATIONS}\n\n`);

        // Step 2: Extract semantic UML from current code
        stream.markdown('**Extracting semantic UML from generated code …**\n\n');

        // For /init, we don't have real files yet — we ask the LLM to
        // produce the UML directly from the generated code text.
        const extractionResult = await extractUmlFromCodeText(currentCode, stream, token);
        if (token.isCancellationRequested) return;

        // Auto-save extracted UML to design/implementation-uml.puml
        const savedUri = await writeImplementationUml(extractionResult);
        stream.markdown(
            `✅ 提取的实现架构已自动存档至 [design/implementation-uml.puml](${savedUri.toString()})。\n\n`,
        );

        // Step 3: Judge stitching
        stream.markdown('**Judging architecture stitching …**\n\n');
        const judgement = await judge.judge(archiMateIntent, extractionResult, token);

        stream.markdown(`**Verdict:** ${judgement.verdict === 'pass' ? '✅ PASS' : '❌ FAIL'}\n\n`);

        if (judgement.verdict === 'pass') {
            stream.markdown(
                '### ✅ Architecture Stitching Successful\n\n' +
                `Achieved consistency in **${iteration}** iteration(s).\n\n` +
                '**Reasoning:**\n' + judgement.reasoning + '\n',
            );
            return;
        }

        // Step 4: Output violations and request fix
        stream.markdown('**Violations found:**\n\n');
        for (const v of judgement.violations) {
            stream.markdown(
                `- **${v.intentComponent}** ↔ \`${v.codeElement}\`: ${v.description}\n` +
                `  - 💡 Fix: ${v.suggestedFix}\n`,
            );
        }

        if (iteration < MAX_STITCH_ITERATIONS) {
            stream.markdown('\n**Applying fixes …**\n\n');
            currentCode = await sendLlmRequestStreaming(
                `You are an expert software engineer. The previous code has architecture violations. 
Fix the code to resolve ALL of the following violations while keeping the rest intact.
Output ONLY the corrected code.`,
                `## Original ArchiMate Intent\n${archiMateIntent}\n\n` +
                `## Current Code\n\`\`\`\n${currentCode}\n\`\`\`\n\n` +
                `## Violations to Fix\n${judgement.violations.map(v =>
                    `- ${v.intentComponent} ↔ ${v.codeElement}: ${v.description} → ${v.suggestedFix}`
                ).join('\n')}`,
                stream,
                token,
            );
        }
    }

    stream.markdown(
        '\n### ⚠️ Max iterations reached\n\n' +
        `Could not achieve full stitching in ${MAX_STITCH_ITERATIONS} iterations. ` +
        'Review the violations above and refine your intent or code manually.\n',
    );
}

/**
 * Ask the LLM to extract PlantUML from a code text block
 * (used when we don't have real files on disk yet).
 */
async function extractUmlFromCodeText(
    codeText: string,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
): Promise<string> {
    const { sendLlmRequest } = await import('../lm/chatModelHelper.js');
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

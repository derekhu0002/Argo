import * as vscode from 'vscode';
import {
    StitchJudgement,
    TraceabilityMatrix,
} from './types';
import { sendLlmRequest } from '../lm/chatModelHelper';
import {
    STITCH_JUDGE_SYSTEM_PROMPT,
    buildStitchJudgeUserPrompt,
    ANTI_CORRUPTION_SYSTEM_PROMPT,
    buildAntiCorruptionUserPrompt,
    TRACEABILITY_SYSTEM_PROMPT,
    buildTraceabilityUserPrompt,
} from '../lm/prompts';

/**
 * Architecture stitching judge — compares ArchiMate intent against
 * implementation UML and returns a structured verdict.
 */
export class StitchJudge {

    /**
     * Full stitching check: does the implementation UML match the intent?
     */
    async judge(
        archiMateIntent: string,
        implementationUml: string,
        token: vscode.CancellationToken,
    ): Promise<StitchJudgement> {
        const userPrompt = buildStitchJudgeUserPrompt(archiMateIntent, implementationUml);
        const raw = await sendLlmRequest(
            STITCH_JUDGE_SYSTEM_PROMPT,
            userPrompt,
            token,
            4096,
        );
        return this.parseJudgement(raw);
    }

    /**
     * Anti-corruption check for /evolve: ensure delta changes didn't
     * pollute unrelated domains.
     */
    async antiCorruptionCheck(
        previousUml: string,
        newUml: string,
        deltaIntent: string,
        token: vscode.CancellationToken,
    ): Promise<StitchJudgement> {
        const userPrompt = buildAntiCorruptionUserPrompt(previousUml, newUml, deltaIntent);
        const raw = await sendLlmRequest(
            ANTI_CORRUPTION_SYSTEM_PROMPT,
            userPrompt,
            token,
            4096,
        );
        return this.parseJudgement(raw);
    }

    /**
     * Build a traceability matrix mapping intent components to code elements.
     */
    async buildTraceabilityMatrix(
        archiMateIntent: string,
        implementationUml: string,
        token: vscode.CancellationToken,
    ): Promise<TraceabilityMatrix> {
        const userPrompt = buildTraceabilityUserPrompt(archiMateIntent, implementationUml);
        const raw = await sendLlmRequest(
            TRACEABILITY_SYSTEM_PROMPT,
            userPrompt,
            token,
            4096,
        );
        return this.parseTraceability(raw);
    }

    // ── Private parsing helpers ──────────────────────────────────────────

    private parseJudgement(raw: string): StitchJudgement {
        try {
            const cleaned = raw.replace(/```json?\s*/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleaned);
            return {
                verdict: parsed.verdict === 'pass' ? 'pass' : 'fail',
                violations: Array.isArray(parsed.violations)
                    ? parsed.violations.map((v: Record<string, unknown>) => ({
                        intentComponent: String(v.intentComponent ?? ''),
                        codeElement: String(v.codeElement ?? ''),
                        description: String(v.description ?? ''),
                        suggestedFix: String(v.suggestedFix ?? ''),
                    }))
                    : [],
                reasoning: String(parsed.reasoning ?? ''),
            };
        } catch {
            return {
                verdict: 'fail',
                violations: [],
                reasoning: `Failed to parse judge response: ${raw.slice(0, 500)}`,
            };
        }
    }

    private parseTraceability(raw: string): TraceabilityMatrix {
        try {
            const cleaned = raw.replace(/```json?\s*/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleaned);
            return {
                entries: Array.isArray(parsed.entries)
                    ? parsed.entries.map((e: Record<string, unknown>) => ({
                        intentComponent: String(e.intentComponent ?? ''),
                        codeElements: Array.isArray(e.codeElements) ? e.codeElements.map(String) : [],
                        confidence: Number(e.confidence ?? 0),
                        rationale: String(e.rationale ?? ''),
                    }))
                    : [],
                generatedAt: new Date(),
            };
        } catch {
            return { entries: [], generatedAt: new Date() };
        }
    }
}

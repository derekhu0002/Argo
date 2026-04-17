import * as vscode from 'vscode';
import {
    ArchitectureDriftReport,
    StitchJudgement,
    TraceabilityMatrix,
} from './types';
import { sendLlmRequest } from '../lm/chatModelHelper';
import {
    buildDriftAnalysisUserPrompt,
    STITCH_JUDGE_SYSTEM_PROMPT,
    buildStitchJudgeUserPrompt,
    ANTI_CORRUPTION_SYSTEM_PROMPT,
    buildAntiCorruptionUserPrompt,
    DRIFT_ANALYSIS_SYSTEM_PROMPT,
    TRACEABILITY_SYSTEM_PROMPT,
    buildTraceabilityUserPrompt,
} from '../lm/prompts';

/**
 * Architecture stitching judge — compares ArchiMate intent against
 * implementation UML and returns a structured verdict.
 */
export class StitchJudge {

    private static readonly ANALYSIS_TOKEN_BUDGET = 4096;

    /**
     * Full stitching check: does the implementation UML match the intent?
     */
    async judge(
        archiMateIntent: string,
        implementationUml: string,
        token: vscode.CancellationToken,
    ): Promise<StitchJudgement> {
        return this.runAnalysis(
            STITCH_JUDGE_SYSTEM_PROMPT,
            buildStitchJudgeUserPrompt(archiMateIntent, implementationUml),
            token,
            raw => this.parseJudgement(raw),
        );
    }

    /**
     * Anti-corruption check for /evolve: ensure the new implementation
     * aligns with the current target intent without polluting unrelated domains.
     */
    async antiCorruptionCheck(
        previousUml: string,
        newUml: string,
        currentIntent: string,
        driftReport: string | undefined,
        token: vscode.CancellationToken,
    ): Promise<StitchJudgement> {
        return this.runAnalysis(
            ANTI_CORRUPTION_SYSTEM_PROMPT,
            buildAntiCorruptionUserPrompt(previousUml, newUml, currentIntent, driftReport),
            token,
            raw => this.parseJudgement(raw),
        );
    }

    /**
     * Build a traceability matrix mapping intent components to code elements.
     */
    async buildTraceabilityMatrix(
        archiMateIntent: string,
        implementationUml: string,
        token: vscode.CancellationToken,
    ): Promise<TraceabilityMatrix> {
        return this.runAnalysis(
            TRACEABILITY_SYSTEM_PROMPT,
            buildTraceabilityUserPrompt(archiMateIntent, implementationUml),
            token,
            raw => this.parseTraceability(raw),
        );
    }

    async analyseDrift(
        archiMateIntent: string,
        implementationUml: string,
        traceabilityMatrix: TraceabilityMatrix,
        token: vscode.CancellationToken,
    ): Promise<ArchitectureDriftReport> {
        return this.runAnalysis(
            DRIFT_ANALYSIS_SYSTEM_PROMPT,
            buildDriftAnalysisUserPrompt(
                archiMateIntent,
                implementationUml,
                JSON.stringify(traceabilityMatrix, null, 2),
            ),
            token,
            raw => this.parseDriftReport(raw),
        );
    }

    // ── Private parsing helpers ──────────────────────────────────────────

    private async runAnalysis<T>(
        systemPrompt: string,
        userPrompt: string,
        token: vscode.CancellationToken,
        parser: (raw: string) => T,
    ): Promise<T> {
        const raw = await sendLlmRequest(
            systemPrompt,
            userPrompt,
            token,
            StitchJudge.ANALYSIS_TOKEN_BUDGET,
        );
        return parser(raw);
    }

    private cleanJsonResponse(raw: string): string {
        return raw.replace(/```json?\s*/g, '').replace(/```/g, '').trim();
    }

    private parseJudgement(raw: string): StitchJudgement {
        try {
            const cleaned = this.cleanJsonResponse(raw);
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
            const cleaned = this.cleanJsonResponse(raw);
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

    private parseDriftReport(raw: string): ArchitectureDriftReport {
        try {
            const cleaned = this.cleanJsonResponse(raw);
            const parsed = JSON.parse(cleaned);
            const driftScoreRaw = Number(parsed.driftScore ?? 1);
            return {
                summary: String(parsed.summary ?? ''),
                overallStatus: parsed.overallStatus === 'aligned'
                    ? 'aligned'
                    : parsed.overallStatus === 'minor-drift'
                        ? 'minor-drift'
                        : 'major-drift',
                driftScore: Number.isFinite(driftScoreRaw)
                    ? Math.min(1, Math.max(0, driftScoreRaw))
                    : 1,
                deviations: Array.isArray(parsed.deviations)
                    ? parsed.deviations.map((item: Record<string, unknown>) => ({
                        intentComponent: String(item.intentComponent ?? ''),
                        codeElements: Array.isArray(item.codeElements) ? item.codeElements.map(String) : [],
                        category: String(item.category ?? 'other'),
                        severity: item.severity === 'low'
                            ? 'low'
                            : item.severity === 'medium'
                                ? 'medium'
                                : 'high',
                        description: String(item.description ?? ''),
                        impact: String(item.impact ?? ''),
                        recommendation: String(item.recommendation ?? ''),
                    }))
                    : [],
                recommendations: Array.isArray(parsed.recommendations)
                    ? parsed.recommendations.map(String)
                    : [],
                generatedAt: new Date(),
            };
        } catch {
            return {
                summary: `Failed to parse drift analysis response: ${raw.slice(0, 500)}`,
                overallStatus: 'major-drift',
                driftScore: 1,
                deviations: [],
                recommendations: [],
                generatedAt: new Date(),
            };
        }
    }
}

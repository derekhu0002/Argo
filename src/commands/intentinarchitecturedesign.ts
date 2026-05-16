import * as vscode from 'vscode';
import { buildIntentInArchitectureDesignHandoffPrompt } from '../utils/agentHandoff';
import { setExplicitTestcaseEntryGuardStage } from '../utils/explicitTestcaseEntryGuard';

export async function handleIntentInArchitectureDesign(
    _request: vscode.ChatRequest,
    _context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    _token: vscode.CancellationToken,
): Promise<void> {
    stream.markdown('## /intentinarchitecturedesign - Intent In Architecture Design Handoff\n\n');

    await setExplicitTestcaseEntryGuardStage('intentiondesign');
    stream.markdown('```text\n' + buildIntentInArchitectureDesignHandoffPrompt() + '\n```\n');
}
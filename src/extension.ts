import * as vscode from 'vscode';
import { handleIntentGraphExplorer } from './commands';
import { registerArchitectureTestTool } from './tools/architectureTestTool';
import { registerExplicitTestcaseEntryGuard } from './utils/explicitTestcaseEntryGuard';
import { argoWorkRequestHandler } from './workParticipant';

const WORK_PARTICIPANT_ID = 'argo.worker';
const OPEN_INTENT_GRAPH_EXPLORER_COMMAND = 'argo.openIntentGraphExplorer';

export async function activate(extensionContext: vscode.ExtensionContext): Promise<void> {
    registerExplicitTestcaseEntryGuard(extensionContext);

    registerCopilotFeatures(extensionContext);
}

export function deactivate(): void {
    // Cleanup handled by disposables registered in extensionContext.subscriptions.
}

function registerCopilotFeatures(extensionContext: vscode.ExtensionContext): void {
    extensionContext.subscriptions.push(
        vscode.commands.registerCommand(
            OPEN_INTENT_GRAPH_EXPLORER_COMMAND,
            async request => handleIntentGraphExplorer(request),
        ),
    );

    if (typeof vscode.chat?.createChatParticipant === 'function') {
        const workParticipant = vscode.chat.createChatParticipant(
            WORK_PARTICIPANT_ID,
            argoWorkRequestHandler,
        );

        workParticipant.iconPath = new vscode.ThemeIcon('tools');

        extensionContext.subscriptions.push(workParticipant);
    }

    if (typeof vscode.lm?.registerTool === 'function') {
        registerArchitectureTestTool(extensionContext);
    }
}

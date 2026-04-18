import * as vscode from 'vscode';
import { argoRequestHandler } from './participant';
import { registerArchitectureTestTool } from './tools/architectureTestTool';
import { ensureWorkspaceEaTemplates } from './utils/workspaceBootstrap';
import { argoWorkRequestHandler } from './workParticipant';

const PARTICIPANT_ID = 'argo.architect';
const WORK_PARTICIPANT_ID = 'argo.worker';

export function activate(extensionContext: vscode.ExtensionContext): void {
    const participant = vscode.chat.createChatParticipant(
        PARTICIPANT_ID,
        argoRequestHandler,
    );

    const workParticipant = vscode.chat.createChatParticipant(
        WORK_PARTICIPANT_ID,
        argoWorkRequestHandler,
    );

    participant.iconPath = new vscode.ThemeIcon('compass');
    workParticipant.iconPath = new vscode.ThemeIcon('tools');

    registerArchitectureTestTool(extensionContext);
    void ensureWorkspaceEaTemplates(extensionContext.extensionUri);

    extensionContext.subscriptions.push(participant);
    extensionContext.subscriptions.push(workParticipant);
}

export function deactivate(): void {
    // Cleanup handled by disposables registered in extensionContext.subscriptions.
}

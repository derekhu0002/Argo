import * as vscode from 'vscode';
import { argoRequestHandler } from './participant';

const PARTICIPANT_ID = 'argo.architect';

export function activate(extensionContext: vscode.ExtensionContext): void {
    const participant = vscode.chat.createChatParticipant(
        PARTICIPANT_ID,
        argoRequestHandler,
    );

    participant.iconPath = new vscode.ThemeIcon('compass');

    extensionContext.subscriptions.push(participant);
}

export function deactivate(): void {
    // Cleanup handled by disposables registered in extensionContext.subscriptions.
}

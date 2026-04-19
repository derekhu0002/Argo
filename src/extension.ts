import * as vscode from 'vscode';
import { argoRequestHandler } from './participant';
import { registerArchitectureTestTool } from './tools/architectureTestTool';
import { ensureWorkspaceEaTemplates, ensureWorkspaceEaTemplatesForFolders } from './utils/workspaceBootstrap';
import { argoWorkRequestHandler } from './workParticipant';

const PARTICIPANT_ID = 'argo.architect';
const WORK_PARTICIPANT_ID = 'argo.worker';
const STARTUP_BOOTSTRAP_RETRY_DELAYS_MS = [250, 1000, 3000] as const;

export async function activate(extensionContext: vscode.ExtensionContext): Promise<void> {
    await ensureWorkspaceEaTemplates(extensionContext.extensionUri);
    scheduleStartupWorkspaceBootstrapRetries(extensionContext, extensionContext.extensionUri);

    registerCopilotFeatures(extensionContext);

    extensionContext.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(event => {
        if (event.added.length === 0) {
            return;
        }
        void ensureWorkspaceEaTemplatesForFolders(event.added, extensionContext.extensionUri);
    }));
}

export function deactivate(): void {
    // Cleanup handled by disposables registered in extensionContext.subscriptions.
}

function scheduleStartupWorkspaceBootstrapRetries(
    extensionContext: vscode.ExtensionContext,
    extensionUri: vscode.Uri,
): void {
    for (const delayMs of STARTUP_BOOTSTRAP_RETRY_DELAYS_MS) {
        const handle = setTimeout(() => {
            void ensureWorkspaceEaTemplates(extensionUri);
        }, delayMs);

        extensionContext.subscriptions.push({
            dispose: () => clearTimeout(handle),
        });
    }
}

function registerCopilotFeatures(extensionContext: vscode.ExtensionContext): void {
    if (typeof vscode.chat?.createChatParticipant === 'function') {
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

        extensionContext.subscriptions.push(participant, workParticipant);
    }

    if (typeof vscode.lm?.registerTool === 'function') {
        registerArchitectureTestTool(extensionContext);
    }
}

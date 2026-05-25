import * as path from 'node:path';
import * as vscode from 'vscode';
import {
    openIntentGraphExplorer,
    type IntentGraphExplorerSnapshot,
    type OpenIntentGraphExplorerRequest,
} from '../visualIntentGraphEditor';

export async function handleIntentGraphExplorer(
    request?: Partial<OpenIntentGraphExplorerRequest>,
): Promise<IntentGraphExplorerSnapshot> {
    return openIntentGraphExplorer(resolveIntentGraphExplorerRequest(request));
}

function resolveIntentGraphExplorerRequest(
    request?: Partial<OpenIntentGraphExplorerRequest>,
): OpenIntentGraphExplorerRequest {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const graphPath = request?.graphPath ?? (workspaceRoot
        ? path.join(workspaceRoot, 'design', 'KG', 'SystemArchitecture.json')
        : undefined);

    if (!graphPath) {
        throw new Error('Intent Graph Explorer requires an open workspace or an explicit graphPath.');
    }

    return {
        graphPath,
        action: request?.action ?? 'open',
        targetViewId: request?.targetViewId,
        query: request?.query,
        mode: request?.mode ?? 'interactive',
        testcase: request?.testcase,
    };
}

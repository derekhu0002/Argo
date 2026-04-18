import * as vscode from 'vscode';
import { handleWork } from './commands';

export async function argoWorkRequestHandler(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
): Promise<vscode.ChatResult> {
    if (request.command === 'work') {
        await handleWork(request, context, stream, token);
        return {};
    }

    stream.markdown(
        '**Argo Work Agent**\n\n' +
        'Use `/work` to execute all acceptance tests linked from `design/KG/SystemArchitecture.json`, persist failed testcase records, and prepare a handoff prompt for the Copilot main agent.\n',
    );
    return {};
}
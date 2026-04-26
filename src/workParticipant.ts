import * as vscode from 'vscode';
import { handleBrief, handleWork } from './commands';

export async function argoWorkRequestHandler(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
): Promise<vscode.ChatResult> {
    if (request.command === 'brief') {
        await handleBrief(request, context, stream, token);
        return {};
    }

    if (request.command === 'work') {
        await handleWork(request, context, stream, token);
        return {};
    }

    stream.markdown(
        '**Argo Work Agent**\n\n' +
        'Use `/work` to execute all acceptance tests linked from `design/KG/SystemArchitecture.json`, persist failed testcase records, and prepare a handoff prompt for the Copilot main agent.\n\n' +
        'Use `/brief` to prepare a handoff prompt for the Copilot main agent so it can produce an external-facing product brief based on the current repository.\n',
    );
    return {};
}
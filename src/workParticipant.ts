import * as vscode from 'vscode';
import { handleBrief, handleTestDesign, handleWork } from './commands';

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

    if (request.command === 'testdesign') {
        await handleTestDesign(request, context, stream, token);
        return {};
    }

    if (request.command === 'work') {
        await handleWork(request, context, stream, token);
        return {};
    }

    stream.markdown(
        '**Argo Work Agent**\n\n' +
        'Use `/work` to execute all acceptance tests linked from `design/KG/SystemArchitecture.json`, persist failed testcase records, and prepare a handoff prompt for the Copilot main agent.\n\n' +
        'Use `/brief` to prepare a handoff prompt for the Copilot main agent so it can produce an external-facing product brief based on the current repository.\n\n' +
        'Use `/testdesign` to prepare a handoff prompt for the Copilot main agent so it can design or adjust the right mix of unit, system, integration, scenario, acceptance, and inspection tests for the current requirement or issue.\n',
    );
    return {};
}
import * as vscode from 'vscode';
import { handleBrief, handleImplementationDesign, handleIntentInArchitectureDesign, handleWork } from './commands';

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

    if (request.command === 'implementationdesign') {
        await handleImplementationDesign(request, context, stream, token);
        return {};
    }

    if (request.command === 'intentinarchitecturedesign') {
        await handleIntentInArchitectureDesign(request, context, stream, token);
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
        'Use `/intentinarchitecturedesign` to prepare a handoff prompt for the Copilot main agent so it can grill the design relentlessly, explore the codebase when possible, and provide recommended answers for each design question.\n\n' +
        'Use `/implementationdesign` to prepare a handoff prompt for the Copilot main agent so it can design a UML-style implementation architecture from the full intent architecture, involve the user in key architectural decisions, and emit `design/KG/ImplementationArchitecture.json` with embedded non-explicit testcases.\n',
    );
    return {};
}
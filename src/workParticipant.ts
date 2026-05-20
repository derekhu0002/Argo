import * as vscode from 'vscode';
import { handleArgoInit, handleIdle, handleImplementationDesign, handleIntentInArchitectureDesign, handleTest, handleWork } from './commands';

export async function argoWorkRequestHandler(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
): Promise<vscode.ChatResult> {

    if (request.command === 'implementationdesign') {
        await handleImplementationDesign(request, context, stream, token);
        return {};
    }

    if (request.command === 'argo-init') {
        await handleArgoInit(request, context, stream, token);
        return {};
    }

    if (request.command === 'idle') {
        await handleIdle(request, context, stream, token);
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

    if (request.command === 'test') {
        await handleTest(request, context, stream, token);
        return {};
    }

    stream.markdown(
        '**Argo Work Agent**\n\n' +
        'Use `/argo-init` to copy the same workspace bootstrap assets that Argo normally copies during extension startup.\n\n' +
        'Use `/test` to execute explicit testcase entries from `design/KG/SystemArchitecture.json` and refresh `design/KG/test-failure-records.json`.\n\n' +
        'Use `/work` to prepare a coding-stage handoff prompt for the Copilot main agent so it can repair the issues already recorded in `design/KG/test-failure-records.json`.\n\n' +
        'Use `/idle` to reset the internal guard stage back to idle when you want to leave coding or implementation-design mode.\n\n' +
        'Use `/intentinarchitecturedesign` to prepare a handoff prompt for the Copilot main agent so it can grill the design relentlessly, explore the codebase when possible, and provide recommended answers for each design question.\n\n' +
        'Use `/implementationdesign` to prepare a handoff prompt for the Copilot main agent so it can design a UML-style implementation architecture from the full intent architecture, involve the user in key architectural decisions, materialize read-only explicit testcase entry ownership, and emit `design/KG/ImplementationArchitecture.json` with embedded non-explicit testcases.\n',
    );
    return {};
}
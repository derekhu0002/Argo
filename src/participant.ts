import * as vscode from 'vscode';
import { handleInit, handleEvolve, handleBaseline, handleLink } from './commands';

/**
 * Central request handler for the `@argo` chat participant.
 *
 * Routes incoming requests to the correct slash-command handler
 * based on `request.command`, or falls back to a general-purpose
 * architectural assistant response.
 */
export async function argoRequestHandler(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
): Promise<vscode.ChatResult> {
    const command = request.command;

    switch (command) {
        case 'init':
            await handleInit(request, context, stream, token);
            break;

        case 'evolve':
            await handleEvolve(request, context, stream, token);
            break;

        case 'baseline':
            await handleBaseline(request, context, stream, token);
            break;

        case 'link':
            await handleLink(request, context, stream, token);
            break;

        default:
            await handleDefaultPrompt(request, context, stream, token);
            break;
    }

    return {};
}

/**
 * Fallback handler when no slash command is given.
 * Acts as a general-purpose architectural advisor.
 */
async function handleDefaultPrompt(
    request: vscode.ChatRequest,
    _context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    _token: vscode.CancellationToken,
): Promise<void> {
    stream.markdown(
        '**Argo — Agentic Workflow Orchestrator**\n\n' +
        'I am your Chief Architecture Referee. ' +
        'I enforce closed-loop consistency between your ArchiMate intent and real code.\n\n' +
        '### Available Commands\n\n' +
        '| Command | Purpose |\n' +
        '|---------|--------|\n' +
        '| `/init` | Generate code from ArchiMate intent and validate architecture stitching |\n' +
        '| `/evolve` | Evolve existing architecture with anti-corruption checks |\n' +
        '| `/baseline` | Reverse-engineer legacy code into semantic UML (X-ray) |\n' +
        '| `/link` | Build a traceability matrix between intent and code |\n\n',
    );

    if (request.prompt.trim()) {
        stream.markdown(
            `You said: *"${request.prompt}"*\n\n` +
            'Please use one of the slash commands above to start a workflow, ' +
            'or ask me an architecture-related question.\n',
        );
    }
}

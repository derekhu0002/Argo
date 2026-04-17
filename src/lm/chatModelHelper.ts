import * as vscode from 'vscode';

/** Vendor / family selector for `vscode.lm.selectChatModels`. */
const MODEL_SELECTOR: vscode.LanguageModelChatSelector = {
    vendor: 'copilot',
    family: 'gpt-4o',
};

/**
 * Acquire a Copilot language model handle.
 * Falls back to any available model if the preferred family is unavailable.
 */
export async function acquireModel(): Promise<vscode.LanguageModelChat> {
    let models = await vscode.lm.selectChatModels(MODEL_SELECTOR);
    if (models.length === 0) {
        // Fallback: any copilot model
        models = await vscode.lm.selectChatModels({ vendor: 'copilot' });
    }
    if (models.length === 0) {
        throw new Error(
            'No language model available. Make sure GitHub Copilot Chat is installed and signed in.',
        );
    }
    return models[0];
}

/**
 * Send a single user-prompt to the LLM and return the full text response.
 *
 * @param systemPrompt  Instructions for the model (system role).
 * @param userPrompt    The concrete request (user role).
 * @param token         Cancellation token.
 * @param maxTokens     Max response tokens (default 4096).
 */
export async function sendLlmRequest(
    systemPrompt: string,
    userPrompt: string,
    token: vscode.CancellationToken,
    maxTokens: number = 4096,
): Promise<string> {
    const model = await acquireModel();
    const messages = [
        vscode.LanguageModelChatMessage.User(systemPrompt),
        vscode.LanguageModelChatMessage.User(userPrompt),
    ];
    const response = await model.sendRequest(messages, { modelOptions: { max_tokens: maxTokens } }, token);
    const chunks: string[] = [];
    for await (const chunk of response.text) {
        chunks.push(chunk);
    }
    return chunks.join('');
}

/**
 * Send a prompt and stream partial tokens into a ChatResponseStream
 * while also accumulating the full result string.
 */
export async function sendLlmRequestStreaming(
    systemPrompt: string,
    userPrompt: string,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
    maxTokens: number = 4096,
): Promise<string> {
    const model = await acquireModel();
    const messages = [
        vscode.LanguageModelChatMessage.User(systemPrompt),
        vscode.LanguageModelChatMessage.User(userPrompt),
    ];
    const response = await model.sendRequest(messages, { modelOptions: { max_tokens: maxTokens } }, token);
    const chunks: string[] = [];
    for await (const chunk of response.text) {
        stream.markdown(chunk);
        chunks.push(chunk);
    }
    return chunks.join('');
}

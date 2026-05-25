import {
    openIntentGraphExplorer,
    type IntentGraphExplorerSnapshot,
    type OpenIntentGraphExplorerRequest,
} from '../visualIntentGraphEditor';

export async function handleIntentGraphExplorer(
    request: OpenIntentGraphExplorerRequest,
): Promise<IntentGraphExplorerSnapshot> {
    return openIntentGraphExplorer(request);
}

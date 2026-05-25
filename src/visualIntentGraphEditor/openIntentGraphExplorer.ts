export type IntentGraphExplorerAction = 'open' | 'expand-path' | 'search';
export type IntentGraphExplorerMode = 'interactive' | 'test';

export interface OpenIntentGraphExplorerRequest {
    graphPath: string;
    action?: IntentGraphExplorerAction;
    targetViewId?: string;
    query?: string;
    mode?: IntentGraphExplorerMode;
    testcase?: string;
}

export interface IntentGraphVisibleView {
    viewId: string;
    viewName: string;
    depth: number;
    parentViewId?: string;
}

export interface IntentGraphExplorerSnapshot {
    graphPath: string;
    rootViewId?: string;
    visibleViews: IntentGraphVisibleView[];
    matchedViewIds?: string[];
}

export async function openIntentGraphExplorer(
    request: OpenIntentGraphExplorerRequest,
): Promise<IntentGraphExplorerSnapshot> {
    throw new Error(
        `Intent Graph Visual Explorer is not implemented yet for ${request.graphPath}. Coding/Repair must register argo.openIntentGraphExplorer and return the frozen test-mode snapshot shape.`,
    );
}

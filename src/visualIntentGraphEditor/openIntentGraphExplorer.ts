import * as vscode from 'vscode';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export type IntentGraphExplorerAction = 'open' | 'expand-path' | 'search';
export type IntentGraphExplorerMode = 'interactive' | 'test';

const INTENT_GRAPH_EXPLORER_PANEL_TYPE = 'argo.intentGraphExplorer';
const INTENT_GRAPH_VIEW_DETAIL_PANEL_TYPE = 'argo.intentGraphViewDetail';

type ExplorerWebviewMessage =
    | { type: 'expand'; targetViewId: string }
    | { type: 'open-view-detail'; viewId: string }
    | { type: 'search'; query: string }
    | { type: 'reset' };

type DetailWebviewMessage =
    | { type: 'reveal-in-explorer'; viewId: string };

interface InteractiveExplorerState {
    panel: vscode.WebviewPanel;
    request: OpenIntentGraphExplorerRequest;
}

interface SystemArchitectureElement {
    id: string;
    name: string;
    subdiagram_views?: Array<{
        view_id: string;
        view_name: string;
    }>;
}

interface SystemArchitectureView {
    view_id: string;
    view_name: string;
    parent_element_id?: string;
    included_elements: string[];
    included_relationships?: string[];
}

interface SystemArchitectureRelationship {
    id: string;
    name?: string;
    statement?: string;
    source_id: string;
    target_id: string;
    source_name?: string;
    target_name?: string;
}

interface SystemArchitectureGraph {
    elements?: SystemArchitectureElement[];
    relationships?: SystemArchitectureRelationship[];
    views?: SystemArchitectureView[];
}

interface IntentGraphViewDetailPayload {
    view: Pick<SystemArchitectureView, 'view_id' | 'view_name'>;
    elements: Array<Pick<SystemArchitectureElement, 'id' | 'name'>>;
    relationships: SystemArchitectureRelationship[];
}

interface IntentGraphExplorerElementPayload {
    id: string;
    name: string;
    note: string;
    mountedChildren: IntentGraphExplorerViewPayload[];
}

interface IntentGraphExplorerViewPayload {
    viewId: string;
    viewName: string;
    depth: number;
    parentViewId?: string;
    parentText: string;
    isRoot: boolean;
    isMatched: boolean;
    hasVisibleChildren: boolean;
    elements: IntentGraphExplorerElementPayload[];
}

interface IntentGraphExplorerWebviewPayload {
    graphPath: string;
    rootViewId?: string;
    visibleViewCount: number;
    matchedViewIds: string[];
    currentQuery: string;
    focusedViewId?: string;
    tree?: IntentGraphExplorerViewPayload;
}

interface ExplorerIndexes {
    elementsById: Map<string, SystemArchitectureElement>;
    viewsById: Map<string, SystemArchitectureView>;
    childEdgesByParentId: Map<string, IntentGraphVisibleView[]>;
    parentEdgesByChildId: Map<string, string[]>;
}

export interface OpenIntentGraphExplorerRequest {
    graphPath: string;
    action?: IntentGraphExplorerAction;
    targetViewId?: string;
    query?: string;
    focusViewId?: string;
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

let interactiveExplorerState: InteractiveExplorerState | undefined;

export async function openIntentGraphExplorer(
    request: OpenIntentGraphExplorerRequest,
): Promise<IntentGraphExplorerSnapshot> {
    const normalizedRequest = {
        ...request,
        action: request.action ?? 'open',
        mode: request.mode ?? 'interactive',
    };
    const snapshot = await buildIntentGraphExplorerSnapshot(normalizedRequest);

    if (normalizedRequest.mode !== 'test') {
        await renderInteractiveExplorer(normalizedRequest, snapshot);
    }

    return snapshot;
}

async function buildIntentGraphExplorerSnapshot(
    request: OpenIntentGraphExplorerRequest,
): Promise<IntentGraphExplorerSnapshot> {
    const graph = await readGraph(request.graphPath);
    const rootView = resolveStructuralRootView(graph);
    const indexes = createIndexes(graph);
    const topLevelViews = indexes.childEdgesByParentId.get(rootView.view_id) ?? [];
    const action = request.action ?? 'open';

    switch (action) {
        case 'open':
            return {
                graphPath: request.graphPath,
                rootViewId: rootView.view_id,
                visibleViews: sortVisibleViews(topLevelViews),
            };
        case 'expand-path':
            return {
                graphPath: request.graphPath,
                rootViewId: rootView.view_id,
                visibleViews: sortVisibleViews(resolveExpandedVisibleViews(request.targetViewId, rootView.view_id, topLevelViews, indexes)),
            };
        case 'search':
            return resolveSearchSnapshot(request, rootView.view_id, topLevelViews, indexes);
        default:
            throw new Error(`Unsupported explorer action: ${action}`);
    }
}

async function renderInteractiveExplorer(
    request: OpenIntentGraphExplorerRequest,
    snapshot: IntentGraphExplorerSnapshot,
): Promise<void> {
    const panel = getOrCreateInteractiveExplorerPanel();
    interactiveExplorerState = {
        panel,
        request,
    };

    panel.title = 'Intent Graph Explorer';
    panel.webview.html = await buildInteractiveExplorerHtml(panel.webview, request, snapshot);
    panel.reveal(vscode.ViewColumn.Active, false);
}

function getOrCreateInteractiveExplorerPanel(): vscode.WebviewPanel {
    if (interactiveExplorerState) {
        return interactiveExplorerState.panel;
    }

    const panel = vscode.window.createWebviewPanel(
        INTENT_GRAPH_EXPLORER_PANEL_TYPE,
        'Intent Graph Explorer',
        vscode.ViewColumn.Active,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [vscode.Uri.file(__dirname)],
        },
    );

    panel.onDidDispose(() => {
        if (interactiveExplorerState?.panel === panel) {
            interactiveExplorerState = undefined;
        }
    });

    panel.webview.onDidReceiveMessage(message => {
        void handleInteractiveExplorerMessage(message as ExplorerWebviewMessage);
    });

    return panel;
}

async function handleInteractiveExplorerMessage(message: ExplorerWebviewMessage): Promise<void> {
    if (!interactiveExplorerState) {
        return;
    }

    try {
        if (message.type === 'open-view-detail') {
            await openIntentGraphViewDetail(interactiveExplorerState.request.graphPath, message.viewId);
            return;
        }

        const nextRequest = resolveInteractiveExplorerRequest(interactiveExplorerState.request, message);
        await openIntentGraphExplorer(nextRequest);
    } catch (error) {
        const readableError = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(`Intent Graph Explorer: ${readableError}`);
    }
}

function resolveInteractiveExplorerRequest(
    currentRequest: OpenIntentGraphExplorerRequest,
    message: ExplorerWebviewMessage,
): OpenIntentGraphExplorerRequest {
    switch (message.type) {
        case 'expand':
            return {
                graphPath: currentRequest.graphPath,
                action: 'expand-path',
                targetViewId: message.targetViewId,
                mode: 'interactive',
            };
        case 'search': {
            const query = message.query.trim();
            if (!query) {
                return {
                    graphPath: currentRequest.graphPath,
                    action: 'open',
                    mode: 'interactive',
                };
            }

            return {
                graphPath: currentRequest.graphPath,
                action: 'search',
                query,
                mode: 'interactive',
            };
        }
        case 'reset':
            return {
                graphPath: currentRequest.graphPath,
                action: 'open',
                mode: 'interactive',
            };
        default:
            return currentRequest;
    }
}

async function buildInteractiveExplorerHtml(
    webview: vscode.Webview,
    request: OpenIntentGraphExplorerRequest,
    snapshot: IntentGraphExplorerSnapshot,
): Promise<string> {
    const graph = await readGraph(request.graphPath);
    const indexes = createIndexes(graph);
    const nonce = getNonce();
    const payload = buildInteractiveExplorerPayload(request, snapshot, graph, indexes);
    const scriptUri = webview.asWebviewUri(vscode.Uri.file(join(__dirname, 'explorerWebviewApp.js')));
    const styleUri = webview.asWebviewUri(vscode.Uri.file(join(__dirname, 'explorerWebviewApp.css')));

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' ${webview.cspSource}; font-src ${webview.cspSource};" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Intent Graph Explorer</title>
    <link rel="stylesheet" href="${styleUri}" />
</head>
<body>
    <div id="argo-intent-graph-explorer-root"></div>
    <script nonce="${nonce}">window.__ARGO_INTENT_GRAPH_EXPLORER__ = ${serializeForInlineScript(payload)};</script>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

function buildInteractiveExplorerPayload(
    request: OpenIntentGraphExplorerRequest,
    snapshot: IntentGraphExplorerSnapshot,
    graph: SystemArchitectureGraph,
    indexes: ExplorerIndexes,
): IntentGraphExplorerWebviewPayload {
    const rootView = snapshot.rootViewId ? indexes.viewsById.get(snapshot.rootViewId) : undefined;
    if (!rootView) {
        return {
            graphPath: snapshot.graphPath,
            rootViewId: snapshot.rootViewId,
            visibleViewCount: snapshot.visibleViews.length,
            matchedViewIds: snapshot.matchedViewIds ?? [],
            currentQuery: request.action === 'search' ? request.query ?? '' : '',
        };
    }

    const visibleViewsByParentId = new Map<string, IntentGraphVisibleView[]>();
    for (const visibleView of snapshot.visibleViews) {
        const parentId = visibleView.parentViewId ?? '';
        const current = visibleViewsByParentId.get(parentId) ?? [];
        current.push(visibleView);
        visibleViewsByParentId.set(parentId, current);
    }

    return {
        graphPath: snapshot.graphPath,
        rootViewId: snapshot.rootViewId,
        visibleViewCount: snapshot.visibleViews.length,
        matchedViewIds: snapshot.matchedViewIds ?? [],
        currentQuery: request.action === 'search' ? request.query ?? '' : '',
        focusedViewId: request.focusViewId,
        tree: buildExplorerViewPayload(rootView.view_id, undefined, 0, graph, snapshot, indexes, visibleViewsByParentId),
    };
}

function buildExplorerViewPayload(
    viewId: string,
    parentViewId: string | undefined,
    depth: number,
    graph: SystemArchitectureGraph,
    snapshot: IntentGraphExplorerSnapshot,
    indexes: ExplorerIndexes,
    visibleViewsByParentId: Map<string, IntentGraphVisibleView[]>,
): IntentGraphExplorerViewPayload {
    const view = indexes.viewsById.get(viewId);
    if (!view) {
        throw new Error(`View ${viewId} could not be resolved for the explorer payload.`);
    }

    const isRoot = viewId === snapshot.rootViewId;
    const visibleChildren = visibleViewsByParentId.get(viewId) ?? [];
    const childIds = new Set(visibleChildren.map(child => child.viewId));
    const elements = (view.included_elements ?? [])
        .map(elementId => indexes.elementsById.get(elementId))
        .filter((element): element is SystemArchitectureElement => Boolean(element))
        .map(element => {
            const mountedChildren = (element.subdiagram_views ?? [])
                .filter(subdiagram => childIds.has(subdiagram.view_id))
                .map(subdiagram => {
                    const visibleChild = visibleChildren.find(candidate => candidate.viewId === subdiagram.view_id);
                    return visibleChild
                        ? buildExplorerViewPayload(subdiagram.view_id, view.view_id, depth + 1, graph, snapshot, indexes, visibleViewsByParentId)
                        : undefined;
                })
                .filter((child): child is IntentGraphExplorerViewPayload => Boolean(child));

            return {
                id: element.id,
                name: element.name,
                note: element.subdiagram_views?.length
                    ? `${element.subdiagram_views.length} subview${element.subdiagram_views.length > 1 ? 's' : ''}`
                    : 'no subview',
                mountedChildren,
            };
        });

    return {
        viewId: view.view_id,
        viewName: view.view_name,
        depth,
        parentViewId,
        parentText: isRoot ? 'structural root' : `parent ${parentViewId ?? '(none)'}`,
        isRoot,
        isMatched: snapshot.matchedViewIds?.includes(viewId) ?? false,
        hasVisibleChildren: visibleChildren.length > 0,
        elements,
    };
}

function renderGraph(
    snapshot: IntentGraphExplorerSnapshot,
    graph: SystemArchitectureGraph,
    indexes: ExplorerIndexes,
): string {
    if (snapshot.visibleViews.length === 0) {
        return '<div class="empty">No visible views were derived from the current request.</div>';
    }

    const rootView = snapshot.rootViewId ? indexes.viewsById.get(snapshot.rootViewId) : undefined;
    if (!rootView) {
        return '<div class="empty">The structural root view could not be resolved for rendering.</div>';
    }

    const visibleViewsByParentId = new Map<string, IntentGraphVisibleView[]>();
    for (const visibleView of snapshot.visibleViews) {
        const parentId = visibleView.parentViewId ?? '';
        const current = visibleViewsByParentId.get(parentId) ?? [];
        current.push(visibleView);
        visibleViewsByParentId.set(parentId, current);
    }

    return `<div class="graph-stage">${renderViewBranch(rootView.view_id, undefined, 0, graph, snapshot, indexes, visibleViewsByParentId)}</div>`;
}

function renderViewBranch(
    viewId: string,
    parentViewId: string | undefined,
    depth: number,
    graph: SystemArchitectureGraph,
    snapshot: IntentGraphExplorerSnapshot,
    indexes: ExplorerIndexes,
    visibleViewsByParentId: Map<string, IntentGraphVisibleView[]>,
): string {
    const view = indexes.viewsById.get(viewId);
    if (!view) {
        return '';
    }

    const isRoot = viewId === snapshot.rootViewId;
    const isMatched = snapshot.matchedViewIds?.includes(viewId) ?? false;
    const visibleChildren = visibleViewsByParentId.get(viewId) ?? [];
    const viewClasses = ['view-box'];
    if (isRoot) {
        viewClasses.push('root');
    }
    if (isMatched) {
        viewClasses.push('highlight');
    }

    return `<div class="view-branch" data-role="view-branch" data-view-id="${escapeHtml(view.view_id)}">
    ${renderViewBox(view, parentViewId, depth, visibleChildren.length > 0, viewClasses.join(' '), isRoot)}
    ${renderElementLane(view, graph, snapshot, indexes, visibleViewsByParentId, visibleChildren, depth + 1)}
</div>`;
}

function renderViewBox(
    view: SystemArchitectureView,
    parentViewId: string | undefined,
    depth: number,
    hasVisibleChildren: boolean,
    classes: string,
    isRoot: boolean,
): string {
    const parentText = isRoot ? 'structural root' : `parent ${parentViewId ?? '(none)'}`;
    const actionButton = !isRoot
        ? `<div class="view-actions"><button type="button" data-target-view-id="${escapeHtml(view.view_id)}">Expand this view</button></div>`
        : '';

    return `<div class="${classes}" data-role="view-box" data-view-id="${escapeHtml(view.view_id)}" data-open-view-id="${escapeHtml(view.view_id)}">
    <div class="view-title">View: ${escapeHtml(view.view_name)}</div>
    <div class="view-meta">${escapeHtml(view.view_id)} · depth ${depth} · ${escapeHtml(parentText)} · ${hasVisibleChildren ? 'visible children' : 'leaf in current snapshot'}</div>
    ${actionButton}
</div>`;
}

async function openIntentGraphViewDetail(graphPath: string, viewId: string): Promise<void> {
    const graph = await readGraph(graphPath);
    const indexes = createIndexes(graph);
    const view = indexes.viewsById.get(viewId);
    if (!view) {
        throw new Error(`View ${viewId} is missing from the graph.`);
    }

    const relationshipsById = new Map((graph.relationships ?? []).map(relationship => [relationship.id, relationship]));
    const viewElements = (view.included_elements ?? [])
        .map(elementId => indexes.elementsById.get(elementId))
        .filter((element): element is SystemArchitectureElement => Boolean(element));
    const includedElementIds = new Set(viewElements.map(element => element.id));
    const explicitRelationships = (view.included_relationships ?? [])
        .map(relationshipId => relationshipsById.get(relationshipId))
        .filter((relationship): relationship is SystemArchitectureRelationship => Boolean(relationship));
    const inferredRelationships = explicitRelationships.length > 0
        ? explicitRelationships
        : (graph.relationships ?? []).filter(relationship => includedElementIds.has(relationship.source_id) && includedElementIds.has(relationship.target_id));

    const panel = vscode.window.createWebviewPanel(
        INTENT_GRAPH_VIEW_DETAIL_PANEL_TYPE,
        `Intent Graph View: ${view.view_name}`,
        vscode.ViewColumn.Beside,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [vscode.Uri.file(__dirname)],
        },
    );

    panel.webview.onDidReceiveMessage(message => {
        void handleDetailWebviewMessage(graphPath, message as DetailWebviewMessage);
    });

    panel.webview.html = buildViewDetailHtml(panel.webview, {
        view: {
            view_id: view.view_id,
            view_name: view.view_name,
        },
        elements: viewElements.map(element => ({
            id: element.id,
            name: element.name,
        })),
        relationships: inferredRelationships,
    });
    panel.reveal(vscode.ViewColumn.Beside, false);
}

async function handleDetailWebviewMessage(
    graphPath: string,
    message: DetailWebviewMessage,
): Promise<void> {
    try {
        if (message.type === 'reveal-in-explorer') {
            await openIntentGraphExplorer({
                graphPath,
                action: 'expand-path',
                targetViewId: message.viewId,
                focusViewId: message.viewId,
                mode: 'interactive',
            });
        }
    } catch (error) {
        const readableError = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(`Intent Graph View Detail: ${readableError}`);
    }
}

function buildViewDetailHtml(
    webview: vscode.Webview,
    payload: IntentGraphViewDetailPayload,
): string {
    const nonce = getNonce();
    const scriptUri = webview.asWebviewUri(vscode.Uri.file(join(__dirname, 'detailWebviewApp.js')));
    const styleUri = webview.asWebviewUri(vscode.Uri.file(join(__dirname, 'detailWebviewApp.css')));

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' ${webview.cspSource}; font-src ${webview.cspSource};" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Intent Graph View Detail</title>
    <link rel="stylesheet" href="${styleUri}" />
</head>
<body>
    <div id="argo-intent-graph-detail-root"></div>
    <script nonce="${nonce}">window.__ARGO_INTENT_GRAPH_VIEW_DETAIL__ = ${serializeForInlineScript(payload)};</script>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

function renderElementLane(
    view: SystemArchitectureView,
    graph: SystemArchitectureGraph,
    snapshot: IntentGraphExplorerSnapshot,
    indexes: ExplorerIndexes,
    visibleViewsByParentId: Map<string, IntentGraphVisibleView[]>,
    visibleChildren: IntentGraphVisibleView[],
    depth: number,
): string {
    const elements = (view.included_elements ?? [])
        .map(elementId => indexes.elementsById.get(elementId))
        .filter((element): element is SystemArchitectureElement => Boolean(element));

    if (elements.length === 0) {
        return '<div class="empty-element">This view has no included elements.</div>';
    }

    const childIds = new Set(visibleChildren.map(child => child.viewId));

    const elementColumns = elements.map(element => {
        const mountedChildren = (element.subdiagram_views ?? [])
            .filter(subdiagram => childIds.has(subdiagram.view_id))
            .map(subdiagram => {
                const visibleChild = visibleChildren.find(candidate => candidate.viewId === subdiagram.view_id);
                return visibleChild
                    ? renderViewBranch(subdiagram.view_id, view.view_id, depth, graph, snapshot, indexes, visibleViewsByParentId)
                    : '';
            })
            .filter(Boolean);

        const note = element.subdiagram_views?.length
            ? `${element.subdiagram_views.length} subview${element.subdiagram_views.length > 1 ? 's' : ''}`
            : 'no subview';

        return `<div class="element-column" data-role="element-column" data-element-id="${escapeHtml(element.id)}">
    <div class="element-node" data-role="element-node" data-element-id="${escapeHtml(element.id)}">${escapeHtml(element.name)}</div>
    <div class="element-note">${escapeHtml(note)}</div>
    ${mountedChildren.length > 0 ? `<div class="child-row" data-role="child-row">${mountedChildren.map(child => `<div class="child-anchor" data-role="child-anchor">${child}</div>`).join('')}</div>` : '<div class="empty-element">No currently visible child views</div>'}
</div>`;
    }).join('');

    return `<div class="element-lane-shell" data-role="element-lane-shell"><div class="element-lane" data-role="element-lane">${elementColumns}</div></div>`;
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function serializeForInlineScript(value: unknown): string {
    return JSON.stringify(value)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026');
}

function getNonce(): string {
    return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

async function readGraph(graphPath: string): Promise<SystemArchitectureGraph> {
    const raw = await readFile(graphPath, 'utf8');
    return JSON.parse(raw) as SystemArchitectureGraph;
}

function createIndexes(graph: SystemArchitectureGraph): ExplorerIndexes {
    const elementsById = new Map((graph.elements ?? []).map(element => [element.id, element]));
    const viewsById = new Map((graph.views ?? []).map(view => [view.view_id, view]));
    const childEdgesByParentId = new Map<string, IntentGraphVisibleView[]>();
    const parentEdgesByChildId = new Map<string, string[]>();

    for (const view of graph.views ?? []) {
        const children = deriveChildViews(view, elementsById, viewsById);
        childEdgesByParentId.set(view.view_id, children);

        for (const child of children) {
            const parents = parentEdgesByChildId.get(child.viewId) ?? [];
            parents.push(view.view_id);
            parentEdgesByChildId.set(child.viewId, parents);
        }
    }

    return {
        elementsById,
        viewsById,
        childEdgesByParentId,
        parentEdgesByChildId,
    };
}

function resolveStructuralRootView(graph: SystemArchitectureGraph): SystemArchitectureView {
    const rootViews = (graph.views ?? []).filter(view => !view.parent_element_id);

    if (rootViews.length !== 1) {
        throw new Error(
            `Expected exactly one structural root view with no parent_element_id, found ${rootViews.length}.`,
        );
    }

    return rootViews[0];
}

function deriveChildViews(
    view: SystemArchitectureView,
    elementsById: Map<string, SystemArchitectureElement>,
    viewsById: Map<string, SystemArchitectureView>,
): IntentGraphVisibleView[] {
    const children: IntentGraphVisibleView[] = [];
    const seenByParent = new Set<string>();

    for (const elementId of view.included_elements ?? []) {
        const element = elementsById.get(elementId);
        for (const subdiagram of element?.subdiagram_views ?? []) {
            if (seenByParent.has(subdiagram.view_id)) {
                continue;
            }

            const childView = viewsById.get(subdiagram.view_id);
            if (!childView) {
                continue;
            }

            seenByParent.add(subdiagram.view_id);
            children.push({
                viewId: childView.view_id,
                viewName: childView.view_name,
                depth: 0,
                parentViewId: view.view_id,
            });
        }
    }

    return children;
}

function resolveExpandedVisibleViews(
    targetViewId: string | undefined,
    rootViewId: string,
    topLevelViews: IntentGraphVisibleView[],
    indexes: ExplorerIndexes,
): IntentGraphVisibleView[] {
    if (!targetViewId) {
        throw new Error('expand-path requires targetViewId.');
    }

    const path = resolvePreferredPath(targetViewId, rootViewId, indexes);
    const visibleViews = new Map<string, IntentGraphVisibleView>();

    for (const topLevelView of topLevelViews) {
        visibleViews.set(visibleKey(topLevelView.viewId, topLevelView.parentViewId), {
            ...topLevelView,
            depth: 0,
        });
    }

    path.forEach((viewId, index) => {
        const parentViewId = index === 0 ? rootViewId : path[index - 1];
        const pathView = getVisibleView(indexes, viewId, parentViewId, index);
        visibleViews.set(visibleKey(pathView.viewId, pathView.parentViewId), pathView);

        for (const child of indexes.childEdgesByParentId.get(viewId) ?? []) {
            const childVisibleView = getVisibleView(indexes, child.viewId, viewId, index + 1);
            visibleViews.set(visibleKey(childVisibleView.viewId, childVisibleView.parentViewId), childVisibleView);
        }
    });

    return [...visibleViews.values()];
}

function resolveSearchSnapshot(
    request: OpenIntentGraphExplorerRequest,
    rootViewId: string,
    topLevelViews: IntentGraphVisibleView[],
    indexes: ExplorerIndexes,
): IntentGraphExplorerSnapshot {
    const query = request.query?.trim().toLocaleLowerCase();
    if (!query) {
        throw new Error('search requires query.');
    }

    const matchedViewIds = [...indexes.viewsById.values()]
        .filter(view => isSearchMatch(view, query, indexes.elementsById))
        .map(view => view.view_id);

    const visibleViews = new Map<string, IntentGraphVisibleView>();
    for (const topLevelView of topLevelViews) {
        visibleViews.set(visibleKey(topLevelView.viewId, topLevelView.parentViewId), {
            ...topLevelView,
            depth: 0,
        });
    }

    for (const matchedViewId of matchedViewIds) {
        for (const path of resolveAllPaths(matchedViewId, rootViewId, indexes)) {
            path.forEach((viewId, index) => {
                const parentViewId = index === 0 ? rootViewId : path[index - 1];
                const visibleView = getVisibleView(indexes, viewId, parentViewId, index);
                visibleViews.set(visibleKey(visibleView.viewId, visibleView.parentViewId), visibleView);
            });
        }
    }

    return {
        graphPath: request.graphPath,
        rootViewId,
        visibleViews: sortVisibleViews([...visibleViews.values()]),
        matchedViewIds,
    };
}

function isSearchMatch(
    view: SystemArchitectureView,
    normalizedQuery: string,
    elementsById: Map<string, SystemArchitectureElement>,
): boolean {
    if (view.view_name.toLocaleLowerCase().includes(normalizedQuery)) {
        return true;
    }

    return (view.included_elements ?? []).some(elementId => {
        const elementName = elementsById.get(elementId)?.name;
        return Boolean(elementName?.toLocaleLowerCase().includes(normalizedQuery));
    });
}

function resolvePreferredPath(
    targetViewId: string,
    rootViewId: string,
    indexes: ExplorerIndexes,
): string[] {
    const [firstPath] = resolveAllPaths(targetViewId, rootViewId, indexes);
    if (!firstPath) {
        throw new Error(`Could not derive a visible path from root view ${rootViewId} to target view ${targetViewId}.`);
    }

    return firstPath;
}

function resolveAllPaths(
    targetViewId: string,
    rootViewId: string,
    indexes: ExplorerIndexes,
): string[][] {
    const parents = indexes.parentEdgesByChildId.get(targetViewId) ?? [];
    if (parents.length === 0) {
        return [];
    }

    const paths: string[][] = [];
    for (const parent of parents) {
        collectPaths(parent, targetViewId, rootViewId, indexes, [], paths);
    }

    return paths;
}

function collectPaths(
    currentViewId: string,
    targetViewId: string,
    rootViewId: string,
    indexes: ExplorerIndexes,
    tail: string[],
    results: string[][],
): void {
    if (tail.includes(currentViewId)) {
        return;
    }

    const nextTail = [currentViewId, ...tail];
    if (currentViewId === rootViewId) {
        results.push([...nextTail.slice(1), targetViewId]);
        return;
    }

    for (const parentViewId of indexes.parentEdgesByChildId.get(currentViewId) ?? []) {
        collectPaths(parentViewId, targetViewId, rootViewId, indexes, nextTail, results);
    }
}

function getVisibleView(
    indexes: ExplorerIndexes,
    viewId: string,
    parentViewId: string,
    depth: number,
): IntentGraphVisibleView {
    const view = indexes.viewsById.get(viewId);
    if (!view) {
        throw new Error(`View ${viewId} is missing from the graph.`);
    }

    return {
        viewId: view.view_id,
        viewName: view.view_name,
        depth,
        parentViewId,
    };
}

function sortVisibleViews(visibleViews: IntentGraphVisibleView[]): IntentGraphVisibleView[] {
    return [...visibleViews].sort((left, right) => {
        if (left.depth !== right.depth) {
            return left.depth - right.depth;
        }

        if ((left.parentViewId ?? '') !== (right.parentViewId ?? '')) {
            return (left.parentViewId ?? '').localeCompare(right.parentViewId ?? '');
        }

        return left.viewId.localeCompare(right.viewId);
    });
}

function visibleKey(viewId: string, parentViewId: string | undefined): string {
    return `${parentViewId ?? ''}::${viewId}`;
}

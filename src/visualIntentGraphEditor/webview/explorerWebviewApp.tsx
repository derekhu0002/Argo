/// <reference path="../../webview-css.d.ts" />

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import dagre from '@dagrejs/dagre';
import {
    Background,
    Controls,
    MarkerType,
    MiniMap,
    Position,
    ReactFlow,
    type Edge,
    type Node,
    type NodeProps,
    type NodeTypes,
    type ReactFlowInstance,
    type Viewport,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './explorerWebviewApp.css';

interface ExplorerElementPayload {
    id: string;
    name: string;
    note: string;
    mountedChildren: ExplorerViewPayload[];
}

interface ExplorerViewPayload {
    viewId: string;
    viewName: string;
    depth: number;
    parentViewId?: string;
    parentText: string;
    isRoot: boolean;
    isMatched: boolean;
    hasVisibleChildren: boolean;
    elements: ExplorerElementPayload[];
}

interface ExplorerPayload {
    graphPath: string;
    rootViewId?: string;
    visibleViewCount: number;
    matchedViewIds: string[];
    currentQuery: string;
    focusedViewId?: string;
    tree?: ExplorerViewPayload;
}

interface VsCodeApi {
    postMessage(message: unknown): void;
    setState(state: unknown): void;
    getState(): unknown;
}

interface ExplorerWebviewState {
    x?: number;
    y?: number;
    zoom?: number;
}

interface ViewNodeData extends Record<string, unknown> {
    viewId: string;
    viewName: string;
    depth: number;
    parentText: string;
    isRoot: boolean;
    isMatched: boolean;
    isFocused: boolean;
    hasVisibleChildren: boolean;
    onExpand(viewId: string): void;
    onOpenDetail(viewId: string): void;
}

interface ElementNodeData extends Record<string, unknown> {
    elementId: string;
    name: string;
    note: string;
}

declare global {
    interface Window {
        __ARGO_INTENT_GRAPH_EXPLORER__?: ExplorerPayload;
    }

    function acquireVsCodeApi(): VsCodeApi;
}

const VIEW_NODE_WIDTH = 292;
const VIEW_NODE_HEIGHT = 134;
const ELEMENT_NODE_WIDTH = 188;
const ELEMENT_NODE_HEIGHT = 104;
const vscode = acquireVsCodeApi();

function ExplorerViewNode({ data }: NodeProps<Node<ViewNodeData, 'argoView'>>) {
    const classNames = ['argo-flow-view'];
    if (data.isRoot) {
        classNames.push('root');
    }
    if (data.isMatched) {
        classNames.push('highlight');
    }
    if (data.isFocused) {
        classNames.push('focused');
    }

    return (
        <div className={classNames.join(' ')} onClick={() => data.onOpenDetail(data.viewId)}>
            <div className="argo-flow-view-title">View: {data.viewName}</div>
            <div className="argo-flow-view-meta">
                {data.viewId} · depth {data.depth} · {data.parentText} · {data.hasVisibleChildren ? 'visible children' : 'leaf in current snapshot'}
            </div>
            {!data.isRoot ? (
                <div className="argo-flow-view-actions">
                    <button
                        type="button"
                        onClick={event => {
                            event.stopPropagation();
                            data.onExpand(data.viewId);
                        }}
                    >
                        Expand this view
                    </button>
                </div>
            ) : null}
        </div>
    );
}

function ExplorerElementNode({ data }: NodeProps<Node<ElementNodeData, 'argoElement'>>) {
    return (
        <div className="argo-flow-element">
            <div className="argo-flow-element-name">{data.name}</div>
            <div className="argo-flow-element-id">{data.elementId}</div>
            <div className="argo-flow-element-note">{data.note}</div>
        </div>
    );
}

const nodeTypes: NodeTypes = {
    argoView: ExplorerViewNode,
    argoElement: ExplorerElementNode,
};

function buildExplorerFlow(
    tree: ExplorerViewPayload | undefined,
    focusedViewId: string | undefined,
    onExpand: (viewId: string) => void,
    onOpenDetail: (viewId: string) => void,
): {
    nodes: Array<Node<ViewNodeData | ElementNodeData>>;
    edges: Edge[];
} {
    if (!tree) {
        return {
            nodes: [],
            edges: [],
        };
    }

    const graph = new dagre.graphlib.Graph();
    graph.setDefaultEdgeLabel(() => ({}));
    graph.setGraph({
        rankdir: 'TB',
        ranksep: 118,
        nodesep: 42,
        edgesep: 26,
        marginx: 48,
        marginy: 40,
        ranker: 'tight-tree',
    });

    const nodes: Array<Node<ViewNodeData | ElementNodeData>> = [];
    const edges: Edge[] = [];

    function visitView(view: ExplorerViewPayload, branchPath: string): string {
        const viewNodeId = `view:${branchPath}`;
        graph.setNode(viewNodeId, {
            width: VIEW_NODE_WIDTH,
            height: VIEW_NODE_HEIGHT,
        });
        nodes.push({
            id: viewNodeId,
            type: 'argoView',
            position: { x: 0, y: 0 },
            sourcePosition: Position.Bottom,
            targetPosition: Position.Top,
            draggable: false,
            selectable: true,
            data: {
                viewId: view.viewId,
                viewName: view.viewName,
                depth: view.depth,
                parentText: view.parentText,
                isRoot: view.isRoot,
                isMatched: view.isMatched,
                isFocused: view.viewId === focusedViewId,
                hasVisibleChildren: view.hasVisibleChildren,
                onExpand,
                onOpenDetail,
            },
        });

        view.elements.forEach((element, elementIndex) => {
            const elementNodeId = `element:${branchPath}:${element.id}:${elementIndex}`;
            graph.setNode(elementNodeId, {
                width: ELEMENT_NODE_WIDTH,
                height: ELEMENT_NODE_HEIGHT,
            });
            graph.setEdge(viewNodeId, elementNodeId);
            nodes.push({
                id: elementNodeId,
                type: 'argoElement',
                position: { x: 0, y: 0 },
                sourcePosition: Position.Bottom,
                targetPosition: Position.Top,
                draggable: false,
                selectable: false,
                data: {
                    elementId: element.id,
                    name: element.name,
                    note: element.note,
                },
            });
            edges.push({
                id: `${viewNodeId}->${elementNodeId}`,
                source: viewNodeId,
                target: elementNodeId,
                type: 'smoothstep',
                animated: false,
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: '#7bd389',
                },
                style: {
                    stroke: '#7bd389',
                    strokeWidth: 2,
                },
            });

            element.mountedChildren.forEach((child, childIndex) => {
                const childBranchPath = `${branchPath}/e${elementIndex}/c${childIndex}:${child.viewId}`;
                const childViewNodeId = visitView(child, childBranchPath);
                graph.setEdge(elementNodeId, childViewNodeId);
                edges.push({
                    id: `${elementNodeId}->${childViewNodeId}`,
                    source: elementNodeId,
                    target: childViewNodeId,
                    type: 'smoothstep',
                    animated: false,
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: '#e6edf3',
                    },
                    style: {
                        stroke: '#e6edf3',
                        strokeWidth: 1.8,
                    },
                });
            });
        });

        return viewNodeId;
    }

    visitView(tree, `root:${tree.viewId}`);
    dagre.layout(graph);

    const laidOutNodes = nodes.map(node => {
        const position = graph.node(node.id) ?? { x: 120, y: 120 };
        const width = node.type === 'argoView' ? VIEW_NODE_WIDTH : ELEMENT_NODE_WIDTH;
        const height = node.type === 'argoView' ? VIEW_NODE_HEIGHT : ELEMENT_NODE_HEIGHT;
        return {
            ...node,
            position: {
                x: position.x - width / 2,
                y: position.y - height / 2,
            },
        };
    });

    return {
        nodes: laidOutNodes,
        edges,
    };
}

function App({ payload }: { payload: ExplorerPayload }) {
    const savedState = (vscode.getState() as ExplorerWebviewState | undefined) ?? {};
    const [searchQuery, setSearchQuery] = useState(payload.currentQuery);
    const [viewportZoom, setViewportZoom] = useState(typeof savedState.zoom === 'number' ? savedState.zoom : 1);
    const flowInstanceRef = useRef<ReactFlowInstance | null>(null);
    const initializedViewportRef = useRef(false);

    const onExpand = (viewId: string) => {
        persistViewport();
        vscode.postMessage({ type: 'expand', targetViewId: viewId });
    };

    const onOpenDetail = (viewId: string) => {
        persistViewport();
        vscode.postMessage({ type: 'open-view-detail', viewId });
    };

    const { nodes, edges } = useMemo(
        () => buildExplorerFlow(payload.tree, payload.focusedViewId, onExpand, onOpenDetail),
        [payload.focusedViewId, payload.tree],
    );

    function focusViewNode(viewId: string): boolean {
        const flowInstance = flowInstanceRef.current;
        if (!flowInstance) {
            return false;
        }

        const targetNode = nodes.find(node => node.type === 'argoView' && node.data.viewId === viewId);
        if (!targetNode) {
            return false;
        }

        const currentZoom = flowInstance.getViewport().zoom;
        void flowInstance.setCenter(
            targetNode.position.x + VIEW_NODE_WIDTH / 2,
            targetNode.position.y + VIEW_NODE_HEIGHT / 2,
            {
                zoom: Math.max(currentZoom, 0.9),
                duration: 180,
            },
        );
        return true;
    }

    function persistViewport(viewport?: Viewport) {
        const currentViewport = viewport ?? flowInstanceRef.current?.getViewport();
        if (!currentViewport) {
            return;
        }

        vscode.setState({
            x: currentViewport.x,
            y: currentViewport.y,
            zoom: currentViewport.zoom,
        });
    }

    useEffect(() => {
        const flowInstance = flowInstanceRef.current;
        if (!flowInstance || initializedViewportRef.current) {
            return;
        }

        initializedViewportRef.current = true;
        requestAnimationFrame(() => {
            if (payload.focusedViewId && focusViewNode(payload.focusedViewId)) {
                return;
            }

            if (typeof savedState.x === 'number' && typeof savedState.y === 'number' && typeof savedState.zoom === 'number') {
                void flowInstance.setViewport({
                    x: savedState.x,
                    y: savedState.y,
                    zoom: savedState.zoom,
                }, { duration: 0 });
                return;
            }

            void flowInstance.fitView({ padding: 0.2, duration: 0 });
        });
    }, [nodes, payload.focusedViewId, savedState.x, savedState.y, savedState.zoom]);

    useEffect(() => {
        if (!initializedViewportRef.current || !payload.focusedViewId) {
            return;
        }

        requestAnimationFrame(() => {
            if (focusViewNode(payload.focusedViewId)) {
                persistViewport();
            }
        });
    }, [nodes, payload.focusedViewId]);

    function submitSearch() {
        vscode.postMessage({ type: 'search', query: searchQuery });
    }

    return (
        <main className="argo-explorer-app">
            <section className="argo-explorer-toolbar">
                <input
                    type="text"
                    placeholder="Search view name or included element name"
                    value={searchQuery}
                    onChange={event => setSearchQuery(event.target.value)}
                    onKeyDown={event => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            submitSearch();
                        }
                    }}
                />
                <button type="button" onClick={submitSearch}>Search</button>
                <button type="button" className="secondary" onClick={() => vscode.postMessage({ type: 'reset' })}>Reset</button>
                <div className="argo-zoom-toolbar">
                    <button type="button" className="secondary" onClick={() => flowInstanceRef.current?.zoomOut({ duration: 120 })}>-</button>
                    <button type="button" className="secondary" onClick={() => flowInstanceRef.current?.fitView({ padding: 0.2, duration: 140 })}>Fit</button>
                    <button
                        type="button"
                        className="secondary"
                        onClick={() => {
                            void flowInstanceRef.current?.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 140 });
                        }}
                    >
                        100%
                    </button>
                    <button type="button" className="secondary" onClick={() => flowInstanceRef.current?.zoomIn({ duration: 120 })}>+</button>
                    <div className="argo-zoom-badge">{Math.round(viewportZoom * 100)}%</div>
                </div>
            </section>

            <section className="argo-explorer-meta">
                <div><strong>graphPath</strong>: {payload.graphPath}</div>
                <div><strong>rootViewId</strong>: {payload.rootViewId ?? '(unresolved)'}</div>
                <div><strong>visibleViews</strong>: {payload.visibleViewCount}</div>
                {payload.matchedViewIds.length > 0 ? <div><strong>matchedViewIds</strong>: {payload.matchedViewIds.join(', ')}</div> : null}
            </section>

            <section className="argo-explorer-canvas">
                {payload.tree ? (
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        minZoom={0.2}
                        maxZoom={2.5}
                        fitView
                        fitViewOptions={{ padding: 0.2 }}
                        nodesDraggable={false}
                        nodesConnectable={false}
                        elementsSelectable
                        onInit={instance => {
                            flowInstanceRef.current = instance;
                        }}
                        onMove={(_, viewport) => {
                            setViewportZoom(viewport.zoom);
                        }}
                        onMoveEnd={(_, viewport) => {
                            setViewportZoom(viewport.zoom);
                            persistViewport(viewport);
                        }}
                        proOptions={{ hideAttribution: true }}
                    >
                        <Background color="rgba(230, 237, 243, 0.08)" gap={20} />
                        <MiniMap
                            pannable
                            zoomable
                            nodeColor={node => {
                                if (node.type === 'argoView' && node.data.isFocused) {
                                    return '#e6edf3';
                                }
                                return node.type === 'argoView' ? '#7bd389' : '#5a6f88';
                            }}
                            maskColor="rgba(15, 23, 32, 0.62)"
                        />
                        <Controls showInteractive={false} />
                    </ReactFlow>
                ) : (
                    <div className="argo-empty">No visible views were derived from the current request.</div>
                )}
            </section>
        </main>
    );
}

const payload = window.__ARGO_INTENT_GRAPH_EXPLORER__;
const rootElement = document.getElementById('argo-intent-graph-explorer-root');

if (!payload || !rootElement) {
    throw new Error('Intent graph explorer payload is missing.');
}

createRoot(rootElement).render(<App payload={payload} />);
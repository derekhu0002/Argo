/// <reference path="../../webview-css.d.ts" />

import React, { useMemo, useState } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './detailWebviewApp.css';

interface DetailView {
    view_id: string;
    view_name: string;
}

interface DetailElement {
    id: string;
    name: string;
}

interface DetailRelationship {
    id: string;
    name?: string;
    statement?: string;
    source_id: string;
    target_id: string;
    source_name?: string;
    target_name?: string;
}

interface DetailPayload {
    view: DetailView;
    elements: DetailElement[];
    relationships: DetailRelationship[];
}

interface VsCodeApi {
    postMessage(message: unknown): void;
}

interface ElementNodeData extends Record<string, unknown> {
    id: string;
    label: string;
    layer: number;
    connectionCount: number;
    isActive: boolean;
    isDim: boolean;
}

declare global {
    interface Window {
        __ARGO_INTENT_GRAPH_VIEW_DETAIL__?: DetailPayload;
    }

    function acquireVsCodeApi(): VsCodeApi;
}

const NODE_WIDTH = 220;
const NODE_HEIGHT = 108;
const vscode = acquireVsCodeApi();

function ElementNode({ data }: NodeProps<Node<ElementNodeData, 'argoElement'>>) {
    const classNames = ['argo-element-node', 'is-clickable'];
    if (data.isActive) {
        classNames.push('is-active');
    }
    if (data.isDim) {
        classNames.push('is-dim');
    }

    return (
        <div className={classNames.join(' ')}>
            <div className="argo-element-node-layer">Layer {data.layer + 1}</div>
            <div className="argo-element-node-name">{data.label}</div>
            <div className="argo-element-node-id">{data.id}</div>
            <div className="argo-element-node-count">{data.connectionCount} linked relationship{data.connectionCount === 1 ? '' : 's'}</div>
        </div>
    );
}

const nodeTypes: NodeTypes = {
    argoElement: ElementNode,
};

function computeLayers(elements: DetailElement[], relationships: DetailRelationship[]): Map<string, number> {
    const layerById = new Map<string, number>(elements.map(element => [element.id, 0]));
    const outgoing = new Map<string, string[]>();
    const indegree = new Map<string, number>(elements.map(element => [element.id, 0]));

    for (const relationship of relationships) {
        if (!layerById.has(relationship.source_id) || !layerById.has(relationship.target_id)) {
            continue;
        }

        const next = outgoing.get(relationship.source_id) ?? [];
        next.push(relationship.target_id);
        outgoing.set(relationship.source_id, next);
        indegree.set(relationship.target_id, (indegree.get(relationship.target_id) ?? 0) + 1);
    }

    const queue = [...indegree.entries()]
        .filter(([, count]) => count === 0)
        .map(([id]) => id);
    const visited = new Set<string>();

    while (queue.length > 0) {
        const currentId = queue.shift();
        if (!currentId) {
            continue;
        }

        visited.add(currentId);
        const currentLayer = layerById.get(currentId) ?? 0;
        for (const targetId of outgoing.get(currentId) ?? []) {
            layerById.set(targetId, Math.max(layerById.get(targetId) ?? 0, currentLayer + 1));
            indegree.set(targetId, Math.max(0, (indegree.get(targetId) ?? 0) - 1));
            if ((indegree.get(targetId) ?? 0) === 0) {
                queue.push(targetId);
            }
        }
    }

    for (const element of elements) {
        if (!visited.has(element.id)) {
            layerById.set(element.id, layerById.get(element.id) ?? 0);
        }
    }

    return layerById;
}

function buildFlowLayout(payload: DetailPayload): {
    baseNodes: Array<Node<ElementNodeData>>;
    baseEdges: Edge[];
    incomingById: Map<string, DetailRelationship[]>;
    outgoingById: Map<string, DetailRelationship[]>;
} {
    const layerById = computeLayers(payload.elements, payload.relationships);
    const connectionCountById = new Map<string, number>(payload.elements.map(element => [element.id, 0]));
    const incomingById = new Map<string, DetailRelationship[]>();
    const outgoingById = new Map<string, DetailRelationship[]>();
    const graph = new dagre.graphlib.Graph();

    graph.setDefaultEdgeLabel(() => ({}));
    graph.setGraph({
        rankdir: 'LR',
        ranksep: 120,
        nodesep: 44,
        marginx: 40,
        marginy: 40,
        ranker: 'tight-tree',
    });

    for (const element of payload.elements) {
        graph.setNode(element.id, {
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
        });
    }

    for (const relationship of payload.relationships) {
        if (!connectionCountById.has(relationship.source_id) || !connectionCountById.has(relationship.target_id)) {
            continue;
        }

        connectionCountById.set(relationship.source_id, (connectionCountById.get(relationship.source_id) ?? 0) + 1);
        connectionCountById.set(relationship.target_id, (connectionCountById.get(relationship.target_id) ?? 0) + 1);

        const incoming = incomingById.get(relationship.target_id) ?? [];
        incoming.push(relationship);
        incomingById.set(relationship.target_id, incoming);

        const outgoing = outgoingById.get(relationship.source_id) ?? [];
        outgoing.push(relationship);
        outgoingById.set(relationship.source_id, outgoing);

        graph.setEdge(relationship.source_id, relationship.target_id);
    }

    dagre.layout(graph);

    const baseNodes = payload.elements.map(element => {
        const position = graph.node(element.id) ?? { x: 120, y: 120 };
        return {
            id: element.id,
            type: 'argoElement',
            position: {
                x: position.x - NODE_WIDTH / 2,
                y: position.y - NODE_HEIGHT / 2,
            },
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
            data: {
                id: element.id,
                label: element.name,
                layer: layerById.get(element.id) ?? 0,
                connectionCount: connectionCountById.get(element.id) ?? 0,
                isActive: false,
                isDim: false,
            },
        };
    });

    const baseEdges = payload.relationships
        .filter(relationship => graph.node(relationship.source_id) && graph.node(relationship.target_id))
        .map((relationship, index) => ({
            id: relationship.id || `relationship-${index}`,
            source: relationship.source_id,
            target: relationship.target_id,
            type: 'smoothstep',
            label: relationship.name ?? relationship.statement ?? `${relationship.source_name ?? relationship.source_id} -> ${relationship.target_name ?? relationship.target_id}`,
            labelShowBg: true,
            labelBgPadding: [8, 4] as [number, number],
            labelBgBorderRadius: 8,
            labelStyle: {
                fill: '#8b9bb0',
                fontSize: 12,
            },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#7bd389',
            },
            style: {
                stroke: '#7bd389',
                strokeWidth: 1.8,
            },
        }));

    return {
        baseNodes,
        baseEdges,
        incomingById,
        outgoingById,
    };
}

function App({ payload }: { payload: DetailPayload }) {
    const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
    const { baseNodes, baseEdges, incomingById, outgoingById } = useMemo(() => buildFlowLayout(payload), [payload]);

    const connectedNodeIds = useMemo(() => {
        if (!activeNodeId) {
            return new Set<string>();
        }

        const connectedIds = new Set<string>([activeNodeId]);
        for (const relationship of incomingById.get(activeNodeId) ?? []) {
            connectedIds.add(relationship.source_id);
            connectedIds.add(relationship.target_id);
        }
        for (const relationship of outgoingById.get(activeNodeId) ?? []) {
            connectedIds.add(relationship.source_id);
            connectedIds.add(relationship.target_id);
        }
        return connectedIds;
    }, [activeNodeId, incomingById, outgoingById]);

    const nodes = useMemo(() => {
        const hasActive = Boolean(activeNodeId);
        return baseNodes.map(node => ({
            ...node,
            data: {
                ...node.data,
                isActive: node.id === activeNodeId,
                isDim: hasActive && !connectedNodeIds.has(node.id),
            },
        }));
    }, [activeNodeId, baseNodes, connectedNodeIds]);

    const edges = useMemo(() => {
        return baseEdges.map(edge => {
            const isActive = Boolean(activeNodeId) && (edge.source === activeNodeId || edge.target === activeNodeId);
            const isDim = Boolean(activeNodeId) && !isActive;
            return {
                ...edge,
                animated: isActive,
                labelStyle: {
                    fill: isActive ? '#e6edf3' : '#8b9bb0',
                    fontSize: 12,
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: isActive ? '#e6edf3' : '#7bd389',
                },
                style: {
                    stroke: isActive ? '#e6edf3' : '#7bd389',
                    opacity: isDim ? 0.18 : 1,
                    strokeWidth: isActive ? 2.8 : 1.8,
                },
            };
        });
    }, [activeNodeId, baseEdges]);

    const selectedElement = activeNodeId ? payload.elements.find(element => element.id === activeNodeId) : undefined;
    const selectedIncoming = activeNodeId ? incomingById.get(activeNodeId) ?? [] : [];
    const selectedOutgoing = activeNodeId ? outgoingById.get(activeNodeId) ?? [] : [];

    if (payload.elements.length === 0) {
        return (
            <div className="argo-detail-app">
                <section className="argo-detail-meta">
                    <div className="argo-detail-title">{payload.view.view_name}</div>
                    <div className="argo-detail-subtitle">{payload.view.view_id}</div>
                </section>
                <section className="argo-detail-canvas">
                    <div className="argo-detail-empty">This view does not include any elements.</div>
                </section>
            </div>
        );
    }

    return (
        <div className="argo-detail-app">
            <section className="argo-detail-meta">
                <div className="argo-detail-title">{payload.view.view_name}</div>
                <div className="argo-detail-subtitle">{payload.view.view_id}</div>
                <div className="argo-detail-actions">
                    <button
                        type="button"
                        onClick={() => vscode.postMessage({ type: 'reveal-in-explorer', viewId: payload.view.view_id })}
                    >
                        Reveal this view in explorer
                    </button>
                </div>
                <div className="argo-detail-grid">
                    <div>
                        <strong>Elements</strong>
                        {payload.elements.length}
                    </div>
                    <div>
                        <strong>Relationships</strong>
                        {payload.relationships.length}
                    </div>
                    <div>
                        <strong>Layout</strong>
                        React Flow + Dagre
                    </div>
                    <div>
                        <strong>Interaction</strong>
                        Click an element to focus adjacent links
                    </div>
                </div>
            </section>
            <section className="argo-detail-main">
                <section className="argo-detail-canvas">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        fitView
                        fitViewOptions={{ padding: 0.16 }}
                        nodesDraggable={false}
                        nodesConnectable={false}
                        elementsSelectable
                        onNodeClick={(_, node) => {
                            setActiveNodeId(current => current === node.id ? null : node.id);
                        }}
                        proOptions={{ hideAttribution: true }}
                        minZoom={0.3}
                        maxZoom={1.9}
                    >
                        <Background color="rgba(230, 237, 243, 0.08)" gap={18} />
                        <MiniMap
                            pannable
                            zoomable
                            nodeColor={node => node.id === activeNodeId ? '#e6edf3' : connectedNodeIds.has(node.id) || !activeNodeId ? '#7bd389' : 'rgba(123, 211, 137, 0.24)'}
                            maskColor="rgba(15, 23, 32, 0.62)"
                        />
                        <Controls showInteractive={false} />
                    </ReactFlow>
                </section>
                <aside className="argo-detail-inspector">
                    <h2>Inspector</h2>
                    {selectedElement ? (
                        <>
                            <p><strong>{selectedElement.name}</strong><br />{selectedElement.id}</p>
                            <p>Incoming: {selectedIncoming.length} | Outgoing: {selectedOutgoing.length}</p>
                            <ul>
                                {selectedIncoming.map(relationship => (
                                    <li key={`in-${relationship.id}`}>
                                        In: {relationship.name ?? relationship.statement ?? `${relationship.source_name ?? relationship.source_id} -> ${relationship.target_name ?? relationship.target_id}`}
                                    </li>
                                ))}
                                {selectedOutgoing.map(relationship => (
                                    <li key={`out-${relationship.id}`}>
                                        Out: {relationship.name ?? relationship.statement ?? `${relationship.source_name ?? relationship.source_id} -> ${relationship.target_name ?? relationship.target_id}`}
                                    </li>
                                ))}
                            </ul>
                        </>
                    ) : (
                        <>
                            <p>Click any element node to highlight its incoming and outgoing relationships.</p>
                            <p>The graph is rendered with React Flow and auto-laid out by Dagre to make direction and hierarchy clearer than the previous hand-built SVG.</p>
                        </>
                    )}
                </aside>
            </section>
        </div>
    );
}

const payload = window.__ARGO_INTENT_GRAPH_VIEW_DETAIL__;
const rootElement = document.getElementById('argo-intent-graph-detail-root');

if (!payload || !rootElement) {
    throw new Error('Intent graph detail payload is missing.');
}

createRoot(rootElement).render(<App payload={payload} />);
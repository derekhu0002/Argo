/// <reference path="../../webview-css.d.ts" />

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
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
    tree?: ExplorerViewPayload;
}

interface VsCodeApi {
    postMessage(message: unknown): void;
    setState(state: unknown): void;
    getState(): unknown;
}

declare global {
    interface Window {
        __ARGO_INTENT_GRAPH_EXPLORER__?: ExplorerPayload;
    }

    function acquireVsCodeApi(): VsCodeApi;
}

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.15;
const vscode = acquireVsCodeApi();

function clampZoom(value: number): number {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

function ViewBranch({
    branch,
    onExpand,
    onOpenDetail,
}: {
    branch: ExplorerViewPayload;
    onExpand(viewId: string): void;
    onOpenDetail(viewId: string): void;
}) {
    const classes = ['argo-view-box'];
    if (branch.isRoot) {
        classes.push('root');
    }
    if (branch.isMatched) {
        classes.push('highlight');
    }

    return (
        <div className="argo-view-branch" data-role="view-branch" data-view-id={branch.viewId}>
            <div
                className={classes.join(' ')}
                data-role="view-box"
                data-view-id={branch.viewId}
                onClick={() => onOpenDetail(branch.viewId)}
            >
                <div className="argo-view-title">View: {branch.viewName}</div>
                <div className="argo-view-meta">
                    {branch.viewId} · depth {branch.depth} · {branch.parentText} · {branch.hasVisibleChildren ? 'visible children' : 'leaf in current snapshot'}
                </div>
                {!branch.isRoot ? (
                    <div className="argo-view-actions">
                        <button
                            type="button"
                            data-target-view-id={branch.viewId}
                            onClick={event => {
                                event.stopPropagation();
                                onExpand(branch.viewId);
                            }}
                        >
                            Expand this view
                        </button>
                    </div>
                ) : null}
            </div>

            {branch.elements.length === 0 ? (
                <div className="argo-empty-element">This view has no included elements.</div>
            ) : (
                <div className="argo-element-lane-shell" data-role="element-lane-shell">
                    <div className="argo-element-lane" data-role="element-lane">
                        {branch.elements.map(element => (
                            <div key={`${branch.viewId}:${element.id}`} className="argo-element-column" data-role="element-column" data-element-id={element.id}>
                                <div className="argo-element-node" data-role="element-node" data-element-id={element.id}>{element.name}</div>
                                <div className="argo-element-note">{element.note}</div>
                                {element.mountedChildren.length > 0 ? (
                                    <div className="argo-child-row" data-role="child-row">
                                        {element.mountedChildren.map(child => (
                                            <div key={`${element.id}:${child.viewId}`} className="argo-child-anchor" data-role="child-anchor">
                                                <ViewBranch branch={child} onExpand={onExpand} onOpenDetail={onOpenDetail} />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="argo-empty-element">No currently visible child views</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function App({ payload }: { payload: ExplorerPayload }) {
    const webviewState = (vscode.getState() as { zoom?: number; scrollLeft?: number; scrollTop?: number } | undefined) ?? {};
    const [searchQuery, setSearchQuery] = useState(payload.currentQuery);
    const [zoom, setZoom] = useState(typeof webviewState.zoom === 'number' ? webviewState.zoom : 1);
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const shellRef = useRef<HTMLDivElement | null>(null);
    const frameRef = useRef<HTMLDivElement | null>(null);
    const connectorsRef = useRef<SVGSVGElement | null>(null);
    const initializedRef = useRef(false);
    const suppressPersistenceRef = useRef(false);
    const isPanningRef = useRef(false);
    const panStartXRef = useRef(0);
    const panStartYRef = useRef(0);
    const panScrollLeftRef = useRef(0);
    const panScrollTopRef = useRef(0);

    function persistViewportState() {
        const scroll = scrollRef.current;
        if (!scroll || suppressPersistenceRef.current) {
            return;
        }

        vscode.setState({
            zoom,
            scrollLeft: scroll.scrollLeft,
            scrollTop: scroll.scrollTop,
        });
    }

    function getAnchorPoint(element: Element, vertical: 'top' | 'bottom') {
        const frame = frameRef.current;
        if (!frame) {
            return { x: 0, y: 0 };
        }

        const frameRect = frame.getBoundingClientRect();
        const rect = element.getBoundingClientRect();
        return {
            x: rect.left - frameRect.left + rect.width / 2,
            y: vertical === 'top' ? rect.top - frameRect.top : rect.bottom - frameRect.top,
        };
    }

    function createPath(start: { x: number; y: number }, end: { x: number; y: number }, bend: number) {
        const cp1y = start.y + bend;
        const cp2y = end.y - bend;
        return `M ${start.x} ${start.y} C ${start.x} ${cp1y}, ${end.x} ${cp2y}, ${end.x} ${end.y}`;
    }

    function appendConnector(start: { x: number; y: number }, end: { x: number; y: number }, options?: { bend?: number; width?: number; stroke?: string; dash?: string }) {
        const connectors = connectorsRef.current;
        if (!connectors) {
            return;
        }

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const bend = options?.bend ?? Math.max(24, Math.abs(end.y - start.y) * 0.35);
        path.setAttribute('d', createPath(start, end, bend));
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', options?.stroke ?? 'rgba(123, 211, 137, 0.82)');
        path.setAttribute('stroke-width', String(options?.width ?? 2));
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        if (options?.dash) {
            path.setAttribute('stroke-dasharray', options.dash);
        }
        connectors.appendChild(path);
    }

    function redrawConnectors() {
        const frame = frameRef.current;
        const connectors = connectorsRef.current;
        if (!frame || !connectors) {
            return;
        }

        const width = Math.ceil(frame.scrollWidth);
        const height = Math.ceil(frame.scrollHeight);
        connectors.setAttribute('viewBox', `0 0 ${width} ${height}`);
        connectors.setAttribute('width', String(width));
        connectors.setAttribute('height', String(height));
        connectors.innerHTML = '';

        frame.querySelectorAll('[data-role="view-box"]').forEach(viewBox => {
            const branch = viewBox.closest('[data-role="view-branch"]');
            if (!branch) {
                return;
            }

            const elementLane = branch.querySelector(':scope > [data-role="element-lane-shell"] [data-role="element-lane"]');
            if (!elementLane) {
                return;
            }

            appendConnector(getAnchorPoint(viewBox, 'bottom'), getAnchorPoint(elementLane, 'top'), { bend: 28, width: 2.2 });
        });

        frame.querySelectorAll('[data-role="element-node"]').forEach(elementNode => {
            const elementColumn = elementNode.closest('[data-role="element-column"]');
            if (!elementColumn) {
                return;
            }

            const elementLane = elementColumn.parentElement;
            if (elementLane?.getAttribute('data-role') === 'element-lane') {
                appendConnector(getAnchorPoint(elementLane, 'top'), getAnchorPoint(elementNode, 'top'), {
                    bend: 16,
                    width: 1.8,
                    stroke: 'rgba(123, 211, 137, 0.72)',
                });
            }

            const childRow = elementColumn.querySelector(':scope > [data-role="child-row"]');
            if (childRow && childRow.querySelector('[data-role="view-box"]')) {
                appendConnector(getAnchorPoint(elementNode, 'bottom'), getAnchorPoint(childRow, 'top'), {
                    bend: 18,
                    width: 1.8,
                    stroke: 'rgba(123, 211, 137, 0.72)',
                });
            }
        });

        frame.querySelectorAll('[data-role="child-row"]').forEach(childRow => {
            const childViews = childRow.querySelectorAll(':scope > [data-role="child-anchor"] > [data-role="view-branch"] > [data-role="view-box"]');
            if (childViews.length === 0) {
                return;
            }

            childViews.forEach(childViewBox => {
                appendConnector(getAnchorPoint(childRow, 'top'), getAnchorPoint(childViewBox, 'top'), {
                    bend: 22,
                    width: 1.8,
                    stroke: 'rgba(123, 211, 137, 0.68)',
                });
            });
        });
    }

    function updateZoomLayout(currentZoom: number) {
        const frame = frameRef.current;
        const shell = shellRef.current;
        if (!frame || !shell) {
            return;
        }

        frame.style.transform = `scale(${currentZoom})`;
        shell.style.width = `${Math.ceil(frame.offsetWidth * currentZoom)}px`;
        shell.style.height = `${Math.ceil(frame.offsetHeight * currentZoom)}px`;
    }

    function applyZoom(nextZoom: number) {
        setZoom(clampZoom(nextZoom));
    }

    function fitToViewport() {
        const scroll = scrollRef.current;
        const frame = frameRef.current;
        if (!scroll || !frame) {
            return;
        }

        const availableWidth = Math.max(240, scroll.clientWidth - 40);
        const availableHeight = Math.max(180, scroll.clientHeight - 40);
        const intrinsicWidth = Math.max(1, frame.offsetWidth);
        const intrinsicHeight = Math.max(1, frame.offsetHeight);
        const fittedZoom = Math.min(availableWidth / intrinsicWidth, availableHeight / intrinsicHeight);
        applyZoom(fittedZoom);
    }

    useLayoutEffect(() => {
        updateZoomLayout(zoom);
        const scroll = scrollRef.current;
        if (!scroll) {
            return;
        }

        if (!initializedRef.current) {
            initializedRef.current = true;
            if (typeof webviewState.zoom === 'number') {
                requestAnimationFrame(() => {
                    scroll.scrollLeft = typeof webviewState.scrollLeft === 'number' ? webviewState.scrollLeft : 0;
                    scroll.scrollTop = typeof webviewState.scrollTop === 'number' ? webviewState.scrollTop : 0;
                    requestAnimationFrame(redrawConnectors);
                });
                return;
            }

            suppressPersistenceRef.current = true;
            fitToViewport();
            requestAnimationFrame(() => {
                suppressPersistenceRef.current = false;
                redrawConnectors();
            });
            return;
        }

        requestAnimationFrame(redrawConnectors);
        persistViewportState();
    }, [payload, zoom]);

    useEffect(() => {
        const handleResize = () => {
            requestAnimationFrame(() => {
                if (typeof webviewState.zoom === 'number') {
                    updateZoomLayout(zoom);
                    redrawConnectors();
                    return;
                }

                suppressPersistenceRef.current = true;
                fitToViewport();
                requestAnimationFrame(() => {
                    suppressPersistenceRef.current = false;
                    redrawConnectors();
                });
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [zoom]);

    function submitSearch() {
        vscode.postMessage({ type: 'search', query: searchQuery });
    }

    function beginPan(event: React.PointerEvent<HTMLDivElement>) {
        if (event.button !== 0) {
            return;
        }

        const target = event.target as HTMLElement;
        if (target.closest('button') || target.closest('input')) {
            return;
        }

        const scroll = scrollRef.current;
        if (!scroll) {
            return;
        }

        isPanningRef.current = true;
        panStartXRef.current = event.clientX;
        panStartYRef.current = event.clientY;
        panScrollLeftRef.current = scroll.scrollLeft;
        panScrollTopRef.current = scroll.scrollTop;
        scroll.classList.add('panning');
        event.preventDefault();
    }

    function updatePan(event: PointerEvent) {
        if (!isPanningRef.current) {
            return;
        }

        const scroll = scrollRef.current;
        if (!scroll) {
            return;
        }

        scroll.scrollLeft = panScrollLeftRef.current - (event.clientX - panStartXRef.current);
        scroll.scrollTop = panScrollTopRef.current - (event.clientY - panStartYRef.current);
        persistViewportState();
    }

    function endPan() {
        if (!isPanningRef.current) {
            return;
        }

        const scroll = scrollRef.current;
        isPanningRef.current = false;
        scroll?.classList.remove('panning');
        persistViewportState();
    }

    useEffect(() => {
        window.addEventListener('pointermove', updatePan);
        window.addEventListener('pointerup', endPan);
        window.addEventListener('pointercancel', endPan);

        return () => {
            window.removeEventListener('pointermove', updatePan);
            window.removeEventListener('pointerup', endPan);
            window.removeEventListener('pointercancel', endPan);
        };
    });

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
                    <button type="button" className="secondary" onClick={() => applyZoom(zoom - (zoom < 1 ? 0.1 : ZOOM_STEP))}>-</button>
                    <button type="button" className="secondary" onClick={fitToViewport}>Fit</button>
                    <button type="button" className="secondary" onClick={() => applyZoom(1)}>100%</button>
                    <button type="button" className="secondary" onClick={() => applyZoom(zoom + (zoom < 1 ? 0.1 : ZOOM_STEP))}>+</button>
                    <div className="argo-zoom-badge">{Math.round(zoom * 100)}%</div>
                </div>
            </section>

            <section className="argo-explorer-meta">
                <div><strong>graphPath</strong>: {payload.graphPath}</div>
                <div><strong>rootViewId</strong>: {payload.rootViewId ?? '(unresolved)'}</div>
                <div><strong>visibleViews</strong>: {payload.visibleViewCount}</div>
                {payload.matchedViewIds.length > 0 ? <div><strong>matchedViewIds</strong>: {payload.matchedViewIds.join(', ')}</div> : null}
            </section>

            <section className="argo-explorer-canvas">
                <div
                    ref={scrollRef}
                    className="argo-graph-scroll"
                    onScroll={persistViewportState}
                    onPointerDown={beginPan}
                    onWheel={event => {
                        if (!event.ctrlKey && !event.metaKey) {
                            return;
                        }

                        event.preventDefault();
                        applyZoom(zoom + (event.deltaY > 0 ? -(zoom < 1 ? 0.1 : ZOOM_STEP) : (zoom < 1 ? 0.1 : ZOOM_STEP)));
                    }}
                >
                    <div ref={shellRef} className="argo-graph-shell">
                        <div ref={frameRef} className="argo-graph-frame">
                            <svg ref={connectorsRef} className="argo-graph-connectors" aria-hidden="true"></svg>
                            {payload.tree ? (
                                <div className="argo-graph-stage">
                                    <ViewBranch
                                        branch={payload.tree}
                                        onExpand={viewId => {
                                            persistViewportState();
                                            vscode.postMessage({ type: 'expand', targetViewId: viewId });
                                        }}
                                        onOpenDetail={viewId => {
                                            persistViewportState();
                                            vscode.postMessage({ type: 'open-view-detail', viewId });
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="argo-empty">No visible views were derived from the current request.</div>
                            )}
                        </div>
                    </div>
                </div>
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
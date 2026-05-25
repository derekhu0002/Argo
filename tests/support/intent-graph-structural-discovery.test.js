const assert = require('assert');
const fs = require('fs');
const path = require('path');

function readGraph(repoRoot) {
    return JSON.parse(fs.readFileSync(path.join(repoRoot, 'design', 'KG', 'SystemArchitecture.json'), 'utf8'));
}

function createIndexes(graph) {
    const elementsById = new Map((graph.elements || []).map(element => [element.id, element]));
    const viewsById = new Map((graph.views || []).map(view => [view.view_id, view]));
    return { elementsById, viewsById };
}

function resolveStructuralRootView(graph) {
    const rootViews = (graph.views || []).filter(view => !view.parent_element_id);
    assert.strictEqual(rootViews.length, 1, `Expected exactly one structural root view, found ${rootViews.length}.`);
    return rootViews[0];
}

function deriveChildViews(view, elementsById, viewsById) {
    const results = [];
    const seen = new Set();
    for (const elementId of view.included_elements || []) {
        const element = elementsById.get(elementId);
        for (const subdiagram of element?.subdiagram_views || []) {
            if (seen.has(subdiagram.view_id)) {
                continue;
            }
            const childView = viewsById.get(subdiagram.view_id);
            if (childView) {
                seen.add(subdiagram.view_id);
                results.push(childView);
            }
        }
    }
    return results;
}

function main() {
    const repoRoot = path.resolve(__dirname, '..', '..');
    const graph = readGraph(repoRoot);
    const { elementsById, viewsById } = createIndexes(graph);
    const rootView = resolveStructuralRootView(graph);
    const firstLayerViews = deriveChildViews(rootView, elementsById, viewsById);

    assert(firstLayerViews.length > 0, 'Expected the structural root view to expose at least one first-layer child view.');

    const searchableTarget = firstLayerViews.find(view =>
        (view.included_elements || []).some(elementId => Boolean(elementsById.get(elementId)?.name)),
    );

    assert(searchableTarget, 'Expected at least one first-layer child view to contain a named included element for search support coverage.');
}

try {
    main();
    console.log('intent-graph-structural-discovery: passed');
} catch (error) {
    console.error(error instanceof Error ? error.stack || error.message : String(error));
    process.exit(1);
}

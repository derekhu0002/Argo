const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vscode = require('vscode');

const COMMAND_ID = 'argo.openIntentGraphExplorer';
const TESTCASE = 'INTENT-GRAPH-SEARCH-EXPANSION';

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
    assert.strictEqual(
        rootViews.length,
        1,
        `Expected exactly one structural root view with no parent_element_id, found ${rootViews.length}.`,
    );
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

function collectReachableViews(rootView, elementsById, viewsById) {
    const results = [];
    const queue = [...deriveChildViews(rootView, elementsById, viewsById)];
    const seen = new Set(queue.map(view => view.view_id));

    while (queue.length > 0) {
        const current = queue.shift();
        results.push(current);
        for (const child of deriveChildViews(current, elementsById, viewsById)) {
            if (!seen.has(child.view_id)) {
                seen.add(child.view_id);
                queue.push(child);
            }
        }
    }

    return results;
}

function findSearchTarget(reachableViews, elementsById) {
    for (const view of reachableViews) {
        const viewNameQuery = view.view_name;
        if (viewNameQuery) {
            const firstElementName = (view.included_elements || [])
                .map(elementId => elementsById.get(elementId)?.name)
                .find(Boolean);
            return {
                targetView: view,
                viewNameQuery,
                elementNameQuery: firstElementName,
            };
        }
    }
    return undefined;
}

function assertSnapshotContainsTarget(snapshot, targetViewId, label) {
    assert(snapshot && Array.isArray(snapshot.visibleViews), `Expected ${label} snapshot to return visibleViews.`);
    const visibleIds = new Set(snapshot.visibleViews.map(view => view.viewId));
    assert(visibleIds.has(targetViewId), `${label} snapshot must reveal the matched target view.`);
}

async function run() {
    const repoRoot = path.resolve(__dirname, '..', '..', '..');
    const graphPath = path.join(repoRoot, 'design', 'KG', 'SystemArchitecture.json');
    const graph = readGraph(repoRoot);
    const { elementsById, viewsById } = createIndexes(graph);
    const rootView = resolveStructuralRootView(graph);
    const reachableViews = collectReachableViews(rootView, elementsById, viewsById);
    const searchTarget = findSearchTarget(reachableViews, elementsById);

    assert(searchTarget, 'Expected at least one reachable target view with a usable search query.');

    const commands = await vscode.commands.getCommands(true);
    assert(
        commands.includes(COMMAND_ID),
        `Missing VS Code command ${COMMAND_ID}. Coding/Repair must register it before ${TESTCASE} can pass.`,
    );

    const viewNameSnapshot = await vscode.commands.executeCommand(COMMAND_ID, {
        graphPath,
        action: 'search',
        query: searchTarget.viewNameQuery,
        mode: 'test',
        testcase: TESTCASE,
    });

    assertSnapshotContainsTarget(viewNameSnapshot, searchTarget.targetView.view_id, 'View-name search');

    if (Array.isArray(viewNameSnapshot.matchedViewIds)) {
        assert(
            viewNameSnapshot.matchedViewIds.includes(searchTarget.targetView.view_id),
            'View-name search snapshot must report the matched target view id.',
        );
    }

    assert(
        searchTarget.elementNameQuery,
        'Expected the chosen target view to expose at least one included element name for search coverage.',
    );

    const elementNameSnapshot = await vscode.commands.executeCommand(COMMAND_ID, {
        graphPath,
        action: 'search',
        query: searchTarget.elementNameQuery,
        mode: 'test',
        testcase: TESTCASE,
    });

    assertSnapshotContainsTarget(elementNameSnapshot, searchTarget.targetView.view_id, 'Element-name search');
}

module.exports = { run };

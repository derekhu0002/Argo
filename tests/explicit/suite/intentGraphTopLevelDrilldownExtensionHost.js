const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vscode = require('vscode');

const COMMAND_ID = 'argo.openIntentGraphExplorer';
const TESTCASE = 'INTENT-GRAPH-TOP-LEVEL-DRILLDOWN';

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

async function run() {
    const repoRoot = path.resolve(__dirname, '..', '..', '..');
    const graphPath = path.join(repoRoot, 'design', 'KG', 'SystemArchitecture.json');
    const graph = readGraph(repoRoot);
    const { elementsById, viewsById } = createIndexes(graph);
    const rootView = resolveStructuralRootView(graph);
    const topLevelViews = deriveChildViews(rootView, elementsById, viewsById);

    assert(topLevelViews.length > 0, 'Expected the structural root view to expose at least one first-layer child view.');

    const expandableBranch = topLevelViews
        .map(parent => ({ parent, children: deriveChildViews(parent, elementsById, viewsById) }))
        .find(candidate => candidate.children.length > 0);

    assert(
        expandableBranch,
        'Expected at least one first-layer child view to expose a deeper child view for drilldown coverage.',
    );

    const commands = await vscode.commands.getCommands(true);
    assert(
        commands.includes(COMMAND_ID),
        `Missing VS Code command ${COMMAND_ID}. Coding/Repair must register it before ${TESTCASE} can pass.`,
    );

    const initialSnapshot = await vscode.commands.executeCommand(COMMAND_ID, {
        graphPath,
        action: 'open',
        mode: 'test',
        testcase: TESTCASE,
    });

    assert(initialSnapshot && Array.isArray(initialSnapshot.visibleViews), 'Expected the explorer command to return a snapshot with visibleViews.');

    const initialVisibleIds = new Set(initialSnapshot.visibleViews.map(view => view.viewId));
    const expectedTopLevelIds = topLevelViews.map(view => view.view_id);

    assert.deepStrictEqual(
        [...initialVisibleIds].sort(),
        [...expectedTopLevelIds].sort(),
        'Initial explorer snapshot must expose only the structural first-layer child views.',
    );

    const nestedChild = expandableBranch.children[0];
    assert(
        !initialVisibleIds.has(nestedChild.view_id),
        'Initial explorer snapshot must not eagerly reveal nested child views before drilldown.',
    );

    const expandedSnapshot = await vscode.commands.executeCommand(COMMAND_ID, {
        graphPath,
        action: 'expand-path',
        targetViewId: expandableBranch.parent.view_id,
        mode: 'test',
        testcase: TESTCASE,
    });

    assert(expandedSnapshot && Array.isArray(expandedSnapshot.visibleViews), 'Expected the expanded explorer snapshot to return visibleViews.');

    const expandedVisibleIds = new Set(expandedSnapshot.visibleViews.map(view => view.viewId));
    assert(expandedVisibleIds.has(expandableBranch.parent.view_id), 'Expanded snapshot must still contain the selected first-layer view.');
    assert(expandedVisibleIds.has(nestedChild.view_id), 'Expanded snapshot must reveal the selected child path after drilldown.');
}

module.exports = { run };

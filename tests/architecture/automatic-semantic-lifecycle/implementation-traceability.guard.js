const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const graph = JSON.parse(read('design/KG/SystemArchitecture.json'));
const handoff = JSON.parse(read('.argo/temp/ImplementationToCodingHandoff.json'));
const expected = new Map([
  ['ExplicitAcceptanceTestcase-BP-AUTOALIGN-WRITE-ALIGNED', 'tests/explicit/entries/runMutationIndexLifecycle.js'],
  ['ExplicitAcceptanceTestcase-BP-AUTOALIGN-WRITE-FAILURE-NOT-COMPLETE', 'tests/explicit/entries/runMutationIndexLifecycle.js'],
  ['ExplicitAcceptanceTestcase-BP-AUTOALIGN-QUERY-AUTOALIGN', 'tests/explicit/entries/runProductionSemanticReadinessGate.js'],
  ['ExplicitAcceptanceTestcase-BP-AUTOALIGN-QUERY-FAILS-CLOSED', 'tests/explicit/entries/runProductionSemanticReadinessGate.js'],
  ['ExplicitAcceptanceTestcase-BP-AUTOALIGN-AGENT-UNAWARE', 'tests/explicit/entries/runTypedMcpQueryContract.js'],
]);
const intentIds = new Set([
  'bp-autoalign-goal',
  'bp-autoalign-write-completion',
  'bp-autoalign-query-recovery',
  'bp-autoalign-automation-boundary',
  'bp-autoalign-diagnostic-requirement',
  'bp-autoalign-reliable-response',
]);

// GIVEN accepted BP-AUTOALIGN intent mappings
// WHEN graph testcase paths and the handoff are inspected
// THEN every scoped testcase has one exact frozen physical entrypoint
const graphCases = new Map();
for (const element of graph.elements || []) {
  if (intentIds.has(element.id)) {
    assert(element.description, `SEMANTIC_LIFECYCLE_INTENT_DESCRIPTION_MISSING:${element.id}`);
  }
  for (const testcase of element.testcases || []) {
    graphCases.set(testcase.name, testcase.acceptanceCriteria);
  }
}
for (const [name, entryPath] of expected) {
  assert.strictEqual(
    graphCases.get(name),
    entryPath,
    `SEMANTIC_LIFECYCLE_GRAPH_ENTRYPOINT_MISMATCH:${name}`,
  );
  const handoffEntry = handoff.explicitEntrypoints.find(entry => entry.testcaseName === name);
  assert(handoffEntry, `SEMANTIC_LIFECYCLE_HANDOFF_ENTRY_MISSING:${name}`);
  assert.strictEqual(handoffEntry.entryPath, entryPath, `SEMANTIC_LIFECYCLE_HANDOFF_PATH_MISMATCH:${name}`);
  assert(handoff.frozenFiles.includes(entryPath), `SEMANTIC_LIFECYCLE_ENTRY_NOT_FROZEN:${name}`);
}

for (const intentId of intentIds) {
  assert(
    graph.elements.some(element => element.id === intentId),
    `SEMANTIC_LIFECYCLE_INTENT_ELEMENT_MISSING:${intentId}`,
  );
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

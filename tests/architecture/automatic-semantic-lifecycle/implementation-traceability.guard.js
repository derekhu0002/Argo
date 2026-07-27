const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const graph = JSON.parse(read('design/KG/SystemArchitecture.json'));
const handoff = JSON.parse(read('.argo/temp/ImplementationToCodingHandoff.json'));
const expected = new Map([
  ['ExplicitAcceptanceTestcase-SP-05-NewProjectJourney', 'tests/explicit/entries/runNewProjectSemanticOperatorJourney.js'],
  ['ExplicitAcceptanceTestcase-SP-01-FullBackfill', 'tests/explicit/entries/runProductionSemanticBackfill.js'],
  ['ExplicitAcceptanceTestcase-SP-02-PersistentProjection', 'tests/explicit/entries/runPersistentSemanticProjectionLifecycle.js'],
  ['ExplicitAcceptanceTestcase-DT-16', 'tests/explicit/entries/runMutationIndexLifecycle.js'],
  ['ExplicitAcceptanceTestcase-DT-16-SemanticIndex', 'tests/explicit/entries/runMutationIndexLifecycle.js'],
  ['ExplicitAcceptanceTestcase-W3-1-MutationEmbeddingVectorE2E', 'tests/explicit/entries/runApplyMutationEmbeddingVectorE2E.js'],
  ['ExplicitAcceptanceTestcase-SP-03-DefaultVectorRetrieval', 'tests/explicit/entries/runDefaultMcpNeo4jVectorRetrieval.js'],
  ['ExplicitAcceptanceTestcase-SP-04-FailClosedReadiness', 'tests/explicit/entries/runProductionSemanticReadinessGate.js'],
  ['ExplicitAcceptanceTestcase-TS-00', 'tests/explicit/entries/runTypedMcpQueryContract.js'],
]);
const intentIds = new Set([
  'semprod-operator-journey-process',
  'semprod-backfill-control',
  'semprod-persistent-projection-requirement',
  'grag-index-lifecycle',
  'grag-wp-3-1',
  'semprod-default-vector-retrieval',
  'semprod-readiness-requirement',
  'grag-query-service',
  'grag-mcp-interface',
]);

// GIVEN accepted intent mappings
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

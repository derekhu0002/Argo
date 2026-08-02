const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const graph = JSON.parse(read('design/KG/SystemArchitecture.json'));
const root = read('OVERALL_ARCHITECTURE.md');
const local = read('.argo/scripts/graph-rag/semantic-persistence/ARCHITECTURE.md');
const handoff = JSON.parse(read('.argo/temp/ImplementationToCodingHandoff.json'));
const elements = new Map(graph.elements.map(element => [element.id, element]));
const requiredMappings = new Map([
  ['semprod-backfill-control', 'tests/explicit/entries/runProductionSemanticBackfill.js'],
  ['semprod-persistent-projection-requirement', 'tests/explicit/entries/runPersistentSemanticProjectionLifecycle.js'],
]);

// GIVEN the approved WP-P1 intent anchors and implementation contracts
for (const intentId of [
  'semprod-backfill-control',
  'semprod-persistent-projection-requirement',
  'grag-semantic-index',
  'grag-index-lifecycle',
  'grag-embedding-provider-adapter',
]) {
  // WHEN direct implements mappings are inspected
  // THEN every scoped anchor is present in the graph and root contract
  assert(elements.has(intentId), `WP_P1_TRACEABILITY_GUARD: graph omits ${intentId}`);
  assert(root.includes(`\`${intentId}\``), `WP_P1_TRACEABILITY_GUARD: root mapping omits ${intentId}`);
}

for (const [intentId, entryPath] of requiredMappings) {
  const testcasePaths = (elements.get(intentId).testcases || []).map(testcase => testcase.acceptanceCriteria);
  assert(testcasePaths.includes(entryPath), `WP_P1_TRACEABILITY_GUARD: ${intentId} does not mount ${entryPath}`);
  assert(fs.existsSync(path.join(repoRoot, ...entryPath.split('/'))), `WP_P1_TRACEABILITY_GUARD: missing ${entryPath}`);
  assert(local.includes(entryPath), `WP_P1_TRACEABILITY_GUARD: local contract does not own ${entryPath}`);
}

for (const baselineEvidence of [
  'tests/explicit/entries/runProductionSemanticBackfill.js',
  'tests/explicit/entries/runPersistentSemanticProjectionLifecycle.js',
  '.argo/scripts/graph-rag/semantic-persistence/productionSemanticBackfill.js',
  '.argo/scripts/graph-rag/semantic-persistence/productionSemanticCheckpointStore.js',
  '.argo/scripts/graph-rag/semantic-persistence/productionSemanticNeo4jAdapter.js',
  '.argo/scripts/graph-rag/semantic-persistence/productionSemanticProjectionStore.js',
]) {
  assert(
    handoff.frozenFiles.includes(baselineEvidence),
    `WP_P1_TRACEABILITY_GUARD: current handoff does not freeze ${baselineEvidence}`,
  );
}
assert.strictEqual(
  handoff.expectedFailureRecordsPath,
  'design/KG/test-failure-records.json',
  'WP_P1_TRACEABILITY_GUARD: current handoff changed the runner failure-record authority',
);

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

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

const handoffEvidence = JSON.stringify(handoff);
for (const baselineEvidence of [
  '40 total / 38 passed / 2 expected RED',
  '21 runner-owned delivery transitions',
  '40 total / 39 passed / 1 expected RED',
  '2 runner-owned delivery transitions',
  'SP01_DEFAULT_MCP_PRODUCTION_COMPOSITION_MISSING',
  'productionGraphRagRuntime.runSemanticBackfill is required',
  '4e01094b56429991b32b0826968da0bea9f93b0e',
  'grag-consumer-role',
  'grag-consumption-process',
  'grag-query-service',
  'grag-mode-validation',
  'grag-seed-retrieval',
  'grag-purpose-closure',
  'grag-intent-decision-policy',
  'grag-implementation-policy',
  'grag-repair-policy',
  'grag-audit-policy',
  'grag-graph-tidy-policy',
  'grag-endpoint-closure',
  'grag-view-closure',
  'grag-provenance',
  'grag-index-lifecycle',
  'grag-mcp-interface',
  'grag-credential-boundary',
  'grag-embedding-provider-adapter',
  'grag-embedding-generation',
  'semprod-backfill-control',
  'semprod-persistent-projection-requirement',
]) {
  assert(
    handoffEvidence.includes(baselineEvidence),
    `WP_P1_TRACEABILITY_GUARD: handoff baseline omits ${baselineEvidence}`,
  );
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

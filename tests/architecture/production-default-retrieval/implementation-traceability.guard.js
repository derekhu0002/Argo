const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const graph = JSON.parse(read('design/KG/SystemArchitecture.json'));
const codingHandoff = JSON.parse(read('.argo/temp/ImplementationToCodingHandoff.json'));
const root = read('OVERALL_ARCHITECTURE.md');
const elements = new Map(graph.elements.map(element => [element.id, element]));
const expectedScope = [
  'semprod-default-vector-retrieval',
  'semprod-readiness-requirement',
  'grag-query-service',
  'grag-mcp-interface',
  'grag-native-retrieval-service',
  'grag-seed-retrieval',
  'grag-purpose-closure',
];
const expectedEntrypoints = new Map([
  ['semprod-default-vector-retrieval', 'tests/explicit/entries/runDefaultMcpNeo4jVectorRetrieval.js'],
  ['semprod-readiness-requirement', 'tests/explicit/entries/runProductionSemanticReadinessGate.js'],
]);

// GIVEN the delivered WP-P2 graph mappings and current successor handoff
// WHEN scope, mounted paths, contracts, and physical artifacts are inspected
// THEN every WP-P2 anchor and entry remains mounted, present, and frozen
for (const intentId of expectedScope) {
  assert(elements.has(intentId), `WP_P2_TRACEABILITY_GUARD: graph omits ${intentId}`);
  assert(root.includes(`\`${intentId}\``), `WP_P2_TRACEABILITY_GUARD: root mapping omits ${intentId}`);
}
for (const [intentId, entryPath] of expectedEntrypoints) {
  const mounted = (elements.get(intentId).testcases || []).map(testcase => testcase.acceptanceCriteria);
  assert(mounted.includes(entryPath), `WP_P2_TRACEABILITY_GUARD: ${intentId} does not mount ${entryPath}`);
  assert(fs.existsSync(path.join(repoRoot, ...entryPath.split('/'))), `WP_P2_TRACEABILITY_GUARD: missing ${entryPath}`);
  assert(
    codingHandoff.frozenFiles.includes(entryPath),
    `WP_P2_TRACEABILITY_GUARD: current handoff does not freeze ${entryPath}`,
  );
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const graph = JSON.parse(read('design/KG/SystemArchitecture.json'));
const intentHandoff = JSON.parse(read('.argo/temp/IntentToImplementationHandoff.json'));
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

// GIVEN the authoritative corrected WP-P2 intent handoff
// WHEN scope, mounted paths, contracts, and physical artifacts are inspected
// THEN traceability remains exactly seven elements and SP-05/WP-P3 stays unmounted
assert.deepStrictEqual(intentHandoff.intentElementIds, expectedScope, 'WP_P2_TRACEABILITY_GUARD: seven-element scope changed');
for (const intentId of expectedScope) {
  assert(elements.has(intentId), `WP_P2_TRACEABILITY_GUARD: graph omits ${intentId}`);
  assert(root.includes(`\`${intentId}\``), `WP_P2_TRACEABILITY_GUARD: root mapping omits ${intentId}`);
}
for (const [intentId, entryPath] of expectedEntrypoints) {
  const mounted = (elements.get(intentId).testcases || []).map(testcase => testcase.acceptanceCriteria);
  assert(mounted.includes(entryPath), `WP_P2_TRACEABILITY_GUARD: ${intentId} does not mount ${entryPath}`);
  assert(fs.existsSync(path.join(repoRoot, ...entryPath.split('/'))), `WP_P2_TRACEABILITY_GUARD: missing ${entryPath}`);
  assert(
    codingHandoff.explicitEntrypoints.some(entry => entry.testcaseName.includes(intentId === 'semprod-default-vector-retrieval' ? 'SP-03' : 'SP-04') && entry.entryPath === entryPath),
    `WP_P2_TRACEABILITY_GUARD: Coding handoff omits ${entryPath}`,
  );
}

const wp3 = elements.get('semprod-operator-journey-process');
assert(wp3, 'WP_P2_TRACEABILITY_GUARD: preserved WP-P3 owner is missing');
assert.deepStrictEqual(wp3.testcases || [], [], 'WP_P2_TRACEABILITY_GUARD: SP-05 was mounted');
assert(
  !fs.existsSync(path.join(repoRoot, 'tests', 'explicit', 'entries', 'runNewProjectSemanticOperatorJourney.js')),
  'WP_P2_TRACEABILITY_GUARD: WP-P3 entrypoint was created',
);

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

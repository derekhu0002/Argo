const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const graph = JSON.parse(read('design/KG/SystemArchitecture.json'));
const rootContract = read('OVERALL_ARCHITECTURE.md');
const handoff = JSON.parse(read('.argo/temp/ImplementationToCodingHandoff.json'));

const expectedMappings = new Map([
  ['ExplicitAcceptanceTestcase-BP-MCP-SEM-REQ', 'tests/explicit/entries/runMcpSemanticQueryContract.js#reject-response-shape-controls'],
  ['ExplicitAcceptanceTestcase-BP-MCP-SEM-COMPAT', 'tests/explicit/entries/runMcpSemanticQueryContract.js#preserve-full-snapshot-read-modes'],
  ['ExplicitAcceptanceTestcase-BP-MCP-SEM-PAYLOAD', 'tests/explicit/entries/runMcpSemanticQueryContract.js#canonical-object-subset-only'],
  ['ExplicitAcceptanceTestcase-BP-MCP-SEM-ELEMENT', 'tests/explicit/entries/runMcpSemanticQueryContract.js#element-hit-no-neighbor-expansion'],
  ['ExplicitAcceptanceTestcase-BP-MCP-SEM-REL', 'tests/explicit/entries/runMcpSemanticQueryContract.js#relationship-endpoint-closure'],
  ['ExplicitAcceptanceTestcase-BP-MCP-SEM-BROKEN-REL', 'tests/explicit/entries/runMcpSemanticQueryContract.js#broken-relationship-endpoint-rejection'],
  ['ExplicitAcceptanceTestcase-BP-MCP-SEM-VIEW', 'tests/explicit/entries/runMcpSemanticQueryContract.js#view-membership-closure'],
  ['ExplicitAcceptanceTestcase-BP-MCP-SEM-NOCASCADE', 'tests/explicit/entries/runMcpSemanticQueryContract.js#no-overlapping-view-cascade'],
  ['ExplicitAcceptanceTestcase-BP-MCP-SEM-BROKEN-VIEW', 'tests/explicit/entries/runMcpSemanticQueryContract.js#broken-view-reference-rejection'],
]);
const requiredIntentIds = [
  'grag-mode-validation',
  'grag-query-service',
  'grag-canonical-graph',
  'grag-endpoint-closure',
  'grag-view-closure',
];

// GIVEN the approved graph-mounted explicit acceptance testcase boundaries
const mounted = new Map();
for (const element of graph.elements || []) {
  for (const testcase of element.testcases || []) {
    mounted.set(testcase.name, testcase.acceptanceCriteria);
  }
}

// WHEN traceability is inspected
// THEN graph, contract, handoff, and physical entrypoints agree exactly.
for (const intentId of requiredIntentIds) {
  assert(
    rootContract.includes(`\`${intentId}\``),
    `MCP_SEMANTIC_TRACEABILITY_GUARD: root contract omits ${intentId}`,
  );
}

for (const [testcaseName, entryPath] of expectedMappings) {
  assert.strictEqual(
    mounted.get(testcaseName),
    entryPath,
    `MCP_SEMANTIC_TRACEABILITY_GUARD: ${testcaseName} is not mounted at ${entryPath}`,
  );
  assert(
    handoff.explicitEntrypoints.some(entry => entry.testcaseName === testcaseName && entry.entryPath === entryPath),
    `MCP_SEMANTIC_TRACEABILITY_GUARD: handoff omits ${testcaseName}`,
  );
  const physicalPath = entryPath.split('#')[0];
  assert(
    handoff.frozenFiles.includes(physicalPath),
    `MCP_SEMANTIC_TRACEABILITY_GUARD: handoff frozenFiles omits ${physicalPath}`,
  );
  assert(
    fs.existsSync(path.join(repoRoot, ...physicalPath.split('/'))),
    `MCP_SEMANTIC_TRACEABILITY_GUARD: missing physical entrypoint ${physicalPath}`,
  );
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

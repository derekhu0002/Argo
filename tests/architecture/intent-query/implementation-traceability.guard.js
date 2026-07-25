const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const graph = readJson('design/KG/SystemArchitecture.json');
const rootContract = readText('OVERALL_ARCHITECTURE.md');
const requiredIntentIds = [
  'grag-query-service',
  'grag-canonical-graph',
  'grag-query-request',
  'grag-mode-validation',
  'grag-graph-tidy-policy',
  'grag-consumer-role',
  'grag-consumption-process',
  'grag-purpose-closure',
  'grag-intent-decision-policy',
  'grag-implementation-policy',
  'grag-repair-policy',
  'grag-audit-policy',
  'grag-coherent-context',
  'grag-endpoint-closure',
  'grag-view-closure',
  'grag-provenance',
];
const requiredEntrypoints = new Set([
  'tests/explicit/entries/runGraphQueryCompatibility.js',
  'tests/explicit/entries/runCanonicalGraphFullSnapshot.js',
  'tests/explicit/entries/runCanonicalProjectionAuthority.js',
  'tests/explicit/entries/runQueryPurposeValidation.js',
  'tests/explicit/entries/runGraphTidyFullSnapshot.js',
  'tests/explicit/entries/runPurposePolicyClosure.js',
  'tests/explicit/entries/runIntentDecisionClosure.js',
  'tests/explicit/entries/runImplementationDesignClosure.js',
  'tests/explicit/entries/runCodingRepairClosure.js',
  'tests/explicit/entries/runAuditProofClosure.js',
  'tests/explicit/entries/runCoherentIntentReading.js',
  'tests/explicit/entries/runRelationshipEndpointClosure.js',
  'tests/explicit/entries/runCompleteViewClosure.js',
  'tests/explicit/entries/runFirstInclusionProvenance.js',
]);

// GIVEN the seven intent anchors, root contract, and mounted testcases
const graphElements = new Map((graph.elements || []).map(element => [element.id, element]));

// WHEN implementation traceability is inspected
// THEN every scope element is contracted and every mounted entrypoint is physical
for (const intentId of requiredIntentIds) {
  assert(graphElements.has(intentId), `IMPLEMENTATION_TRACEABILITY_GUARD: missing intent element ${intentId}`);
  assert(rootContract.includes(`\`${intentId}\``), `IMPLEMENTATION_TRACEABILITY_GUARD: root contract omits ${intentId}`);
}

const mountedEntrypoints = new Set(
  requiredIntentIds.flatMap(intentId => (graphElements.get(intentId).testcases || [])
    .map(testcase => testcase.acceptanceCriteria)),
);
assert.deepStrictEqual(
  mountedEntrypoints,
  requiredEntrypoints,
  'IMPLEMENTATION_TRACEABILITY_GUARD: mounted testcase paths must match the frozen W5/W6 entrypoints',
);
for (const entryPath of requiredEntrypoints) {
  assert(
    fs.existsSync(path.join(repoRoot, ...entryPath.split('/'))),
    `IMPLEMENTATION_TRACEABILITY_GUARD: missing physical entrypoint ${entryPath}`,
  );
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function readText(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

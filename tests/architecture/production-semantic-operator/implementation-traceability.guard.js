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
  'semprod-operator-journey-process',
  'grag-query-service',
  'grag-credential-boundary',
];
const entryPath = 'tests/explicit/entries/runNewProjectSemanticOperatorJourney.js';

// GIVEN the corrected, independently audited WP-P3 intent handoff
// WHEN implementation-bearing anchors, mounted path, release context, and mappings are read
// THEN exactly SP-05 owns executable WP-P3 behavior and plateau/package remain context-only
assert.deepStrictEqual(
  intentHandoff.intentElementIds,
  expectedScope,
  'WP_P3_TRACEABILITY_GUARD: implementation-bearing scope changed',
);
for (const intentId of expectedScope) {
  assert(elements.has(intentId), `WP_P3_TRACEABILITY_GUARD: graph omits ${intentId}`);
  assert(root.includes(`\`${intentId}\``), `WP_P3_TRACEABILITY_GUARD: root mapping omits ${intentId}`);
}

const owner = elements.get('semprod-operator-journey-process');
const testcase = (owner.testcases || []).find(
  item => item.name === 'ExplicitAcceptanceTestcase-SP-05-NewProjectJourney',
);
assert(testcase, 'WP_P3_TRACEABILITY_GUARD: SP-05 is not mounted on the operator journey');
assert.strictEqual(
  testcase.acceptanceCriteria,
  entryPath,
  'WP_P3_TRACEABILITY_GUARD: SP-05 physical path changed',
);
assert(
  fs.existsSync(path.join(repoRoot, ...entryPath.split('/'))),
  'WP_P3_TRACEABILITY_GUARD: SP-05 physical entrypoint missing',
);
assert(
  codingHandoff.explicitEntrypoints.some(
    item => item.testcaseName === testcase.name && item.entryPath === entryPath,
  ),
  'WP_P3_TRACEABILITY_GUARD: Coding handoff omits exact SP-05 entrypoint',
);

for (const contextId of ['semprod-ready-plateau', 'semprod-wp-operator-release']) {
  const context = elements.get(contextId);
  assert(context, `WP_P3_TRACEABILITY_GUARD: release context omits ${contextId}`);
  assert.deepStrictEqual(
    context.testcases || [],
    [],
    `WP_P3_TRACEABILITY_GUARD: context-only ${contextId} gained executable testcase ownership`,
  );
  assert(
    !codingHandoff.codingTargets.some(target => target.testcaseName === contextId),
    `WP_P3_TRACEABILITY_GUARD: context-only ${contextId} entered Coding authorization`,
  );
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

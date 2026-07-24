const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const handoff = readJson('.argo/temp/ImplementationToCodingHandoff.json');
const graph = readJson('design/KG/SystemArchitecture.json');
const failureRecords = readJson(handoff.expectedFailureRecordsPath);
const guardPath = 'tests/architecture/production-graph-rag/scoped-delivery-attribution.guard.js';
const scopeText = JSON.stringify({
  codingTargets: handoff.codingTargets,
  tasks: handoff.taskExecutionPlan.tasks,
});
const credentialElement = graph.elements.find(element => element.id === 'grag-credential-boundary');
const mountedTs07 = credentialElement && credentialElement.testcases.find(
  testcase => testcase.name === 'ExplicitAcceptanceTestcase-TS-07',
);
const handoffTs07 = handoff.explicitEntrypoints.find(
  testcase => testcase.testcaseName === 'ExplicitAcceptanceTestcase-TS-07',
);
const handoffTs08 = handoff.explicitEntrypoints.find(
  testcase => testcase.testcaseName === 'ExplicitAcceptanceTestcase-TS-08',
);
const outOfScopeTs09 = (handoff.outOfScopeFailureEvidence || []).find(
  testcase => testcase.testcaseName === 'ExplicitAcceptanceTestcase-TS-09-EmbeddingProviderAdapter',
);
const finalTask = handoff.taskExecutionPlan.tasks.find(task => task.taskId === 'W2-C7');

// GIVEN committed TS-07 intent evidence and its physicalized handoff entrypoint
assert(credentialElement, 'SCOPED_DELIVERY_ATTRIBUTION_GUARD: credential intent anchor is missing');
assert(mountedTs07, 'SCOPED_DELIVERY_ATTRIBUTION_GUARD: mounted TS-07 evidence is missing');
assert.strictEqual(
  mountedTs07.acceptanceCriteria,
  'tests/explicit/entries/runExternalCredentialBoundary.js',
  'SCOPED_DELIVERY_ATTRIBUTION_GUARD: mounted TS-07 entrypoint drifted',
);
assert(handoffTs07, 'SCOPED_DELIVERY_ATTRIBUTION_GUARD: handoff TS-07 evidence is missing');
assert.strictEqual(
  handoffTs07.entryPath,
  mountedTs07.acceptanceCriteria,
  'SCOPED_DELIVERY_ATTRIBUTION_GUARD: TS-07 handoff path differs from mounted evidence',
);
assert.strictEqual(
  handoffTs07.initialExecutionStatus,
  'passed',
  'SCOPED_DELIVERY_ATTRIBUTION_GUARD: TS-07 scoped evidence is not passed',
);
assert.strictEqual(
  handoffTs08 && handoffTs08.failureReason,
  'TS08_GATE_CATEGORY_MISSING',
  'SCOPED_DELIVERY_ATTRIBUTION_GUARD: TS-08 handoff failure category is stale',
);
assert.strictEqual(
  outOfScopeTs09 && outOfScopeTs09.failureReason,
  'TS09_NODE_ADAPTER_REQUIRED',
  'SCOPED_DELIVERY_ATTRIBUTION_GUARD: TS-09 out-of-scope failure category is stale',
);
assert.strictEqual(
  outOfScopeTs09 && outOfScopeTs09.evidenceSource,
  handoff.expectedFailureRecordsPath,
  'SCOPED_DELIVERY_ATTRIBUTION_GUARD: TS-09 evidence source must be runner records',
);
assert(
  !handoff.explicitEntrypoints.some(
    testcase => testcase.testcaseName === 'ExplicitAcceptanceTestcase-TS-09-EmbeddingProviderAdapter',
  ),
  'SCOPED_DELIVERY_ATTRIBUTION_GUARD: uncommitted TS-09 mount entered explicit handoff entries',
);

// GIVEN the latest committed runner records and runner-owned global delivery evidence
assert(
  !failureRecords.some(record => record.testcasename === 'ExplicitAcceptanceTestcase-TS-07'),
  'SCOPED_DELIVERY_ATTRIBUTION_GUARD: latest runner records still contain TS-07 failure',
);
assertFailureCategory('ExplicitAcceptanceTestcase-TS-08', 'TS08_GATE_CATEGORY_MISSING');
assertFailureCategory(
  'ExplicitAcceptanceTestcase-TS-09-EmbeddingProviderAdapter',
  'TS09_NODE_ADAPTER_REQUIRED',
);
assert.strictEqual(
  attributeValue(credentialElement, 'deliveryStatus'),
  'not_delivered',
  'SCOPED_DELIVERY_ATTRIBUTION_GUARD: committed runner-owned credential baseline changed',
);

// WHEN resumed Coding evaluates this slice's completion
// THEN scoped evidence is accepted without claiming or editing global delivery status
assert(
  handoff.taskExecutionPlan.executionStrategy.toLowerCase().includes('scoped completion'),
  'SCOPED_DELIVERY_ATTRIBUTION_GUARD: execution strategy must distinguish scoped completion',
);
assert(finalTask, 'SCOPED_DELIVERY_ATTRIBUTION_GUARD: resumed Coding finalization task is missing');
for (const evidence of [
  '6/6 scoped explicit entrypoints',
  '7/7 critical guards',
  '0 delivered-to-not_delivered regression',
  'TS-07',
  'global grag-credential-boundary remains runner-owned',
]) {
  assert(
    finalTask.completionSignal.includes(evidence),
    `SCOPED_DELIVERY_ATTRIBUTION_GUARD: final completion omits ${evidence}`,
  );
}
assert(
  !finalTask.completionSignal.includes('five scoped intent anchors delivered'),
  'SCOPED_DELIVERY_ATTRIBUTION_GUARD: slice completion cannot require five global delivered anchors',
);

// THEN attribution itself is frozen and cannot authorize out-of-scope implementation
assert(
  handoff.frozenFiles.includes(guardPath),
  'SCOPED_DELIVERY_ATTRIBUTION_GUARD: attribution guard is not frozen',
);
assert(
  handoff.criticalNonExplicitTests.some(test => (
    test.path === guardPath && test.kind === 'KeyImplementationTraceabilityGuard'
  )),
  'SCOPED_DELIVERY_ATTRIBUTION_GUARD: attribution guard is not critical traceability evidence',
);
assert(
  !scopeText.includes('ExplicitAcceptanceTestcase-TS-09-EmbeddingProviderAdapter'),
  'SCOPED_DELIVERY_ATTRIBUTION_GUARD: TS-09 entered authorized task scope',
);
assert(
  !/(?:embedding-provider-adapter|embeddingProviderAdapter|index-lifecycle|indexLifecycle|generateAffectedEmbeddings)/i.test(scopeText),
  'SCOPED_DELIVERY_ATTRIBUTION_GUARD: adapter/lifecycle implementation entered authorized scope',
);

function assertFailureCategory(testcaseName, category) {
  const record = failureRecords.find(candidate => candidate.testcasename === testcaseName);
  assert(record, `SCOPED_DELIVERY_ATTRIBUTION_GUARD: missing runner record for ${testcaseName}`);
  assert(
    record.failureError.includes(category),
    `SCOPED_DELIVERY_ATTRIBUTION_GUARD: ${testcaseName} does not report ${category}`,
  );
}

function attributeValue(element, name) {
  const attribute = (element.attributes || []).find(candidate => candidate.name === name);
  return attribute && attribute.value;
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8'));
}

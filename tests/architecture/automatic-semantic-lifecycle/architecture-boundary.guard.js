const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const root = read('OVERALL_ARCHITECTURE.md');
const scripts = read('.argo/scripts/ARCHITECTURE.md');
const graphRag = read('.argo/scripts/graph-rag/ARCHITECTURE.md');
const persistence = read('.argo/scripts/graph-rag/semantic-persistence/ARCHITECTURE.md');
const tests = read('tests/ARCHITECTURE.md');
const handoff = JSON.parse(read('.argo/temp/ImplementationToCodingHandoff.json'));
const contractText = [root, scripts, graphRag, persistence, tests].join('\n');

// GIVEN the accepted canonical semantic lifecycle successor
// WHEN root/local/test contracts and Coding authorization are inspected
// THEN the stable boundary is explicit and production behavior remains Coding-owned
for (const required of [
  'canonical argo init',
  'ARGO_LIVE_PROVIDER_E2E',
  'ARGO_W31_LIVE_MUTATION_VECTOR_E2E',
  'no third',
  'structural-only',
  'exact touched',
  'upsert',
  'tombstone',
  'queryability',
  'global coherence',
  'fullSnapshotFallback: false',
  'getSystemArchitecture',
  'test-only',
  'code-complete',
  'live-release',
  'authoritative minimal',
  'supersedes',
  'defaultSemanticRetrieval.js',
  'readinessBoundary',
  'threshold filtering',
  'window exhaustion',
  'actionable redacted',
]) {
  assert(
    contractText.toLowerCase().includes(required.toLowerCase()),
    `SEMANTIC_LIFECYCLE_ARCHITECTURE_BOUNDARY_MISSING:${required}`,
  );
}

assert(
  handoff.codingTargets.every(target => target.path && target.path.startsWith('.argo/scripts/')),
  'SEMANTIC_LIFECYCLE_ARCHITECTURE_BOUNDARY_TEST_FILE_AUTHORIZED',
);
assert.deepStrictEqual(
  handoff.codingTargets.map(target => target.path).sort(),
  [
    '.argo/scripts/argo-mcp-server.js',
    '.argo/scripts/systemarchitecture-mcp-server.js',
    '.argo/scripts/graph-rag/semanticOperatorJourney.js',
  ].sort(),
  'SEMANTIC_LIFECYCLE_ARCHITECTURE_TARGET_SET_CONFLICT',
);
assert(
  handoff.frozenFiles.includes('design/KG/SystemArchitecture.json'),
  'SEMANTIC_LIFECYCLE_ARCHITECTURE_BOUNDARY_INTENT_NOT_FROZEN',
);
assert(
  handoff.frozenFiles.includes('tests/harness/automaticSemanticLifecycleHarness.js'),
  'SEMANTIC_LIFECYCLE_ARCHITECTURE_BOUNDARY_HARNESS_NOT_FROZEN',
);

const passingEntrypoints = new Set(
  handoff.explicitEntrypoints
    .filter(entry => entry.initialExecutionStatus === 'passed')
    .map(entry => entry.entryPath),
);
const failedEntrypoints = handoff.explicitEntrypoints.filter(
  entry => entry.initialExecutionStatus === 'failed',
);
assert.strictEqual(
  passingEntrypoints.size,
  7,
  'SEMANTIC_LIFECYCLE_HANDOFF_PASSING_ENTRYPOINT_BASELINE_STALE',
);
assert.deepStrictEqual(
  failedEntrypoints.map(entry => entry.testcaseName).sort(),
  [
    'ExplicitAcceptanceTestcase-SP-05-NewProjectJourney',
  ],
  'SEMANTIC_LIFECYCLE_HANDOFF_EXPECTED_RED_SET_STALE',
);
assert(
  handoff.explicitEntrypoints
    .filter(entry => entry.initialExecutionStatus === 'passed')
    .every(entry => !Object.hasOwn(entry, 'failureReason')),
  'SEMANTIC_LIFECYCLE_HANDOFF_PASSING_ENTRYPOINT_RETAINS_FAILURE',
);
assert.deepStrictEqual(
  failedEntrypoints.map(entry => entry.failureReason),
  [
    'SP05_DISABLED_DURABLE_READINESS_NOT_FAIL_CLOSED',
  ],
  'SEMANTIC_LIFECYCLE_HANDOFF_EXPECTED_RED_SIGNAL_STALE',
);

const integrationGuard = handoff.criticalNonExplicitTests.find(
  test => test.path.endsWith('/integration-control-points.guard.js'),
);
assert.strictEqual(
  integrationGuard && integrationGuard.expectedStatus,
  'passed',
  'SEMANTIC_LIFECYCLE_HANDOFF_INTEGRATION_STATUS_STALE',
);
assert(
  handoff.criticalNonExplicitTests
    .every(test => test.expectedStatus === 'passed'),
  'SEMANTIC_LIFECYCLE_HANDOFF_GUARD_NOT_GREEN',
);

for (const target of handoff.codingTargets) {
  assert(
    target.failureSignal.includes('SP05_DISABLED_DURABLE_READINESS_NOT_FAIL_CLOSED'),
    `SEMANTIC_LIFECYCLE_HANDOFF_TARGET_SIGNAL_STALE:${target.path}`,
  );
  assert(
    target.nextAction.includes('same durable record')
      || target.nextAction.includes('exact safe reconciliation message'),
    `SEMANTIC_LIFECYCLE_HANDOFF_TARGET_ACTION_STALE:${target.path}`,
  );
}
const correctionTask = handoff.taskExecutionPlan.tasks.find(
  task => task.taskId === 'CSL-C6',
);
assert.strictEqual(
  correctionTask && correctionTask.status,
  'pending',
  'SEMANTIC_LIFECYCLE_HANDOFF_SP05_CORRECTION_TASK_MISSING',
);

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

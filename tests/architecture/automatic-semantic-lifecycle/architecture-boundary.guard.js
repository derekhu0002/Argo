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
    '.argo/scripts/graph-rag/mutationEmbeddingVectorLifecycle.js',
    '.argo/scripts/graph-rag/defaultSemanticRetrieval.js',
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
  6,
  'SEMANTIC_LIFECYCLE_HANDOFF_PASSING_ENTRYPOINT_BASELINE_STALE',
);
assert.deepStrictEqual(
  failedEntrypoints.map(entry => entry.testcaseName).sort(),
  [
    'ExplicitAcceptanceTestcase-SP-03-DefaultVectorRetrieval',
    'ExplicitAcceptanceTestcase-SP-04-FailClosedReadiness',
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
    'SP03_SYSTEM_UNIFIED_READINESS_BYPASSED_WP_P2',
    'SP04_SYSTEM_ACTIONABLE_FAILURE_EVIDENCE_CHANGED',
  ],
  'SEMANTIC_LIFECYCLE_HANDOFF_EXPECTED_RED_SIGNAL_STALE',
);

const integrationGuard = handoff.criticalNonExplicitTests.find(
  test => test.path.endsWith('/integration-control-points.guard.js'),
);
assert.strictEqual(
  integrationGuard && integrationGuard.expectedStatus,
  'failed',
  'SEMANTIC_LIFECYCLE_HANDOFF_INTEGRATION_RED_NOT_RECORDED',
);
assert(
  handoff.criticalNonExplicitTests
    .filter(test => test !== integrationGuard)
    .every(test => test.expectedStatus === 'passed'),
  'SEMANTIC_LIFECYCLE_HANDOFF_NON_INTEGRATION_GUARD_NOT_GREEN',
);

const completedTargetPaths = new Set([
  '.argo/scripts/argo-mcp-server.js',
  '.argo/scripts/graph-rag/semanticOperatorJourney.js',
  '.argo/scripts/graph-rag/mutationEmbeddingVectorLifecycle.js',
]);
for (const target of handoff.codingTargets.filter(item => completedTargetPaths.has(item.path))) {
  assert(
    target.failureSignal.startsWith('REGRESSION_ONLY:'),
    `SEMANTIC_LIFECYCLE_HANDOFF_COMPLETED_TARGET_SIGNAL_NOT_REGRESSION_ONLY:${target.path}`,
  );
  assert(
    target.nextAction.startsWith('No completed C'),
    `SEMANTIC_LIFECYCLE_HANDOFF_COMPLETED_TARGET_REIMPLEMENTATION_DIRECTIVE:${target.path}`,
  );
}
const obsoleteFailureSignals = [
  'SP05_CANONICAL_ARGO_INIT_LIFECYCLE_MISSING',
  'SP01_BACKFILL_TOOL_NOT_PRIVATE',
  'SP02_ACTUAL_MUTATION_TEST_COMPOSITION_MISSING',
  'DT16_ACTUAL_MUTATION_TEST_COMPOSITION_MISSING',
  'W31_ACTUAL_MUTATION_TEST_COMPOSITION_MISSING',
  'TS00_SYSTEM_SEMANTICDISABLED_READINESS_NOT_FRESH',
];
const codingAuthorization = JSON.stringify(handoff.codingTargets);
for (const obsolete of obsoleteFailureSignals) {
  assert(
    !codingAuthorization.includes(obsolete),
    `SEMANTIC_LIFECYCLE_HANDOFF_OBSOLETE_TARGET_FAILURE_SIGNAL:${obsolete}`,
  );
}
for (const task of handoff.taskExecutionPlan.tasks.filter(item => (
  ['CSL-C1', 'CSL-C2', 'CSL-C3'].includes(item.taskId)
))) {
  assert.strictEqual(task.status, 'completed', `SEMANTIC_LIFECYCLE_HANDOFF_TASK_STATUS_STALE:${task.taskId}`);
  assert(
    !JSON.stringify(task).includes('preserve current RED')
      && !JSON.stringify(task).includes('preserve actual-adapter controlled-composition RED'),
    `SEMANTIC_LIFECYCLE_HANDOFF_TASK_RETAINS_OBSOLETE_RED:${task.taskId}`,
  );
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

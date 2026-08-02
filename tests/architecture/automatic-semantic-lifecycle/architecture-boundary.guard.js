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

const EXPECTED_BP_TESTCASES = [
  'ExplicitAcceptanceTestcase-BP-AUTOALIGN-WRITE-ALIGNED',
  'ExplicitAcceptanceTestcase-BP-AUTOALIGN-WRITE-FAILURE-NOT-COMPLETE',
  'ExplicitAcceptanceTestcase-BP-AUTOALIGN-QUERY-AUTOALIGN',
  'ExplicitAcceptanceTestcase-BP-AUTOALIGN-QUERY-FAILS-CLOSED',
  'ExplicitAcceptanceTestcase-BP-AUTOALIGN-AGENT-UNAWARE',
];
const AUTHORIZED_TARGETS = [
  '.argo/scripts/argo-mcp-server.js',
  '.argo/scripts/systemarchitecture-mcp-server.js',
  '.argo/scripts/graph-rag/defaultSemanticRetrieval.js',
  '.argo/scripts/graph-rag/mutationEmbeddingVectorLifecycle.js',
  '.argo/scripts/graph-rag/semanticOperatorJourney.js',
];
const REQUIRED_FROZEN_FILES = [
  'design/KG/SystemArchitecture.json',
  'tests/explicit/entries/runBusinessReliableSemanticLifecycle.js',
  'tests/explicit/entries/runMutationIndexLifecycle.js',
  'tests/explicit/entries/runProductionSemanticReadinessGate.js',
  'tests/explicit/entries/runTypedMcpQueryContract.js',
  'tests/harness/automaticSemanticLifecycleHarness.js',
  'tests/harness/productionDefaultRetrievalHarness.js',
  'tests/architecture/automatic-semantic-lifecycle/architecture-boundary.guard.js',
  'tests/architecture/automatic-semantic-lifecycle/dependency-direction.guard.js',
  'tests/architecture/automatic-semantic-lifecycle/explicit-entrypoint-correctness.guard.js',
  'tests/architecture/automatic-semantic-lifecycle/implementation-traceability.guard.js',
  'tests/architecture/production-default-retrieval/architecture-boundary.guard.js',
  'tests/architecture/production-default-retrieval/dependency-direction.guard.js',
  '.argo/temp/bp-autoalign-expected-failures.json',
];

// GIVEN the accepted BP-AUTOALIGN semantic lifecycle successor
// WHEN root/local/test contracts and Coding authorization are inspected
// THEN the stable boundary is explicit and production behavior remains Coding-owned
for (const required of [
  'business completion',
  'businessComplete',
  'ordinary semantic queries',
  'aligns automatically',
  'one retry',
  'SEMANTIC_AUTO_ALIGNMENT_FAILED',
  'script-owned',
  'manual init/backfill/readiness',
  'queryability',
  'global coherence',
  'fullSnapshotFallback: false',
  'getSystemArchitecture',
  'defaultSemanticRetrieval.js',
  'actionable redacted',
]) {
  assert(
    contractText.toLowerCase().includes(required.toLowerCase()),
    `SEMANTIC_LIFECYCLE_ARCHITECTURE_BOUNDARY_MISSING:${required}`,
  );
}

const targetPaths = normalizedTargetPaths(handoff);
assert(targetPaths.every(target => target.startsWith('.argo/scripts/')), 'SEMANTIC_LIFECYCLE_ARCHITECTURE_BOUNDARY_TEST_FILE_AUTHORIZED');
assert.deepStrictEqual(
  targetPaths.sort(),
  AUTHORIZED_TARGETS.sort(),
  'SEMANTIC_LIFECYCLE_ARCHITECTURE_TARGET_SET_CONFLICT',
);
for (const frozenPath of REQUIRED_FROZEN_FILES) {
  assert(handoff.frozenFiles.includes(frozenPath), `SEMANTIC_LIFECYCLE_ARCHITECTURE_BOUNDARY_FROZEN_FILE_MISSING:${frozenPath}`);
}

assert.deepStrictEqual(
  handoff.explicitEntrypoints.map(entry => entry.testcaseName).sort(),
  EXPECTED_BP_TESTCASES.sort(),
  'SEMANTIC_LIFECYCLE_HANDOFF_BP_ENTRYPOINT_SET_STALE',
);
assert(
  handoff.explicitEntrypoints.every(entry => entry.initialExecutionStatus === 'passed'),
  'SEMANTIC_LIFECYCLE_HANDOFF_BP_ENTRYPOINT_NOT_GREEN',
);
assert(
  handoff.explicitEntrypoints.every(entry => !Object.hasOwn(entry, 'failureReason')),
  'SEMANTIC_LIFECYCLE_HANDOFF_PASSING_ENTRYPOINT_RETAINS_FAILURE',
);

assert(
  handoff.criticalNonExplicitTests
    .every(test => test.expectedStatus === 'must-pass-after-coding'),
  'SEMANTIC_LIFECYCLE_HANDOFF_GUARD_NOT_GREEN',
);

for (const target of handoff.codingTargets) {
  assert(
    target.failureSignal === 'none-currently-observed',
    `SEMANTIC_LIFECYCLE_HANDOFF_TARGET_SIGNAL_STALE:${target.testcaseName}`,
  );
  assert(
    /Preserve/.test(target.nextAction),
    `SEMANTIC_LIFECYCLE_HANDOFF_TARGET_ACTION_STALE:${target.testcaseName}`,
  );
}
assert(
  /BP-AUTOALIGN production behavior/i.test(handoff.taskExecutionPlan.executionStrategy),
  'SEMANTIC_LIFECYCLE_HANDOFF_STRATEGY_NOT_BP_AUTOALIGN',
);

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

function normalizedTargetPaths(handoff) {
  return [
    ...new Set(
      (handoff.codingTargets || []).flatMap(target => {
        if (target.path) return [target.path];
        return target.targetPaths || [];
      }),
    ),
  ];
}

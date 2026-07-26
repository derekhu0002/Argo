const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const root = read('OVERALL_ARCHITECTURE.md');
const local = read('.argo/scripts/graph-rag/ARCHITECTURE.md');
const tests = read('tests/ARCHITECTURE.md');
const handoff = JSON.parse(read('.argo/temp/ImplementationToCodingHandoff.json'));

// GIVEN the approved WP-P3 operator-release boundary over accepted WP-P1/WP-P2 services
// WHEN root, local, test, and Coding contracts are inspected
// THEN composition may sequence public ports but cannot reopen their internal behavior
for (const required of [
  'Production Semantic Operator Journey',
  'semanticOperatorJourney.js',
  'createProductionSemanticOperatorJourney(dependencies)',
  'startNewProject',
  'runExplicitBackfill',
  'verifyReadiness',
  'readFullSnapshot',
  'SemanticIndexPending',
  'automatic-backfill opt-in',
  'approved external configuration',
  'configuration validation precedes automatic start',
  'progress',
  'checkpoint',
  'failure',
  'resume',
  'canonical JSON remains authoritative',
  'no-argument full snapshot',
  'WP-P1',
  'WP-P2',
  'runner-owned',
  'runNewProjectSemanticOperatorJourney.js',
]) {
  assert(
    root.toLowerCase().includes(required.toLowerCase())
      || local.toLowerCase().includes(required.toLowerCase())
      || tests.toLowerCase().includes(required.toLowerCase()),
    `WP_P3_ARCHITECTURE_BOUNDARY_GUARD: contract omits ${required}`,
  );
}

const authorization = JSON.stringify({
  summary: handoff.summary,
  codingTargets: handoff.codingTargets,
  taskExecutionPlan: handoff.taskExecutionPlan,
  openGaps: handoff.openGaps,
});
for (const prohibited of [
  'productionSemanticBackfill.js',
  'productionSemanticCheckpointStore.js',
  'productionSemanticNeo4jAdapter.js',
  'productionSemanticProjectionStore.js',
  'defaultSemanticRetrieval.js',
  'liveEmbeddingProviderConfig.js',
  'productionGraphRagRuntime.js',
]) {
  assert(
    !handoff.codingTargets.some(target => target.path.endsWith(prohibited)),
    `WP_P3_ARCHITECTURE_BOUNDARY_GUARD: accepted internal boundary reauthorized ${prohibited}`,
  );
}
assert(
  /runner-owned deliveryStatus/i.test(authorization),
  'WP_P3_ARCHITECTURE_BOUNDARY_GUARD: runner-owned deliveryStatus authority missing',
);

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

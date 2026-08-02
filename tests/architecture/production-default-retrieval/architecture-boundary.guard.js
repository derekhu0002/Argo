const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const root = read('OVERALL_ARCHITECTURE.md');
const local = read('.argo/scripts/graph-rag/ARCHITECTURE.md');
const tests = read('tests/ARCHITECTURE.md');
const handoff = JSON.parse(read('.argo/temp/ImplementationToCodingHandoff.json'));
const AUTHORIZED_TARGETS = [
  '.argo/scripts/argo-mcp-server.js',
  '.argo/scripts/systemarchitecture-mcp-server.js',
  '.argo/scripts/graph-rag/defaultSemanticRetrieval.js',
  '.argo/scripts/graph-rag/mutationEmbeddingVectorLifecycle.js',
  '.argo/scripts/graph-rag/semanticOperatorJourney.js',
];

// GIVEN the approved BP-AUTOALIGN query-recovery boundary and frozen exclusions
// WHEN root/local/test contracts and Coding authorization are inspected
// THEN the uninjected default retrieval and fail-closed readiness contracts are explicit
for (const required of [
  'Default Semantic Retrieval Composition',
  'defaultSemanticRetrieval.js',
  'createDefaultSemanticRetrieval(dependencies).retrieve(request)',
  'SemanticIndexPending',
  'fullSnapshotFallback: false',
  'Element, ArchitectureRelationship, and View',
  'canonical/content/index versions',
  'ordinary semantic queries',
  'aligns automatically',
  'one retry',
  'SEMANTIC_AUTO_ALIGNMENT_FAILED',
  'script-owned',
  'zero provider/vector work',
  'silent full-snapshot fallback',
  'including anchored graph-tidy',
  'zero semantic operations',
  'runProductionSemanticReadinessGate.js',
]) {
  assert(
    root.includes(required) || local.includes(required) || tests.includes(required),
    `WP_P2_ARCHITECTURE_BOUNDARY_GUARD: contract omits ${required}`,
  );
}

const authorization = JSON.stringify({
  summary: handoff.summary,
  codingTargets: handoff.codingTargets,
  taskExecutionPlan: handoff.taskExecutionPlan,
  openGaps: handoff.openGaps,
});
const targetPaths = normalizedTargetPaths(handoff);
assert.deepStrictEqual(
  targetPaths.sort(),
  AUTHORIZED_TARGETS.sort(),
  'WP_P2_ARCHITECTURE_BOUNDARY_GUARD: BP target set changed',
);
for (const protectedBoundary of [
  '.argo/scripts/graph-rag/liveEmbeddingProviderConfig.js',
  '.argo/scripts/graph-rag/liveEmbeddingProviderClient.js',
  '.argo/scripts/graph-rag/liveEmbeddingNeo4jBoundary.js',
  '.argo/scripts/graph-rag/productionGraphRagRuntime.js',
]) {
  assert(
    !targetPaths.includes(protectedBoundary)
      && handoff.frozenFiles.includes(protectedBoundary),
    `WP_P2_ARCHITECTURE_BOUNDARY_GUARD: accepted WP-P2 boundary changed authorization ${protectedBoundary}`,
  );
}
assert(targetPaths.includes('.argo/scripts/graph-rag/defaultSemanticRetrieval.js'), 'WP_P2_ARCHITECTURE_BOUNDARY_GUARD: BP query recovery target missing');
assert(!/deliveryStatus/.test(JSON.stringify(handoff.codingTargets)), 'WP_P2_ARCHITECTURE_BOUNDARY_GUARD: manual deliveryStatus target is forbidden');
assert(
  /runner-owned deliveryStatus/i.test(handoff.taskExecutionPlan.executionStrategy),
  'WP_P2_ARCHITECTURE_BOUNDARY_GUARD: runner-owned deliveryStatus authority is missing',
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

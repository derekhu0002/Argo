const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const root = read('OVERALL_ARCHITECTURE.md');
const local = read('.argo/scripts/graph-rag/ARCHITECTURE.md');
const tests = read('tests/ARCHITECTURE.md');
const handoff = JSON.parse(read('.argo/temp/ImplementationToCodingHandoff.json'));

// GIVEN the approved seven-element WP-P2 stable boundary and frozen exclusions
// WHEN root/local/test contracts and Coding authorization are inspected
// THEN the uninjected default retrieval and fail-closed readiness contracts are explicit
for (const required of [
  'Default Semantic Retrieval Composition',
  'defaultSemanticRetrieval.js',
  'createDefaultSemanticRetrieval(dependencies).retrieve(request)',
  'SemanticIndexPending',
  'fullSnapshotFallback: false',
  'Element, ArchitectureRelationship, and View',
  'ready-made environment',
  'zero-read success is forbidden',
  'directly read and attribute',
  'missing, unsafe, conflicting, legacy',
  'test/default',
  'explicit content-version mismatch',
  'explicit index-version mismatch',
  'single ordered ledger',
  'windowExhausted',
  'qualifying peers beyond the initial',
  'argo_production_semantic_element_vector',
  'argo_production_semantic_relationship_vector',
  'argo_production_semantic_view_vector',
  'db.index.vector.queryNodes($indexName, $topK, $vector)',
  'unmodified raw provider vector',
  'all-zero result',
  'Fixed top-k may optimize',
  'w5.implementation-design.v1',
  'exact ArchiMate Realization direction',
  'endpoint source/target objects',
  'complete selected View metadata',
  'parent viewpoint',
  'versioned member and relationship endpoint objects',
  'unique first-inclusion provenance for every returned object',
  'overlapping-View exclusion',
  'canonical/content/index versions',
  'approved-test profiles',
  'synthetic empty seeds',
  'SP-05/WP-P3',
  'runDefaultMcpNeo4jVectorRetrieval.js',
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
assert(!/runNewProjectSemanticOperatorJourney|ExplicitAcceptanceTestcase-SP-05/i.test(authorization), 'WP_P2_ARCHITECTURE_BOUNDARY_GUARD: WP-P3 entered Coding authorization');
assert(!/deliveryStatus/.test(JSON.stringify(handoff.codingTargets)), 'WP_P2_ARCHITECTURE_BOUNDARY_GUARD: manual deliveryStatus target is forbidden');
assert(
  /runner-owned deliveryStatus/i.test(handoff.taskExecutionPlan.executionStrategy),
  'WP_P2_ARCHITECTURE_BOUNDARY_GUARD: runner-owned deliveryStatus authority is missing',
);

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

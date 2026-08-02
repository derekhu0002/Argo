const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const productionDirectory = path.join(
  repoRoot,
  '.argo',
  'scripts',
  'graph-rag',
  'semantic-persistence',
);
const liveEvidencePath = '.argo/scripts/graph-rag/liveEmbeddingNeo4jBoundary.js';

// GIVEN the separate production semantic-persistence boundary
// WHEN present production JavaScript dependencies are inspected
// THEN dependencies point inward and never couple to tests, live-E2E cleanup, Python, or Neo4j GenAI procedures
for (const file of fs.readdirSync(productionDirectory).filter(entry => entry.endsWith('.js'))) {
  const source = fs.readFileSync(path.join(productionDirectory, file), 'utf8');
  assert(!/require\(['"][^'"]*tests[\\/]/.test(source), `WP_P1_DEPENDENCY_DIRECTION_GUARD: ${file} imports tests`);
  assert(!/liveEmbeddingNeo4jBoundary/.test(source), `WP_P1_DEPENDENCY_DIRECTION_GUARD: ${file} imports live-E2E persistence`);
  assert(!/(?:python|ai\.text\.embed|genai\.vector\.encode)/i.test(source), `WP_P1_DEPENDENCY_DIRECTION_GUARD: ${file} uses a prohibited runtime`);
}

const handoff = JSON.parse(read('.argo/temp/ImplementationToCodingHandoff.json'));
const targetPaths = [
  ...(handoff.codingTargets || []).map(target => target.path),
  ...((handoff.taskExecutionPlan && handoff.taskExecutionPlan.tasks) || [])
    .flatMap(task => task.targetPaths || []),
].filter(Boolean);
assert(
  !targetPaths.includes(liveEvidencePath),
  'WP_P1_DEPENDENCY_DIRECTION_GUARD: live-E2E persistence was authorized as a production target',
);
assert(
  handoff.frozenFiles.includes(liveEvidencePath),
  'WP_P1_DEPENDENCY_DIRECTION_GUARD: live-E2E cleanup boundary must remain frozen',
);
const productionCompositionPaths = [
  '.argo/scripts/graph-rag/semantic-persistence/productionSemanticNeo4jAdapter.js',
  '.argo/scripts/graph-rag/semantic-persistence/productionSemanticCheckpointStore.js',
  '.argo/scripts/graph-rag/semantic-persistence/productionSemanticProjectionStore.js',
  '.argo/scripts/graph-rag/semantic-persistence/productionSemanticBackfill.js',
  '.argo/scripts/graph-rag/productionGraphRagRuntime.js',
  '.argo/scripts/systemarchitecture-mcp-server.js',
];
for (const productionTarget of productionCompositionPaths) {
  assert(
    targetPaths.includes(productionTarget) || handoff.frozenFiles.includes(productionTarget),
    `WP_P1_DEPENDENCY_DIRECTION_GUARD: handoff neither targets nor freezes ${productionTarget}`,
  );
}
for (const protectedPersistenceTarget of productionCompositionPaths.slice(0, -1)) {
  assert(
    !targetPaths.includes(protectedPersistenceTarget),
    `WP_P1_DEPENDENCY_DIRECTION_GUARD: handoff reauthorizes accepted WP-P1 boundary ${protectedPersistenceTarget}`,
  );
}
for (const frozenProductionPath of productionCompositionPaths.slice(0, -1)) {
  assert(
    handoff.frozenFiles.includes(frozenProductionPath),
    `WP_P1_DEPENDENCY_DIRECTION_GUARD: final-audit repair does not freeze ${frozenProductionPath}`,
  );
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

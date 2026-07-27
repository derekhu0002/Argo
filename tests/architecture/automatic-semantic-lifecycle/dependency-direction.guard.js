const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const handoff = JSON.parse(read('.argo/temp/ImplementationToCodingHandoff.json'));
const targetPaths = handoff.codingTargets.map(target => target.path);
const allowedTargets = new Set([
  '.argo/scripts/argo-mcp-server.js',
  '.argo/scripts/systemarchitecture-mcp-server.js',
  '.argo/scripts/graph-rag/semanticOperatorJourney.js',
  '.argo/scripts/graph-rag/defaultSemanticRetrieval.js',
  '.argo/scripts/graph-rag/liveEmbeddingProviderConfig.js',
  '.argo/scripts/graph-rag/mutationEmbeddingVectorLifecycle.js',
  '.argo/scripts/graph-rag/semantic-persistence/productionSemanticBackfill.js',
  '.argo/scripts/graph-rag/semantic-persistence/productionSemanticProjectionStore.js',
  '.argo/scripts/graph-rag/semantic-persistence/productionSemanticNeo4jAdapter.js',
  '.argo/scripts/graph-rag/semantic-persistence/productionSemanticCheckpointStore.js',
]);

// GIVEN the approved successor scope
// WHEN Coding targets and production imports are inspected
// THEN adapters depend inward and no test or unrelated release surface is authorized
for (const target of targetPaths) {
  assert(allowedTargets.has(target), `SEMANTIC_LIFECYCLE_UNAUTHORIZED_TARGET:${target}`);
  const source = read(target);
  assert(!/require\s*\(\s*['"][^'"]*tests\//.test(source), `SEMANTIC_LIFECYCLE_PRODUCTION_DEPENDS_ON_TESTS:${target}`);
}
for (const forbidden of [
  'package.json',
  '.argo/scripts/graph-rag/liveEmbeddingNeo4jBoundary.js',
  '.argo/scripts/graph-rag/liveEmbeddingProviderClient.js',
  '.argo/scripts/graph-rag/productionGraphRagRuntime.js',
  'design/KG/SystemArchitecture.json',
]) {
  assert(!targetPaths.includes(forbidden), `SEMANTIC_LIFECYCLE_FORBIDDEN_TARGET:${forbidden}`);
}
assert(
  targetPaths.includes('.argo/scripts/systemarchitecture-mcp-server.js'),
  'SEMANTIC_LIFECYCLE_CANONICAL_WRITE_ORCHESTRATOR_NOT_AUTHORIZED',
);
assert(
  targetPaths.includes('.argo/scripts/graph-rag/mutationEmbeddingVectorLifecycle.js'),
  'SEMANTIC_LIFECYCLE_INCREMENTAL_BOUNDARY_NOT_AUTHORIZED',
);

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

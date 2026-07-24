const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const rootContract = read('OVERALL_ARCHITECTURE.md');
const localContract = read('.argo/scripts/graph-rag/ARCHITECTURE.md');

// GIVEN the approved production Graph RAG stable boundary
// WHEN root and local ownership contracts are inspected
// THEN one public composition boundary owns runtime, qualification, credentials, native retrieval, and authority
assert(
  rootContract.includes('| Production Graph RAG Boundary | `.argo/scripts/graph-rag/` |'),
  'PRODUCTION_GRAPH_RAG_ARCHITECTURE_BOUNDARY_GUARD: root stable-element map is missing',
);
for (const ownership of [
  'productionGraphRagRuntime.js',
  'externalProductionConfig.js',
  'embeddingQualificationGate.js',
  'neo4jNativeRetrieval.js',
  'canonicalProjectionAuthority.js',
  'resolveExternalProductionConfig(configuration, context)',
  'evaluateEmbeddingQualification(qualification)',
  'enforceCanonicalProjectionAuthority(input)',
  'createNeo4jNativeRetrieval(dependencies)',
  'createProductionGraphRagRuntime(dependencies)',
]) {
  assert(
    localContract.includes(ownership),
    `PRODUCTION_GRAPH_RAG_ARCHITECTURE_BOUNDARY_GUARD: local contract omits ${ownership}`,
  );
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

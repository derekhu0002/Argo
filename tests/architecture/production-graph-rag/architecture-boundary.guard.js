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
  'selectThresholdAllSeeds(request)',
  'generateAffectedEmbeddings(input)',
  'evaluateSemanticAlignment(request)',
  'DT-05 uses the shared seed entrypoint',
  'DT-16 and DT-16-SemanticIndex share the mutation lifecycle entrypoint',
  'DT-17 freezes the unaligned-query boundary',
]) {
  assert(
    localContract.includes(ownership) || read('tests/ARCHITECTURE.md').includes(ownership),
    `PRODUCTION_GRAPH_RAG_ARCHITECTURE_BOUNDARY_GUARD: contracts omit ${ownership}`,
  );
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

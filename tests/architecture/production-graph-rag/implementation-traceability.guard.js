const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const graph = JSON.parse(read('design/KG/SystemArchitecture.json'));
const rootContract = read('OVERALL_ARCHITECTURE.md');
const requiredMappings = new Map([
  ['grag-production-runtime', ['tests/explicit/entries/runProductionGraphRagRuntime.js']],
  ['grag-native-retrieval-service', ['tests/explicit/entries/runNeo4jNativeRetrievalPlatform.js']],
  ['grag-embedding-qualification', ['tests/explicit/entries/runEmbeddingQualificationGate.js']],
  ['grag-credential-boundary', ['tests/explicit/entries/runExternalCredentialBoundary.js']],
  ['grag-canonical-graph', [
    'tests/explicit/entries/runCanonicalGraphFullSnapshot.js',
    'tests/explicit/entries/runCanonicalProjectionAuthority.js',
  ]],
  ['grag-seed-retrieval', ['tests/explicit/entries/runIndependentSemanticSeeds.js']],
  ['grag-semantic-index', ['tests/explicit/entries/runMutationIndexLifecycle.js']],
  ['grag-index-lifecycle', ['tests/explicit/entries/runMutationIndexLifecycle.js']],
  ['grag-alignment-constraint', ['tests/explicit/entries/runStaleSemanticQueryRejection.js']],
  ['grag-embedding-provider-adapter', ['tests/explicit/entries/runEmbeddingProviderAdapterLifecycle.js']],
  ['grag-embedding-generation', ['tests/explicit/entries/runEmbeddingProviderAdapterLifecycle.js']],
  ['grag-wp-3-1', ['tests/explicit/entries/runApplyMutationEmbeddingVectorE2E.js']],
  ['grag-quality-gate', ['tests/explicit/entries/runRetrievalQualityBenchmark.js']],
  ['grag-seven-wave-delivery', ['tests/explicit/entries/runSevenWaveDeliveryGates.js']],
]);
const elements = new Map(graph.elements.map(element => [element.id, element]));

// GIVEN the approved intent anchors, mounted acceptance paths, and implementation contracts
for (const [intentId, expectedEntrypoints] of requiredMappings) {
  // WHEN traceability is inspected
  // THEN every anchor has a direct contract mapping and every mounted entrypoint is physical
  assert(elements.has(intentId), `PRODUCTION_GRAPH_RAG_TRACEABILITY_GUARD: missing ${intentId}`);
  assert(
    rootContract.includes(`\`${intentId}\``),
    `PRODUCTION_GRAPH_RAG_TRACEABILITY_GUARD: root contract omits ${intentId}`,
  );
  const mountedEntrypoints = (elements.get(intentId).testcases || [])
    .map(testcase => testcase.acceptanceCriteria);
  for (const entryPath of expectedEntrypoints) {
    assert(
      mountedEntrypoints.includes(entryPath),
      `PRODUCTION_GRAPH_RAG_TRACEABILITY_GUARD: ${intentId} does not mount ${entryPath}`,
    );
    assert(
      fs.existsSync(path.join(repoRoot, ...entryPath.split('/'))),
      `PRODUCTION_GRAPH_RAG_TRACEABILITY_GUARD: missing physical entrypoint ${entryPath}`,
    );
  }
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

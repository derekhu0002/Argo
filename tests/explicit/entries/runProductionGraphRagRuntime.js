const assert = require('node:assert');
const {
  runProductionSemanticQuery,
} = require('../../harness/productionGraphRagHarness.js');

async function main() {
  // GIVEN an explicitly qualified embedding and externally configured production runtime
  // WHEN a semantic query crosses the production Graph RAG boundary
  const result = await runProductionSemanticQuery();

  // THEN Node.js and Neo4j-native retrieval are the production mainline without required sidecars or plugins
  assert.strictEqual(result.runtime, 'nodejs', 'TS01_NODE_RUNTIME_REQUIRED');
  assert.strictEqual(result.retrievalPlatform, 'neo4j-native', 'TS01_NEO4J_NATIVE_PLATFORM_REQUIRED');
  assert.strictEqual(result.pythonRequired, false, 'TS01_PYTHON_SIDECAR_PROHIBITED');
  assert.strictEqual(result.neo4jGenAiPluginRequired, false, 'TS01_GENAI_PLUGIN_DEPENDENCY_PROHIBITED');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

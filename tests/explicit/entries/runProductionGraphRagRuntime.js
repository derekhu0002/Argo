const assert = require('node:assert');
const {
  evaluateNeo4jProjectionEnvironmentScenarios,
  inspectHarnessEnvironmentInitialization,
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

  // GIVEN the Argo harness initializer is launched from a clean process
  // WHEN projection/runtime checks need approved local configuration
  const harnessEnvironment = inspectHarnessEnvironmentInitialization();

  // THEN only the repository-relative .argo/.env is loaded into process.env before projection
  assert.strictEqual(
    harnessEnvironment.loadsRepositoryEnvBeforeProjection,
    true,
    'TS01_HARNESS_ENV_FILE_LOADER_MISSING',
  );
  assert.strictEqual(
    harnessEnvironment.exactRepositoryEnvPathOnly,
    true,
    'TS01_HARNESS_ENV_PATH_BOUNDARY_MISSING',
  );
  assert.strictEqual(
    harnessEnvironment.preservesProcessPrecedence,
    true,
    'TS01_HARNESS_ENV_PROCESS_PRECEDENCE_MISSING',
  );
  assert.deepStrictEqual(
    harnessEnvironment.secretDiagnostics,
    [],
    `TS01_HARNESS_ENV_SECRET_DIAGNOSTIC:${harnessEnvironment.secretDiagnostics.join(',')}`,
  );

  // THEN canonical Neo4j names and QWEN_KEY resolve the runtime fields required for startup
  const runtimeConfiguration = evaluateNeo4jProjectionEnvironmentScenarios();
  assert.strictEqual(
    runtimeConfiguration.canonicalOnly.status,
    'accepted',
    `TS01_CANONICAL_RUNTIME_FIELD_RESOLUTION:${runtimeConfiguration.canonicalOnly.category || runtimeConfiguration.canonicalOnly.field || 'missing'}`,
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

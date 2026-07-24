const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const entryRequirements = new Map([
  ['tests/explicit/entries/runProductionGraphRagRuntime.js', [
    'productionGraphRagHarness.js',
    'TS01_NODE_RUNTIME_REQUIRED',
    'TS01_PYTHON_SIDECAR_PROHIBITED',
    'TS01_GENAI_PLUGIN_DEPENDENCY_PROHIBITED',
  ]],
  ['tests/explicit/entries/runNeo4jNativeRetrievalPlatform.js', [
    'productionGraphRagHarness.js',
    'TS01_NATIVE_BOUNDARY_CALL_COUNT',
    'TS01_NATIVE_REQUEST_PROPAGATION',
    'TS01_NATIVE_DYNAMIC_RESULT_NOT_PROPAGATED',
    'TS01_NATIVE_DYNAMIC_SENTINEL_MISSING',
  ]],
  ['tests/explicit/entries/runEmbeddingQualificationGate.js', [
    'productionGraphRagHarness.js',
    'EMBEDDING_QUALIFICATION_REQUIRED',
    'EMBEDDING_CONFIGURATION_REQUIRED',
    'IMPLICIT_EMBEDDING_DEFAULT_PROHIBITED',
    'EMBEDDING_VALID_QUALIFICATION_REJECTED',
    "['provider', 'model', 'version', 'dimensions']",
    "[false, undefined, 'true', 1, {}, []]",
    "['', ' ', '\\t\\n']",
    "[0, -1, 1.5, '1536', Number.NaN, Number.POSITIVE_INFINITY]",
  ]],
  ['tests/explicit/entries/runExternalCredentialBoundary.js', [
    'productionGraphRagHarness.js',
    'EXTERNAL_CREDENTIALS_REQUIRED',
    "['neo4jUri', 'neo4jUsername', 'neo4jPassword', 'embeddingCredential']",
    "['start', 'semantic-query']",
    'TS07_HARDCODED_CREDENTIAL_DEFAULT',
    'TS07_CREDENTIAL_FALLBACK_EXPRESSION',
    'TS07_CYPHER_CREDENTIAL_BOUNDARY_VIOLATION',
  ]],
  ['tests/explicit/entries/runCanonicalGraphFullSnapshot.js', [
    'intentArchitectureQueryHarness.js',
    'DT02_CANONICAL_SNAPSHOT_INCOMPLETE',
  ]],
  ['tests/explicit/entries/runCanonicalProjectionAuthority.js', [
    'productionGraphRagHarness.js',
    'CANONICAL_PROJECTION_CONFLICT',
    'TS02_CANONICAL_AUTHORITY_VIOLATED',
  ]],
  ['tests/explicit/entries/runSevenWaveDeliveryGates.js', [
    'productionGraphRagHarness.js',
    'DELIVERY_PREREQUISITES_INCOMPLETE',
    'TS08_OUT_OF_ORDER_DELIVERY_NOT_BLOCKED',
  ]],
  ['tests/explicit/entries/runEmbeddingProviderAdapterLifecycle.js', [
    'productionGraphRagHarness.js',
    'TS09_NODE_ADAPTER_REQUIRED',
    'TS09_PARTIAL_PERSISTENCE_MUST_NOT_ALIGN',
  ]],
]);

// GIVEN every W2 and Canonical Authority explicit entrypoint
for (const [entryPath, requiredObservations] of entryRequirements) {
  const source = read(entryPath);

  // WHEN the frozen entrypoint is inspected
  // THEN it retains business-readable phases, Harness abstraction, and key acceptance assertions
  for (const phase of ['GIVEN', 'WHEN', 'THEN']) {
    assert(
      source.includes(phase),
      `PRODUCTION_GRAPH_RAG_EXPLICIT_ENTRYPOINT_GUARD: ${entryPath} is missing ${phase}`,
    );
  }
  assert(
    !source.includes("require('../../.argo/") && !source.includes('child_process'),
    `PRODUCTION_GRAPH_RAG_EXPLICIT_ENTRYPOINT_GUARD: ${entryPath} exposes low-level plumbing`,
  );
  for (const observation of requiredObservations) {
    assert(
      source.includes(observation),
      `PRODUCTION_GRAPH_RAG_EXPLICIT_ENTRYPOINT_GUARD: ${entryPath} omits ${observation}`,
    );
  }
}

const handoff = JSON.parse(read('.argo/temp/ImplementationToCodingHandoff.json'));
for (const entryPath of entryRequirements.keys()) {
  assert(
    handoff.frozenFiles.includes(entryPath),
    `PRODUCTION_GRAPH_RAG_EXPLICIT_ENTRYPOINT_GUARD: ${entryPath} must be frozen`,
  );
}
assert(
  handoff.frozenFiles.includes('tests/harness/productionGraphRagHarness.js'),
  'PRODUCTION_GRAPH_RAG_EXPLICIT_ENTRYPOINT_GUARD: production Harness must be frozen',
);

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

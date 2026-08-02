const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const requirements = new Map([
  ['tests/explicit/entries/runProductionSemanticBackfill.js', [
    'productionSemanticPersistenceHarness.js',
    'GIVEN',
    'WHEN',
    'THEN',
    'SP01_STRUCTURAL_PROJECTION_COMPLETION_REQUIRED',
    'SP01_MISSING_OPT_IN_NOT_BLOCKED',
    'SP01_STRUCTURAL_VERSION_MISMATCH_NOT_BLOCKED',
    'SP01_MISSING_EXTERNAL_CREDENTIALS_NOT_BLOCKED',
    'SP01_MISSING_PROVIDER_QUALIFICATION_NOT_BLOCKED',
    'SP01_MCP_OPERATOR_NOT_EXPOSED',
    'SP01_DEFAULT_MCP_JSONRPC_TOOLS_CALL_REQUIRED',
    'SP01_DEFAULT_MCP_OPERATOR_CALL_REQUIRED',
    'SP01_DEFAULT_MCP_PRODUCTION_COMPOSITION_MISSING',
    'SP01_DEFAULT_MCP_EXTERNAL_CONFIGURATION_NOT_FAIL_CLOSED',
    'SP01_DEFAULT_MCP_FAKE_CANONICAL_MUTATION_TRIGGERED',
    'SP01_BOUNDED_BATCH_EXCEEDED',
    'SP01_CHANNEL_CHECKPOINTS_INCOMPLETE',
    'SP01_ISOLATED_RECORD_FAILURE_MISSING',
    'SP01_RESUME_REEMBEDDED_COMPLETED_IDENTITY',
    'SP01_RESUME_REUPSERTED_COMPLETED_IDENTITY',
    'SP01_DURABLE_CHECKPOINT_COMPOSITION_MISSING',
    'SP01_DURABLE_PROJECTION_ADAPTER_COMPOSITION_MISSING',
    'SP01_THREE_CHANNEL_BACKFILL_INCOMPLETE',
    'SP01_IDEMPOTENT_RERUN_WROTE_DUPLICATES',
    'SP01_FAKE_CANONICAL_MUTATION_PROHIBITED',
    'SP01_FAKE_CANONICAL_MUTATION_TRIGGERED',
    'SP01_ALIGNMENT_BEFORE_ALL_CHANNELS_COMPLETE',
  ]],
  ['tests/explicit/entries/runPersistentSemanticProjectionLifecycle.js', [
    'productionSemanticPersistenceHarness.js',
    'GIVEN',
    'WHEN',
    'THEN',
    'SP02_DURABLE_RESTART_RECORDS_MISSING',
    'SP02_MISSING_EXTERNAL_CREDENTIALS_NOT_BLOCKED',
    'SP02_MISSING_CREDENTIALS_REACHED_PERSISTENCE',
    'SP02_MISSING_PROVIDER_QUALIFICATION_NOT_BLOCKED',
    'SP02_MISSING_QUALIFICATION_REACHED_PERSISTENCE',
    'SP02_STABLE_CANONICAL_IDENTITY_CHANGED_ON_RESTART',
    'SP02_CHANGED_RECORD_NOT_STABLE_IDENTITY_UPSERT',
    'SP02_TOMBSTONE_NOT_DELETED',
    'SP02_STORE_PUBLIC_SURFACE_NOT_EXACT',
    'SP02_PRODUCTION_RUNID_RECORD_NOT_BLOCKED',
    'SP02_RUNID_RECORD_REACHED_PERSISTENCE',
    'SP02_PRODUCTION_RECORD_RUNID_PROHIBITED',
    'SP02_DURABLE_NEO4J_ADAPTER_NOT_EXERCISED',
    'SP02_LIVE_E2E_CLEANUP_DELETED_PRODUCTION_RECORD',
    'SP02_PROJECTION_MUTATED_CANONICAL_JSON',
    'SP02_NEO4J_BECAME_CANONICAL_AUTHORITY',
  ]],
]);

// GIVEN both approved WP-P1 physical entrypoints
for (const [entryPath, expectedAssertions] of requirements) {
  // WHEN each frozen entrypoint is inspected
  const source = read(entryPath);
  // THEN it preserves readable phases, Harness abstraction, and executable key assertions
  assert(!source.includes('child_process'), `WP_P1_ENTRYPOINT_GUARD: ${entryPath} exposes process plumbing`);
  assert(!source.includes('neo4j-driver'), `WP_P1_ENTRYPOINT_GUARD: ${entryPath} exposes database plumbing`);
  for (const expected of expectedAssertions) {
    assert(source.includes(expected), `WP_P1_ENTRYPOINT_GUARD: ${entryPath} omits ${expected}`);
  }
}

const harness = read('tests/harness/productionSemanticPersistenceHarness.js');
for (const requiredBoundary of [
  'createProductionSemanticNeo4jAdapter',
  'createProductionSemanticCheckpointStore',
  'createProductionGraphRagRuntime',
  'backfillSystemArchitectureSemanticProjection',
  'completedBeforeResume',
  'replayedProviderIdentities',
  'replayedUpsertIdentities',
  'runDefaultMcpSemanticBackfillComposition',
  'assertZeroSemanticSideEffects',
  'assertExactStoreContract',
]) {
  assert(harness.includes(requiredBoundary), `WP_P1_ENTRYPOINT_GUARD: Harness omits ${requiredBoundary}`);
}
assert(
  !harness.includes('function createDurableProjectionAdapter'),
  'WP_P1_ENTRYPOINT_GUARD: Harness substitutes an in-memory production projection adapter',
);
const defaultCompositionProbe = harness.slice(
  harness.indexOf('function runDefaultMcpSemanticBackfillComposition'),
  harness.indexOf('async function runPersistentSemanticProjectionLifecycle'),
);
for (const requiredBoundary of [
  'childProcess.spawnSync',
  '[paths.mcp]',
  "method: 'tools/call'",
  "name: 'backfillSystemArchitectureSemanticProjection'",
  "'QWEN_KEY'",
  "'ARGO_NEO4J_DATABASE_URL'",
  'canonicalJsonBefore',
  'canonicalJsonAfter',
]) {
  assert(
    defaultCompositionProbe.includes(requiredBoundary),
    `WP_P1_ENTRYPOINT_GUARD: default MCP probe omits ${requiredBoundary}`,
  );
}
for (const injectedBoundary of [
  'productionGraphRagRuntime:',
  'productionGraphRagDependencies:',
  '.callTool(',
]) {
  assert(
    !defaultCompositionProbe.includes(injectedBoundary),
    `WP_P1_ENTRYPOINT_GUARD: default MCP probe injects ${injectedBoundary}`,
  );
}

const handoff = JSON.parse(read('.argo/temp/ImplementationToCodingHandoff.json'));
for (const entryPath of requirements.keys()) {
  assert(handoff.frozenFiles.includes(entryPath), `WP_P1_ENTRYPOINT_GUARD: ${entryPath} is not frozen`);
}
assert(
  handoff.frozenFiles.includes('tests/harness/productionSemanticPersistenceHarness.js'),
  'WP_P1_ENTRYPOINT_GUARD: WP-P1 Harness is not frozen',
);

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

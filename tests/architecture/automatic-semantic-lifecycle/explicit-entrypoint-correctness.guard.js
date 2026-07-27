const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const harnessPath = 'tests/harness/automaticSemanticLifecycleHarness.js';
const harness = read(harnessPath);
const retrievalHarness = read('tests/harness/productionDefaultRetrievalHarness.js');
const entrypoints = [
  'tests/explicit/entries/runNewProjectSemanticOperatorJourney.js',
  'tests/explicit/entries/runProductionSemanticBackfill.js',
  'tests/explicit/entries/runPersistentSemanticProjectionLifecycle.js',
  'tests/explicit/entries/runMutationIndexLifecycle.js',
  'tests/explicit/entries/runApplyMutationEmbeddingVectorE2E.js',
  'tests/explicit/entries/runDefaultMcpNeo4jVectorRetrieval.js',
  'tests/explicit/entries/runProductionSemanticReadinessGate.js',
  'tests/explicit/entries/runTypedMcpQueryContract.js',
];

// GIVEN graph-mounted acceptance paths
// WHEN their frozen bodies and shared Harness are inspected
// THEN GIVEN/WHEN/THEN readability and executable key assertions are present
for (const entryPath of entrypoints) {
  const source = read(entryPath);
  for (const marker of ['GIVEN', 'WHEN', 'THEN']) {
    assert(source.includes(marker), `SEMANTIC_LIFECYCLE_ENTRY_${marker}_MISSING:${entryPath}`);
  }
  assert(
    source.includes('automaticSemanticLifecycleHarness.js'),
    `SEMANTIC_LIFECYCLE_HARNESS_NOT_USED:${entryPath}`,
  );
  assert(
    /assert[A-Z]|assert\(/.test(source),
    `SEMANTIC_LIFECYCLE_KEY_ASSERTION_MISSING:${entryPath}`,
  );
}

for (const required of [
  'SP05_CANONICAL_ARGO_INIT_LIFECYCLE_MISSING',
  'SP01_BACKFILL_TOOL_NOT_PRIVATE',
  '_ACTUAL_MUTATION_TEST_COMPOSITION_MISSING',
  "runPersistentIncrementalMatrix('SP02')",
  "runPersistentIncrementalMatrix('DT16')",
  "runPersistentIncrementalMatrix('W31')",
  'SYSTEM_UNIFIED_READINESS_STATE_MATRIX_INCOMPLETE',
  "assertFreshReadinessPerQuery(freshReadiness, 'SP03')",
  "assertFreshReadinessPerQuery(freshReadiness, 'SP04')",
  'TS00_RETIRED_LIFECYCLE_TOOL_PUBLIC',
  'PRODUCTION_RUNID_CLEANUP_PROHIBITED',
  'READINESS_INVALIDATION_NOT_FIRST',
  'FOCUSED_DRYRUN_MATRIX_INCOMPLETE',
  'UNSANITIZED_DIAGNOSTIC_NOT_OBSERVED',
  'FAILED_STATE_NOT_PERSISTED',
  'SUBSEQUENT_QUERY_NOT_RUN',
  'DISABLED_SUBSEQUENT_QUERY_NOT_RUN',
  'CONFIGURATION_BEFORE_PROVIDER',
  'PROVIDER_CORRELATION_CHANGED',
  'FULL_SNAPSHOT_FALLBACK',
  'FINAL_READINESS_ORDER_INVALID',
  'PREEXISTING_ALIGNED_READINESS_NOT_SEEDED',
  'READINESS_NOT_INVALIDATED_BEFORE_OUTCOME',
  'DURABLE_READINESS_NOT_FAIL_CLOSED',
  'DURABLE_FAILURE_NOT_RECORDED',
  'STALE_PRIOR_ALIGNED_SURVIVED',
  'READINESS_NOT_INVALIDATED_BEFORE_EXTERNAL_CONFIG',
  'CONTROLLED_READINESS_NOT_INVALIDATED_BEFORE_PROVIDER_VECTOR',
  'CONTROLLED_RECONCILIATION_FAILURE_NOT_DURABLE',
  'CONTROLLED_DURABLE_TRANSITION_SEQUENCE_INVALID',
  'ALIGNMENT_BEFORE_QUERYABILITY_GLOBAL_COHERENCE',
  'DURABLE_RECORD_BEFORE_QUERY_MISSING',
  'QUERY_DID_NOT_READ_WRITTEN_RECORD',
  'SHARED_FAILURE_RECORD_MISSING',
  'READINESS_RECORD_REPLACED',
  'DURABLE_FAILURE_WRITE_MISSING',
  'FAILURE_LEDGER_NOT_STORE_RECORD',
  'SUCCESS_DID_NOT_READ_TRANSFORMED_RECORD',
  'QUERY_NOT_RESTORED',
  'PRE_INIT_EXPORTED_READ_MATRIX_INCOMPLETE',
  'POST_INIT_EXPORTED_READ_MATRIX_INCOMPLETE',
  'PRE_INIT_FAILURE_READ_COUNT_CHANGED',
  'POST_INIT_ALIGNED_READ_COUNT_CHANGED',
  'EXPORTED_READ_DURING_INIT_ALIGNMENT',
  'INIT_QUERYABILITY_NOT_BEFORE_ALIGNMENT',
  'INIT_COHERENCE_NOT_BEFORE_ALIGNMENT',
  'SP03_SYSTEM_UNIFIED_READINESS_BYPASSED_WP_P2',
  'SP03_UNIFIED_READINESS_RECORD_REPLACED',
  'SP03_UNIFIED_READINESS_REVISION_NOT_MONOTONIC',
  'SP03_SYSTEM_WP_P2_PROVIDER_NOT_EXERCISED',
  'SP04_SYSTEM_ACTIONABLE_FAILURE_EVIDENCE_CHANGED',
  'SP04_UNIFIED_ACTIONABLE_FAILURE_EVIDENCE_CHANGED',
  'SP04_UNIFIED_READINESS_SECRET_LEAK',
  'runExportedUnifiedReadinessThroughWpP2',
  'ACTUAL_TOUCHED_IDS_NOT_EXACT',
  'REMOVE_UPSERT_MAPPING_INVALID',
  'CANONICAL_WRITE_LOST',
  'initializeWorkspace',
  'applySystemArchitectureMutation',
  'addArchitectureElement',
  'removeArchitectureView',
]) {
  assert(
    harness.includes(required)
      || retrievalHarness.includes(required)
      || entrypoints.some(entryPath => read(entryPath).includes(required)),
    `SEMANTIC_LIFECYCLE_ASSERTION_NOT_FROZEN:${required}`,
  );
}

const w31 = read('tests/explicit/entries/runApplyMutationEmbeddingVectorE2E.js');
assert(
  w31.indexOf("runPersistentIncrementalMatrix('W31')") < w31.indexOf('process.env.ARGO_LIVE_PROVIDER_E2E'),
  'SEMANTIC_LIFECYCLE_W31_CODE_COMPLETE_NOT_BEFORE_LIVE_GATE',
);

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

const assert = require('node:assert');
const {
  CHANNELS,
  assertCompleteMetadata,
  runProductionSemanticBackfill,
} = require('../../harness/productionSemanticPersistenceHarness.js');
const {
  assertPrivateFullReconciliation,
  observeCanonicalArgoInitLifecycle,
  observeSolePublicSemanticSurface,
} = require('../../harness/automaticSemanticLifecycleHarness.js');

async function main() {
  // GIVEN the concrete WP-P1 production backfill/store/Neo4j/checkpoint composition
  // and the shipped, uninjected canonical argo init control point
  const durableBackfill = await runProductionSemanticBackfill();
  const initLifecycle = await observeCanonicalArgoInitLifecycle();

  // WHEN durable backfill is interrupted, resumed, and rerun
  // THEN concrete checkpoints survive, completed identities are not replayed,
  // every channel persists complete evidence, and rerun is idempotent
  assert.strictEqual(durableBackfill.interruption.category, 'SP01_SYNTHETIC_INTERRUPTION');
  assert(durableBackfill.maximumObservedBatchSize <= 2, 'SP01_BOUNDED_BATCH_EXCEEDED');
  assert(durableBackfill.checkpoints.length >= 3, 'SP01_CHANNEL_CHECKPOINTS_INCOMPLETE');
  assert(durableBackfill.completedBeforeResume.length > 0, 'SP01_PRE_RESUME_IDENTITIES_MISSING');
  assert.deepStrictEqual(durableBackfill.replayedProviderIdentities, [], 'SP01_RESUME_REEMBEDDED_IDENTITY');
  assert.deepStrictEqual(durableBackfill.replayedUpsertIdentities, [], 'SP01_RESUME_REUPSERTED_IDENTITY');
  assert(
    durableBackfill.durableCheckpointOperations.some(item => item.kind === 'semantic-checkpoint-write'),
    'SP01_DURABLE_CHECKPOINT_NOT_EXERCISED',
  );
  assert(
    durableBackfill.durableAdapterOperations.some(item => item.kind === 'semantic-record-upsert'),
    'SP01_DURABLE_ADAPTER_NOT_EXERCISED',
  );
  assert.deepStrictEqual(
    [...new Set(durableBackfill.recordsAfterResume.map(record => record.channel))].sort(),
    [...CHANNELS].sort(),
    'SP01_THREE_CHANNEL_BACKFILL_INCOMPLETE',
  );
  for (const record of durableBackfill.recordsAfterResume) {
    assertCompleteMetadata(record, 'SP01_BACKFILL_METADATA_MISSING');
  }
  assert.strictEqual(
    durableBackfill.writesAfterRerun,
    durableBackfill.writesAfterResume,
    'SP01_IDEMPOTENT_RERUN_WROTE_DUPLICATES',
  );
  assert.strictEqual(durableBackfill.rerun.alignmentState, 'Aligned', 'SP01_RECONCILIATION_NOT_ALIGNED');
  assert.strictEqual(durableBackfill.canonicalJsonAfterRuns, durableBackfill.originalCanonicalJson);
  assert.strictEqual(durableBackfill.canonicalMutationAttempts, 0);

  // WHEN public discovery/routing and the real argo init path are observed
  const publicSurface = await observeSolePublicSemanticSurface();

  // THEN WP-P1 is consumed only by canonical init and no standalone route survives
  assertPrivateFullReconciliation(initLifecycle, publicSurface);
}

main().catch(error => {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
});

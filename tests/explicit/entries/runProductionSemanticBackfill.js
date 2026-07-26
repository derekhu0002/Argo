const assert = require('node:assert');
const {
  CHANNELS,
  assertCompleteMetadata,
  runProductionSemanticBackfill,
} = require('../../harness/productionSemanticPersistenceHarness.js');

async function main() {
  // GIVEN a structurally projected canonical graph with pre-existing Element, ArchitectureRelationship, and View records
  // WHEN an explicitly opted-in bounded production semantic backfill is interrupted, resumed, and rerun
  const observation = await runProductionSemanticBackfill();

  // THEN structural projection completes before semantic work and no fake canonical mutation occurs
  const structuralCompletionIndex = observation.events.indexOf('structural-projection-complete');
  const firstProviderBatchIndex = observation.events.findIndex(event => event.startsWith('provider-batch:'));
  assert(structuralCompletionIndex >= 0, 'SP01_STRUCTURAL_PROJECTION_COMPLETION_REQUIRED');
  assert(firstProviderBatchIndex > structuralCompletionIndex, 'SP01_BACKFILL_BEFORE_STRUCTURAL_PROJECTION');
  assert.strictEqual(
    observation.canonicalJsonAfterRuns,
    observation.originalCanonicalJson,
    'SP01_FAKE_CANONICAL_MUTATION_PROHIBITED',
  );

  // THEN bounded checkpoints survive interruption, isolate failures, and resume without restarting completed work
  assert.strictEqual(
    observation.interruption && observation.interruption.category,
    'SP01_SYNTHETIC_INTERRUPTION',
    'SP01_CHECKPOINT_INTERRUPTION_NOT_OBSERVED',
  );
  assert(observation.maximumObservedBatchSize <= 2, 'SP01_BOUNDED_BATCH_EXCEEDED');
  assert(observation.checkpoints.length >= 3, 'SP01_CHANNEL_CHECKPOINTS_INCOMPLETE');
  assert(
    observation.isolatedFailures.some(failure => failure.canonicalIdentity === 'View:view-beta'),
    'SP01_ISOLATED_RECORD_FAILURE_MISSING',
  );
  assert.strictEqual(
    observation.resumed && observation.resumed.resumedFromCheckpoint,
    true,
    'SP01_RESUME_RESTARTED_COMPLETED_WORK',
  );

  // THEN all three channels persist stable identity and complete versioned vector metadata
  const observedChannels = new Set(observation.recordsAfterResume.map(record => record.channel));
  assert.deepStrictEqual([...observedChannels].sort(), [...CHANNELS].sort(), 'SP01_THREE_CHANNEL_BACKFILL_INCOMPLETE');
  for (const record of observation.recordsAfterResume) {
    assertCompleteMetadata(record, 'SP01_BACKFILL_METADATA_MISSING');
  }

  // THEN rerun is idempotent and alignment is reported only after every channel completes
  assert.strictEqual(observation.writesAfterRerun, observation.writesAfterResume, 'SP01_IDEMPOTENT_RERUN_WROTE_DUPLICATES');
  assert.strictEqual(observation.rerun && observation.rerun.alignmentState, 'Aligned', 'SP01_ALIGNMENT_BEFORE_ALL_CHANNELS_COMPLETE');
  for (const channel of CHANNELS) {
    assert.strictEqual(
      observation.rerun
        && observation.rerun.channels
        && observation.rerun.channels[channel]
        && observation.rerun.channels[channel].status,
      'complete',
      `SP01_CHANNEL_NOT_COMPLETE:${channel}`,
    );
  }
}

main().catch(error => {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
});

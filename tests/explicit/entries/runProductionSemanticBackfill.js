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

  // THEN missing opt-in, mismatched structural version, credentials, or qualification fail before side effects
  assert.strictEqual(
    observation.missingOptIn.category,
    'SP01_EXPLICIT_OPT_IN_REQUIRED',
    'SP01_MISSING_OPT_IN_NOT_BLOCKED',
  );
  assert.strictEqual(
    observation.structuralVersionMismatch.category,
    'SP01_STRUCTURAL_VERSION_MISMATCH',
    'SP01_STRUCTURAL_VERSION_MISMATCH_NOT_BLOCKED',
  );
  assert.strictEqual(
    observation.missingCredentials.category,
    'EXTERNAL_CREDENTIALS_REQUIRED',
    'SP01_MISSING_EXTERNAL_CREDENTIALS_NOT_BLOCKED',
  );
  assert.strictEqual(
    observation.missingQualification.category,
    'EMBEDDING_QUALIFICATION_REQUIRED',
    'SP01_MISSING_PROVIDER_QUALIFICATION_NOT_BLOCKED',
  );

  // THEN the shipped JSON-RPC tools/call path owns a non-injected production composition root
  assert.strictEqual(
    observation.defaultMcpComposition.request.method,
    'tools/call',
    'SP01_DEFAULT_MCP_JSONRPC_TOOLS_CALL_REQUIRED',
  );
  assert.strictEqual(
    observation.defaultMcpComposition.request.params.name,
    'backfillSystemArchitectureSemanticProjection',
    'SP01_DEFAULT_MCP_OPERATOR_CALL_REQUIRED',
  );
  assert(
    !observation.defaultMcpComposition.responseText.includes(
      'productionGraphRagRuntime.runSemanticBackfill is required',
    ),
    'SP01_DEFAULT_MCP_PRODUCTION_COMPOSITION_MISSING: productionGraphRagRuntime.runSemanticBackfill is required',
  );
  assert(
    observation.defaultMcpComposition.responseText.includes('EXTERNAL_CREDENTIALS_REQUIRED'),
    'SP01_DEFAULT_MCP_EXTERNAL_CONFIGURATION_NOT_FAIL_CLOSED',
  );
  assert.strictEqual(
    observation.defaultMcpComposition.canonicalJsonAfter,
    observation.defaultMcpComposition.canonicalJsonBefore,
    'SP01_DEFAULT_MCP_FAKE_CANONICAL_MUTATION_TRIGGERED',
  );

  // THEN the MCP operator reaches runtime production composition after structural projection without fake mutation
  assert.strictEqual(
    observation.operatorName,
    'backfillSystemArchitectureSemanticProjection',
    'SP01_MCP_OPERATOR_NOT_EXPOSED',
  );
  const structuralCompletionIndex = observation.events.indexOf('structural-projection-complete');
  const firstProviderBatchIndex = observation.events.findIndex(event => event.startsWith('provider-batch:'));
  assert(structuralCompletionIndex >= 0, 'SP01_STRUCTURAL_PROJECTION_COMPLETION_REQUIRED');
  assert(firstProviderBatchIndex > structuralCompletionIndex, 'SP01_BACKFILL_BEFORE_STRUCTURAL_PROJECTION');
  assert.strictEqual(
    observation.canonicalJsonAfterRuns,
    observation.originalCanonicalJson,
    'SP01_FAKE_CANONICAL_MUTATION_PROHIBITED',
  );
  assert.strictEqual(observation.canonicalMutationAttempts, 0, 'SP01_FAKE_CANONICAL_MUTATION_TRIGGERED');

  // THEN durable checkpoints survive interruption and independent probes detect any replay on resume
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
  assert(observation.completedBeforeResume.length > 0, 'SP01_PRE_RESUME_COMPLETED_IDENTITIES_MISSING');
  assert.deepStrictEqual(
    observation.replayedProviderIdentities,
    [],
    'SP01_RESUME_REEMBEDDED_COMPLETED_IDENTITY',
  );
  assert.deepStrictEqual(
    observation.replayedUpsertIdentities,
    [],
    'SP01_RESUME_REUPSERTED_COMPLETED_IDENTITY',
  );
  assert(
    observation.durableCheckpointOperations.some(operation => operation.kind === 'semantic-checkpoint-write'),
    'SP01_DURABLE_CHECKPOINT_COMPOSITION_MISSING',
  );
  assert(
    observation.durableAdapterOperations.some(operation => operation.kind === 'semantic-record-upsert'),
    'SP01_DURABLE_PROJECTION_ADAPTER_COMPOSITION_MISSING',
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

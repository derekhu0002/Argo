const assert = require('node:assert');
const {
  runLiveProviderSecretIsolation,
  safeCategory,
} = require('../../harness/liveEmbeddingProviderHarness.js');

async function main() {
  // GIVEN explicit live-network opt-in and a provider credential supplied only by process injection
  // WHEN the real-provider and controlled-Neo4j flow completes and observable artifacts are inspected
  const observation = await runLiveProviderSecretIsolation();

  // THEN no secret-bearing field is exposed and the synthetic canary is absent from all observable channels
  assert.deepStrictEqual(
    observation.forbiddenSecretFields,
    [],
    `TS07_PROVIDER_SECRET_FIELD_EXPOSED:${observation.forbiddenSecretFields.join(',')}`,
  );
  assert.deepStrictEqual(observation.redaction.failure.leaks, [], 'TS07_PROVIDER_REDACTION_CANARY_LEAK');
  assert.strictEqual(observation.redaction.failure.providerCalls, 1, 'TS07_PROVIDER_REDACTION_TRANSPORT_COUNT');
  assert.strictEqual(observation.redaction.failure.writes, 0, 'TS07_PROVIDER_REDACTION_ZERO_WRITE');
  assert.deepStrictEqual(
    observation.redaction.syntheticSuccess.detectedLeakChannels,
    ['cypherTextAndParameters', 'graphEvidence'],
    'TS07_PROVIDER_REDACTION_VALUE_CHANNELS_NOT_DETECTED',
  );
  assert.strictEqual(
    observation.redaction.syntheticSuccess.persistedBeforeCleanup,
    1,
    'TS07_PROVIDER_REDACTION_RECORDING_BOUNDARY_NOT_EXERCISED',
  );
  assert.strictEqual(
    observation.redaction.syntheticSuccess.persistedAfterCleanup,
    0,
    'TS07_PROVIDER_REDACTION_CANARY_PERSISTED',
  );
  assert.deepStrictEqual(
    observation.redaction.syntheticSuccess.postCleanupLeaks,
    [],
    'TS07_PROVIDER_REDACTION_POST_CLEANUP_LEAK',
  );
  assert.deepStrictEqual(
    observation.redaction.syntheticSuccess.generatedArtifactLeaks,
    [],
    'TS07_PROVIDER_REDACTION_GENERATED_ARTIFACT_LEAK',
  );
  for (const requiredArtifact of [
    'requestObservation',
    'responseObservation',
    'qualificationEvidence',
    'graphEvidence',
    'cypherTextAndParameters',
    'failureObservations',
    'logs',
    'design/KG/SystemArchitecture.json',
    'design/KG/test-failure-records.json',
  ]) {
    assert(
      observation.inspectedArtifactNames.includes(requiredArtifact),
      `TS07_PROVIDER_SECRET_ARTIFACT_NOT_INSPECTED:${requiredArtifact}`,
    );
  }
  for (const redactionChannel of [
    'errorMessages',
    'stdout',
    'stderr',
    'logs',
    'latestFailureRecords',
    'cypherTextAndParameters',
    'graphEvidence',
  ]) {
    assert(
      observation.redaction.inspectedArtifactNames.includes(redactionChannel),
      `TS07_PROVIDER_REDACTION_CHANNEL_NOT_INSPECTED:${redactionChannel}`,
    );
  }

  // THEN the live path still proves a real provider call and controlled index evidence
  assert.strictEqual(
    observation.observation.transportObservation.callCount,
    1,
    'TS07_PROVIDER_SECRET_TRANSPORT_OBSERVATION_REQUIRED',
  );
  assert.strictEqual(
    observation.observation.writesAfter,
    1,
    'TS07_PROVIDER_SECRET_CONTROLLED_NEO4J_EVIDENCE_REQUIRED',
  );
}

main().catch(error => {
  console.error(safeCategory(error));
  process.exit(1);
});

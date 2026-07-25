const assert = require('node:assert');
const {
  runLiveProviderSecretIsolation,
  safeCategory,
} = require('../../harness/liveEmbeddingProviderHarness.js');

async function main() {
  // GIVEN explicit live-network opt-in and a provider credential supplied only by process injection
  // WHEN the real-provider and controlled-Neo4j flow completes and observable artifacts are inspected
  const observation = await runLiveProviderSecretIsolation();

  // THEN every source/path/ACL fixture is decided by the production configuration boundary
  for (const fixture of observation.sourceFixtures) {
    assert.strictEqual(
      fixture.status,
      fixture.expectedStatus || 'blocked',
      `TS07_PROVIDER_SOURCE_STATUS:${fixture.name}`,
    );
    assert.strictEqual(
      fixture.category,
      fixture.expectedCategory,
      `TS07_PROVIDER_SOURCE_CATEGORY:${fixture.name}`,
    );
    if (fixture.expectedAttribution) {
      assert.deepStrictEqual(
        fixture.attribution,
        fixture.expectedAttribution,
        `TS07_PROVIDER_SOURCE_ATTRIBUTION:${fixture.name}`,
      );
      assert.strictEqual(
        fixture.normalizedConfigMatches,
        true,
        `TS07_PROVIDER_NORMALIZED_CONFIGURATION:${fixture.name}`,
      );
      assert.strictEqual(
        fixture.sourceTraceComplete,
        true,
        `TS07_PROVIDER_STRUCTURED_SOURCE_TRACE:${fixture.name}`,
      );
    }
    assert.deepStrictEqual(
      fixture.effects,
      { fetch: 0, driver: 0, create: 0, write: 0 },
      `TS07_PROVIDER_PREFLIGHT_SIDE_EFFECT:${fixture.name}`,
    );
    assert.deepStrictEqual(
      fixture.leaks,
      [],
      `TS07_PROVIDER_SOURCE_CANARY_LEAK:${fixture.name}`,
    );
  }

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
  assert.deepStrictEqual(
    observation.redaction.neo4jAuthentication.authCalls,
    [{ usernamePresent: true, passwordMatches: true }],
    'TS07_PROVIDER_NEO4J_AUTH_ARGUMENTS_REQUIRED',
  );
  assert.strictEqual(
    observation.redaction.neo4jAuthentication.driverCalls,
    1,
    'TS07_PROVIDER_NEO4J_DRIVER_CALL_REQUIRED',
  );
  assert.strictEqual(
    observation.redaction.neo4jAuthentication.failureDriverCalls,
    1,
    'TS07_PROVIDER_NEO4J_AUTH_FAILURE_DRIVER_CALL_REQUIRED',
  );
  assert.strictEqual(
    observation.redaction.neo4jAuthentication.authenticationFailure.category,
    'LIVE_PROVIDER_OPERATION_FAILED',
    'TS07_PROVIDER_NEO4J_AUTH_FAILURE_CATEGORY',
  );
  assert.strictEqual(
    observation.redaction.neo4jAuthentication.failureQueries,
    0,
    'TS07_PROVIDER_NEO4J_AUTH_FAILURE_REACHED_QUERY',
  );
  assert.strictEqual(observation.redaction.neo4jAuthentication.writesBefore, 0, 'TS07_PROVIDER_NEO4J_AUTH_INITIAL_PERSISTENCE');
  assert.strictEqual(observation.redaction.neo4jAuthentication.graphEvidenceCount, 0, 'TS07_PROVIDER_NEO4J_AUTH_GRAPH_PERSISTENCE');
  assert.strictEqual(observation.redaction.neo4jAuthentication.writesAfterCleanup, 0, 'TS07_PROVIDER_NEO4J_AUTH_CLEANUP_PERSISTENCE');
  assert.deepStrictEqual(
    observation.redaction.neo4jAuthentication.leaks,
    [],
    'TS07_PROVIDER_NEO4J_AUTH_UNIFIED_CHANNEL_LEAK',
  );
  const authChannels = [
    'rawError',
    'sanitizedError',
    'successLogger',
    'failureLogger',
    'successStdout',
    'successStderr',
    'failureStdout',
    'failureStderr',
    'authCalls',
    'driverCalls',
    'cypherTextAndParameters',
    'graphEvidence',
    'persistence',
    'artifacts',
  ];
  for (const channel of authChannels) {
    assert(
      observation.redaction.neo4jAuthentication.inspectedChannelNames.includes(channel),
      `TS07_PROVIDER_NEO4J_AUTH_CHANNEL_NOT_INSPECTED:${channel}`,
    );
  }
  assert.deepStrictEqual(
    observation.redaction.neo4jAuthentication.leakDetectorChannels,
    [
      'rawError',
      'sanitizedError',
      'logger',
      'stdout',
      'stderr',
      'authCalls',
      'driverCalls',
      'cypherTextAndParameters',
      'graphEvidence',
      'persistence',
      'artifacts',
    ],
    'TS07_PROVIDER_NEO4J_AUTH_LEAK_DETECTOR_INCOMPLETE',
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

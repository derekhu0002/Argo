const assert = require('node:assert');
const {
  runLiveProviderSecretIsolation,
  safeCategory,
} = require('../../harness/liveEmbeddingProviderHarness.js');

async function main() {
  // GIVEN explicit live-network opt-in and a provider credential supplied only by process injection
  // WHEN the real-provider and controlled-Neo4j flow completes and observable artifacts are inspected
  const observation = await runLiveProviderSecretIsolation();

  // THEN the secret is absent from request evidence, logs, Cypher/graph evidence, failures, snapshots, and artifacts
  assert.deepStrictEqual(
    observation.leaks,
    [],
    `TS07_PROVIDER_SECRET_LEAK:${observation.leaks.join(',')}`,
  );
  for (const requiredArtifact of [
    'requestEvidence',
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

  // THEN the live path still proves a real provider call and controlled index evidence
  assert.strictEqual(
    observation.observation.success.liveProviderCall,
    true,
    'TS07_PROVIDER_SECRET_TEST_CANNOT_USE_FAKE_AS_LIVE_EVIDENCE',
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

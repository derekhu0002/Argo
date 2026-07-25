const assert = require('node:assert');
const {
  FAILURE_CASES,
  runLiveEmbeddingProviderE2E,
  safeCategory,
} = require('../../harness/liveEmbeddingProviderHarness.js');

async function main() {
  // GIVEN explicit live-network opt-in, the human-approved provider profile, and a controlled Neo4j instance
  // WHEN Node requests a real embedding through the qualification and index-delivery gate
  const observation = await runLiveEmbeddingProviderE2E();
  const { success } = observation;

  // THEN the frozen Harness independently observes one real request to the approved target
  assert.strictEqual(
    observation.transportObservation.callCount,
    1,
    'TS06_PROVIDER_E2E_REAL_HTTP_CALL_COUNT',
  );
  const observedRequest = observation.transportObservation.requests[0];
  assert.deepStrictEqual(
    {
      origin: observedRequest.origin,
      path: observedRequest.path,
      method: observedRequest.method,
      model: observedRequest.model,
      dimensions: observedRequest.dimensions,
      input: observedRequest.input,
      protectedHeaderPresent: observedRequest.protectedHeaderPresent,
    },
    {
      origin: 'https://llm-clids9mqc5o1mbvb.cn-beijing.maas.aliyuncs.com',
      path: '/compatible-mode/v1/embeddings',
      method: 'POST',
      model: 'qwen3.7-text-embedding',
      dimensions: 1024,
      input: observation.input,
      protectedHeaderPresent: true,
    },
    'TS06_PROVIDER_E2E_EXPLICIT_REQUEST_REQUIRED',
  );
  assert.strictEqual(
    success.qualification.version,
    'qualification-2026-07-25',
    'TS06_PROVIDER_E2E_QUALIFICATION_VERSION_REQUIRED',
  );

  // THEN only a finite numeric vector of the approved length is write-eligible
  assert(Array.isArray(success.vector), 'TS06_PROVIDER_E2E_VECTOR_REQUIRED');
  assert.strictEqual(success.vector.length, 1024, 'TS06_PROVIDER_E2E_DIMENSION_MISMATCH');
  assert(
    success.vector.every(value => typeof value === 'number' && Number.isFinite(value)),
    'TS06_PROVIDER_E2E_NON_FINITE_VECTOR',
  );
  assert.deepStrictEqual(
    success.vector,
    observation.transportObservation.responses[0].vector,
    'TS06_PROVIDER_E2E_TRANSPORT_RESPONSE_NOT_PROPAGATED',
  );
  assert.strictEqual(observation.writesBefore, 0, 'TS06_PROVIDER_E2E_DIRTY_TEST_INSTANCE');
  assert.strictEqual(observation.writesAfter, 1, 'TS06_PROVIDER_E2E_SUCCESS_WRITE_REQUIRED');
  assert.strictEqual(observation.graphEvidence.length, 1, 'TS06_PROVIDER_E2E_NEO4J_EVIDENCE_REQUIRED');
  assert.deepStrictEqual(
    observation.graphEvidence[0],
    {
      runId: observation.graphEvidence[0].runId,
      provider: observation.approvedProfile.provider,
      model: observation.approvedProfile.model,
      qualificationVersion: observation.approvedProfile.version,
      dimensions: 1024,
      ...observation.identities,
      vector: observation.transportObservation.responses[0].vector,
    },
    'TS06_PROVIDER_E2E_PERSISTED_METADATA_MISMATCH',
  );
  assert.strictEqual(observation.writesAfterCleanup, 0, 'TS06_PROVIDER_E2E_CLEANUP_INCOMPLETE');

  // THEN provider errors and every invalid qualification/vector case produce zero index writes
  assert.deepStrictEqual(
    observation.failureObservations.map(item => item.name),
    FAILURE_CASES.map(item => item.name),
    'TS06_PROVIDER_E2E_FAILURE_MATRIX_INCOMPLETE',
  );
  for (const failure of observation.failureObservations) {
    assert.strictEqual(failure.status, 'blocked', `TS06_PROVIDER_E2E_FAILURE_NOT_BLOCKED:${failure.name}`);
    assert.strictEqual(
      failure.providerCalls,
      failure.expectedProviderCalls,
      `TS06_PROVIDER_E2E_PROVIDER_CALL_BOUNDARY:${failure.name}`,
    );
    assert.strictEqual(failure.before, 0, `TS06_PROVIDER_E2E_PREEXISTING_WRITE:${failure.name}`);
    assert.strictEqual(failure.after, 0, `TS06_PROVIDER_E2E_ZERO_WRITE_VIOLATION:${failure.name}`);
    assert.strictEqual(
      failure.remainingAfterCleanup,
      0,
      `TS06_PROVIDER_E2E_FAILURE_CLEANUP_INCOMPLETE:${failure.name}`,
    );
    assert.deepStrictEqual(failure.redactionLeaks, [], `TS06_PROVIDER_E2E_ERROR_LEAK:${failure.name}`);
  }
}

main().catch(error => {
  console.error(safeCategory(error));
  process.exit(1);
});

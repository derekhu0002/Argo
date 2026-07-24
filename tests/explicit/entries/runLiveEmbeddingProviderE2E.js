const assert = require('node:assert');
const {
  FAILURE_SCENARIOS,
  runLiveEmbeddingProviderE2E,
  safeCategory,
} = require('../../harness/liveEmbeddingProviderHarness.js');

async function main() {
  // GIVEN explicit live-network opt-in, the human-approved provider profile, and a controlled Neo4j instance
  // WHEN Node requests a real embedding through the qualification and index-delivery gate
  const observation = await runLiveEmbeddingProviderE2E();
  const { success } = observation;

  // THEN the real provider request carries the approved identity and explicit dimensions
  assert.strictEqual(success.liveProviderCall, true, 'TS06_PROVIDER_E2E_REAL_HTTP_REQUIRED');
  assert.deepStrictEqual(
    success.requestEvidence,
    {
      baseUrl: 'https://llm-clids9mqc5o1mbvb.cn-beijing.maas.aliyuncs.com/compatible-mode/v1',
      model: 'qwen3.7-text-embedding',
      dimensions: 1024,
      inputCount: 1,
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
  assert.strictEqual(observation.writesBefore, 0, 'TS06_PROVIDER_E2E_DIRTY_TEST_INSTANCE');
  assert.strictEqual(observation.writesAfter, 1, 'TS06_PROVIDER_E2E_SUCCESS_WRITE_REQUIRED');
  assert.strictEqual(observation.graphEvidence.length, 1, 'TS06_PROVIDER_E2E_NEO4J_EVIDENCE_REQUIRED');
  assert.strictEqual(
    observation.graphEvidence[0].vectorLength,
    1024,
    'TS06_PROVIDER_E2E_PERSISTED_DIMENSIONS_MISMATCH',
  );

  // THEN provider errors and every invalid qualification/vector case produce zero index writes
  assert.deepStrictEqual(
    observation.failureObservations.map(item => item.scenario),
    [...FAILURE_SCENARIOS],
    'TS06_PROVIDER_E2E_FAILURE_MATRIX_INCOMPLETE',
  );
  for (const failure of observation.failureObservations) {
    assert.strictEqual(failure.status, 'blocked', `TS06_PROVIDER_E2E_FAILURE_NOT_BLOCKED:${failure.scenario}`);
    assert.strictEqual(failure.before, 0, `TS06_PROVIDER_E2E_PREEXISTING_WRITE:${failure.scenario}`);
    assert.strictEqual(failure.after, 0, `TS06_PROVIDER_E2E_ZERO_WRITE_VIOLATION:${failure.scenario}`);
  }
}

main().catch(error => {
  console.error(safeCategory(error));
  process.exit(1);
});

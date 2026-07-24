const assert = require('node:assert');
const {
  runNativeRetrievalRequest,
} = require('../../harness/productionGraphRagHarness.js');

async function main() {
  // GIVEN an aligned Neo4j-native projection for the approved canonical version
  // WHEN the production runtime performs semantic seed retrieval
  const request = {
    intent: 'Find approved production intent',
    canonicalVersion: 'canonical-v2',
    channels: ['Element', 'ArchitectureRelationship', 'View'],
  };
  const observation = await runNativeRetrievalRequest(request);
  const result = observation.result;

  // THEN the injected retrieval boundary is called exactly once with the complete request
  assert.strictEqual(observation.invocationCount, 1, 'TS01_NATIVE_BOUNDARY_CALL_COUNT');
  assert.deepStrictEqual(observation.observedRequests, [request], 'TS01_NATIVE_REQUEST_PROPAGATION');

  // THEN the implementation propagates the probe's runtime-generated full result unchanged
  assert.deepStrictEqual(
    result,
    observation.expectedResult,
    'TS01_NATIVE_DYNAMIC_RESULT_NOT_PROPAGATED',
  );
  assert(
    JSON.stringify(result).includes(observation.sentinel),
    'TS01_NATIVE_DYNAMIC_SENTINEL_MISSING',
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

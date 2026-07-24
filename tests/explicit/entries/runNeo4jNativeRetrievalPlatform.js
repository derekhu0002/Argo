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

  // THEN returned native evidence is real boundary output, not a hardcoded platform label
  assert.strictEqual(result.retrievalPlatform, 'neo4j-native', 'TS01_NATIVE_RETRIEVAL_REQUIRED');
  assert.strictEqual(result.canonicalVersion, 'canonical-v2', 'TS01_NATIVE_CANONICAL_VERSION_REQUIRED');
  assert(
    result.seeds.some(seed => seed.id === 'approved-element'),
    'TS01_NATIVE_APPROVED_SEED_MISSING',
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

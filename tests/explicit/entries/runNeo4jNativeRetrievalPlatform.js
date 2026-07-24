const assert = require('node:assert');
const {
  runProductionSemanticQuery,
} = require('../../harness/productionGraphRagHarness.js');

async function main() {
  // GIVEN an aligned Neo4j-native projection for the approved canonical version
  // WHEN the production runtime performs semantic seed retrieval
  const result = await runProductionSemanticQuery();

  // THEN native evidence is used but remains explicitly subordinate to canonical authority
  assert.strictEqual(result.retrievalPlatform, 'neo4j-native', 'TS01_NATIVE_RETRIEVAL_REQUIRED');
  assert.strictEqual(result.canonicalAuthority, 'canonical', 'TS01_NATIVE_CANONICAL_AUTHORITY_REQUIRED');
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

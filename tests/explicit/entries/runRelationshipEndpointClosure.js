const assert = require('node:assert');
const {
  assertRelationshipEndpointClosure,
  governingCanonicalVersionFromLegacyResult,
  readAsUnchangedConsumer,
  readForPurposeClosure,
} = require('../../harness/intentArchitectureQueryHarness.js');

async function main() {
  // GIVEN a relationship seed whose endpoints are not semantic matches
  const legacyResult = await readAsUnchangedConsumer();
  const governingCanonicalVersion = governingCanonicalVersionFromLegacyResult(legacyResult);
  const result = await readForPurposeClosure({
    purpose: 'implementation-design',
    intent: 'Inspect a relationship and its required endpoints',
    anchors: ['grag-purpose-closure'],
    endpointClosureFixture: {
      requiresReturnedRelationship: true,
      requiresDanglingEndpointError: true,
      requiresCrossVersionEndpointError: true,
    },
  });

  // WHEN endpoint closure is observed
  assert(result && result.result, 'DT13_RELATIONSHIP_SEED_MISSING');

  // THEN every returned relationship has same-version endpoints or explicit structural errors
  assertRelationshipEndpointClosure(result, { governingCanonicalVersion });
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

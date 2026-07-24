const assert = require('node:assert');
const { readForPurpose } = require('../../harness/intentArchitectureQueryHarness.js');

async function main() {
  // GIVEN a relationship seed whose endpoints are not semantic matches
  const result = await readForPurpose({
    purpose: 'implementation-design',
    intent: 'Inspect a relationship and its required endpoints',
  });

  // WHEN endpoint closure is observed
  const closure = result.result && result.result.endpointClosure;

  // THEN the relationship and both endpoints are present with endpoint provenance
  assert(closure && closure.relationship, 'DT13_RELATIONSHIP_SEED_MISSING');
  assert(Array.isArray(closure && closure.endpoints) && closure.endpoints.length === 2, 'DT13_ENDPOINTS_INCOMPLETE');
  assert(
    closure.endpoints.every(endpoint => endpoint.firstInclusionReason === 'endpoint-closure'),
    'DT13_ENDPOINT_PROVENANCE_MISSING',
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

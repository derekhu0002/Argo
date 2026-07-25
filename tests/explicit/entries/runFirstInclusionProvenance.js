const assert = require('node:assert');
const {
  assertFirstInclusionProvenance,
  readForPurposeClosure,
} = require('../../harness/intentArchitectureQueryHarness.js');

async function main() {
  // GIVEN a query exercising semantic, endpoint, purpose-policy, and View inclusions
  const result = await readForPurposeClosure({
    purpose: 'implementation-design',
    intent: 'Explain why each returned intent object is included',
    anchors: ['grag-provenance', 'grag-endpoint-closure', 'grag-view-closure'],
  });

  // WHEN object-level provenance is observed
  assert(result && result.result, 'DT15_PROVENANCE_OBJECTS_MISSING');

  // THEN every object has one first reason plus non-overwriting policy/index/version evidence
  assertFirstInclusionProvenance(result);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

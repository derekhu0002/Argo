const assert = require('node:assert');
const {
  assertFirstInclusionProvenance,
  readForPurposeClosure,
} = require('../../harness/intentArchitectureQueryHarness.js');

const duplicatePathFixtures = Object.freeze([
  Object.freeze({
    objectId: 'w6-duplicate-semantic-endpoint',
    discoveryOrder: Object.freeze([
      'semantic-seed',
      'relationship-endpoint-closure',
      'purpose-policy-closure',
      'complete-view-closure',
    ]),
    expectedFirstInclusionReason: 'semantic-seed',
    expectedSupplementaryReasons: Object.freeze([
      'relationship-endpoint-closure',
      'purpose-policy-closure',
      'complete-view-closure',
    ]),
  }),
  Object.freeze({
    objectId: 'w6-duplicate-endpoint-policy',
    discoveryOrder: Object.freeze([
      'relationship-endpoint-closure',
      'purpose-policy-closure',
      'complete-view-closure',
    ]),
    expectedFirstInclusionReason: 'relationship-endpoint-closure',
    expectedSupplementaryReasons: Object.freeze([
      'purpose-policy-closure',
      'complete-view-closure',
    ]),
  }),
]);

async function main() {
  // GIVEN a query exercising semantic, endpoint, purpose-policy, and View inclusions
  const result = await readForPurposeClosure({
    purpose: 'implementation-design',
    intent: 'Explain why each returned intent object is included',
    anchors: ['grag-provenance', 'grag-endpoint-closure', 'grag-view-closure'],
    duplicatePathFixtures,
  });

  // WHEN object-level provenance is observed
  assert(result && result.result, 'DT15_PROVENANCE_OBJECTS_MISSING');

  // THEN every object has one first reason plus non-overwriting policy/index/version evidence
  assertFirstInclusionProvenance(result, { duplicatePathFixtures });
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

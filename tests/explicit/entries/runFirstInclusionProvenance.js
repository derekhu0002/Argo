const assert = require('node:assert');
const { readForPurpose } = require('../../harness/intentArchitectureQueryHarness.js');

async function main() {
  // GIVEN a query exercising semantic, endpoint, purpose-policy, and View inclusions
  const result = await readForPurpose({
    purpose: 'implementation-design',
    intent: 'Explain why each returned intent object is included',
  });

  // WHEN object-level provenance is observed
  const objects = result.result && result.result.objects;

  // THEN every object has one first reason plus purpose and version evidence
  assert(Array.isArray(objects) && objects.length > 0, 'DT15_PROVENANCE_OBJECTS_MISSING');
  assert(objects.every(object => object.firstInclusionReason), 'DT15_FIRST_INCLUSION_REASON_MISSING');
  assert(result.query && result.query.purpose, 'DT15_PURPOSE_EVIDENCE_MISSING');
  assert(result.query && result.query.canonicalVersion, 'DT15_VERSION_EVIDENCE_MISSING');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

const assert = require('node:assert');
const { readForPurpose } = require('../../harness/intentArchitectureQueryHarness.js');

async function main() {
  // GIVEN phase-1 cardinality and measured precision for each declared purpose
  const result = await readForPurpose({
    purpose: 'audit',
    intent: 'Collect phase-1 capacity evidence',
    subject: 'grag-capacity-residual',
  });

  // WHEN capacity evidence is observed
  const capacity = result.result && result.result.capacityEvidence;

  // THEN evidence is available and no silent capacity control exists
  assert(Array.isArray(capacity && capacity.byPurpose), 'DT19_CAPACITY_EVIDENCE_MISSING');
  for (const forbidden of ['cap', 'budget', 'pagination', 'truncation', 'continuation']) {
    assert.strictEqual(capacity[forbidden], undefined, `DT19_SILENT_${forbidden.toUpperCase()}_FORBIDDEN`);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

const assert = require('node:assert');
const { readForPurpose } = require('../../harness/intentArchitectureQueryHarness.js');

async function main() {
  // GIVEN conflicting code evidence and an unrelated textually similar capability
  const result = await readForPurpose({
    purpose: 'coding-repair',
    intent: 'Repair code that conflicts with authoritative intent',
  });

  // WHEN coding-repair closure is observed
  const repair = result.result && result.result.repairContext;

  // THEN intent is authoritative and safety evidence excludes unrelated capabilities
  assert.strictEqual(repair && repair.authority, 'intent', 'DT10_INTENT_AUTHORITY_MISSING');
  assert(Array.isArray(repair && repair.guardrails), 'DT10_REPAIR_GUARDRAILS_MISSING');
  assert.strictEqual(repair && repair.includesUnrelatedSimilarCapability, false, 'DT10_UNRELATED_CAPABILITY_INCLUDED');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

const assert = require('node:assert');
const {
  assertCodingRepairClosure,
  readForPurposeClosure,
} = require('../../harness/intentArchitectureQueryHarness.js');

async function main() {
  // GIVEN conflicting code evidence and an unrelated textually similar capability
  const result = await readForPurposeClosure({
    purpose: 'coding-repair',
    intent: 'Repair code that conflicts with authoritative intent',
    anchors: ['grag-repair-policy'],
    conflictingCodeEvidence: true,
    unrelatedSimilarCapability: 'grag-implementation-policy',
  });

  // WHEN coding-repair closure is observed
  const repair = result.result && result.result.repairContext;

  // THEN intent is authoritative and safety evidence excludes unrelated capabilities
  assertCodingRepairClosure(result);
  assert(Array.isArray(repair.acceptanceSemantics) && repair.acceptanceSemantics.length > 0, 'DT10_ACCEPTANCE_SEMANTICS_MISSING');
  assert(Array.isArray(repair.atRiskOutcomes), 'DT10_AT_RISK_OUTCOMES_MISSING');
  assert.strictEqual(repair.includesImplementationPlanningScope, false, 'DT10_IMPLEMENTATION_PLANNING_IMPORTED');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

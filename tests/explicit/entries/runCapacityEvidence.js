const assert = require('node:assert');
const {
  evaluateCapacityEvidence,
} = require('../../harness/productionGraphRagHarness.js');

const DECLARED_PURPOSES = [
  'intent-decision',
  'implementation-design',
  'coding-repair',
  'audit',
  'graph-tidy',
];
const MISSING_BOUNDARY_CATEGORY = 'DT19_CAPACITY_EVIDENCE_BOUNDARY_MISSING';

async function main() {
  // GIVEN phase-1 cardinality and measured precision for each declared purpose
  const outcome = await evaluateCapacityEvidence({
    purposes: DECLARED_PURPOSES,
  });

  // WHEN capacity evidence is observed
  assert.strictEqual(
    outcome.status,
    'passed',
    outcome.error && outcome.error.category
      ? outcome.error.category
      : MISSING_BOUNDARY_CATEGORY,
  );
  const capacity = outcome.capacityEvidence;

  // THEN evidence is available and no silent capacity control exists
  assert(Array.isArray(capacity && capacity.byPurpose), 'DT19_CAPACITY_EVIDENCE_MISSING');
  assert.deepStrictEqual(
    capacity.byPurpose.map(evidence => evidence && evidence.purpose).sort(),
    [...DECLARED_PURPOSES].sort(),
    'DT19_DECLARED_PURPOSE_EVIDENCE_INCOMPLETE',
  );
  for (const evidence of capacity.byPurpose) {
    assert(
      Number.isInteger(evidence.resultCardinality) && evidence.resultCardinality >= 0,
      `DT19_RESULT_CARDINALITY_NOT_RECORDED: ${evidence && evidence.purpose}`,
    );
    assert(
      typeof evidence.measuredPrecision === 'number'
        && Number.isFinite(evidence.measuredPrecision)
        && evidence.measuredPrecision >= 0
        && evidence.measuredPrecision <= 1,
      `DT19_MEASURED_PRECISION_NOT_RECORDED: ${evidence && evidence.purpose}`,
    );
  }
  for (const forbidden of ['cap', 'budget', 'pagination', 'truncation', 'continuation', 'topK', 'tokenBudget', 'resultLimit']) {
    assert.strictEqual(capacity[forbidden], undefined, `DT19_SILENT_${forbidden.toUpperCase()}_FORBIDDEN`);
  }
  assert.strictEqual(
    capacity.capacityPolicyDecision,
    undefined,
    'DT19_CAPACITY_POLICY_DECISION_FORBIDDEN',
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

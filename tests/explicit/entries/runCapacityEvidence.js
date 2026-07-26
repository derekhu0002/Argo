const assert = require('node:assert');
const {
  evaluateCapacityEvidence,
  evaluatePhase1QualityBenchmark,
  phase1BusinessBenchmarkFixture,
} = require('../../harness/productionGraphRagHarness.js');

const MISSING_BOUNDARY_CATEGORY = 'DT19_CAPACITY_EVIDENCE_BOUNDARY_MISSING';

async function main() {
  // GIVEN real DT-18 phase-1 quality evidence for each declared purpose
  const benchmark = phase1BusinessBenchmarkFixture();
  const declaredPurposes = benchmark.purposes.map(purpose => purpose.purpose);
  const qualityOutcome = await evaluatePhase1QualityBenchmark({ benchmark });
  assert.strictEqual(
    qualityOutcome.status,
    'passed',
    qualityOutcome.error && qualityOutcome.error.category
      ? qualityOutcome.error.category
      : 'DT18_PHASE1_QUALITY_EVIDENCE_REQUIRED',
  );

  // WHEN DT-19 capacity evidence is observed from the real DT-18 output
  const outcome = await evaluateCapacityEvidence({
    purposes: declaredPurposes,
    qualityEvidence: qualityOutcome.qualityEvidence,
  });

  // THEN evidence is available and no silent capacity control exists
  assert.strictEqual(
    outcome.status,
    'passed',
    failureCategory(outcome, MISSING_BOUNDARY_CATEGORY),
  );
  const capacity = outcome.capacityEvidence;

  assert(Array.isArray(capacity && capacity.byPurpose), 'DT19_CAPACITY_EVIDENCE_MISSING');
  assert.deepStrictEqual(
    capacity.byPurpose.map(evidence => evidence && evidence.purpose).sort(),
    [...declaredPurposes].sort(),
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

  // THEN missing real DT-18 quality evidence blocks explicitly instead of using Harness defaults
  const missingQualityEvidence = await evaluateCapacityEvidence({
    purposes: declaredPurposes,
  });
  assert.strictEqual(
    missingQualityEvidence.status,
    'blocked',
    'DT19_MISSING_QUALITY_EVIDENCE_ACCEPTED',
  );
  assert.strictEqual(
    missingQualityEvidence.error && missingQualityEvidence.error.category,
    'DT19_QUALITY_EVIDENCE_REQUIRED',
    failureCategory(missingQualityEvidence, 'DT19_QUALITY_EVIDENCE_REQUIRED'),
  );
}

function failureCategory(outcome, fallback) {
  if (!outcome || !outcome.error || !outcome.error.category) {
    return fallback;
  }
  return outcome.error.field
    ? `${outcome.error.category}: ${outcome.error.field}`
    : outcome.error.category;
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

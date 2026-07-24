const assert = require('node:assert');
const { readForPurpose } = require('../../harness/intentArchitectureQueryHarness.js');

async function main() {
  // GIVEN the human-approved five-purpose benchmark
  const result = await readForPurpose({
    purpose: 'audit',
    intent: 'Evaluate retrieval quality benchmark',
    subject: 'grag-quality-gate',
  });

  // WHEN aggregate quality evidence is observed
  const quality = result.result && result.result.qualityEvidence;

  // THEN critical recall and closure are complete without an invented threshold
  assert.strictEqual(quality && quality.criticalSeedRecall, 1, 'DT18_CRITICAL_SEED_RECALL_FAILURE');
  assert.strictEqual(quality && quality.expectedClosureCorrect, true, 'DT18_EXPECTED_CLOSURE_FAILURE');
  assert.strictEqual(quality && quality.unrelatedForcedHits, 0, 'DT18_UNRELATED_FORCED_HITS');
  assert.strictEqual(quality && quality.releasePrecisionThreshold, undefined, 'DT18_INVENTED_PRECISION_THRESHOLD');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

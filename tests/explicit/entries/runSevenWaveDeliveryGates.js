const assert = require('node:assert');
const {
  evaluateSevenWaveDelivery,
} = require('../../harness/productionGraphRagHarness.js');

async function main() {
  // GIVEN only W1 is complete and W2 through W6 lack delivery evidence
  // WHEN W7 delivery is attempted out of prerequisite order
  const outcome = await evaluateSevenWaveDelivery(['W1']);

  // THEN W7 remains blocked and the missing prerequisite waves are observable
  assert.strictEqual(outcome.status, 'blocked', 'TS08_OUT_OF_ORDER_DELIVERY_NOT_BLOCKED');
  assert.strictEqual(outcome.error.category, 'DELIVERY_PREREQUISITES_INCOMPLETE', outcome.error.category || 'TS08_GATE_CATEGORY_MISSING');
  assert.deepStrictEqual(outcome.missingWaves, ['W2', 'W3', 'W4', 'W5', 'W6'], 'TS08_MISSING_WAVES_INCOMPLETE');

  // GIVEN W2-W6 are accepted but W7 DT-18 benchmark evidence is missing or failed
  // WHEN whole delivery is attempted
  const qualityBlocked = await evaluateSevenWaveDelivery({
    completedWaves: ['W2', 'W3', 'W4', 'W5', 'W6'],
    qualityBenchmark: { status: 'failed', failureReason: 'DT18_KEY_SEED_RECALL_NOT_100_PERCENT' },
    deliveryIntent: 'whole-delivery',
  });

  // THEN whole delivery remains blocked by the W7 business benchmark gate
  assert.strictEqual(qualityBlocked.status, 'blocked', 'TS08_WHOLE_DELIVERY_WITHOUT_W7_QUALITY');
  assert.strictEqual(
    qualityBlocked.error.category,
    'W7_QUALITY_BENCHMARK_REQUIRED',
    qualityBlocked.error.category || 'TS08_W7_QUALITY_GATE_CATEGORY_MISSING',
  );

  // GIVEN W2-W6 are accepted and the W7 DT-18 benchmark has passed
  // WHEN whole delivery is attempted in order
  const allowed = await evaluateSevenWaveDelivery({
    completedWaves: ['W2', 'W3', 'W4', 'W5', 'W6'],
    qualityBenchmark: {
      status: 'passed',
      keySeedRecall: 1,
      closureCorrectness: 1,
      unrelatedForcedHits: 0,
      aggregatePrecision: 0.91,
    },
    deliveryIntent: 'whole-delivery',
  });

  // THEN delivery is allowed only after prerequisite and W7 quality evidence pass
  assert.strictEqual(allowed.status, 'allowed', 'TS08_ORDERED_DELIVERY_NOT_ALLOWED');
  assert.strictEqual(allowed.releaseAllowed, true, 'TS08_RELEASE_ALLOWED_FLAG_MISSING');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

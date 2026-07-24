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
  assert.strictEqual(outcome.error.category, 'DELIVERY_PREREQUISITES_INCOMPLETE', 'TS08_GATE_CATEGORY_MISSING');
  assert.deepStrictEqual(outcome.missingWaves, ['W2', 'W3', 'W4', 'W5', 'W6'], 'TS08_MISSING_WAVES_INCOMPLETE');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

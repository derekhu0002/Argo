const assert = require('node:assert');
const { readForPurpose } = require('../../harness/intentArchitectureQueryHarness.js');

async function main() {
  // GIVEN approved queries for Element, Relationship, View, many-peer, and unrelated cases
  const result = await readForPurpose({
    purpose: 'implementation-design',
    intent: 'Find independently qualifying Element, Relationship, and View seeds',
  });

  // WHEN semantic seed channels are observed
  const seedsByType = result.result && result.result.seedsByType;

  // THEN each object category is independent and no fixed count is forced
  assert(Array.isArray(seedsByType && seedsByType.elements), 'DT04_ELEMENT_SEED_CHANNEL_MISSING');
  assert(Array.isArray(seedsByType && seedsByType.relationships), 'DT04_RELATIONSHIP_SEED_CHANNEL_MISSING');
  assert(Array.isArray(seedsByType && seedsByType.views), 'DT04_VIEW_SEED_CHANNEL_MISSING');
  assert.strictEqual(result.result.fixedResultLimit, undefined, 'DT05_FIXED_RESULT_LIMIT_FORBIDDEN');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

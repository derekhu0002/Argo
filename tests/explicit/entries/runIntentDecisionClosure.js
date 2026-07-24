const assert = require('node:assert');
const { readForPurpose } = require('../../harness/intentArchitectureQueryHarness.js');

async function main() {
  // GIVEN an approved capability-change intent-decision query
  const result = await readForPurpose({
    purpose: 'intent-decision',
    intent: 'Decide a capability change',
  });

  // WHEN intent-decision closure is returned
  const concerns = result.result && result.result.concerns;

  // THEN Why, What, business behavior, and Acceptance are present or declared absent
  for (const concern of ['why', 'what', 'businessBehavior', 'acceptance']) {
    assert(
      concerns && (concerns[concern] || (concerns.absent || []).includes(concern)),
      `DT08_INTENT_CONCERN_UNACCOUNTED: ${concern}`,
    );
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

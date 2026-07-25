const assert = require('node:assert');
const {
  assertCompleteViewClosure,
  readForPurposeClosure,
} = require('../../harness/intentArchitectureQueryHarness.js');

async function main() {
  // GIVEN a target View that overlaps unrelated Views
  const result = await readForPurposeClosure({
    purpose: 'implementation-design',
    intent: 'Read one complete target View',
    anchors: ['grag-view-closure'],
  });

  // WHEN complete-View closure is observed
  assert(result && result.result, 'DT14_TARGET_VIEW_MISSING');

  // THEN the target View is complete and overlapping Views do not cascade
  assertCompleteViewClosure(result);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

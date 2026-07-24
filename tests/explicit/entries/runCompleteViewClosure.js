const assert = require('node:assert');
const { readForPurpose } = require('../../harness/intentArchitectureQueryHarness.js');

async function main() {
  // GIVEN a target View that overlaps unrelated Views
  const result = await readForPurpose({
    purpose: 'implementation-design',
    intent: 'Read one complete target View',
  });

  // WHEN complete-View closure is observed
  const views = result.result && result.result.views;

  // THEN the target is complete and every returned relationship has both endpoints
  assert(Array.isArray(views) && views.length > 0, 'DT14_TARGET_VIEW_MISSING');
  assert(
    views.every(view => view.complete === true && (view.relationships || []).every(rel => rel.source && rel.target)),
    'DT14_VIEW_OR_ENDPOINT_CLOSURE_INCOMPLETE',
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

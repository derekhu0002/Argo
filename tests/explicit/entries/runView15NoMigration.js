const {
  observeProspectiveCapacityStability,
} = require('../../harness/viewCapacityPolicyHarness.js');

async function main() {
  // GIVEN every canonical View membership array before policy activation
  const stabilityBoundary = await observeProspectiveCapacityStability();

  // WHEN an unrelated governed dry-run marks policy activation on a canonical temp copy
  // THEN all canonical included_elements and included_relationships remain unchanged
  return stabilityBoundary;
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

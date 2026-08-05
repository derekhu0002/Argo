const {
  observeIndirectEndpointMembershipGrowth,
} = require('../../harness/viewCapacityPolicyHarness.js');

async function main() {
  // GIVEN an existing 15-element View and actual focused/batch relationship operations that introduce endpoint membership
  const indirectGrowthBoundary = await observeIndirectEndpointMembershipGrowth();

  // WHEN focused and batch relationship add/update writes would grow the View to 16 elements
  // THEN each route fails before persistence and leaves the temporary graph membership unchanged
  return indirectGrowthBoundary;
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

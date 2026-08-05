const {
  observeDirectMembershipGrowth,
  observeGlobalViewCapacityBoundary,
} = require('../../harness/viewCapacityPolicyHarness.js');

async function main() {
  // GIVEN otherwise-valid Views under multiple valid Viewpoints/member categories with direct membership growth routes
  await observeGlobalViewCapacityBoundary();
  const directGrowthBoundary = await observeDirectMembershipGrowth();

  // WHEN governed preview and write operations evaluate View capacity
  // THEN exact 15 is accepted, 16 is rejected without persistence, and direct growth routes use the same gate
  return directGrowthBoundary;
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

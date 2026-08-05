const {
  observeRelationshipCountingBoundary,
} = require('../../harness/viewCapacityPolicyHarness.js');

async function main() {
  // GIVEN a 15-element View with multiple in-View relationships and a broken-endpoint View
  const relationshipBoundary = await observeRelationshipCountingBoundary();

  // WHEN the governed mutation preview evaluates capacity and relationship integrity
  // THEN relationships consume no quota while endpoint coexistence remains mandatory
  return relationshipBoundary;
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

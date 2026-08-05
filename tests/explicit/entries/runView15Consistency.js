const {
  observeActiveAuthorityConsistency,
} = require('../../harness/viewCapacityPolicyHarness.js');

async function main() {
  // GIVEN historical seven-element evidence plus active View capacity authority surfaces
  const consistencyBoundary = await observeActiveAuthorityConsistency();

  // WHEN active authority is reviewed for the approved View15 policy
  // THEN historical evidence remains unchanged and active diagnostics/tests use 15
  return consistencyBoundary;
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

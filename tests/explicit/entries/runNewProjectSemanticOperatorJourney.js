const {
  assertAutomaticInitLifecycle,
  observeAutomaticInitLifecycle,
} = require('../../harness/automaticSemanticLifecycleHarness.js');

async function main() {
  // GIVEN a pre-existing durable verified Aligned record, the exact dual-gate
  // matrix, external configuration failures, interruption, resume, and rerun
  const automaticInitLifecycle = await observeAutomaticInitLifecycle();

  // WHEN canonical argo init owns the internal semantic lifecycle
  // THEN every outcome transforms that same record before semantic effects;
  // failures stay durable and redacted, while success aligns only after verification
  assertAutomaticInitLifecycle(automaticInitLifecycle);
}

main().catch(error => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});

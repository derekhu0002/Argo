const {
  assertAutomaticInitLifecycle,
  observeAutomaticInitLifecycle,
} = require('../../harness/automaticSemanticLifecycleHarness.js');

async function main() {
  // GIVEN fresh and prior structural-only projects, the exact dual-gate matrix,
  // safe/missing/unsafe external configuration, interruption, resume, and rerun
  const automaticInitLifecycle = await observeAutomaticInitLifecycle();

  // WHEN canonical argo init owns the internal semantic lifecycle
  // THEN enabled valid execution reconciles durably, disabled is structural-only,
  // half-enabled/unsafe/missing fail closed, and reruns resume or align
  assertAutomaticInitLifecycle(automaticInitLifecycle);
}

main().catch(error => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});

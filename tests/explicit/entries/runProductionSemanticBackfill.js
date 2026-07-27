const {
  assertPrivateFullReconciliation,
  observeAutomaticInitLifecycle,
  observeSolePublicSemanticSurface,
} = require('../../harness/automaticSemanticLifecycleHarness.js');

async function main() {
  // GIVEN canonical argo init with dual-enabled valid configuration, interruption,
  // durable resume, unchanged rerun, and complete Element/Relationship/View channels
  const initLifecycle = await observeAutomaticInitLifecycle();

  // WHEN public discovery/routing and private WP-P1 consumption are observed
  const publicSurface = await observeSolePublicSemanticSurface();

  // THEN full reconciliation remains private, complete, resumable, idempotent,
  // queryability/coherence-gated, and unavailable as a standalone public tool
  assertPrivateFullReconciliation(initLifecycle, publicSurface);
}

main().catch(error => {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
});

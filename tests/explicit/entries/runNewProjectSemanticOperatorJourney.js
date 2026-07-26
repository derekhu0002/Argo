const {
  assertNewProjectSemanticOperatorJourney,
  assertRejectedAutomaticBackfillControls,
  runNewProjectSemanticOperatorJourney,
} = require('../../harness/productionSemanticOperatorJourneyHarness.js');
const {
  assertProductionSemanticOperatorAdapterLifecycle,
  runProductionSemanticOperatorAdapterLifecycle,
} = require('../../harness/productionSemanticOperatorAdapterLifecycleHarness.js');

async function main() {
  // GIVEN two fresh projects with equivalent approved external configuration that differ
  // only by automatic-backfill opt-in, plus missing consent/configuration controls,
  // contradictory WP-P2 readiness records, and durable attestation trust fixtures
  const operatorJourney = await runNewProjectSemanticOperatorJourney();
  const adapterLifecycle = await runProductionSemanticOperatorAdapterLifecycle();

  // WHEN each project follows argo init -> canonical structural projection -> semantic
  // backfill -> explicit readiness verification -> durable revalidation -> semantic query,
  // while exported MCP fallback, missing stores, drift, and unsafe Windows ACLs are rejected
  assertNewProjectSemanticOperatorJourney(operatorJourney);

  // THEN rejected opt-ins have zero automatic/backfill/provider/database effects, errors
  // remain actionable and redacted, WP-P2 verified remains the sole readiness verdict,
  // diagnostics/remediation remain exact, implicit effects are absent, and snapshots remain canonical
  assertRejectedAutomaticBackfillControls(operatorJourney);
  assertProductionSemanticOperatorAdapterLifecycle(adapterLifecycle);
}

main().catch(error => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});

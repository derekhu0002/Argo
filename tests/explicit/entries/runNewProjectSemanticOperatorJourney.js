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
  // only by automatic-backfill opt-in, plus missing consent/configuration controls and
  // contradictory WP-P2 readiness verdict/diagnostic records
  const operatorJourney = await runNewProjectSemanticOperatorJourney();
  const adapterLifecycle = await runProductionSemanticOperatorAdapterLifecycle();

  // WHEN each project follows argo init -> canonical structural projection -> semantic
  // backfill -> explicit readiness verification -> semantic query through operator commands,
  // while direct/CLI backfill without consent and query without explicit readiness are rejected
  assertNewProjectSemanticOperatorJourney(operatorJourney);

  // THEN rejected opt-ins have zero automatic/backfill/provider/database effects, errors
  // remain actionable and redacted, WP-P2 verified remains the sole readiness verdict,
  // diagnostics remain exact, implicit effects are absent, and snapshots remain canonical
  assertRejectedAutomaticBackfillControls(operatorJourney);
  assertProductionSemanticOperatorAdapterLifecycle(adapterLifecycle);
}

main().catch(error => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});

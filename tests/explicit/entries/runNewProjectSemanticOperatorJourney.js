const {
  assertNewProjectSemanticOperatorJourney,
  assertRejectedAutomaticBackfillControls,
  runNewProjectSemanticOperatorJourney,
} = require('../../harness/productionSemanticOperatorJourneyHarness.js');

async function main() {
  // GIVEN two fresh projects with equivalent approved external configuration that differ
  // only by automatic-backfill opt-in, plus missing consent/configuration controls
  const operatorJourney = await runNewProjectSemanticOperatorJourney();

  // WHEN each project follows argo init -> canonical structural projection -> semantic
  // backfill -> explicit readiness verification -> semantic query through operator commands,
  // while direct/CLI backfill without consent and query without explicit readiness are rejected
  assertNewProjectSemanticOperatorJourney(operatorJourney);

  // THEN rejected opt-ins have zero automatic/backfill/provider/database effects, errors
  // remain actionable and redacted, readiness diagnostics remain exact, implicit query effects
  // are absent, and every path preserves the canonical full snapshot
  assertRejectedAutomaticBackfillControls(operatorJourney);
}

main().catch(error => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});

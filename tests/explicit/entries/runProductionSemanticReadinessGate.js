const {
  assertFullSnapshotCompatibility,
  assertReadinessMatrix,
  runFullSnapshotCompatibilityControls,
  runReadinessMatrix,
} = require('../../harness/productionDefaultRetrievalHarness.js');

async function main() {
  // GIVEN persistent structural-only SemanticIndexPending, partial, stale, failed,
  // unknown, version/channel-mismatched, and complete three-channel aligned states
  const readinessOutcomes = await runReadinessMatrix();

  // WHEN pure semantic requests cross the shipped default uninjected MCP boundary
  // THEN every non-aligned state fails before provider/vector work with actionable
  // version/channel evidence and fullSnapshotFallback:false; only Aligned retrieves
  assertReadinessMatrix(readinessOutcomes);

  // THEN no-argument and graph-tidy requests remain exact full-snapshot bypasses
  const compatibilityControls = await runFullSnapshotCompatibilityControls();
  assertFullSnapshotCompatibility(compatibilityControls);
}

main().catch(error => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});

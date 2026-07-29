const {
  assertAnchoredGraphTidyCompatibility,
  assertExportedUnifiedActionableFailureEvidence,
  assertFullSnapshotCompatibility,
  runAnchoredGraphTidyCompatibilityControl,
  assertBusinessQueryAutoAlignment,
  assertBusinessQueryFailsClosed,
  runBusinessQueryAlignmentFailureFixtures,
  runBusinessQueryAutoAlignmentFixtures,
  runFullSnapshotCompatibilityControls,
  runExportedUnifiedReadinessThroughWpP2,
} = require('../../harness/productionDefaultRetrievalHarness.js');
const {
  assertFreshReadinessPerQuery,
  observeFreshReadinessPerQuery,
} = require('../../harness/automaticSemanticLifecycleHarness.js');

async function main() {
  // GIVEN persistent structural-only SemanticIndexPending, partial, stale, failed,
  // unknown, version/channel-mismatched, and complete three-channel aligned states
  const recoverableAutoAlignment = await runBusinessQueryAutoAlignmentFixtures();
  const unrecoverableAlignmentFailure = await runBusinessQueryAlignmentFailureFixtures();

  // WHEN ordinary semantic requests cross the shipped default uninjected MCP
  // boundary with unaligned readiness
  // THEN script-owned alignment runs, the original query is retried once, and
  // unrecoverable alignment failures stay diagnostic with fullSnapshotFallback:false
  assertSplitBusinessQueryRecovery(
    recoverableAutoAlignment,
    unrecoverableAlignmentFailure,
  );

  // THEN no-argument and graph-tidy requests remain exact full-snapshot bypasses
  const compatibilityControls = await runFullSnapshotCompatibilityControls();
  assertFullSnapshotCompatibility(compatibilityControls);
  const anchoredGraphTidy = await runAnchoredGraphTidyCompatibilityControl();
  assertAnchoredGraphTidyCompatibility(anchoredGraphTidy);

  // WHEN ordinary queries run without a retired explicit readiness command
  // THEN each call freshly verifies persistent readiness before retrieval
  const freshReadiness = await observeFreshReadinessPerQuery();
  assertFreshReadinessPerQuery(freshReadiness, 'SP04');

  // THEN stored redacted category/message/action survive both exported routers,
  // while unknown diagnostic fields and secret canaries remain private
  const exportedUnifiedReadiness = await runExportedUnifiedReadinessThroughWpP2();
  assertExportedUnifiedActionableFailureEvidence(exportedUnifiedReadiness);
}

main().catch(error => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});

function assertSplitBusinessQueryRecovery(recoverableAutoAlignment, unrecoverableAlignmentFailure) {
  const failures = [];
  for (const [label, assertion] of [
    ['recoverable', () => assertBusinessQueryAutoAlignment(recoverableAutoAlignment)],
    ['unrecoverable', () => assertBusinessQueryFailsClosed(unrecoverableAlignmentFailure)],
  ]) {
    try {
      assertion();
    } catch (error) {
      failures.push(`${label}: ${error && error.message ? error.message : error}`);
    }
  }
  if (failures.length > 0) {
    throw new Error(`BP_AUTOALIGN_QUERY_RECOVERY_SPLIT_FAILED\n${failures.join('\n')}`);
  }
}

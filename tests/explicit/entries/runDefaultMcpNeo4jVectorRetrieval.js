const {
  assertCredentialSourceMatrix,
  assertDefaultVectorRetrieval,
  assertExportedUnifiedActionableFailureEvidence,
  assertExportedUnifiedReadinessThroughWpP2,
  assertFullSnapshotCompatibility,
  assertLegacyControlWordProductionGate,
  assertProductionQueryCredentialResolution,
  assertProductionQueryMixedLegacyRejections,
  assertZeroResultChannels,
  runDefaultMcpNeo4jVectorRetrieval,
  runExportedUnifiedReadinessThroughWpP2,
  runCredentialSourceMatrix,
  runFullSnapshotCompatibilityControls,
  runLegacyControlWordProductionGate,
  runProductionQueryCredentialResolution,
  runProductionQueryMixedLegacyRejections,
  runZeroResultDefaultMcpRetrieval,
} = require('../../harness/productionDefaultRetrievalHarness.js');
const {
  assertFreshReadinessPerQuery,
  observeFreshReadinessPerQuery,
} = require('../../harness/automaticSemanticLifecycleHarness.js');

async function main() {
  // GIVEN approved and prohibited raw external credential sources, an aligned persistent
  // three-channel projection, paginated above/below-threshold peers, and a zero-result case
  const credentialSources = await runCredentialSourceMatrix();
  const alignedRetrieval = await runDefaultMcpNeo4jVectorRetrieval();
  const zeroResultRetrieval = await runZeroResultDefaultMcpRetrieval();
  const legacyControlWordGate = await runLegacyControlWordProductionGate();
  const productionQueryCredentials = await runProductionQueryCredentialResolution();
  const productionQueryMixedLegacySources = await runProductionQueryMixedLegacyRejections();
  const exportedUnifiedReadiness = await runExportedUnifiedReadinessThroughWpP2();

  // WHEN typed semantic requests cross the shipped default MCP path without a
  // caller- or Harness-injected semantic retrieval boundary
  assertCredentialSourceMatrix(credentialSources);
  assertDefaultVectorRetrieval(alignedRetrieval);
  assertZeroResultChannels(zeroResultRetrieval);
  assertLegacyControlWordProductionGate(legacyControlWordGate);
  assertProductionQueryMixedLegacyRejections(productionQueryMixedLegacySources);
  assertProductionQueryCredentialResolution(productionQueryCredentials);
  assertExportedUnifiedReadinessThroughWpP2(exportedUnifiedReadiness);
  assertExportedUnifiedActionableFailureEvidence(exportedUnifiedReadiness);

  // THEN graph-tidy still bypasses embedding and retrieval for an exact canonical snapshot
  const compatibilityControls = await runFullSnapshotCompatibilityControls();
  assertFullSnapshotCompatibility(compatibilityControls);

  // THEN every ordinary public query performs its own durable readiness read;
  // no prior public readiness command or process-local authorization is required
  const freshReadiness = await observeFreshReadinessPerQuery();
  assertFreshReadinessPerQuery(freshReadiness, 'SP03');
}

main().catch(error => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});

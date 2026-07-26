const {
  assertCredentialSourceMatrix,
  assertDefaultVectorRetrieval,
  assertFullSnapshotCompatibility,
  assertLegacyControlWordProductionGate,
  assertProductionQueryCredentialResolution,
  assertZeroResultChannels,
  runDefaultMcpNeo4jVectorRetrieval,
  runCredentialSourceMatrix,
  runFullSnapshotCompatibilityControls,
  runLegacyControlWordProductionGate,
  runProductionQueryCredentialResolution,
  runZeroResultDefaultMcpRetrieval,
} = require('../../harness/productionDefaultRetrievalHarness.js');

async function main() {
  // GIVEN approved and prohibited raw external credential sources, an aligned persistent
  // three-channel projection, paginated above/below-threshold peers, and a zero-result case
  const credentialSources = await runCredentialSourceMatrix();
  const alignedRetrieval = await runDefaultMcpNeo4jVectorRetrieval();
  const zeroResultRetrieval = await runZeroResultDefaultMcpRetrieval();
  const legacyControlWordGate = await runLegacyControlWordProductionGate();
  const productionQueryCredentials = await runProductionQueryCredentialResolution();

  // WHEN typed semantic requests cross the shipped default MCP path without a
  // caller- or Harness-injected semantic retrieval boundary
  assertCredentialSourceMatrix(credentialSources);
  assertDefaultVectorRetrieval(alignedRetrieval);
  assertZeroResultChannels(zeroResultRetrieval);
  assertLegacyControlWordProductionGate(legacyControlWordGate);
  assertProductionQueryCredentialResolution(productionQueryCredentials);

  // THEN graph-tidy still bypasses embedding and retrieval for an exact canonical snapshot
  const compatibilityControls = await runFullSnapshotCompatibilityControls();
  assertFullSnapshotCompatibility(compatibilityControls);
}

main().catch(error => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});

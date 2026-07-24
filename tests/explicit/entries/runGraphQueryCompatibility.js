const {
  assertLegacyEnvelopeExternallyEquivalent,
  assertNoQueryModeMetadata,
  expectedLegacyEnvelope,
  readAsUnchangedConsumer,
  readCanonicalSnapshot,
} = require('../../harness/intentArchitectureQueryHarness.js');

async function main() {
  // GIVEN an unchanged downstream consumer and the authoritative canonical graph
  const canonicalSnapshot = readCanonicalSnapshot();

  // WHEN the consumer invokes the established no-argument reading boundary
  const legacyResult = await readAsUnchangedConsumer();

  // THEN the full public envelope remains externally equivalent without query metadata
  assertLegacyEnvelopeExternallyEquivalent(
    legacyResult,
    expectedLegacyEnvelope(canonicalSnapshot),
  );
  assertNoQueryModeMetadata(legacyResult);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

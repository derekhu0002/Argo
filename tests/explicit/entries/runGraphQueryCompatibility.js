const {
  assertCompleteCanonicalSnapshot,
  observeReturnedGraph,
  readAsUnchangedConsumer,
  readCanonicalSnapshot,
} = require('../../harness/intentArchitectureQueryHarness.js');

async function main() {
  // GIVEN an unchanged downstream consumer and the authoritative canonical graph
  const canonicalSnapshot = readCanonicalSnapshot();

  // WHEN the consumer invokes the established no-argument reading boundary
  const legacyResult = await readAsUnchangedConsumer();

  // THEN the consumer receives the unchanged complete graph without migration
  assertCompleteCanonicalSnapshot(
    observeReturnedGraph(legacyResult),
    canonicalSnapshot,
    'DT01_CONSUMER_COMPATIBILITY_FAILURE',
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

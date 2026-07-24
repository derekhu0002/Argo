const {
  assertCompleteCanonicalSnapshot,
  assertUniqueCanonicalIdentities,
  observeReturnedGraph,
  readAsUnchangedConsumer,
  readCanonicalSnapshot,
} = require('../../harness/intentArchitectureQueryHarness.js');

async function main() {
  // GIVEN canonical Elements, Relationships, Views, and cross-View memberships
  const canonicalSnapshot = readCanonicalSnapshot();

  // WHEN a no-argument full-snapshot request crosses the query-service boundary
  const fullReadResult = await readAsUnchangedConsumer();
  const observedSnapshot = observeReturnedGraph(fullReadResult);

  // THEN every authoritative object and membership is returned exactly once
  assertCompleteCanonicalSnapshot(
    observedSnapshot,
    canonicalSnapshot,
    'DT02_CANONICAL_SNAPSHOT_INCOMPLETE',
  );
  assertUniqueCanonicalIdentities(observedSnapshot, 'DT02_CANONICAL_IDENTITY_FAILURE');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

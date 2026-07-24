const assert = require('node:assert');
const {
  assertCompleteCanonicalSnapshot,
  observeReturnedGraph,
  readCanonicalSnapshot,
  readForPurpose,
} = require('../../harness/intentArchitectureQueryHarness.js');

async function main() {
  // GIVEN graph-tidy mutation preparation with global identity and cross-View concerns
  const canonicalSnapshot = readCanonicalSnapshot();

  // WHEN graph-tidy explicitly requests intent context
  const graphTidyResult = await readForPurpose({
    purpose: 'graph-tidy',
    intent: 'Prepare a mutation while preserving global identity and View membership',
  });

  // THEN semantic retrieval is bypassed and the complete canonical snapshot is returned
  assert.strictEqual(
    graphTidyResult.query && graphTidyResult.query.mode,
    'full-snapshot',
    'DT12_GRAPH_TIDY_MODE_FAILURE: graph-tidy must select full-snapshot mode',
  );
  assert.strictEqual(
    graphTidyResult.query && graphTidyResult.query.semanticRetrieval,
    'bypassed',
    'DT12_SEMANTIC_BYPASS_FAILURE: graph-tidy must bypass semantic retrieval',
  );
  assertCompleteCanonicalSnapshot(
    observeReturnedGraph(graphTidyResult),
    canonicalSnapshot,
    'DT12_GRAPH_TIDY_SNAPSHOT_INCOMPLETE',
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

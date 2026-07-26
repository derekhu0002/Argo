const assert = require('node:assert');
const {
  assertCompleteCanonicalSnapshot,
  assertSemanticRetrievalCalls,
  createSemanticRetrievalProbe,
  observeReturnedGraph,
  readCanonicalSnapshot,
  readForPurpose,
} = require('../../harness/intentArchitectureQueryHarness.js');

async function main() {
  // GIVEN graph-tidy mutation preparation and a test-owned semantic-boundary probe
  const canonicalSnapshot = readCanonicalSnapshot();
  const semanticProbe = createSemanticRetrievalProbe();

  // WHEN a semantic positive control proves the probe is wired,
  // followed by anchored graph-tidy requesting the complete canonical context
  await readForPurpose({
    purpose: 'implementation-design',
    intent: 'Verify the semantic retrieval probe control',
  }, semanticProbe);
  assertSemanticRetrievalCalls(
    semanticProbe,
    1,
    'DT12_SEMANTIC_PROBE_NOT_WIRED',
  );
  const graphTidyResult = await readForPurpose({
    purpose: 'graph-tidy',
    intent: 'Prepare a mutation while preserving global identity and View membership',
    anchors: ['grag-seed-retrieval'],
  }, semanticProbe);

  // THEN the independent probe count does not increase, bypass metadata is reported,
  // and the complete canonical snapshot is returned
  assertSemanticRetrievalCalls(
    semanticProbe,
    1,
    'DT12_SEMANTIC_PATH_INVOKED',
  );
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

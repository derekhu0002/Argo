const assert = require('node:assert');
const {
  observeReturnedGraph,
  readAsUnchangedConsumer,
  readForPurpose,
} = require('../../harness/intentArchitectureQueryHarness.js');

async function main() {
  // GIVEN legacy and semantic-query tasks against one canonical version
  const legacyResult = await readAsUnchangedConsumer();

  // WHEN an explicit implementation-design query reads the same intent source
  const semanticResult = await readForPurpose({
    purpose: 'implementation-design',
    intent: 'Read coherent intent context',
  });

  // THEN legacy remains complete and semantic evidence identifies its purpose and version
  assert(observeReturnedGraph(legacyResult), 'DT00_LEGACY_GRAPH_MISSING: legacy reading must return canonical data');
  assert.strictEqual(
    semanticResult.query && semanticResult.query.purpose,
    'implementation-design',
    'DT00_QUERY_PURPOSE_MISSING: semantic evidence must preserve explicit purpose',
  );
  assert(
    semanticResult.query && semanticResult.query.canonicalVersion,
    'DT00_CANONICAL_VERSION_MISSING: semantic evidence must identify the governing canonical version',
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

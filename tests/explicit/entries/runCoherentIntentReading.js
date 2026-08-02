const assert = require('node:assert');
const {
  assertCoherentW6VersionEvidence,
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
    anchors: ['grag-purpose-closure'],
  });

  // THEN legacy remains complete and semantic evidence identifies its purpose and version
  assert(observeReturnedGraph(legacyResult), 'DT00_LEGACY_GRAPH_MISSING: legacy reading must return canonical data');
  assertCoherentW6VersionEvidence(legacyResult, semanticResult);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

const assert = require('node:assert');
const {
  runEmbeddingProviderLifecycle,
} = require('../../harness/productionGraphRagHarness.js');

async function main() {
  // GIVEN affected Element, ArchitectureRelationship, and View records after canonical mutation
  // WHEN the independent Node.js provider adapter generates and persists embeddings
  const { outcome, persistedRecords } = await runEmbeddingProviderLifecycle();

  // THEN all channels carry complete model/version evidence with no plugin credentials and partial work is never Aligned
  assert.strictEqual(outcome.runtime, 'nodejs', 'TS09_NODE_ADAPTER_REQUIRED');
  assert.strictEqual(outcome.neo4jGenAiPluginRequired, false, 'TS09_GENAI_PLUGIN_DEPENDENCY_PROHIBITED');
  assert.deepStrictEqual(
    persistedRecords.map(record => record.objectType).sort(),
    ['ArchitectureRelationship', 'Element', 'View'],
    'TS09_AFFECTED_CHANNELS_INCOMPLETE',
  );
  for (const record of persistedRecords) {
    assert(record.model && record.version && record.dimensions, 'TS09_MODEL_EVIDENCE_INCOMPLETE');
    assert.strictEqual(record.providerCredential, undefined, 'TS09_CYPHER_CREDENTIAL_EXPOSURE');
  }
  assert.notStrictEqual(outcome.alignment, 'Aligned', 'TS09_PARTIAL_PERSISTENCE_MUST_NOT_ALIGN');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

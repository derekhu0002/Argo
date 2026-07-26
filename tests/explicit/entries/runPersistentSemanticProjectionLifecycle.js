const assert = require('node:assert');
const {
  CHANNELS,
  assertCompleteMetadata,
  runPersistentSemanticProjectionLifecycle,
} = require('../../harness/productionSemanticPersistenceHarness.js');

async function main() {
  // GIVEN a separate durable production semantic projection containing all three canonical channels
  // WHEN the process restarts, one stable identity changes, one identity is tombstoned, and unrelated live-E2E cleanup runs
  const observation = await runPersistentSemanticProjectionLifecycle();

  // THEN unchanged complete records survive restart under stable canonical identities
  assert.strictEqual(observation.afterRestart.length, CHANNELS.length, 'SP02_DURABLE_RESTART_RECORDS_MISSING');
  for (const record of observation.afterRestart) {
    assertCompleteMetadata(record, 'SP02_PERSISTED_METADATA_MISSING');
  }
  assert.deepStrictEqual(
    new Set(observation.afterRestart.map(record => record.canonicalIdentity)),
    new Set(observation.initialRecords.map(record => record.canonicalIdentity)),
    'SP02_STABLE_CANONICAL_IDENTITY_CHANGED_ON_RESTART',
  );

  // THEN the changed record is upserted in place and the tombstone is deleted
  const changedMatches = observation.afterLifecycle.filter(
    record => record.canonicalIdentity === observation.changedRecord.canonicalIdentity,
  );
  assert.strictEqual(changedMatches.length, 1, 'SP02_CHANGED_RECORD_NOT_STABLE_IDENTITY_UPSERT');
  assert.strictEqual(changedMatches[0].contentVersion, 'content-v2', 'SP02_CHANGED_CONTENT_VERSION_NOT_UPSERTED');
  assert.strictEqual(changedMatches[0].indexVersion, 'index-v2', 'SP02_CHANGED_INDEX_VERSION_NOT_UPSERTED');
  assert(
    !observation.afterLifecycle.some(record => record.canonicalIdentity === observation.tombstonedIdentity),
    'SP02_TOMBSTONE_NOT_DELETED',
  );

  // THEN test-only runId cleanup cannot delete production projection state and production exposes no cleanup operation
  assert.deepStrictEqual(observation.testCleanupOperations, ['unrelated-live-e2e-run'], 'SP02_TEST_ONLY_CLEANUP_NOT_OBSERVED');
  assert.deepStrictEqual(observation.remainingTestEvidence, [], 'SP02_TEST_ONLY_CLEANUP_INCOMPLETE');
  assert(
    observation.afterLifecycle.some(record => record.canonicalIdentity === observation.changedRecord.canonicalIdentity),
    'SP02_LIVE_E2E_CLEANUP_DELETED_PRODUCTION_RECORD',
  );
  assert(
    observation.productionOperations.every(operation => operation.operation !== 'cleanup'),
    'SP02_PRODUCTION_RUNID_CLEANUP_PROHIBITED',
  );

  // THEN canonical JSON remains authority and Neo4j remains a subordinate projection/index
  assert.strictEqual(observation.canonicalWriteAttempts, 0, 'SP02_PROJECTION_MUTATED_CANONICAL_JSON');
  assert.strictEqual(observation.authority, 'canonical-json', 'SP02_CANONICAL_AUTHORITY_LOST');
  assert.strictEqual(observation.projectionRole, 'subordinate-projection-index', 'SP02_NEO4J_BECAME_CANONICAL_AUTHORITY');
}

main().catch(error => {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
});

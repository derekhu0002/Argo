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

  // THEN configuration and qualification fail closed before durable store or index side effects
  assert.strictEqual(
    observation.missingConfiguration.category,
    'EXTERNAL_CREDENTIALS_REQUIRED',
    'SP02_MISSING_EXTERNAL_CREDENTIALS_NOT_BLOCKED',
  );
  assert.strictEqual(
    observation.missingConfigurationSideEffects,
    0,
    'SP02_MISSING_CREDENTIALS_REACHED_PERSISTENCE',
  );
  assert.strictEqual(
    observation.missingQualification.category,
    'EMBEDDING_QUALIFICATION_REQUIRED',
    'SP02_MISSING_PROVIDER_QUALIFICATION_NOT_BLOCKED',
  );
  assert.strictEqual(
    observation.missingQualificationSideEffects,
    0,
    'SP02_MISSING_QUALIFICATION_REACHED_PERSISTENCE',
  );

  // THEN unchanged complete records survive restart under stable canonical identities
  assert.strictEqual(observation.afterRestart.length, CHANNELS.length, 'SP02_DURABLE_RESTART_RECORDS_MISSING');
  for (const record of observation.afterRestart) {
    assertCompleteMetadata(record, 'SP02_PERSISTED_METADATA_MISSING');
    assert(!Object.prototype.hasOwnProperty.call(record, 'runId'), 'SP02_PRODUCTION_RECORD_RUNID_PROHIBITED');
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

  // THEN the exact production API has no cleanup surface and rejects runId-bearing records before persistence
  assert.deepStrictEqual(
    observation.publicMethods,
    ['close', 'deleteTombstones', 'readRecords', 'upsertRecords'],
    'SP02_STORE_PUBLIC_SURFACE_NOT_EXACT',
  );
  assert.strictEqual(
    observation.runIdRecordBlocked.category,
    'SP02_PRODUCTION_RUNID_PROHIBITED',
    'SP02_PRODUCTION_RUNID_RECORD_NOT_BLOCKED',
  );
  assert.strictEqual(observation.runIdAttemptSideEffects, 0, 'SP02_RUNID_RECORD_REACHED_PERSISTENCE');
  assert(
    observation.durableAdapterOperations.some(operation => operation.kind === 'semantic-record-upsert'),
    'SP02_DURABLE_NEO4J_ADAPTER_NOT_EXERCISED',
  );

  // THEN test-only runId cleanup cannot delete production projection state
  assert.deepStrictEqual(observation.testCleanupOperations, ['unrelated-live-e2e-run'], 'SP02_TEST_ONLY_CLEANUP_NOT_OBSERVED');
  assert.deepStrictEqual(observation.remainingTestEvidence, [], 'SP02_TEST_ONLY_CLEANUP_INCOMPLETE');
  assert.strictEqual(
    observation.afterTestCleanup.length,
    observation.productionCountBeforeTestCleanup,
    'SP02_LIVE_E2E_CLEANUP_DELETED_PRODUCTION_RECORD',
  );
  for (const record of observation.afterTestCleanup) {
    assert(!Object.prototype.hasOwnProperty.call(record, 'runId'), 'SP02_PRODUCTION_RECORD_RUNID_PROHIBITED');
  }

  // THEN canonical JSON remains authority and Neo4j remains a subordinate projection/index
  assert.strictEqual(observation.canonicalWriteAttempts, 0, 'SP02_PROJECTION_MUTATED_CANONICAL_JSON');
  assert.strictEqual(observation.authority, 'canonical-json', 'SP02_CANONICAL_AUTHORITY_LOST');
  assert.strictEqual(observation.projectionRole, 'subordinate-projection-index', 'SP02_NEO4J_BECAME_CANONICAL_AUTHORITY');
}

main().catch(error => {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
});

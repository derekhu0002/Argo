const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const backfillPath = path.join(
  repoRoot,
  '.argo',
  'scripts',
  'graph-rag',
  'semantic-persistence',
  'productionSemanticBackfill.js',
);
const projectionStorePath = path.join(
  repoRoot,
  '.argo',
  'scripts',
  'graph-rag',
  'semantic-persistence',
  'productionSemanticProjectionStore.js',
);

const CHANNELS = Object.freeze(['Element', 'ArchitectureRelationship', 'View']);
const REQUIRED_METADATA = Object.freeze([
  'canonicalIdentity',
  'channel',
  'canonicalVersion',
  'contentVersion',
  'indexVersion',
  'provider',
  'model',
  'modelVersion',
  'dimensions',
  'vector',
]);

function canonicalThreeChannelFixture() {
  return Object.freeze({
    version: 'canonical-wp-p1-v1',
    elements: Object.freeze([
      Object.freeze({ id: 'element-alpha', name: 'Alpha', type: 'Application Component' }),
      Object.freeze({ id: 'element-beta', name: 'Beta', type: 'Requirement' }),
    ]),
    relationships: Object.freeze([
      Object.freeze({
        id: 'relationship-alpha-beta',
        type: 'Realization',
        source_id: 'element-alpha',
        target_id: 'element-beta',
      }),
      Object.freeze({
        id: 'relationship-beta-alpha',
        type: 'Association',
        source_id: 'element-beta',
        target_id: 'element-alpha',
      }),
    ]),
    views: Object.freeze([
      Object.freeze({
        view_id: 'view-alpha',
        view_name: 'Alpha View',
        included_elements: Object.freeze(['element-alpha']),
        included_relationships: Object.freeze([]),
      }),
      Object.freeze({
        view_id: 'view-beta',
        view_name: 'Beta View',
        included_elements: Object.freeze(['element-alpha', 'element-beta']),
        included_relationships: Object.freeze(['relationship-alpha-beta']),
      }),
    ]),
  });
}

function externalProductionCredentials() {
  return Object.freeze({
    neo4jDatabaseUrl: 'neo4j://externally-configured.invalid:7687',
    neo4jDatabaseUsername: 'externally-configured-user',
    neo4jDatabasePassword: 'externally-configured-password',
    embeddingCredential: 'externally-configured-provider-key',
  });
}

function qualifiedProviderProfile() {
  return Object.freeze({
    approvedByHuman: true,
    provider: 'approved-provider',
    model: 'approved-model',
    version: 'approved-model-v1',
    dimensions: 3,
  });
}

async function runProductionSemanticBackfill() {
  const createProductionSemanticBackfill = loadFactory(
    backfillPath,
    'createProductionSemanticBackfill',
    'SP01_PRODUCTION_BACKFILL_BOUNDARY_MISSING',
  );
  const fixture = canonicalThreeChannelFixture();
  const originalCanonicalJson = JSON.stringify(fixture);
  const observations = createBackfillObservations();
  const backfill = createProductionSemanticBackfill({
    canonicalSource: observations.canonicalSource(fixture),
    structuralProjection: observations.structuralProjection(),
    embeddingProvider: observations.embeddingProvider(),
    projectionStore: observations.projectionStore(),
    checkpointStore: observations.checkpointStore(),
    configuration: externalProductionCredentials(),
    qualification: qualifiedProviderProfile(),
    batchSize: 2,
  });
  assert.strictEqual(typeof backfill.execute, 'function', 'SP01_BACKFILL_EXECUTE_API_MISSING');

  let interruption;
  try {
    await backfill.execute({ explicitOptIn: true });
  } catch (error) {
    interruption = error;
  }
  observations.releaseInterruption();
  const resumed = await backfill.execute({ explicitOptIn: true });
  const recordsAfterResume = observations.productionRecords();
  const writesAfterResume = observations.writeCount();
  const rerun = await backfill.execute({ explicitOptIn: true });

  return Object.freeze({
    interruption,
    resumed,
    rerun,
    fixture,
    originalCanonicalJson,
    canonicalJsonAfterRuns: JSON.stringify(fixture),
    events: observations.events(),
    checkpoints: observations.checkpoints(),
    isolatedFailures: observations.isolatedFailures(),
    recordsAfterResume,
    recordsAfterRerun: observations.productionRecords(),
    writesAfterResume,
    writesAfterRerun: observations.writeCount(),
    maximumObservedBatchSize: observations.maximumObservedBatchSize(),
  });
}

async function runPersistentSemanticProjectionLifecycle() {
  const createProductionSemanticProjectionStore = loadFactory(
    projectionStorePath,
    'createProductionSemanticProjectionStore',
    'SP02_PRODUCTION_PERSISTENCE_BOUNDARY_MISSING',
  );
  const durableAdapter = createDurableProjectionAdapter();
  const canonicalAuthority = createCanonicalAuthorityProbe();
  const initialRecords = completeSemanticRecords();
  const createStore = () => createProductionSemanticProjectionStore({
    persistenceAdapter: durableAdapter,
    canonicalAuthority,
    configuration: externalProductionCredentials(),
  });

  const firstProcess = createStore();
  assertStoreContract(firstProcess);
  await firstProcess.upsertRecords(initialRecords);
  await firstProcess.close();

  const restartedProcess = createStore();
  assertStoreContract(restartedProcess);
  const afterRestart = await restartedProcess.readRecords();
  const changedRecord = Object.freeze({
    ...initialRecords[0],
    contentVersion: 'content-v2',
    indexVersion: 'index-v2',
    vector: Object.freeze([0.4, 0.5, 0.6]),
  });
  await restartedProcess.upsertRecords([changedRecord]);
  await restartedProcess.deleteTombstones([
    Object.freeze({
      canonicalIdentity: initialRecords[1].canonicalIdentity,
      channel: initialRecords[1].channel,
      canonicalVersion: 'canonical-wp-p1-v2',
    }),
  ]);
  durableAdapter.addTestOnlyEvidence('unrelated-live-e2e-run');
  durableAdapter.cleanupTestOnlyEvidence('unrelated-live-e2e-run');
  const afterLifecycle = await restartedProcess.readRecords();
  await restartedProcess.close();

  return Object.freeze({
    initialRecords,
    afterRestart,
    afterLifecycle,
    changedRecord,
    tombstonedIdentity: initialRecords[1].canonicalIdentity,
    productionOperations: durableAdapter.productionOperations(),
    testCleanupOperations: durableAdapter.testCleanupOperations(),
    remainingTestEvidence: durableAdapter.remainingTestEvidence(),
    canonicalWriteAttempts: canonicalAuthority.writeAttempts(),
    authority: 'canonical-json',
    projectionRole: 'subordinate-projection-index',
  });
}

function createBackfillObservations() {
  const eventLog = [];
  const checkpointLog = [];
  const failures = [];
  const records = new Map();
  let writes = 0;
  let maximumBatch = 0;
  let interrupt = true;
  return Object.freeze({
    canonicalSource(fixture) {
      return Object.freeze({
        async readSnapshot() {
          eventLog.push('canonical-snapshot-read');
          return fixture;
        },
      });
    },
    structuralProjection() {
      return Object.freeze({
        async requireComplete() {
          eventLog.push('structural-projection-complete');
          return Object.freeze({ status: 'complete', canonicalVersion: 'canonical-wp-p1-v1' });
        },
      });
    },
    embeddingProvider() {
      let isolatedFailurePending = true;
      return Object.freeze({
        async embedBatch(batch) {
          eventLog.push(`provider-batch:${batch.length}`);
          maximumBatch = Math.max(maximumBatch, batch.length);
          const vectors = [];
          for (const record of batch) {
            if (record.canonicalIdentity === 'View:view-beta' && isolatedFailurePending) {
              isolatedFailurePending = false;
              failures.push(Object.freeze({
                canonicalIdentity: record.canonicalIdentity,
                category: 'PROVIDER_RECORD_RETRYABLE',
              }));
              continue;
            }
            vectors.push(Object.freeze({
              canonicalIdentity: record.canonicalIdentity,
              vector: Object.freeze([0.1, 0.2, 0.3]),
            }));
          }
          return Object.freeze({ vectors: Object.freeze(vectors), failures: Object.freeze([...failures]) });
        },
      });
    },
    projectionStore() {
      return Object.freeze({
        async upsertBatch(batch) {
          eventLog.push(`projection-upsert:${batch.length}`);
          maximumBatch = Math.max(maximumBatch, batch.length);
          for (const record of batch) {
            const prior = records.get(record.canonicalIdentity);
            records.set(record.canonicalIdentity, record);
            if (JSON.stringify(prior) !== JSON.stringify(record)) writes += 1;
          }
        },
        async markAlignment(state) {
          eventLog.push(`alignment:${state}`);
        },
      });
    },
    checkpointStore() {
      return Object.freeze({
        async read(channel) {
          return [...checkpointLog].reverse().find(item => item.channel === channel);
        },
        async write(checkpoint) {
          checkpointLog.push(Object.freeze({ ...checkpoint }));
          eventLog.push(`checkpoint:${checkpoint.channel}:${checkpoint.completed}`);
          if (interrupt && checkpointLog.length === 1) {
            const error = new Error('SP01_SYNTHETIC_INTERRUPTION');
            error.category = 'SP01_SYNTHETIC_INTERRUPTION';
            throw error;
          }
        },
      });
    },
    releaseInterruption() {
      interrupt = false;
    },
    events: () => Object.freeze([...eventLog]),
    checkpoints: () => Object.freeze([...checkpointLog]),
    isolatedFailures: () => Object.freeze([...failures]),
    productionRecords: () => Object.freeze([...records.values()].map(record => Object.freeze({ ...record }))),
    writeCount: () => writes,
    maximumObservedBatchSize: () => maximumBatch,
  });
}

function completeSemanticRecords() {
  return Object.freeze(CHANNELS.map((channel, index) => Object.freeze({
    canonicalIdentity: `${channel}:stable-${index + 1}`,
    channel,
    canonicalVersion: 'canonical-wp-p1-v1',
    contentVersion: 'content-v1',
    indexVersion: 'index-v1',
    provider: 'approved-provider',
    model: 'approved-model',
    modelVersion: 'approved-model-v1',
    dimensions: 3,
    vector: Object.freeze([0.1, 0.2, 0.3]),
  })));
}

function createDurableProjectionAdapter() {
  const records = new Map();
  const productionOps = [];
  const testEvidence = new Set();
  const testCleanup = [];
  return Object.freeze({
    async upsert(recordsToUpsert) {
      productionOps.push(Object.freeze({ operation: 'upsert', count: recordsToUpsert.length }));
      for (const record of recordsToUpsert) records.set(record.canonicalIdentity, Object.freeze({ ...record }));
    },
    async deleteByCanonicalIdentity(tombstones) {
      productionOps.push(Object.freeze({ operation: 'delete-tombstones', count: tombstones.length }));
      for (const tombstone of tombstones) records.delete(tombstone.canonicalIdentity);
    },
    async readAll() {
      productionOps.push(Object.freeze({ operation: 'read-all' }));
      return Object.freeze([...records.values()]);
    },
    async close() {},
    addTestOnlyEvidence(runId) {
      testEvidence.add(runId);
    },
    cleanupTestOnlyEvidence(runId) {
      testCleanup.push(runId);
      testEvidence.delete(runId);
    },
    productionOperations: () => Object.freeze([...productionOps]),
    testCleanupOperations: () => Object.freeze([...testCleanup]),
    remainingTestEvidence: () => Object.freeze([...testEvidence]),
  });
}

function createCanonicalAuthorityProbe() {
  let writes = 0;
  return Object.freeze({
    assertProjectionOnly() {
      return Object.freeze({ authority: 'canonical-json', projectionRole: 'subordinate-projection-index' });
    },
    writeCanonical() {
      writes += 1;
      throw new Error('SP02_CANONICAL_MUTATION_PROHIBITED');
    },
    writeAttempts: () => writes,
  });
}

function assertStoreContract(store) {
  for (const method of ['upsertRecords', 'deleteTombstones', 'readRecords', 'close']) {
    assert.strictEqual(typeof store && typeof store[method], 'function', `SP02_STORE_API_MISSING:${method}`);
  }
}

function assertCompleteMetadata(record, prefix) {
  for (const field of REQUIRED_METADATA) {
    assert(
      record && record[field] !== undefined && record[field] !== '',
      `${prefix}:${field}`,
    );
  }
}

function loadFactory(modulePath, exportName, missingCategory) {
  assert(fs.existsSync(modulePath), `${missingCategory}: ${path.relative(repoRoot, modulePath)}`);
  delete require.cache[require.resolve(modulePath)];
  const moduleBoundary = require(modulePath);
  assert.strictEqual(typeof moduleBoundary[exportName], 'function', `${missingCategory}: export ${exportName}`);
  return moduleBoundary[exportName];
}

module.exports = {
  CHANNELS,
  REQUIRED_METADATA,
  assertCompleteMetadata,
  canonicalThreeChannelFixture,
  runPersistentSemanticProjectionLifecycle,
  runProductionSemanticBackfill,
};

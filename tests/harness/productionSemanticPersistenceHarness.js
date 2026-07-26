const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const semanticDirectory = path.join(repoRoot, '.argo', 'scripts', 'graph-rag', 'semantic-persistence');
const paths = Object.freeze({
  backfill: path.join(semanticDirectory, 'productionSemanticBackfill.js'),
  store: path.join(semanticDirectory, 'productionSemanticProjectionStore.js'),
  adapter: path.join(semanticDirectory, 'productionSemanticNeo4jAdapter.js'),
  checkpoints: path.join(semanticDirectory, 'productionSemanticCheckpointStore.js'),
  runtime: path.join(repoRoot, '.argo', 'scripts', 'graph-rag', 'productionGraphRagRuntime.js'),
  mcp: path.join(repoRoot, '.argo', 'scripts', 'systemarchitecture-mcp-server.js'),
});

const CHANNELS = Object.freeze(['Element', 'ArchitectureRelationship', 'View']);
const STORE_METHODS = Object.freeze(['close', 'deleteTombstones', 'readRecords', 'upsertRecords']);
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

function canonicalThreeChannelFixture(version = 'canonical-wp-p1-v1') {
  return Object.freeze({
    version,
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
  // Keep the established pre-Coding RED category while requiring every later production boundary.
  loadFactory(paths.backfill, 'createProductionSemanticBackfill', 'SP01_PRODUCTION_BACKFILL_BOUNDARY_MISSING');
  loadFactory(paths.store, 'createProductionSemanticProjectionStore', 'SP01_PRODUCTION_STORE_BOUNDARY_MISSING');
  loadFactory(paths.adapter, 'createProductionSemanticNeo4jAdapter', 'SP01_PRODUCTION_NEO4J_ADAPTER_MISSING');
  loadFactory(paths.checkpoints, 'createProductionSemanticCheckpointStore', 'SP01_DURABLE_CHECKPOINT_STORE_MISSING');
  const createProductionGraphRagRuntime = loadFactory(
    paths.runtime,
    'createProductionGraphRagRuntime',
    'SP01_PRODUCTION_RUNTIME_BOUNDARY_MISSING',
  );
  const mcp = loadModule(paths.mcp);
  const operatorName = 'backfillSystemArchitectureSemanticProjection';
  assert(
    Array.isArray(mcp.TOOLS) && mcp.TOOLS.some(tool => tool.name === operatorName),
    'SP01_MCP_OPERATOR_NOT_EXPOSED',
  );
  assert.strictEqual(typeof mcp.callTool, 'function', 'SP01_MCP_OPERATOR_CALL_BOUNDARY_MISSING');

  const fixture = canonicalThreeChannelFixture();
  const originalCanonicalJson = JSON.stringify(fixture);
  const observations = createProductionCompositionObservations();
  const runtime = createSemanticRuntime(createProductionGraphRagRuntime, observations, {
    fixture,
    configuration: externalProductionCredentials(),
    qualification: qualifiedProviderProfile(),
  });

  const missingOptIn = await captureBlocked(() => invokeOperator(mcp, runtime, {}));
  assertZeroSemanticSideEffects(observations.snapshot(), 'SP01_OPT_IN');

  const mismatchedObservations = createProductionCompositionObservations();
  const mismatchRuntime = createSemanticRuntime(createProductionGraphRagRuntime, mismatchedObservations, {
    fixture,
    structuralVersion: 'canonical-wrong-version',
    configuration: externalProductionCredentials(),
    qualification: qualifiedProviderProfile(),
  });
  const structuralVersionMismatch = await captureBlocked(
    () => invokeOperator(mcp, mismatchRuntime, { explicitOptIn: true }),
  );
  assertZeroSemanticSideEffects(mismatchedObservations.snapshot(), 'SP01_VERSION_MISMATCH');

  const missingCredentialsObservations = createProductionCompositionObservations();
  const missingCredentialsRuntime = createSemanticRuntime(
    createProductionGraphRagRuntime,
    missingCredentialsObservations,
    { fixture, configuration: {}, qualification: qualifiedProviderProfile() },
  );
  const missingCredentials = await captureBlocked(
    () => invokeOperator(mcp, missingCredentialsRuntime, { explicitOptIn: true }),
  );
  assertZeroSemanticSideEffects(missingCredentialsObservations.snapshot(), 'SP01_MISSING_CREDENTIALS');

  const missingQualificationObservations = createProductionCompositionObservations();
  const missingQualificationRuntime = createSemanticRuntime(
    createProductionGraphRagRuntime,
    missingQualificationObservations,
    { fixture, configuration: externalProductionCredentials(), qualification: {} },
  );
  const missingQualification = await captureBlocked(
    () => invokeOperator(mcp, missingQualificationRuntime, { explicitOptIn: true }),
  );
  assertZeroSemanticSideEffects(missingQualificationObservations.snapshot(), 'SP01_MISSING_QUALIFICATION');

  observations.setPhase('initial');
  const interruption = await captureBlocked(
    () => invokeOperator(mcp, runtime, { explicitOptIn: true }),
  );
  const completedBeforeResume = new Set(observations.persistedIdentities('initial'));
  observations.releaseInterruption();
  observations.setPhase('resume');
  const resumed = await invokeOperator(mcp, runtime, { explicitOptIn: true });
  const replayedProviderIdentities = observations.providerIdentities('resume')
    .filter(identity => completedBeforeResume.has(identity));
  const replayedUpsertIdentities = observations.persistedIdentities('resume')
    .filter(identity => completedBeforeResume.has(identity));
  const recordsAfterResume = observations.productionRecords();
  const writesAfterResume = observations.writeCount();
  observations.setPhase('rerun');
  const rerun = await invokeOperator(mcp, runtime, { explicitOptIn: true });

  return Object.freeze({
    missingOptIn,
    structuralVersionMismatch,
    missingCredentials,
    missingQualification,
    interruption,
    resumed: extractToolPayload(resumed),
    rerun: extractToolPayload(rerun),
    fixture,
    originalCanonicalJson,
    canonicalJsonAfterRuns: JSON.stringify(fixture),
    canonicalMutationAttempts: observations.canonicalMutationAttempts(),
    events: observations.events(),
    checkpoints: observations.checkpoints(),
    isolatedFailures: observations.isolatedFailures(),
    recordsAfterResume,
    recordsAfterRerun: observations.productionRecords(),
    writesAfterResume,
    writesAfterRerun: observations.writeCount(),
    maximumObservedBatchSize: observations.maximumObservedBatchSize(),
    completedBeforeResume: Object.freeze([...completedBeforeResume]),
    replayedProviderIdentities: Object.freeze(replayedProviderIdentities),
    replayedUpsertIdentities: Object.freeze(replayedUpsertIdentities),
    durableAdapterOperations: observations.durableAdapterOperations(),
    durableCheckpointOperations: observations.durableCheckpointOperations(),
    operatorName,
  });
}

async function runPersistentSemanticProjectionLifecycle() {
  const createProductionSemanticProjectionStore = loadFactory(
    paths.store,
    'createProductionSemanticProjectionStore',
    'SP02_PRODUCTION_PERSISTENCE_BOUNDARY_MISSING',
  );
  const createProductionSemanticNeo4jAdapter = loadFactory(
    paths.adapter,
    'createProductionSemanticNeo4jAdapter',
    'SP02_PRODUCTION_NEO4J_ADAPTER_MISSING',
  );
  const durableNeo4j = createRecordingDurableNeo4jDriver();
  const canonicalAuthority = createCanonicalAuthorityProbe();
  const initialRecords = completeSemanticRecords();
  const configuration = externalProductionCredentials();
  const qualification = qualifiedProviderProfile();
  const createStore = overrides => {
    const persistenceAdapter = createProductionSemanticNeo4jAdapter({
      driver: durableNeo4j.driver(),
      configuration: overrides && overrides.configuration !== undefined
        ? overrides.configuration
        : configuration,
    });
    return createProductionSemanticProjectionStore({
      persistenceAdapter,
      canonicalAuthority,
      configuration: overrides && overrides.configuration !== undefined
        ? overrides.configuration
        : configuration,
      qualification: overrides && overrides.qualification !== undefined
        ? overrides.qualification
        : qualification,
    });
  };

  const beforeMissingConfiguration = durableNeo4j.sideEffectCount();
  const missingConfiguration = await captureBlocked(async () => {
    const store = createStore({ configuration: {} });
    await store.upsertRecords(initialRecords);
  });
  const missingConfigurationSideEffects = durableNeo4j.sideEffectCount() - beforeMissingConfiguration;

  const beforeMissingQualification = durableNeo4j.sideEffectCount();
  const missingQualification = await captureBlocked(async () => {
    const store = createStore({ qualification: {} });
    await store.upsertRecords(initialRecords);
  });
  const missingQualificationSideEffects = durableNeo4j.sideEffectCount() - beforeMissingQualification;

  const firstProcess = createStore();
  const publicMethods = assertExactStoreContract(firstProcess);
  await firstProcess.upsertRecords(initialRecords);
  await firstProcess.close();

  const restartedProcess = createStore();
  assertExactStoreContract(restartedProcess);
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
  const afterLifecycle = await restartedProcess.readRecords();
  await restartedProcess.close();

  const beforeRunIdAttempt = durableNeo4j.sideEffectCount();
  const runIdRecordBlocked = await captureBlocked(async () => {
    const runIdStore = createStore();
    await runIdStore.upsertRecords([{ ...initialRecords[0], runId: 'production-run-id-prohibited' }]);
  });
  const runIdAttemptSideEffects = durableNeo4j.sideEffectCount() - beforeRunIdAttempt;

  const productionCountBeforeTestCleanup = afterLifecycle.length;
  durableNeo4j.addTestOnlyEvidence('unrelated-live-e2e-run');
  durableNeo4j.cleanupTestOnlyEvidence('unrelated-live-e2e-run');
  const afterTestCleanup = await createStore().readRecords();

  return Object.freeze({
    initialRecords,
    afterRestart,
    afterLifecycle,
    afterTestCleanup,
    changedRecord,
    tombstonedIdentity: initialRecords[1].canonicalIdentity,
    publicMethods,
    missingConfiguration,
    missingConfigurationSideEffects,
    missingQualification,
    missingQualificationSideEffects,
    runIdRecordBlocked,
    runIdAttemptSideEffects,
    productionCountBeforeTestCleanup,
    durableAdapterOperations: durableNeo4j.operations(),
    testCleanupOperations: durableNeo4j.testCleanupOperations(),
    remainingTestEvidence: durableNeo4j.remainingTestEvidence(),
    canonicalWriteAttempts: canonicalAuthority.writeAttempts(),
    authority: 'canonical-json',
    projectionRole: 'subordinate-projection-index',
  });
}

function createSemanticRuntime(createProductionGraphRagRuntime, observations, options) {
  return createProductionGraphRagRuntime({
    canonicalGraph: options.fixture,
    neo4jRetrievalBoundary: Object.freeze({ async retrieve() { return Object.freeze({ records: [] }); } }),
    embeddingQualification: options.qualification,
    semanticPersistence: Object.freeze({
      canonicalSource: observations.canonicalSource(options.fixture),
      structuralProjection: observations.structuralProjection(
        options.structuralVersion || options.fixture.version,
      ),
      embeddingProvider: observations.embeddingProvider(),
      neo4jDriver: observations.neo4jDriver(),
      canonicalAuthority: observations.canonicalAuthority(),
      configuration: options.configuration,
      qualification: options.qualification,
      batchSize: 2,
    }),
  });
}

async function invokeOperator(mcp, runtime, request) {
  return mcp.callTool(
    'backfillSystemArchitectureSemanticProjection',
    request,
    { productionGraphRagRuntime: runtime },
  );
}

function createProductionCompositionObservations() {
  const durable = createRecordingDurableNeo4jDriver();
  const eventLog = [];
  const failures = [];
  const providerCalls = [];
  let phase = 'setup';
  let maximumBatch = 0;
  let interruptionPending = true;
  let canonicalMutations = 0;

  return Object.freeze({
    canonicalSource(fixture) {
      return Object.freeze({
        async readSnapshot() {
          eventLog.push('canonical-snapshot-read');
          return fixture;
        },
      });
    },
    structuralProjection(version) {
      return Object.freeze({
        async requireComplete() {
          eventLog.push('structural-projection-complete');
          return Object.freeze({ status: 'complete', canonicalVersion: version });
        },
      });
    },
    embeddingProvider() {
      let isolatedFailurePending = true;
      return Object.freeze({
        async embedBatch(batch) {
          eventLog.push(`provider-batch:${batch.length}`);
          maximumBatch = Math.max(maximumBatch, batch.length);
          for (const record of batch) {
            providerCalls.push(Object.freeze({ phase, canonicalIdentity: record.canonicalIdentity }));
          }
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
    neo4jDriver: () => durable.driver(() => phase, () => {
      if (interruptionPending) {
        interruptionPending = false;
        const error = new Error('SP01_SYNTHETIC_INTERRUPTION');
        error.category = 'SP01_SYNTHETIC_INTERRUPTION';
        throw error;
      }
    }),
    canonicalAuthority() {
      return Object.freeze({
        assertProjectionOnly() {
          return Object.freeze({ authority: 'canonical-json', projectionRole: 'subordinate-projection-index' });
        },
        writeCanonical() {
          canonicalMutations += 1;
          throw categoryError('SP01_FAKE_CANONICAL_MUTATION_PROHIBITED');
        },
      });
    },
    setPhase(value) {
      phase = value;
    },
    releaseInterruption() {
      interruptionPending = false;
    },
    snapshot() {
      return Object.freeze({
        providerCalls: providerCalls.length,
        durableSideEffects: durable.sideEffectCount(),
        checkpointWrites: durable.checkpoints().length,
      });
    },
    events: () => Object.freeze([...eventLog]),
    checkpoints: () => durable.checkpoints(),
    isolatedFailures: () => Object.freeze([...failures]),
    productionRecords: () => durable.records(),
    writeCount: () => durable.semanticWriteCount(),
    maximumObservedBatchSize: () => maximumBatch,
    providerIdentities: selectedPhase => Object.freeze(
      providerCalls.filter(call => call.phase === selectedPhase).map(call => call.canonicalIdentity),
    ),
    persistedIdentities: selectedPhase => Object.freeze(
      durable.operations()
        .filter(operation => operation.phase === selectedPhase && operation.kind === 'semantic-record-upsert')
        .flatMap(operation => operation.identities),
    ),
    canonicalMutationAttempts: () => canonicalMutations,
    durableAdapterOperations: () => durable.operations()
      .filter(operation => operation.kind.startsWith('semantic-record-')),
    durableCheckpointOperations: () => durable.operations()
      .filter(operation => operation.kind.startsWith('semantic-checkpoint-')),
  });
}

function createRecordingDurableNeo4jDriver() {
  const semanticRecords = new Map();
  const checkpointRecords = new Map();
  const operations = [];
  const testEvidence = new Set();
  const testCleanup = [];
  let semanticWrites = 0;
  let sideEffects = 0;

  return Object.freeze({
    driver(phaseProvider = () => 'lifecycle', afterCheckpointWrite = () => {}) {
      return Object.freeze({
        async execute(command) {
          assert(command && typeof command.kind === 'string', 'WP_P1_DURABLE_COMMAND_KIND_REQUIRED');
          const phase = phaseProvider();
          if (command.kind === 'semantic-record-upsert') {
            const records = command.records || [];
            sideEffects += records.length;
            for (const record of records) {
              const previous = semanticRecords.get(record.canonicalIdentity);
              semanticRecords.set(record.canonicalIdentity, Object.freeze({ ...record }));
              if (JSON.stringify(previous) !== JSON.stringify(record)) semanticWrites += 1;
            }
            operations.push(Object.freeze({
              kind: command.kind,
              phase,
              identities: Object.freeze(records.map(record => record.canonicalIdentity)),
            }));
            return Object.freeze({ count: records.length });
          }
          if (command.kind === 'semantic-record-delete-tombstones') {
            const tombstones = command.tombstones || [];
            sideEffects += tombstones.length;
            for (const tombstone of tombstones) semanticRecords.delete(tombstone.canonicalIdentity);
            operations.push(Object.freeze({
              kind: command.kind,
              phase,
              identities: Object.freeze(tombstones.map(item => item.canonicalIdentity)),
            }));
            return Object.freeze({ count: tombstones.length });
          }
          if (command.kind === 'semantic-record-read-all') {
            operations.push(Object.freeze({ kind: command.kind, phase, identities: Object.freeze([]) }));
            return Object.freeze({ records: Object.freeze([...semanticRecords.values()]) });
          }
          if (command.kind === 'semantic-checkpoint-write') {
            sideEffects += 1;
            checkpointRecords.set(command.checkpoint.channel, Object.freeze({ ...command.checkpoint }));
            operations.push(Object.freeze({
              kind: command.kind,
              phase,
              identities: Object.freeze([...(command.checkpoint.completedCanonicalIdentities || [])]),
            }));
            afterCheckpointWrite(command.checkpoint);
            return Object.freeze({ checkpoint: checkpointRecords.get(command.checkpoint.channel) });
          }
          if (command.kind === 'semantic-checkpoint-read') {
            operations.push(Object.freeze({ kind: command.kind, phase, identities: Object.freeze([]) }));
            return Object.freeze({ checkpoint: checkpointRecords.get(command.channel) });
          }
          throw categoryError(`WP_P1_DURABLE_COMMAND_UNSUPPORTED:${command.kind}`);
        },
      });
    },
    records: () => Object.freeze([...semanticRecords.values()].map(record => Object.freeze({ ...record }))),
    checkpoints: () => Object.freeze([...checkpointRecords.values()].map(item => Object.freeze({ ...item }))),
    operations: () => Object.freeze([...operations]),
    semanticWriteCount: () => semanticWrites,
    sideEffectCount: () => sideEffects,
    addTestOnlyEvidence(runId) {
      testEvidence.add(runId);
    },
    cleanupTestOnlyEvidence(runId) {
      testCleanup.push(runId);
      testEvidence.delete(runId);
    },
    testCleanupOperations: () => Object.freeze([...testCleanup]),
    remainingTestEvidence: () => Object.freeze([...testEvidence]),
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

function createCanonicalAuthorityProbe() {
  let writes = 0;
  return Object.freeze({
    assertProjectionOnly() {
      return Object.freeze({ authority: 'canonical-json', projectionRole: 'subordinate-projection-index' });
    },
    writeCanonical() {
      writes += 1;
      throw categoryError('SP02_CANONICAL_MUTATION_PROHIBITED');
    },
    writeAttempts: () => writes,
  });
}

function assertExactStoreContract(store) {
  const methods = collectPublicMethods(store).sort();
  assert.deepStrictEqual(methods, [...STORE_METHODS], 'SP02_STORE_PUBLIC_SURFACE_NOT_EXACT');
  return Object.freeze(methods);
}

function collectPublicMethods(instance) {
  const methods = new Set();
  let current = instance;
  while (current && current !== Object.prototype) {
    for (const name of Object.getOwnPropertyNames(current)) {
      if (name !== 'constructor' && typeof instance[name] === 'function') methods.add(name);
    }
    current = Object.getPrototypeOf(current);
  }
  return [...methods];
}

function assertCompleteMetadata(record, prefix) {
  for (const field of REQUIRED_METADATA) {
    assert(record && record[field] !== undefined && record[field] !== '', `${prefix}:${field}`);
  }
}

function assertZeroSemanticSideEffects(snapshot, prefix) {
  assert.strictEqual(snapshot.providerCalls, 0, `${prefix}_PROVIDER_SIDE_EFFECT`);
  assert.strictEqual(snapshot.durableSideEffects, 0, `${prefix}_STORE_OR_INDEX_SIDE_EFFECT`);
  assert.strictEqual(snapshot.checkpointWrites, 0, `${prefix}_CHECKPOINT_SIDE_EFFECT`);
}

async function captureBlocked(action) {
  try {
    const result = await action();
    const payload = extractToolPayload(result);
    if (payload && (payload.status === 'blocked' || payload.status === 'failed')) {
      return Object.freeze({
        category: payload.category || (payload.error && payload.error.category),
        payload,
      });
    }
    return Object.freeze({ category: undefined, payload });
  } catch (error) {
    return Object.freeze({ category: error && (error.category || error.code), error });
  }
}

function extractToolPayload(result) {
  if (!result || !Array.isArray(result.content) || !result.content[0]) return result;
  const text = result.content[0].text;
  if (typeof text !== 'string') return result;
  try {
    return JSON.parse(text);
  } catch {
    return result;
  }
}

function categoryError(category) {
  const error = new Error(category);
  error.category = category;
  return error;
}

function loadFactory(modulePath, exportName, missingCategory) {
  assert(fs.existsSync(modulePath), `${missingCategory}: ${path.relative(repoRoot, modulePath)}`);
  const moduleBoundary = loadModule(modulePath);
  assert.strictEqual(typeof moduleBoundary[exportName], 'function', `${missingCategory}: export ${exportName}`);
  return moduleBoundary[exportName];
}

function loadModule(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

module.exports = {
  CHANNELS,
  REQUIRED_METADATA,
  STORE_METHODS,
  assertCompleteMetadata,
  canonicalThreeChannelFixture,
  runPersistentSemanticProjectionLifecycle,
  runProductionSemanticBackfill,
};

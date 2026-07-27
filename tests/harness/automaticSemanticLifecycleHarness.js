const assert = require('node:assert');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const systemMcp = require(path.join(repoRoot, '.argo', 'scripts', 'systemarchitecture-mcp-server.js'));
const unifiedMcp = require(path.join(repoRoot, '.argo', 'scripts', 'argo-mcp-server.js'));
const {
  createProductionSemanticOperatorJourney,
} = require(path.join(repoRoot, '.argo', 'scripts', 'graph-rag', 'semanticOperatorJourney.js'));

const RETIRED_PUBLIC_TOOLS = Object.freeze([
  'startNewProjectSemanticJourney',
  'backfillSystemArchitectureSemanticProjection',
  'verifySystemArchitectureSemanticReadiness',
]);
const REQUIRED_CHANNELS = Object.freeze(['Element', 'ArchitectureRelationship', 'View']);
const DUAL_GATES = Object.freeze([
  'ARGO_LIVE_PROVIDER_E2E',
  'ARGO_W31_LIVE_MUTATION_VECTOR_E2E',
]);

async function observeSolePublicSemanticSurface() {
  const systemList = await systemMcp.handleRequest({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {},
  });
  const unifiedList = await unifiedMcp.handleRequest({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {},
  });
  const retiredRoutes = [];
  const inertJourney = Object.freeze({
    async startNewProject() { return { status: 'unexpected-public-route' }; },
    async verifyReadiness() { return { status: 'unexpected-public-route' }; },
  });
  const inertDependencies = Object.freeze({
    semanticOperatorJourney: inertJourney,
    productionGraphRagRuntime: Object.freeze({
      async runSemanticBackfill() { return { status: 'unexpected-public-route' }; },
    }),
    readinessAttestationStore: Object.freeze({
      async clear() {},
    }),
  });
  for (const name of RETIRED_PUBLIC_TOOLS) {
    try {
      await unifiedMcp.callTool(name, {}, null, inertDependencies);
      retiredRoutes.push({ name, routable: true });
    } catch (error) {
      retiredRoutes.push({
        name,
        routable: false,
        category: error && (error.category || error.message),
      });
    }
  }
  return Object.freeze({
    systemToolNames: toolNames(systemList),
    unifiedToolNames: toolNames(unifiedList),
    retiredRoutes: Object.freeze(retiredRoutes),
  });
}

function assertSolePublicSemanticSurface(observation) {
  for (const names of [observation.systemToolNames, observation.unifiedToolNames]) {
    assert(names.includes('getSystemArchitecture'), 'TS00_GET_SYSTEM_ARCHITECTURE_NOT_PUBLIC');
    for (const retired of RETIRED_PUBLIC_TOOLS) {
      assert(!names.includes(retired), `TS00_RETIRED_LIFECYCLE_TOOL_PUBLIC:${retired}`);
    }
  }
  for (const route of observation.retiredRoutes) {
    assert.strictEqual(
      route.routable,
      false,
      `TS00_RETIRED_LIFECYCLE_TOOL_ROUTABLE:${route.name}`,
    );
  }
}

async function observeAutomaticInitLifecycle() {
  const bothEnabled = await runInitScenario({
    name: 'both-enabled-valid',
    gateValues: ['1', '1'],
    configurationState: 'valid',
  });
  const bothDisabled = await runInitScenario({
    name: 'both-disabled',
    gateValues: [undefined, undefined],
    configurationState: 'not-read',
  });
  const halfEnabledProvider = await runInitScenario({
    name: 'provider-only',
    gateValues: ['1', undefined],
    configurationState: 'valid',
  });
  const halfEnabledMutation = await runInitScenario({
    name: 'mutation-only',
    gateValues: [undefined, '1'],
    configurationState: 'valid',
  });
  const missingConfiguration = await runInitScenario({
    name: 'missing-configuration',
    gateValues: ['1', '1'],
    configurationState: 'missing',
  });
  const unsafeConfiguration = await runInitScenario({
    name: 'unsafe-configuration',
    gateValues: ['1', '1'],
    configurationState: 'unsafe',
  });
  const interruptedResume = await runInitScenario({
    name: 'interrupted-resume',
    gateValues: ['1', '1'],
    configurationState: 'valid',
    interruptFirstReconciliation: true,
  });
  const priorStructuralOnly = await runInitScenario({
    name: 'prior-structural-only',
    gateValues: ['1', '1'],
    configurationState: 'valid',
    priorSemanticState: 'SemanticIndexPending',
  });
  return Object.freeze({
    bothEnabled,
    bothDisabled,
    halfEnabledProvider,
    halfEnabledMutation,
    missingConfiguration,
    unsafeConfiguration,
    interruptedResume,
    priorStructuralOnly,
  });
}

function assertAutomaticInitLifecycle(observation) {
  const enabled = observation.bothEnabled;
  assert.strictEqual(enabled.outcome.status, 'completed', 'SP05_AUTOMATIC_INIT_RECONCILIATION_MISSING');
  assert.strictEqual(
    enabled.outcome.alignment,
    'Aligned',
    'SP05_AUTOMATIC_INIT_RECONCILIATION_MISSING',
  );
  assert.deepStrictEqual(enabled.outcome.completedChannels, REQUIRED_CHANNELS, 'SP05_INIT_THREE_CHANNELS_INCOMPLETE');
  assert.strictEqual(enabled.effects.backfillCalls, 1, 'SP05_INIT_RECONCILIATION_CALL_COUNT_CHANGED');
  assert.strictEqual(enabled.effects.readinessWrites, 1, 'SP05_INIT_READINESS_NOT_RECORDED');
  assertBefore(enabled.effects.events, 'readiness-invalidated', 'provider-call', 'SP05_INIT_INVALIDATION_NOT_FIRST');
  assertBefore(enabled.effects.events, 'queryability-verified', 'readiness-recorded', 'SP05_INIT_READINESS_BEFORE_QUERYABILITY');
  assertBefore(enabled.effects.events, 'global-coherence-verified', 'readiness-recorded', 'SP05_INIT_READINESS_BEFORE_GLOBAL_COHERENCE');

  const disabled = observation.bothDisabled;
  assert.strictEqual(disabled.outcome.status, 'completed', 'SP05_DISABLED_INIT_MUST_COMPLETE_STRUCTURAL');
  assert(['SemanticDisabled', 'SemanticIndexPending'].includes(disabled.outcome.semanticState), 'SP05_DISABLED_STATE_MISSING');
  assertZeroSemanticEffects(disabled.effects, 'SP05_DISABLED');

  for (const rejected of [
    observation.halfEnabledProvider,
    observation.halfEnabledMutation,
    observation.missingConfiguration,
    observation.unsafeConfiguration,
  ]) {
    assert.strictEqual(rejected.outcome.status, 'failed', `SP05_${rejected.name}_NOT_FAIL_CLOSED`);
    assert(rejected.outcome.category, `SP05_${rejected.name}_CATEGORY_MISSING`);
    assert(rejected.outcome.action, `SP05_${rejected.name}_ACTION_MISSING`);
    assert(!JSON.stringify(rejected.outcome).includes('SEMANTIC-SECRET-CANARY'), `SP05_${rejected.name}_SECRET_LEAK`);
    assertZeroProviderVectorWrites(rejected.effects, `SP05_${rejected.name}`);
  }

  assert.strictEqual(
    observation.interruptedResume.outcome.resumeRequired,
    true,
    'SP05_INTERRUPTED_RECONCILIATION_NOT_RESUMABLE',
  );
  assert.strictEqual(
    observation.priorStructuralOnly.outcome.alignment,
    'Aligned',
    'SP05_PRIOR_STRUCTURAL_ONLY_NOT_ALIGNED_ON_RERUN',
  );
}

function assertPrivateFullReconciliation(initObservation, publicSurface) {
  assert.strictEqual(
    publicSurface.unifiedToolNames.includes('backfillSystemArchitectureSemanticProjection'),
    false,
    'SP01_BACKFILL_TOOL_NOT_PRIVATE',
  );
  const route = publicSurface.retiredRoutes.find(
    item => item.name === 'backfillSystemArchitectureSemanticProjection',
  );
  assert(route && route.routable === false, 'SP01_BACKFILL_PUBLIC_ROUTE_NOT_RETIRED');
  const enabled = initObservation.bothEnabled;
  assert.strictEqual(
    enabled.effects.backfillCalls,
    1,
    'SP01_PRIVATE_FULL_RECONCILIATION_MISSING',
  );
  assert.deepStrictEqual(
    enabled.outcome.completedChannels,
    REQUIRED_CHANNELS,
    'SP01_PRIVATE_THREE_CHANNEL_RECONCILIATION_INCOMPLETE',
  );
  assert.strictEqual(enabled.outcome.alignment, 'Aligned', 'SP01_PRIVATE_RECONCILIATION_NOT_ALIGNED');
  assert.strictEqual(
    initObservation.interruptedResume.outcome.resumeRequired,
    true,
    'SP01_PRIVATE_RECONCILIATION_NOT_RESUMABLE',
  );
}

async function observeFreshReadinessPerQuery() {
  const effects = {
    readinessReads: 0,
    retrievals: 0,
  };
  const readiness = alignedReadiness();
  const journey = createProductionSemanticOperatorJourney({
    async initializeWorkspace() { return { status: 'initialized' }; },
    async syncCanonicalStructuralProjection() { return { status: 'completed' }; },
    async resolveApprovedConfiguration() { return approvedConfiguration(); },
    async runSemanticBackfill() { return { status: 'completed' }; },
    async readSemanticReadiness() {
      effects.readinessReads += 1;
      return readiness;
    },
    async querySystemArchitecture(request) {
      effects.retrievals += 1;
      return {
        status: 'passed',
        query: request.query,
        readiness,
      };
    },
    readinessAttestationStore: Object.freeze({
      async read() { return undefined; },
      async record() { throw new Error('EXPLICIT_ATTESTATION_WRITE_PROHIBITED'); },
      async clear() {},
      async validate() { return false; },
    }),
  });
  const outcomes = [];
  for (const intent of ['first fresh readiness query', 'second fresh readiness query']) {
    try {
      outcomes.push(await journey.query({
        purpose: 'implementation-design',
        intent,
      }));
    } catch (error) {
      outcomes.push({
        status: 'failed',
        category: error && (error.category || error.message),
        fullSnapshotFallback: error && error.fullSnapshotFallback,
      });
    }
  }
  return Object.freeze({
    outcomes: Object.freeze(outcomes),
    effects: Object.freeze({ ...effects }),
  });
}

function assertFreshReadinessPerQuery(observation, prefix = 'SP04') {
  assert.deepStrictEqual(
    observation.outcomes.map(outcome => outcome.status),
    ['passed', 'passed'],
    `${prefix}_QUERY_REQUIRES_RETIRED_EXPLICIT_READINESS`,
  );
  assert.strictEqual(observation.effects.readinessReads, 2, `${prefix}_READINESS_NOT_READ_EVERY_QUERY`);
  assert.strictEqual(observation.effects.retrievals, 2, `${prefix}_ALIGNED_QUERY_NOT_RETRIEVED`);
}

function observePersistentIncrementalLifecycle(testcasePrefix) {
  const modulePath = path.join(
    repoRoot,
    '.argo',
    'scripts',
    'graph-rag',
    'mutationEmbeddingVectorLifecycle.js',
  );
  delete require.cache[require.resolve(modulePath)];
  const loaded = require(modulePath);
  if (typeof loaded.createPersistentMutationEmbeddingLifecycle !== 'function') {
    throw new Error(`${testcasePrefix}_PERSISTENT_INCREMENTAL_LIFECYCLE_BOUNDARY_MISSING`);
  }
  return loaded.createPersistentMutationEmbeddingLifecycle;
}

async function runPersistentIncrementalMatrix(testcasePrefix) {
  const createLifecycle = observePersistentIncrementalLifecycle(testcasePrefix);
  const effects = createIncrementalEffects();
  const lifecycle = createLifecycle(effects.dependencies);
  const mutationMatrix = buildMutationMatrix();
  const results = [];
  for (const mutation of mutationMatrix) {
    results.push(await lifecycle.reconcile({
      canonicalWrite: mutation,
      gates: { ARGO_LIVE_PROVIDER_E2E: '1', ARGO_W31_LIVE_MUTATION_VECTOR_E2E: '1' },
    }));
  }
  const preview = await lifecycle.reconcile({
    canonicalWrite: mutationMatrix[0],
    preview: true,
    gates: { ARGO_LIVE_PROVIDER_E2E: '1', ARGO_W31_LIVE_MUTATION_VECTOR_E2E: '1' },
  });
  return Object.freeze({
    mutationMatrix,
    results: Object.freeze(results),
    preview,
    effects: effects.snapshot(),
  });
}

function assertPersistentIncrementalMatrix(observation, prefix) {
  assert.strictEqual(observation.results.length, 18, `${prefix}_MUTATION_MATRIX_INCOMPLETE`);
  for (let index = 0; index < observation.results.length; index += 1) {
    const expected = observation.mutationMatrix[index];
    const result = observation.results[index];
    assert.deepStrictEqual(result.touchedIds, [expected.id], `${prefix}_TOUCHED_IDS_NOT_EXACT:${expected.kind}`);
    assert.strictEqual(result.alignment, 'Aligned', `${prefix}_ALIGNED_BEFORE_COMPLETE:${expected.kind}`);
    assert.strictEqual(result.fullSnapshotFallback, false, `${prefix}_FULL_SNAPSHOT_FALLBACK`);
  }
  assert.strictEqual(observation.preview.vectorEffects, 0, `${prefix}_PREVIEW_VECTOR_EFFECT`);
  assert.strictEqual(observation.effects.cleanupCalls, 0, `${prefix}_PRODUCTION_RUNID_CLEANUP_PROHIBITED`);
  assert.strictEqual(observation.effects.runIdRecords, 0, `${prefix}_PRODUCTION_RUNID_RECORD_PROHIBITED`);
  assert.strictEqual(observation.effects.invalidations, 18, `${prefix}_READINESS_INVALIDATION_COUNT_CHANGED`);
  assert.strictEqual(observation.effects.queryabilityChecks, 18, `${prefix}_QUERYABILITY_NOT_VERIFIED`);
  assert.strictEqual(observation.effects.coherenceChecks, 18, `${prefix}_GLOBAL_COHERENCE_NOT_VERIFIED`);
  for (const record of observation.effects.records) {
    for (const field of [
      'objectId',
      'channel',
      'canonicalVersion',
      'contentVersion',
      'indexVersion',
      'provider',
      'model',
      'modelVersion',
      'dimensions',
    ]) {
      assert(record[field] !== undefined && record[field] !== '', `${prefix}_EVIDENCE_FIELD_MISSING:${field}`);
    }
  }
}

async function runInitScenario(options) {
  const effects = createInitEffects(options);
  const journey = createProductionSemanticOperatorJourney(effects.dependencies);
  let outcome;
  try {
    outcome = await journey.startNewProject({});
    if (outcome && outcome.backfill) {
      outcome = {
        ...outcome.backfill,
        semanticState: outcome.semanticState,
      };
    }
  } catch (error) {
    outcome = {
      status: 'failed',
      category: error && (error.category || error.message),
      action: error && error.action,
    };
  }
  return Object.freeze({
    name: options.name,
    outcome: Object.freeze(outcome || {}),
    effects: effects.snapshot(),
  });
}

function createInitEffects(options) {
  const events = [];
  let backfillCalls = 0;
  let readinessWrites = 0;
  let providerCalls = 0;
  let vectorWrites = 0;
  const gateEvidence = Object.fromEntries(DUAL_GATES.map((name, index) => [name, options.gateValues[index]]));
  const dependencies = Object.freeze({
    async initializeWorkspace() {
      events.push('canonical-argo-init');
      return { status: 'initialized' };
    },
    async syncCanonicalStructuralProjection() {
      events.push('structural-projection-completed');
      return {
        status: 'completed',
        semanticState: options.priorSemanticState || 'SemanticIndexPending',
      };
    },
    async resolveApprovedConfiguration() {
      events.push('gate-and-configuration-read');
      if (options.configurationState === 'missing') throw safeError('EXTERNAL_CREDENTIALS_REQUIRED');
      if (options.configurationState === 'unsafe') throw safeError('SECRET_FILE_ACL_UNSAFE');
      return {
        ...approvedConfiguration(),
        gates: gateEvidence,
      };
    },
    async runSemanticBackfill() {
      backfillCalls += 1;
      events.push('readiness-invalidated');
      if (options.interruptFirstReconciliation) {
        return {
          status: 'failed',
          resumeRequired: true,
          checkpoint: { channel: 'ArchitectureRelationship', cursor: 1 },
        };
      }
      providerCalls += 3;
      vectorWrites += 3;
      events.push('provider-call', 'vector-write', 'queryability-verified', 'global-coherence-verified');
      return {
        status: 'completed',
        alignment: 'Aligned',
        completedChannels: [...REQUIRED_CHANNELS],
      };
    },
    async readSemanticReadiness() { return alignedReadiness(); },
    async querySystemArchitecture() { return { status: 'passed' }; },
    readinessAttestationStore: Object.freeze({
      async clear() { events.push('readiness-invalidated'); },
      async read() { return undefined; },
      async validate() { return false; },
      async record() {
        readinessWrites += 1;
        events.push('readiness-recorded');
      },
    }),
  });
  return {
    dependencies,
    snapshot() {
      return Object.freeze({
        events: Object.freeze([...events]),
        backfillCalls,
        readinessWrites,
        providerCalls,
        vectorWrites,
      });
    },
  };
}

function createIncrementalEffects() {
  const state = {
    invalidations: 0,
    queryabilityChecks: 0,
    coherenceChecks: 0,
    cleanupCalls: 0,
    runIdRecords: 0,
    records: [],
  };
  return {
    dependencies: Object.freeze({
      readiness: Object.freeze({
        async invalidate() { state.invalidations += 1; },
        async recordAligned() {},
        async recordFailure() {},
      }),
      configuration: Object.freeze({
        async resolve() { return approvedConfiguration(); },
      }),
      provider: Object.freeze({
        async embed(record) { return Array.from({ length: 1024 }, (_, index) => index / 2048); },
      }),
      projectionStore: Object.freeze({
        async upsertRecords(records) {
          state.records.push(...records);
          state.runIdRecords += records.filter(record => Object.hasOwn(record, 'runId')).length;
        },
        async deleteTombstones(records) {
          state.records.push(...records);
          state.runIdRecords += records.filter(record => Object.hasOwn(record, 'runId')).length;
        },
        async readRecords() { return [...state.records]; },
        async close() {},
      }),
      queryability: Object.freeze({
        async verifyTouched() { state.queryabilityChecks += 1; return true; },
      }),
      coherence: Object.freeze({
        async verifyGlobal() { state.coherenceChecks += 1; return true; },
      }),
    }),
    snapshot() {
      return Object.freeze({
        ...state,
        records: Object.freeze([...state.records]),
      });
    },
  };
}

function buildMutationMatrix() {
  const matrix = [];
  for (const objectType of REQUIRED_CHANNELS) {
    for (const operation of ['add', 'update', 'remove']) {
      for (const surface of ['batch', 'focused']) {
        matrix.push(Object.freeze({
          kind: `${surface}-${operation}-${objectType}`,
          surface,
          operation,
          objectType,
          id: `${objectType.toLowerCase()}-${operation}-${surface}`,
          touchedElementIds: objectType === 'Element' ? [`${objectType.toLowerCase()}-${operation}-${surface}`] : [],
          touchedRelationshipIds: objectType === 'ArchitectureRelationship' ? [`${objectType.toLowerCase()}-${operation}-${surface}`] : [],
          touchedViewIds: objectType === 'View' ? [`${objectType.toLowerCase()}-${operation}-${surface}`] : [],
          canonicalVersion: `canonical:${objectType}:${operation}:${surface}`,
        }));
      }
    }
  }
  return Object.freeze(matrix);
}

function approvedConfiguration() {
  return Object.freeze({
    provider: 'alibaba-cloud-model-studio-openai-compatible-cn-beijing',
    model: 'qwen3.7-text-embedding',
    modelVersion: 'qualification-2026-07-25',
    dimensions: 1024,
    externalCredentialsOnly: true,
    secretCanary: undefined,
  });
}

function alignedReadiness() {
  return Object.freeze({
    state: 'Aligned',
    verified: true,
    canonicalVersion: 'canonical:v1',
    contentVersion: 'content:v1',
    indexVersion: 'index:v1',
    completedChannels: [...REQUIRED_CHANNELS],
    missingChannels: [],
    mismatchedChannels: [],
    fullSnapshotFallback: false,
  });
}

function assertZeroSemanticEffects(effects, prefix) {
  assert.strictEqual(effects.backfillCalls, 0, `${prefix}_BACKFILL_EFFECT`);
  assertZeroProviderVectorWrites(effects, prefix);
}

function assertZeroProviderVectorWrites(effects, prefix) {
  assert.strictEqual(effects.providerCalls, 0, `${prefix}_PROVIDER_EFFECT`);
  assert.strictEqual(effects.vectorWrites, 0, `${prefix}_VECTOR_WRITE`);
}

function assertBefore(events, first, second, category) {
  const firstIndex = events.indexOf(first);
  const secondIndex = events.indexOf(second);
  assert(firstIndex >= 0 && secondIndex > firstIndex, category);
}

function toolNames(response) {
  return Object.freeze((((response || {}).result || {}).tools || []).map(tool => tool.name));
}

function safeError(category) {
  const error = new Error(`${category}: SEMANTIC-SECRET-CANARY`);
  error.category = category;
  error.action = 'Correct the external configuration and rerun argo init';
  return error;
}

module.exports = {
  assertAutomaticInitLifecycle,
  assertFreshReadinessPerQuery,
  assertPrivateFullReconciliation,
  assertPersistentIncrementalMatrix,
  assertSolePublicSemanticSurface,
  observeAutomaticInitLifecycle,
  observeFreshReadinessPerQuery,
  observeSolePublicSemanticSurface,
  runPersistentIncrementalMatrix,
};

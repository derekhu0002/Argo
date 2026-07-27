const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const systemMcp = require(path.join(repoRoot, '.argo', 'scripts', 'systemarchitecture-mcp-server.js'));
const unifiedMcp = require(path.join(repoRoot, '.argo', 'scripts', 'argo-mcp-server.js'));

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
    for (const [dispatcher, invoke] of [
      ['system', () => systemMcp.callTool(name, {}, inertDependencies)],
      ['unified', () => unifiedMcp.callTool(name, {}, null, inertDependencies)],
    ]) {
      try {
        await invoke();
        retiredRoutes.push({ dispatcher, name, routable: true });
      } catch (error) {
        retiredRoutes.push({
          dispatcher,
          name,
          routable: false,
          category: error && (error.category || error.message),
        });
      }
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
  const bothDisabled = await runActualArgoInitScenario('both-disabled', {});
  const halfEnabledProvider = await runActualArgoInitScenario('provider-only', {
    ARGO_LIVE_PROVIDER_E2E: '1',
  });
  const halfEnabledMutation = await runActualArgoInitScenario('mutation-only', {
    ARGO_W31_LIVE_MUTATION_VECTOR_E2E: '1',
  });
  const malformedProvider = await runActualArgoInitScenario('malformed-provider', {
    ARGO_LIVE_PROVIDER_E2E: 'true',
    ARGO_W31_LIVE_MUTATION_VECTOR_E2E: '1',
  });
  const malformedMutation = await runActualArgoInitScenario('malformed-mutation', {
    ARGO_LIVE_PROVIDER_E2E: '1',
    ARGO_W31_LIVE_MUTATION_VECTOR_E2E: 'yes',
  });
  const missingConfiguration = await runActualArgoInitScenario('missing-configuration', {
    ARGO_LIVE_PROVIDER_E2E: '1',
    ARGO_W31_LIVE_MUTATION_VECTOR_E2E: '1',
  });
  const unsafeConfiguration = await runActualArgoInitScenario('unsafe-configuration', {
    ARGO_LIVE_PROVIDER_E2E: '1',
    ARGO_W31_LIVE_MUTATION_VECTOR_E2E: '1',
    createUnsafeConfiguration: true,
  });
  const controlledEnabled = await runControlledEnabledArgoInitScenario();
  return Object.freeze({
    bothDisabled,
    halfEnabledProvider,
    halfEnabledMutation,
    malformedProvider,
    malformedMutation,
    missingConfiguration,
    unsafeConfiguration,
    controlledEnabled,
  });
}

function assertAutomaticInitLifecycle(observation) {
  const disabled = observation.bothDisabled;
  assert.strictEqual(disabled.invocation, 'argo-mcp-server.callTool:initializeWorkspace');
  assert(
    ['SemanticDisabled', 'SemanticIndexPending'].includes(
      disabled.outcome.semanticState
        || (disabled.outcome.semanticLifecycle && disabled.outcome.semanticLifecycle.state),
    ),
    'SP05_CANONICAL_ARGO_INIT_LIFECYCLE_MISSING',
  );
  assertZeroActualInitSemanticEffects(disabled, 'SP05_DISABLED');

  for (const rejected of [
    observation.halfEnabledProvider,
    observation.halfEnabledMutation,
    observation.malformedProvider,
    observation.malformedMutation,
    observation.missingConfiguration,
    observation.unsafeConfiguration,
  ]) {
    assert(
      rejected.outcome.status === 'failed' || rejected.outcome.isError === true,
      `SP05_${rejected.name}_NOT_FAIL_CLOSED`,
    );
    const failure = rejected.outcome.error || rejected.outcome.semanticLifecycle || rejected.outcome;
    assert(failure.category, `SP05_${rejected.name}_CATEGORY_MISSING`);
    assert(failure.action, `SP05_${rejected.name}_ACTION_MISSING`);
    assert(!JSON.stringify(rejected.outcome).includes('SEMANTIC-SECRET-CANARY'), `SP05_${rejected.name}_SECRET_LEAK`);
    assertZeroActualInitSemanticEffects(rejected, `SP05_${rejected.name}`);
  }
  assert.strictEqual(
    observation.controlledEnabled.boundaryMissing,
    false,
    'SP05_CANONICAL_INIT_TEST_COMPOSITION_MISSING',
  );
  assert.strictEqual(
    observation.controlledEnabled.interruption.status,
    'failed',
    'SP05_CONTROLLED_INTERRUPTION_NOT_OBSERVED',
  );
  assert.strictEqual(
    observation.controlledEnabled.resumed.alignment,
    'Aligned',
    'SP05_CONTROLLED_INIT_NOT_RECOVERED',
  );
  assert.strictEqual(
    observation.controlledEnabled.writesAfterRerun,
    observation.controlledEnabled.writesAfterResume,
    'SP05_CONTROLLED_INIT_RERUN_NOT_IDEMPOTENT',
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
  assert.strictEqual(
    initObservation.bothDisabled.invocation,
    'argo-mcp-server.callTool:initializeWorkspace',
    'SP01_CANONICAL_ARGO_INIT_PATH_NOT_EXERCISED',
  );
}

const observeCanonicalArgoInitLifecycle = observeAutomaticInitLifecycle;

async function observeFreshReadinessPerQuery() {
  const {
    runExportedFreshReadinessPerQuery,
  } = require('./productionDefaultRetrievalHarness.js');
  return runExportedFreshReadinessPerQuery();
}

function assertFreshReadinessPerQuery(observation, prefix = 'SP04') {
  assert.strictEqual(observation.outcomes.length, 4, `${prefix}_SYSTEM_UNIFIED_QUERY_MATRIX_INCOMPLETE`);
  for (const dispatcher of ['system', 'unified']) {
    const outcomes = observation.outcomes.filter(item => item.dispatcher === dispatcher);
    assert.strictEqual(outcomes.length, 2, `${prefix}_${dispatcher.toUpperCase()}_QUERY_COUNT_CHANGED`);
    assert(
      outcomes.every(item => item.result && item.result.isError !== true),
      `${prefix}_${dispatcher.toUpperCase()}_EXPORTED_QUERY_REQUIRES_INJECTED_JOURNEY`,
    );
  }
  assert.strictEqual(observation.readinessReads.length, 4, `${prefix}_READINESS_NOT_READ_EVERY_QUERY`);
  for (let index = 0; index < observation.operationLedger.length; index += 1) {
    const operation = observation.operationLedger[index];
    if (operation.kind !== 'readiness-query') continue;
    const nextProvider = observation.operationLedger.find(
      item => item.sequence > operation.sequence && item.kind === 'provider-request',
    );
    assert(nextProvider, `${prefix}_ALIGNED_QUERY_NOT_RETRIEVED`);
    assert(operation.sequence < nextProvider.sequence, `${prefix}_PROVIDER_BEFORE_READINESS`);
  }
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
  if (typeof loaded.withPersistentMutationEmbeddingLifecycleTestComposition !== 'function') {
    throw new Error(`${testcasePrefix}_ACTUAL_MUTATION_TEST_COMPOSITION_MISSING`);
  }
  return loaded.withPersistentMutationEmbeddingLifecycleTestComposition;
}

async function runPersistentIncrementalMatrix(testcasePrefix) {
  const withTestComposition = observePersistentIncrementalLifecycle(testcasePrefix);
  const effects = createActualMutationEffects();
  const mutationMatrix = buildMutationMatrix();
  const results = [];
  const scenarios = [];
  await withTestComposition(effects.composition, async () => {
    for (const mutation of mutationMatrix) {
      effects.selectScenario({ name: mutation.kind });
      results.push(await invokeActualMutationAdapter(mutation, {
        ARGO_LIVE_PROVIDER_E2E: '1',
        ARGO_W31_LIVE_MUTATION_VECTOR_E2E: '1',
      }));
    }
    const preview = await invokeActualMutationAdapter(
      { ...mutationMatrix[0], preview: true },
      { ARGO_LIVE_PROVIDER_E2E: '1', ARGO_W31_LIVE_MUTATION_VECTOR_E2E: '1' },
    );
    scenarios.push({ name: 'preview', observation: preview });
    for (const scenario of [
      { name: 'disabled', gates: {} },
      { name: 'provider-only', gates: { ARGO_LIVE_PROVIDER_E2E: '1' } },
      { name: 'mutation-only', gates: { ARGO_W31_LIVE_MUTATION_VECTOR_E2E: '1' } },
      { name: 'malformed-provider', gates: { ARGO_LIVE_PROVIDER_E2E: 'true', ARGO_W31_LIVE_MUTATION_VECTOR_E2E: '1' } },
      { name: 'malformed-mutation', gates: { ARGO_LIVE_PROVIDER_E2E: '1', ARGO_W31_LIVE_MUTATION_VECTOR_E2E: 'yes' } },
      { name: 'missing-configuration', gates: { ARGO_LIVE_PROVIDER_E2E: '1', ARGO_W31_LIVE_MUTATION_VECTOR_E2E: '1' }, configurationFailure: 'EXTERNAL_CREDENTIALS_REQUIRED' },
      { name: 'unsafe-configuration', gates: { ARGO_LIVE_PROVIDER_E2E: '1', ARGO_W31_LIVE_MUTATION_VECTOR_E2E: '1' }, configurationFailure: 'SECRET_FILE_ACL_UNSAFE' },
      { name: 'provider-failure', gates: enabledGates(), failAt: 'provider' },
      { name: 'persistence-failure', gates: enabledGates(), failAt: 'persistence' },
      { name: 'queryability-failure', gates: enabledGates(), failAt: 'queryability' },
      { name: 'coherence-failure', gates: enabledGates(), failAt: 'coherence' },
    ]) {
      effects.selectScenario(scenario);
      scenarios.push({
        name: scenario.name,
        observation: await invokeActualMutationAdapter(mutationMatrix[7], scenario.gates),
      });
    }
  });
  const failedCanonicalWrite = scenarios.find(item => item.name === 'persistence-failure');
  const laterInitRecovery = await runControlledEnabledArgoInitScenario(
    failedCanonicalWrite.observation.afterBytes,
  );
  return Object.freeze({
    mutationMatrix,
    results: Object.freeze(results),
    scenarios: Object.freeze(scenarios),
    laterInitRecovery,
    effects: effects.snapshot(),
  });
}

function assertPersistentIncrementalMatrix(observation, prefix) {
  assert.strictEqual(observation.results.length, 18, `${prefix}_MUTATION_MATRIX_INCOMPLETE`);
  for (let index = 0; index < observation.results.length; index += 1) {
    const expected = observation.mutationMatrix[index];
    const result = extractToolPayload(observation.results[index].result);
    assert.strictEqual(result.written, true, `${prefix}_CANONICAL_WRITE_NOT_APPLIED:${expected.kind}`);
    assert.deepStrictEqual(
      {
        touchedElementIds: result.touchedElementIds,
        touchedRelationshipIds: result.touchedRelationshipIds,
        touchedViewIds: result.touchedViewIds,
      },
      expected.expectedTouchedIds,
      `${prefix}_ACTUAL_TOUCHED_IDS_NOT_EXACT:${expected.kind}`,
    );
    assert.strictEqual(result.alignment && result.alignment.state, 'Aligned', `${prefix}_ALIGNED_BEFORE_COMPLETE:${expected.kind}`);
  }
  assert.strictEqual(observation.effects.lifecycleCalls.length, 29, `${prefix}_ACTUAL_ADAPTER_LIFECYCLE_CALL_COUNT_CHANGED`);
  const preview = observation.scenarios.find(item => item.name === 'preview');
  assert.strictEqual(preview.observation.afterBytes, preview.observation.beforeBytes, `${prefix}_PREVIEW_CANONICAL_WRITE`);
  assert.strictEqual(
    observation.effects.operations.filter(item => item.scenario === 'preview').length,
    0,
    `${prefix}_PREVIEW_VECTOR_EFFECT`,
  );
  assert.strictEqual(observation.effects.cleanupCalls, 0, `${prefix}_PRODUCTION_RUNID_CLEANUP_PROHIBITED`);
  assert.strictEqual(observation.effects.runIdRecords, 0, `${prefix}_PRODUCTION_RUNID_RECORD_PROHIBITED`);
  for (const lifecycle of observation.effects.lifecycleCalls) {
    if (lifecycle.preview) continue;
    const events = observation.effects.operations.filter(item => item.callId === lifecycle.callId);
    const kinds = events.map(item => item.kind);
    assert(kinds.includes('readiness-invalidate'), `${prefix}_READINESS_INVALIDATION_MISSING`);
    if (kinds.includes('provider-embed')) {
      assertBefore(kinds, 'readiness-invalidate', 'provider-embed', `${prefix}_READINESS_NOT_INVALIDATED_FIRST`);
    }
  }
  for (const result of observation.results) {
    const expected = result.mutation;
    const operations = observation.effects.operations.filter(item => item.caseKind === expected.kind);
    const writes = operations.filter(item => ['upsert-records', 'delete-tombstones'].includes(item.kind));
    assert(writes.length > 0, `${prefix}_PERSISTENCE_NOT_EXERCISED:${expected.kind}`);
    assert(
      expected.operation === 'remove'
        ? writes.every(item => item.kind === 'delete-tombstones')
        : writes.every(item => item.kind === 'upsert-records'),
      `${prefix}_REMOVE_UPSERT_MAPPING_INVALID:${expected.kind}`,
    );
  }
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
  for (const scenario of observation.scenarios.filter(item => item.name !== 'preview')) {
    const payload = extractToolPayload(scenario.observation.result);
    assert.strictEqual(scenario.observation.afterBytes !== scenario.observation.beforeBytes, true, `${prefix}_${scenario.name}_CANONICAL_WRITE_LOST`);
    assert(
      canonicalContainsMutation(scenario.observation.afterBytes, scenario.observation.mutation),
      `${prefix}_${scenario.name}_CANONICAL_BYTES_NOT_AUTHORITATIVE`,
    );
    if (['disabled'].includes(scenario.name)) {
      assert(['Pending', 'Stale', 'SemanticIndexPending'].includes(payload.alignment && payload.alignment.state), `${prefix}_DISABLED_STATE_MISSING`);
    } else if (scenario.name !== 'preview') {
      assert.notStrictEqual(payload.alignment && payload.alignment.state, 'Aligned', `${prefix}_${scenario.name}_FALSE_ALIGNMENT`);
    }
  }
  assert.strictEqual(
    observation.laterInitRecovery.boundaryMissing,
    false,
    `${prefix}_LATER_INIT_RECOVERY_COMPOSITION_MISSING`,
  );
  assert.strictEqual(
    observation.laterInitRecovery.resumed.alignment,
    'Aligned',
    `${prefix}_LATER_INIT_DID_NOT_RESTORE_ALIGNMENT`,
  );
}

function canonicalContainsMutation(bytes, mutation) {
  const document = JSON.parse(bytes);
  if (mutation.objectType === 'Element') {
    return document.elements.some(item => item.id === mutation.id);
  }
  if (mutation.objectType === 'ArchitectureRelationship') {
    return document.relationships.some(item => item.id === mutation.id);
  }
  return document.views.some(item => item.view_id === mutation.id);
}

async function runActualArgoInitScenario(name, environment) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'argo-canonical-init-'));
  const previous = captureEnvironment([
    'ARGO_REPO_ROOT',
    ...DUAL_GATES,
    'QWEN_KEY',
    'ARGO_NEO4J_DATABASE_URL',
    'ARGO_NEO4J_DATABASE_USERNAME',
    'ARGO_NEO4J_DATABASE_PASSWORD',
  ]);
  try {
    fs.writeFileSync(path.join(root, 'Argo.feap'), 'controlled argo init template');
    const graphDirectory = path.join(root, 'design', 'KG');
    fs.mkdirSync(graphDirectory, { recursive: true });
    const graphPath = path.join(graphDirectory, 'SystemArchitecture.json');
    if (environment && environment.canonicalBytes) {
      fs.writeFileSync(graphPath, environment.canonicalBytes);
    } else {
      fs.copyFileSync(
        path.join(repoRoot, 'design', 'KG', 'SystemArchitecture.json'),
        graphPath,
      );
    }
    process.env.ARGO_REPO_ROOT = root;
    for (const key of DUAL_GATES) delete process.env[key];
    for (const key of [
      'QWEN_KEY',
      'ARGO_NEO4J_DATABASE_URL',
      'ARGO_NEO4J_DATABASE_USERNAME',
      'ARGO_NEO4J_DATABASE_PASSWORD',
    ]) delete process.env[key];
    for (const [key, value] of Object.entries(environment || {})) {
      if (!['createUnsafeConfiguration', 'canonicalBytes'].includes(key)) process.env[key] = value;
    }
    if (environment && environment.createUnsafeConfiguration) {
      const argoDirectory = path.join(root, '.argo');
      fs.mkdirSync(argoDirectory, { recursive: true });
      fs.writeFileSync(path.join(argoDirectory, '.env'), [
        'QWEN_KEY=SEMANTIC-SECRET-CANARY',
        'ARGO_NEO4J_DATABASE_URL=neo4j://unsafe.invalid:7687',
        'ARGO_NEO4J_DATABASE_USERNAME=unsafe',
        'ARGO_NEO4J_DATABASE_PASSWORD=SEMANTIC-SECRET-CANARY',
      ].join('\n'));
    }
    let outcome;
    try {
      outcome = extractToolPayload(await unifiedMcp.callTool('initializeWorkspace'));
    } catch (error) {
      outcome = {
        status: 'failed',
        error: observableSafeError(error),
      };
    }
    return Object.freeze({
      name,
      invocation: 'argo-mcp-server.callTool:initializeWorkspace',
      outcome: Object.freeze(outcome || {}),
      canonicalBytes: fs.readFileSync(graphPath, 'utf8'),
    });
  } finally {
    restoreEnvironment(previous);
    fs.rmSync(root, { recursive: true, force: true });
  }
}

async function runControlledEnabledArgoInitScenario(canonicalBytes = undefined) {
  if (typeof unifiedMcp.withCanonicalSemanticInitTestComposition !== 'function') {
    return Object.freeze({ boundaryMissing: true });
  }
  const {
    createControlledPrivateBackfillComposition,
  } = require('./productionSemanticPersistenceHarness.js');
  const controlled = createControlledPrivateBackfillComposition(canonicalBytes ? {
    fixture: {
      ...JSON.parse(canonicalBytes),
      version: 'canonical-mutation-recovery',
    },
  } : {});
  let interruption;
  let resumed;
  let rerun;
  let writesAfterResume;
  await unifiedMcp.withCanonicalSemanticInitTestComposition({
    configurationBehavior: Object.freeze({
      gates: enabledGates(),
      state: 'valid-external-only',
    }),
    productionGraphRagRuntime: controlled.runtime,
  }, async () => {
    const controlledEnvironment = {
      ...enabledGates(),
      ...(canonicalBytes ? { canonicalBytes } : {}),
    };
    interruption = (await runActualArgoInitScenario('controlled-interruption', controlledEnvironment)).outcome;
    controlled.observations.releaseInterruption();
    controlled.observations.setPhase('resume');
    resumed = (await runActualArgoInitScenario('controlled-resume', controlledEnvironment)).outcome;
    writesAfterResume = controlled.observations.writeCount();
    controlled.observations.setPhase('rerun');
    rerun = (await runActualArgoInitScenario('controlled-rerun', controlledEnvironment)).outcome;
  });
  return Object.freeze({
    boundaryMissing: false,
    interruption,
    resumed,
    rerun,
    writesAfterResume,
    writesAfterRerun: controlled.observations.writeCount(),
  });
}

function assertZeroActualInitSemanticEffects(observation, prefix) {
  const evidence = observation.outcome.semanticLifecycle || observation.outcome.error || {};
  for (const field of ['providerCalls', 'vectorWrites']) {
    assert.strictEqual(
      evidence[field] || 0,
      0,
      `${prefix}_${field.toUpperCase()}_EFFECT`,
    );
  }
}

function createActualMutationEffects() {
  const state = {
    lifecycleCalls: [],
    operations: [],
    cleanupCalls: 0,
    runIdRecords: 0,
    records: [],
  };
  let scenario = { name: 'matrix' };
  let sequence = 0;
  let activeCallId = 0;
  const record = (kind, details = {}) => {
    state.operations.push(Object.freeze({
      sequence: ++sequence,
      kind,
      scenario: scenario.name,
      callId: activeCallId,
      ...details,
    }));
  };
  return {
    composition: Object.freeze({
      observeLifecycleInput(input) {
        activeCallId += 1;
        state.lifecycleCalls.push(Object.freeze({
          callId: activeCallId,
          scenario: scenario.name,
          preview: input && input.preview === true,
          touchedElementIds: [...((input && input.canonicalWrite && input.canonicalWrite.touchedElementIds) || [])],
          touchedRelationshipIds: [...((input && input.canonicalWrite && input.canonicalWrite.touchedRelationshipIds) || [])],
          touchedViewIds: [...((input && input.canonicalWrite && input.canonicalWrite.touchedViewIds) || [])],
        }));
      },
      readiness: Object.freeze({
        async invalidate() { record('readiness-invalidate'); },
        async recordAligned() { record('readiness-aligned'); },
        async recordFailure() { record('readiness-failed'); },
      }),
      configuration: Object.freeze({
        async resolve() {
          record('configuration-resolve');
          if (scenario.configurationFailure) throw safeError(scenario.configurationFailure);
          return approvedConfiguration();
        },
      }),
      provider: Object.freeze({
        async embed() {
          record('provider-embed');
          if (scenario.failAt === 'provider') throw safeError('PROVIDER_FAILED');
          return Array.from({ length: 1024 }, (_, index) => index / 2048);
        },
      }),
      projectionStore: Object.freeze({
        async upsertRecords(records) {
          record('upsert-records', { caseKind: scenario.name, count: records.length });
          if (scenario.failAt === 'persistence') throw safeError('PERSISTENCE_FAILED');
          state.records.push(...records);
          state.runIdRecords += records.filter(record => Object.hasOwn(record, 'runId')).length;
        },
        async deleteTombstones(records) {
          record('delete-tombstones', { caseKind: scenario.name, count: records.length });
          if (scenario.failAt === 'persistence') throw safeError('PERSISTENCE_FAILED');
          state.records.push(...records);
          state.runIdRecords += records.filter(record => Object.hasOwn(record, 'runId')).length;
        },
        async readRecords() { return [...state.records]; },
        async close() {},
      }),
      queryability: Object.freeze({
        async verifyTouched() {
          record('queryability-verify');
          return scenario.failAt !== 'queryability';
        },
      }),
      coherence: Object.freeze({
        async verifyGlobal() {
          record('coherence-verify');
          return scenario.failAt !== 'coherence';
        },
      }),
    }),
    selectScenario(next) {
      scenario = next;
    },
    snapshot() {
      return Object.freeze({
        ...state,
        lifecycleCalls: Object.freeze([...state.lifecycleCalls]),
        operations: Object.freeze([...state.operations]),
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
        const id = `${objectType.toLowerCase()}-${operation}-${surface}`;
        matrix.push(Object.freeze({
          kind: `${surface}-${operation}-${objectType}`,
          surface,
          operation,
          objectType,
          id,
          expectedTouchedIds: Object.freeze({
            touchedElementIds: objectType === 'Element' ? [id] : [],
            touchedRelationshipIds: objectType === 'ArchitectureRelationship' ? [id] : [],
            touchedViewIds: objectType === 'View' ? [id] : [],
          }),
          canonicalVersion: `canonical:${objectType}:${operation}:${surface}`,
        }));
      }
    }
  }
  return Object.freeze(matrix);
}

async function invokeActualMutationAdapter(mutation, gates) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'argo-actual-mutation-'));
  const previous = captureEnvironment(['ARGO_REPO_ROOT', ...DUAL_GATES]);
  try {
    process.env.ARGO_REPO_ROOT = root;
    for (const gate of DUAL_GATES) delete process.env[gate];
    for (const [name, value] of Object.entries(gates || {})) process.env[name] = value;
    const graphDirectory = path.join(root, 'design', 'KG');
    fs.mkdirSync(graphDirectory, { recursive: true });
    const document = createMutationDocument(mutation);
    const graphPath = path.join(graphDirectory, 'SystemArchitecture.json');
    fs.writeFileSync(graphPath, JSON.stringify(document, null, 2));
    const beforeBytes = fs.readFileSync(graphPath, 'utf8');
    const invocation = buildActualMutationInvocation(mutation, document);
    const result = await systemMcp.callTool(invocation.name, invocation.args);
    const afterBytes = fs.readFileSync(graphPath, 'utf8');
    return Object.freeze({
      mutation,
      invocation: Object.freeze(invocation),
      result,
      beforeBytes,
      afterBytes,
    });
  } finally {
    restoreEnvironment(previous);
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function createMutationDocument(mutation) {
  const document = JSON.parse(fs.readFileSync(
    path.join(repoRoot, 'design', 'KG', 'SystemArchitecture.json'),
    'utf8',
  ));
  const primaryView = document.views[0];
  const secondaryView = document.views[1];
  if (mutation.operation !== 'add') {
    if (mutation.objectType === 'Element') {
      const fixture = {
        ...document.elements[0],
        id: mutation.id,
        name: `Lifecycle ${mutation.id}`,
        attributes: [],
        testcases: [],
      };
      document.elements.push(fixture);
      primaryView.included_elements = [...(primaryView.included_elements || []), mutation.id];
      if (mutation.operation === 'remove' && secondaryView) {
        secondaryView.included_elements = (secondaryView.included_elements || []).filter(id => id !== mutation.id);
      }
    } else if (mutation.objectType === 'ArchitectureRelationship') {
      const fixture = {
        ...document.relationships[0],
        id: mutation.id,
        source_id: document.elements[0].id,
        target_id: document.elements[1].id,
      };
      document.relationships.push(fixture);
      primaryView.included_relationships = [...(primaryView.included_relationships || []), mutation.id];
    } else {
      document.views.push({
        ...document.views[0],
        view_id: mutation.id,
        view_name: `Lifecycle ${mutation.id}`,
        included_elements: [],
        included_relationships: [],
      });
    }
  }
  if (mutation.objectType === 'Element' && mutation.operation === 'remove') {
    mutation.expectedTouchedIds.touchedViewIds.splice(
      0,
      mutation.expectedTouchedIds.touchedViewIds.length,
      ...document.views.map(view => view.view_id),
    );
  } else if (
    (mutation.objectType === 'Element' || mutation.objectType === 'ArchitectureRelationship')
    && mutation.operation === 'add'
  ) {
    mutation.expectedTouchedIds.touchedViewIds.splice(
      0,
      mutation.expectedTouchedIds.touchedViewIds.length,
      primaryView.view_id,
    );
  } else if (mutation.objectType === 'ArchitectureRelationship' && mutation.operation === 'remove') {
    mutation.expectedTouchedIds.touchedViewIds.splice(
      0,
      mutation.expectedTouchedIds.touchedViewIds.length,
      primaryView.view_id,
    );
  }
  return document;
}

function buildActualMutationInvocation(mutation, document) {
  const primaryViewId = document.views[0].view_id;
  const baseArgs = { architecturePath: 'design/KG/SystemArchitecture.json' };
  let specification;
  if (mutation.objectType === 'Element') {
    if (mutation.operation === 'add') {
      specification = {
        type: 'addElement',
        element: {
          ...document.elements[0],
          id: mutation.id,
          name: `Lifecycle ${mutation.id}`,
          attributes: [],
          testcases: [],
        },
        view_ids: [primaryViewId],
      };
    } else if (mutation.operation === 'update') {
      specification = { type: 'updateElement', id: mutation.id, patch: { name: `Updated ${mutation.id}` } };
    } else {
      specification = { type: 'removeElement', id: mutation.id };
    }
  } else if (mutation.objectType === 'ArchitectureRelationship') {
    if (mutation.operation === 'add') {
      specification = {
        type: 'addRelationship',
        relationship: {
          ...document.relationships[0],
          id: mutation.id,
          source_id: document.elements[0].id,
          target_id: document.elements[1].id,
        },
        view_ids: [primaryViewId],
      };
    } else if (mutation.operation === 'update') {
      specification = { type: 'updateRelationship', id: mutation.id, patch: { name: `Updated ${mutation.id}` } };
    } else {
      specification = { type: 'removeRelationship', id: mutation.id, view_ids: [primaryViewId] };
    }
  } else if (mutation.operation === 'add') {
    specification = {
      type: 'addView',
      view: {
        ...document.views[0],
        view_id: mutation.id,
        view_name: `Lifecycle ${mutation.id}`,
        included_elements: [],
        included_relationships: [],
      },
    };
  } else if (mutation.operation === 'update') {
    specification = { type: 'updateView', view_id: mutation.id, patch: { view_name: `Updated ${mutation.id}` } };
  } else {
    specification = { type: 'removeView', view_id: mutation.id };
  }
  if (mutation.surface === 'batch') {
    return {
      name: mutation.preview ? 'previewSystemArchitectureMutation' : 'applySystemArchitectureMutation',
      args: { ...baseArgs, mutations: [specification] },
    };
  }
  const focusedNames = {
    Element: {
      add: 'addArchitectureElement',
      update: 'updateArchitectureElement',
      remove: 'removeArchitectureElement',
    },
    ArchitectureRelationship: {
      add: 'addArchitectureRelationship',
      update: 'updateArchitectureRelationship',
      remove: 'removeArchitectureRelationship',
    },
    View: {
      add: 'addArchitectureView',
      update: 'updateArchitectureView',
      remove: 'removeArchitectureView',
    },
  };
  const args = { ...baseArgs, dryRun: mutation.preview === true };
  if (mutation.objectType === 'Element') {
    if (mutation.operation === 'add') Object.assign(args, { element: specification.element, view_ids: specification.view_ids });
    else if (mutation.operation === 'update') Object.assign(args, { id: specification.id, patch: specification.patch });
    else Object.assign(args, { id: specification.id });
  } else if (mutation.objectType === 'ArchitectureRelationship') {
    if (mutation.operation === 'add') Object.assign(args, { relationship: specification.relationship, view_ids: specification.view_ids });
    else if (mutation.operation === 'update') Object.assign(args, { id: specification.id, patch: specification.patch });
    else Object.assign(args, { id: specification.id, view_ids: specification.view_ids });
  } else if (mutation.operation === 'add') Object.assign(args, { view: specification.view });
  else if (mutation.operation === 'update') Object.assign(args, { view_id: specification.view_id, patch: specification.patch });
  else Object.assign(args, { view_id: specification.view_id });
  return {
    name: focusedNames[mutation.objectType][mutation.operation],
    args,
  };
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

function enabledGates() {
  return {
    ARGO_LIVE_PROVIDER_E2E: '1',
    ARGO_W31_LIVE_MUTATION_VECTOR_E2E: '1',
  };
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

function extractToolPayload(result) {
  if (!result || !Array.isArray(result.content) || !result.content[0]) return result;
  try {
    return JSON.parse(result.content[0].text);
  } catch {
    return result;
  }
}

function observableSafeError(error) {
  return {
    category: error && (error.category || error.message),
    action: error && error.action,
    fullSnapshotFallback: error && error.fullSnapshotFallback,
  };
}

function captureEnvironment(names) {
  return Object.fromEntries(names.map(name => [
    name,
    Object.prototype.hasOwnProperty.call(process.env, name) ? process.env[name] : undefined,
  ]));
}

function restoreEnvironment(previous) {
  for (const [name, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
}

module.exports = {
  assertAutomaticInitLifecycle,
  assertFreshReadinessPerQuery,
  assertPrivateFullReconciliation,
  assertPersistentIncrementalMatrix,
  assertSolePublicSemanticSurface,
  observeAutomaticInitLifecycle,
  observeCanonicalArgoInitLifecycle,
  observeFreshReadinessPerQuery,
  observeSolePublicSemanticSurface,
  runPersistentIncrementalMatrix,
};

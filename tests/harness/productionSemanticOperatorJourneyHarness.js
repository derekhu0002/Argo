const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const operatorPath = path.join(
  repoRoot,
  '.argo',
  'scripts',
  'graph-rag',
  'semanticOperatorJourney.js',
);
const cliPath = path.join(repoRoot, '.argo', 'scripts', 'semanticOperatorJourneyCli.js');
const canonicalPath = path.join(repoRoot, 'design', 'KG', 'SystemArchitecture.json');

const APPROVED_CONFIGURATION = deepFreeze({
  provider: 'alibaba-cloud-model-studio-openai-compatible-cn-beijing',
  model: 'qwen3.7-text-embedding',
  modelVersion: 'qualification-2026-07-25',
  dimensions: 1024,
  neo4jDatabaseUrl: 'neo4j://approved-external.invalid:7687',
  neo4jDatabaseUsername: 'approved-operator',
  sourceEvidence: {
    kind: 'approved-external',
    secretValuesExcluded: true,
  },
});
const SECRET_CANARY = 'SP05-SECRET-MUST-NOT-LEAK';
const UNSAFE_SOURCE_CANARY = 'SP05-UNSAFE-SOURCE-MUST-NOT-LEAK';
const DIAGNOSTIC_READINESS = deepFreeze({
  state: 'SemanticIndexPending',
  verified: false,
  canonicalVersion: 'canonical:fresh-project-v1',
  contentVersion: 'content:partial-v1',
  indexVersion: 'index:stale-v0',
  completedChannels: ['Element'],
  missingChannels: ['ArchitectureRelationship', 'View'],
  mismatchedChannels: ['View'],
  fullSnapshotFallback: false,
});

function loadFactory() {
  if (!fs.existsSync(operatorPath)) {
    throw new Error(
      'SP05_OPERATOR_JOURNEY_BOUNDARY_MISSING: create production semanticOperatorJourney.js',
    );
  }
  delete require.cache[require.resolve(operatorPath)];
  const loaded = require(operatorPath);
  assert.strictEqual(
    typeof loaded.createProductionSemanticOperatorJourney,
    'function',
    'SP05_OPERATOR_JOURNEY_FACTORY_MISSING',
  );
  return loaded.createProductionSemanticOperatorJourney;
}

function loadCli() {
  if (!fs.existsSync(cliPath)) {
    throw new Error(
      'SP05_OPERATOR_COMMAND_BOUNDARY_MISSING: create semanticOperatorJourneyCli.js',
    );
  }
  delete require.cache[require.resolve(cliPath)];
  const loaded = require(cliPath);
  assert.strictEqual(
    typeof loaded.runSemanticOperatorCommand,
    'function',
    'SP05_OPERATOR_COMMAND_EXPORT_MISSING',
  );
  return loaded.runSemanticOperatorCommand;
}

async function runNewProjectSemanticOperatorJourney() {
  const createJourney = loadFactory();
  const runCommand = loadCli();
  const canonicalBefore = fs.readFileSync(canonicalPath, 'utf8');

  const noOptIn = await runSuccessfulJourney({
    createJourney,
    runCommand,
    automaticBackfillOptIn: false,
    configurationCase: 'approved',
  });
  const optedIn = await runSuccessfulJourney({
    createJourney,
    runCommand,
    automaticBackfillOptIn: true,
    configurationCase: 'approved',
  });
  const recovery = await runRecoveryJourney({
    createJourney,
    runCommand,
  });
  const missingConsent = await runMissingConsentControls({
    createJourney,
    runCommand,
  });
  const readinessDiagnostics = await runReadinessDiagnosticsJourney({
    createJourney,
    runCommand,
  });

  const rejectedOptIns = [];
  for (const configurationCase of ['missing', 'unsafe', 'unapproved']) {
    rejectedOptIns.push(await runRejectedOptIn({
      createJourney,
      runCommand,
      configurationCase,
    }));
  }

  return deepFreeze({
    noOptIn,
    optedIn,
    recovery,
    missingConsent,
    readinessDiagnostics,
    rejectedOptIns,
    canonicalBefore,
    canonicalAfter: fs.readFileSync(canonicalPath, 'utf8'),
  });
}

async function runSuccessfulJourney({
  createJourney,
  runCommand,
  automaticBackfillOptIn,
  configurationCase,
}) {
  const fixture = createRecordingComposition({
    configurationCase,
  });
  const journey = createJourney(fixture.dependencies);
  assertJourneySurface(journey);

  const initialSnapshot = await runCommand({
    command: 'snapshot',
    journey,
  });
  const start = await runCommand({
    command: 'init',
    options: { automaticBackfillOptIn },
    journey,
  });
  const pendingQueryEventOffset = fixture.snapshot().events.length;
  const pendingQuery = await captureBlocked(() => runCommand({
    command: 'query',
    options: semanticQuery(),
    journey,
  }));
  const pendingQueryEffects = fixture.snapshot().events.slice(pendingQueryEventOffset);

  let interruption;
  let backfill;
  if (!automaticBackfillOptIn) {
    backfill = await runCommand({
      command: 'backfill',
      options: { explicitOptIn: true },
      journey,
    });
  } else {
    backfill = start.backfill;
  }

  const alignedUnverifiedQueryEventOffset = fixture.snapshot().events.length;
  const alignedUnverifiedQuery = await captureBlocked(() => runCommand({
    command: 'query',
    options: semanticQuery(),
    journey,
  }));
  const alignedUnverifiedQueryEffects = fixture.snapshot().events.slice(
    alignedUnverifiedQueryEventOffset,
  );
  const readiness = await runCommand({
    command: 'readiness',
    journey,
  });
  const query = await runCommand({
    command: 'query',
    options: semanticQuery(),
    journey,
  });
  const finalSnapshot = await runCommand({
    command: 'snapshot',
    journey,
  });

  return deepFreeze({
    automaticBackfillOptIn,
    fixtureInput: {
      configurationCase,
      canonicalPath: 'design/KG/SystemArchitecture.json',
      query: semanticQuery(),
      interruptFirstBackfill: false,
    },
    configurationFingerprint: fixture.configurationFingerprint,
    initialSnapshot,
    start,
    pendingQuery,
    pendingQueryEffects,
    interruption,
    backfill,
    alignedUnverifiedQuery,
    alignedUnverifiedQueryEffects,
    readiness,
    query,
    finalSnapshot,
    observations: fixture.snapshot(),
  });
}

async function runRecoveryJourney({ createJourney, runCommand }) {
  const fixture = createRecordingComposition({
    configurationCase: 'approved',
    interruptFirstBackfill: true,
  });
  const journey = createJourney(fixture.dependencies);
  assertJourneySurface(journey);
  await runCommand({
    command: 'init',
    options: { automaticBackfillOptIn: false },
    journey,
  });
  const interruption = await captureBlocked(() => runCommand({
    command: 'backfill',
    options: { explicitOptIn: true },
    journey,
  }));
  const resumed = await runCommand({
    command: 'backfill',
    options: { explicitOptIn: true, resume: true },
    journey,
  });
  const readiness = await runCommand({ command: 'readiness', journey });
  return deepFreeze({
    interruption,
    resumed,
    readiness,
    observations: fixture.snapshot(),
  });
}

async function runMissingConsentControls({ createJourney, runCommand }) {
  const directFixture = createRecordingComposition({ configurationCase: 'approved' });
  const directJourney = createJourney(directFixture.dependencies);
  await directJourney.startNewProject({ automaticBackfillOptIn: false });
  const direct = await captureBlocked(() => directJourney.runExplicitBackfill({}));

  const commandFixture = createRecordingComposition({ configurationCase: 'approved' });
  const commandJourney = createJourney(commandFixture.dependencies);
  await runCommand({
    command: 'init',
    options: { automaticBackfillOptIn: false },
    journey: commandJourney,
  });
  const command = await captureBlocked(() => runCommand({
    command: 'backfill',
    options: {},
    journey: commandJourney,
  }));

  return deepFreeze({
    direct,
    directObservations: directFixture.snapshot(),
    command,
    commandObservations: commandFixture.snapshot(),
  });
}

async function runReadinessDiagnosticsJourney({ createJourney, runCommand }) {
  const fixture = createRecordingComposition({
    configurationCase: 'approved',
    postBackfillReadiness: DIAGNOSTIC_READINESS,
  });
  const journey = createJourney(fixture.dependencies);
  await runCommand({
    command: 'init',
    options: { automaticBackfillOptIn: false },
    journey,
  });
  await runCommand({
    command: 'backfill',
    options: { explicitOptIn: true },
    journey,
  });
  const readiness = await captureBlocked(() => runCommand({
    command: 'readiness',
    journey,
  }));
  return deepFreeze({
    expected: DIAGNOSTIC_READINESS,
    readiness,
    observations: fixture.snapshot(),
  });
}

async function runRejectedOptIn({ createJourney, runCommand, configurationCase }) {
  const fixture = createRecordingComposition({ configurationCase });
  const journey = createJourney(fixture.dependencies);
  assertJourneySurface(journey);
  const preRejectionSnapshot = await runCommand({ command: 'snapshot', journey });
  const outcome = await captureBlocked(() => runCommand({
    command: 'init',
    options: { automaticBackfillOptIn: true },
    journey,
  }));
  const postRejectionSnapshot = await runCommand({ command: 'snapshot', journey });
  return deepFreeze({
    configurationCase,
    preRejectionSnapshot,
    outcome,
    postRejectionSnapshot,
    observations: fixture.snapshot(),
  });
}

function createRecordingComposition({
  configurationCase,
  interruptFirstBackfill = false,
  postBackfillReadiness,
}) {
  const events = [];
  const canonicalDocument = JSON.parse(fs.readFileSync(canonicalPath, 'utf8'));
  const configurationFingerprint = JSON.stringify(APPROVED_CONFIGURATION);
  let readiness = readinessRecord('SemanticIndexPending');
  let interrupted = false;

  function record(kind, details = {}) {
    events.push(deepFreeze({ sequence: events.length + 1, kind, ...details }));
  }

  const dependencies = deepFreeze({
    async initializeWorkspace() {
      record('argo-init');
      return { status: 'initialized', projectId: 'fresh-project' };
    },
    async syncCanonicalStructuralProjection() {
      record('canonical-structural-projection');
      readiness = readinessRecord('SemanticIndexPending');
      return {
        status: 'completed',
        canonicalVersion: 'canonical:fresh-project-v1',
        semanticState: 'SemanticIndexPending',
      };
    },
    async resolveApprovedConfiguration() {
      record('configuration-validation', { configurationCase });
      if (configurationCase === 'approved') return APPROVED_CONFIGURATION;
      const categories = {
        missing: 'APPROVED_SECRET_REQUIRED',
        unsafe: 'SECRET_FILE_ACL_UNSAFE',
        unapproved: 'SECRET_SOURCE_PROVENANCE_PROHIBITED',
      };
      const error = new Error(
        `${categories[configurationCase]}: ${SECRET_CANARY}; ${UNSAFE_SOURCE_CANARY}`,
      );
      error.category = categories[configurationCase];
      error.action = 'Correct approved external configuration and retry argo semantic init';
      error.secret = SECRET_CANARY;
      error.unsafeSource = UNSAFE_SOURCE_CANARY;
      throw error;
    },
    async runSemanticBackfill(input = {}) {
      record('backfill-port-call', {
        automatic: input.automatic === true,
        explicitOptIn: input.explicitOptIn,
      });
      if (input.explicitOptIn !== true) {
        const error = new Error('SEMANTIC_BACKFILL_OPT_IN_REQUIRED');
        error.category = 'SEMANTIC_BACKFILL_OPT_IN_REQUIRED';
        throw error;
      }
      record(input.automatic ? 'automatic-backfill-start' : 'explicit-backfill-start');
      record('provider-call');
      record('database-write');
      if (interruptFirstBackfill && !interrupted) {
        interrupted = true;
        const error = new Error('BACKFILL_INTERRUPTED');
        error.category = 'BACKFILL_INTERRUPTED';
        error.progress = { completed: 2, total: 6 };
        error.checkpoint = { channel: 'ArchitectureRelationship', cursor: 1 };
        error.failedRecords = ['relationship-isolated-failure'];
        error.resume = { command: 'argo semantic backfill --resume' };
        throw error;
      }
      readiness = postBackfillReadiness || readinessRecord('Aligned');
      return {
        status: 'completed',
        progress: { completed: 6, total: 6 },
        checkpoint: { channel: 'View', cursor: 2 },
        failedRecords: [],
        resume: { required: false },
        alignment: 'Aligned',
      };
    },
    async readSemanticReadiness() {
      record('semantic-readiness-read');
      return readiness;
    },
    async querySystemArchitecture(request) {
      if (!request || !request.query) {
        record('canonical-full-snapshot-read');
        return {
          status: 'passed',
          graphPath: 'design/KG/SystemArchitecture.json',
          document: canonicalDocument,
        };
      }
      record('semantic-query-attempt');
      if (readiness.state !== 'Aligned') {
        const error = new Error('SEMANTIC_INDEX_NOT_ALIGNED');
        error.category = 'SEMANTIC_INDEX_NOT_ALIGNED';
        error.state = readiness.state;
        error.fullSnapshotFallback = false;
        throw error;
      }
      return {
        status: 'passed',
        query: { mode: 'semantic-query' },
        document: {
          elements: [{ id: 'semprod-operator-journey-process' }],
          relationships: [],
          views: [],
        },
        readinessVerified: true,
      };
    },
  });

  return {
    dependencies,
    configurationFingerprint,
    snapshot() {
      return deepFreeze({
        events: [...events],
        readiness,
      });
    },
  };
}

function assertNewProjectSemanticOperatorJourney(result) {
  assertConsentAndReadinessControls(result);
  assert.strictEqual(
    result.noOptIn.configurationFingerprint,
    result.optedIn.configurationFingerprint,
    'SP05_SUCCESS_CONFIGURATION_PARITY_REQUIRED',
  );
  assert.notStrictEqual(
    result.noOptIn.automaticBackfillOptIn,
    result.optedIn.automaticBackfillOptIn,
    'SP05_SUCCESS_PATHS_MUST_DIFFER_ONLY_BY_OPT_IN',
  );
  assert.deepStrictEqual(
    result.noOptIn.fixtureInput,
    result.optedIn.fixtureInput,
    'SP05_SUCCESS_FIXTURES_DIFFER_BEYOND_OPT_IN',
  );

  assertSnapshotPreserved(result.noOptIn, 'SP05_NO_OPT_IN');
  assertSnapshotPreserved(result.optedIn, 'SP05_OPTED_IN');
  assert.strictEqual(
    result.canonicalAfter,
    result.canonicalBefore,
    'SP05_CANONICAL_JSON_AUTHORITY_CHANGED',
  );

  assert.strictEqual(
    result.noOptIn.start.semanticState,
    'SemanticIndexPending',
    'SP05_NO_OPT_IN_PENDING_STATE_MISSING',
  );
  assertActionablePending(result.noOptIn.start);
  assert.strictEqual(
    countEvents(result.noOptIn, 'automatic-backfill-start'),
    0,
    'SP05_NO_OPT_IN_AUTOMATIC_START_PROHIBITED',
  );
  assertBlockedPendingQuery(result.noOptIn.pendingQuery, 'SP05_NO_OPT_IN');
  assertExplicitVerificationRequired(
    result.noOptIn.pendingQuery,
    result.noOptIn.pendingQueryEffects,
    'SP05_NO_OPT_IN_PENDING',
  );
  assertBackfillEvidence(result.noOptIn.backfill, false);
  assertBackfillConsentForwarded(result.noOptIn, false);
  assertConfigurationBeforeSemanticEffects(
    result.noOptIn,
    'explicit-backfill-start',
    'SP05_NO_OPT_IN',
  );
  assertExplicitVerificationRequired(
    result.noOptIn.alignedUnverifiedQuery,
    result.noOptIn.alignedUnverifiedQueryEffects,
    'SP05_NO_OPT_IN_ALIGNED_UNVERIFIED',
  );
  assertReadyThenQuery(result.noOptIn);

  assert.strictEqual(
    countEvents(result.optedIn, 'automatic-backfill-start'),
    1,
    'SP05_OPTED_IN_AUTOMATIC_START_REQUIRED',
  );
  assertBefore(
    result.optedIn.observations.events,
    'configuration-validation',
    'automatic-backfill-start',
    'SP05_CONFIGURATION_MUST_PRECEDE_AUTO_START',
  );
  assertConfigurationBeforeSemanticEffects(
    result.optedIn,
    'automatic-backfill-start',
    'SP05_OPTED_IN',
  );
  assertBackfillEvidence(result.optedIn.backfill, false);
  assertBackfillConsentForwarded(result.optedIn, true);
  assertExplicitVerificationRequired(
    result.optedIn.pendingQuery,
    result.optedIn.pendingQueryEffects,
    'SP05_OPTED_IN_PENDING',
  );
  assertExplicitVerificationRequired(
    result.optedIn.alignedUnverifiedQuery,
    result.optedIn.alignedUnverifiedQueryEffects,
    'SP05_OPTED_IN_ALIGNED_UNVERIFIED',
  );
  assertReadyThenQuery(result.optedIn);

  assertBackfillEvidence(result.recovery.interruption, true);
  assertBackfillEvidence(result.recovery.resumed, false);
  assert.strictEqual(
    result.recovery.readiness.state,
    'Aligned',
    'SP05_RECOVERY_READINESS_NOT_ALIGNED',
  );
  assertMissingConsentControls(result.missingConsent);
  assertReadinessDiagnostics(result.readinessDiagnostics);
}

function assertConsentAndReadinessControls(result) {
  const failures = [];
  for (const [label, assertion] of [
    ['missing-consent', () => assertMissingConsentControls(result.missingConsent)],
    ['no-opt-in-pending-query', () => assertExplicitVerificationRequired(
      result.noOptIn.pendingQuery,
      result.noOptIn.pendingQueryEffects,
      'SP05_NO_OPT_IN_PENDING',
    )],
    ['no-opt-in-aligned-query', () => assertExplicitVerificationRequired(
      result.noOptIn.alignedUnverifiedQuery,
      result.noOptIn.alignedUnverifiedQueryEffects,
      'SP05_NO_OPT_IN_ALIGNED_UNVERIFIED',
    )],
    ['opted-in-pending-query', () => assertExplicitVerificationRequired(
      result.optedIn.pendingQuery,
      result.optedIn.pendingQueryEffects,
      'SP05_OPTED_IN_PENDING',
    )],
    ['opted-in-aligned-query', () => assertExplicitVerificationRequired(
      result.optedIn.alignedUnverifiedQuery,
      result.optedIn.alignedUnverifiedQueryEffects,
      'SP05_OPTED_IN_ALIGNED_UNVERIFIED',
    )],
    ['readiness-diagnostics', () => assertReadinessDiagnostics(result.readinessDiagnostics)],
  ]) {
    try {
      assertion();
    } catch (error) {
      failures.push(`${label}: ${error.message}`);
    }
  }
  assert.deepStrictEqual(
    failures,
    [],
    `SP05_CONSENT_AND_READINESS_CONTROLS_FAILED\n${failures.join('\n')}`,
  );
}

function assertRejectedAutomaticBackfillControls(result) {
  assert.deepStrictEqual(
    result.rejectedOptIns.map(item => item.configurationCase),
    ['missing', 'unsafe', 'unapproved'],
    'SP05_OPTED_IN_CONFIGURATION_CONTROL_MATRIX_INCOMPLETE',
  );
  for (const item of result.rejectedOptIns) {
    assert.deepStrictEqual(
      item.preRejectionSnapshot,
      item.postRejectionSnapshot,
      `SP05_${item.configurationCase.toUpperCase()}_POST_REJECTION_ENVELOPE_CHANGED`,
    );
    assert.deepStrictEqual(
      item.postRejectionSnapshot.document,
      JSON.parse(result.canonicalBefore),
      `SP05_${item.configurationCase.toUpperCase()}_SNAPSHOT_CHANGED`,
    );
    assertExactFullSnapshotEnvelope(
      item.postRejectionSnapshot,
      `SP05_${item.configurationCase.toUpperCase()}_POST_REJECTION`,
    );
    assert.strictEqual(item.outcome.status, 'blocked', `SP05_${item.configurationCase.toUpperCase()}_NOT_BLOCKED`);
    assert(
      item.outcome.action && /correct|configure|retry/i.test(item.outcome.action),
      `SP05_${item.configurationCase.toUpperCase()}_ACTIONABLE_GUIDANCE_MISSING`,
    );
    assert(item.outcome.observableError, `SP05_${item.configurationCase.toUpperCase()}_OBSERVABLE_ERROR_MISSING`);
    const serialized = JSON.stringify(item.outcome.observableError);
    assert(!serialized.includes(SECRET_CANARY), `SP05_${item.configurationCase.toUpperCase()}_SECRET_LEAK`);
    assert(!serialized.includes(UNSAFE_SOURCE_CANARY), `SP05_${item.configurationCase.toUpperCase()}_UNSAFE_SOURCE_LEAK`);
    for (const forbidden of [
      'automatic-backfill-start',
      'explicit-backfill-start',
      'provider-call',
      'database-write',
    ]) {
      assert.strictEqual(
        countEvents(item, forbidden),
        0,
        `SP05_${item.configurationCase.toUpperCase()}_${forbidden.toUpperCase()}_SIDE_EFFECT`,
      );
    }
    assert.strictEqual(
      countEvents(item, 'canonical-mutation'),
      0,
      `SP05_${item.configurationCase.toUpperCase()}_CANONICAL_MUTATION_SIDE_EFFECT`,
    );
  }
}

function assertConfigurationBeforeSemanticEffects(outcome, startKind, label) {
  for (const semanticEffect of [startKind, 'provider-call', 'database-write']) {
    assertBefore(
      outcome.observations.events,
      'configuration-validation',
      semanticEffect,
      `${label}_CONFIGURATION_MUST_PRECEDE_${semanticEffect.toUpperCase()}`,
    );
  }
}

function assertMissingConsentControls(result) {
  for (const [label, outcome, observations] of [
    ['DIRECT', result.direct, result.directObservations],
    ['COMMAND', result.command, result.commandObservations],
  ]) {
    assert.strictEqual(outcome.status, 'blocked', `SP05_${label}_MISSING_CONSENT_NOT_BLOCKED`);
    assert.strictEqual(
      outcome.category,
      'SEMANTIC_BACKFILL_OPT_IN_REQUIRED',
      `SP05_${label}_MISSING_CONSENT_CATEGORY_CHANGED`,
    );
    const portCall = observations.events.find(event => event.kind === 'backfill-port-call');
    assert(portCall, `SP05_${label}_MISSING_CONSENT_NOT_FORWARDED_TO_WP1`);
    assert.notStrictEqual(
      portCall.explicitOptIn,
      true,
      `SP05_${label}_MISSING_CONSENT_PROMOTED_TO_TRUE`,
    );
    for (const forbidden of [
      'automatic-backfill-start',
      'explicit-backfill-start',
      'provider-call',
      'database-write',
    ]) {
      assert.strictEqual(
        observations.events.filter(event => event.kind === forbidden).length,
        0,
        `SP05_${label}_MISSING_CONSENT_${forbidden.toUpperCase()}_SIDE_EFFECT`,
      );
    }
  }
}

function assertReadinessDiagnostics(result) {
  assert.strictEqual(result.readiness.status, 'blocked', 'SP05_READINESS_DIAGNOSTIC_NOT_BLOCKED');
  for (const field of [
    'state',
    'canonicalVersion',
    'contentVersion',
    'indexVersion',
    'completedChannels',
    'missingChannels',
    'mismatchedChannels',
    'fullSnapshotFallback',
  ]) {
    assert.deepStrictEqual(
      result.readiness[field],
      result.expected[field],
      `SP05_READINESS_DIAGNOSTIC_${field.toUpperCase()}_CHANGED`,
    );
  }
  assert.strictEqual(
    result.observations.events.filter(event => event.kind === 'semantic-readiness-read').length,
    1,
    'SP05_READINESS_DIAGNOSTIC_READ_COUNT_CHANGED',
  );
  assert.strictEqual(
    result.observations.events.filter(event => event.kind === 'semantic-query-attempt').length,
    0,
    'SP05_READINESS_DIAGNOSTIC_QUERY_EFFECT',
  );
}

function assertJourneySurface(journey) {
  for (const method of [
    'startNewProject',
    'runExplicitBackfill',
    'verifyReadiness',
    'query',
    'readFullSnapshot',
  ]) {
    assert.strictEqual(
      typeof (journey && journey[method]),
      'function',
      `SP05_OPERATOR_METHOD_MISSING:${method}`,
    );
  }
}

function assertSnapshotPreserved(outcome, label) {
  assert.deepStrictEqual(outcome.initialSnapshot, outcome.finalSnapshot, `${label}_FULL_SNAPSHOT_CHANGED`);
  assertExactFullSnapshotEnvelope(outcome.initialSnapshot, label);
}

function assertExactFullSnapshotEnvelope(snapshot, label) {
  assert.deepStrictEqual(
    Object.keys(snapshot).sort(),
    ['document', 'graphPath', 'status'],
    `${label}_FULL_SNAPSHOT_ENVELOPE_CHANGED`,
  );
  assert.strictEqual(snapshot.status, 'passed', `${label}_FULL_SNAPSHOT_FAILED`);
  assert.strictEqual(snapshot.graphPath, 'design/KG/SystemArchitecture.json', `${label}_GRAPH_PATH_CHANGED`);
  assert(snapshot.document && Array.isArray(snapshot.document.elements), `${label}_ELEMENTS_MISSING`);
  assert(snapshot.document && Array.isArray(snapshot.document.relationships), `${label}_RELATIONSHIPS_MISSING`);
  assert(snapshot.document && Array.isArray(snapshot.document.views), `${label}_VIEWS_MISSING`);
}

function assertActionablePending(start) {
  assert(start.actions && start.actions.backfillCommand, 'SP05_PENDING_BACKFILL_COMMAND_MISSING');
  assert(start.actions && start.actions.readinessCommand, 'SP05_PENDING_READINESS_COMMAND_MISSING');
  assert(start.actions && start.actions.queryCommand, 'SP05_PENDING_QUERY_COMMAND_MISSING');
  assert(/backfill/i.test(start.guidance || ''), 'SP05_PENDING_BACKFILL_GUIDANCE_MISSING');
  assert(/readiness/i.test(start.guidance || ''), 'SP05_PENDING_READINESS_GUIDANCE_MISSING');
}

function assertBlockedPendingQuery(outcome, label) {
  assert.strictEqual(outcome.status, 'blocked', `${label}_PRE_READY_QUERY_NOT_BLOCKED`);
  assert.strictEqual(
    outcome.category,
    'SEMANTIC_READINESS_VERIFICATION_REQUIRED',
    `${label}_PRE_READY_QUERY_CATEGORY_INVALID`,
  );
  assert.strictEqual(outcome.fullSnapshotFallback, false, `${label}_SILENT_SNAPSHOT_FALLBACK`);
}

function assertExplicitVerificationRequired(outcome, effects, label) {
  assert.strictEqual(outcome.status, 'blocked', `${label}_QUERY_NOT_BLOCKED`);
  assert.strictEqual(
    outcome.category,
    'SEMANTIC_READINESS_VERIFICATION_REQUIRED',
    `${label}_QUERY_CATEGORY_CHANGED`,
  );
  assert.strictEqual(outcome.fullSnapshotFallback, false, `${label}_SILENT_SNAPSHOT_FALLBACK`);
  for (const forbidden of [
    'semantic-readiness-read',
    'semantic-query-attempt',
    'provider-call',
    'database-write',
  ]) {
    assert.strictEqual(
      effects.filter(event => event.kind === forbidden).length,
      0,
      `${label}_${forbidden.toUpperCase()}_IMPLICIT_EFFECT`,
    );
  }
}

function assertBackfillConsentForwarded(outcome, automatic) {
  const portCall = outcome.observations.events.find(event => (
    event.kind === 'backfill-port-call' && event.automatic === automatic
  ));
  assert(portCall, 'SP05_BACKFILL_PORT_CALL_MISSING');
  assert.strictEqual(portCall.explicitOptIn, true, 'SP05_BACKFILL_CONSENT_NOT_FORWARDED');
}

function assertBackfillEvidence(outcome, interrupted) {
  if (interrupted) {
    assert.strictEqual(outcome.status, 'blocked', 'SP05_CONTROLLED_BACKFILL_FAILURE_NOT_SURFACED');
    assert(outcome.progress && outcome.progress.completed > 0, 'SP05_BACKFILL_PROGRESS_MISSING');
    assert(outcome.checkpoint && outcome.checkpoint.channel, 'SP05_BACKFILL_CHECKPOINT_MISSING');
    assert(Array.isArray(outcome.failedRecords) && outcome.failedRecords.length > 0, 'SP05_BACKFILL_FAILURE_RECORD_MISSING');
    assert(outcome.resume && /resume/i.test(JSON.stringify(outcome.resume)), 'SP05_BACKFILL_RESUME_GUIDANCE_MISSING');
    return;
  }
  assert.strictEqual(outcome.status, 'completed', 'SP05_BACKFILL_NOT_COMPLETED');
  assert(outcome.progress && outcome.progress.completed === outcome.progress.total, 'SP05_BACKFILL_PROGRESS_INCOMPLETE');
  assert(outcome.checkpoint && outcome.checkpoint.channel === 'View', 'SP05_FINAL_CHECKPOINT_MISSING');
  assert.strictEqual(outcome.alignment, 'Aligned', 'SP05_BACKFILL_ALIGNMENT_MISSING');
}

function assertReadyThenQuery(outcome) {
  assert.strictEqual(outcome.readiness.state, 'Aligned', 'SP05_READINESS_NOT_ALIGNED');
  assert.strictEqual(outcome.readiness.verified, true, 'SP05_READINESS_NOT_EXPLICITLY_VERIFIED');
  assert.strictEqual(outcome.query.readinessVerified, true, 'SP05_QUERY_WITHOUT_READINESS_EVIDENCE');
  assertBefore(
    outcome.observations.events,
    'semantic-readiness-read',
    'semantic-query-attempt',
    'SP05_READINESS_MUST_PRECEDE_QUERY',
  );
}

function assertBefore(events, first, second, category) {
  const firstIndex = events.findIndex(event => event.kind === first);
  const secondIndex = events.findIndex(event => event.kind === second);
  assert(firstIndex >= 0 && secondIndex > firstIndex, category);
}

function countEvents(outcome, kind) {
  return outcome.observations.events.filter(event => event.kind === kind).length;
}

function semanticQuery() {
  return {
    purpose: 'implementation-design',
    intent: 'Find the operator journey after semantic readiness is verified',
  };
}

function readinessRecord(state) {
  const aligned = state === 'Aligned';
  return deepFreeze({
    state,
    verified: aligned,
    canonicalVersion: 'canonical:fresh-project-v1',
    contentVersion: aligned ? 'content:fresh-project-v1' : null,
    indexVersion: aligned ? 'index:fresh-project-v1' : null,
    completedChannels: aligned
      ? ['Element', 'ArchitectureRelationship', 'View']
      : [],
    missingChannels: aligned ? [] : ['Element', 'ArchitectureRelationship', 'View'],
    mismatchedChannels: [],
    fullSnapshotFallback: false,
  });
}

async function captureBlocked(operation) {
  try {
    return await operation();
  } catch (error) {
    return deepFreeze({
      status: 'blocked',
      category: error && error.category ? error.category : error && error.message,
      state: error && error.state,
      canonicalVersion: error && error.canonicalVersion,
      contentVersion: error && error.contentVersion,
      indexVersion: error && error.indexVersion,
      completedChannels: error && error.completedChannels,
      missingChannels: error && error.missingChannels,
      mismatchedChannels: error && error.mismatchedChannels,
      fullSnapshotFallback: error && error.fullSnapshotFallback,
      action: error && error.action
        ? error.action
        : 'Inspect progress and checkpoint evidence, correct configuration if required, then retry or resume.',
      progress: error && error.progress,
      checkpoint: error && error.checkpoint,
      failedRecords: error && error.failedRecords,
      resume: error && error.resume,
      observableError: serializeObservableError(error),
    });
  }
}

function serializeObservableError(error) {
  return serializeObservableValue(error, new WeakSet());
}

function serializeObservableValue(value, seen) {
  if (value === null || value === undefined || typeof value !== 'object') return value;
  if (seen.has(value)) return '[Circular]';
  seen.add(value);
  if (Array.isArray(value)) {
    return value.map(item => serializeObservableValue(item, seen));
  }
  const observed = {};
  for (const key of Object.getOwnPropertyNames(value)) {
    observed[key] = serializeObservableValue(value[key], seen);
  }
  return observed;
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}

module.exports = {
  APPROVED_CONFIGURATION,
  assertNewProjectSemanticOperatorJourney,
  assertRejectedAutomaticBackfillControls,
  runNewProjectSemanticOperatorJourney,
};

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
    exerciseInterruptedResume: true,
  });
  const optedIn = await runSuccessfulJourney({
    createJourney,
    runCommand,
    automaticBackfillOptIn: true,
    configurationCase: 'approved',
    exerciseInterruptedResume: false,
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
  exerciseInterruptedResume,
}) {
  const fixture = createRecordingComposition({
    configurationCase,
    interruptFirstBackfill: exerciseInterruptedResume,
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
  const pendingQuery = await captureBlocked(() => runCommand({
    command: 'query',
    options: semanticQuery(),
    journey,
  }));

  let interruption;
  let backfill;
  if (!automaticBackfillOptIn) {
    interruption = await captureBlocked(() => runCommand({
      command: 'backfill',
      options: { explicitOptIn: true },
      journey,
    }));
    if (exerciseInterruptedResume) {
      backfill = await runCommand({
        command: 'backfill',
        options: { explicitOptIn: true, resume: true },
        journey,
      });
    } else {
      backfill = interruption;
    }
  } else {
    backfill = start.backfill;
  }

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
    configurationFingerprint: fixture.configurationFingerprint,
    initialSnapshot,
    start,
    pendingQuery,
    interruption,
    backfill,
    readiness,
    query,
    finalSnapshot,
    observations: fixture.snapshot(),
  });
}

async function runRejectedOptIn({ createJourney, runCommand, configurationCase }) {
  const fixture = createRecordingComposition({ configurationCase });
  const journey = createJourney(fixture.dependencies);
  assertJourneySurface(journey);
  const snapshot = await runCommand({ command: 'snapshot', journey });
  const outcome = await captureBlocked(() => runCommand({
    command: 'init',
    options: { automaticBackfillOptIn: true },
    journey,
  }));
  return deepFreeze({
    configurationCase,
    snapshot,
    outcome,
    observations: fixture.snapshot(),
  });
}

function createRecordingComposition({
  configurationCase,
  interruptFirstBackfill = false,
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
      const error = new Error(`${categories[configurationCase]}: correct approved external configuration and retry`);
      error.category = categories[configurationCase];
      error.action = 'Correct approved external configuration and retry argo semantic init';
      error.secret = SECRET_CANARY;
      error.unsafeSource = UNSAFE_SOURCE_CANARY;
      throw error;
    },
    async runSemanticBackfill(input = {}) {
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
      readiness = readinessRecord('Aligned');
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
  assertBackfillEvidence(result.noOptIn.interruption, true);
  assertBackfillEvidence(result.noOptIn.backfill, false);
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
  assertBackfillEvidence(result.optedIn.backfill, false);
  assertReadyThenQuery(result.optedIn);
}

function assertRejectedAutomaticBackfillControls(result) {
  assert.deepStrictEqual(
    result.rejectedOptIns.map(item => item.configurationCase),
    ['missing', 'unsafe', 'unapproved'],
    'SP05_OPTED_IN_CONFIGURATION_CONTROL_MATRIX_INCOMPLETE',
  );
  for (const item of result.rejectedOptIns) {
    assert.deepStrictEqual(
      item.snapshot.document,
      JSON.parse(result.canonicalBefore),
      `SP05_${item.configurationCase.toUpperCase()}_SNAPSHOT_CHANGED`,
    );
    assert.strictEqual(item.outcome.status, 'blocked', `SP05_${item.configurationCase.toUpperCase()}_NOT_BLOCKED`);
    assert(
      item.outcome.action && /correct|configure|retry/i.test(item.outcome.action),
      `SP05_${item.configurationCase.toUpperCase()}_ACTIONABLE_GUIDANCE_MISSING`,
    );
    const serialized = JSON.stringify(item);
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
  }
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
  assert.strictEqual(outcome.initialSnapshot.status, 'passed', `${label}_FULL_SNAPSHOT_FAILED`);
  assert.strictEqual(
    Object.prototype.hasOwnProperty.call(outcome.initialSnapshot, 'query'),
    false,
    `${label}_NO_ARGUMENT_QUERY_METADATA_ADDED`,
  );
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
  assert(
    ['SEMANTIC_INDEX_NOT_ALIGNED', 'SemanticIndexPending'].includes(outcome.category),
    `${label}_PRE_READY_QUERY_CATEGORY_INVALID`,
  );
  assert.strictEqual(outcome.fullSnapshotFallback, false, `${label}_SILENT_SNAPSHOT_FALLBACK`);
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
  return deepFreeze({
    state,
    verified: state === 'Aligned',
    canonicalVersion: 'canonical:fresh-project-v1',
    contentVersion: state === 'Aligned' ? 'content:fresh-project-v1' : null,
    indexVersion: state === 'Aligned' ? 'index:fresh-project-v1' : null,
    channels: state === 'Aligned'
      ? ['Element', 'ArchitectureRelationship', 'View']
      : [],
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
      fullSnapshotFallback: error && error.fullSnapshotFallback,
      action: error && error.action
        ? error.action
        : 'Inspect progress and checkpoint evidence, correct configuration if required, then retry or resume.',
      progress: error && error.progress,
      checkpoint: error && error.checkpoint,
      failedRecords: error && error.failedRecords,
      resume: error && error.resume,
    });
  }
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

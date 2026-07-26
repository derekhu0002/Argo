const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const fixturePath = path.join(
  repoRoot,
  'tests',
  'fixtures',
  'productionSemanticOperatorCliProcess.js',
);
const cliPath = path.join(repoRoot, '.argo', 'scripts', 'semanticOperatorJourneyCli.js');
const attestationRelativePath = path.join(
  '.argo',
  'temp',
  'semantic-readiness-attestation.json',
);
const SECRET_CANARY = 'SP05-ADAPTER-SECRET-MUST-NOT-LEAK';
const UNSAFE_SOURCE_CANARY = 'SP05-ADAPTER-UNSAFE-SOURCE-MUST-NOT-LEAK';

const VERSION_ONE_READINESS = Object.freeze({
  state: 'Aligned',
  verified: true,
  canonicalVersion: 'canonical:adapter-v1',
  contentVersion: 'content:adapter-v1',
  indexVersion: 'index:adapter-v1',
  completedChannels: ['Element', 'ArchitectureRelationship', 'View'],
  missingChannels: [],
  mismatchedChannels: [],
  fullSnapshotFallback: false,
});
const VERSION_TWO_READINESS = Object.freeze({
  state: 'Aligned',
  verified: true,
  canonicalVersion: 'canonical:adapter-v2',
  contentVersion: 'content:adapter-v2',
  indexVersion: 'index:adapter-v2',
  completedChannels: ['Element', 'ArchitectureRelationship', 'View'],
  missingChannels: [],
  mismatchedChannels: [],
  fullSnapshotFallback: false,
});

async function runProductionSemanticOperatorAdapterLifecycle() {
  const roots = [];
  try {
    const successful = createProcessWorkspace(roots, VERSION_ONE_READINESS);
    const readiness = spawnFixture(successful, ['readiness']);
    const attestationAfterReadiness = readAttestation(successful);
    const query = spawnFixture(successful, [
      'query',
      '--request-json',
      JSON.stringify(semanticQuery()),
    ]);

    const missing = createProcessWorkspace(roots, VERSION_ONE_READINESS);
    const queryWithoutReadiness = spawnFixture(missing, [
      'query',
      '--request-json',
      JSON.stringify(semanticQuery()),
    ]);

    const initialized = createProcessWorkspace(roots, VERSION_ONE_READINESS);
    const readinessBeforeInit = spawnFixture(initialized, ['readiness']);
    const init = spawnFixture(initialized, ['init']);
    const queryAfterInit = spawnFixture(initialized, [
      'query',
      '--request-json',
      JSON.stringify(semanticQuery()),
    ]);

    const backfilled = createProcessWorkspace(roots, VERSION_ONE_READINESS);
    const readinessBeforeBackfill = spawnFixture(backfilled, ['readiness']);
    const backfill = spawnFixture(backfilled, ['backfill', '--explicit-opt-in']);
    const queryAfterBackfill = spawnFixture(backfilled, [
      'query',
      '--request-json',
      JSON.stringify(semanticQuery()),
    ]);

    const stale = createProcessWorkspace(roots, VERSION_ONE_READINESS);
    const readinessBeforeVersionChange = spawnFixture(stale, ['readiness']);
    writeReadiness(stale, VERSION_TWO_READINESS);
    const queryAfterVersionChange = spawnFixture(stale, [
      'query',
      '--request-json',
      JSON.stringify(semanticQuery()),
    ]);

    const packageBackfill = spawnPackageBackfillWithoutConsent();
    const mcp = await exerciseMcpAdapterPaths();

    return freeze({
      cli: {
        successful: {
          readiness,
          query,
          attestationAfterReadiness,
          state: readFixtureState(successful),
        },
        missing: {
          query: queryWithoutReadiness,
          state: readFixtureState(missing),
        },
        initialized: {
          readiness: readinessBeforeInit,
          init,
          query: queryAfterInit,
          state: readFixtureState(initialized),
        },
        backfilled: {
          readiness: readinessBeforeBackfill,
          backfill,
          query: queryAfterBackfill,
          state: readFixtureState(backfilled),
        },
        stale: {
          readiness: readinessBeforeVersionChange,
          query: queryAfterVersionChange,
          expectedCurrentReadiness: VERSION_TWO_READINESS,
          state: readFixtureState(stale),
        },
      },
      packageBackfill,
      mcp,
    });
  } finally {
    for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
  }
}

function assertProductionSemanticOperatorAdapterLifecycle(result) {
  const failures = [];
  for (const [scope, assertion] of [
    ['cli-process-lifecycle', () => assertCliProcessLifecycle(result.cli)],
    ['package-consent', () => assertPackageConsent(result.packageBackfill)],
    ['mcp-semantic-dispatch', () => assertMcpSemanticDispatch(result.mcp)],
    ['mcp-snapshot-bypasses', () => assertMcpSnapshotBypasses(result.mcp)],
    ['mcp-wire-errors', () => assertMcpWireErrors(result.mcp)],
  ]) {
    try {
      assertion();
    } catch (error) {
      failures.push(`${scope}: ${error.message}`);
    }
  }
  assert.deepStrictEqual(
    failures,
    [],
    `SP05_ADAPTER_LIFECYCLE_CONTROLS_FAILED\n${failures.join('\n')}`,
  );
}

function assertCliProcessLifecycle(cli) {
  assertProcessPassed(cli.successful.readiness, 'SP05_CLI_READINESS_PROCESS_FAILED');
  assertProcessPassed(cli.successful.query, 'SP05_CLI_QUERY_PROCESS_FAILED');
  assert.strictEqual(
    cli.successful.query.output.status,
    'passed',
    'SP05_CLI_CROSS_PROCESS_QUERY_NOT_AUTHORIZED',
  );
  assertEventCounts(cli.successful.state.events, {
    'readiness-read': 2,
    'semantic-query': 1,
  }, 'SP05_CLI_CROSS_PROCESS');
  const attestation = cli.successful.attestationAfterReadiness;
  assert(attestation, 'SP05_CLI_READINESS_ATTESTATION_MISSING');
  assert.deepStrictEqual(
    Object.keys(attestation).sort(),
    [
      'canonicalDigest',
      'canonicalVersion',
      'completedChannels',
      'contentVersion',
      'fullSnapshotFallback',
      'graphPath',
      'indexVersion',
      'integrityDigest',
      'mismatchedChannels',
      'missingChannels',
      'schemaVersion',
      'verified',
    ].sort(),
    'SP05_CLI_ATTESTATION_ENVELOPE_CHANGED',
  );
  assert.strictEqual(attestation.verified, true, 'SP05_CLI_ATTESTATION_NOT_VERIFIED');
  const serializedAttestation = JSON.stringify(attestation);
  assert(!serializedAttestation.includes(SECRET_CANARY), 'SP05_CLI_ATTESTATION_SECRET_LEAK');
  assert(
    !serializedAttestation.includes(UNSAFE_SOURCE_CANARY),
    'SP05_CLI_ATTESTATION_UNSAFE_SOURCE_LEAK',
  );
  assert(
    !/password|credential|token|secret|api[_-]?key/i.test(serializedAttestation),
    'SP05_CLI_ATTESTATION_CONTAINS_SECRET_FIELD',
  );

  assertStructuredProcessError(
    cli.missing.query,
    'SEMANTIC_READINESS_VERIFICATION_REQUIRED',
    'SP05_CLI_QUERY_WITHOUT_READINESS',
  );
  assertNoEvents(
    cli.missing.state.events,
    ['readiness-read', 'semantic-query'],
    'SP05_CLI_QUERY_WITHOUT_READINESS',
  );

  assertProcessPassed(cli.initialized.readiness, 'SP05_CLI_PRE_INIT_READINESS_FAILED');
  assertProcessPassed(cli.initialized.init, 'SP05_CLI_INIT_PROCESS_FAILED');
  assertStructuredProcessError(
    cli.initialized.query,
    'SEMANTIC_READINESS_VERIFICATION_REQUIRED',
    'SP05_CLI_QUERY_AFTER_INIT',
  );
  assertEventCounts(cli.initialized.state.events, {
    'readiness-read': 1,
    'semantic-query': 0,
  }, 'SP05_CLI_QUERY_AFTER_INIT');

  assertProcessPassed(cli.backfilled.readiness, 'SP05_CLI_PRE_BACKFILL_READINESS_FAILED');
  assertProcessPassed(cli.backfilled.backfill, 'SP05_CLI_BACKFILL_PROCESS_FAILED');
  assertStructuredProcessError(
    cli.backfilled.query,
    'SEMANTIC_READINESS_VERIFICATION_REQUIRED',
    'SP05_CLI_QUERY_AFTER_BACKFILL',
  );
  assertEventCounts(cli.backfilled.state.events, {
    'readiness-read': 1,
    'semantic-query': 0,
  }, 'SP05_CLI_QUERY_AFTER_BACKFILL');

  assertProcessPassed(cli.stale.readiness, 'SP05_CLI_PRE_VERSION_CHANGE_READINESS_FAILED');
  assertStructuredProcessError(
    cli.stale.query,
    'SEMANTIC_READINESS_ATTESTATION_STALE',
    'SP05_CLI_STALE_ATTESTATION',
  );
  for (const field of [
    'canonicalVersion',
    'contentVersion',
    'indexVersion',
    'completedChannels',
    'missingChannels',
    'mismatchedChannels',
    'fullSnapshotFallback',
  ]) {
    assert.deepStrictEqual(
      cli.stale.query.output.error[field],
      cli.stale.expectedCurrentReadiness[field],
      `SP05_CLI_STALE_DIAGNOSTIC_${field.toUpperCase()}_CHANGED`,
    );
  }
  assertEventCounts(cli.stale.state.events, {
    'readiness-read': 2,
    'semantic-query': 0,
  }, 'SP05_CLI_STALE_ATTESTATION');
}

function assertPackageConsent(outcome) {
  assert(
    outcome.commandLine.includes('semanticOperatorJourneyCli.js backfill'),
    'SP05_PACKAGE_BACKFILL_COMMAND_NOT_EXECUTED',
  );
  assert(
    !outcome.commandLine.includes('--explicit-opt-in'),
    'SP05_PACKAGE_BACKFILL_FORGES_EXPLICIT_CONSENT',
  );
}

function assertMcpSemanticDispatch(mcp) {
  for (const [label, outcome] of [
    ['SYSTEM', mcp.system],
    ['UNIFIED', mcp.unified],
  ]) {
    assert.deepStrictEqual(
      outcome.events,
      ['operator-query'],
      `SP05_${label}_SEMANTIC_QUERY_BYPASSES_OPERATOR`,
    );
    assert.strictEqual(
      outcome.error && outcome.error.category,
      'SEMANTIC_READINESS_VERIFICATION_REQUIRED',
      `SP05_${label}_SEMANTIC_QUERY_NOT_FAIL_CLOSED`,
    );
  }
}

function assertMcpSnapshotBypasses(mcp) {
  const canonicalDocument = JSON.parse(fs.readFileSync(
    path.join(repoRoot, 'design', 'KG', 'SystemArchitecture.json'),
    'utf8',
  ));
  assert.deepStrictEqual(mcp.systemSnapshot.events, [], 'SP05_SYSTEM_SNAPSHOT_USED_OPERATOR');
  assert.deepStrictEqual(mcp.unifiedSnapshot.events, [], 'SP05_UNIFIED_SNAPSHOT_USED_OPERATOR');
  assert.deepStrictEqual(mcp.systemGraphTidy.events, [], 'SP05_SYSTEM_GRAPH_TIDY_USED_OPERATOR');
  assert.deepStrictEqual(mcp.unifiedGraphTidy.events, [], 'SP05_UNIFIED_GRAPH_TIDY_USED_OPERATOR');
  for (const [label, outcome] of [
    ['SYSTEM_SNAPSHOT', mcp.systemSnapshot],
    ['UNIFIED_SNAPSHOT', mcp.unifiedSnapshot],
    ['SYSTEM_GRAPH_TIDY', mcp.systemGraphTidy],
    ['UNIFIED_GRAPH_TIDY', mcp.unifiedGraphTidy],
  ]) {
    assert.deepStrictEqual(
      outcome.result.document,
      canonicalDocument,
      `SP05_${label}_CANONICAL_SNAPSHOT_CHANGED`,
    );
  }
}

function assertMcpWireErrors(mcp) {
  for (const [label, wire] of [
    ['SYSTEM', mcp.systemWire],
    ['UNIFIED', mcp.unifiedWire],
  ]) {
    assert.strictEqual(wire.available, true, `SP05_${label}_WIRE_HANDLER_NOT_EXPOSED`);
    assert.strictEqual(wire.result.isError, true, `SP05_${label}_WIRE_ERROR_FLAG_MISSING`);
    const errorPayload = JSON.parse(wire.result.content[0].text);
    assert.strictEqual(
      errorPayload.error.category,
      'SEMANTIC_INDEX_NOT_ALIGNED',
      `SP05_${label}_WIRE_ERROR_CATEGORY_CHANGED`,
    );
    assert.deepStrictEqual(
      errorPayload.error.canonicalVersion,
      'canonical:wire-v1',
      `SP05_${label}_WIRE_CANONICAL_VERSION_DROPPED`,
    );
    assert.deepStrictEqual(
      errorPayload.error.missingChannels,
      ['View'],
      `SP05_${label}_WIRE_CHANNEL_DIAGNOSTICS_DROPPED`,
    );
    const serialized = JSON.stringify(wire.result);
    assert(!serialized.includes(SECRET_CANARY), `SP05_${label}_WIRE_SECRET_LEAK`);
    assert(!serialized.includes(UNSAFE_SOURCE_CANARY), `SP05_${label}_WIRE_UNSAFE_SOURCE_LEAK`);
    assert(!serialized.includes('\n    at '), `SP05_${label}_WIRE_STACK_LEAK`);
  }
}

async function exerciseMcpAdapterPaths() {
  const system = require('../../.argo/scripts/systemarchitecture-mcp-server.js');
  const unified = require('../../.argo/scripts/argo-mcp-server.js');
  const systemOutcome = await captureAdapterQuery(system.callTool, false);
  const unifiedOutcome = await captureAdapterQuery(unified.callTool, true);
  const systemSnapshot = await captureBypass(system.callTool, false, {});
  const unifiedSnapshot = await captureBypass(unified.callTool, true, {});
  const graphTidyArgs = { query: { purpose: 'graph-tidy', intent: 'preserve full snapshot' } };
  const systemGraphTidy = await captureBypass(system.callTool, false, graphTidyArgs);
  const unifiedGraphTidy = await captureBypass(unified.callTool, true, graphTidyArgs);
  const systemWire = await captureWire(system.handleRequest);
  const unifiedWire = await captureWire(unified.handleRequest);
  return {
    system: systemOutcome,
    unified: unifiedOutcome,
    systemSnapshot,
    unifiedSnapshot,
    systemGraphTidy,
    unifiedGraphTidy,
    systemWire,
    unifiedWire,
  };
}

async function captureAdapterQuery(callTool, unified) {
  const events = [];
  const dependencies = adapterDependencies(events);
  try {
    if (unified) {
      await callTool('getSystemArchitecture', { query: semanticQuery() }, null, dependencies);
    } else {
      await callTool('getSystemArchitecture', { query: semanticQuery() }, dependencies);
    }
    return { events };
  } catch (error) {
    return { events, error: observableError(error) };
  }
}

async function captureBypass(callTool, unified, args) {
  const events = [];
  const dependencies = adapterDependencies(events);
  const result = unified
    ? await callTool('getSystemArchitecture', args, null, dependencies)
    : await callTool('getSystemArchitecture', args, dependencies);
  return { events, result };
}

async function captureWire(handleRequest) {
  if (typeof handleRequest !== 'function') return { available: false };
  const events = [];
  const response = await handleRequest({
    jsonrpc: '2.0',
    id: 7,
    method: 'tools/call',
    params: {
      name: 'getSystemArchitecture',
      arguments: { query: semanticQuery() },
    },
  }, adapterDependencies(events, true));
  return { available: true, events, result: response.result };
}

function adapterDependencies(events, wire = false) {
  return {
    semanticOperatorJourney: {
      async query() {
        events.push('operator-query');
        const error = new Error('safe readiness rejection');
        error.category = wire
          ? 'SEMANTIC_INDEX_NOT_ALIGNED'
          : 'SEMANTIC_READINESS_VERIFICATION_REQUIRED';
        error.state = wire ? 'SemanticIndexPending' : undefined;
        error.canonicalVersion = wire ? 'canonical:wire-v1' : undefined;
        error.contentVersion = wire ? 'content:wire-v1' : undefined;
        error.indexVersion = wire ? 'index:wire-v1' : undefined;
        error.completedChannels = wire ? ['Element', 'ArchitectureRelationship'] : undefined;
        error.missingChannels = wire ? ['View'] : undefined;
        error.mismatchedChannels = [];
        error.fullSnapshotFallback = false;
        error.secret = SECRET_CANARY;
        error.unsafeSource = UNSAFE_SOURCE_CANARY;
        throw error;
      },
    },
    semanticRetrievalBoundary: {
      async retrieve() {
        events.push('direct-retrieval');
        return { elements: [], relationships: [], views: [] };
      },
    },
  };
}

function createProcessWorkspace(roots, readiness) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'argo-sp05-adapter-'));
  roots.push(root);
  const graphDirectory = path.join(root, 'design', 'KG');
  fs.mkdirSync(graphDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(graphDirectory, 'SystemArchitecture.json'),
    JSON.stringify({ elements: [], relationships: [], views: [] }),
  );
  const statePath = path.join(root, 'fixture-state.json');
  fs.writeFileSync(statePath, JSON.stringify({ readiness, events: [] }, null, 2));
  return { root, statePath };
}

function spawnFixture(workspace, args) {
  const execution = spawnSync(
    process.execPath,
    [fixturePath, ...args],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        SP05_OPERATOR_WORKSPACE_ROOT: workspace.root,
        SP05_OPERATOR_STATE_PATH: workspace.statePath,
      },
      windowsHide: true,
    },
  );
  return freeze({
    status: execution.status,
    stdout: execution.stdout,
    stderr: execution.stderr,
    output: parseWireOutput(execution.stdout, execution.stderr),
  });
}

function spawnPackageBackfillWithoutConsent() {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const execution = spawnSync(
    npmCommand,
    ['run', 'semantic:backfill', '--', '--request-json', '{}'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: safePackageEnvironment(),
      shell: process.platform === 'win32',
      windowsHide: true,
    },
  );
  const combined = `${execution.stdout}\n${execution.stderr}`;
  const commandLine = combined.split(/\r?\n/).find(line => (
    line.includes('semanticOperatorJourneyCli.js backfill')
  )) || '';
  return freeze({
    status: execution.status,
    commandLine,
    stdout: execution.stdout,
    stderr: execution.stderr,
  });
}

function safePackageEnvironment() {
  const environment = {};
  for (const key of ['PATH', 'Path', 'PATHEXT', 'SystemRoot', 'WINDIR']) {
    if (process.env[key] !== undefined) environment[key] = process.env[key];
  }
  environment.ARGO_REPO_ROOT = repoRoot;
  return environment;
}

function writeReadiness(workspace, readiness) {
  const state = readFixtureState(workspace);
  state.readiness = readiness;
  fs.writeFileSync(workspace.statePath, JSON.stringify(state, null, 2));
}

function readFixtureState(workspace) {
  return JSON.parse(fs.readFileSync(workspace.statePath, 'utf8'));
}

function readAttestation(workspace) {
  const filePath = path.join(workspace.root, attestationRelativePath);
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : null;
}

function parseWireOutput(stdout, stderr) {
  for (const source of [stdout, stderr]) {
    const lines = String(source || '').trim().split(/\r?\n/).reverse();
    for (const line of lines) {
      try {
        return JSON.parse(line);
      } catch {
        // Continue to the next line.
      }
    }
  }
  return null;
}

function assertProcessPassed(result, category) {
  assert.strictEqual(result.status, 0, `${category}: ${result.stderr || result.stdout}`);
  assert(result.output, `${category}_OUTPUT_MISSING`);
}

function assertStructuredProcessError(result, category, label) {
  assert.notStrictEqual(result.status, 0, `${label}_UNEXPECTED_SUCCESS`);
  assert(result.output && result.output.error, `${label}_STRUCTURED_ERROR_MISSING`);
  assert.strictEqual(result.output.error.category, category, `${label}_CATEGORY_CHANGED`);
  const serialized = JSON.stringify(result.output);
  assert(!serialized.includes(SECRET_CANARY), `${label}_SECRET_LEAK`);
  assert(!serialized.includes(UNSAFE_SOURCE_CANARY), `${label}_UNSAFE_SOURCE_LEAK`);
  assert(!serialized.includes('\n    at '), `${label}_STACK_LEAK`);
}

function assertNoEvents(events, forbidden, label) {
  for (const kind of forbidden) {
    assert.strictEqual(
      events.filter(event => event.kind === kind).length,
      0,
      `${label}_${kind.toUpperCase()}_EFFECT`,
    );
  }
}

function assertEventCounts(events, expectedCounts, label) {
  for (const [kind, count] of Object.entries(expectedCounts)) {
    assert.strictEqual(
      events.filter(event => event.kind === kind).length,
      count,
      `${label}_${kind.toUpperCase()}_COUNT_CHANGED`,
    );
  }
}

function semanticQuery() {
  return {
    purpose: 'implementation-design',
    intent: 'Verify adapter readiness lifecycle',
  };
}

function observableError(error) {
  const observed = {};
  for (const key of Object.getOwnPropertyNames(error || {})) observed[key] = error[key];
  return observed;
}

function freeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) freeze(nested);
  return Object.freeze(value);
}

module.exports = {
  assertProductionSemanticOperatorAdapterLifecycle,
  runProductionSemanticOperatorAdapterLifecycle,
};

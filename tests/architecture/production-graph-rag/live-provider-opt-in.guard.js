const assert = require('node:assert');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const handoff = readJson('.argo/temp/ImplementationToCodingHandoff.json');
const harnessPath = 'tests/harness/liveEmbeddingProviderHarness.js';
const liveEntryPath = 'tests/explicit/entries/runLiveEmbeddingProviderE2E.js';
const secretEntryPath = 'tests/explicit/entries/runLiveEmbeddingProviderSecretIsolation.js';
const harness = read(harnessPath);
const liveEntry = read(liveEntryPath);
const secretEntry = read(secretEntryPath);

// GIVEN default/offline execution
// WHEN the Harness is inspected
// THEN opt-in blocks before loading production boundaries, touching secret state, or opening Neo4j
const optInCheck = harness.indexOf("requireLiveOptIn('LIVE_PROVIDER_E2E_OPT_IN_REQUIRED')");
const secretPresenceCheck = harness.indexOf('requireProcessSecretPresence();');
const boundaryLoad = harness.indexOf('const createGate = loadLiveGateFactory()');
const neo4jOpen = harness.indexOf("require('neo4j-driver')");
const secretRead = harness.indexOf('process.env.QWEN_KEY');
assert(optInCheck >= 0, 'LIVE_PROVIDER_OPT_IN_GUARD: live opt-in category is missing');
assert(secretPresenceCheck > optInCheck, 'LIVE_PROVIDER_OPT_IN_GUARD: secret preflight occurs before opt-in');
assert(boundaryLoad > secretPresenceCheck, 'LIVE_PROVIDER_OPT_IN_GUARD: production boundary loads before secret preflight');
assert(neo4jOpen > secretPresenceCheck, 'LIVE_PROVIDER_OPT_IN_GUARD: Neo4j opens before secret preflight');
assert(secretRead > optInCheck, 'LIVE_PROVIDER_OPT_IN_GUARD: provider secret is touched before opt-in');
assert(
  harness.includes("process.env[LIVE_OPT_IN] !== '1'"),
  'LIVE_PROVIDER_OPT_IN_GUARD: opt-in must be exact and explicit',
);

// THEN fake/default outcomes cannot satisfy live evidence
for (const requiredAssertion of [
  'TS06_PROVIDER_E2E_REAL_HTTP_CALL_COUNT',
  'TS06_PROVIDER_E2E_EXPLICIT_REQUEST_REQUIRED',
  'TS06_PROVIDER_E2E_TRANSPORT_RESPONSE_NOT_PROPAGATED',
  'TS06_PROVIDER_E2E_VECTOR_REQUIRED',
  'TS06_PROVIDER_E2E_DIMENSION_MISMATCH',
  'TS06_PROVIDER_E2E_NON_FINITE_VECTOR',
  'TS06_PROVIDER_E2E_SUCCESS_WRITE_REQUIRED',
  'TS06_PROVIDER_E2E_PERSISTED_METADATA_MISMATCH',
  'TS06_PROVIDER_E2E_ZERO_WRITE_VIOLATION',
]) {
  assert(liveEntry.includes(requiredAssertion), `LIVE_PROVIDER_OPT_IN_GUARD: live entry omits ${requiredAssertion}`);
}
assert(
  secretEntry.includes('TS07_PROVIDER_SECRET_TRANSPORT_OBSERVATION_REQUIRED'),
  'LIVE_PROVIDER_OPT_IN_GUARD: secret entry can accept fake live evidence',
);
for (const source of [harness, liveEntry, secretEntry]) {
  assert(!/\bskip(?:ped)?\b/i.test(source), 'LIVE_PROVIDER_OPT_IN_GUARD: live evidence may be skipped');
  assert(!source.includes("status: 'passed'"), 'LIVE_PROVIDER_OPT_IN_GUARD: offline path fabricates pass status');
  assert(!source.includes('liveProviderCall'), 'LIVE_PROVIDER_OPT_IN_GUARD: production boolean can claim live evidence');
  assert(!source.includes('executeFailureScenario'), 'LIVE_PROVIDER_OPT_IN_GUARD: scenario-labelled production branch remains');
}
for (const requiredObservation of [
  'createObservedHttpTransport',
  'callCount',
  'origin',
  'path',
  'model',
  'dimensions',
  'vectorFingerprint',
]) {
  assert(harness.includes(requiredObservation), `LIVE_PROVIDER_OPT_IN_GUARD: transport omits ${requiredObservation}`);
}

// THEN both default failure categories are recorded in the handoff and all assets are frozen
for (const [testcaseName, failureReason, entryPath] of [
  ['ExplicitAcceptanceTestcase-TS-06-Provider-E2E', 'LIVE_PROVIDER_E2E_OPT_IN_REQUIRED', liveEntryPath],
  [
    'ExplicitAcceptanceTestcase-TS-07-Provider-Secret-Isolation',
    'LIVE_PROVIDER_SECRET_ISOLATION_OPT_IN_REQUIRED',
    secretEntryPath,
  ],
]) {
  const entry = handoff.explicitEntrypoints.find(candidate => candidate.testcaseName === testcaseName);
  assert(entry, `LIVE_PROVIDER_OPT_IN_GUARD: handoff omits ${testcaseName}`);
  assert.strictEqual(entry.failureReason, failureReason, `LIVE_PROVIDER_OPT_IN_GUARD: stale failure for ${testcaseName}`);
  assert(handoff.frozenFiles.includes(entryPath), `LIVE_PROVIDER_OPT_IN_GUARD: ${entryPath} is not frozen`);
}
assert(handoff.frozenFiles.includes(harnessPath), 'LIVE_PROVIDER_OPT_IN_GUARD: live Harness is not frozen');

// GIVEN explicit opt-in with QWEN_KEY deliberately absent
// WHEN either live entrypoint starts in a minimal child environment
// THEN it fails before production loading, network transport, or Neo4j with a safe category
for (const entryPath of [liveEntryPath, secretEntryPath]) {
  const execution = childProcess.spawnSync(process.execPath, [entryPath], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: {
      ARGO_LIVE_PROVIDER_E2E: '1',
      SystemRoot: process.env.SystemRoot || '',
    },
  });
  assert.strictEqual(execution.status, 1, `LIVE_PROVIDER_OPT_IN_GUARD: ${entryPath} missing-secret status`);
  assert.strictEqual(execution.stdout, '', `LIVE_PROVIDER_OPT_IN_GUARD: ${entryPath} wrote stdout`);
  assert.strictEqual(
    execution.stderr.trim(),
    'QWEN_KEY_REQUIRED',
    `LIVE_PROVIDER_OPT_IN_GUARD: ${entryPath} unsafe missing-secret error`,
  );
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

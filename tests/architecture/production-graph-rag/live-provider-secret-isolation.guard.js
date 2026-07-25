const assert = require('node:assert');
const childProcess = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {
  APPROVED_SOURCE_FIXTURES,
  findSecretLeaks,
  runApprovedSourceFixtureMatrix,
  runNeo4jAuthenticationCanaryProbe,
} = require('../../harness/liveEmbeddingProviderHarness.js');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const envExample = read('.argo/.env.example');
const gitignore = read('.gitignore');
const harness = read('tests/harness/liveEmbeddingProviderHarness.js');
const liveEntry = read('tests/explicit/entries/runLiveEmbeddingProviderE2E.js');
const secretEntry = read('tests/explicit/entries/runLiveEmbeddingProviderSecretIsolation.js');
const syntheticSecret = `synthetic-${crypto.randomUUID()}`;

// GIVEN a synthetic canary that is not a real provider credential
// WHEN the artifact scanner examines every observable channel
// THEN direct, nested, and binary copies are found without printing the canary
for (const fixture of [
  [{ name: 'logs', value: `authorization=${syntheticSecret}` }],
  [{ name: 'errorMessages', value: new Error(syntheticSecret) }],
  [{ name: 'stdout', value: `stdout:${syntheticSecret}` }],
  [{ name: 'stderr', value: `stderr:${syntheticSecret}` }],
  [{ name: 'cypherTextAndParameters', value: { parameters: { note: syntheticSecret } } }],
  [{ name: 'graphEvidence', value: { displayLabel: syntheticSecret } }],
  [{ name: 'snapshot', value: Buffer.from(`snapshot:${syntheticSecret}`) }],
  [{ name: 'latestFailureRecords', value: [{ failureError: syntheticSecret }] }],
  [{ name: 'recursiveArtifact', value: { nested: [{ output: syntheticSecret }] } }],
]) {
  assert.strictEqual(
    findSecretLeaks(syntheticSecret, fixture).length,
    1,
    'LIVE_PROVIDER_SECRET_GUARD: synthetic leak fixture was missed',
  );
}
assert.deepStrictEqual(
  findSecretLeaks(syntheticSecret, [
    { name: 'safe-log', value: 'LIVE_PROVIDER_OPERATION_FAILED' },
    { name: 'safe-cypher', value: { query: 'MATCH (e { runId: $runId }) RETURN e', parameters: { runId: 'safe' } } },
  ]),
  [],
  'LIVE_PROVIDER_SECRET_GUARD: safe artifacts were rejected',
);
// THEN configuration and entrypoint failures cannot persist or print the provider credential
assert(/^QWEN_KEY=\s*$/m.test(envExample), 'LIVE_PROVIDER_SECRET_GUARD: QWEN_KEY placeholder is not empty');
assert(
  /^ARGO_NEO4J_DATABASE_PASSWORD=\s*$/m.test(envExample),
  'LIVE_PROVIDER_SECRET_GUARD: Neo4j password placeholder is not empty',
);
assert(gitignore.split(/\r?\n/).includes('.env'), 'LIVE_PROVIDER_SECRET_GUARD: .env is not ignored');
assert(
  gitignore.split(/\r?\n/).includes('!.argo/.env.example'),
  'LIVE_PROVIDER_SECRET_GUARD: canonical example is not unignored',
);
assert(harness.includes('resolveApprovedLiveConfiguration'), 'LIVE_PROVIDER_SECRET_GUARD: approved source preflight is missing');
assert(harness.includes('cypherTextAndParameters'), 'LIVE_PROVIDER_SECRET_GUARD: Cypher artifacts are not inspected');
assert(harness.includes("{ name: 'logs'"), 'LIVE_PROVIDER_SECRET_GUARD: logs are not inspected');
assert(harness.includes("{ name: 'errorMessages'"), 'LIVE_PROVIDER_SECRET_GUARD: error messages are not inspected');
assert(harness.includes("{ name: 'stdout'"), 'LIVE_PROVIDER_SECRET_GUARD: stdout is not inspected');
assert(harness.includes("{ name: 'stderr'"), 'LIVE_PROVIDER_SECRET_GUARD: stderr is not inspected');
assert(harness.includes('collectFilesRecursively'), 'LIVE_PROVIDER_SECRET_GUARD: generated artifacts are not recursive');
assert(harness.includes('runSyntheticSuccessCanaryProbe'), 'LIVE_PROVIDER_SECRET_GUARD: synthetic success probe is missing');
assert(harness.includes('createRecordingInMemoryIndexBoundary'), 'LIVE_PROVIDER_SECRET_GUARD: recording index boundary is missing');
assert(
  harness.includes("{ name: 'cypherTextAndParameters'")
    && harness.includes("{ name: 'graphEvidence'"),
  'LIVE_PROVIDER_SECRET_GUARD: value-bearing Cypher/graph channels are not inspected',
);

const harnessModulePath = path.join(repoRoot, 'tests', 'harness', 'liveEmbeddingProviderHarness.js');
const recordingSelfTest = JSON.parse(childProcess.execFileSync(
  process.execPath,
  [
    '-e',
    `require(${JSON.stringify(harnessModulePath)}).runRecordingBoundaryCanarySelfTest()`
      + '.then(value => process.stdout.write(JSON.stringify(value)))'
      + '.catch(error => { console.error(error); process.exit(1); });',
  ],
  { cwd: repoRoot, encoding: 'utf8' },
));
assert.deepStrictEqual(
  recordingSelfTest.detectedLeakChannels,
  ['cypherTextAndParameters', 'graphEvidence'],
  'LIVE_PROVIDER_SECRET_GUARD: recording boundary missed neutral-value channels',
);
assert.strictEqual(recordingSelfTest.persistedBeforeCleanup, 1, 'LIVE_PROVIDER_SECRET_GUARD: recording boundary not exercised');
assert.strictEqual(recordingSelfTest.persistedAfterCleanup, 0, 'LIVE_PROVIDER_SECRET_GUARD: recording boundary cleanup failed');
assert.deepStrictEqual(recordingSelfTest.postCleanupLeaks, [], 'LIVE_PROVIDER_SECRET_GUARD: canary survived cleanup');
assert.strictEqual(typeof runNeo4jAuthenticationCanaryProbe, 'function');
const authSelfTest = JSON.parse(childProcess.execFileSync(
  process.execPath,
  [
    '-e',
    `require(${JSON.stringify(harnessModulePath)}).runNeo4jAuthenticationCanaryProbe()`
      + '.then(value => process.stdout.write(JSON.stringify(value)))'
      + '.catch(error => { console.error(error); process.exit(1); });',
  ],
  { cwd: repoRoot, encoding: 'utf8' },
));
assert.deepStrictEqual(authSelfTest.authCalls, [{ usernameMatches: true, passwordMatches: true }]);
assert.deepStrictEqual(authSelfTest.cypherLeaks, []);
assert.deepStrictEqual(authSelfTest.authenticationFailureLeaks, []);
assert.strictEqual(authSelfTest.failureQueries, 0);
for (const requiredArtifact of [
  'design/KG/SystemArchitecture.json',
  'design/KG/test-failure-records.json',
  'tests/.artifacts/live-provider',
  'tests/snapshots',
]) {
  assert(harness.includes(requiredArtifact), `LIVE_PROVIDER_SECRET_GUARD: missing artifact scan ${requiredArtifact}`);
}
for (const entry of [liveEntry, secretEntry]) {
  assert(entry.includes('console.error(safeCategory(error))'), 'LIVE_PROVIDER_SECRET_GUARD: entrypoint may print raw errors');
  assert(!entry.includes('console.error(error)'), 'LIVE_PROVIDER_SECRET_GUARD: entrypoint prints raw error details');
}
assert(
  secretEntry.includes('TS07_PROVIDER_REDACTION_CANARY_LEAK')
    && secretEntry.includes('TS07_PROVIDER_SECRET_FIELD_EXPOSED')
    && secretEntry.includes('TS07_PROVIDER_REDACTION_CHANNEL_NOT_INSPECTED')
    && secretEntry.includes('TS07_PROVIDER_REDACTION_VALUE_CHANNELS_NOT_DETECTED')
    && secretEntry.includes('TS07_PROVIDER_REDACTION_CANARY_PERSISTED')
    && secretEntry.includes('TS07_PROVIDER_REDACTION_GENERATED_ARTIFACT_LEAK'),
  'LIVE_PROVIDER_SECRET_GUARD: secret isolation assertions are incomplete',
);

// The guard defines no resolver. Frozen fixtures are executed only by the future
// production resolveApprovedLiveConfiguration boundary through injected adapters.
assert.strictEqual(typeof runApprovedSourceFixtureMatrix, 'function');
assert(APPROVED_SOURCE_FIXTURES.length >= 20, 'LIVE_PROVIDER_SECRET_GUARD: source matrix is incomplete');
for (const requiredFixture of [
  'process-only',
  'file-only',
  'matching-dual',
  'qwen-conflict',
  'database-password-conflict',
  'acl-current-allow',
  'acl-current-deny',
  'acl-broad-inherited-allow',
  'acl-broad-deny-only',
  'acl-unverifiable',
  'tracked-file',
  'reparse-file',
  'cli-source',
  'fallback-source',
  'alias-source',
  'indirect-source',
]) {
  assert(
    APPROVED_SOURCE_FIXTURES.some(fixture => fixture.name === requiredFixture),
    `LIVE_PROVIDER_SECRET_GUARD: fixture missing ${requiredFixture}`,
  );
}

const configPath = path.join(repoRoot, '.argo', 'scripts', 'graph-rag', 'liveEmbeddingProviderConfig.js');
const fixtureExecutionScript = `
  const harness = require(${JSON.stringify(harnessModulePath)});
  harness.runApprovedSourceFixtureMatrix()
    .then(value => process.stdout.write(JSON.stringify(value)))
    .catch(error => { process.stderr.write(error.category || 'FIXTURE_EXECUTION_FAILED'); process.exit(1); });
`;
const fixtureExecution = childProcess.spawnSync(process.execPath, ['-e', fixtureExecutionScript], {
  cwd: repoRoot,
  encoding: 'utf8',
});
if (fs.existsSync(configPath)) {
  assert.strictEqual(fixtureExecution.status, 0, 'LIVE_PROVIDER_SECRET_GUARD: production source fixtures failed');
  const observations = JSON.parse(fixtureExecution.stdout);
  for (const observation of observations) {
    assert.strictEqual(observation.status, observation.expectedStatus || 'blocked', `LIVE_PROVIDER_SECRET_GUARD: fixture status ${observation.name}`);
    assert.strictEqual(observation.category, observation.expectedCategory, `LIVE_PROVIDER_SECRET_GUARD: fixture category ${observation.name}`);
    if (observation.expectedAttribution) {
      assert.deepStrictEqual(observation.attribution, observation.expectedAttribution, `LIVE_PROVIDER_SECRET_GUARD: attribution ${observation.name}`);
      assert.strictEqual(observation.selectedValuesMatch, true, `LIVE_PROVIDER_SECRET_GUARD: selected value ${observation.name}`);
    }
    assert.deepStrictEqual(observation.effects, { fetch: 0, driver: 0, create: 0, write: 0 }, `LIVE_PROVIDER_SECRET_GUARD: side effect ${observation.name}`);
    assert.deepStrictEqual(observation.leaks, [], `LIVE_PROVIDER_SECRET_GUARD: source canary leaked ${observation.name}`);
  }
} else {
  assert.strictEqual(fixtureExecution.status, 1, 'LIVE_PROVIDER_SECRET_GUARD: missing production boundary fabricated fixture pass');
  assert.strictEqual(fixtureExecution.stderr, 'LIVE_PROVIDER_CONFIGURATION_BOUNDARY_MISSING');
}

// Tracked-tree assertions never open the real secret file.
assert.strictEqual(runGit(['check-ignore', '--quiet', '--', '.argo/.env']).status, 0, 'LIVE_PROVIDER_SECRET_GUARD: .argo/.env is not ignored');
assert.strictEqual(runGit(['ls-files', '--error-unmatch', '.argo/.env']).status, 1, 'LIVE_PROVIDER_SECRET_GUARD: .argo/.env is tracked');
assert.strictEqual(runGit(['ls-tree', '-r', '--name-only', 'HEAD', '--', '.argo/.env']).stdout.trim(), '', 'LIVE_PROVIDER_SECRET_GUARD: .argo/.env exists in HEAD');
assert.strictEqual(runGit(['ls-files', '--error-unmatch', '.argo/.env.example']).status, 0, 'LIVE_PROVIDER_SECRET_GUARD: example is not tracked');

function runGit(args) {
  return childProcess.spawnSync('git', args, { cwd: repoRoot, encoding: 'utf8' });
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

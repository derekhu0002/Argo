const assert = require('node:assert');
const childProcess = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {
  findSecretLeaks,
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
for (const [secretName, canary] of [
  ['QWEN_KEY', `qwen-canary-${crypto.randomUUID()}`],
  ['ARGO_NEO4J_DATABASE_PASSWORD', `neo4j-canary-${crypto.randomUUID()}`],
]) {
  for (const channel of [
    { name: `${secretName}:processSource`, value: { neutral: canary } },
    { name: `${secretName}:fileSource`, value: { neutral: canary } },
    { name: `${secretName}:conflictError`, value: new Error(`conflict:${canary}`) },
    { name: `${secretName}:aclError`, value: new Error(`acl:${canary}`) },
    { name: `${secretName}:connectionAuthenticationError`, value: new Error(`auth:${canary}`) },
  ]) {
    assert.strictEqual(
      findSecretLeaks(canary, [channel]).length,
      1,
      `LIVE_PROVIDER_SECRET_GUARD: ${channel.name} canary was missed`,
    );
  }
  assert.deepStrictEqual(
    findSecretLeaks(canary, [
      { name: 'safe-conflict', value: 'SECRET_SOURCE_CONFLICT' },
      { name: 'safe-acl', value: 'SECRET_FILE_ACL_UNSAFE' },
      { name: 'safe-auth', value: 'NEO4J_AUTHENTICATION_FAILED' },
    ]),
    [],
    `LIVE_PROVIDER_SECRET_GUARD: ${secretName} safe categories leaked`,
  );
}

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

// GIVEN synthetic approved-source fixtures (never the real .argo/.env)
// WHEN precedence, path, git, file, ACL, and provenance facts are evaluated
// THEN only direct process or the unique safe file source is accepted
const secretA = `qwen-${crypto.randomUUID()}`;
const secretB = `neo4j-${crypto.randomUUID()}`;
const safeFileState = {
  path: '.argo/.env',
  ignored: true,
  tracked: false,
  regular: true,
  reparse: false,
  acl: { verifiable: true, currentIdentityCanRead: true, broadReaders: [] },
};
const safeSourceFixtures = [
  { name: 'process-only', process: { QWEN_KEY: secretA, ARGO_NEO4J_DATABASE_PASSWORD: secretB } },
  { name: 'file-only', fileState: safeFileState, fileEntries: [['QWEN_KEY', secretA], ['ARGO_NEO4J_DATABASE_PASSWORD', secretB]] },
  { name: 'matching-dual', process: { QWEN_KEY: secretA, ARGO_NEO4J_DATABASE_PASSWORD: secretB }, fileState: safeFileState, fileEntries: [['QWEN_KEY', secretA], ['ARGO_NEO4J_DATABASE_PASSWORD', secretB]] },
  { name: 'mixed-approved-sources', process: { QWEN_KEY: secretA }, fileState: safeFileState, fileEntries: [['ARGO_NEO4J_DATABASE_PASSWORD', secretB]] },
  { name: 'non-sensitive-file-allowlist', process: { QWEN_KEY: secretA, ARGO_NEO4J_DATABASE_PASSWORD: secretB }, fileState: safeFileState, fileEntries: [['ARGO_EMBEDDING_MODEL', 'synthetic-model'], ['ARGO_NEO4J_DATABASE_URL', 'synthetic-url'], ['ARGO_NEO4J_DATABASE_USERNAME', 'synthetic-user']] },
];
const rejectedSourceFixtures = [
  { name: 'qwen-conflict', expected: 'SECRET_SOURCE_CONFLICT', process: { QWEN_KEY: secretA, ARGO_NEO4J_DATABASE_PASSWORD: secretB }, fileState: safeFileState, fileEntries: [['QWEN_KEY', `${secretA}-different`]] },
  { name: 'database-password-conflict', expected: 'SECRET_SOURCE_CONFLICT', process: { QWEN_KEY: secretA, ARGO_NEO4J_DATABASE_PASSWORD: secretB }, fileState: safeFileState, fileEntries: [['ARGO_NEO4J_DATABASE_PASSWORD', `${secretB}-different`]] },
  { name: 'missing-secret', expected: 'APPROVED_SECRET_REQUIRED', process: { QWEN_KEY: secretA } },
  { name: 'blank-secret', expected: 'APPROVED_SECRET_REQUIRED', process: { QWEN_KEY: ' ', ARGO_NEO4J_DATABASE_PASSWORD: secretB } },
  { name: 'duplicate-key', expected: 'SECRET_FILE_DUPLICATE_KEY', fileState: safeFileState, fileEntries: [['QWEN_KEY', secretA], ['QWEN_KEY', secretA], ['ARGO_NEO4J_DATABASE_PASSWORD', secretB]] },
  { name: 'unknown-secret', expected: 'SECRET_FILE_UNKNOWN_KEY', process: { QWEN_KEY: secretA, ARGO_NEO4J_DATABASE_PASSWORD: secretB }, fileState: safeFileState, fileEntries: [['OTHER_API_TOKEN', 'synthetic']] },
  { name: 'root-file', expected: 'SECRET_FILE_PATH_PROHIBITED', fileState: { ...safeFileState, path: '.env' }, fileEntries: [['QWEN_KEY', secretA], ['ARGO_NEO4J_DATABASE_PASSWORD', secretB]] },
  { name: 'alternate-file', expected: 'SECRET_FILE_PATH_PROHIBITED', fileState: { ...safeFileState, path: 'config/.env' }, fileEntries: [['QWEN_KEY', secretA], ['ARGO_NEO4J_DATABASE_PASSWORD', secretB]] },
  { name: 'tracked-file', expected: 'SECRET_FILE_TRACKED', fileState: { ...safeFileState, tracked: true }, fileEntries: [['QWEN_KEY', secretA], ['ARGO_NEO4J_DATABASE_PASSWORD', secretB]] },
  { name: 'not-ignored', expected: 'SECRET_FILE_NOT_IGNORED', fileState: { ...safeFileState, ignored: false }, fileEntries: [['QWEN_KEY', secretA], ['ARGO_NEO4J_DATABASE_PASSWORD', secretB]] },
  { name: 'non-regular-file', expected: 'SECRET_FILE_NOT_REGULAR', fileState: { ...safeFileState, regular: false }, fileEntries: [['QWEN_KEY', secretA], ['ARGO_NEO4J_DATABASE_PASSWORD', secretB]] },
  { name: 'reparse-file', expected: 'SECRET_FILE_REPARSE_PROHIBITED', fileState: { ...safeFileState, reparse: true }, fileEntries: [['QWEN_KEY', secretA], ['ARGO_NEO4J_DATABASE_PASSWORD', secretB]] },
  { name: 'acl-broad-reader', expected: 'SECRET_FILE_ACL_UNSAFE', fileState: { ...safeFileState, acl: { verifiable: true, currentIdentityCanRead: true, broadReaders: ['BUILTIN\\Users'] } }, fileEntries: [['QWEN_KEY', secretA], ['ARGO_NEO4J_DATABASE_PASSWORD', secretB]] },
  { name: 'acl-unverifiable', expected: 'SECRET_FILE_ACL_UNVERIFIABLE', fileState: { ...safeFileState, acl: { verifiable: false } }, fileEntries: [['QWEN_KEY', secretA], ['ARGO_NEO4J_DATABASE_PASSWORD', secretB]] },
  { name: 'acl-current-identity-denied', expected: 'SECRET_FILE_ACL_UNSAFE', fileState: { ...safeFileState, acl: { verifiable: true, currentIdentityCanRead: false, broadReaders: [] } }, fileEntries: [['QWEN_KEY', secretA], ['ARGO_NEO4J_DATABASE_PASSWORD', secretB]] },
  { name: 'cli-source', expected: 'SECRET_SOURCE_PROVENANCE_PROHIBITED', provenance: 'cli', process: { QWEN_KEY: secretA, ARGO_NEO4J_DATABASE_PASSWORD: secretB } },
  { name: 'literal-source', expected: 'SECRET_SOURCE_PROVENANCE_PROHIBITED', provenance: 'literal', process: { QWEN_KEY: secretA, ARGO_NEO4J_DATABASE_PASSWORD: secretB } },
  { name: 'fallback-source', expected: 'SECRET_SOURCE_PROVENANCE_PROHIBITED', provenance: 'fallback', process: { QWEN_KEY: secretA, ARGO_NEO4J_DATABASE_PASSWORD: secretB } },
  { name: 'alias-source', expected: 'SECRET_SOURCE_PROVENANCE_PROHIBITED', provenance: 'alias', process: { QWEN_KEY: secretA, ARGO_NEO4J_DATABASE_PASSWORD: secretB } },
  { name: 'indirect-source', expected: 'SECRET_SOURCE_PROVENANCE_PROHIBITED', provenance: 'indirect', process: { QWEN_KEY: secretA, ARGO_NEO4J_DATABASE_PASSWORD: secretB } },
];
for (const fixture of safeSourceFixtures) {
  assert.strictEqual(resolveApprovedSourcesFixture(fixture).status, 'accepted', `LIVE_PROVIDER_SECRET_GUARD: safe source rejected ${fixture.name}`);
}
for (const fixture of rejectedSourceFixtures) {
  assert.strictEqual(resolveApprovedSourcesFixture(fixture).category, fixture.expected, `LIVE_PROVIDER_SECRET_GUARD: bypass accepted ${fixture.name}`);
}
runTemporarySecretFilePreflight();

const loaderPath = '.argo/scripts/graph-rag/liveEmbeddingProviderConfig.js';
if (fs.existsSync(path.join(repoRoot, ...loaderPath.split('/')))) {
  assert.deepStrictEqual(
    analyzeApprovedLoader(read(loaderPath)),
    [],
    'LIVE_PROVIDER_SECRET_GUARD: live configuration loader violates approved provenance',
  );
}

function resolveApprovedSourcesFixture(fixture) {
  if (fixture.provenance && !['direct-process', 'exact-file'].includes(fixture.provenance)) return { category: 'SECRET_SOURCE_PROVENANCE_PROHIBITED' };
  const entries = fixture.fileEntries || [];
  if (entries.length) {
    const state = fixture.fileState || {};
    if (state.path !== '.argo/.env') return { category: 'SECRET_FILE_PATH_PROHIBITED' };
    if (!state.ignored) return { category: 'SECRET_FILE_NOT_IGNORED' };
    if (state.tracked) return { category: 'SECRET_FILE_TRACKED' };
    if (!state.regular) return { category: 'SECRET_FILE_NOT_REGULAR' };
    if (state.reparse) return { category: 'SECRET_FILE_REPARSE_PROHIBITED' };
    if (!state.acl || !state.acl.verifiable) return { category: 'SECRET_FILE_ACL_UNVERIFIABLE' };
    if (!state.acl.currentIdentityCanRead || (state.acl.broadReaders || []).length) return { category: 'SECRET_FILE_ACL_UNSAFE' };
  }
  const counts = new Map();
  for (const [key] of entries) counts.set(key, (counts.get(key) || 0) + 1);
  if ([...counts.values()].some(count => count > 1)) return { category: 'SECRET_FILE_DUPLICATE_KEY' };
  const approvedKeys = new Set([
    'ARGO_EMBEDDING_BASE_URL',
    'ARGO_EMBEDDING_MODEL',
    'ARGO_EMBEDDING_PROVIDER',
    'ARGO_EMBEDDING_MODEL_VERSION',
    'ARGO_EMBEDDING_DIMENSIONS',
    'ARGO_NEO4J_DATABASE_URL',
    'ARGO_NEO4J_DATABASE_USERNAME',
    'ARGO_NEO4J_DATABASE_PASSWORD',
    'QWEN_KEY',
  ]);
  if (entries.some(([key]) => !approvedKeys.has(key) && /KEY|PASSWORD|SECRET|TOKEN/i.test(key))) return { category: 'SECRET_FILE_UNKNOWN_KEY' };
  const file = new Map(entries);
  const processValues = fixture.process || {};
  for (const key of ['QWEN_KEY', 'ARGO_NEO4J_DATABASE_PASSWORD']) {
    const processValue = processValues[key];
    const fileValue = file.get(key);
    if ((processValue !== undefined && String(processValue).trim() === '') || (fileValue !== undefined && String(fileValue).trim() === '')) return { category: 'APPROVED_SECRET_REQUIRED' };
    if (processValue !== undefined && fileValue !== undefined && processValue !== fileValue) return { category: 'SECRET_SOURCE_CONFLICT' };
    if (processValue === undefined && fileValue === undefined) return { category: 'APPROVED_SECRET_REQUIRED' };
  }
  return { status: 'accepted' };
}

function runTemporarySecretFilePreflight() {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'argo-secret-preflight-'));
  try {
    const argoDirectory = path.join(temporaryRoot, '.argo');
    fs.mkdirSync(argoDirectory);
    const filePath = path.join(argoDirectory, '.env');
    fs.writeFileSync(filePath, `QWEN_KEY=${secretA}\nARGO_NEO4J_DATABASE_PASSWORD=${secretB}\n`, { flag: 'wx', mode: 0o600 });
    const stat = fs.lstatSync(filePath);
    assert(stat.isFile() && !stat.isSymbolicLink(), 'LIVE_PROVIDER_SECRET_GUARD: temporary fixture is not regular');
    const acl = childProcess.spawnSync('icacls', [filePath], { encoding: 'utf8', windowsHide: true });
    const aclFact = acl.status === 0
      ? { verifiable: true, currentIdentityCanRead: true, broadReaders: extractBroadAclReaders(acl.stdout) }
      : { verifiable: false };
    const result = resolveApprovedSourcesFixture({
      fileState: { ...safeFileState, acl: aclFact },
      fileEntries: [['QWEN_KEY', secretA], ['ARGO_NEO4J_DATABASE_PASSWORD', secretB]],
    });
    assert(
      ['accepted', 'SECRET_FILE_ACL_UNSAFE', 'SECRET_FILE_ACL_UNVERIFIABLE'].includes(result.status || result.category),
      'LIVE_PROVIDER_SECRET_GUARD: Windows ACL preflight did not classify',
    );
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

function extractBroadAclReaders(output) {
  return ['Everyone', 'BUILTIN\\Users', 'Authenticated Users'].filter(principal => (
    output.includes(principal) && /\((?:R|RX|M|F)\)/.test(output)
  ));
}

function analyzeApprovedLoader(source) {
  const violations = [];
  for (const forbidden of [/\bprocess\.argv\b/, /\|\|/, /\?\?/, /\?.*:/, /ARGO_NEO4J_URI/, /ARGO_NEO4J_USERNAME/, /ARGO_NEO4J_PASSWORD/]) {
    if (forbidden.test(source)) violations.push(String(forbidden));
  }
  for (const key of ['QWEN_KEY', 'ARGO_NEO4J_DATABASE_PASSWORD']) {
    if (!source.includes(`process.env.${key}`) || !source.includes(`parsed.${key}`)) violations.push(`missing-approved-source:${key}`);
  }
  for (const required of ['.argo', '.env', 'icacls', 'check-ignore', 'ls-files', 'lstatSync']) {
    if (!source.includes(required)) violations.push(`missing-preflight:${required}`);
  }
  return violations;
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

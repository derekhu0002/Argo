const assert = require('node:assert');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {
  findSecretLeaks,
} = require('../../harness/liveEmbeddingProviderHarness.js');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const envExample = read('.env.example');
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
  [{ name: 'cypherParameters', value: { nested: { credential: syntheticSecret } } }],
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
assert(!envExample.includes('QWEN_KEY'), 'LIVE_PROVIDER_SECRET_GUARD: .env.example contains QWEN_KEY');
assert(gitignore.split(/\r?\n/).includes('.env'), 'LIVE_PROVIDER_SECRET_GUARD: .env is not ignored');
assert(harness.includes('process.env.QWEN_KEY'), 'LIVE_PROVIDER_SECRET_GUARD: process secret source is missing');
assert(harness.includes('cypherTextAndParameters'), 'LIVE_PROVIDER_SECRET_GUARD: Cypher artifacts are not inspected');
assert(harness.includes("{ name: 'logs'"), 'LIVE_PROVIDER_SECRET_GUARD: logs are not inspected');
assert(harness.includes("{ name: 'errorMessages'"), 'LIVE_PROVIDER_SECRET_GUARD: error messages are not inspected');
assert(harness.includes("{ name: 'stdout'"), 'LIVE_PROVIDER_SECRET_GUARD: stdout is not inspected');
assert(harness.includes("{ name: 'stderr'"), 'LIVE_PROVIDER_SECRET_GUARD: stderr is not inspected');
assert(harness.includes('collectFilesRecursively'), 'LIVE_PROVIDER_SECRET_GUARD: generated artifacts are not recursive');
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
    && secretEntry.includes('TS07_PROVIDER_REDACTION_CHANNEL_NOT_INSPECTED'),
  'LIVE_PROVIDER_SECRET_GUARD: secret isolation assertions are incomplete',
);

// GIVEN source-loader bypass fixtures
// WHEN process-only secret loading is analyzed without reading any secret value
// THEN dotenv, .env parsing, and configuration-object QWEN_KEY sources are rejected
for (const fixture of [
  "require('dotenv').config(); const value = process.env.QWEN_KEY;",
  "const parsed = readFileSync('.env', 'utf8'); const value = parsed.QWEN_KEY;",
  'const value = configuration.QWEN_KEY;',
  'const value = envFile.QWEN_KEY;',
]) {
  assert(
    inspectProcessSecretLoaderText(fixture).length > 0,
    'LIVE_PROVIDER_SECRET_GUARD: process-only loader bypass fixture was missed',
  );
}
assert.deepStrictEqual(
  inspectProcessSecretLoaderText('const value = process.env.QWEN_KEY;'),
  [],
  'LIVE_PROVIDER_SECRET_GUARD: direct process injection was rejected',
);
const loaderPath = '.argo/scripts/graph-rag/liveEmbeddingProviderConfig.js';
if (fs.existsSync(path.join(repoRoot, ...loaderPath.split('/')))) {
  assert.deepStrictEqual(
    inspectProcessSecretLoaderText(read(loaderPath)),
    [],
    'LIVE_PROVIDER_SECRET_GUARD: live configuration loader can source QWEN_KEY from files',
  );
}

function inspectProcessSecretLoaderText(source) {
  const violations = [];
  if (/\bdotenv\b/i.test(source)) {
    violations.push('dotenv');
  }
  if (/['"]\.env(?:\.[^'"]*)?['"]/i.test(source) && /QWEN_KEY/i.test(source)) {
    violations.push('.env');
  }
  if (/(?:configuration|config|parsed|envFile)\s*(?:\.|\[['"])\s*QWEN_KEY/i.test(source)) {
    violations.push('configuration-object');
  }
  return violations;
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

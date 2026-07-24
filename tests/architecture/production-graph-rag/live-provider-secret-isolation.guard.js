const assert = require('node:assert');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {
  findSecretLeaks,
} = require('../../harness/liveEmbeddingProviderHarness.js');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const envExample = read('.env.example');
const harness = read('tests/harness/liveEmbeddingProviderHarness.js');
const liveEntry = read('tests/explicit/entries/runLiveEmbeddingProviderE2E.js');
const secretEntry = read('tests/explicit/entries/runLiveEmbeddingProviderSecretIsolation.js');
const syntheticSecret = `synthetic-${crypto.randomUUID()}`;

// GIVEN a synthetic canary that is not a real provider credential
// WHEN the artifact scanner examines every observable channel
// THEN direct, nested, and binary copies are found without printing the canary
for (const fixture of [
  [{ name: 'logs', value: `authorization=${syntheticSecret}` }],
  [{ name: 'cypherParameters', value: { nested: { credential: syntheticSecret } } }],
  [{ name: 'snapshot', value: Buffer.from(`snapshot:${syntheticSecret}`) }],
  [{ name: 'failureRecords', value: [{ failureError: syntheticSecret }] }],
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
assert(harness.includes('process.env.QWEN_KEY'), 'LIVE_PROVIDER_SECRET_GUARD: process secret source is missing');
assert(harness.includes('cypherTextAndParameters'), 'LIVE_PROVIDER_SECRET_GUARD: Cypher artifacts are not inspected');
assert(harness.includes("{ name: 'logs'"), 'LIVE_PROVIDER_SECRET_GUARD: logs are not inspected');
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
  secretEntry.includes('TS07_PROVIDER_SECRET_LEAK')
    && secretEntry.includes('TS07_PROVIDER_SECRET_ARTIFACT_NOT_INSPECTED'),
  'LIVE_PROVIDER_SECRET_GUARD: secret isolation assertions are incomplete',
);

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

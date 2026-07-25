const assert = require('node:assert');
const childProcess = require('node:child_process');
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
assert(!envExample.includes('QWEN_KEY'), 'LIVE_PROVIDER_SECRET_GUARD: .env.example contains QWEN_KEY');
assert(gitignore.split(/\r?\n/).includes('.env'), 'LIVE_PROVIDER_SECRET_GUARD: .env is not ignored');
assert(harness.includes('process.env.QWEN_KEY'), 'LIVE_PROVIDER_SECRET_GUARD: process secret source is missing');
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

// GIVEN safe and bypass loader fixtures
// WHEN source provenance is propagated through assignments and property reads
// THEN only the five file-safe fields and a direct process.env.QWEN_KEY source are accepted
const safeLoaderFixtures = [
  {
    name: 'dotenv-parse-allowlist-plus-direct-process-secret',
    source: `
      const parsed = dotenv.parse(readFileSync('.env'));
      const baseUrl = parsed.ARGO_EMBEDDING_BASE_URL;
      const model = parsed.ARGO_EMBEDDING_MODEL;
      const provider = parsed.ARGO_EMBEDDING_PROVIDER;
      const modelVersion = parsed.ARGO_EMBEDDING_MODEL_VERSION;
      const dimensions = parsed.ARGO_EMBEDDING_DIMENSIONS;
      const secret = process.env.QWEN_KEY;
    `,
  },
  {
    name: 'json-non-sensitive-allowlist-plus-direct-process-secret',
    source: `
      const parsed = JSON.parse(readFileSync('provider-config.json'));
      const model = parsed.ARGO_EMBEDDING_MODEL;
      const dimensions = parsed.ARGO_EMBEDDING_DIMENSIONS;
      const secret = process.env.QWEN_KEY;
    `,
  },
  {
    name: 'direct-process-secret-only',
    source: 'const secret = process.env.QWEN_KEY;',
  },
];
const bypassLoaderFixtures = [
  { name: 'dotenv-config-may-populate-secret', source: "dotenv.config(); const secret = process.env.QWEN_KEY;" },
  { name: 'dotenv-parsed-secret', source: "const parsed = dotenv.parse(readFileSync('.env')); const secret = parsed.QWEN_KEY;" },
  { name: 'file-secret', source: "const envFile = readFileSync('.env'); const secret = envFile.QWEN_KEY;" },
  { name: 'json-secret', source: "const parsed = JSON.parse(readFileSync('config.json')); const secret = parsed.QWEN_KEY;" },
  { name: 'yaml-secret', source: "const parsed = yaml.parse(readFileSync('config.yaml')); const secret = parsed.QWEN_KEY;" },
  { name: 'configuration-object-secret', source: 'const secret = configuration.QWEN_KEY;' },
  { name: 'process-env-alias', source: 'const env = process.env; const secret = env.QWEN_KEY;' },
  { name: 'fallback', source: "const secret = process.env.QWEN_KEY || configuration.QWEN_KEY;" },
  { name: 'nullish-fallback', source: "const secret = process.env.QWEN_KEY ?? parsed.QWEN_KEY;" },
  { name: 'ternary-fallback', source: "const secret = ready ? process.env.QWEN_KEY : parsed.QWEN_KEY;" },
  { name: 'destructuring', source: 'const { QWEN_KEY } = process.env;' },
  { name: 'renamed-destructuring', source: 'const { QWEN_KEY: secret } = process.env;' },
  { name: 'indirect-secret-alias', source: 'const direct = process.env.QWEN_KEY; const secret = direct;' },
  { name: 'computed-process-access', source: "const secret = process.env['QWEN_KEY'];" },
  { name: 'non-allowlisted-file-field', source: "const parsed = dotenv.parse(readFileSync('.env')); const value = parsed.OTHER_FIELD;" },
];
for (const fixture of safeLoaderFixtures) {
  assert.deepStrictEqual(
    analyzeProcessOnlyLoader(fixture.source),
    [],
    `LIVE_PROVIDER_SECRET_GUARD: safe loader rejected ${fixture.name}`,
  );
}
for (const fixture of bypassLoaderFixtures) {
  assert(
    analyzeProcessOnlyLoader(fixture.source).length > 0,
    `LIVE_PROVIDER_SECRET_GUARD: loader bypass accepted ${fixture.name}`,
  );
}
const loaderPath = '.argo/scripts/graph-rag/liveEmbeddingProviderConfig.js';
if (fs.existsSync(path.join(repoRoot, ...loaderPath.split('/')))) {
  assert.deepStrictEqual(
    analyzeProcessOnlyLoader(read(loaderPath)),
    [],
    'LIVE_PROVIDER_SECRET_GUARD: live configuration loader can source QWEN_KEY from files',
  );
}

function analyzeProcessOnlyLoader(source) {
  const allowlistedFileFields = new Set([
    'ARGO_EMBEDDING_BASE_URL',
    'ARGO_EMBEDDING_MODEL',
    'ARGO_EMBEDDING_PROVIDER',
    'ARGO_EMBEDDING_MODEL_VERSION',
    'ARGO_EMBEDDING_DIMENSIONS',
  ]);
  const violations = new Set();
  const declarations = parseDeclarations(source);
  const externalConfigVariables = new Set();
  const directSecretVariables = new Set();

  if (/\bdotenv\s*\.\s*config\s*\(/.test(source)) {
    violations.add('dotenv-config-mutates-process-env');
  }
  for (let pass = 0; pass < declarations.length + 1; pass += 1) {
    for (const { name, expression } of declarations) {
      if (isExternalConfigExpression(expression)
        || externalConfigVariables.has(expression.trim())) {
        externalConfigVariables.add(name);
      }
      if (normalize(expression) === 'process.env.QWEN_KEY') {
        directSecretVariables.add(name);
      }
      if (directSecretVariables.has(expression.trim())) {
        violations.add(`indirect-secret-alias:${name}`);
      }
    }
  }

  if (/\b(?:const|let|var)\s*\{[^}]*\bQWEN_KEY\b[^}]*\}\s*=\s*process\.env/.test(source)) {
    violations.add('secret-destructuring');
  }
  for (const { name, expression } of declarations) {
    if (expression.includes('QWEN_KEY')
      && normalize(expression) !== 'process.env.QWEN_KEY') {
      violations.add(`non-direct-secret-source:${name}`);
    }
  }

  const propertyAccess = /\b(process\.env|[A-Za-z_$][\w$]*)\s*(?:\.\s*([A-Za-z_$][\w$]*)|\[\s*['"]([^'"]+)['"]\s*\])/g;
  let match;
  while ((match = propertyAccess.exec(source)) !== null) {
    const owner = match[1];
    const property = match[2] || match[3];
    const computed = Boolean(match[3]);
    if (property === 'QWEN_KEY') {
      if (owner !== 'process.env' || computed) {
        violations.add(`indirect-secret-property:${owner}`);
      }
      continue;
    }
    if (externalConfigVariables.has(owner) && !allowlistedFileFields.has(property)) {
      violations.add(`non-allowlisted-file-field:${property}`);
    }
  }
  return [...violations].sort();
}

function parseDeclarations(source) {
  const declarations = [];
  const pattern = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([^;\n]+)/g;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    declarations.push({ name: match[1], expression: match[2].trim() });
  }
  return declarations;
}

function isExternalConfigExpression(expression) {
  return /\bdotenv\s*\.\s*parse\s*\(|\bJSON\s*\.\s*parse\s*\(|\bya?ml\s*\.\s*parse\s*\(|\breadFileSync\s*\(|\bloadConfig\s*\(|\brequire\s*\(\s*['"][^'"]*config/i.test(expression);
}

function normalize(expression) {
  return expression.replace(/\s+/g, '');
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

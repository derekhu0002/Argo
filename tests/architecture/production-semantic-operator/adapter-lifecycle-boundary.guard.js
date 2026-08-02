const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const paths = {
  operator: '.argo/scripts/graph-rag/semanticOperatorJourney.js',
  store: '.argo/scripts/graph-rag/semanticReadinessAttestationStore.js',
  error: '.argo/scripts/graph-rag/semanticOperatorError.js',
  metadata: '.argo/scripts/graph-rag/systemMetadataCommandAdapter.js',
  cli: '.argo/scripts/semanticOperatorJourneyCli.js',
  system: '.argo/scripts/systemarchitecture-mcp-server.js',
  gateway: '.argo/scripts/argo-mcp-server.js',
  package: 'package.json',
};
const handoff = JSON.parse(read('.argo/temp/ImplementationToCodingHandoff.json'));

const safePackage = {
  scripts: {
    'semantic:backfill': 'node .argo/scripts/semanticOperatorJourneyCli.js backfill',
  },
};
assert.doesNotThrow(
  () => assertPackageConsent(safePackage, 'safe-package.fixture.json'),
  'WP_P3_ADAPTER_LIFECYCLE_GUARD: compliant package command was rejected',
);
assert.throws(
  () => assertPackageConsent({
    scripts: {
      'semantic:backfill': 'node .argo/scripts/semanticOperatorJourneyCli.js backfill --explicit-opt-in',
    },
  }, 'forged-package.fixture.json'),
  /WP_P3_ADAPTER_LIFECYCLE_GUARD/,
  'WP_P3_ADAPTER_LIFECYCLE_GUARD: forged package consent fixture passed',
);

const safeDispatch = `
function readFullSnapshot() { return {}; }
function executeSemanticSystemArchitectureQuery() { throw new Error('private raw delegate'); }
function createDefaultProductionSemanticOperatorJourney() { return { query() { throw new Error('fail closed'); } }; }
function resolveSemanticOperatorJourney(dependencies) {
  return dependencies && dependencies.semanticOperatorJourney
    ? dependencies.semanticOperatorJourney
    : createDefaultProductionSemanticOperatorJourney();
}
async function callTool(name, args, dependencies) {
  if (name === 'getSystemArchitecture') {
    if (!Object.prototype.hasOwnProperty.call(args, 'query')) return readFullSnapshot();
    if (args.query.purpose === 'graph-tidy') return readFullSnapshot();
    const journey = await resolveSemanticOperatorJourney(dependencies);
    return journey.query(args.query);
  }
}`;
assert.doesNotThrow(
  () => assertSemanticDispatch(safeDispatch, 'safe-dispatch.fixture.js'),
  'WP_P3_ADAPTER_LIFECYCLE_GUARD: safe operator dispatch was rejected',
);
assert.throws(
  () => assertSemanticDispatch(
    safeDispatch.replace(
      'const journey = await resolveSemanticOperatorJourney(dependencies);\n    return journey.query(args.query);',
      'if (!dependencies || !dependencies.semanticOperatorJourney) return executeSemanticSystemArchitectureQuery(args, dependencies);\n    const journey = await resolveSemanticOperatorJourney(dependencies);\n    return journey.query(args.query);',
    ),
    'missing-journey-raw-fallback.fixture.js',
  ),
  /WP_P3_ADAPTER_LIFECYCLE_GUARD/,
  'WP_P3_ADAPTER_LIFECYCLE_GUARD: missing-journey raw fallback fixture passed',
);
assert.throws(
  () => assertSemanticDispatch(
    safeDispatch.replace(
      'const journey = await resolveSemanticOperatorJourney(dependencies);',
      'const raw = executeSemanticSystemArchitectureQuery;\n    return raw(args, dependencies);\n    const journey = await resolveSemanticOperatorJourney(dependencies);',
    ),
    'aliased-raw-fallback.fixture.js',
  ),
  /WP_P3_ADAPTER_LIFECYCLE_GUARD/,
  'WP_P3_ADAPTER_LIFECYCLE_GUARD: aliased raw fallback fixture passed',
);
assert.throws(
  () => assertSemanticDispatch(
    `function rawFallback(args, dependencies) {
  return executeSemanticSystemArchitectureQuery(args, dependencies);
}
${safeDispatch.replace(
    'const journey = await resolveSemanticOperatorJourney(dependencies);',
    'return rawFallback(args, dependencies);\n    const journey = await resolveSemanticOperatorJourney(dependencies);',
  )}`,
    'helper-raw-fallback.fixture.js',
  ),
  /WP_P3_ADAPTER_LIFECYCLE_GUARD/,
  'WP_P3_ADAPTER_LIFECYCLE_GUARD: helper raw fallback fixture passed',
);
assert.throws(
  () => assertSemanticDispatch(
    `function rawJourney(dependencies) {
  return { query(request) { return executeSemanticSystemArchitectureQuery(request, dependencies); } };
}
${safeDispatch.replace(
    ': createDefaultProductionSemanticOperatorJourney();',
    ': rawJourney(dependencies);',
  )}`,
    'resolver-delegated-raw-fallback.fixture.js',
  ),
  /WP_P3_ADAPTER_LIFECYCLE_GUARD/,
  'WP_P3_ADAPTER_LIFECYCLE_GUARD: resolver-delegated raw fallback fixture passed',
);
assert.throws(
  () => assertSemanticDispatch(
    safeDispatch.replace(
      'const journey = await resolveSemanticOperatorJourney(dependencies);\n    return journey.query(args.query);',
      'const retrieval = resolveSemanticRetrievalBoundary(dependencies);\n    return retrieval.retrieve(args.query);',
    ),
    'direct-retrieval.fixture.js',
  ),
  /WP_P3_ADAPTER_LIFECYCLE_GUARD/,
  'WP_P3_ADAPTER_LIFECYCLE_GUARD: direct retrieval fixture passed',
);
assert.throws(
  () => assertSemanticDispatch(
    safeDispatch.replace(
      'const journey = await resolveSemanticOperatorJourney(dependencies);\n    return journey.query(args.query);',
      "const retrieval = resolveSemanticRetrievalBoundary(dependencies);\n    return retrieval['retrieve'](args.query);",
    ),
    'bracket-direct-retrieval.fixture.js',
  ),
  /WP_P3_ADAPTER_LIFECYCLE_GUARD/,
  'WP_P3_ADAPTER_LIFECYCLE_GUARD: bracket direct retrieval fixture passed',
);

const safeWire = `
function semanticOperatorErrorResult(error) { return error; }
async function handleRequest(request, dependencies) {
  try { return await callTool(request.params.name, request.params.arguments, dependencies); }
  catch (error) { return semanticOperatorErrorResult(error); }
}`;
assert.doesNotThrow(
  () => assertStructuredWire(safeWire, 'safe-wire.fixture.js'),
  'WP_P3_ADAPTER_LIFECYCLE_GUARD: safe structured wire fixture was rejected',
);
assert.throws(
  () => assertStructuredWire(
    safeWire.replace(
      'return semanticOperatorErrorResult(error);',
      'return { content: [{ text: String(error.stack) }], isError: true };',
    ),
    'stack-wire.fixture.js',
  ),
  /WP_P3_ADAPTER_LIFECYCLE_GUARD/,
  'WP_P3_ADAPTER_LIFECYCLE_GUARD: stack wire fixture passed',
);
assert.throws(
  () => assertStructuredWire(
    safeWire.replace(
      'return semanticOperatorErrorResult(error);',
      "return { content: [{ text: String(error['stack']) }], isError: true };",
    ),
    'bracket-stack-wire.fixture.js',
  ),
  /WP_P3_ADAPTER_LIFECYCLE_GUARD/,
  'WP_P3_ADAPTER_LIFECYCLE_GUARD: bracket stack wire fixture passed',
);

const safeStore = `
const fs = require('node:fs');
const path = require('node:path');
const ATTESTATION_PATH = '.argo/temp/semantic-readiness-attestation.json';
const FIELDS = ['authorizationOperation','canonicalVersion','contentVersion','indexVersion','completedChannels','missingChannels','mismatchedChannels'];
const ACL_REMEDIATION = 'Restrict .argo/temp and semantic-readiness-attestation.json ownership and ACLs to the current OS identity and SYSTEM, then run semantic readiness again';
const WINDOWS_PROTECTED_RIGHTS = Object.freeze([
  'F','M','RX','R','W','D',
  'DE','RC','WDAC','WO','S','AS','MA',
  'GR','GW','GE','GA',
  'RD','WD','AD','REA','WEA','X','DC','RA','WA',
]);
function normalizePrincipal(value) { return String(value).trim().toLowerCase(); }
function parseWindowsAcl(value) {
  return String(value).split(/\\r?\\n/).filter(Boolean).map(line => {
    const match = line.match(/^(.+?):((?:\\([^)]*\\))+?)$/);
    if (!match) throw windowsTrustError();
    const flags = Array.from(match[2].matchAll(/\\(([^)]*)\\)/g), entry => entry[1].toUpperCase());
    return {
      principal: normalizePrincipal(match[1]),
      denied: flags.includes('DENY'),
      permissions: flags
        .filter(flag => !['DENY', 'I', 'OI', 'CI', 'IO'].includes(flag))
        .flatMap(flag => flag.split(',')),
    };
  });
}
function grantsProtectedAccess(entry) {
  return entry.permissions.some(permission => WINDOWS_PROTECTED_RIGHTS.includes(permission));
}
function grantsRequiredIdentityAccess(entry) {
  return entry.permissions.some(permission => permission === 'F' || permission === 'M');
}
function windowsTrustError() {
  const error = new Error('SEMANTIC_READINESS_ATTESTATION_UNTRUSTED');
  error.category = 'SEMANTIC_READINESS_ATTESTATION_UNTRUSTED';
  error.action = ACL_REMEDIATION;
  return error;
}
function assertWindowsAclTrust({ identity, owner, directoryAcl, fileAcl }) {
  const current = normalizePrincipal(identity);
  if (!current || normalizePrincipal(owner) !== current) throw windowsTrustError();
  for (const acl of [directoryAcl, fileAcl]) {
    const entries = parseWindowsAcl(acl);
    const currentEntries = entries.filter(entry => entry.principal === current);
    if (
      !currentEntries.some(entry => !entry.denied && grantsRequiredIdentityAccess(entry))
      || currentEntries.some(entry => entry.denied && grantsProtectedAccess(entry))
      || entries.some(entry => (
        !entry.denied
        && grantsProtectedAccess(entry)
        && entry.principal !== current
        && entry.principal !== 'nt authority\\\\system'
      ))
    ) throw windowsTrustError();
  }
}
function writeAttestationAtomically(readiness, metadataAdapter) {
  const temporaryPath = ATTESTATION_PATH + '.nonce.tmp';
  metadataAdapter.readCurrentIdentity();
  metadataAdapter.readReadinessAttestationDirectoryAcl();
  const descriptor = fs.openSync(temporaryPath, 'wx', 0o600);
  fs.writeSync(descriptor, JSON.stringify(readiness));
  fs.fsyncSync(descriptor);
  fs.closeSync(descriptor);
  fs.renameSync(temporaryPath, ATTESTATION_PATH);
  metadataAdapter.readReadinessAttestationAcl();
  metadataAdapter.readReadinessAttestationOwner();
  if (process.platform === 'win32') {
    if (path.dirname(temporaryPath) !== path.dirname(ATTESTATION_PATH)) throw new Error('ATTESTATION_RENAME_VOLUME_CHANGED');
    recordDirectoryFlushFallback('WINDOWS_DIRECTORY_FSYNC_UNSUPPORTED_SAME_DIRECTORY_RENAME');
  } else {
    const directoryDescriptor = fs.openSync(path.dirname(ATTESTATION_PATH), 'r');
    fs.fsyncSync(directoryDescriptor);
    fs.closeSync(directoryDescriptor);
  }
  return readiness;
}
function createSemanticReadinessAttestationStore({ metadataAdapter }) {
  return Object.freeze({
    record(readiness) { return writeAttestationAtomically(readiness, metadataAdapter); },
    read() { fs.lstatSync(ATTESTATION_PATH); return strictRead(ATTESTATION_PATH); },
    clear() { return removeAttestation(ATTESTATION_PATH); },
    validate(attestation, readiness) { return exactVersionMatch(attestation, readiness); },
  });
}
module.exports = { createSemanticReadinessAttestationStore };`;
assert.doesNotThrow(
  () => {
    assertStoreSafety(safeStore, 'safe-store.fixture.js');
    assertWindowsTrustPolicy(safeStore, 'safe-store.fixture.js');
  },
  'WP_P3_ADAPTER_LIFECYCLE_GUARD: safe non-secret store fixture was rejected',
);
for (const [name, source] of [
  ['missing-advanced-right', safeStore.replace("'RD','WD','AD','REA'", "'RD','AD','REA'")],
  ['legacy-right-regex', safeStore.replace(
    'WINDOWS_PROTECTED_RIGHTS.includes(permission)',
    '/^(?:F|M|R|RX|W|D|DC|WDAC|WO)$/.test(permission)',
  )],
]) {
  assert.throws(
    () => assertWindowsTrustPolicy(source, `${name}.fixture.js`),
    /WP_P3_ADAPTER_LIFECYCLE_GUARD/,
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: incomplete Windows rights parser fixture passed ${name}`,
  );
}
for (const [name, mutate] of [
  ['presence-only', source => source.replace(
    'record(readiness) { return writeAttestationAtomically(readiness, metadataAdapter); },',
    'record(readiness) { fs.writeFileSync(ATTESTATION_PATH, JSON.stringify(readiness)); return readiness; },',
  )],
  ['dead-atomic-helper-active-append', source => source.replace(
    'record(readiness) { return writeAttestationAtomically(readiness, metadataAdapter); },',
    'record(readiness) { fs.appendFileSync(ATTESTATION_PATH, JSON.stringify(readiness)); return readiness; },',
  )],
  ['missing-fsync', source => source.replace('fs.fsyncSync(descriptor);', '')],
  ['missing-rename', source => source.replace('fs.renameSync(temporaryPath, ATTESTATION_PATH);', '')],
  ['missing-directory-fsync', source => source.replace('fs.fsyncSync(directoryDescriptor);', '')],
  ['silent-windows-directory-omission', source => source.replace(
    "recordDirectoryFlushFallback('WINDOWS_DIRECTORY_FSYNC_UNSUPPORTED_SAME_DIRECTORY_RENAME');",
    'return readiness;',
  )],
  ['qwen-field', source => source.replace("'mismatchedChannels']", "'mismatchedChannels','QWEN_KEY']")],
  ['provider-field', source => source.replace("'mismatchedChannels']", "'mismatchedChannels','provider']")],
  ['neo4j-username-field', source => source.replace("'mismatchedChannels']", "'mismatchedChannels','neo4jUsername']")],
  ['neo4j-password-field', source => source.replace("'mismatchedChannels']", "'mismatchedChannels','neo4jPassword']")],
]) {
  assert.throws(
    () => assertStoreSafety(mutate(safeStore), `${name}.fixture.js`),
    /WP_P3_ADAPTER_LIFECYCLE_GUARD/,
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: unsafe store fixture passed ${name}`,
  );
}
assert.throws(
  () => assertStoreSafety(
    safeStore.replace(
      "'mismatchedChannels']",
      "'mismatchedChannels','credential','password']",
    ),
    'secret-store.fixture.js',
  ),
  /WP_P3_ADAPTER_LIFECYCLE_GUARD/,
  'WP_P3_ADAPTER_LIFECYCLE_GUARD: secret store fixture passed',
);

const safeLifecycleFlow = `
function createProductionSemanticOperatorJourney(dependencies) {
  assertDependencies(dependencies);
  async function runBackfill(request) {
    await dependencies.readinessAttestationStore.clear();
    return dependencies.runSemanticBackfill(request);
  }
  return Object.freeze({
    async startNewProject(request) {
      await dependencies.readinessAttestationStore.clear();
      return dependencies.initializeWorkspace(request);
    },
    runExplicitBackfill(request) { return runBackfill(request); },
    async verifyReadiness() {
      const readiness = await dependencies.readSemanticReadiness();
      if (readiness.verified !== true) throw readinessError(readiness);
      await dependencies.readinessAttestationStore.record({
        ...readiness,
        authorizationOperation: 'verifyReadiness',
      });
      return readiness;
    },
    async query(request) {
      const attestation = await dependencies.readinessAttestationStore.read();
      if (!attestation) throw readinessVerificationRequired();
      const readiness = await dependencies.readSemanticReadiness();
      if (!dependencies.readinessAttestationStore.validate(attestation, readiness)) throw stale();
      return dependencies.querySystemArchitecture(request);
    },
  });
}`;
assert.doesNotThrow(
  () => assertOperatorLifecycleFlow(safeLifecycleFlow, 'safe-lifecycle-flow.fixture.js'),
  'WP_P3_ADAPTER_LIFECYCLE_GUARD: safe lifecycle flow fixture was rejected',
);
assert.throws(
  () => assertOperatorLifecycleFlow(
    safeLifecycleFlow.replace(
      'const attestation = await dependencies.readinessAttestationStore.read();',
      'if (readinessVerified) return dependencies.querySystemArchitecture(request);\n      const attestation = await dependencies.readinessAttestationStore.read();',
    ),
    'same-process-shortcut.fixture.js',
  ),
  /WP_P3_ADAPTER_LIFECYCLE_GUARD/,
  'WP_P3_ADAPTER_LIFECYCLE_GUARD: same-process durable-validation bypass fixture passed',
);
assert.throws(
  () => assertOperatorLifecycleFlow(
    safeLifecycleFlow.replace(
      '  assertDependencies(dependencies);',
      '  dependencies = { ...dependencies, readinessAttestationStore: dependencies.readinessAttestationStore || createVolatileReadinessAttestationStore() };\n  assertDependencies(dependencies);',
    ),
    'optional-volatile-store.fixture.js',
  ),
  /WP_P3_ADAPTER_LIFECYCLE_GUARD/,
  'WP_P3_ADAPTER_LIFECYCLE_GUARD: optional volatile store fixture passed',
);
assert.throws(
  () => assertOperatorLifecycleFlow(
    safeLifecycleFlow.replace(
      'await dependencies.readinessAttestationStore.clear();\n    return dependencies.runSemanticBackfill(request);',
      'function deadClear() { return dependencies.readinessAttestationStore.clear(); }\n    return dependencies.runSemanticBackfill(request);',
    ),
    'dead-backfill-clear.fixture.js',
  ),
  /WP_P3_ADAPTER_LIFECYCLE_GUARD/,
  'WP_P3_ADAPTER_LIFECYCLE_GUARD: dead backfill clear fixture passed',
);

const safeSystemInvalidation = `
async function callTool(name, args) {
  if (name === 'backfillSystemArchitectureSemanticProjection') {
    await readinessAttestationStore.clear();
    return runtime.runSemanticBackfill(args);
  }
}
async function buildMutationResult(context, mutations, write) {
  writeGraph(context.graphPath, mutations);
  await readinessAttestationStore.clear();
  return attachMutationEmbeddingLifecycle(context);
}`;
assert.doesNotThrow(
  () => assertSystemInvalidationFlow(safeSystemInvalidation, 'safe-system-invalidation.fixture.js'),
  'WP_P3_ADAPTER_LIFECYCLE_GUARD: safe system invalidation fixture was rejected',
);
for (const [name, source] of [
  ['comment-clear', safeSystemInvalidation.replace(
    'await readinessAttestationStore.clear();\n    return runtime.runSemanticBackfill(args);',
    '// await readinessAttestationStore.clear();\n    return runtime.runSemanticBackfill(args);',
  )],
  ['dead-mutation-clear', safeSystemInvalidation.replace(
    'await readinessAttestationStore.clear();\n  return attachMutationEmbeddingLifecycle(context);',
    'function deadClear() { return readinessAttestationStore.clear(); }\n  return attachMutationEmbeddingLifecycle(context);',
  )],
]) {
  assert.throws(
    () => assertSystemInvalidationFlow(source, `${name}.fixture.js`),
    /WP_P3_ADAPTER_LIFECYCLE_GUARD/,
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: non-executing invalidation fixture passed ${name}`,
  );
}

const safeMetadataBoundary = `
function createReadinessAttestationMetadataAdapter(options = {}) {
  requireExactKeys(options, ['repositoryRoot']);
  const file = join(options.repositoryRoot, '.argo', 'temp', 'semantic-readiness-attestation.json');
  const directory = dirname(file);
  return frozenAdapter({
    readCurrentIdentity: () => spawnExact('whoami', []),
    readReadinessAttestationDirectoryAcl: () => spawnExact('icacls', [directory]),
    readReadinessAttestationAcl: () => spawnExact('icacls', [file]),
    readReadinessAttestationOwner: () => spawnExact('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', exactOwnerScript(file)]),
  });
}`;
assert.doesNotThrow(
  () => assertReadinessMetadataBoundary(safeMetadataBoundary, 'safe-metadata-boundary.fixture.js'),
  'WP_P3_ADAPTER_LIFECYCLE_GUARD: safe metadata boundary was rejected',
);
for (const [name, source] of [
  ['caller-path', safeMetadataBoundary.replace(
    "requireExactKeys(options, ['repositoryRoot']);",
    "requireExactKeys(options, ['repositoryRoot','attestationPath']);",
  ).replace(
    "const file = join(options.repositoryRoot, '.argo', 'temp', 'semantic-readiness-attestation.json');",
    'const file = options.attestationPath;',
  )],
  ['caller-command', safeMetadataBoundary.replace(
    "requireExactKeys(options, ['repositoryRoot']);",
    "requireExactKeys(options, ['repositoryRoot','command']);",
  ).replace("spawnExact('whoami', [])", 'spawnExact(options.command, [])')],
  ['caller-owner-script', safeMetadataBoundary.replace(
    "requireExactKeys(options, ['repositoryRoot']);",
    "requireExactKeys(options, ['repositoryRoot','ownerScript']);",
  ).replace('exactOwnerScript(file)', 'options.ownerScript')],
]) {
  assert.throws(
    () => assertReadinessMetadataBoundary(source, `${name}.fixture.js`),
    /WP_P3_ADAPTER_LIFECYCLE_GUARD/,
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: metadata injection fixture passed ${name}`,
  );
}

const safeErrorSerializer = `
function semanticOperatorErrorPayload(error) {
  return Object.freeze({
    category: typeof error.category === 'string' ? error.category : 'SEMANTIC_OPERATOR_ERROR',
    state: typeof error.state === 'string' ? error.state : null,
    verified: error.verified === true,
    canonicalVersion: typeof error.canonicalVersion === 'string' ? error.canonicalVersion : null,
    contentVersion: typeof error.contentVersion === 'string' ? error.contentVersion : null,
    indexVersion: typeof error.indexVersion === 'string' ? error.indexVersion : null,
    completedChannels: Array.isArray(error.completedChannels) ? [...error.completedChannels] : [],
    missingChannels: Array.isArray(error.missingChannels) ? [...error.missingChannels] : [],
    mismatchedChannels: Array.isArray(error.mismatchedChannels) ? [...error.mismatchedChannels] : [],
    fullSnapshotFallback: false,
    action: typeof error.action === 'string' ? error.action : 'Correct readiness and retry',
  });
}`;
assert.doesNotThrow(
  () => assertErrorSerializer(safeErrorSerializer, 'safe-error-serializer.fixture.js'),
  'WP_P3_ADAPTER_LIFECYCLE_GUARD: safe error serializer was rejected',
);
for (const [name, source] of [
  ['extra-message', safeErrorSerializer.replace(
    "category: typeof error.category === 'string' ? error.category : 'SEMANTIC_OPERATOR_ERROR',",
    "category: typeof error.category === 'string' ? error.category : 'SEMANTIC_OPERATOR_ERROR',\n    message: error.message,",
  )],
  ['bracket-stack', safeErrorSerializer.replace(
    "action: typeof error.action === 'string' ? error.action : 'Correct readiness and retry',",
    "action: typeof error.action === 'string' ? error.action : 'Correct readiness and retry',\n    stack: error['stack'],",
  )],
  ['constant-category', safeErrorSerializer.replace(
    "category: typeof error.category === 'string' ? error.category : 'SEMANTIC_OPERATOR_ERROR'",
    + "",
    "category: 'SEMANTIC_INDEX_NOT_ALIGNED'",
  )],
  ['wrong-state-source', safeErrorSerializer.replace(
    "state: typeof error.state === 'string' ? error.state : null",
    "state: typeof error.category === 'string' ? error.category : null",
  )],
  ['constant-verified', safeErrorSerializer.replace(
    'verified: error.verified === true',
    'verified: true',
  )],
  ['wrong-canonical-source', safeErrorSerializer.replace(
    "canonicalVersion: typeof error.canonicalVersion === 'string' ? error.canonicalVersion : null",
    "canonicalVersion: typeof error.contentVersion === 'string' ? error.contentVersion : null",
  )],
  ['constant-channels', safeErrorSerializer.replace(
    'missingChannels: Array.isArray(error.missingChannels) ? [...error.missingChannels] : []',
    'missingChannels: []',
  )],
  ['unsafe-fallback-source', safeErrorSerializer.replace(
    'fullSnapshotFallback: false',
    'fullSnapshotFallback: error.fullSnapshotFallback',
  )],
  ['constant-action', safeErrorSerializer.replace(
    "action: typeof error.action === 'string' ? error.action : 'Correct readiness and retry'",
    + "",
    "action: 'retry'",
  )],
]) {
  assert.throws(
    () => assertErrorSerializer(source, `${name}.fixture.js`),
    /WP_P3_ADAPTER_LIFECYCLE_GUARD/,
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: unsafe serializer fixture passed ${name}`,
  );
}

const authorized = (handoff.codingTargets || []).map(target => target.path).sort();
const expectedAuthorized = Object.values(paths).sort();
assert.deepStrictEqual(
  authorized,
  expectedAuthorized,
  'WP_P3_ADAPTER_LIFECYCLE_GUARD: adapter repair authorization changed',
);
for (const frozen of [
  'tests/fixtures/productionSemanticOperatorCliProcess.js',
  'tests/harness/productionSemanticOperatorAdapterLifecycleHarness.js',
  'tests/architecture/production-semantic-operator/adapter-lifecycle-boundary.guard.js',
]) {
  assert(
    handoff.frozenFiles.includes(frozen),
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: Coding handoff does not freeze ${frozen}`,
  );
}

const failures = [];
check('package-consent', () => assertPackageConsent(
  JSON.parse(read(paths.package)),
  paths.package,
), failures);
check('system-semantic-dispatch', () => assertSemanticDispatch(read(paths.system), paths.system), failures);
check('system-wire', () => assertStructuredWire(read(paths.system), paths.system), failures);
check('gateway-wire', () => assertStructuredWire(read(paths.gateway), paths.gateway), failures);
check('store-safety', () => {
  assert(exists(paths.store), `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${paths.store} missing`);
  assertStoreSafety(read(paths.store), paths.store);
  assertWindowsTrustPolicy(read(paths.store), paths.store);
}, failures);
check('shared-error', () => {
  assert(exists(paths.error), `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${paths.error} missing`);
  assertErrorSerializer(read(paths.error), paths.error);
}, failures);
check('cli-process-wire', () => {
  const source = read(paths.cli);
  for (const required of [
    'runCliProcess',
    'createSemanticOperatorJourney',
    'semanticOperatorErrorPayload',
  ]) assert(source.includes(required), `WP_P3_ADAPTER_LIFECYCLE_GUARD: CLI omits ${required}`);
  assert(!/\.stack\b/.test(source), 'WP_P3_ADAPTER_LIFECYCLE_GUARD: CLI serializes stack');
}, failures);
check('operator-attestation', () => {
  assertOperatorLifecycleFlow(read(paths.operator), paths.operator);
}, failures);
check('metadata-boundary', () => {
  assertReadinessMetadataBoundary(read(paths.metadata), paths.metadata);
}, failures);
check('default-composition-store', () => {
  const source = read(paths.system);
  assert(source.includes('createSemanticReadinessAttestationStore'));
  assert(source.includes('readinessAttestationStore'));
}, failures);
check('invalidation', () => {
  assertSystemInvalidationFlow(read(paths.system), paths.system);
}, failures);

assert.deepStrictEqual(
  failures,
  [],
  `WP_P3_ADAPTER_LIFECYCLE_GUARD: production adapter lifecycle gaps\n${failures.join('\n')}`,
);

function assertPackageConsent(packageDocument, label) {
  const command = packageDocument.scripts && packageDocument.scripts['semantic:backfill'];
  assert.strictEqual(
    command,
    'node .argo/scripts/semanticOperatorJourneyCli.js backfill',
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} must require caller --explicit-opt-in`,
  );
}

function assertSemanticDispatch(source, label) {
  const { ast, checker } = parseWithBindings(source, label);
  const callTool = functionNamed(ast, 'callTool');
  assert(callTool, `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} callTool missing`);
  const calls = executableCalls(callTool);
  const resolver = topLevelDeclaration(ast, 'resolveSemanticOperatorJourney');
  assert(resolver, `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} operator resolver binding missing`);
  const approvedDefault = topLevelDeclaration(ast, 'createDefaultProductionSemanticOperatorJourney');
  const rawDelegate = topLevelDeclaration(ast, 'executeSemanticSystemArchitectureQuery');
  assert(
    approvedDefault,
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} approved default operator factory missing`,
  );
  const resolverCall = calls.find(call => (
    ts.isIdentifier(call.expression)
    && call.expression.text === 'resolveSemanticOperatorJourney'
    && resolvesTo(call.expression, resolver, checker)
  ));
  const journeyBinding = resolverCall && nearestVariableDeclaration(resolverCall);
  const queryCall = calls.find(call => (
    staticName(call.expression) === 'query'
    && journeyBinding
    && ts.isIdentifier(receiverOf(call.expression))
    && resolvesTo(receiverOf(call.expression), journeyBinding, checker)
  ));
  const literalValues = tokenTexts(callTool).strings;
  assert(
    literalValues.has('getSystemArchitecture') && queryCall,
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} semantic query omits operator`,
  );
  assertApprovedResolverFlow(resolver, approvedDefault, rawDelegate, checker, label);
  assertNoRawDispatchFlow(
    callTool,
    approvedDefault,
    rawDelegate,
    checker,
    label,
  );
  assert(
    !calls.some(call => (
      staticName(call.expression) === 'retrieve'
      || staticName(call.expression) === 'executeSemanticSystemArchitectureQuery'
    )),
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} public dispatch falls back to raw retrieval`,
  );
  assert(
    literalValues.has('graph-tidy')
      && containsStaticMember(callTool, 'hasOwnProperty'),
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} snapshot bypasses changed`,
  );
}

function assertApprovedResolverFlow(resolver, approvedDefault, rawDelegate, checker, label) {
  const calls = executableCalls(resolver);
  assert(
    calls.some(call => callResolvesTo(call, approvedDefault, checker))
      || containsThrow(resolver),
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} missing journey neither defaults nor fails closed`,
  );
  for (const call of calls) {
    if (callResolvesTo(call, approvedDefault, checker)) continue;
    assert.fail(`WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} resolver delegates outside approved operator factory`);
  }
  assertNoBoundReference(resolver, rawDelegate, checker, label);
}

function assertNoRawDispatchFlow(root, approvedDefault, rawDelegate, checker, label) {
  const queue = [root];
  const seen = new Set();
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || seen.has(current) || current === approvedDefault) continue;
    seen.add(current);
    assertNoBoundReference(current, rawDelegate, checker, label);
    for (const call of executableCalls(current)) {
      const declaration = resolvedCallableDeclaration(call.expression, checker);
      if (!declaration || declaration === approvedDefault) continue;
      if (isFunctionLike(declaration)) queue.push(declaration);
    }
  }
}

function assertNoBoundReference(root, prohibited, checker, label) {
  if (!prohibited) return;
  walkExecutable(root, node => {
    if (ts.isIdentifier(node) && resolvesTo(node, prohibited, checker)) {
      assert.fail(`WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} public dispatch reaches bound raw retrieval`);
    }
  });
}

function callResolvesTo(call, declaration, checker) {
  return Boolean(
    call
    && ts.isIdentifier(call.expression)
    && resolvesTo(call.expression, declaration, checker)
  );
}

function resolvedCallableDeclaration(expression, checker) {
  if (!ts.isIdentifier(expression)) return undefined;
  const symbol = checker.getSymbolAtLocation(expression);
  for (const declaration of (symbol && symbol.declarations) || []) {
    if (isFunctionLike(declaration)) return declaration;
    if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
      if (isFunctionLike(declaration.initializer)) return declaration.initializer;
      if (ts.isIdentifier(declaration.initializer)) {
        return resolvedCallableDeclaration(declaration.initializer, checker);
      }
    }
  }
  return undefined;
}

function assertStructuredWire(source, label) {
  const { ast, checker } = parseWithBindings(source, label);
  const handleRequest = functionNamed(ast, 'handleRequest');
  assert(handleRequest, `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} handleRequest missing`);
  const serializer = topLevelDeclaration(ast, 'semanticOperatorErrorResult');
  assert(serializer, `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} structured serializer binding missing`);
  const calls = executableCalls(handleRequest);
  assert(
    calls.some(call => (
      ts.isIdentifier(call.expression)
      && call.expression.text === 'semanticOperatorErrorResult'
      && resolvesTo(call.expression, serializer, checker)
    )),
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} does not use structured error result`,
  );
  assert(
    !containsStaticMember(handleRequest, 'stack'),
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} exposes stack`,
  );
}

function assertStoreSafety(source, label) {
  const { ast, checker } = parseWithBindings(source, label);
  const tokens = tokenTexts(ast);
  for (const required of [
    'authorizationOperation',
    'canonicalVersion',
    'contentVersion',
    'indexVersion',
    'completedChannels',
    'missingChannels',
    'mismatchedChannels',
    'record',
    'read',
    'clear',
    'validate',
    'readCurrentIdentity',
    'readReadinessAttestationDirectoryAcl',
    'readReadinessAttestationAcl',
    'readReadinessAttestationOwner',
  ]) assert(tokens.all.has(required), `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} omits ${required}`);
  assert(
    tokens.strings.has('.argo/temp/semantic-readiness-attestation.json'),
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} attestation path changed`,
  );
  const factory = functionNamed(ast, 'createSemanticReadinessAttestationStore');
  assert(factory, `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} store factory missing`);
  const record = returnedMethods(factory).get('record');
  assert(record, `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} active record path missing`);
  const reachable = reachableFunctions(record, checker);
  const reachableCalls = reachable.flatMap(executableCalls).sort((left, right) => left.pos - right.pos);
  const fsBinding = topLevelDeclaration(ast, 'fs');
  assert(fsBinding, `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} fs binding missing`);
  const atomicOwner = reachable.find(owner => (
    executableCalls(owner).some(call => isBoundMemberCall(call, fsBinding, 'renameSync', checker))
  ));
  assert(atomicOwner, `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} active record path never atomically renames`);
  const atomicCalls = executableCalls(atomicOwner);
  const callNames = reachableCalls.map(call => staticName(call.expression));
  walk(ast, node => {
    if (
      (ts.isIdentifier(node) || ts.isStringLiteral(node))
      && /qwen|provider|neo4j.*(?:user|password)|password|credential|api[_-]?key|access[_-]?token|secret/i.test(node.text)
    ) {
      assert.fail(`WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} stores secret-bearing field ${node.text}`);
    }
    if (
      ts.isPropertyAccessExpression(node)
      && ts.isIdentifier(node.expression)
      && node.expression.text === 'process'
      && node.name.text === 'env'
    ) {
      assert.fail(`WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} reads process credentials`);
    }
  });
  for (const requiredCall of [
    'openSync',
    'writeSync',
    'fsyncSync',
    'closeSync',
    'renameSync',
  ]) {
    assert(
      callNames.includes(requiredCall),
      `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} omits atomic/trust call ${requiredCall}`,
    );
  }
  assert(
    tokens.strings.has('wx') && tokens.numbers.has('0o600'),
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} does not create an exclusive restricted temporary file`,
  );
  assert(
    tokenTexts(ast).all.has('lstatSync'),
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} does not inspect the committed record without following links`,
  );
  for (const call of reachableCalls) {
    if (['writeFileSync', 'appendFileSync', 'writeFile', 'appendFile'].includes(staticName(call.expression))) {
      assert.fail(`WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} active record path writes non-atomically`);
    }
  }
  assertCallOrder(
    atomicCalls,
    call => isBoundMemberCall(call, fsBinding, 'openSync', checker)
      && call.arguments[1]
      && ts.isStringLiteral(call.arguments[1])
      && call.arguments[1].text === 'wx'
      && call.arguments[2]
      && call.arguments[2].getText(ast) === '0o600',
    call => isBoundMemberCall(call, fsBinding, 'renameSync', checker),
    `${label} active exclusive-write-before-rename`,
  );
  for (const [first, second, stage] of [
    ['openSync', 'writeSync', 'open-before-write'],
    ['writeSync', 'fsyncSync', 'write-before-file-fsync'],
    ['fsyncSync', 'closeSync', 'file-fsync-before-close'],
    ['closeSync', 'renameSync', 'close-before-rename'],
    ['renameSync', 'readReadinessAttestationAcl', 'rename-before-file-acl'],
    ['readReadinessAttestationAcl', 'readReadinessAttestationOwner', 'acl-before-owner'],
  ]) {
    assertCallOrder(
      atomicCalls,
      call => staticName(call.expression) === first,
      call => staticName(call.expression) === second,
      `${label} active ${stage}`,
    );
  }
  assertCallOrder(
    atomicCalls,
    call => isBoundMemberCall(call, fsBinding, 'renameSync', checker),
    call => staticName(call.expression) === 'readReadinessAttestationOwner',
    `${label} rename-before-owner-verification`,
  );
  const directoryOpen = atomicCalls.find(call => (
    isBoundMemberCall(call, fsBinding, 'openSync', checker)
    && call.arguments[1]
    && ts.isStringLiteral(call.arguments[1])
    && call.arguments[1].text === 'r'
  ));
  const directoryFsync = atomicCalls.filter(call => (
    isBoundMemberCall(call, fsBinding, 'fsyncSync', checker)
  ))[1];
  assert(
    directoryOpen && directoryFsync && directoryOpen.pos < directoryFsync.pos,
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} active record path omits supported-platform directory fsync`,
  );
  assert(
    hasExplicitWindowsDirectoryFlushFallback(atomicOwner),
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} active record path silently omits Windows directory durability`,
  );
}

function assertOperatorLifecycleFlow(source, label) {
  const { ast, checker } = parseWithBindings(source, label);
  const factory = functionNamed(ast, 'createProductionSemanticOperatorJourney');
  assert(factory && factory.parameters.length === 1, `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} operator factory missing`);
  const dependencies = factory.parameters[0];
  const firstStatement = factory.body.statements[0];
  assert(
    firstStatement
      && ts.isExpressionStatement(firstStatement)
      && ts.isCallExpression(firstStatement.expression)
      && staticName(firstStatement.expression.expression) === 'assertDependencies'
      && firstStatement.expression.arguments[0]
      && ts.isIdentifier(firstStatement.expression.arguments[0])
      && resolvesTo(firstStatement.expression.arguments[0], dependencies, checker),
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} durable store is not mandatory at factory entry`,
  );
  walk(factory, node => {
    if (
      ts.isBinaryExpression(node)
      && node.operatorToken.kind === ts.SyntaxKind.EqualsToken
      && ts.isIdentifier(node.left)
      && resolvesTo(node.left, dependencies, checker)
    ) {
      assert.fail(`WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} rewrites dependencies before durable authorization`);
    }
  });
  assert(
    !tokenTexts(factory).all.has('createVolatileReadinessAttestationStore'),
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} admits a volatile authorization store`,
  );
  const runBackfill = factory.body.statements.find(statement => (
    ts.isFunctionDeclaration(statement)
    && statement.name
    && statement.name.text === 'runBackfill'
  ));
  const methods = returnedMethods(factory);
  for (const required of ['startNewProject', 'verifyReadiness', 'query']) {
    assert(methods.has(required), `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} omits ${required}`);
  }

  const backfillCalls = executableCalls(runBackfill);
  assertCallOrder(
    backfillCalls,
    call => isStoreCall(call, dependencies, 'clear', checker),
    call => isDependencyCall(call, dependencies, 'runSemanticBackfill', checker),
    `${label} backfill clear`,
  );
  const startCalls = executableCalls(methods.get('startNewProject'));
  assertCallOrder(
    startCalls,
    call => isStoreCall(call, dependencies, 'clear', checker),
    call => isDependencyCall(call, dependencies, 'initializeWorkspace', checker),
    `${label} init clear`,
  );

  const verify = methods.get('verifyReadiness');
  const verifyCalls = executableCalls(verify);
  const readCall = verifyCalls.find(call => (
    isDependencyCall(call, dependencies, 'readSemanticReadiness', checker)
  ));
  const recordCall = verifyCalls.find(call => isStoreCall(call, dependencies, 'record', checker));
  assert(
    readCall && recordCall && recordCall.pos > readCall.pos,
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} explicit verification does not record after WP-P2 read`,
  );
  assert(
    recordCall.arguments[0]
      && ts.isObjectLiteralExpression(recordCall.arguments[0])
      && recordCall.arguments[0].properties.some(property => (
        propertyName(property) === 'authorizationOperation'
        && ts.isPropertyAssignment(property)
        && ts.isStringLiteral(property.initializer)
        && property.initializer.text === 'verifyReadiness'
      )),
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} record lacks explicit verification provenance`,
  );
  const verifiedGuard = verify.body.statements.find(statement => (
    ts.isIfStatement(statement)
    && isVerifiedFalseGuard(statement.expression, checker)
    && containsThrow(statement.thenStatement)
  ));
  assert(
    verifiedGuard && recordCall.pos > verifiedGuard.end,
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} record is not dominated by verified readiness`,
  );

  const queryCalls = executableCalls(methods.get('query'));
  const queryReturns = [];
  walk(methods.get('query'), node => {
    if (ts.isReturnStatement(node)) queryReturns.push(node);
  });
  const queryReadCalls = queryCalls.filter(call => isStoreCall(call, dependencies, 'read', checker));
  const queryReadinessCalls = queryCalls.filter(call => (
    isDependencyCall(call, dependencies, 'readSemanticReadiness', checker)
  ));
  const queryValidateCalls = queryCalls.filter(call => isStoreCall(call, dependencies, 'validate', checker));
  const queryRetrievalCalls = queryCalls.filter(call => (
    isDependencyCall(call, dependencies, 'querySystemArchitecture', checker)
  ));
  assert(
    queryReadCalls.length === 1
      && queryReadinessCalls.length === 1
      && queryValidateCalls.length === 1
      && queryRetrievalCalls.length === 1,
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} query must perform exactly one durable read/readiness/validation/retrieval chain`,
  );
  assert(
    queryReturns.every(statement => statement.pos > queryValidateCalls[0].end),
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} query can return before durable validation`,
  );
  assertCallOrder(
    queryCalls,
    call => isStoreCall(call, dependencies, 'read', checker),
    call => isDependencyCall(call, dependencies, 'readSemanticReadiness', checker),
    `${label} attestation-before-readiness`,
  );
  assertCallOrder(
    queryCalls,
    call => isDependencyCall(call, dependencies, 'readSemanticReadiness', checker),
    call => isStoreCall(call, dependencies, 'validate', checker),
    `${label} readiness-before-validation`,
  );
  assertCallOrder(
    queryCalls,
    call => isStoreCall(call, dependencies, 'validate', checker),
    call => isDependencyCall(call, dependencies, 'querySystemArchitecture', checker),
    `${label} validation-before-query`,
  );
}

function assertWindowsTrustPolicy(source, label) {
  const compiledModule = { exports: {} };
  const exposePolicy = `${source}
module.exports.__assertWindowsAclTrust = typeof assertWindowsAclTrust === 'function'
  ? assertWindowsAclTrust
  : undefined;`;
  Function('require', 'module', 'exports', exposePolicy)(
    require,
    compiledModule,
    compiledModule.exports,
  );
  const policy = compiledModule.exports.__assertWindowsAclTrust;
  assert.strictEqual(
    typeof policy,
    'function',
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} Windows ACL policy boundary missing`,
  );
  const identity = 'HOST\\Derek';
  const safeAcl = [
    `${identity}:(F)`,
    'NT AUTHORITY\\SYSTEM:(F)',
    'BUILTIN\\Users:(DENY)(R)',
  ].join('\r\n');
  const evaluate = overrides => policy({
    identity,
    owner: identity,
    directoryAcl: safeAcl,
    fileAcl: safeAcl,
    ...overrides,
  });
  assert.doesNotThrow(
    () => evaluate({}),
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} rejected exact current-user/SYSTEM ACL`,
  );
  const protectedRights = [
    'F', 'M', 'RX', 'R', 'W', 'D',
    'DE', 'RC', 'WDAC', 'WO', 'S', 'AS', 'MA',
    'GR', 'GW', 'GE', 'GA',
    'RD', 'WD', 'AD', 'REA', 'WEA', 'X', 'DC', 'RA', 'WA',
  ];
  const unsafeFixtures = {
    groupOwner: { owner: 'BUILTIN\\Administrators' },
    builtinUsersRead: { fileAcl: `${safeAcl}\r\nBUILTIN\\Users:(RX)` },
    builtinAdministratorsFile: {
      fileAcl: `${safeAcl}\r\nBUILTIN\\Administrators:(R)`,
    },
    builtinAdministratorsParent: {
      directoryAcl: `${safeAcl}\r\nBUILTIN\\Administrators:(M)`,
    },
    authenticatedUsersFile: {
      fileAcl: `${safeAcl}\r\nAuthenticated Users:(R)`,
    },
    authenticatedUsersParent: {
      directoryAcl: `${safeAcl}\r\nAuthenticated Users:(RX)`,
    },
    everyoneWrite: { fileAcl: `${safeAcl}\r\nEveryone:(M)` },
    arbitraryForeignPrincipal: { fileAcl: `${safeAcl}\r\nFOREIGN\\Other:(R)` },
    missingCurrentIdentity: { fileAcl: 'NT AUTHORITY\\SYSTEM:(F)' },
    currentIdentityDeny: {
      fileAcl: `${identity}:(DENY)(R,W)\r\n${identity}:(F)\r\nNT AUTHORITY\\SYSTEM:(F)`,
    },
    compoundAdvancedForeignAllow: {
      fileAcl: `${safeAcl}\r\nFOREIGN\\Other:(OI)(CI)(WD,AD,WEA)`,
    },
    compoundAdvancedCurrentDeny: {
      directoryAcl: `${identity}:(DENY)(GR,GA,RD)\r\n${safeAcl}`,
    },
    permissiveParent: { directoryAcl: `${safeAcl}\r\nBUILTIN\\Users:(M)` },
    malformedAcl: { fileAcl: 'unparseable acl output' },
  };
  for (const right of protectedRights) {
    unsafeFixtures[`foreignFile_${right}`] = {
      fileAcl: `${safeAcl}\r\nFOREIGN\\Other:(${right})`,
    };
    unsafeFixtures[`foreignParent_${right}`] = {
      directoryAcl: `${safeAcl}\r\nFOREIGN\\Other:(${right})`,
    };
    unsafeFixtures[`currentDenyFile_${right}`] = {
      fileAcl: `${identity}:(DENY)(${right})\r\n${safeAcl}`,
    };
    unsafeFixtures[`currentDenyParent_${right}`] = {
      directoryAcl: `${identity}:(DENY)(${right})\r\n${safeAcl}`,
    };
  }
  for (const [name, overrides] of Object.entries(unsafeFixtures)) {
    assert.throws(
      () => evaluate(overrides),
      error => (
        error
        && error.category === 'SEMANTIC_READINESS_ATTESTATION_UNTRUSTED'
        && error.action === 'Restrict .argo/temp and semantic-readiness-attestation.json ownership and ACLs to the current OS identity and SYSTEM, then run semantic readiness again'
      ),
      `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} accepted unsafe Windows policy fixture ${name}`,
    );
  }
}

function assertSystemInvalidationFlow(source, label) {
  const { ast } = parseWithBindings(source, label);
  const callTool = functionNamed(ast, 'callTool');
  const mutation = functionNamed(ast, 'buildMutationResult');
  assert(callTool && mutation, `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} system paths missing`);
  const toolCalls = executableCalls(callTool);
  assertCallOrder(
    toolCalls,
    call => staticName(call.expression) === 'clear'
      && staticName(receiverOf(call.expression)) === 'readinessAttestationStore',
    call => staticName(call.expression) === 'runSemanticBackfill',
    `${label} external backfill invalidation`,
  );
  const mutationCalls = executableCalls(mutation);
  assertCallOrder(
    mutationCalls,
    call => staticName(call.expression) === 'writeGraph',
    call => staticName(call.expression) === 'clear'
      && staticName(receiverOf(call.expression)) === 'readinessAttestationStore',
    `${label} mutation invalidation`,
  );
}

function assertReadinessMetadataBoundary(source, label) {
  const { ast, checker } = parseWithBindings(source, label);
  const factory = functionNamed(ast, 'createReadinessAttestationMetadataAdapter');
  assert(factory, `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} attestation metadata factory missing`);
  const tokens = tokenTexts(factory);
  for (const required of [
    'readCurrentIdentity',
    'readReadinessAttestationDirectoryAcl',
    'readReadinessAttestationAcl',
    'readReadinessAttestationOwner',
    'exactOwnerScript',
  ]) {
    assert(tokens.all.has(required), `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} metadata boundary omits ${required}`);
  }
  for (const requiredLiteral of [
    '.argo',
    'temp',
    'semantic-readiness-attestation.json',
    'icacls',
    'whoami',
    'powershell.exe',
    '-NoProfile',
    '-NonInteractive',
    '-Command',
  ]) {
    assert(tokens.strings.has(requiredLiteral), `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} metadata literal omits ${requiredLiteral}`);
  }
  assert(
    factory.parameters.length === 1
      && ts.isIdentifier(factory.parameters[0].name),
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} metadata factory shape changed`,
  );
  const optionsBinding = factory.parameters[0];
  const optionMembers = [];
  walk(factory, node => {
    if (
      (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node))
      && ts.isIdentifier(receiverOf(node))
      && resolvesTo(receiverOf(node), optionsBinding, checker)
    ) optionMembers.push(staticName(node));
  });
  assert(
    optionMembers.length > 0 && optionMembers.every(member => member === 'repositoryRoot'),
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} metadata factory accepts caller-controlled command/path`,
  );
  const exactKeysCall = executableCalls(factory).find(call => (
    staticName(call.expression) === 'requireExactKeys'
  ));
  assert(
    exactKeysCall
      && exactKeysCall.arguments[1]
      && ts.isArrayLiteralExpression(exactKeysCall.arguments[1])
      && exactKeysCall.arguments[1].elements.length === 1
      && ts.isStringLiteral(exactKeysCall.arguments[1].elements[0])
      && exactKeysCall.arguments[1].elements[0].text === 'repositoryRoot',
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} metadata factory options are not exact`,
  );
}

function assertErrorSerializer(source, label) {
  const { ast, checker } = parseWithBindings(source, label);
  const serializer = functionNamed(ast, 'semanticOperatorErrorPayload');
  assert(
    serializer && serializer.parameters.length === 1,
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} payload serializer missing`,
  );
  const errorBinding = serializer.parameters[0];
  const returned = serializer.body.statements
    .filter(ts.isReturnStatement)
    .map(statement => unwrapCall(statement.expression))
    .find(ts.isObjectLiteralExpression);
  assert(returned, `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} serializer must return one object literal`);
  const keys = returned.properties.map(propertyName).sort();
  assert.deepStrictEqual(
    keys,
    [
      'action',
      'canonicalVersion',
      'category',
      'completedChannels',
      'contentVersion',
      'fullSnapshotFallback',
      'indexVersion',
      'mismatchedChannels',
      'missingChannels',
      'state',
      'verified',
    ].sort(),
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} error whitelist changed`,
  );
  const properties = new Map(returned.properties.map(property => [propertyName(property), property]));
  for (const field of [
    'category',
    'state',
    'verified',
    'canonicalVersion',
    'contentVersion',
    'indexVersion',
    'completedChannels',
    'missingChannels',
    'mismatchedChannels',
    'action',
  ]) {
    const property = properties.get(field);
    assert(
      ts.isPropertyAssignment(property)
        && hasOnlyExactDiagnosticSources(property.initializer, errorBinding, field, checker),
      `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} ${field} does not derive from error.${field}`,
    );
    if (field === 'verified') {
      assert(
        isExactTrueComparison(property.initializer, errorBinding, field, checker),
        `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} verified normalization changed`,
      );
    } else if (field.endsWith('Channels')) {
      assert(
        isExactChannelNormalization(property.initializer, errorBinding, field, checker),
        `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} ${field} channel normalization changed`,
      );
    } else {
      assert(
        isExactNullableStringNormalization(
          property.initializer,
          errorBinding,
          field,
          checker,
          field === 'category' || field === 'action',
        ),
        `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} ${field} string normalization changed`,
      );
    }
  }
  const fallback = properties.get('fullSnapshotFallback');
  assert(
    ts.isPropertyAssignment(fallback)
      && fallback.initializer.kind === ts.SyntaxKind.FalseKeyword,
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} fullSnapshotFallback must be literal false`,
  );
  assert(!containsStaticMember(serializer, 'stack'), `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} serializer reads stack`);
}

function functionNamed(ast, name) {
  return ast.statements.find(statement => (
    ts.isFunctionDeclaration(statement)
    && statement.name
    && statement.name.text === name
  ));
}

function returnedMethods(factory) {
  const returned = factory.body.statements
    .filter(ts.isReturnStatement)
    .map(statement => unwrapCall(statement.expression))
    .find(ts.isObjectLiteralExpression);
  assert(returned, 'WP_P3_ADAPTER_LIFECYCLE_GUARD: operator return object missing');
  return new Map(returned.properties.map(property => [propertyName(property), property]));
}

function propertyName(property) {
  const name = property && property.name;
  if (!name) return '';
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text;
  return '';
}

function unwrapCall(expression) {
  let current = expression;
  while (
    current
    && (
      ts.isParenthesizedExpression(current)
      || ts.isAsExpression(current)
      || ts.isTypeAssertionExpression(current)
    )
  ) current = current.expression;
  if (
    current
    && ts.isCallExpression(current)
    && current.arguments.length === 1
    && staticName(current.expression) === 'freeze'
  ) return current.arguments[0];
  return current;
}

function executableCalls(root) {
  if (!root) return [];
  const calls = [];
  const rootFunction = root;
  function visit(node) {
    if (node !== rootFunction && isFunctionLike(node)) return;
    if (ts.isCallExpression(node)) calls.push(node);
    ts.forEachChild(node, visit);
  }
  visit(root);
  return calls.sort((left, right) => left.pos - right.pos);
}

function isFunctionLike(node) {
  return ts.isFunctionDeclaration(node)
    || ts.isFunctionExpression(node)
    || ts.isArrowFunction(node)
    || ts.isMethodDeclaration(node)
    || ts.isGetAccessorDeclaration(node)
    || ts.isSetAccessorDeclaration(node);
}

function staticName(expression) {
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) return expression.name.text;
  if (
    ts.isElementAccessExpression(expression)
    && expression.argumentExpression
    && (ts.isStringLiteral(expression.argumentExpression) || ts.isNoSubstitutionTemplateLiteral(expression.argumentExpression))
  ) return expression.argumentExpression.text;
  return '';
}

function reachableFunctions(root, checker) {
  const reachable = [];
  const queue = [root];
  const seen = new Set();
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || seen.has(current)) continue;
    seen.add(current);
    reachable.push(current);
    for (const call of executableCalls(current)) {
      if (!ts.isIdentifier(call.expression)) continue;
      const symbol = checker.getSymbolAtLocation(call.expression);
      for (const declaration of (symbol && symbol.declarations) || []) {
        if (isFunctionLike(declaration)) queue.push(declaration);
        if (
          ts.isVariableDeclaration(declaration)
          && declaration.initializer
          && isFunctionLike(declaration.initializer)
        ) queue.push(declaration.initializer);
      }
    }
  }
  return reachable;
}

function isBoundMemberCall(call, binding, member, checker) {
  if (!call || staticName(call.expression) !== member) return false;
  const receiver = receiverOf(call.expression);
  return ts.isIdentifier(receiver) && resolvesTo(receiver, binding, checker);
}

function hasExplicitWindowsDirectoryFlushFallback(root) {
  let matched = false;
  walk(root, node => {
    if (!ts.isIfStatement(node)) return;
    const conditionTokens = tokenTexts(node.expression);
    if (!conditionTokens.all.has('platform') || !conditionTokens.strings.has('win32')) return;
    const branchTokens = tokenTexts(node.thenStatement);
    const branchCalls = executableCalls(node.thenStatement);
    const dirnameCalls = branchCalls.filter(call => staticName(call.expression) === 'dirname');
    if (
      branchTokens.strings.has('WINDOWS_DIRECTORY_FSYNC_UNSUPPORTED_SAME_DIRECTORY_RENAME')
      && dirnameCalls.length >= 2
      && containsThrow(node.thenStatement)
      && branchCalls.some(call => staticName(call.expression) === 'recordDirectoryFlushFallback')
    ) matched = true;
  });
  return matched;
}

function hasOnlyExactDiagnosticSources(expression, errorBinding, field, checker) {
  const sources = [];
  walk(expression, node => {
    if (
      (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node))
      && ts.isIdentifier(receiverOf(node))
      && resolvesTo(receiverOf(node), errorBinding, checker)
    ) sources.push(staticName(node));
  });
  return sources.length > 0 && sources.every(source => source === field);
}

function isExactTrueComparison(expression, errorBinding, field, checker) {
  return ts.isBinaryExpression(expression)
    && expression.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken
    && isDiagnosticMember(expression.left, errorBinding, field, checker)
    && expression.right.kind === ts.SyntaxKind.TrueKeyword;
}

function isExactNullableStringNormalization(
  expression,
  errorBinding,
  field,
  checker,
  requireStringFallback,
) {
  if (!ts.isConditionalExpression(expression)) return false;
  const condition = expression.condition;
  if (
    !ts.isBinaryExpression(condition)
    || condition.operatorToken.kind !== ts.SyntaxKind.EqualsEqualsEqualsToken
    || !ts.isTypeOfExpression(condition.left)
    || !isDiagnosticMember(condition.left.expression, errorBinding, field, checker)
    || !ts.isStringLiteral(condition.right)
    || condition.right.text !== 'string'
    || !isDiagnosticMember(expression.whenTrue, errorBinding, field, checker)
  ) return false;
  return requireStringFallback
    ? ts.isStringLiteral(expression.whenFalse) && expression.whenFalse.text.trim() !== ''
    : expression.whenFalse.kind === ts.SyntaxKind.NullKeyword;
}

function isExactChannelNormalization(expression, errorBinding, field, checker) {
  if (!ts.isConditionalExpression(expression)) return false;
  const condition = expression.condition;
  if (
    !ts.isCallExpression(condition)
    || staticName(condition.expression) !== 'isArray'
    || condition.arguments.length !== 1
    || !isDiagnosticMember(condition.arguments[0], errorBinding, field, checker)
    || !ts.isArrayLiteralExpression(expression.whenTrue)
    || expression.whenTrue.elements.length !== 1
    || !ts.isSpreadElement(expression.whenTrue.elements[0])
    || !isDiagnosticMember(expression.whenTrue.elements[0].expression, errorBinding, field, checker)
    || !ts.isArrayLiteralExpression(expression.whenFalse)
    || expression.whenFalse.elements.length !== 0
  ) return false;
  return staticName(receiverOf(condition.expression)) === 'Array';
}

function isDiagnosticMember(expression, errorBinding, field, checker) {
  return Boolean(
    expression
    && (ts.isPropertyAccessExpression(expression) || ts.isElementAccessExpression(expression))
    && staticName(expression) === field
    && ts.isIdentifier(receiverOf(expression))
    && resolvesTo(receiverOf(expression), errorBinding, checker),
  );
}

function tokenTexts(root) {
  const all = new Set();
  const strings = new Set();
  const numbers = new Set();
  walk(root, node => {
    if (ts.isIdentifier(node)) all.add(node.text);
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      all.add(node.text);
      strings.add(node.text);
    }
    if (ts.isNumericLiteral(node)) {
      all.add(node.getText());
      numbers.add(node.getText());
    }
  });
  return { all, strings, numbers };
}

function nearestVariableDeclaration(node) {
  let current = node && node.parent;
  while (current) {
    if (ts.isVariableDeclaration(current)) return current;
    if (isFunctionLike(current)) return undefined;
    current = current.parent;
  }
  return undefined;
}

function isVerifiedFalseGuard(expression) {
  if (!ts.isBinaryExpression(expression)) return false;
  const operator = expression.operatorToken.kind;
  if (
    operator !== ts.SyntaxKind.ExclamationEqualsEqualsToken
    && operator !== ts.SyntaxKind.ExclamationEqualsToken
  ) return false;
  return (
    staticName(expression.left) === 'verified'
    && expression.right.kind === ts.SyntaxKind.TrueKeyword
  ) || (
    staticName(expression.right) === 'verified'
    && expression.left.kind === ts.SyntaxKind.TrueKeyword
  );
}

function containsStaticMember(root, name) {
  let found = false;
  walk(root, node => {
    if (
      (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node))
      && staticName(node) === name
    ) found = true;
  });
  return found;
}

function isDependencyCall(call, dependencies, member, checker) {
  if (!call || staticName(call.expression) !== member) return false;
  const receiver = receiverOf(call.expression);
  return ts.isIdentifier(receiver) && resolvesTo(receiver, dependencies, checker);
}

function isStoreCall(call, dependencies, member, checker) {
  if (!call || staticName(call.expression) !== member) return false;
  const store = receiverOf(call.expression);
  if (!store || staticName(store) !== 'readinessAttestationStore') return false;
  const root = receiverOf(store);
  return ts.isIdentifier(root) && resolvesTo(root, dependencies, checker);
}

function receiverOf(expression) {
  if (ts.isPropertyAccessExpression(expression) || ts.isElementAccessExpression(expression)) {
    return expression.expression;
  }
  return undefined;
}

function assertCallOrder(calls, firstPredicate, secondPredicate, label) {
  const first = calls.find(firstPredicate);
  const second = calls.find(secondPredicate);
  assert(
    first && second && first.pos < second.pos,
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} is absent, dead, or out of order`,
  );
}

function containsThrow(root) {
  let found = false;
  walk(root, node => {
    if (ts.isThrowStatement(node)) found = true;
  });
  return found;
}

function topLevelDeclaration(ast, name) {
  for (const statement of ast.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name && statement.name.text === name) return statement;
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === name) return declaration;
      if (ts.isObjectBindingPattern(declaration.name)) {
        const element = declaration.name.elements.find(item => item.name.text === name);
        if (element) return element;
      }
    }
  }
  return undefined;
}

function resolvesTo(identifier, declaration, checker) {
  const symbol = checker.getSymbolAtLocation(identifier);
  return Boolean(symbol && (symbol.declarations || []).includes(declaration));
}

function parse(source, label) {
  const ast = ts.createSourceFile(label, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  assert.strictEqual(
    ast.parseDiagnostics.length,
    0,
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} is not parseable JavaScript`,
  );
  return ast;
}

function parseWithBindings(source, label) {
  const fileName = path.resolve(repoRoot, `.argo/temp/${label.replace(/[^a-z0-9_.-]/gi, '_')}`);
  const host = ts.createCompilerHost({
    allowJs: true,
    checkJs: false,
    noEmit: true,
    target: ts.ScriptTarget.Latest,
  });
  host.getSourceFile = requested => (
    path.resolve(requested) === fileName
      ? ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
      : undefined
  );
  host.fileExists = requested => path.resolve(requested) === fileName;
  host.readFile = requested => (path.resolve(requested) === fileName ? source : undefined);
  const program = ts.createProgram([fileName], {
    allowJs: true,
    checkJs: false,
    noEmit: true,
    target: ts.ScriptTarget.Latest,
  }, host);
  const ast = program.getSourceFile(fileName);
  assert(ast, `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} parse failed`);
  assert.strictEqual(ast.parseDiagnostics.length, 0, `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} is not parseable JavaScript`);
  return { ast, checker: program.getTypeChecker() };
}

function walk(node, visit) {
  visit(node);
  ts.forEachChild(node, child => walk(child, visit));
}

function walkExecutable(root, visit) {
  const rootFunction = root;
  function inspect(node) {
    if (node !== rootFunction && isFunctionLike(node)) return;
    visit(node);
    ts.forEachChild(node, inspect);
  }
  inspect(root);
}

function check(scope, operation, failures) {
  try {
    operation();
  } catch (error) {
    failures.push(`${scope}: ${error.message}`);
  }
}

function occurrences(source, value) {
  return source.split(value).length - 1;
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, ...relativePath.split('/')));
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

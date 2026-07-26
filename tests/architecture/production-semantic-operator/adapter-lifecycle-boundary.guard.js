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
function resolveSemanticOperatorJourney(dependencies) { return dependencies.semanticOperatorJourney; }
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
const ATTESTATION_PATH = '.argo/temp/semantic-readiness-attestation.json';
const FIELDS = ['authorizationOperation','canonicalVersion','contentVersion','indexVersion','completedChannels','missingChannels','mismatchedChannels'];
function createSemanticReadinessAttestationStore({ metadataAdapter }) {
  return Object.freeze({
    record(readiness) {
      const temporaryPath = ATTESTATION_PATH + '.nonce.tmp';
      const descriptor = fs.openSync(temporaryPath, 'wx', 0o600);
      fs.writeSync(descriptor, JSON.stringify(readiness));
      fs.fsyncSync(descriptor);
      fs.closeSync(descriptor);
      metadataAdapter.readCurrentIdentity();
      metadataAdapter.readReadinessAttestationDirectoryAcl();
      metadataAdapter.readReadinessAttestationAcl();
      fs.renameSync(temporaryPath, ATTESTATION_PATH);
      return readiness;
    },
    read() { fs.lstatSync(ATTESTATION_PATH); return strictRead(ATTESTATION_PATH); },
    clear() { return removeAttestation(ATTESTATION_PATH); },
    validate(attestation, readiness) { return exactVersionMatch(attestation, readiness); },
  });
}
module.exports = { createSemanticReadinessAttestationStore };`;
assert.doesNotThrow(
  () => assertStoreSafety(safeStore, 'safe-store.fixture.js'),
  'WP_P3_ADAPTER_LIFECYCLE_GUARD: safe non-secret store fixture was rejected',
);
for (const [name, mutate] of [
  ['presence-only', source => source.replace(
    "const descriptor = fs.openSync(temporaryPath, 'wx', 0o600);",
    "fs.writeFileSync(ATTESTATION_PATH, JSON.stringify(readiness));\n      const descriptor = 1;",
  )],
  ['missing-fsync', source => source.replace('fs.fsyncSync(descriptor);', '')],
  ['missing-rename', source => source.replace('fs.renameSync(temporaryPath, ATTESTATION_PATH);', '')],
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
    category: error.category,
    state: error.state,
    verified: error.verified,
    canonicalVersion: error.canonicalVersion,
    contentVersion: error.contentVersion,
    indexVersion: error.indexVersion,
    completedChannels: error.completedChannels,
    missingChannels: error.missingChannels,
    mismatchedChannels: error.mismatchedChannels,
    fullSnapshotFallback: false,
    action: error.action,
  });
}`;
assert.doesNotThrow(
  () => assertErrorSerializer(safeErrorSerializer, 'safe-error-serializer.fixture.js'),
  'WP_P3_ADAPTER_LIFECYCLE_GUARD: safe error serializer was rejected',
);
for (const [name, source] of [
  ['extra-message', safeErrorSerializer.replace(
    'category: error.category,',
    'category: error.category,\n    message: error.message,',
  )],
  ['bracket-stack', safeErrorSerializer.replace(
    'action: error.action,',
    "action: error.action,\n    stack: error['stack'],",
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
  assert(
    !calls.some(call => staticName(call.expression) === 'retrieve'),
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} public dispatch calls retrieval directly`,
  );
  assert(
    literalValues.has('graph-tidy')
      && containsStaticMember(callTool, 'hasOwnProperty'),
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} snapshot bypasses changed`,
  );
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
  const { ast } = parseWithBindings(source, label);
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
  ]) assert(tokens.all.has(required), `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} omits ${required}`);
  assert(
    tokens.strings.has('.argo/temp/semantic-readiness-attestation.json'),
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} attestation path changed`,
  );
  const callNames = [];
  walk(ast, node => {
    if (ts.isCallExpression(node)) callNames.push(staticName(node.expression));
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
    'lstatSync',
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
  walk(ast, node => {
    if (
      ts.isCallExpression(node)
      && staticName(node.expression) === 'writeFileSync'
      && node.arguments[0]
      && node.arguments[0].getText(ast).includes('ATTESTATION_PATH')
    ) {
      assert.fail(`WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} writes final attestation non-atomically`);
    }
  });
}

function assertOperatorLifecycleFlow(source, label) {
  const { ast, checker } = parseWithBindings(source, label);
  const factory = functionNamed(ast, 'createProductionSemanticOperatorJourney');
  assert(factory && factory.parameters.length === 1, `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} operator factory missing`);
  const dependencies = factory.parameters[0];
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
  ]) {
    assert(tokens.all.has(required), `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} metadata boundary omits ${required}`);
  }
  for (const requiredLiteral of [
    '.argo',
    'temp',
    'semantic-readiness-attestation.json',
    'icacls',
    'whoami',
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
  const { ast } = parseWithBindings(source, label);
  const serializer = functionNamed(ast, 'semanticOperatorErrorPayload');
  assert(serializer, `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} payload serializer missing`);
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

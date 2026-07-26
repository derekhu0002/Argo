const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const paths = {
  operator: '.argo/scripts/graph-rag/semanticOperatorJourney.js',
  store: '.argo/scripts/graph-rag/semanticReadinessAttestationStore.js',
  error: '.argo/scripts/graph-rag/semanticOperatorError.js',
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

const safeWire = `
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

const safeStore = `
const ATTESTATION_PATH = '.argo/temp/semantic-readiness-attestation.json';
const FIELDS = ['canonicalVersion','contentVersion','indexVersion','completedChannels','missingChannels','mismatchedChannels'];
function createSemanticReadinessAttestationStore() {
  return Object.freeze({
    record(readiness) { return atomicRename(readiness); },
    read() { return rejectSymbolicLinkAndRead(ATTESTATION_PATH); },
    clear() { return removeAttestation(ATTESTATION_PATH); },
    validate(attestation, readiness) { return exactVersionMatch(attestation, readiness); },
  });
}
module.exports = { createSemanticReadinessAttestationStore };`;
assert.doesNotThrow(
  () => assertStoreSafety(safeStore, 'safe-store.fixture.js'),
  'WP_P3_ADAPTER_LIFECYCLE_GUARD: safe non-secret store fixture was rejected',
);
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
  const source = read(paths.error);
  assert(source.includes('semanticOperatorErrorPayload'));
  assert(source.includes('semanticOperatorErrorResult'));
  assert(!/\.stack\b/.test(source));
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
  const source = read(paths.operator);
  for (const required of [
    'readinessAttestationStore',
    '.record(',
    '.read(',
    '.clear(',
    '.validate(',
  ]) assert(source.includes(required), `WP_P3_ADAPTER_LIFECYCLE_GUARD: operator omits ${required}`);
}, failures);
check('default-composition-store', () => {
  const source = read(paths.system);
  assert(source.includes('createSemanticReadinessAttestationStore'));
  assert(source.includes('readinessAttestationStore'));
}, failures);
check('invalidation', () => {
  const source = read(paths.system);
  assert(
    occurrences(source, '.clear(') >= 2,
    'WP_P3_ADAPTER_LIFECYCLE_GUARD: backfill/mutation invalidation missing',
  );
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
  const ast = parse(source, label);
  const callTool = functionNamed(ast, 'callTool');
  assert(callTool, `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} callTool missing`);
  const text = callTool.getText(ast);
  assert(
    /getSystemArchitecture/.test(text) && /\.query\s*\(/.test(text),
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} semantic query omits operator`,
  );
  assert(
    !/\.retrieve\s*\(/.test(text),
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} public dispatch calls retrieval directly`,
  );
  assert(
    /graph-tidy/.test(text) && /hasOwnProperty/.test(text),
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} snapshot bypasses changed`,
  );
}

function assertStructuredWire(source, label) {
  const ast = parse(source, label);
  const handleRequest = functionNamed(ast, 'handleRequest');
  assert(handleRequest, `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} handleRequest missing`);
  const text = handleRequest.getText(ast);
  assert(
    /semanticOperatorErrorResult\s*\(/.test(text),
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} does not use structured error result`,
  );
  assert(
    !/\.stack\b/.test(text),
    `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} exposes stack`,
  );
}

function assertStoreSafety(source, label) {
  const ast = parse(source, label);
  for (const required of [
    '.argo/temp/semantic-readiness-attestation.json',
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
  ]) assert(source.includes(required), `WP_P3_ADAPTER_LIFECYCLE_GUARD: ${label} omits ${required}`);
  walk(ast, node => {
    if (
      (ts.isIdentifier(node) || ts.isStringLiteral(node))
      && /password|credential|api[_-]?key|access[_-]?token|secret/i.test(node.text)
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
}

function functionNamed(ast, name) {
  return ast.statements.find(statement => (
    ts.isFunctionDeclaration(statement)
    && statement.name
    && statement.name.text === name
  ));
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

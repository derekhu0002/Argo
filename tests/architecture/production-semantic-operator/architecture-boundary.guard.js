const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const root = read('OVERALL_ARCHITECTURE.md');
const local = read('.argo/scripts/graph-rag/ARCHITECTURE.md');
const tests = read('tests/ARCHITECTURE.md');
const handoff = JSON.parse(read('.argo/temp/ImplementationToCodingHandoff.json'));
const operatorPath = '.argo/scripts/graph-rag/semanticOperatorJourney.js';

// GIVEN the approved WP-P3 operator-release boundary over accepted WP-P1/WP-P2 services
// WHEN root, local, test, and Coding contracts are inspected
// THEN composition may sequence public ports but cannot reopen their internal behavior
for (const required of [
  'Production Semantic Operator Journey',
  'semanticOperatorJourney.js',
  'createProductionSemanticOperatorJourney(dependencies)',
  'startNewProject',
  'runExplicitBackfill',
  'verifyReadiness',
  'createDefaultSemanticRetrieval(dependencies).readReadiness()',
  'readFullSnapshot',
  'SemanticIndexPending',
  'automatic-backfill opt-in',
  'approved external configuration',
  'approved configuration validation precedes',
  'progress',
  'checkpoint',
  'failure',
  'resume',
  'canonical JSON remains authoritative',
  'no-argument full snapshot',
  'WP-P1',
  'WP-P2',
  'runner-owned',
  'runNewProjectSemanticOperatorJourney.js',
]) {
  assert(
    root.toLowerCase().includes(required.toLowerCase())
      || local.toLowerCase().includes(required.toLowerCase())
      || tests.toLowerCase().includes(required.toLowerCase()),
    `WP_P3_ARCHITECTURE_BOUNDARY_GUARD: contract omits ${required}`,
  );
}

const authorization = JSON.stringify({
  summary: handoff.summary,
  codingTargets: handoff.codingTargets,
  taskExecutionPlan: handoff.taskExecutionPlan,
  openGaps: handoff.openGaps,
});
for (const prohibited of [
  'productionSemanticBackfill.js',
  'productionSemanticCheckpointStore.js',
  'productionSemanticNeo4jAdapter.js',
  'productionSemanticProjectionStore.js',
  'liveEmbeddingProviderConfig.js',
  'productionGraphRagRuntime.js',
]) {
  assert(
    !handoff.codingTargets.some(target => target.path.endsWith(prohibited)),
    `WP_P3_ARCHITECTURE_BOUNDARY_GUARD: accepted internal boundary reauthorized ${prohibited}`,
  );
}
assert(
  handoff.frozenFiles.includes('.argo/scripts/graph-rag/defaultSemanticRetrieval.js'),
  'WP_P3_ARCHITECTURE_BOUNDARY_GUARD: accepted readiness boundary is not repair-frozen',
);
assert(
  /runner-owned deliveryStatus/i.test(authorization),
  'WP_P3_ARCHITECTURE_BOUNDARY_GUARD: runner-owned deliveryStatus authority missing',
);

if (exists(operatorPath)) {
  assertOperatorConsentAndReadinessPolicy(read(operatorPath), operatorPath);
}

const safeOperatorFixture = `
function createProductionSemanticOperatorJourney(dependencies) {
  let readinessVerified = false;
  return Object.freeze({
    runExplicitBackfill(request = {}) {
      return dependencies.runSemanticBackfill({
        ...request,
        explicitOptIn: request.explicitOptIn,
      });
    },
    async verifyReadiness() {
      const readiness = await dependencies.readSemanticReadiness();
      if (!readiness || readiness.verified !== true) throw readinessError(readiness);
      readinessVerified = true;
      return readiness;
    },
    query(request = {}) {
      if (!readinessVerified) throw readinessVerificationRequired();
      return dependencies.querySystemArchitecture({ query: request });
    },
  });
}`;
assert.doesNotThrow(
  () => assertOperatorConsentAndReadinessPolicy(safeOperatorFixture, 'safe-operator-policy.fixture.js'),
  'WP_P3_ARCHITECTURE_BOUNDARY_GUARD: safe operator policy fixture was rejected',
);
for (const fixture of [
  {
    name: 'forced-explicit-consent',
    source: safeOperatorFixture.replace(
      'explicitOptIn: request.explicitOptIn',
      'explicitOptIn: true',
    ),
  },
  {
    name: 'implicit-readiness-query',
    source: safeOperatorFixture.replace(
      'if (!readinessVerified) throw readinessVerificationRequired();',
      'const readiness = await dependencies.readSemanticReadiness();',
    ).replace(
      'query(request = {}) {',
      'async query(request = {}) {',
    ),
  },
  {
    name: 'duplicated-readiness-policy',
    source: safeOperatorFixture.replace(
      'function createProductionSemanticOperatorJourney',
      "const REQUIRED_CHANNELS = ['Element', 'ArchitectureRelationship', 'View'];\nfunction isCompleteAlignedReadiness(readiness) { return REQUIRED_CHANNELS.every(channel => readiness.completedChannels.includes(channel)); }\nfunction createProductionSemanticOperatorJourney",
    ).replace(
      'readiness.verified !== true',
      '!isCompleteAlignedReadiness(readiness)',
    ),
  },
]) {
  assert.throws(
    () => assertOperatorConsentAndReadinessPolicy(
      fixture.source,
      `${fixture.name}.fixture.js`,
    ),
    /WP_P3_ARCHITECTURE_BOUNDARY_GUARD/,
    `WP_P3_ARCHITECTURE_BOUNDARY_GUARD: bypass fixture passed ${fixture.name}`,
  );
}

function assertOperatorConsentAndReadinessPolicy(source, label) {
  const ast = ts.createSourceFile(label, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const violations = [];
  assert.strictEqual(
    ast.parseDiagnostics.length,
    0,
    `WP_P3_ARCHITECTURE_BOUNDARY_GUARD: ${label} is not parseable JavaScript`,
  );
  let factory;
  walk(ast, node => {
    if (
      ts.isFunctionDeclaration(node)
      && node.name
      && node.name.text === 'createProductionSemanticOperatorJourney'
    ) factory = node;
    if (
      ts.isVariableDeclaration(node)
      && ts.isIdentifier(node.name)
      && node.name.text === 'REQUIRED_CHANNELS'
    ) {
      violations.push('duplicates readiness channels');
    }
    if (
      ts.isFunctionDeclaration(node)
      && node.name
      && /complete.*aligned.*readiness/i.test(node.name.text)
    ) {
      violations.push('duplicates readiness verdict policy');
    }
  });
  assert(factory, `WP_P3_ARCHITECTURE_BOUNDARY_GUARD: ${label} operator factory missing`);
  const boundary = findReturnedFrozenObject(factory, label);
  const methods = new Map(boundary.properties.map(property => [propertyName(property), property]));
  for (const method of ['runExplicitBackfill', 'verifyReadiness', 'query']) {
    assert(methods.has(method), `WP_P3_ARCHITECTURE_BOUNDARY_GUARD: ${label} omits ${method}`);
  }
  walk(factory, node => {
    if (
      ts.isPropertyAssignment(node)
      && propertyName(node) === 'explicitOptIn'
      && node.initializer.kind === ts.SyntaxKind.TrueKeyword
    ) {
      violations.push('promotes consent to literal true');
    }
  });
  const queryReadCount = countDependencyCalls(methods.get('query'), 'readSemanticReadiness');
  const queryText = methods.get('query').getText(ast);
  if (
    queryReadCount > 1
    || (
      queryReadCount === 1
      && (!queryText.includes('readinessAttestationStore') || !queryText.includes('.validate('))
    )
  ) {
    violations.push('query readiness read is not attestation-dominated stale validation');
  }
  if (countCalls(methods.get('query'), 'verifyReadiness') !== 0) {
    violations.push('query performs implicit readiness verification');
  }
  if (!referencesProperty(methods.get('verifyReadiness'), 'verified')) {
    violations.push('verifyReadiness does not consume WP-P2 verified verdict');
  }
  for (const duplicatedPolicyCall of ['every', 'includes']) {
    if (countCalls(factory, duplicatedPolicyCall) !== 0) {
      violations.push(`duplicates readiness ${duplicatedPolicyCall} policy`);
    }
  }
  assert.deepStrictEqual(
    violations,
    [],
    `WP_P3_ARCHITECTURE_BOUNDARY_GUARD: ${label} ${violations.join('; ')}`,
  );
}

function findReturnedFrozenObject(factory, label) {
  let found;
  for (const node of factory.body.statements) {
    if (
      ts.isReturnStatement(node)
      && node.expression
      && ts.isCallExpression(node.expression)
      && ts.isPropertyAccessExpression(node.expression.expression)
      && node.expression.expression.expression.getText() === 'Object'
      && node.expression.expression.name.text === 'freeze'
      && ts.isObjectLiteralExpression(node.expression.arguments[0])
    ) found = node.expression.arguments[0];
  }
  assert(found, `WP_P3_ARCHITECTURE_BOUNDARY_GUARD: ${label} frozen operator surface missing`);
  return found;
}

function countDependencyCalls(root, method) {
  let count = 0;
  walk(root, node => {
    if (
      ts.isCallExpression(node)
      && ts.isPropertyAccessExpression(node.expression)
      && node.expression.name.text === method
      && ts.isIdentifier(node.expression.expression)
      && node.expression.expression.text === 'dependencies'
    ) count += 1;
  });
  return count;
}

function countCalls(root, method) {
  let count = 0;
  walk(root, node => {
    if (
      ts.isCallExpression(node)
      && (
        (ts.isIdentifier(node.expression) && node.expression.text === method)
        || (
          ts.isPropertyAccessExpression(node.expression)
          && node.expression.name.text === method
        )
      )
    ) count += 1;
  });
  return count;
}

function referencesProperty(root, property) {
  let found = false;
  walk(root, node => {
    if (ts.isPropertyAccessExpression(node) && node.name.text === property) found = true;
  });
  return found;
}

function propertyName(property) {
  const name = property.name;
  return name && (ts.isIdentifier(name) || ts.isStringLiteral(name)) ? name.text : '';
}

function walk(node, visitor) {
  if (!node) return;
  visitor(node);
  ts.forEachChild(node, child => walk(child, visitor));
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, ...relativePath.split('/')));
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

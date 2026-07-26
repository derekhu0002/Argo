const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const operatorPath = '.argo/scripts/graph-rag/semanticOperatorJourney.js';
const systemPath = '.argo/scripts/systemarchitecture-mcp-server.js';
const handoff = JSON.parse(read('.argo/temp/ImplementationToCodingHandoff.json'));
const local = read('.argo/scripts/graph-rag/ARCHITECTURE.md');

const exactOperatorPorts = [
  'initializeWorkspace',
  'syncCanonicalStructuralProjection',
  'resolveApprovedConfiguration',
  'runSemanticBackfill',
  'readSemanticReadiness',
  'querySystemArchitecture',
].sort();
const requiredFactoryImports = new Map([
  ['createProductionSemanticOperatorJourney', './graph-rag/semanticOperatorJourney.js'],
  ['createProductionGraphRagRuntime', './graph-rag/productionGraphRagRuntime.js'],
  ['createDefaultSemanticRetrieval', './graph-rag/defaultSemanticRetrieval.js'],
  ['resolveApprovedLiveConfiguration', './graph-rag/liveEmbeddingProviderConfig.js'],
]);
const requiredToolCalls = [
  'backfillSystemArchitectureSemanticProjection',
  'verifySystemArchitectureSemanticReadiness',
  'getSystemArchitecture',
];

// GIVEN WP-P3 may compose, but may not replace, accepted WP-P1/WP-P2 boundaries
// WHEN contracts, authorization, and materialized default wiring are structurally inspected
// THEN imports, invocations, tool calls, and the exact six-port dependency object are mandatory
for (const required of [
  ...exactOperatorPorts,
  ...requiredFactoryImports.keys(),
  'startNewProjectSemanticJourney',
  ...requiredToolCalls,
]) {
  assert(
    local.includes(required) || JSON.stringify(handoff.taskExecutionPlan).includes(required),
    `WP_P3_DEFAULT_WIRING_GUARD: contract or plan omits ${required}`,
  );
}

if (exists(operatorPath)) {
  assertDefaultComposition(read(systemPath), systemPath);
}

const safeFixture = `
const { createProductionSemanticOperatorJourney } = require('./graph-rag/semanticOperatorJourney.js');
const { createProductionGraphRagRuntime } = require('./graph-rag/productionGraphRagRuntime.js');
const { createDefaultSemanticRetrieval } = require('./graph-rag/defaultSemanticRetrieval.js');
const { resolveApprovedLiveConfiguration } = require('./graph-rag/liveEmbeddingProviderConfig.js');
function createDefaultProductionSemanticOperatorJourney() {
  const runtime = createProductionGraphRagRuntime({});
  const retrieval = createDefaultSemanticRetrieval({});
  return createProductionSemanticOperatorJourney({
    initializeWorkspace: request => initializeWorkspace(request),
    syncCanonicalStructuralProjection: request => syncCanonicalStructuralProjection(request),
    resolveApprovedConfiguration: request => resolveApprovedLiveConfiguration(request),
    runSemanticBackfill: request => callTool('backfillSystemArchitectureSemanticProjection', request, { runtime }),
    readSemanticReadiness: request => callTool('verifySystemArchitectureSemanticReadiness', request, { runtime }),
    querySystemArchitecture: request => callTool('getSystemArchitecture', request, { retrieval }),
  });
}`;

assert.doesNotThrow(
  () => assertDefaultComposition(safeFixture, 'safe-default-composition.fixture.js'),
  'WP_P3_DEFAULT_WIRING_GUARD: safe structural fixture was rejected',
);

const bypassFixtures = [
  {
    name: 'comments-only',
    source: `// ${safeFixture.replace(/\n/g, '\n// ')}`,
  },
  {
    name: 'unused-identifiers',
    source: safeFixture.replace(
      'return createProductionSemanticOperatorJourney({',
      'const unused = { createProductionSemanticOperatorJourney, createProductionGraphRagRuntime, createDefaultSemanticRetrieval, resolveApprovedLiveConfiguration };\n  return fakeJourney({',
    ),
  },
  {
    name: 'missing-factory-call',
    source: safeFixture.replace(
      'const runtime = createProductionGraphRagRuntime({});',
      'const runtime = createProductionGraphRagRuntime;',
    ),
  },
  {
    name: 'missing-tool-call',
    source: safeFixture.replace(
      "callTool('getSystemArchitecture', request, { retrieval })",
      'getSystemArchitecture',
    ),
  },
  {
    name: 'extra-port',
    source: safeFixture.replace(
      'querySystemArchitecture: request => callTool',
      'unsafeProviderOverride: request => request,\n    querySystemArchitecture: request => callTool',
    ),
  },
];

for (const fixture of bypassFixtures) {
  assert.throws(
    () => assertDefaultComposition(fixture.source, `${fixture.name}.fixture.js`),
    /WP_P3_DEFAULT_WIRING_GUARD/,
    `WP_P3_DEFAULT_WIRING_GUARD: bypass fixture passed: ${fixture.name}`,
  );
}

function assertDefaultComposition(source, label) {
  const ast = parse(source, label);
  const imports = collectRequireImports(ast);
  const factoryLocals = new Map();
  for (const [exportedName, expectedModule] of requiredFactoryImports) {
    const imported = imports.find(item => (
      item.exportedName === exportedName
      && item.modulePath === expectedModule
    ));
    assert(
      imported,
      `WP_P3_DEFAULT_WIRING_GUARD: ${label} lacks structural import ${exportedName} from ${expectedModule}`,
    );
    factoryLocals.set(exportedName, imported.localName);
  }

  const operatorCalls = findCalls(ast, factoryLocals.get('createProductionSemanticOperatorJourney'));
  assert.strictEqual(
    operatorCalls.length,
    1,
    `WP_P3_DEFAULT_WIRING_GUARD: ${label} must invoke the operator factory exactly once`,
  );
  const operatorCall = operatorCalls[0];
  assert.strictEqual(
    operatorCall.arguments.length,
    1,
    `WP_P3_DEFAULT_WIRING_GUARD: ${label} operator factory requires one dependency object`,
  );
  const dependencies = operatorCall.arguments[0];
  assert(
    ts.isObjectLiteralExpression(dependencies),
    `WP_P3_DEFAULT_WIRING_GUARD: ${label} operator dependencies must be an object literal`,
  );
  const dependencyKeys = dependencies.properties.map(propertyName).sort();
  assert.deepStrictEqual(
    dependencyKeys,
    exactOperatorPorts,
    `WP_P3_DEFAULT_WIRING_GUARD: ${label} default dependencies must expose exactly six authorized ports`,
  );
  for (const property of dependencies.properties) {
    assert(
      ts.isPropertyAssignment(property)
        && (ts.isArrowFunction(property.initializer) || ts.isFunctionExpression(property.initializer)),
      `WP_P3_DEFAULT_WIRING_GUARD: ${label} port ${propertyName(property)} must execute through a function`,
    );
  }

  const compositionRoot = nearestFunction(operatorCall) || ast;
  for (const factory of [
    'createProductionGraphRagRuntime',
    'createDefaultSemanticRetrieval',
    'resolveApprovedLiveConfiguration',
  ]) {
    assert(
      findCalls(compositionRoot, factoryLocals.get(factory)).length > 0,
      `WP_P3_DEFAULT_WIRING_GUARD: ${label} does not invoke ${factory}`,
    );
  }
  const callToolCalls = findCalls(compositionRoot, 'callTool');
  for (const toolName of requiredToolCalls) {
    assert(
      callToolCalls.some(call => literalValue(call.arguments[0]) === toolName),
      `WP_P3_DEFAULT_WIRING_GUARD: ${label} does not invoke tool ${toolName}`,
    );
  }
}

function collectRequireImports(ast) {
  const imports = [];
  walk(ast, node => {
    if (
      !ts.isVariableDeclaration(node)
      || !ts.isObjectBindingPattern(node.name)
      || !isRequireCall(node.initializer)
    ) return;
    const modulePath = literalValue(node.initializer.arguments[0]);
    for (const element of node.name.elements) {
      imports.push({
        exportedName: element.propertyName ? element.propertyName.text : element.name.text,
        localName: element.name.text,
        modulePath,
      });
    }
  });
  return imports;
}

function findCalls(root, localName) {
  const calls = [];
  walk(root, node => {
    if (
      ts.isCallExpression(node)
      && ts.isIdentifier(node.expression)
      && node.expression.text === localName
    ) calls.push(node);
  });
  return calls;
}

function nearestFunction(node) {
  let current = node.parent;
  while (current) {
    if (ts.isFunctionLike(current)) return current;
    current = current.parent;
  }
  return null;
}

function isRequireCall(node) {
  return node
    && ts.isCallExpression(node)
    && ts.isIdentifier(node.expression)
    && node.expression.text === 'require'
    && node.arguments.length === 1
    && ts.isStringLiteral(node.arguments[0]);
}

function propertyName(property) {
  const name = property.name;
  if (!name) return undefined;
  return ts.isIdentifier(name) || ts.isStringLiteral(name) ? name.text : undefined;
}

function literalValue(node) {
  return node && ts.isStringLiteral(node) ? node.text : undefined;
}

function parse(source, label) {
  const ast = ts.createSourceFile(
    label,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  assert.strictEqual(
    ast.parseDiagnostics.length,
    0,
    `WP_P3_DEFAULT_WIRING_GUARD: ${label} is not parseable JavaScript`,
  );
  return ast;
}

function walk(node, visitor) {
  visitor(node);
  ts.forEachChild(node, child => walk(child, visitor));
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, ...relativePath.split('/')));
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

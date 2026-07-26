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
function initializeWorkspace(request) { return request; }
function syncCanonicalStructuralProjection(request) { return request; }
function callTool(name, request, dependencies) { return { name, request, dependencies }; }
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
  {
    name: 'shadowed-factory-binding',
    source: safeFixture.replace(
      '  const runtime = createProductionGraphRagRuntime({});',
      '  const createProductionGraphRagRuntime = () => ({ fake: true });\n  const runtime = createProductionGraphRagRuntime({});',
    ),
  },
  {
    name: 'shadowed-operator-factory-binding',
    source: safeFixture.replace(
      '  const runtime = createProductionGraphRagRuntime({});',
      '  const createProductionSemanticOperatorJourney = dependencies => dependencies;\n  const runtime = createProductionGraphRagRuntime({});',
    ),
  },
  {
    name: 'shadowed-call-tool-binding',
    source: safeFixture.replace(
      '  const runtime = createProductionGraphRagRuntime({});',
      '  const callTool = () => ({ fake: true });\n  const runtime = createProductionGraphRagRuntime({});',
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
  const { ast, checker } = parseWithBindings(source, label);
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
    factoryLocals.set(exportedName, imported);
  }

  const operatorImport = factoryLocals.get('createProductionSemanticOperatorJourney');
  const operatorCalls = findBoundCalls(ast, operatorImport.localName, operatorImport.declaration, checker);
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
    const imported = factoryLocals.get(factory);
    assert(
      findBoundCalls(compositionRoot, imported.localName, imported.declaration, checker).length > 0,
      `WP_P3_DEFAULT_WIRING_GUARD: ${label} does not invoke ${factory}`,
    );
  }
  const topLevelBindings = new Map([
    ['initializeWorkspace', requireTopLevelBinding(ast, 'initializeWorkspace', label)],
    ['syncCanonicalStructuralProjection', requireTopLevelBinding(ast, 'syncCanonicalStructuralProjection', label)],
    ['callTool', requireTopLevelBinding(ast, 'callTool', label)],
  ]);
  const callbackMappings = new Map([
    ['initializeWorkspace', {
      binding: topLevelBindings.get('initializeWorkspace'),
    }],
    ['syncCanonicalStructuralProjection', {
      binding: topLevelBindings.get('syncCanonicalStructuralProjection'),
    }],
    ['resolveApprovedConfiguration', {
      binding: factoryLocals.get('resolveApprovedLiveConfiguration').declaration,
    }],
    ['runSemanticBackfill', {
      binding: topLevelBindings.get('callTool'),
      toolName: 'backfillSystemArchitectureSemanticProjection',
    }],
    ['readSemanticReadiness', {
      binding: topLevelBindings.get('callTool'),
      toolName: 'verifySystemArchitectureSemanticReadiness',
    }],
    ['querySystemArchitecture', {
      binding: topLevelBindings.get('callTool'),
      toolName: 'getSystemArchitecture',
    }],
  ]);
  for (const property of dependencies.properties) {
    const port = propertyName(property);
    const mapping = callbackMappings.get(port);
    const call = callbackReturnCall(property.initializer, label, port);
    assert(
      ts.isIdentifier(call.expression)
        && resolvesTo(call.expression, mapping.binding, checker),
      `WP_P3_DEFAULT_WIRING_GUARD: ${label} port ${port} resolves to a shadowed or incorrect binding`,
    );
    if (mapping.toolName) {
      assert.strictEqual(
        literalValue(call.arguments[0]),
        mapping.toolName,
        `WP_P3_DEFAULT_WIRING_GUARD: ${label} port ${port} invokes the wrong tool`,
      );
    }
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
        declaration: element,
      });
    }
  });
  return imports;
}

function findBoundCalls(root, localName, declaration, checker) {
  const calls = [];
  walk(root, node => {
    if (
      ts.isCallExpression(node)
      && ts.isIdentifier(node.expression)
      && node.expression.text === localName
      && resolvesTo(node.expression, declaration, checker)
    ) calls.push(node);
  });
  return calls;
}

function resolvesTo(identifier, declaration, checker) {
  const symbol = checker.getSymbolAtLocation(identifier);
  return Boolean(symbol && symbol.declarations && symbol.declarations.includes(declaration));
}

function requireTopLevelBinding(ast, name, label) {
  for (const statement of ast.statements) {
    if (
      ts.isFunctionDeclaration(statement)
      && statement.name
      && statement.name.text === name
    ) return statement;
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && declaration.name.text === name) return declaration;
      }
    }
  }
  assert.fail(`WP_P3_DEFAULT_WIRING_GUARD: ${label} lacks top-level binding ${name}`);
}

function callbackReturnCall(callback, label, port) {
  if (ts.isArrowFunction(callback) && ts.isCallExpression(callback.body)) return callback.body;
  if (callback.body && ts.isBlock(callback.body)) {
    const returns = callback.body.statements.filter(statement => (
      ts.isReturnStatement(statement) && statement.expression
    ));
    assert.strictEqual(
      returns.length,
      1,
      `WP_P3_DEFAULT_WIRING_GUARD: ${label} port ${port} must have one return call`,
    );
    assert(
      ts.isCallExpression(returns[0].expression),
      `WP_P3_DEFAULT_WIRING_GUARD: ${label} port ${port} must return a direct call`,
    );
    return returns[0].expression;
  }
  assert.fail(`WP_P3_DEFAULT_WIRING_GUARD: ${label} port ${port} must return a direct call`);
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

function parseWithBindings(source, label) {
  const fileName = path.resolve(repoRoot, '.argo', 'guard-fixtures', label);
  const ast = ts.createSourceFile(
    fileName,
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
  const options = {
    allowJs: true,
    checkJs: false,
    module: ts.ModuleKind.CommonJS,
    noLib: true,
    noResolve: true,
    target: ts.ScriptTarget.Latest,
  };
  const canonical = value => path.resolve(value).toLowerCase();
  const host = {
    fileExists: requested => canonical(requested) === canonical(fileName),
    getCanonicalFileName: requested => requested.toLowerCase(),
    getCurrentDirectory: () => repoRoot,
    getDefaultLibFileName: () => 'lib.d.ts',
    getDirectories: () => [],
    getNewLine: () => '\n',
    getSourceFile: requested => (
      canonical(requested) === canonical(fileName) ? ast : undefined
    ),
    readFile: requested => (
      canonical(requested) === canonical(fileName) ? source : undefined
    ),
    useCaseSensitiveFileNames: () => false,
    writeFile() {},
  };
  const program = ts.createProgram([fileName], options, host);
  return {
    ast: program.getSourceFile(fileName),
    checker: program.getTypeChecker(),
  };
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

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const retrievalPath = '.argo/scripts/graph-rag/defaultSemanticRetrieval.js';
const operatorPath = '.argo/scripts/graph-rag/semanticOperatorJourney.js';
const handoff = JSON.parse(read('.argo/temp/ImplementationToCodingHandoff.json'));
const exactPublicKeys = [
  'canonicalVersion',
  'completedChannels',
  'contentVersion',
  'fullSnapshotFallback',
  'indexVersion',
  'mismatchedChannels',
  'missingChannels',
  'state',
  'verified',
].sort();
const exactAlignmentMappings = new Map([
  ['state', 'state'],
  ['verified', 'aligned'],
  ['canonicalVersion', 'canonicalVersion'],
  ['contentVersion', 'contentVersion'],
  ['indexVersion', 'indexVersion'],
  ['completedChannels', 'completedChannels'],
  ['missingChannels', 'missingChannels'],
  ['mismatchedChannels', 'mismatchedChannels'],
]);
const forbiddenReadEffectPattern = /provider|embed|vector|retriev|queryNodes|exhaustChannel|completeSemanticResult/i;

// GIVEN accepted WP-P2 owns the only persistent readiness query and evaluator
// WHEN WP-P3 repairs only operator sequencing
// THEN the accepted public reader remains frozen and retains exact provenance
assert(
  !handoff.codingTargets.some(target => target.path === retrievalPath),
  'WP_P3_READINESS_PUBLIC_GUARD: accepted reader was reauthorized during operator repair',
);
assert(
  handoff.frozenFiles.includes(retrievalPath),
  'WP_P3_READINESS_PUBLIC_GUARD: accepted default retrieval is not frozen',
);

if (exists(operatorPath)) {
  assertSharedReadinessBoundary(read(retrievalPath), retrievalPath);
}

const safeFixture = `
const READINESS_QUERY_CYPHER = ['MATCH readiness'].join('\\n');
function readPersistentReadiness(driver) { return driver.execute(READINESS_QUERY_CYPHER); }
function evaluatePersistentReadiness(readiness, canonicalGraph) {
  return { aligned: true, state: readiness.state, canonicalVersion: canonicalGraph.version };
}
async function readAndEvaluatePersistentReadiness(composition, canonicalGraph) {
  const readiness = await readPersistentReadiness(composition.neo4jDriver);
  const alignment = evaluatePersistentReadiness(readiness, canonicalGraph);
  return { composition, readiness, alignment };
}
function publicReadinessOutcome(alignment) {
  return {
    state: alignment.state,
    verified: alignment.aligned,
    canonicalVersion: alignment.canonicalVersion,
    contentVersion: alignment.contentVersion,
    indexVersion: alignment.indexVersion,
    completedChannels: alignment.completedChannels,
    missingChannels: alignment.missingChannels,
    mismatchedChannels: alignment.mismatchedChannels,
    fullSnapshotFallback: false,
  };
}
function createDefaultSemanticRetrieval(dependencies = {}) {
  const canonicalGraph = dependencies.canonicalGraph;
  const composition = dependencies.composition;
  return Object.freeze({
    async retrieve(request = {}) {
      const evidence = await readAndEvaluatePersistentReadiness(composition, canonicalGraph);
      return { request, readiness: evidence.readiness };
    },
    async readReadiness() {
      const evidence = await readAndEvaluatePersistentReadiness(composition, canonicalGraph);
      return publicReadinessOutcome(evidence.alignment);
    },
  });
}
function withDefaultSemanticRetrievalTestComposition(composition, callback) {
  return callback(composition);
}
module.exports = {
  createDefaultSemanticRetrieval,
  withDefaultSemanticRetrievalTestComposition,
};`;

assert.doesNotThrow(
  () => assertSharedReadinessBoundary(safeFixture, 'safe-readiness-public.fixture.js'),
  'WP_P3_READINESS_PUBLIC_GUARD: safe shared-readiness fixture was rejected',
);

const bypassFixtures = [
  {
    name: 'public-duplicates-evaluator',
    source: safeFixture.replace(
      'const evidence = await readAndEvaluatePersistentReadiness(composition, canonicalGraph);\n      return publicReadinessOutcome(evidence.alignment);',
      'const readiness = await readPersistentReadiness(composition.neo4jDriver);\n      return publicReadinessOutcome(evaluatePersistentReadiness(readiness, canonicalGraph));',
    ),
  },
  {
    name: 'retrieve-bypasses-shared-helper',
    source: safeFixture.replace(
      'const evidence = await readAndEvaluatePersistentReadiness(composition, canonicalGraph);\n      return { request, readiness: evidence.readiness };',
      'const readiness = await readPersistentReadiness(composition.neo4jDriver);\n      return { request, readiness };',
    ),
  },
  {
    name: 'duplicate-readiness-query',
    source: safeFixture.replace(
      'function readPersistentReadiness',
      "const ALTERNATE_READINESS_QUERY_CYPHER = ['MATCH duplicate readiness'].join('\\\\n');\nfunction readPersistentReadiness",
    ),
  },
  {
    name: 'exports-private-helper',
    source: safeFixture.replace(
      '  withDefaultSemanticRetrievalTestComposition,\n};',
      '  withDefaultSemanticRetrievalTestComposition,\n  readPersistentReadiness,\n};',
    ),
  },
  {
    name: 'incomplete-public-envelope',
    source: safeFixture.replace(
      '    fullSnapshotFallback: false,',
      '',
    ),
  },
  {
    name: 'raw-secret-field-mapping',
    source: safeFixture.replace(
      '    state: alignment.state,',
      '    state: alignment.secret,',
    ),
  },
  {
    name: 'arbitrary-alignment-field-mapping',
    source: safeFixture.replace(
      '    verified: alignment.aligned,',
      '    verified: alignment.state,',
    ),
  },
  {
    name: 'fallback-true',
    source: safeFixture.replace(
      '    fullSnapshotFallback: false,',
      '    fullSnapshotFallback: true,',
    ),
  },
  {
    name: 'provider-embed-side-effect',
    source: safeFixture.replace(
      '      const evidence = await readAndEvaluatePersistentReadiness(composition, canonicalGraph);\n      return publicReadinessOutcome(evidence.alignment);',
      "      await provider.embed('readiness');\n      const evidence = await readAndEvaluatePersistentReadiness(composition, canonicalGraph);\n      return publicReadinessOutcome(evidence.alignment);",
    ),
  },
  {
    name: 'vector-retrieval-side-effect',
    source: safeFixture.replace(
      '  const readiness = await readPersistentReadiness(composition.neo4jDriver);',
      '  await exhaustChannel({ channel: "Element" });\n  const readiness = await readPersistentReadiness(composition.neo4jDriver);',
    ),
  },
  {
    name: 'shadowed-shared-helper',
    source: safeFixture.replace(
      '    async readReadiness() {\n      const evidence = await readAndEvaluatePersistentReadiness(composition, canonicalGraph);',
      '    async readReadiness() {\n      const readAndEvaluatePersistentReadiness = async () => ({ alignment: { aligned: true } });\n      const evidence = await readAndEvaluatePersistentReadiness(composition, canonicalGraph);',
    ),
  },
];
for (const fixture of bypassFixtures) {
  assert.throws(
    () => assertSharedReadinessBoundary(fixture.source, `${fixture.name}.fixture.js`),
    /WP_P3_READINESS_PUBLIC_GUARD/,
    `WP_P3_READINESS_PUBLIC_GUARD: bypass fixture passed: ${fixture.name}`,
  );
}

function assertSharedReadinessBoundary(source, label) {
  const { ast, checker } = parseWithBindings(source, label);
  const functions = topLevelFunctions(ast);
  for (const name of [
    'createDefaultSemanticRetrieval',
    'readPersistentReadiness',
    'evaluatePersistentReadiness',
    'readAndEvaluatePersistentReadiness',
    'publicReadinessOutcome',
  ]) {
    assert.strictEqual(
      (functions.get(name) || []).length,
      1,
      `WP_P3_READINESS_PUBLIC_GUARD: ${label} must define exactly one ${name}`,
    );
  }
  assert.strictEqual(
    countTopLevelDeclarations(ast, /READINESS_QUERY_CYPHER$/),
    1,
    `WP_P3_READINESS_PUBLIC_GUARD: ${label} must retain one readiness query authority`,
  );

  const factory = functions.get('createDefaultSemanticRetrieval')[0];
  const shared = functions.get('readAndEvaluatePersistentReadiness')[0];
  const persistentRead = functions.get('readPersistentReadiness')[0];
  const evaluate = functions.get('evaluatePersistentReadiness')[0];
  const outcome = functions.get('publicReadinessOutcome')[0];
  const boundaryObject = findReturnedFrozenObject(factory);
  const methods = new Map(boundaryObject.properties.map(property => [propertyName(property), property]));
  for (const name of ['retrieve', 'readReadiness']) {
    assert(methods.has(name), `WP_P3_READINESS_PUBLIC_GUARD: ${label} omits ${name}`);
    assert.strictEqual(
      findBoundCalls(methods.get(name), shared, checker).length,
      1,
      `WP_P3_READINESS_PUBLIC_GUARD: ${label} ${name} must call the exact shared readiness helper once`,
    );
  }
  assertReadReadinessProvenance(
    methods.get('readReadiness'),
    shared,
    outcome,
    checker,
    label,
  );
  assertNoForbiddenReadEffects(methods.get('readReadiness'), label, 'readReadiness');

  assertSharedHelperProvenance(
    shared,
    persistentRead,
    evaluate,
    checker,
    label,
  );
  assertNoForbiddenReadEffects(shared, label, 'shared readiness helper');

  const outcomeObject = findReturnedObject(outcome);
  assert.deepStrictEqual(
    outcomeObject.properties.map(propertyName).sort(),
    exactPublicKeys,
    `WP_P3_READINESS_PUBLIC_GUARD: ${label} public readiness envelope changed`,
  );
  assertExactPublicMappings(outcome, outcomeObject, checker, label);

  const exported = findModuleExports(ast);
  assert.deepStrictEqual(
    exported.properties.map(propertyName).sort(),
    ['createDefaultSemanticRetrieval', 'withDefaultSemanticRetrievalTestComposition'].sort(),
    `WP_P3_READINESS_PUBLIC_GUARD: ${label} exposes private readiness internals`,
  );
}

function assertReadReadinessProvenance(method, shared, outcome, checker, label) {
  const evidenceDeclarations = findVariablesInitializedByBoundCall(method, shared, checker);
  assert.strictEqual(
    evidenceDeclarations.length,
    1,
    `WP_P3_READINESS_PUBLIC_GUARD: ${label} readReadiness evidence must come from the exact shared helper`,
  );
  const returns = collectReturns(method);
  assert.strictEqual(
    returns.length,
    1,
    `WP_P3_READINESS_PUBLIC_GUARD: ${label} readReadiness must return one mapped outcome`,
  );
  const call = unwrapCall(returns[0].expression);
  assert(
    call
      && ts.isIdentifier(call.expression)
      && resolvesTo(call.expression, outcome, checker),
    `WP_P3_READINESS_PUBLIC_GUARD: ${label} readReadiness must return the exact public mapping`,
  );
  assert.strictEqual(
    call.arguments.length,
    1,
    `WP_P3_READINESS_PUBLIC_GUARD: ${label} public mapping requires one alignment argument`,
  );
  const argument = call.arguments[0];
  assert(
    ts.isPropertyAccessExpression(argument)
      && argument.name.text === 'alignment'
      && ts.isIdentifier(argument.expression)
      && resolvesTo(argument.expression, evidenceDeclarations[0], checker),
    `WP_P3_READINESS_PUBLIC_GUARD: ${label} public mapping must receive shared-helper alignment`,
  );
}

function assertSharedHelperProvenance(shared, persistentRead, evaluate, checker, label) {
  const parameters = shared.parameters;
  assert(
    parameters.length >= 2
      && ts.isIdentifier(parameters[0].name)
      && ts.isIdentifier(parameters[1].name),
    `WP_P3_READINESS_PUBLIC_GUARD: ${label} shared helper requires composition and canonicalGraph`,
  );
  const readDeclarations = findVariablesInitializedByBoundCall(shared, persistentRead, checker);
  const alignmentDeclarations = findVariablesInitializedByBoundCall(shared, evaluate, checker);
  assert.strictEqual(
    readDeclarations.length,
    1,
    `WP_P3_READINESS_PUBLIC_GUARD: ${label} shared helper must bind one accepted persistent read`,
  );
  assert.strictEqual(
    alignmentDeclarations.length,
    1,
    `WP_P3_READINESS_PUBLIC_GUARD: ${label} shared helper must bind one accepted evaluator result`,
  );

  const readCall = unwrapCall(readDeclarations[0].initializer);
  assert(
    readCall
      && readCall.arguments.length === 1
      && ts.isPropertyAccessExpression(readCall.arguments[0])
      && readCall.arguments[0].name.text === 'neo4jDriver'
      && ts.isIdentifier(readCall.arguments[0].expression)
      && resolvesTo(readCall.arguments[0].expression, parameters[0], checker),
    `WP_P3_READINESS_PUBLIC_GUARD: ${label} persistent read must use composition.neo4jDriver`,
  );
  const evaluationCall = unwrapCall(alignmentDeclarations[0].initializer);
  assert(
    evaluationCall
      && evaluationCall.arguments.length === 2
      && ts.isIdentifier(evaluationCall.arguments[0])
      && resolvesTo(evaluationCall.arguments[0], readDeclarations[0], checker)
      && ts.isIdentifier(evaluationCall.arguments[1])
      && resolvesTo(evaluationCall.arguments[1], parameters[1], checker),
    `WP_P3_READINESS_PUBLIC_GUARD: ${label} evaluator must consume the accepted read and canonicalGraph`,
  );

  const returns = collectReturns(shared);
  assert.strictEqual(
    returns.length,
    1,
    `WP_P3_READINESS_PUBLIC_GUARD: ${label} shared helper must return one evidence object`,
  );
  assert(
    returns[0].expression && ts.isObjectLiteralExpression(returns[0].expression),
    `WP_P3_READINESS_PUBLIC_GUARD: ${label} shared helper must return evidence object`,
  );
  const expectedBindings = new Map([
    ['composition', parameters[0]],
    ['readiness', readDeclarations[0]],
    ['alignment', alignmentDeclarations[0]],
  ]);
  assert.deepStrictEqual(
    returns[0].expression.properties.map(propertyName).sort(),
    [...expectedBindings.keys()].sort(),
    `WP_P3_READINESS_PUBLIC_GUARD: ${label} shared evidence envelope changed`,
  );
  for (const property of returns[0].expression.properties) {
    const name = propertyName(property);
    const value = propertyValue(property);
    assert(
      value
        && ts.isIdentifier(value)
        && resolvesTo(value, expectedBindings.get(name), checker),
      `WP_P3_READINESS_PUBLIC_GUARD: ${label} shared evidence ${name} has wrong provenance`,
    );
  }
}

function assertExactPublicMappings(outcome, outcomeObject, checker, label) {
  assert(
    outcome.parameters.length === 1 && ts.isIdentifier(outcome.parameters[0].name),
    `WP_P3_READINESS_PUBLIC_GUARD: ${label} public mapping requires one alignment parameter`,
  );
  const alignmentParameter = outcome.parameters[0];
  for (const property of outcomeObject.properties) {
    const name = propertyName(property);
    assert(
      ts.isPropertyAssignment(property),
      `WP_P3_READINESS_PUBLIC_GUARD: ${label} public field ${name} must be an explicit assignment`,
    );
    if (name === 'fullSnapshotFallback') {
      assert(
        property.initializer.kind === ts.SyntaxKind.FalseKeyword,
        `WP_P3_READINESS_PUBLIC_GUARD: ${label} fullSnapshotFallback must be literal false`,
      );
      continue;
    }
    const expectedMember = exactAlignmentMappings.get(name);
    assert(
      expectedMember
        && ts.isPropertyAccessExpression(property.initializer)
        && property.initializer.name.text === expectedMember
        && ts.isIdentifier(property.initializer.expression)
        && resolvesTo(property.initializer.expression, alignmentParameter, checker),
      `WP_P3_READINESS_PUBLIC_GUARD: ${label} public field ${name} has unapproved alignment mapping`,
    );
  }
}

function assertNoForbiddenReadEffects(root, label, scope) {
  walk(root, node => {
    if (
      (ts.isIdentifier(node) && forbiddenReadEffectPattern.test(node.text))
      || (
        ts.isPropertyAccessExpression(node)
        && forbiddenReadEffectPattern.test(node.getText())
      )
    ) {
      assert.fail(
        `WP_P3_READINESS_PUBLIC_GUARD: ${label} ${scope} contains provider/vector/retrieval effect ${node.getText()}`,
      );
    }
  });
}

function topLevelFunctions(ast) {
  const result = new Map();
  for (const statement of ast.statements) {
    if (!ts.isFunctionDeclaration(statement) || !statement.name) continue;
    const current = result.get(statement.name.text) || [];
    current.push(statement);
    result.set(statement.name.text, current);
  }
  return result;
}

function countTopLevelDeclarations(ast, pattern) {
  let count = 0;
  for (const statement of ast.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && pattern.test(declaration.name.text)) count += 1;
    }
  }
  return count;
}

function findReturnedFrozenObject(functionNode) {
  let found;
  walk(functionNode.body, node => {
    if (
      ts.isReturnStatement(node)
      && node.expression
      && ts.isCallExpression(node.expression)
      && ts.isPropertyAccessExpression(node.expression.expression)
      && node.expression.expression.expression.getText() === 'Object'
      && node.expression.expression.name.text === 'freeze'
      && ts.isObjectLiteralExpression(node.expression.arguments[0])
    ) found = node.expression.arguments[0];
  });
  assert(found, 'WP_P3_READINESS_PUBLIC_GUARD: factory must return Object.freeze({...})');
  return found;
}

function findReturnedObject(functionNode) {
  let found;
  walk(functionNode.body, node => {
    if (
      ts.isReturnStatement(node)
      && node.expression
      && ts.isObjectLiteralExpression(node.expression)
    ) found = node.expression;
  });
  assert(found, 'WP_P3_READINESS_PUBLIC_GUARD: public outcome must return an object literal');
  return found;
}

function findModuleExports(ast) {
  let found;
  walk(ast, node => {
    if (
      ts.isBinaryExpression(node)
      && node.operatorToken.kind === ts.SyntaxKind.EqualsToken
      && node.left.getText(ast) === 'module.exports'
      && ts.isObjectLiteralExpression(node.right)
    ) found = node.right;
  });
  assert(found, 'WP_P3_READINESS_PUBLIC_GUARD: module.exports object missing');
  return found;
}

function findBoundCalls(root, declaration, checker) {
  const calls = [];
  walk(root, node => {
    if (
      ts.isCallExpression(node)
      && ts.isIdentifier(node.expression)
      && resolvesTo(node.expression, declaration, checker)
    ) calls.push(node);
  });
  return calls;
}

function findVariablesInitializedByBoundCall(root, declaration, checker) {
  const variables = [];
  walk(root, node => {
    if (!ts.isVariableDeclaration(node) || !node.initializer) return;
    const call = unwrapCall(node.initializer);
    if (
      call
      && ts.isIdentifier(call.expression)
      && resolvesTo(call.expression, declaration, checker)
    ) variables.push(node);
  });
  return variables;
}

function unwrapCall(node) {
  let current = node;
  while (
    current
    && (
      ts.isAwaitExpression(current)
      || ts.isParenthesizedExpression(current)
    )
  ) current = current.expression;
  return current && ts.isCallExpression(current) ? current : undefined;
}

function collectReturns(root) {
  const returns = [];
  walk(root, node => {
    if (ts.isReturnStatement(node) && node.expression) returns.push(node);
  });
  return returns;
}

function propertyValue(property) {
  if (ts.isPropertyAssignment(property)) return property.initializer;
  if (ts.isShorthandPropertyAssignment(property)) return property.name;
  return undefined;
}

function resolvesTo(identifier, declaration, checker) {
  let symbol = checker.getSymbolAtLocation(identifier);
  if (ts.isShorthandPropertyAssignment(identifier.parent)) {
    symbol = checker.getShorthandAssignmentValueSymbol(identifier.parent) || symbol;
  }
  return Boolean(symbol && symbol.declarations && symbol.declarations.includes(declaration));
}

function propertyName(property) {
  const name = property.name;
  return name && (ts.isIdentifier(name) || ts.isStringLiteral(name)) ? name.text : '';
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
    `WP_P3_READINESS_PUBLIC_GUARD: ${label} is not parseable JavaScript`,
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

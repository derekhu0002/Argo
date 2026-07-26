const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const operatorPath = '.argo/scripts/graph-rag/semanticOperatorJourney.js';

const safeFixture = `
function createProductionSemanticOperatorJourney(dependencies) {
  let readinessVerified = false;
  async function runBackfill(request, automatic) {
    await resolveConfigurationSafely(
      dependencies.resolveApprovedConfiguration,
      request,
    );
    readinessVerified = false;
    const explicitOptIn = automatic
      ? request.automaticBackfillOptIn === true
      : request.explicitOptIn;
    return dependencies.runSemanticBackfill({
      ...request,
      explicitOptIn,
      automatic,
    });
  }
  return Object.freeze({
    async startNewProject(request = {}) {
      if (request.automaticBackfillOptIn !== true) {
        return { semanticState: 'SemanticIndexPending' };
      }
      const backfill = await runBackfill(request, true);
      return { backfill };
    },
    runExplicitBackfill(request = {}) {
      return runBackfill(request, false);
    },
    async verifyReadiness() {
      const readiness = await dependencies.readSemanticReadiness();
      readinessVerified = readiness.verified === true;
      if (!readinessVerified) throw readinessError(readiness);
      return readiness;
    },
    query(request = {}) {
      if (!readinessVerified) throw readinessVerificationRequired();
      return dependencies.querySystemArchitecture({ query: request });
    },
  });
}`;

assert.doesNotThrow(
  () => assertOperatorPolicy(safeFixture, 'compliant-auto-derivation.fixture.js'),
  'WP_P3_OPERATOR_POLICY_PROVENANCE_GUARD: compliant automatic derivation was rejected',
);

const bypassFixtures = [
  {
    name: 'forced-consent-boolean-alias',
    source: safeFixture.replace(
      'const explicitOptIn = automatic\n      ? request.automaticBackfillOptIn === true\n      : request.explicitOptIn;',
      'const forced = Boolean(1);\n    const explicitOptIn = forced;',
    ),
  },
  {
    name: 'forced-consent-nested-alias',
    source: safeFixture.replace(
      'const explicitOptIn = automatic\n      ? request.automaticBackfillOptIn === true\n      : request.explicitOptIn;',
      'const forced = Boolean(1);\n    const alias = forced;\n    const explicitOptIn = alias;',
    ),
  },
  {
    name: 'implicit-readiness-alias-bracket',
    source: safeFixture.replace(
      'if (!readinessVerified) throw readinessVerificationRequired();',
      "const source = dependencies;\n      const operation = 'readSemanticReadiness';\n      const read = source[operation];\n      await read();",
    ).replace('query(request = {}) {', 'async query(request = {}) {'),
  },
  {
    name: 'renamed-readiness-policy',
    source: safeFixture.replace(
      'function createProductionSemanticOperatorJourney',
      "function decide(index) { return index.state === 'Aligned' && index.completedChannels.length === 3; }\nfunction createProductionSemanticOperatorJourney",
    ).replace(
      'readinessVerified = readiness.verified === true;',
      'void readiness.verified;\n      readinessVerified = decide(readiness);',
    ),
  },
  {
    name: 'cosmetic-verified-state-decision',
    source: safeFixture.replace(
      'readinessVerified = readiness.verified === true;',
      "void readiness.verified;\n      readinessVerified = readiness.state === 'Aligned';",
    ),
  },
];

for (const fixture of bypassFixtures) {
  assert.throws(
    () => assertOperatorPolicy(fixture.source, `${fixture.name}.fixture.js`),
    /WP_P3_OPERATOR_POLICY_PROVENANCE_GUARD/,
    `WP_P3_OPERATOR_POLICY_PROVENANCE_GUARD: bypass fixture passed ${fixture.name}`,
  );
}

if (exists(operatorPath)) {
  assertOperatorPolicy(read(operatorPath), operatorPath);
}

function assertOperatorPolicy(source, label) {
  const { ast, checker } = parseWithBindings(source, label);
  const factory = ast.statements.find(statement => (
    ts.isFunctionDeclaration(statement)
    && statement.name
    && statement.name.text === 'createProductionSemanticOperatorJourney'
  ));
  assert(factory, `WP_P3_OPERATOR_POLICY_PROVENANCE_GUARD: ${label} factory missing`);
  assert(
    factory.parameters.length === 1 && ts.isIdentifier(factory.parameters[0].name),
    `WP_P3_OPERATOR_POLICY_PROVENANCE_GUARD: ${label} requires one dependencies parameter`,
  );
  const dependencies = factory.parameters[0];
  const boundary = returnedFrozenObject(factory, label);
  const methods = new Map(boundary.properties.map(property => [propertyName(property), property]));
  for (const name of ['startNewProject', 'runExplicitBackfill', 'verifyReadiness', 'query']) {
    assert(methods.has(name), `WP_P3_OPERATOR_POLICY_PROVENANCE_GUARD: ${label} omits ${name}`);
  }
  const failures = [];
  for (const [scope, assertion] of [
    ['consent', () => assertConsentPolicy(factory, methods, dependencies, checker, label)],
    ['readiness', () => assertReadinessPolicy(factory, methods, dependencies, checker, label)],
  ]) {
    try {
      assertion();
    } catch (error) {
      failures.push(`${scope}: ${error.message}`);
    }
  }
  assert.deepStrictEqual(
    failures,
    [],
    `WP_P3_OPERATOR_POLICY_PROVENANCE_GUARD: ${label}\n${failures.join('\n')}`,
  );
}

function assertConsentPolicy(factory, methods, dependencies, checker, label) {
  const helper = factory.body.statements.find(statement => (
    ts.isFunctionDeclaration(statement)
    && statement.name
    && statement.name.text === 'runBackfill'
  ));
  assert(
    helper && helper.parameters.length === 2,
    `WP_P3_OPERATOR_POLICY_PROVENANCE_GUARD: ${label} factory-owned runBackfill missing`,
  );
  const [request, automatic] = helper.parameters;

  const explicit = methods.get('runExplicitBackfill');
  const explicitCalls = boundCalls(explicit, helper, checker);
  assert(
    explicitCalls.length === 1
      && explicitCalls[0].arguments.length === 2
      && boundIdentifier(explicitCalls[0].arguments[0], explicit.parameters[0], checker)
      && explicitCalls[0].arguments[1].kind === ts.SyntaxKind.FalseKeyword,
    `WP_P3_OPERATOR_POLICY_PROVENANCE_GUARD: ${label} explicit path changes caller request or mode`,
  );

  const start = methods.get('startNewProject');
  const automaticCalls = boundCalls(start, helper, checker);
  assert(
    automaticCalls.length === 1
      && automaticCalls[0].arguments.length === 2
      && boundIdentifier(automaticCalls[0].arguments[0], start.parameters[0], checker)
      && automaticCalls[0].arguments[1].kind === ts.SyntaxKind.TrueKeyword,
    `WP_P3_OPERATOR_POLICY_PROVENANCE_GUARD: ${label} automatic path is not start-owned`,
  );
  assert(
    dominatedByAutomaticOptIn(start, start.parameters[0], automaticCalls[0], checker),
    `WP_P3_OPERATOR_POLICY_PROVENANCE_GUARD: ${label} automatic path lacks explicit caller opt-in`,
  );

  const semanticCalls = dependencyCalls(helper, dependencies, 'runSemanticBackfill', checker);
  assert(
    semanticCalls.length === 1
      && semanticCalls[0].arguments.length === 1
      && ts.isObjectLiteralExpression(semanticCalls[0].arguments[0]),
    `WP_P3_OPERATOR_POLICY_PROVENANCE_GUARD: ${label} WP-P1 call shape changed`,
  );
  const configurationCalls = callsNamed(helper, 'resolveConfigurationSafely');
  assert(
    configurationCalls.length === 1 && configurationCalls[0].pos < semanticCalls[0].pos,
    `WP_P3_OPERATOR_POLICY_PROVENANCE_GUARD: ${label} configuration does not precede backfill`,
  );
  const consentProperty = semanticCalls[0].arguments[0].properties.find(
    property => propertyName(property) === 'explicitOptIn',
  );
  assert(
    consentProvenance(
      propertyValue(consentProperty),
      request,
      automatic,
      checker,
      flowContext(helper, checker),
      new Set(),
    ) === 'automatic-or-explicit',
    `WP_P3_OPERATOR_POLICY_PROVENANCE_GUARD: ${label} consent provenance is not approved`,
  );
}

function assertReadinessPolicy(factory, methods, dependencies, checker, label) {
  const readinessState = factory.body.statements
    .filter(ts.isVariableStatement)
    .flatMap(statement => [...statement.declarationList.declarations])
    .find(declaration => ts.isIdentifier(declaration.name) && declaration.name.text === 'readinessVerified');
  assert(
    readinessState,
    `WP_P3_OPERATOR_POLICY_PROVENANCE_GUARD: ${label} recorded readiness state missing`,
  );

  const verify = methods.get('verifyReadiness');
  const reads = dependencyCalls(verify, dependencies, 'readSemanticReadiness', checker);
  const readinessDeclarations = [];
  walk(verify, node => {
    if (
      ts.isVariableDeclaration(node)
      && node.initializer
      && reads.some(call => unwrap(node.initializer) === call)
    ) readinessDeclarations.push(node);
  });
  assert(
    reads.length === 1 && readinessDeclarations.length === 1,
    `WP_P3_OPERATOR_POLICY_PROVENANCE_GUARD: ${label} exact WP-P2 read binding missing`,
  );
  const assignments = [];
  walk(verify, node => {
    if (
      ts.isBinaryExpression(node)
      && node.operatorToken.kind === ts.SyntaxKind.EqualsToken
      && boundIdentifier(node.left, readinessState, checker)
    ) assignments.push(node);
  });
  assert(
    assignments.length === 1
      && exactVerifiedVerdict(assignments[0].right, readinessDeclarations[0], checker),
    `WP_P3_OPERATOR_POLICY_PROVENANCE_GUARD: ${label} decision is not exact WP-P2 verified verdict`,
  );
  assert(
    hasFailClosedGuard(verify, readinessState, checker),
    `WP_P3_OPERATOR_POLICY_PROVENANCE_GUARD: ${label} verifyReadiness is not fail closed`,
  );

  const query = methods.get('query');
  const context = flowContext(query, checker);
  let implicitReads = 0;
  walk(query, node => {
    if (
      ts.isCallExpression(node)
      && isDependencyMember(
        node.expression,
        dependencies,
        'readSemanticReadiness',
        checker,
        context,
        new Set(),
      )
    ) implicitReads += 1;
  });
  assert.strictEqual(
    implicitReads,
    0,
    `WP_P3_OPERATOR_POLICY_PROVENANCE_GUARD: ${label} query performs aliased readiness read`,
  );
  assert(
    leadingFailClosedGuard(query, readinessState, checker),
    `WP_P3_OPERATOR_POLICY_PROVENANCE_GUARD: ${label} query effects precede explicit-state guard`,
  );
}

function consentProvenance(expression, request, automatic, checker, context, seen) {
  const node = unwrap(expression);
  if (!node) return 'invalid';
  if (ts.isIdentifier(node)) {
    const declaration = declarationOf(node, checker);
    if (!declaration || seen.has(declaration)) return 'invalid';
    seen.add(declaration);
    const values = declarationValues(declaration, context);
    return values.length === 1
      ? consentProvenance(values[0], request, automatic, checker, context, seen)
      : 'invalid';
  }
  if (boundProperty(node, request, 'explicitOptIn', checker)) return 'explicit';
  if (
    ts.isBinaryExpression(node)
    && node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken
    && binarySidesMatch(
      node,
      candidate => boundProperty(candidate, request, 'automaticBackfillOptIn', checker),
      candidate => candidate.kind === ts.SyntaxKind.TrueKeyword,
    )
  ) return 'automatic';
  if (ts.isConditionalExpression(node)) {
    const onTrue = consentProvenance(
      node.whenTrue, request, automatic, checker, context, new Set(seen),
    );
    const onFalse = consentProvenance(
      node.whenFalse, request, automatic, checker, context, new Set(seen),
    );
    return boundIdentifier(node.condition, automatic, checker)
      && onTrue === 'automatic'
      && onFalse === 'explicit'
      ? 'automatic-or-explicit'
      : 'invalid';
  }
  return 'invalid';
}

function exactVerifiedVerdict(expression, readiness, checker) {
  const node = unwrap(expression);
  return ts.isBinaryExpression(node)
    && node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken
    && binarySidesMatch(
      node,
      candidate => boundProperty(candidate, readiness, 'verified', checker),
      candidate => candidate.kind === ts.SyntaxKind.TrueKeyword,
    );
}

function dominatedByAutomaticOptIn(method, request, call, checker) {
  const statements = method.body.statements;
  const callIndex = statements.findIndex(statement => contains(statement, call));
  return statements.some((statement, index) => (
    index < callIndex
    && ts.isIfStatement(statement)
    && ts.isBinaryExpression(statement.expression)
    && statement.expression.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken
    && binarySidesMatch(
      statement.expression,
      candidate => boundProperty(candidate, request, 'automaticBackfillOptIn', checker),
      candidate => candidate.kind === ts.SyntaxKind.TrueKeyword,
    )
    && alwaysReturns(statement.thenStatement)
  ));
}

function hasFailClosedGuard(method, state, checker) {
  return method.body.statements.some(statement => (
    ts.isIfStatement(statement)
    && negatesBoundIdentifier(statement.expression, state, checker)
    && containsThrow(statement.thenStatement)
  ));
}

function leadingFailClosedGuard(method, state, checker) {
  const first = method.body.statements[0];
  return Boolean(
    first
    && ts.isIfStatement(first)
    && negatesBoundIdentifier(first.expression, state, checker)
    && containsThrow(first.thenStatement),
  );
}

function dependencyCalls(root, dependencies, member, checker) {
  const context = flowContext(root, checker);
  const calls = [];
  walk(root, node => {
    if (
      ts.isCallExpression(node)
      && isDependencyMember(
        node.expression,
        dependencies,
        member,
        checker,
        context,
        new Set(),
      )
    ) calls.push(node);
  });
  return calls;
}

function isDependencyMember(expression, dependencies, member, checker, context, seen) {
  const node = unwrap(expression);
  if (!node) return false;
  if (ts.isIdentifier(node)) {
    const declaration = declarationOf(node, checker);
    if (!declaration || seen.has(declaration)) return false;
    seen.add(declaration);
    if (ts.isBindingElement(declaration)) {
      const name = declaration.propertyName
        ? staticName(declaration.propertyName, checker, context, new Set())
        : declaration.name.text;
      const variable = declaration.parent && declaration.parent.parent
        && declaration.parent.parent.parent;
      return name === member
        && variable
        && ts.isVariableDeclaration(variable)
        && isDependencyObject(
          variable.initializer, dependencies, checker, context, new Set(seen),
        );
    }
    const values = declarationValues(declaration, context);
    return values.length === 1 && isDependencyMember(
      values[0], dependencies, member, checker, context, seen,
    );
  }
  if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
    const name = ts.isPropertyAccessExpression(node)
      ? node.name.text
      : staticName(node.argumentExpression, checker, context, new Set());
    return name === member
      && isDependencyObject(node.expression, dependencies, checker, context, seen);
  }
  return false;
}

function isDependencyObject(expression, dependencies, checker, context, seen) {
  const node = unwrap(expression);
  if (boundIdentifier(node, dependencies, checker)) return true;
  if (!ts.isIdentifier(node)) return false;
  const declaration = declarationOf(node, checker);
  if (!declaration || seen.has(declaration)) return false;
  seen.add(declaration);
  const values = declarationValues(declaration, context);
  return values.length === 1
    && isDependencyObject(values[0], dependencies, checker, context, seen);
}

function staticName(expression, checker, context, seen) {
  const node = unwrap(expression);
  if (ts.isStringLiteral(node)) return node.text;
  if (!ts.isIdentifier(node)) return undefined;
  const declaration = declarationOf(node, checker);
  if (!declaration || seen.has(declaration)) return undefined;
  seen.add(declaration);
  const values = declarationValues(declaration, context);
  return values.length === 1 ? staticName(values[0], checker, context, seen) : undefined;
}

function flowContext(root, checker) {
  const assignments = new Map();
  walk(root, node => {
    if (
      ts.isBinaryExpression(node)
      && node.operatorToken.kind === ts.SyntaxKind.EqualsToken
      && ts.isIdentifier(node.left)
    ) {
      const declaration = declarationOf(node.left, checker);
      if (!declaration) return;
      const values = assignments.get(declaration) || [];
      values.push(node.right);
      assignments.set(declaration, values);
    }
  });
  return { assignments };
}

function declarationValues(declaration, context) {
  const values = [];
  if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
    values.push(declaration.initializer);
  }
  values.push(...(context.assignments.get(declaration) || []));
  return values;
}

function returnedFrozenObject(factory, label) {
  for (const statement of factory.body.statements) {
    if (
      ts.isReturnStatement(statement)
      && statement.expression
      && ts.isCallExpression(statement.expression)
      && ts.isPropertyAccessExpression(statement.expression.expression)
      && statement.expression.expression.expression.getText() === 'Object'
      && statement.expression.expression.name.text === 'freeze'
      && ts.isObjectLiteralExpression(statement.expression.arguments[0])
    ) return statement.expression.arguments[0];
  }
  assert.fail(`WP_P3_OPERATOR_POLICY_PROVENANCE_GUARD: ${label} frozen surface missing`);
}

function boundCalls(root, declaration, checker) {
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

function callsNamed(root, name) {
  const calls = [];
  walk(root, node => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name) {
      calls.push(node);
    }
  });
  return calls;
}

function boundProperty(expression, declaration, property, checker) {
  const node = unwrap(expression);
  if (ts.isPropertyAccessExpression(node)) {
    return node.name.text === property && boundIdentifier(node.expression, declaration, checker);
  }
  return ts.isElementAccessExpression(node)
    && ts.isStringLiteral(node.argumentExpression)
    && node.argumentExpression.text === property
    && boundIdentifier(node.expression, declaration, checker);
}

function boundIdentifier(expression, declaration, checker) {
  const node = unwrap(expression);
  return ts.isIdentifier(node) && resolvesTo(node, declaration, checker);
}

function negatesBoundIdentifier(expression, declaration, checker) {
  return ts.isPrefixUnaryExpression(expression)
    && expression.operator === ts.SyntaxKind.ExclamationToken
    && boundIdentifier(expression.operand, declaration, checker);
}

function binarySidesMatch(binary, leftPredicate, rightPredicate) {
  return (
    leftPredicate(binary.left) && rightPredicate(binary.right)
  ) || (
    leftPredicate(binary.right) && rightPredicate(binary.left)
  );
}

function alwaysReturns(statement) {
  if (ts.isReturnStatement(statement) || ts.isThrowStatement(statement)) return true;
  return ts.isBlock(statement)
    && statement.statements.length > 0
    && statement.statements.every(alwaysReturns);
}

function contains(root, target) {
  let found = false;
  walk(root, node => {
    if (node === target) found = true;
  });
  return found;
}

function containsThrow(root) {
  let found = false;
  walk(root, node => {
    if (ts.isThrowStatement(node)) found = true;
  });
  return found;
}

function declarationOf(identifier, checker) {
  let symbol = checker.getSymbolAtLocation(identifier);
  if (ts.isShorthandPropertyAssignment(identifier.parent)) {
    symbol = checker.getShorthandAssignmentValueSymbol(identifier.parent) || symbol;
  }
  return symbol && symbol.declarations && symbol.declarations[0];
}

function resolvesTo(identifier, declaration, checker) {
  const symbol = checker.getSymbolAtLocation(identifier);
  return Boolean(symbol && symbol.declarations && symbol.declarations.includes(declaration));
}

function unwrap(expression) {
  let current = expression;
  while (
    current
    && (
      ts.isAwaitExpression(current)
      || ts.isParenthesizedExpression(current)
    )
  ) current = current.expression;
  return current;
}

function propertyValue(property) {
  if (!property) return undefined;
  if (ts.isPropertyAssignment(property)) return property.initializer;
  if (ts.isShorthandPropertyAssignment(property)) return property.name;
  return undefined;
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
    `WP_P3_OPERATOR_POLICY_PROVENANCE_GUARD: ${label} is not parseable JavaScript`,
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
    getSourceFile: requested => canonical(requested) === canonical(fileName) ? ast : undefined,
    readFile: requested => canonical(requested) === canonical(fileName) ? source : undefined,
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

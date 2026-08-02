const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const entryPaths = [
  'tests/explicit/entries/runGraphQueryCompatibility.js',
  'tests/explicit/entries/runCanonicalGraphFullSnapshot.js',
  'tests/explicit/entries/runQueryPurposeValidation.js',
  'tests/explicit/entries/runGraphTidyFullSnapshot.js',
  'tests/explicit/entries/runPurposePolicyClosure.js',
  'tests/explicit/entries/runIntentDecisionClosure.js',
  'tests/explicit/entries/runImplementationDesignClosure.js',
  'tests/explicit/entries/runCodingRepairClosure.js',
  'tests/explicit/entries/runAuditProofClosure.js',
  'tests/explicit/entries/runCoherentIntentReading.js',
  'tests/explicit/entries/runRelationshipEndpointClosure.js',
  'tests/explicit/entries/runCompleteViewClosure.js',
  'tests/explicit/entries/runFirstInclusionProvenance.js',
];
const requiredObservations = new Map([
  ['tests/explicit/entries/runGraphQueryCompatibility.js', [
    'assertLegacyEnvelopeExternallyEquivalent',
    'assertNoQueryModeMetadata',
  ]],
  ['tests/explicit/entries/runQueryPurposeValidation.js', [
    'createSemanticRetrievalProbe',
    'validQueries',
    'invalidQueries',
    "purpose: 'intent-decision'",
    "purpose: 'implementation-design'",
    "purpose: 'coding-repair'",
    "purpose: 'audit'",
    "purpose: 'graph-tidy'",
    'QUERY_PURPOSE_REQUIRED',
    'QUERY_PURPOSE_INVALID',
    'QUERY_INTENT_REQUIRED',
    'AUDIT_SUBJECT_REQUIRED',
    'DT03_VALIDATION_AFTER_RETRIEVAL',
  ]],
  ['tests/explicit/entries/runGraphTidyFullSnapshot.js', [
    'createSemanticRetrievalProbe',
    "anchors: ['grag-seed-retrieval']",
    'DT12_SEMANTIC_PROBE_NOT_WIRED',
    'DT12_SEMANTIC_PATH_INVOKED',
  ]],
  ['tests/explicit/entries/runPurposePolicyClosure.js', [
    'readForPurposeClosure',
    'assertParameterizedClosurePolicy',
    'DT06_FREE_GENERATED_CYPHER_DECIDED_MANDATORY_CLOSURE',
    'DT07_CALLER_IDENTITY_POLICY_FORBIDDEN',
    'DT07_PURPOSE_POLICY',
    'DT07_PURPOSE_CATEGORIES_NOT_INDEPENDENT',
    'DT07_GRAPH_TIDY_SEMANTIC_PATH_INVOKED',
    'DT07_GRAPH_TIDY_SEMANTIC_POLICY_ID_FORBIDDEN',
    'DT07_GRAPH_TIDY_SNAPSHOT_INCOMPLETE',
  ]],
  ['tests/explicit/entries/runIntentDecisionClosure.js', [
    'assertIntentDecisionClosure',
    'DT08_IMPLEMENTATION_SCOPE_IMPORTED',
  ]],
  ['tests/explicit/entries/runImplementationDesignClosure.js', [
    'assertImplementationDesignClosure',
    'DT09_REPAIR_SCOPE_IMPORTED',
  ]],
  ['tests/explicit/entries/runCodingRepairClosure.js', [
    'assertCodingRepairClosure',
  ]],
  ['tests/explicit/entries/runAuditProofClosure.js', [
    'assertAuditProofClosure',
    'DT11_MISSING_SUBJECT_NOT_REJECTED',
  ]],
  ['tests/explicit/entries/runCoherentIntentReading.js', [
    'assertCoherentW6VersionEvidence',
  ]],
  ['tests/explicit/entries/runRelationshipEndpointClosure.js', [
    'assertRelationshipEndpointClosure',
    'governingCanonicalVersionFromLegacyResult',
    'endpointClosureFixture',
  ]],
  ['tests/explicit/entries/runCompleteViewClosure.js', [
    'assertCompleteViewClosure',
    'viewClosureFixture',
    'targetViewId',
    'overlappingViewIds',
  ]],
  ['tests/explicit/entries/runFirstInclusionProvenance.js', [
    'assertFirstInclusionProvenance',
    'duplicatePathFixtures',
    'expectedFirstInclusionReason',
  ]],
]);

// GIVEN the handoff-scoped explicit testcase entrypoints
for (const entryPath of entryPaths) {
  const source = fs.readFileSync(path.join(repoRoot, ...entryPath.split('/')), 'utf8');

  // WHEN each frozen entrypoint is inspected
  // THEN it keeps business-readable phases and uses the Harness abstraction
  for (const phase of ['GIVEN', 'WHEN', 'THEN']) {
    assert(source.includes(phase), `EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: ${entryPath} is missing ${phase}`);
  }
  assert(
    source.includes("harness/intentArchitectureQueryHarness.js"),
    `EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: ${entryPath} must use the intent-query Harness`,
  );
  assert(
    !source.includes("require('../../.argo/") && !source.includes('child_process'),
    `EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: ${entryPath} exposes low-level runtime plumbing`,
  );
  for (const observation of requiredObservations.get(entryPath) || []) {
    assert(
      source.includes(observation),
      `EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: ${entryPath} is missing ${observation}`,
    );
  }
}

const purposeClosureSource = fs.readFileSync(
  path.join(repoRoot, 'tests', 'explicit', 'entries', 'runPurposePolicyClosure.js'),
  'utf8',
);
const semanticCategoriesStart = purposeClosureSource.indexOf('const semanticClosureCategories');
const semanticCategoriesEnd = purposeClosureSource.indexOf(']);', semanticCategoriesStart);
const semanticCategoriesSource = purposeClosureSource.slice(semanticCategoriesStart, semanticCategoriesEnd);
const purposeCategoriesStart = purposeClosureSource.indexOf('const purposeCategories');
const purposeCategoriesEnd = purposeClosureSource.indexOf(']);', purposeCategoriesStart);
const purposeCategoriesSource = purposeClosureSource.slice(purposeCategoriesStart, purposeCategoriesEnd);
assert(
  semanticCategoriesStart >= 0
    && semanticCategoriesEnd > semanticCategoriesStart
    && !semanticCategoriesSource.includes("'graph-tidy'")
    && purposeCategoriesStart >= 0
    && purposeCategoriesEnd > purposeCategoriesStart
    && purposeCategoriesSource.includes('...semanticClosureCategories')
    && purposeCategoriesSource.includes("'graph-tidy'"),
  'EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: DT-07 must dispatch four semantic closure categories plus graph-tidy bypass',
);
const dt07PolicyAssertionStart = purposeClosureSource.indexOf(
  'assertParameterizedClosurePolicy(categoryResults.get(category), {',
);
const dt07PolicyFailureCategory = purposeClosureSource.indexOf(
  "failureCategory: 'DT07_PURPOSE_POLICY'",
  dt07PolicyAssertionStart,
);
const dt07UniquenessAssertionStart = purposeClosureSource.indexOf(
  "assert.strictEqual(new Set(policyIds).size, semanticClosureCategories.length",
);
assert(
  dt07PolicyAssertionStart >= 0
    && dt07PolicyFailureCategory > dt07PolicyAssertionStart
    && dt07UniquenessAssertionStart > dt07PolicyFailureCategory,
  'EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: every DT-07 semantic category must pass parameterized-policy validation before policy-id uniqueness',
);

const harnessPath = path.join(repoRoot, 'tests', 'harness', 'intentArchitectureQueryHarness.js');
const harnessSource = fs.readFileSync(harnessPath, 'utf8');
const typedContractPath = 'tests/explicit/entries/runTypedMcpQueryContract.js';
const typedContractSource = fs.readFileSync(
  path.join(repoRoot, ...typedContractPath.split('/')),
  'utf8',
);
const {
  assertNoProbeCompatibilityUsesInjectedBoundary,
} = require(harnessPath);
const wrapperSource = fs.readFileSync(path.join(repoRoot, '.argo', 'scripts', 'argo-mcp-server.js'), 'utf8');
const innerSource = fs.readFileSync(path.join(repoRoot, '.argo', 'scripts', 'systemarchitecture-mcp-server.js'), 'utf8');
assert(
  harnessSource.includes("require('../../.argo/scripts/argo-mcp-server.js')"),
  'EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: compatibility Harness must traverse the public MCP wrapper',
);
assert(
  wrapperSource.includes('async function callTool(name, args = {}, progressToken = null, dependencies = undefined)')
    && wrapperSource.includes('systemArchitectureMcp.callTool(name, args, dependencies)'),
  'EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: wrapper must accept dependencies at argument four and forward them to the inner argument three',
);
assert(
  innerSource.includes('async function callTool(name, args = {}, dependencies = undefined)'),
  'EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: inner System Architecture boundary must accept dependencies at argument three',
);
const anchoredTidyStart = harnessSource.indexOf('function readAnchoredGraphTidyCompatibilitySnapshot(query)');
const anchoredTidyEnd = harnessSource.indexOf('async function readWithoutPurpose', anchoredTidyStart);
const anchoredTidySource = harnessSource.slice(anchoredTidyStart, anchoredTidyEnd);
assert(
  anchoredTidyStart >= 0
    && anchoredTidyEnd > anchoredTidyStart
    && anchoredTidySource.includes('expectedLegacyEnvelope(readCanonicalSnapshot())')
    && anchoredTidySource.includes("mode: 'full-snapshot'")
    && anchoredTidySource.includes("semanticRetrieval: 'bypassed'")
    && !anchoredTidySource.includes('invokeGetSystemArchitecture'),
  'EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: anchored graph-tidy compatibility must return the canonical snapshot without semantic dispatch',
);
const probeStart = harnessSource.indexOf('function createSemanticRetrievalProbe()');
const probeEnd = harnessSource.indexOf('function assertSemanticRetrievalCalls', probeStart);
assert(
  probeStart >= 0 && probeEnd > probeStart,
  'EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: Harness must own a semantic retrieval probe',
);
const probeSource = harnessSource.slice(probeStart, probeEnd);
for (const requiredProbeBehavior of [
  'const invocations = []',
  'async retrieve(request)',
  'invocations.push(request)',
  'return invocations.length',
]) {
  assert(
    probeSource.includes(requiredProbeBehavior),
    `EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: probe is missing ${requiredProbeBehavior}`,
  );
}
assert(
  !probeSource.includes('response') && !probeSource.includes('result'),
  'EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: probe count must not derive from the tested response',
);
assertApprovedCompatibilityComposition(harnessSource, 'intent-query-approved.fixture.js');
for (const [label, adversarial] of [
  ['raw-substitution', harnessSource.replace(
    /semanticOperatorJourney:\s*createApprovedSemanticOperatorJourneyAdapter\(\s*semanticRetrievalBoundary,\s*\)/,
    'semanticOperatorJourney: semanticRetrievalBoundary',
  )],
  ['undefined-property', harnessSource.replace(
    /semanticOperatorJourney:\s*createApprovedSemanticOperatorJourneyAdapter\(\s*semanticRetrievalBoundary,\s*\)/,
    'semanticOperatorJourney: undefined',
  )],
  ['dead-conditional', harnessSource.replace(
    /semanticOperatorJourney:\s*createApprovedSemanticOperatorJourneyAdapter\(\s*semanticRetrievalBoundary,\s*\)/,
    'semanticOperatorJourney: false\n        ? createApprovedSemanticOperatorJourneyAdapter(semanticRetrievalBoundary)\n        : undefined',
  )],
  ['shadowed-factory', harnessSource.replace(
    'async function invokeGetSystemArchitecture(args, probe) {',
    'async function invokeGetSystemArchitecture(args, probe) {\n  const createApprovedSemanticOperatorJourneyAdapter = () => undefined;',
  )],
]) {
  assert.throws(
    () => assertApprovedCompatibilityComposition(adversarial, `${label}.fixture.js`),
    /EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD/,
    `EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: ${label} compatibility fixture passed`,
  );
}
assertApprovedTypedComposition(typedContractSource, 'typed-contract-approved.fixture.js');
for (const [label, adversarial] of [
  ['typed-raw-substitution', typedContractSource.replace(
    '{ semanticOperatorJourney },',
    '{ semanticOperatorJourney: semanticRetrievalBoundary },',
  )],
  ['typed-missing-journey', typedContractSource.replace(
    '{ semanticOperatorJourney },',
    '{},',
  )],
  ['typed-undefined-journey', typedContractSource.replace(
    '{ semanticOperatorJourney },',
    '{ semanticOperatorJourney: undefined },',
  )],
  ['typed-dead-decoy', typedContractSource
    .replace(
      '{ semanticOperatorJourney },',
      '{ semanticOperatorJourney: undefined },',
    )
    .replace(
      '  const semanticResponse = await callTool(',
      '  createApprovedSemanticOperatorJourneyAdapter(semanticRetrievalBoundary);\n  const semanticResponse = await callTool(',
    )],
  ['typed-shadowed-factory', typedContractSource.replace(
    'async function main() {',
    'async function main() {\n  const createApprovedSemanticOperatorJourneyAdapter = () => undefined;',
  )],
]) {
  assert.throws(
    () => assertApprovedTypedComposition(adversarial, `${label}.fixture.js`),
    /EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD/,
    `EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: ${label} fixture passed`,
  );
}
assert(
  harnessSource.includes("callTool('getSystemArchitecture', args, null, testDependencies)"),
  'EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: compatibility Harness must pass its probe through wrapper argument four',
);
assert(
  !harnessSource.includes("callTool('getSystemArchitecture', args, testDependencies)")
    && !harnessSource.includes("require('../../.argo/scripts/systemarchitecture-mcp-server.js')"),
  'EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: compatibility Harness must not confuse wrapper argument three with inner dependencies',
);
assert(
  !harnessSource.includes('semanticRetrievalInvocationCount')
    && !harnessSource.includes('observeSemanticRetrievalActivity'),
  'EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: response telemetry cannot substitute for the test-owned probe',
);
for (const requiredDefaultBoundaryBehavior of [
  'defaultDeterministicSemanticRetrievalBoundary',
  'args && args.query ? defaultDeterministicSemanticRetrievalBoundary : undefined',
  'NO_PROBE_COMPATIBILITY_BOUNDARY_NOT_INVOKED',
]) {
  assert(
    harnessSource.includes(requiredDefaultBoundaryBehavior),
    `EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: no-probe compatibility boundary omits ${requiredDefaultBoundaryBehavior}`,
  );
}

const handoff = JSON.parse(fs.readFileSync(path.join(repoRoot, '.argo', 'temp', 'ImplementationToCodingHandoff.json'), 'utf8'));
assert(
  handoff.frozenFiles.includes('tests/harness/intentArchitectureQueryHarness.js'),
  'EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: the intent-query Harness must be frozen for Coding/Repair',
);
for (const harnessOwnedAssertion of [
  'DT08_INTENT_CONCERN_UNACCOUNTED',
  'DT09_DEPENDENCY_CHAINS_MISSING',
  'DT10_INTENT_AUTHORITY_MISSING',
  'DT10_UNRELATED_CAPABILITY_INCLUDED',
  'DT11_AUDIT_VIOLATIONS_MISSING',
  'DT00_CANONICAL_VERSION_MISSING',
  'DT00_CANONICAL_VERSION_MISMATCH',
  'DT13_ENDPOINT_CLOSURE_MISSING',
  'DT13_RELATIONSHIPS_EMPTY',
  'DT13_SOURCE_ID_MISMATCH',
  'DT14_VIEW_CLOSURE_MISSING',
  'DT14_TARGET_VIEW_ID_MISSING',
  'DT14_TARGET_VIEW_NOT_RETURNED',
  'DT14_OVERLAPPING_VIEW_RETURNED',
  'DT14_MEMBER_OBJECT_SET_INCOMPLETE',
  'DT14_PARENT_VIEWPOINT_MISSING',
  'DT15_PROVENANCE_EVIDENCE_MISSING',
  'DT15_ORDERED_FIRST_REASON_MISMATCH',
  'DT15_POLICY_PARAMETERS_MISSING',
  'DT15_POLICY_ANCHORS_MISSING',
]) {
  assert(
    harnessSource.includes(harnessOwnedAssertion),
    `EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: Harness omits ${harnessOwnedAssertion}`,
  );
}
assert(
  handoff.frozenFiles.includes('tests/architecture/intent-query/explicit-entrypoint-correctness.guard.js'),
  'EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: compatibility guard must remain frozen for Coding/Repair',
);
assert(
  handoff.frozenFiles.includes(typedContractPath),
  'EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: TS-00 typed contract entry must remain frozen for Coding/Repair',
);

assertNoProbeCompatibilityUsesInjectedBoundary()
  .then(evidence => {
    assert.deepStrictEqual(evidence, {
      wrapperDependencyArgument: 4,
      innerDependencyArgument: 3,
      invocationCount: 1,
    });
  })
  .catch(error => {
    console.error(error && error.stack ? error.stack : error);
    process.exitCode = 1;
  });

function assertApprovedCompatibilityComposition(source, label) {
  const { ast, checker } = parseWithBindings(source, label);
  const invoke = topLevelFunction(ast, 'invokeGetSystemArchitecture');
  const factory = topLevelFunction(ast, 'createApprovedSemanticOperatorJourneyAdapter');
  assert(invoke && factory, 'EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: approved compatibility composition declarations missing');

  const semanticBoundary = variableIn(invoke, 'semanticRetrievalBoundary');
  const dependencies = variableIn(invoke, 'testDependencies');
  const call = callsIn(invoke).find(candidate => (
    ts.isIdentifier(candidate.expression)
    && candidate.expression.text === 'callTool'
    && candidate.arguments[0]
    && ts.isStringLiteral(candidate.arguments[0])
    && candidate.arguments[0].text === 'getSystemArchitecture'
  ));
  assert(
    semanticBoundary
      && dependencies
      && dependencies.initializer
      && ts.isConditionalExpression(dependencies.initializer)
      && isUndefined(dependencies.initializer.whenFalse)
      && call
      && call.arguments.length === 4
      && ts.isIdentifier(call.arguments[3])
      && sameSymbol(checker, call.arguments[3], dependencies.name),
    'EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: wrapper-four dependencies are not bound to the live compatibility selector',
  );

  const property = objectProperty(dependencies.initializer.whenTrue, 'semanticOperatorJourney');
  const propertyValue = property && propertyValueExpression(property, checker);
  assert(
    propertyValue
      && ts.isCallExpression(propertyValue)
      && ts.isIdentifier(propertyValue.expression)
      && sameSymbol(checker, propertyValue.expression, factory.name)
      && propertyValue.arguments.length === 1
      && ts.isIdentifier(propertyValue.arguments[0])
      && sameSymbol(checker, propertyValue.arguments[0], semanticBoundary.name),
    'EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: compatibility journey property does not call the approved bound adapter factory',
  );
  assertApprovedAdapterFactory(factory, checker);
}

function assertApprovedTypedComposition(source, label) {
  const { ast, checker } = parseWithBindings(source, label);
  const main = topLevelFunction(ast, 'main');
  const factory = topLevelFunction(ast, 'createApprovedSemanticOperatorJourneyAdapter');
  const boundary = main && variableIn(main, 'semanticRetrievalBoundary');
  const journey = main && variableIn(main, 'semanticOperatorJourney');
  const semanticCall = main && callsIn(main).find(call => (
    ts.isIdentifier(call.expression)
    && call.expression.text === 'callTool'
    && call.arguments.length === 4
    && call.arguments[0]
    && ts.isStringLiteral(call.arguments[0])
    && call.arguments[0].text === 'getSystemArchitecture'
  ));
  const dependency = semanticCall && semanticCall.arguments[3];
  const property = dependency && objectProperty(dependency, 'semanticOperatorJourney');
  const propertyValue = property && propertyValueExpression(property, checker);
  assert(
    main
      && factory
      && boundary
      && journey
      && journey.initializer
      && ts.isCallExpression(journey.initializer)
      && ts.isIdentifier(journey.initializer.expression)
      && sameSymbol(checker, journey.initializer.expression, factory.name)
      && journey.initializer.arguments.length === 1
      && ts.isIdentifier(journey.initializer.arguments[0])
      && sameSymbol(checker, journey.initializer.arguments[0], boundary.name)
      && propertyValue
      && ts.isCallExpression(propertyValue)
      && ts.isIdentifier(propertyValue.expression)
      && sameSymbol(checker, propertyValue.expression, factory.name),
    'EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: TS-00 semantic call does not bind its journey property to the approved adapter factory',
  );
  assertApprovedAdapterFactory(factory, checker);
}

function assertApprovedAdapterFactory(factory, checker) {
  const boundaryParameter = factory.parameters[0];
  const returns = directReturnExpressions(factory);
  assert(
    boundaryParameter
      && ts.isIdentifier(boundaryParameter.name)
      && returns.length === 1,
    'EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: approved adapter factory return shape changed',
  );
  const queryObject = firstObjectLiteral(returns[0]);
  const query = queryObject && queryObject.properties.find(property => (
    ts.isMethodDeclaration(property)
    && property.name
    && property.name.getText() === 'query'
  ));
  const retrievalCall = query && callsIn(query).find(call => (
    ts.isPropertyAccessExpression(call.expression)
    && call.expression.name.text === 'retrieve'
    && ts.isIdentifier(call.expression.expression)
    && sameSymbol(checker, call.expression.expression, boundaryParameter.name)
  ));
  assert(
    query && retrievalCall,
    'EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: approved adapter query does not call its bound retrieval boundary',
  );
}

function directReturnExpressions(root) {
  const values = [];
  function visit(node) {
    if (node !== root && isFunctionLike(node)) return;
    if (ts.isReturnStatement(node) && node.expression) {
      values.push(node.expression);
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(root);
  return values;
}

function isFunctionLike(node) {
  return ts.isFunctionDeclaration(node)
    || ts.isFunctionExpression(node)
    || ts.isArrowFunction(node)
    || ts.isMethodDeclaration(node);
}

function topLevelFunction(ast, name) {
  return ast.statements.find(statement => (
    ts.isFunctionDeclaration(statement)
    && statement.name
    && statement.name.text === name
  ));
}

function variableIn(root, name) {
  let found;
  walk(root, node => {
    if (
      !found
      && ts.isVariableDeclaration(node)
      && ts.isIdentifier(node.name)
      && node.name.text === name
    ) found = node;
  });
  return found;
}

function callsIn(root) {
  const calls = [];
  walk(root, node => {
    if (ts.isCallExpression(node)) calls.push(node);
  });
  return calls;
}

function objectProperty(expression, name) {
  const object = firstObjectLiteral(expression);
  return object && object.properties.find(property => (
    (ts.isPropertyAssignment(property) || ts.isShorthandPropertyAssignment(property))
    && property.name
    && property.name.getText() === name
  ));
}

function propertyValueExpression(property, checker) {
  if (ts.isPropertyAssignment(property)) return property.initializer;
  const symbol = checker.getShorthandAssignmentValueSymbol(property);
  const declaration = symbol && symbol.declarations && symbol.declarations.find(ts.isVariableDeclaration);
  return declaration && declaration.initializer;
}

function firstObjectLiteral(root) {
  let found;
  walk(root, node => {
    if (!found && ts.isObjectLiteralExpression(node)) found = node;
  });
  return found;
}

function isUndefined(node) {
  return ts.isIdentifier(node) && node.text === 'undefined';
}

function sameSymbol(checker, left, right) {
  return resolvedSymbol(checker, left) === resolvedSymbol(checker, right);
}

function resolvedSymbol(checker, node) {
  let symbol = checker.getSymbolAtLocation(node);
  if (symbol && (symbol.flags & ts.SymbolFlags.Alias)) {
    symbol = checker.getAliasedSymbol(symbol);
  }
  return symbol;
}

function parseWithBindings(source, label) {
  const fileName = path.resolve(repoRoot, '.argo', 'guard-fixtures', label);
  const options = {
    allowJs: true,
    checkJs: false,
    module: ts.ModuleKind.CommonJS,
    noEmit: true,
    target: ts.ScriptTarget.Latest,
  };
  const host = ts.createCompilerHost(options, true);
  const canonical = candidate => path.resolve(candidate).toLowerCase();
  host.fileExists = candidate => canonical(candidate) === canonical(fileName);
  host.readFile = candidate => (
    canonical(candidate) === canonical(fileName) ? source : undefined
  );
  host.getSourceFile = (candidate, languageVersion) => (
    canonical(candidate) === canonical(fileName)
      ? ts.createSourceFile(fileName, source, languageVersion, true, ts.ScriptKind.JS)
      : undefined
  );
  host.writeFile = () => {};
  const program = ts.createProgram([fileName], options, host);
  const ast = program.getSourceFile(fileName);
  assert(ast, `EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: cannot parse ${label}`);
  return { ast, checker: program.getTypeChecker() };
}

function walk(node, visit) {
  visit(node);
  ts.forEachChild(node, child => walk(child, visit));
}

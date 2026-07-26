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

// GIVEN accepted WP-P2 owns the only persistent readiness query and evaluator
// WHEN WP-P3 requires a public read without provider/vector side effects
// THEN Coding may add one method that reuses the same private path and exports no raw internals
assert(
  handoff.codingTargets.some(target => target.path === retrievalPath),
  'WP_P3_READINESS_PUBLIC_GUARD: default retrieval narrow refactor is not authorized',
);
assert(
  !handoff.frozenFiles.includes(retrievalPath),
  'WP_P3_READINESS_PUBLIC_GUARD: authorized default retrieval remains frozen',
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
];
for (const fixture of bypassFixtures) {
  assert.throws(
    () => assertSharedReadinessBoundary(fixture.source, `${fixture.name}.fixture.js`),
    /WP_P3_READINESS_PUBLIC_GUARD/,
    `WP_P3_READINESS_PUBLIC_GUARD: bypass fixture passed: ${fixture.name}`,
  );
}

function assertSharedReadinessBoundary(source, label) {
  const ast = parse(source, label);
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
  const boundaryObject = findReturnedFrozenObject(factory);
  const methods = new Map(boundaryObject.properties.map(property => [propertyName(property), property]));
  for (const name of ['retrieve', 'readReadiness']) {
    assert(methods.has(name), `WP_P3_READINESS_PUBLIC_GUARD: ${label} omits ${name}`);
    assert(
      callsIdentifier(methods.get(name), 'readAndEvaluatePersistentReadiness'),
      `WP_P3_READINESS_PUBLIC_GUARD: ${label} ${name} bypasses shared readiness helper`,
    );
  }
  assert(
    callsIdentifier(methods.get('readReadiness'), 'publicReadinessOutcome'),
    `WP_P3_READINESS_PUBLIC_GUARD: ${label} readReadiness bypasses public outcome mapping`,
  );

  const shared = functions.get('readAndEvaluatePersistentReadiness')[0];
  assert(
    callsIdentifier(shared, 'readPersistentReadiness')
      && callsIdentifier(shared, 'evaluatePersistentReadiness'),
    `WP_P3_READINESS_PUBLIC_GUARD: ${label} shared helper does not reuse accepted read/evaluation`,
  );

  const outcome = functions.get('publicReadinessOutcome')[0];
  const outcomeObject = findReturnedObject(outcome);
  assert.deepStrictEqual(
    outcomeObject.properties.map(propertyName).sort(),
    exactPublicKeys,
    `WP_P3_READINESS_PUBLIC_GUARD: ${label} public readiness envelope changed`,
  );

  const exported = findModuleExports(ast);
  assert.deepStrictEqual(
    exported.properties.map(propertyName).sort(),
    ['createDefaultSemanticRetrieval', 'withDefaultSemanticRetrievalTestComposition'].sort(),
    `WP_P3_READINESS_PUBLIC_GUARD: ${label} exposes private readiness internals`,
  );
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

function callsIdentifier(root, name) {
  let found = false;
  walk(root, node => {
    if (
      ts.isCallExpression(node)
      && ts.isIdentifier(node.expression)
      && node.expression.text === name
    ) found = true;
  });
  return found;
}

function propertyName(property) {
  const name = property.name;
  return name && (ts.isIdentifier(name) || ts.isStringLiteral(name)) ? name.text : '';
}

function parse(source, label) {
  const ast = ts.createSourceFile(label, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  assert.strictEqual(
    ast.parseDiagnostics.length,
    0,
    `WP_P3_READINESS_PUBLIC_GUARD: ${label} is not parseable JavaScript`,
  );
  return ast;
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

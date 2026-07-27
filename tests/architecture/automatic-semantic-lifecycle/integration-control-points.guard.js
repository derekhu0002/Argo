const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const automaticPath = 'tests/harness/automaticSemanticLifecycleHarness.js';
const retrievalPath = 'tests/harness/productionDefaultRetrievalHarness.js';
const backfillEntryPath = 'tests/explicit/entries/runProductionSemanticBackfill.js';
const lifecyclePath = '.argo/scripts/graph-rag/mutationEmbeddingVectorLifecycle.js';
const systemPath = '.argo/scripts/systemarchitecture-mcp-server.js';
const defaultRetrievalPath = '.argo/scripts/graph-rag/defaultSemanticRetrieval.js';
const harnessInitPath = '.argo/scripts/ensureArgoHarnessEnvironment.js';

// GIVEN the frozen successor entrypoints must exercise shipped outward controls
// WHEN their AST call graphs are inspected
// THEN direct private-factory substitutes cannot satisfy init, write, or query evidence
assertIntegrationBindings(read(automaticPath), read(retrievalPath), read(backfillEntryPath), 'repository');
assertWpP2ProductionReuse(read(systemPath), read(defaultRetrievalPath), 'repository');
assertHarnessInitOwnsSemanticLifecycle(read(harnessInitPath), harnessInitPath);

assert.doesNotThrow(
  () => assertWpP2ProductionReuse(`
    function createJourney(readinessStore) {
      return createDefaultSemanticRetrieval({
        canonicalGraph,
        readinessBoundary: readinessStore,
      });
    }
  `, `
    function createDefaultSemanticRetrieval(dependencies) {
      const readinessBoundary = dependencies.readinessBoundary;
      return {
        async retrieve() {
          const readiness = await readinessBoundary.read();
          return preservePublicFailureEvidence(readiness, ['category', 'message', 'action']);
        },
      };
    }
  `, 'compliant-wp-p2-reuse'),
  'SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: compliant WP-P2 reuse rejected',
);

assert.throws(
  () => assertWpP2ProductionReuse(`
    function createJourney() {
      return queryProductionVectorChannels();
    }
    function queryProductionVectorChannels() {
      return 'CALL db.index.vector.queryNodes($indexName, $topK, $vector)';
    }
  `, `
    function createDefaultSemanticRetrieval(dependencies) {
      return dependencies.readinessBoundary;
    }
  `, 'duplicated-wp-p2'),
  /SEMANTIC_LIFECYCLE_INTEGRATION_BINDING/,
  'SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: duplicate production WP-P2 algorithm passed',
);

const commentsOnly = [
  '// unifiedMcp.callTool("initializeWorkspace")',
  '// systemMcp.callTool(invocation.name, invocation.args)',
  '// system.callTool("getSystemArchitecture", args)',
  '// unified.callTool("getSystemArchitecture", args)',
].join('\n');
assert.throws(
  () => assertIntegrationBindings(commentsOnly, commentsOnly, commentsOnly, 'comments-only'),
  /SEMANTIC_LIFECYCLE_INTEGRATION_BINDING/,
  'SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: comments-only bypass passed',
);
assert.throws(
  () => assertHarnessInitOwnsSemanticLifecycle(`
    async function main() {
      report.mcp = verifyArgoMcpServer();
      report.systemArchitecture = await verifyCanonicalSystemArchitecture();
      report.neo4j = await ensureNeo4jProjection();
      report.semanticLifecycle = { state: 'Aligned' };
    }
  `, 'synthetic-report-only'),
  /SEMANTIC_LIFECYCLE_INTEGRATION_BINDING/,
  'SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: harness init report-only bypass passed',
);

assert.throws(
  () => assertPersistentLifecycleNoCleanup(`
    function createPersistentMutationEmbeddingLifecycle(dependencies) {
      return { async reconcile(input) {
        const runId = input.runId;
        await dependencies.projectionStore.cleanup(runId);
      } };
    }
    module.exports = { createPersistentMutationEmbeddingLifecycle };
  `, 'cleanup-bypass.js'),
  /SEMANTIC_LIFECYCLE_INTEGRATION_BINDING/,
  'SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: persistent cleanup bypass passed',
);

const directFactory = `
const { createPersistentMutationEmbeddingLifecycle } = require('mutationEmbeddingVectorLifecycle.js');
const lifecycle = createPersistentMutationEmbeddingLifecycle({});
lifecycle.reconcile({ canonicalWrite: { touchedElementIds: ['synthetic'] } });
`;
assert.throws(
  () => assertIntegrationBindings(directFactory, commentsOnly, commentsOnly, 'direct-factory'),
  /SEMANTIC_LIFECYCLE_INTEGRATION_BINDING/,
  'SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: direct lifecycle factory bypass passed',
);

assert.doesNotThrow(
  () => assertPersistentLifecycleNoCleanup(`
    const persistentFactory = dependencies => ({
      reconcile: async input => dependencies.projectionStore.upsertRecords(input.records),
    });
    const exportedAlias = persistentFactory;
    module.exports = { createPersistentMutationEmbeddingLifecycle: exportedAlias };
  `, 'compliant-alias-export.js'),
  'SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: compliant alias export was not resolved',
);

assert.throws(
  () => assertPersistentLifecycleNoCleanup(`
    const unsafeFactory = dependencies => ({
      reconcile: async () => dependencies.projectionStore.cleanup(),
    });
    const firstAlias = unsafeFactory;
    const exportedAlias = firstAlias;
    module.exports = { createPersistentMutationEmbeddingLifecycle: exportedAlias };
  `, 'unsafe-alias-export.js'),
  /SEMANTIC_LIFECYCLE_INTEGRATION_BINDING.*cleanup/,
  'SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: alias-exported cleanup factory passed',
);

assert.throws(
  () => assertPersistentLifecycleNoCleanup(`
    const cleanupRecords = store => store.cleanup();
    const delegated = cleanupRecords;
    const aliasedHelper = delegated;
    function persistentFactory(dependencies) {
      return { reconcile: () => aliasedHelper(dependencies.projectionStore) };
    }
    module.exports = { createPersistentMutationEmbeddingLifecycle: persistentFactory };
  `, 'aliased-helper-cleanup.js'),
  /SEMANTIC_LIFECYCLE_INTEGRATION_BINDING.*cleanup/,
  'SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: aliased helper cleanup passed',
);

assert.throws(
  () => assertPersistentLifecycleNoCleanup(`
    const unrelatedFactory = () => ({ reconcile() {} });
    module.exports = { unrelatedFactory };
  `, 'missing-production-export.js'),
  /SEMANTIC_LIFECYCLE_INTEGRATION_BINDING.*export.*not resolved/,
  'SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: missing production export returned silently',
);

const aliasedFactory = `
const { createPersistentMutationEmbeddingLifecycle: buildLifecycle } = require('mutationEmbeddingVectorLifecycle.js');
const indirect = buildLifecycle;
indirect({});
`;
assert.throws(
  () => assertNoPrivateFactoryInvocation(parse(aliasedFactory, 'aliased-factory.js'), 'aliased-factory'),
  /SEMANTIC_LIFECYCLE_INTEGRATION_BINDING/,
  'SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: aliased private factory bypass passed',
);

const deadAdapterLiterals = `
async function invokeActualMutationAdapter() { return systemMcp.callTool(invocation.name, invocation.args); }
function buildActualMutationInvocation() { return { name: 'applySystemArchitectureMutation' }; }
const unused = ['previewSystemArchitectureMutation', 'addArchitectureElement', 'updateArchitectureElement',
'removeArchitectureElement', 'addArchitectureRelationship', 'updateArchitectureRelationship',
'removeArchitectureRelationship', 'addArchitectureView', 'updateArchitectureView', 'removeArchitectureView'];
`;
assert.throws(
  () => assertProductionReachableAdapterNames(
    parse(deadAdapterLiterals, 'dead-adapter-literals.js'),
    'dead-adapter-literals',
  ),
  /SEMANTIC_LIFECYCLE_INTEGRATION_BINDING/,
  'SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: dead adapter literal bypass passed',
);

assert.throws(
  () => assertPersistentLifecycleNoCleanup(`
    const delegatedCleanup = store => store.cleanup();
    const createPersistentMutationEmbeddingLifecycle = dependencies => ({
      reconcile: () => delegatedCleanup(dependencies.projectionStore),
    });
    module.exports = { createPersistentMutationEmbeddingLifecycle };
  `, 'delegated-arrow-cleanup.js'),
  /SEMANTIC_LIFECYCLE_INTEGRATION_BINDING/,
  'SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: delegated arrow cleanup bypass passed',
);

// The frozen production guard intentionally remains RED until Coding exports the
// persistent factory; absence is a production gap, never a guard pass.
assertPersistentLifecycleNoCleanup(read(lifecyclePath), lifecyclePath);

function assertIntegrationBindings(automaticSource, retrievalSource, backfillSource, label) {
  const automatic = parse(automaticSource, `${label}-automatic.js`);
  const retrieval = parse(retrievalSource, `${label}-retrieval.js`);
  const backfill = parse(backfillSource, `${label}-backfill.js`);

  const automaticReachable = reachableFunctionNodes(automatic, [
    'observeAutomaticInitLifecycle',
    'runPersistentIncrementalMatrix',
  ]);
  assert(
    hasToolsCallRequest(automaticReachable, 'unifiedMcp', 'initializeWorkspace'),
    `SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: ${label} does not invoke shipped argo init`,
  );
  assert(
    hasToolsCallMemberRequest(
      automaticReachable,
      'systemMcp',
      'invocation',
      'name',
    ),
    `SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: ${label} does not invoke actual mutation adapters`,
  );
  assertProductionReachableAdapterNames(automatic, label);
  assertNoPrivateFactoryInvocation(automatic, label);
  assert(
    automaticReachable.some(node => hasIdentifierCall(node, 'runExportedDurableReadinessStore')),
    `SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: ${label} does not query the shared durable readiness store`,
  );
  assert(
    !automaticReachable.some(node => hasIdentifierCall(node, 'runExportedReadinessScenario')),
    `SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: ${label} re-fixtures mutation readiness for exported queries`,
  );
  const retrievalReachable = reachableFunctionNodes(retrieval, [
    'runExportedFreshReadinessPerQuery',
    'runExportedReadinessStateMatrix',
    'runExportedReadinessScenario',
  ]);
  for (const dispatcher of ['system', 'unified']) {
    const calls = memberCallsInNodes(retrievalReachable, dispatcher, 'callTool').filter(call => (
      stringArgument(call, 0) === 'getSystemArchitecture'
    ));
    assert(calls.length > 0, `SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: ${label} omits ${dispatcher} query`);
    assert(
      calls.every(call => call.arguments.length === 2),
      `SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: ${label} injects a private ${dispatcher} query seam`,
    );
  }
  assert(
    hasRequireBinding(backfill, 'runProductionSemanticBackfill', '../../harness/productionSemanticPersistenceHarness.js'),
    `SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: ${label} drops concrete WP-P1 composition`,
  );
}

function assertHarnessInitOwnsSemanticLifecycle(source, label) {
  const ast = parse(source, label);
  const mainReachable = reachableFunctionNodes(ast, ['main']);
  assert(
    hasRequireBinding(ast, 'runCanonicalSemanticInit', './graph-rag/semanticOperatorJourney.js'),
    `SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: ${label} does not import canonical semantic init`,
  );
  assert(
    hasRequireBinding(ast, 'createDefaultCanonicalSemanticInitComposition', './systemarchitecture-mcp-server.js')
      || hasModuleRequireBinding(ast, 'systemArchitectureMcp', './systemarchitecture-mcp-server.js'),
    `SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: ${label} does not import default semantic init composition`,
  );
  assert(
    mainReachable.some(node => hasIdentifierCall(node, 'runCanonicalSemanticInit')),
    `SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: ${label} does not run semantic lifecycle after projection init`,
  );
  assert(
    mainReachable.some(node => hasPropertyAssignment(node, 'semanticLifecycle')),
    `SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: ${label} does not report semantic lifecycle`,
  );
}

function assertWpP2ProductionReuse(systemSource, defaultSource, label) {
  const system = parse(systemSource, `${label}-system.js`);
  const defaultRetrieval = parse(defaultSource, `${label}-default-retrieval.js`);
  const duplicateNames = new Set([
    'executeProductionSemanticQuery',
    'queryProductionVectorChannels',
  ]);
  visit(system, node => {
    if (
      ts.isFunctionDeclaration(node)
      && node.name
      && duplicateNames.has(node.name.text)
    ) {
      assert.fail(
        `SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: ${label} duplicates WP-P2 function ${node.name.text}`,
      );
    }
    if (
      ts.isStringLiteral(node)
      && node.text.includes('db.index.vector.queryNodes')
    ) {
      assert.fail(
        `SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: ${label} duplicates WP-P2 vector query`,
      );
    }
  });
  const productionCalls = [];
  visit(system, node => {
    if (
      ts.isCallExpression(node)
      && ts.isIdentifier(node.expression)
      && node.expression.text === 'createDefaultSemanticRetrieval'
    ) {
      productionCalls.push(node);
    }
  });
  assert(
    productionCalls.some(call => (
      call.arguments[0]
      && ts.isObjectLiteralExpression(call.arguments[0])
      && call.arguments[0].properties.some(property => propertyName(property.name) === 'readinessBoundary')
    )),
    `SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: ${label} does not pass unified readinessBoundary into WP-P2`,
  );
  assert(
    !hasStringLiteral(defaultRetrieval, 'argo-production-semantic-index'),
    `SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: ${label} retains obsolete WP-P2 readiness identity`,
  );
  const factory = functionNode(defaultRetrieval, 'createDefaultSemanticRetrieval');
  assert(factory, `SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: ${label} omits WP-P2 factory`);
  for (const required of ['readinessBoundary', 'category', 'message', 'action']) {
    assert(
      hasPropertyName(factory, required),
      `SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: ${label} WP-P2 omits ${required}`,
    );
  }
}

function hasPropertyName(node, expected) {
  let found = false;
  visit(node, child => {
    if (
      (ts.isPropertyAccessExpression(child) && child.name.text === expected)
      || (
        (ts.isPropertyAssignment(child) || ts.isShorthandPropertyAssignment(child))
        && propertyName(child.name) === expected
      )
      || (ts.isStringLiteral(child) && child.text === expected)
    ) found = true;
  });
  return found;
}

function assertProductionReachableAdapterNames(automatic, label) {
  const invocationBuilder = functionNode(automatic, 'buildActualMutationInvocation');
  assert(invocationBuilder, `SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: ${label} omits mutation invocation builder`);
  assert(
    returnsFocusedAdapterLookup(invocationBuilder),
    `SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: ${label} focused adapter names are not production-reachable`,
  );
  for (const toolName of [
    'applySystemArchitectureMutation',
    'previewSystemArchitectureMutation',
    'addArchitectureElement',
    'updateArchitectureElement',
    'removeArchitectureElement',
    'addArchitectureRelationship',
    'updateArchitectureRelationship',
    'removeArchitectureRelationship',
    'addArchitectureView',
    'updateArchitectureView',
    'removeArchitectureView',
  ]) {
    assert(
      hasStringLiteral(invocationBuilder, toolName),
      `SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: ${label} omits adapter ${toolName}`,
    );
  }
}

function parse(source, label) {
  return ts.createSourceFile(label, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
}

function visit(node, callback) {
  callback(node);
  ts.forEachChild(node, child => visit(child, callback));
}

function memberCalls(ast, objectName, memberName) {
  const calls = [];
  visit(ast, node => {
    if (
      ts.isCallExpression(node)
      && ts.isPropertyAccessExpression(node.expression)
      && ts.isIdentifier(node.expression.expression)
      && node.expression.expression.text === objectName
      && node.expression.name.text === memberName
    ) calls.push(node);
  });
  return calls;
}

function memberCallsInNodes(nodes, objectName, memberName) {
  return nodes.flatMap(node => memberCalls(node, objectName, memberName));
}

function hasMemberCall(ast, objectName, memberName, firstArgument) {
  return memberCalls(ast, objectName, memberName)
    .some(call => stringArgument(call, 0) === firstArgument);
}

function hasMemberCallWithMemberArgument(ast, objectName, memberName, argumentObject, argumentMember) {
  return memberCalls(ast, objectName, memberName).some(call => {
    const argument = call.arguments[0];
    return ts.isPropertyAccessExpression(argument)
      && ts.isIdentifier(argument.expression)
      && argument.expression.text === argumentObject
      && argument.name.text === argumentMember;
  });
}

function hasMemberCallWithMemberArgumentInNodes(nodes, objectName, memberName, argumentObject, argumentMember) {
  return nodes.some(node => (
    hasMemberCallWithMemberArgument(node, objectName, memberName, argumentObject, argumentMember)
  ));
}

function hasIdentifierCall(ast, name) {
  let found = false;
  visit(ast, node => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name) {
      found = true;
    }
  });
  return found;
}

function hasStringLiteral(ast, value) {
  let found = false;
  visit(ast, node => {
    if (ts.isStringLiteral(node) && node.text === value) found = true;
  });
  return found;
}

function stringArgument(call, index) {
  const argument = call.arguments[index];
  return ts.isStringLiteral(argument) ? argument.text : undefined;
}

function hasRequireBinding(ast, exportedName, modulePath) {
  let found = false;
  visit(ast, node => {
    if (!ts.isVariableDeclaration(node) || !ts.isObjectBindingPattern(node.name)) return;
    if (
      !node.initializer
      || !ts.isCallExpression(node.initializer)
      || !ts.isIdentifier(node.initializer.expression)
      || node.initializer.expression.text !== 'require'
      || stringArgument(node.initializer, 0) !== modulePath
    ) return;
    if (node.name.elements.some(element => element.name.text === exportedName)) found = true;
  });
  return found;
}

function hasModuleRequireBinding(ast, localName, modulePath) {
  let found = false;
  visit(ast, node => {
    if (
      ts.isVariableDeclaration(node)
      && ts.isIdentifier(node.name)
      && node.name.text === localName
      && node.initializer
      && ts.isCallExpression(node.initializer)
      && ts.isIdentifier(node.initializer.expression)
      && node.initializer.expression.text === 'require'
      && stringArgument(node.initializer, 0) === modulePath
    ) found = true;
  });
  return found;
}

function hasPropertyAssignment(ast, propertyName) {
  let found = false;
  visit(ast, node => {
    if (
      ts.isPropertyAssignment(node)
      && (
        (ts.isIdentifier(node.name) && node.name.text === propertyName)
        || (ts.isStringLiteral(node.name) && node.name.text === propertyName)
      )
    ) found = true;
    if (
      ts.isBinaryExpression(node)
      && node.operatorToken.kind === ts.SyntaxKind.EqualsToken
      && ts.isPropertyAccessExpression(node.left)
      && node.left.name.text === propertyName
    ) found = true;
  });
  return found;
}

function functionNode(ast, name) {
  let found;
  visit(ast, node => {
    if (
      ts.isFunctionDeclaration(node)
      && node.name
      && node.name.text === name
    ) found = node;
    if (
      ts.isVariableDeclaration(node)
      && ts.isIdentifier(node.name)
      && node.name.text === name
      && node.initializer
      && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))
    ) found = node.initializer;
  });
  return found;
}

function reachableFunctionNodes(ast, roots) {
  const functions = new Map();
  visit(ast, node => {
    if (ts.isFunctionDeclaration(node) && node.name) functions.set(node.name.text, node);
    if (
      ts.isVariableDeclaration(node)
      && ts.isIdentifier(node.name)
      && node.initializer
      && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))
    ) functions.set(node.name.text, node.initializer);
  });
  const reachable = [];
  const pending = [...roots];
  const seen = new Set();
  while (pending.length > 0) {
    const name = pending.pop();
    if (seen.has(name) || !functions.has(name)) continue;
    seen.add(name);
    const node = functions.get(name);
    reachable.push(node);
    visit(node, child => {
      if (ts.isCallExpression(child) && ts.isIdentifier(child.expression)) {
        pending.push(child.expression.text);
      }
    });
  }
  return reachable;
}

function hasToolsCallRequest(nodes, dispatcher, toolName) {
  return memberCallsInNodes(nodes, dispatcher, 'handleRequest').some(call => {
    const request = call.arguments[0];
    return objectContainsPropertyValue(request, 'method', 'tools/call')
      && objectContainsNestedPropertyValue(request, 'params', 'name', toolName);
  });
}

function hasToolsCallMemberRequest(nodes, dispatcher, argumentObject, argumentMember) {
  return memberCallsInNodes(nodes, dispatcher, 'handleRequest').some(call => {
    const request = call.arguments[0];
    if (!objectContainsPropertyValue(request, 'method', 'tools/call')) return false;
    if (!request || !ts.isObjectLiteralExpression(request)) return false;
    const params = request.properties.find(property => (
      ts.isPropertyAssignment(property) && property.name.getText() === 'params'
    ));
    if (!params || !ts.isObjectLiteralExpression(params.initializer)) return false;
    const name = params.initializer.properties.find(property => (
      ts.isPropertyAssignment(property) && property.name.getText() === 'name'
    ));
    return name
      && ts.isPropertyAccessExpression(name.initializer)
      && ts.isIdentifier(name.initializer.expression)
      && name.initializer.expression.text === argumentObject
      && name.initializer.name.text === argumentMember;
  });
}

function objectContainsPropertyValue(node, propertyName, value) {
  if (!node || !ts.isObjectLiteralExpression(node)) return false;
  return node.properties.some(property => (
    ts.isPropertyAssignment(property)
    && property.name.getText().replaceAll(/['"]/g, '') === propertyName
    && ts.isStringLiteral(property.initializer)
    && property.initializer.text === value
  ));
}

function objectContainsNestedPropertyValue(node, parentName, propertyName, value) {
  if (!node || !ts.isObjectLiteralExpression(node)) return false;
  const parent = node.properties.find(property => (
    ts.isPropertyAssignment(property)
    && property.name.getText().replaceAll(/['"]/g, '') === parentName
  ));
  return parent && objectContainsPropertyValue(parent.initializer, propertyName, value);
}

function returnsFocusedAdapterLookup(node) {
  let found = false;
  visit(node, child => {
    if (!ts.isReturnStatement(child) || !child.expression || !ts.isObjectLiteralExpression(child.expression)) return;
    for (const property of child.expression.properties) {
      if (!ts.isPropertyAssignment(property) || property.name.getText() !== 'name') continue;
      const text = property.initializer.getText();
      if (
        text.includes('focusedNames')
        && text.includes('mutation.objectType')
        && text.includes('mutation.operation')
      ) found = true;
    }
  });
  return found;
}

function assertNoPrivateFactoryInvocation(ast, label) {
  const forbiddenExports = new Set([
    'createPersistentMutationEmbeddingLifecycle',
    'createProductionSemanticOperatorJourney',
  ]);
  const forbiddenLocals = new Set();
  const moduleBindings = new Set();
  visit(ast, node => {
    if (!ts.isVariableDeclaration(node) || !node.initializer) return;
    if (
      ts.isObjectBindingPattern(node.name)
      && ts.isCallExpression(node.initializer)
      && ts.isIdentifier(node.initializer.expression)
      && node.initializer.expression.text === 'require'
    ) {
      for (const element of node.name.elements) {
        const exported = element.propertyName ? element.propertyName.text : element.name.text;
        if (forbiddenExports.has(exported)) forbiddenLocals.add(element.name.text);
      }
    }
    if (
      ts.isIdentifier(node.name)
      && ts.isCallExpression(node.initializer)
      && ts.isIdentifier(node.initializer.expression)
      && node.initializer.expression.text === 'require'
      && node.initializer.arguments[0]
      && /semanticOperatorJourney|mutationEmbeddingVectorLifecycle/.test(node.initializer.arguments[0].getText())
    ) moduleBindings.add(node.name.text);
  });
  let changed = true;
  while (changed) {
    changed = false;
    visit(ast, node => {
      if (
        ts.isVariableDeclaration(node)
        && ts.isIdentifier(node.name)
        && node.initializer
        && ts.isIdentifier(node.initializer)
        && forbiddenLocals.has(node.initializer.text)
        && !forbiddenLocals.has(node.name.text)
      ) {
        forbiddenLocals.add(node.name.text);
        changed = true;
      }
    });
  }
  visit(ast, node => {
    if (!ts.isCallExpression(node)) return;
    if (ts.isIdentifier(node.expression) && forbiddenLocals.has(node.expression.text)) {
      assert.fail(`SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: ${label} invokes aliased private factory`);
    }
    if (
      ts.isPropertyAccessExpression(node.expression)
      && ts.isIdentifier(node.expression.expression)
      && moduleBindings.has(node.expression.expression.text)
      && forbiddenExports.has(node.expression.name.text)
    ) {
      assert.fail(`SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: ${label} invokes module private factory`);
    }
  });
}

function assertPersistentLifecycleNoCleanup(source, label) {
  const ast = parse(source, label);
  const index = buildFunctionAliasIndex(ast);
  const factory = resolveExportedFactory(
    ast,
    'createPersistentMutationEmbeddingLifecycle',
    index,
    label,
  );
  const reachable = reachableFactoryNodes(factory, index);
  for (const body of reachable) visit(body, node => {
    const text = ts.isIdentifier(node) || ts.isStringLiteral(node)
      ? node.text
      : ts.isPropertyAccessExpression(node)
        ? node.name.text
        : '';
    if (
      /runId/i.test(text)
      || /cleanup|clear|truncate|reset|deleteByRun/i.test(text)
    ) {
      assert.fail(
        `SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: ${label} persistent lifecycle reaches production cleanup/runId`,
      );
    }
  });
}

function buildFunctionAliasIndex(ast) {
  const functions = new Map();
  const aliases = new Map();
  visit(ast, node => {
    if (ts.isFunctionDeclaration(node) && node.name) {
      functions.set(node.name.text, node);
      return;
    }
    if (!ts.isVariableDeclaration(node) || !ts.isIdentifier(node.name) || !node.initializer) return;
    if (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer)) {
      functions.set(node.name.text, node.initializer);
    } else if (ts.isIdentifier(node.initializer)) {
      aliases.set(node.name.text, node.initializer.text);
    }
  });
  return Object.freeze({ functions, aliases });
}

function resolveExportedFactory(ast, exportName, index, label) {
  let exportedExpression;
  visit(ast, node => {
    if (
      ts.isBinaryExpression(node)
      && node.operatorToken.kind === ts.SyntaxKind.EqualsToken
      && isModuleExports(node.left)
      && ts.isObjectLiteralExpression(node.right)
    ) {
      for (const property of node.right.properties) {
        const name = propertyName(property.name);
        if (name !== exportName) continue;
        if (ts.isPropertyAssignment(property)) exportedExpression = property.initializer;
        if (ts.isShorthandPropertyAssignment(property)) exportedExpression = property.name;
      }
    }
    if (
      ts.isBinaryExpression(node)
      && node.operatorToken.kind === ts.SyntaxKind.EqualsToken
      && isNamedExport(node.left, exportName)
    ) {
      exportedExpression = node.right;
    }
  });
  assert(
    exportedExpression,
    `SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: ${label} production factory export ${exportName} not resolved`,
  );
  const factory = resolveFunctionExpression(exportedExpression, index);
  assert(
    factory,
    `SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: ${label} production factory export ${exportName} does not resolve to a function`,
  );
  return factory;
}

function isModuleExports(node) {
  return ts.isPropertyAccessExpression(node)
    && ts.isIdentifier(node.expression)
    && node.expression.text === 'module'
    && node.name.text === 'exports';
}

function isNamedExport(node, exportName) {
  if (!ts.isPropertyAccessExpression(node) || node.name.text !== exportName) return false;
  return (
    ts.isIdentifier(node.expression) && node.expression.text === 'exports'
  ) || isModuleExports(node.expression);
}

function propertyName(name) {
  if (!name) return undefined;
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text;
  return name.getText().replaceAll(/['"]/g, '');
}

function resolveFunctionExpression(expression, index) {
  if (ts.isArrowFunction(expression) || ts.isFunctionExpression(expression)) return expression;
  if (!ts.isIdentifier(expression)) return undefined;
  const visited = new Set();
  let name = expression.text;
  while (!visited.has(name)) {
    visited.add(name);
    if (index.functions.has(name)) return index.functions.get(name);
    if (!index.aliases.has(name)) return undefined;
    name = index.aliases.get(name);
  }
  return undefined;
}

function reachableFactoryNodes(factory, index) {
  const reachable = [];
  const pending = [factory];
  const seen = new Set();
  while (pending.length > 0) {
    const node = pending.pop();
    if (seen.has(node)) continue;
    seen.add(node);
    reachable.push(node);
    visit(node, child => {
      if (!ts.isCallExpression(child) || !ts.isIdentifier(child.expression)) return;
      const target = resolveFunctionExpression(child.expression, index);
      if (target && !seen.has(target)) pending.push(target);
    });
  }
  return reachable;
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

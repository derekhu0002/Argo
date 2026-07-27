const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const automaticPath = 'tests/harness/automaticSemanticLifecycleHarness.js';
const retrievalPath = 'tests/harness/productionDefaultRetrievalHarness.js';
const backfillEntryPath = 'tests/explicit/entries/runProductionSemanticBackfill.js';
const lifecyclePath = '.argo/scripts/graph-rag/mutationEmbeddingVectorLifecycle.js';

// GIVEN the frozen successor entrypoints must exercise shipped outward controls
// WHEN their AST call graphs are inspected
// THEN direct private-factory substitutes cannot satisfy init, write, or query evidence
assertIntegrationBindings(read(automaticPath), read(retrievalPath), read(backfillEntryPath), 'repository');
assertPersistentLifecycleNoCleanup(read(lifecyclePath), lifecyclePath);

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
  () => assertPersistentLifecycleNoCleanup(`
    function createPersistentMutationEmbeddingLifecycle(dependencies) {
      return { async reconcile(input) {
        const runId = input.runId;
        await dependencies.projectionStore.cleanup(runId);
      } };
    }
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
  const factory = functionNode(ast, 'createPersistentMutationEmbeddingLifecycle');
  if (!factory) return;
  const reachable = reachableFunctionNodes(ast, ['createPersistentMutationEmbeddingLifecycle']);
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

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

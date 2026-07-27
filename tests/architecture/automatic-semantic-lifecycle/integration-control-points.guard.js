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

function assertIntegrationBindings(automaticSource, retrievalSource, backfillSource, label) {
  const automatic = parse(automaticSource, `${label}-automatic.js`);
  const retrieval = parse(retrievalSource, `${label}-retrieval.js`);
  const backfill = parse(backfillSource, `${label}-backfill.js`);

  assert(
    hasMemberCall(automatic, 'unifiedMcp', 'callTool', 'initializeWorkspace'),
    `SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: ${label} does not invoke shipped argo init`,
  );
  assert(
    hasMemberCallWithMemberArgument(automatic, 'systemMcp', 'callTool', 'invocation', 'name'),
    `SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: ${label} does not invoke actual mutation adapters`,
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
      hasStringLiteral(automatic, toolName),
      `SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: ${label} omits adapter ${toolName}`,
    );
  }
  assert(
    !hasIdentifierCall(automatic, 'createPersistentMutationEmbeddingLifecycle')
      && !hasIdentifierCall(automatic, 'createProductionSemanticOperatorJourney'),
    `SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: ${label} directly invokes a private lifecycle factory`,
  );
  for (const dispatcher of ['system', 'unified']) {
    const calls = memberCalls(retrieval, dispatcher, 'callTool').filter(call => (
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

function assertPersistentLifecycleNoCleanup(source, label) {
  const ast = parse(source, label);
  let factory;
  visit(ast, node => {
    if (
      ts.isFunctionDeclaration(node)
      && node.name
      && node.name.text === 'createPersistentMutationEmbeddingLifecycle'
    ) factory = node;
  });
  if (!factory) return;
  visit(factory, node => {
    if (
      (ts.isIdentifier(node) && node.text === 'runId')
      || (ts.isPropertyAccessExpression(node) && ['cleanup', 'clear', 'truncate'].includes(node.name.text))
    ) {
      assert.fail(
        `SEMANTIC_LIFECYCLE_INTEGRATION_BINDING: ${label} persistent lifecycle contains production cleanup/runId`,
      );
    }
  });
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const handoff = JSON.parse(read('.argo/temp/ImplementationToCodingHandoff.json'));
const authorized = (handoff.codingTargets || []).map(target => target.path).sort();
const expectedAuthorized = [
  '.argo/scripts/argo-mcp-server.js',
  '.argo/scripts/graph-rag/semanticOperatorJourney.js',
  '.argo/scripts/semanticOperatorJourneyCli.js',
  '.argo/scripts/systemarchitecture-mcp-server.js',
  'README.md',
  'package.json',
].sort();
const operatorPath = '.argo/scripts/graph-rag/semanticOperatorJourney.js';
const cliPath = '.argo/scripts/semanticOperatorJourneyCli.js';
const systemPath = '.argo/scripts/systemarchitecture-mcp-server.js';
const gatewayPath = '.argo/scripts/argo-mcp-server.js';
const sensitiveNamePattern = /provider|model|baseurl|dimension|password|secret|api[_-]?key|credential|qwen_key|argo_neo4j_database/i;
const suspiciousLiteralPattern = /qwen|alibaba-cloud|openai|api[_-]?key|credential|password|secret|token|(?:neo4j|bolt)(?:\+s|\+ssc)?:\/\//i;
const duplicateInternalPattern = /db\.index\.vector\.queryNodes|neo4j\.auth\.basic|createProductionSemantic(?:Backfill|CheckpointStore|Neo4jAdapter|ProjectionStore)|MATCH\s*\(|MERGE\s*\(/i;

// GIVEN only six WP-P3 production/operator files are authorized
// WHEN structural source policy and executable adversarial fixtures are evaluated
// THEN configuration may be forwarded directly but never defaulted, embedded, or reimplemented
assert.deepStrictEqual(
  authorized,
  expectedAuthorized,
  'WP_P3_AUTHORIZED_SAFETY_GUARD: exact Coding authorization changed',
);

for (const relativePath of [operatorPath, cliPath, gatewayPath]) {
  if (!exists(relativePath)) continue;
  assertNoUnsafeSource(relativePath, read(relativePath));
}
if (exists(operatorPath)) {
  const systemSource = read(systemPath);
  const compositionSource = extractFunctionSource(
    systemSource,
    systemPath,
    'createDefaultProductionSemanticOperatorJourney',
  );
  assertNoUnsafeSource(`${systemPath}#createDefaultProductionSemanticOperatorJourney`, compositionSource);
}
if (exists('README.md')) assertDocumentationSafe(read('README.md'));
if (exists('package.json')) assertPackageSafe(read('package.json'));

const safeExternalPlumbing = `
const provider = options.provider;
const modelAlias = approvedConfiguration.model;
const credential = approvedConfiguration.embeddingCredential;
const { provider: suppliedProvider, model: suppliedModel } = approvedConfiguration;
const configuration = {
  provider: suppliedProvider,
  model: suppliedModel,
  credential,
};
createProviderClient({
  provider: configuration.provider,
  model: configuration.model,
  credential: configuration.credential,
});
`;
assert.doesNotThrow(
  () => assertNoUnsafeSource('safe-approved-external.fixture.js', safeExternalPlumbing),
  'WP_P3_AUTHORIZED_SAFETY_GUARD: legitimate approved external plumbing was rejected',
);

const unsafeFixtures = [
  ['provider-assignment', 'const provider = "qwen-default";'],
  ['provider-logical-default', 'const provider = options.provider || "qwen-default";'],
  ['model-nullish-default', 'const model = options.model ?? "qwen-default";'],
  ['credential-ternary-default', 'const credential = options.credential ? options.credential : "embedded-secret";'],
  ['provider-alias', 'const fallback = "qwen-default"; const provider = fallback;'],
  ['credential-alias', 'const fallback = "embedded-secret"; const credential = fallback;'],
  ['provider-object-property', 'const profile = { provider: "qwen-default" };'],
  ['model-object-fallback', 'const profile = { model: options.model || "qwen-default" };'],
  ['credential-object-fallback', 'const profile = { credential: options.credential ?? "embedded-secret" };'],
  ['provider-factory-argument', 'createProviderClient({ provider: options.provider || "qwen-default" });'],
  ['model-factory-argument', 'createProviderClient({ model: "qwen-default" });'],
  ['credential-factory-argument', 'createProviderClient({ credential: "embedded-secret" });'],
  ['positional-provider-default', 'createProvider(options.provider || "qwen-default");'],
  ['generic-alias-literal', 'const fallback = "generic"; const provider = fallback;'],
  ['generic-alias-chain', 'const first = "generic"; const second = first; const model = second;'],
  ['destructuring-default', 'const { provider = "generic" } = options;'],
  ['destructuring-alias-default', 'const { value: fallback = "generic" } = options; const credential = fallback;'],
  ['parameter-default', 'function build(provider = "generic") { return provider; }'],
  ['parameter-alias-default', 'function build(fallback = "generic") { const model = fallback; return model; }'],
  ['assignment-alias-default', 'let fallback = "generic"; let provider; provider = fallback;'],
  ['database-uri', 'const endpoint = "neo4j://embedded.example:7687";'],
  ['duplicate-internals', 'session.run("MATCH (n) RETURN n")'],
];
for (const [name, source] of unsafeFixtures) {
  assert.throws(
    () => assertNoUnsafeSource(`${name}.fixture.js`, source),
    /WP_P3_AUTHORIZED_SAFETY_GUARD/,
    `WP_P3_AUTHORIZED_SAFETY_GUARD: unsafe fixture passed: ${name}`,
  );
}

function assertNoUnsafeSource(label, source) {
  const ast = parse(source, label);
  const taintedAliases = collectTaintedAliases(ast);
  walk(ast, node => {
    if (
      (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
      && /(?:neo4j|bolt)(?:\+s|\+ssc)?:\/\//i.test(node.text)
    ) {
      assert.fail(`WP_P3_AUTHORIZED_SAFETY_GUARD: ${label} embeds a database URI`);
    }
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      assertSafeBinding(node.name.text, node.initializer, taintedAliases, label);
    }
    if (ts.isBindingElement(node) && node.initializer) {
      for (const name of bindingNames(node.name)) {
        assert(
          !isSensitiveName(name),
          `WP_P3_AUTHORIZED_SAFETY_GUARD: ${label} defaults sensitive destructured binding ${name}`,
        );
      }
    }
    if (ts.isParameter(node) && node.initializer) {
      for (const name of bindingNames(node.name)) {
        assert(
          !isSensitiveName(name),
          `WP_P3_AUTHORIZED_SAFETY_GUARD: ${label} defaults sensitive parameter ${name}`,
        );
      }
    }
    if (
      ts.isBinaryExpression(node)
      && node.operatorToken.kind === ts.SyntaxKind.EqualsToken
    ) {
      assertSafeBinding(expressionName(node.left), node.right, taintedAliases, label);
    }
    if (ts.isPropertyAssignment(node)) {
      const name = propertyName(node);
      if (isSensitiveName(name)) {
        assert(
          !isUnsafeExpression(node.initializer, true, taintedAliases),
          `WP_P3_AUTHORIZED_SAFETY_GUARD: ${label} defaults or embeds ${name}`,
        );
      }
    }
    if (ts.isCallExpression(node)) {
      const callee = expressionName(node.expression);
      if (isSensitiveName(callee)) {
        for (const argument of node.arguments) {
          assert(
            !isUnsafeExpression(argument, true, taintedAliases),
            `WP_P3_AUTHORIZED_SAFETY_GUARD: ${label} passes an unsafe provider/model/credential factory argument`,
          );
        }
      }
    }
  });
  assert(
    !duplicateInternalPattern.test(stripComments(source)),
    `WP_P3_AUTHORIZED_SAFETY_GUARD: ${label} duplicates accepted WP-P1/WP-P2 internals`,
  );
}

function assertSafeBinding(name, initializer, taintedAliases, label) {
  if (!initializer || !isSensitiveName(name)) return;
  assert(
    !isUnsafeExpression(initializer, true, taintedAliases),
    `WP_P3_AUTHORIZED_SAFETY_GUARD: ${label} defaults or embeds ${name}`,
  );
}

function collectTaintedAliases(ast) {
  const tainted = new Set();
  let changed = true;
  while (changed) {
    changed = false;
    walk(ast, node => {
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
        changed = taintIfDefaulted(node.name.text, node.initializer, tainted) || changed;
      }
      if (ts.isBindingElement(node) && node.initializer) {
        for (const name of bindingNames(node.name)) {
          if (!tainted.has(name)) {
            tainted.add(name);
            changed = true;
          }
        }
      }
      if (ts.isParameter(node) && node.initializer) {
        for (const name of bindingNames(node.name)) {
          if (!tainted.has(name)) {
            tainted.add(name);
            changed = true;
          }
        }
      }
      if (
        ts.isBinaryExpression(node)
        && node.operatorToken.kind === ts.SyntaxKind.EqualsToken
        && ts.isIdentifier(node.left)
      ) {
        changed = taintIfDefaulted(node.left.text, node.right, tainted) || changed;
      }
    });
  }
  return tainted;
}

function taintIfDefaulted(name, expression, tainted) {
  if (!isDefaultSourceExpression(expression, tainted) || tainted.has(name)) return false;
  tainted.add(name);
  return true;
}

function isDefaultSourceExpression(node, tainted) {
  if (!node) return false;
  if (ts.isParenthesizedExpression(node)) return isDefaultSourceExpression(node.expression, tainted);
  if (
    ts.isStringLiteral(node)
    || ts.isNoSubstitutionTemplateLiteral(node)
    || ts.isNumericLiteral(node)
    || node.kind === ts.SyntaxKind.TrueKeyword
    || node.kind === ts.SyntaxKind.FalseKeyword
    || node.kind === ts.SyntaxKind.NullKeyword
  ) return true;
  if (ts.isIdentifier(node)) return tainted.has(node.text);
  if (
    ts.isBinaryExpression(node)
    && (
      node.operatorToken.kind === ts.SyntaxKind.BarBarToken
      || node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken
    )
  ) return true;
  if (ts.isConditionalExpression(node)) return true;
  if (ts.isObjectLiteralExpression(node)) {
    return node.properties.some(property => (
      ts.isPropertyAssignment(property)
      && isDefaultSourceExpression(property.initializer, tainted)
    ));
  }
  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.some(element => isDefaultSourceExpression(element, tainted));
  }
  return false;
}

function isUnsafeExpression(node, sensitiveContext, taintedAliases) {
  if (!node) return false;
  if (ts.isParenthesizedExpression(node)) {
    return isUnsafeExpression(node.expression, sensitiveContext, taintedAliases);
  }
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return Boolean(node.text) && (sensitiveContext || suspiciousLiteralPattern.test(node.text));
  }
  if (ts.isNumericLiteral(node)) return sensitiveContext;
  if (ts.isIdentifier(node)) return taintedAliases.has(node.text);
  if (
    ts.isBinaryExpression(node)
    && (
      node.operatorToken.kind === ts.SyntaxKind.BarBarToken
      || node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken
    )
  ) {
    return sensitiveContext
      || containsSensitiveReference(node)
      || isUnsafeExpression(node.left, false, taintedAliases)
      || isUnsafeExpression(node.right, false, taintedAliases);
  }
  if (ts.isConditionalExpression(node)) {
    return sensitiveContext
      || containsSensitiveReference(node)
      || isUnsafeExpression(node.whenTrue, false, taintedAliases)
      || isUnsafeExpression(node.whenFalse, false, taintedAliases);
  }
  if (ts.isObjectLiteralExpression(node)) {
    return node.properties.some(property => (
      ts.isPropertyAssignment(property)
      && isUnsafeExpression(
        property.initializer,
        sensitiveContext || isSensitiveName(propertyName(property)),
        taintedAliases,
      )
    ));
  }
  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.some(element => isUnsafeExpression(element, sensitiveContext, taintedAliases));
  }
  if (ts.isCallExpression(node)) {
    const callContext = sensitiveContext || isSensitiveName(expressionName(node.expression));
    return node.arguments.some(argument => isUnsafeExpression(argument, callContext, taintedAliases));
  }
  return false;
}

function containsSensitiveReference(node) {
  let found = false;
  walk(node, candidate => {
    if (ts.isIdentifier(candidate) && isSensitiveName(candidate.text)) found = true;
    if (
      ts.isPropertyAccessExpression(candidate)
      && isSensitiveName(candidate.name.text)
    ) found = true;
  });
  return found;
}

function extractFunctionSource(source, label, functionName) {
  const ast = parse(source, label);
  let found;
  walk(ast, node => {
    if (
      ts.isFunctionDeclaration(node)
      && node.name
      && node.name.text === functionName
    ) found = node;
  });
  assert(found, `WP_P3_AUTHORIZED_SAFETY_GUARD: ${label} omits ${functionName}`);
  return found.getText(ast);
}

function assertDocumentationSafe(source) {
  assert(
    !/(?:QWEN_KEY|ARGO_NEO4J_DATABASE_PASSWORD)\s*=\s*\S+/.test(source),
    'WP_P3_AUTHORIZED_SAFETY_GUARD: README embeds a secret value example',
  );
}

function assertPackageSafe(source) {
  assert(
    !/(?:QWEN_KEY|ARGO_NEO4J_DATABASE_(?:URL|USERNAME|PASSWORD))\s*=/.test(source),
    'WP_P3_AUTHORIZED_SAFETY_GUARD: package command injects configuration',
  );
}

function isSensitiveName(name) {
  return Boolean(name) && sensitiveNamePattern.test(name);
}

function expressionName(node) {
  if (!node) return '';
  if (ts.isIdentifier(node)) return node.text;
  if (ts.isPropertyAccessExpression(node)) return node.name.text;
  return '';
}

function propertyName(property) {
  const name = property.name;
  return name && (ts.isIdentifier(name) || ts.isStringLiteral(name)) ? name.text : '';
}

function bindingNames(name) {
  if (ts.isIdentifier(name)) return [name.text];
  if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
    return name.elements.flatMap(element => (
      ts.isBindingElement(element) ? bindingNames(element.name) : []
    ));
  }
  return [];
}

function parse(source, label) {
  const ast = ts.createSourceFile(label, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  assert.strictEqual(
    ast.parseDiagnostics.length,
    0,
    `WP_P3_AUTHORIZED_SAFETY_GUARD: ${label} is not parseable JavaScript`,
  );
  return ast;
}

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
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

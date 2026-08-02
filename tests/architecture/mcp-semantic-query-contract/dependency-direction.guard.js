const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const productionPaths = [
  '.argo/scripts/argo-mcp-server.js',
  '.argo/scripts/systemarchitecture-mcp-server.js',
  '.argo/scripts/graph-rag/productionGraphRagRuntime.js',
  '.argo/scripts/graph-rag/defaultSemanticRetrieval.js',
];

// GIVEN the production query, retrieval, and closure modules
for (const productionPath of productionPaths) {
  const source = read(productionPath);

  // WHEN dependency direction is inspected
  // THEN production code remains independent of test contracts and fixtures.
  assert(
    !/require\(['"][^'"]*tests[\\/]/.test(source) && !/from\s+['"][^'"]*tests[\\/]/.test(source),
    `MCP_SEMANTIC_DEPENDENCY_DIRECTION_GUARD: ${productionPath} must not depend on tests`,
  );
}

const handoff = JSON.parse(read('.argo/temp/ImplementationToCodingHandoff.json'));
const targetPaths = new Set((handoff.codingTargets || []).map(target => target.path).filter(Boolean));
for (const frozenPath of [
  'tests/explicit/entries/runMcpSemanticQueryContract.js',
  'tests/architecture/mcp-semantic-query-contract/dependency-direction.guard.js',
]) {
  assert(
    !targetPaths.has(frozenPath),
    `MCP_SEMANTIC_DEPENDENCY_DIRECTION_GUARD: frozen test asset ${frozenPath} cannot be a Coding target`,
  );
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

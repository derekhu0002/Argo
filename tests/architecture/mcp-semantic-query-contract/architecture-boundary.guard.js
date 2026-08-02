const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');

const rootContract = read('OVERALL_ARCHITECTURE.md');
const queryContract = read('.argo/scripts/ARCHITECTURE.md');
const graphRagContract = read('.argo/scripts/graph-rag/ARCHITECTURE.md');
const testContract = read('tests/ARCHITECTURE.md');

// GIVEN the WP-1 through WP-4 MCP semantic query contract scope
// WHEN stable implementation boundaries are inspected
// THEN request validation and canonical payload stay at the query boundary,
//      while relationship and View closure stay inside the Graph RAG boundary.
for (const requiredRootContract of [
  'MCP semantic query contract',
  'forbidden response-shape controls',
  'canonical object subsets',
  'minimal relationship endpoint closure',
  'complete non-cascading View closure',
]) {
  assert(
    rootContract.includes(requiredRootContract),
    `MCP_SEMANTIC_ARCHITECTURE_BOUNDARY_GUARD: root contract omits ${requiredRootContract}`,
  );
}

for (const requiredQueryBoundary of [
  'responseProfile',
  'QUERY_RESPONSE_SHAPE_CONTROL_FORBIDDEN',
  'document` whose root contains only canonical `elements`, `relationships`, and `views`',
]) {
  assert(
    queryContract.includes(requiredQueryBoundary),
    `MCP_SEMANTIC_ARCHITECTURE_BOUNDARY_GUARD: query contract omits ${requiredQueryBoundary}`,
  );
}

for (const requiredClosureBoundary of [
  'BP-MCP-SEM relationship endpoint closure',
  'BP-MCP-SEM View membership closure',
  'SEMANTIC_SUBSET_RELATIONSHIP_MISSING',
  'SEMANTIC_SUBSET_VIEW_MISSING',
]) {
  assert(
    graphRagContract.includes(requiredClosureBoundary),
    `MCP_SEMANTIC_ARCHITECTURE_BOUNDARY_GUARD: Graph RAG contract omits ${requiredClosureBoundary}`,
  );
}

assert(
  testContract.includes('runMcpSemanticQueryContract.js'),
  'MCP_SEMANTIC_ARCHITECTURE_BOUNDARY_GUARD: test contract must own the MCP semantic query contract entrypoint',
);

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

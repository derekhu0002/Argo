const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');

// GIVEN the stable gateway and intent-query runtime boundaries
const gatewaySource = read('.argo/scripts/argo-mcp-server.js');
const queryBoundarySource = read('.argo/scripts/systemarchitecture-mcp-server.js');
const rootContract = read('OVERALL_ARCHITECTURE.md');
const graphRagContract = read('.argo/scripts/graph-rag/ARCHITECTURE.md');

// WHEN their public ownership is inspected
// THEN the gateway delegates and the query module owns getSystemArchitecture
assert(
  gatewaySource.includes("require('./systemarchitecture-mcp-server.js')"),
  'ARCHITECTURE_BOUNDARY_GUARD: unified gateway must delegate to the intent-query module',
);
assert(
  queryBoundarySource.includes("if (name === 'getSystemArchitecture')"),
  'ARCHITECTURE_BOUNDARY_GUARD: intent-query module must own getSystemArchitecture behavior',
);
assert(
  rootContract.includes('W5 deterministic purpose closure')
    && rootContract.includes('closePurposePolicyScope(request)'),
  'ARCHITECTURE_BOUNDARY_GUARD: root contract must declare the W5 purpose-closure boundary',
);
assert(
  rootContract.includes('W6 structural closure')
    && rootContract.includes('same-version endpoint Elements')
    && rootContract.includes('first-inclusion reason'),
  'ARCHITECTURE_BOUNDARY_GUARD: root contract must declare the W6 coherent-result boundary',
);
assert(
  graphRagContract.includes('named parameterized Cypher policies')
    && graphRagContract.includes('Free-generated Cypher')
    && graphRagContract.includes('DT-06 through DT-12')
    && graphRagContract.includes('graph-tidy complete-snapshot bypass'),
  'ARCHITECTURE_BOUNDARY_GUARD: local Graph RAG contract must protect W5 deterministic closure semantics',
);
assert(
  graphRagContract.includes('W6 structural result completion')
    && graphRagContract.includes('overlapping-View cascade')
    && graphRagContract.includes('policy/index/version evidence'),
  'ARCHITECTURE_BOUNDARY_GUARD: local Graph RAG contract must protect W6 structural result semantics',
);

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

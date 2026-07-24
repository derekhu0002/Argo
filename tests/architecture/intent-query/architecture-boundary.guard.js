const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');

// GIVEN the stable gateway and intent-query runtime boundaries
const gatewaySource = read('.argo/scripts/argo-mcp-server.js');
const queryBoundarySource = read('.argo/scripts/systemarchitecture-mcp-server.js');

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

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

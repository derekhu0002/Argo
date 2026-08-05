const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');

const rootContract = read('OVERALL_ARCHITECTURE.md');
const runtimeContract = read('.argo/scripts/ARCHITECTURE.md');
const testContract = read('tests/ARCHITECTURE.md');
const semantics = read('.argo/scripts/graph-semantics.js');
const mutationBoundary = read('.argo/scripts/systemarchitecture-mcp-server.js');

assert(
  rootContract.includes('View capacity governance') && rootContract.includes('15 included_elements'),
  'VIEW15_ARCHITECTURE_BOUNDARY_ROOT_RULE_MISSING',
);
assert(
  runtimeContract.includes('View capacity validation')
    && runtimeContract.includes('included_relationships')
    && runtimeContract.includes('consume no quota'),
  'VIEW15_ARCHITECTURE_BOUNDARY_RUNTIME_CONTRACT_MISSING',
);
assert(
  testContract.includes('viewCapacityPolicyHarness.js') && testContract.includes('VIEW15'),
  'VIEW15_ARCHITECTURE_BOUNDARY_TEST_CONTRACT_MISSING',
);
assert(
  semantics.includes('validateViewElementLimits') && semantics.includes('included_elements'),
  'VIEW15_ARCHITECTURE_BOUNDARY_SHARED_VALIDATOR_MISSING',
);
assert(
  mutationBoundary.includes('viewLimitCheckIds') && mutationBoundary.includes('validateViewElementLimits'),
  'VIEW15_ARCHITECTURE_BOUNDARY_MUTATION_VALIDATION_MISSING',
);

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

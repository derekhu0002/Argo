const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');

const rootContract = read('OVERALL_ARCHITECTURE.md');
const runtimeContract = read('.argo/scripts/ARCHITECTURE.md');
const testContract = read('tests/ARCHITECTURE.md');
const handoffPath = '.argo/temp/ImplementationToCodingHandoff.json';
const handoff = fs.existsSync(path.join(repoRoot, handoffPath))
  ? JSON.parse(read(handoffPath))
  : undefined;

for (const intentElementId of [
  'view15-global-limit-principle',
  'view15-counting-semantics-requirement',
  'view15-prospective-stability-constraint',
  'view15-enforcement-completeness-requirement',
  'view15-active-authority-requirement',
]) {
  assert(
    rootContract.includes(intentElementId),
    `VIEW15_TRACEABILITY_ROOT_MAPPING_MISSING:${intentElementId}`,
  );
  assert(
    runtimeContract.includes(intentElementId) || testContract.includes(intentElementId),
    `VIEW15_TRACEABILITY_LOCAL_MAPPING_MISSING:${intentElementId}`,
  );
}

if (handoff) {
  const serialized = JSON.stringify(handoff);
  for (const testcaseName of [
    'ExplicitAcceptanceTestcase-VIEW15-CONSISTENCY',
  ]) {
    assert(serialized.includes(testcaseName), `VIEW15_TRACEABILITY_HANDOFF_TESTCASE_MISSING:${testcaseName}`);
  }
  for (const frozenPath of [
    'tests/harness/viewCapacityPolicyHarness.js',
    'tests/explicit/entries/runView15Consistency.js',
    'tests/architecture/view-capacity-policy/architecture-boundary.guard.js',
    'tests/architecture/view-capacity-policy/dependency-direction.guard.js',
    'tests/architecture/view-capacity-policy/explicit-entrypoint-correctness.guard.js',
    'tests/architecture/view-capacity-policy/implementation-traceability.guard.js',
  ]) {
    assert(
      handoff.frozenFiles.includes(frozenPath),
      `VIEW15_TRACEABILITY_FROZEN_FILE_MISSING:${frozenPath}`,
    );
  }
  for (const targetPath of [
    '.argo/scripts/graph-semantics.js',
    '.argo/scripts/systemarchitecture-mcp-server.js',
    'design/validator/intent-architecture-mcp-validation.md',
    'design/mcp/意图架构 MCP 功能列表.md',
    'tests/mcp/systemarchitecture-mcp.test.js',
  ]) {
    assert(
      serialized.includes(targetPath),
      `VIEW15_TRACEABILITY_HANDOFF_TARGET_MISSING:${targetPath}`,
    );
  }
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

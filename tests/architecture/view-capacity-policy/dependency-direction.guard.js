const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');

const productionFiles = [
  '.argo/scripts/graph-semantics.js',
  '.argo/scripts/systemarchitecture-mcp-server.js',
];
const explicitEntrypoints = [
  'tests/explicit/entries/runView15GlobalScope.js',
  'tests/explicit/entries/runView15Relationships.js',
  'tests/explicit/entries/runView15NoMigration.js',
  'tests/explicit/entries/runView15Consistency.js',
  'tests/explicit/entries/runView15IndirectGrowth.js',
];

for (const productionFile of productionFiles) {
  const source = read(productionFile);
  for (const requiredTarget of requireTargets(source)) {
    assert(
      !/(^|\/|\\)(tests|harness|explicit|architecture)(\/|\\|$)/.test(requiredTarget),
      `VIEW15_DEPENDENCY_DIRECTION_PRODUCTION_DEPENDS_ON_TESTS:${productionFile}:${requiredTarget}`,
    );
  }
}

for (const entrypoint of explicitEntrypoints) {
  const source = read(entrypoint);
  assert(
    source.includes("require('../../harness/viewCapacityPolicyHarness.js')"),
    `VIEW15_DEPENDENCY_DIRECTION_ENTRYPOINT_BYPASSES_HARNESS:${entrypoint}`,
  );
  assert(
    !source.includes(".argo/scripts/"),
    `VIEW15_DEPENDENCY_DIRECTION_ENTRYPOINT_EXPOSES_PRODUCTION_PLUMBING:${entrypoint}`,
  );
}

const harness = read('tests/harness/viewCapacityPolicyHarness.js');
assert(
  harness.includes(".argo/scripts/argo-mcp-server.js"),
  'VIEW15_DEPENDENCY_DIRECTION_HARNESS_PUBLIC_BOUNDARY_MISSING',
);
assert(
  requireTargets(harness).every(target => !target.includes('graph-semantics.js') && !target.includes('systemarchitecture-mcp-server.js')),
  'VIEW15_DEPENDENCY_DIRECTION_HARNESS_REACHES_PRIVATE_RUNTIME',
);

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function requireTargets(source) {
  return [...source.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g)]
    .map(match => match[1]);
}

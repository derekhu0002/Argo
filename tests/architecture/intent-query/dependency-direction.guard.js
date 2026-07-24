const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const runtimePaths = [
  '.argo/scripts/argo-mcp-server.js',
  '.argo/scripts/systemarchitecture-mcp-server.js',
];

// GIVEN production runtime modules
for (const runtimePath of runtimePaths) {
  const source = fs.readFileSync(path.join(repoRoot, ...runtimePath.split('/')), 'utf8');

  // WHEN dependency declarations are inspected
  // THEN production never points outward to test assets
  assert(
    !/require\(['"][^'"]*tests[\\/]/.test(source) && !/from\s+['"][^'"]*tests[\\/]/.test(source),
    `DEPENDENCY_DIRECTION_GUARD: ${runtimePath} must not depend on tests`,
  );
}

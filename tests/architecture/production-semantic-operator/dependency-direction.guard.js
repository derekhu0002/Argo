const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const handoff = JSON.parse(read('.argo/temp/ImplementationToCodingHandoff.json'));
const allowedTargets = new Set([
  '.argo/scripts/graph-rag/semanticOperatorJourney.js',
  '.argo/scripts/semanticOperatorJourneyCli.js',
  '.argo/scripts/systemarchitecture-mcp-server.js',
  '.argo/scripts/argo-mcp-server.js',
  'package.json',
  'README.md',
]);

// GIVEN WP-P3 is composition and operator-surface work over delivered inward boundaries
// WHEN exact Coding authorization and present production imports are inspected
// THEN only the journey, adapters, command metadata, and operator documentation may change
const authorized = (handoff.codingTargets || []).map(target => target.path).sort();
assert.deepStrictEqual(
  authorized,
  [...allowedTargets].sort(),
  'WP_P3_DEPENDENCY_DIRECTION_GUARD: Coding targets must equal exact operator-composition authorization',
);
assert.deepStrictEqual(
  authorized.filter(target => (handoff.frozenFiles || []).includes(target)),
  [],
  'WP_P3_DEPENDENCY_DIRECTION_GUARD: authorized targets overlap frozenFiles',
);

for (const relativePath of allowedTargets) {
  const absolutePath = path.join(repoRoot, ...relativePath.split('/'));
  if (!fs.existsSync(absolutePath) || !relativePath.endsWith('.js')) continue;
  const source = fs.readFileSync(absolutePath, 'utf8');
  assert(
    !/require\(['"][^'"]*tests[\\/]/.test(source),
    `WP_P3_DEPENDENCY_DIRECTION_GUARD: ${relativePath} depends on tests`,
  );
  assert(
    !/(?:require\(['"][^'"]*python[^'"]*['"]\)|\bpython(?:3)?\b)/i.test(source),
    `WP_P3_DEPENDENCY_DIRECTION_GUARD: ${relativePath} introduces Python`,
  );
  assert(
    !/ai\.text\.embed|genai\.vector\.encode/i.test(source),
    `WP_P3_DEPENDENCY_DIRECTION_GUARD: ${relativePath} introduces Neo4j GenAI embedding`,
  );
}

const local = read('.argo/scripts/graph-rag/ARCHITECTURE.md');
for (const required of [
  'semanticOperatorJourney.js',
  'depends inward on the existing workspace initialization',
  'structural projection',
  'external configuration',
  'semantic backfill',
  'persistent readiness',
  'semantic query',
  'must not reimplement',
]) {
  assert(
    local.toLowerCase().includes(required.toLowerCase()),
    `WP_P3_DEPENDENCY_DIRECTION_GUARD: local contract omits ${required}`,
  );
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

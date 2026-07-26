const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const handoff = JSON.parse(read('.argo/temp/ImplementationToCodingHandoff.json'));
const allowedTargets = new Set([
  '.argo/scripts/systemarchitecture-mcp-server.js',
  '.argo/scripts/graph-rag/defaultSemanticRetrieval.js',
  '.argo/scripts/graph-rag/liveEmbeddingProviderConfig.js',
  '.argo/scripts/graph-rag/productionGraphRagRuntime.js',
]);

// GIVEN the approved WP-P2 implementation dependency direction
// WHEN Coding targets and present production sources are inspected
// THEN changes stay inside the MCP composition and Graph RAG inward boundary
for (const target of handoff.codingTargets || []) {
  assert(
    target.path && allowedTargets.has(target.path),
    `WP_P2_DEPENDENCY_DIRECTION_GUARD: unauthorized Coding target ${target.path}`,
  );
}

for (const relativePath of allowedTargets) {
  const absolutePath = path.join(repoRoot, ...relativePath.split('/'));
  if (!fs.existsSync(absolutePath)) continue;
  const source = fs.readFileSync(absolutePath, 'utf8');
  assert(
    !/require\(['"][^'"]*tests[\\/]/.test(source),
    `WP_P2_DEPENDENCY_DIRECTION_GUARD: ${relativePath} depends on tests`,
  );
  assert(
    !/(?:require\(['"][^'"]*python[^'"]*['"]\)|\bpython(?:3)?\b)/i.test(source),
    `WP_P2_DEPENDENCY_DIRECTION_GUARD: ${relativePath} introduces Python`,
  );
  assert(
    !/ai\.text\.embed|genai\.vector\.encode/i.test(source),
    `WP_P2_DEPENDENCY_DIRECTION_GUARD: ${relativePath} introduces Neo4j GenAI plugin embedding`,
  );
}

const local = read('.argo/scripts/graph-rag/ARCHITECTURE.md');
for (const dependencyRule of [
  'depends inward on external configuration',
  'module must not depend outward on MCP internals or tests',
  'raw source behavior/metadata, provider transport, and Neo4j driver operations',
  'exact input surface is `sourceBehavior`, `sourceAdapters`, `transport`, and `neo4jDriver`',
  'semantic result objects, seed lists, readiness verdicts',
]) {
  assert(local.includes(dependencyRule), `WP_P2_DEPENDENCY_DIRECTION_GUARD: local contract omits ${dependencyRule}`);
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

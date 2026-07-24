const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const runtimeDirectory = path.join(repoRoot, '.argo', 'scripts', 'graph-rag');

// GIVEN every present production Graph RAG JavaScript module
const runtimeFiles = fs.readdirSync(runtimeDirectory)
  .filter(file => file.endsWith('.js'));

// WHEN production dependency declarations are inspected
for (const runtimeFile of runtimeFiles) {
  const source = fs.readFileSync(path.join(runtimeDirectory, runtimeFile), 'utf8');

  // THEN dependencies point inward and never couple production to tests, Python, or Neo4j plugin procedures
  assert(
    !/require\(['"][^'"]*tests[\\/]/.test(source) && !/from\s+['"][^'"]*tests[\\/]/.test(source),
    `PRODUCTION_GRAPH_RAG_DEPENDENCY_DIRECTION_GUARD: ${runtimeFile} must not depend on tests`,
  );
  assert(
    !/child_process|python(?:3)?\b/i.test(source),
    `PRODUCTION_GRAPH_RAG_DEPENDENCY_DIRECTION_GUARD: ${runtimeFile} must not require Python`,
  );
  assert(
    !/ai\.text\.embed|genai\.vector\.encode/i.test(source),
    `PRODUCTION_GRAPH_RAG_DEPENDENCY_DIRECTION_GUARD: ${runtimeFile} must not call Neo4j embedding plugins`,
  );
}

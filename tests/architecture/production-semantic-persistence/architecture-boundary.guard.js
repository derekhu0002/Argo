const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const root = read('OVERALL_ARCHITECTURE.md');
const parent = read('.argo/scripts/graph-rag/ARCHITECTURE.md');
const local = read('.argo/scripts/graph-rag/semantic-persistence/ARCHITECTURE.md');

// GIVEN the approved WP-P1 stable boundary and separate durable production path
// WHEN root, parent, and local contracts are inspected
// THEN ownership, public interfaces, sequencing, persistence, and authority constraints are explicit
assert(
  root.includes('| Production Semantic Persistence Boundary | `.argo/scripts/graph-rag/semantic-persistence/` |'),
  'WP_P1_ARCHITECTURE_BOUNDARY_GUARD: root stable element is missing',
);
for (const required of [
  'createProductionSemanticBackfill(dependencies)',
  'createProductionSemanticProjectionStore(dependencies)',
  'backfillSystemArchitectureSemanticProjection',
  'structural projection',
  'Element, ArchitectureRelationship, and View',
  'bounded',
  'checkpoint',
  'stable canonical identity',
  'delete tombstones',
  'no `runId`',
  'liveEmbeddingNeo4jBoundary.js',
  'Canonical JSON remains authority',
  'subordinate projection/index',
]) {
  assert(
    `${root}\n${parent}\n${local}`.includes(required),
    `WP_P1_ARCHITECTURE_BOUNDARY_GUARD: contracts omit ${required}`,
  );
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

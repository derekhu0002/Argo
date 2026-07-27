const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const harnessPath = 'tests/harness/automaticSemanticLifecycleHarness.js';
const harness = read(harnessPath);
const entrypoints = [
  'tests/explicit/entries/runNewProjectSemanticOperatorJourney.js',
  'tests/explicit/entries/runProductionSemanticBackfill.js',
  'tests/explicit/entries/runPersistentSemanticProjectionLifecycle.js',
  'tests/explicit/entries/runMutationIndexLifecycle.js',
  'tests/explicit/entries/runApplyMutationEmbeddingVectorE2E.js',
  'tests/explicit/entries/runDefaultMcpNeo4jVectorRetrieval.js',
  'tests/explicit/entries/runProductionSemanticReadinessGate.js',
  'tests/explicit/entries/runTypedMcpQueryContract.js',
];

// GIVEN graph-mounted acceptance paths
// WHEN their frozen bodies and shared Harness are inspected
// THEN GIVEN/WHEN/THEN readability and executable key assertions are present
for (const entryPath of entrypoints) {
  const source = read(entryPath);
  for (const marker of ['GIVEN', 'WHEN', 'THEN']) {
    assert(source.includes(marker), `SEMANTIC_LIFECYCLE_ENTRY_${marker}_MISSING:${entryPath}`);
  }
  assert(
    source.includes('automaticSemanticLifecycleHarness.js'),
    `SEMANTIC_LIFECYCLE_HARNESS_NOT_USED:${entryPath}`,
  );
  assert(
    /assert[A-Z]|assert\(/.test(source),
    `SEMANTIC_LIFECYCLE_KEY_ASSERTION_MISSING:${entryPath}`,
  );
}

for (const required of [
  'SP05_AUTOMATIC_INIT_RECONCILIATION_MISSING',
  'SP01_BACKFILL_TOOL_NOT_PRIVATE',
  '_PERSISTENT_INCREMENTAL_LIFECYCLE_BOUNDARY_MISSING',
  "runPersistentIncrementalMatrix('SP02')",
  "runPersistentIncrementalMatrix('DT16')",
  "runPersistentIncrementalMatrix('W31')",
  '_QUERY_REQUIRES_RETIRED_EXPLICIT_READINESS',
  "assertFreshReadinessPerQuery(freshReadiness, 'SP03')",
  "assertFreshReadinessPerQuery(freshReadiness, 'SP04')",
  'TS00_RETIRED_LIFECYCLE_TOOL_PUBLIC',
  'PRODUCTION_RUNID_CLEANUP_PROHIBITED',
  'READINESS_INVALIDATION_COUNT_CHANGED',
  'QUERYABILITY_NOT_VERIFIED',
  'GLOBAL_COHERENCE_NOT_VERIFIED',
]) {
  assert(
    harness.includes(required) || entrypoints.some(entryPath => read(entryPath).includes(required)),
    `SEMANTIC_LIFECYCLE_ASSERTION_NOT_FROZEN:${required}`,
  );
}

const w31 = read('tests/explicit/entries/runApplyMutationEmbeddingVectorE2E.js');
assert(
  w31.indexOf("runPersistentIncrementalMatrix('W31')") < w31.indexOf('process.env.ARGO_LIVE_PROVIDER_E2E'),
  'SEMANTIC_LIFECYCLE_W31_CODE_COMPLETE_NOT_BEFORE_LIVE_GATE',
);

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

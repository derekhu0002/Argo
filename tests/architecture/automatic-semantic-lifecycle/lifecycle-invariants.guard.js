const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const handoff = JSON.parse(read('.argo/temp/ImplementationToCodingHandoff.json'));
const authorization = JSON.stringify({
  summary: handoff.summary,
  codingTargets: handoff.codingTargets,
  taskExecutionPlan: handoff.taskExecutionPlan,
  openGaps: handoff.openGaps,
});

// GIVEN the accepted safety and release invariants
// WHEN Coding authorization is inspected
// THEN no alternate flag, credential, cleanup, or delivery authority is introduced
for (const required of [
  'ARGO_LIVE_PROVIDER_E2E',
  'ARGO_W31_LIVE_MUTATION_VECTOR_E2E',
  'no third flag',
  'external',
  'WP-P1',
  'WP-P2',
  'retired',
  'cleanup remains test-only',
  'code-complete',
  'live-release',
  'runner-owned',
]) {
  assert(
    authorization.toLowerCase().includes(required.toLowerCase()),
    `SEMANTIC_LIFECYCLE_HANDOFF_INVARIANT_MISSING:${required}`,
  );
}

for (const forbidden of [
  'ARGO_SEMANTIC_ENABLED',
  'ARGO_AUTO_SEMANTIC',
]) {
  assert(
    !authorization.includes(forbidden),
    `SEMANTIC_LIFECYCLE_HANDOFF_FORBIDDEN_AUTHORIZATION:${forbidden}`,
  );
}

for (const frozen of [
  '.argo/scripts/graph-rag/liveEmbeddingNeo4jBoundary.js',
  '.argo/scripts/graph-rag/liveEmbeddingProviderClient.js',
  '.argo/scripts/graph-rag/productionGraphRagRuntime.js',
  'design/KG/SystemArchitecture.json',
  'design/KG/test-failure-records.json',
]) {
  assert(handoff.frozenFiles.includes(frozen), `SEMANTIC_LIFECYCLE_PROTECTED_FILE_NOT_FROZEN:${frozen}`);
}

const harness = read('tests/harness/automaticSemanticLifecycleHarness.js');
assert.deepStrictEqual(
  [...harness.matchAll(/'ARGO_[A-Z0-9_]*E2E'/g)].map(match => match[0]).filter(
    (value, index, values) => values.indexOf(value) === index,
  ).sort(),
  ["'ARGO_LIVE_PROVIDER_E2E'", "'ARGO_W31_LIVE_MUTATION_VECTOR_E2E'"],
  'SEMANTIC_LIFECYCLE_THIRD_E2E_GATE_DETECTED',
);
assert(!/secretCanary:\s*['"`]/.test(harness), 'SEMANTIC_LIFECYCLE_HARNESS_EMBEDS_SECRET');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

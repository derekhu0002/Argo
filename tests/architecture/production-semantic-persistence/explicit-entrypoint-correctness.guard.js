const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const requirements = new Map([
  ['tests/explicit/entries/runProductionSemanticBackfill.js', [
    'productionSemanticPersistenceHarness.js',
    'GIVEN',
    'WHEN',
    'THEN',
    'SP01_STRUCTURAL_PROJECTION_COMPLETION_REQUIRED',
    'SP01_BOUNDED_BATCH_EXCEEDED',
    'SP01_CHANNEL_CHECKPOINTS_INCOMPLETE',
    'SP01_ISOLATED_RECORD_FAILURE_MISSING',
    'SP01_RESUME_RESTARTED_COMPLETED_WORK',
    'SP01_THREE_CHANNEL_BACKFILL_INCOMPLETE',
    'SP01_IDEMPOTENT_RERUN_WROTE_DUPLICATES',
    'SP01_FAKE_CANONICAL_MUTATION_PROHIBITED',
    'SP01_ALIGNMENT_BEFORE_ALL_CHANNELS_COMPLETE',
  ]],
  ['tests/explicit/entries/runPersistentSemanticProjectionLifecycle.js', [
    'productionSemanticPersistenceHarness.js',
    'GIVEN',
    'WHEN',
    'THEN',
    'SP02_DURABLE_RESTART_RECORDS_MISSING',
    'SP02_STABLE_CANONICAL_IDENTITY_CHANGED_ON_RESTART',
    'SP02_CHANGED_RECORD_NOT_STABLE_IDENTITY_UPSERT',
    'SP02_TOMBSTONE_NOT_DELETED',
    'SP02_PRODUCTION_RUNID_CLEANUP_PROHIBITED',
    'SP02_LIVE_E2E_CLEANUP_DELETED_PRODUCTION_RECORD',
    'SP02_PROJECTION_MUTATED_CANONICAL_JSON',
    'SP02_NEO4J_BECAME_CANONICAL_AUTHORITY',
  ]],
]);

// GIVEN both approved WP-P1 physical entrypoints
for (const [entryPath, expectedAssertions] of requirements) {
  // WHEN each frozen entrypoint is inspected
  const source = read(entryPath);
  // THEN it preserves readable phases, Harness abstraction, and executable key assertions
  assert(!source.includes('child_process'), `WP_P1_ENTRYPOINT_GUARD: ${entryPath} exposes process plumbing`);
  assert(!source.includes('neo4j-driver'), `WP_P1_ENTRYPOINT_GUARD: ${entryPath} exposes database plumbing`);
  for (const expected of expectedAssertions) {
    assert(source.includes(expected), `WP_P1_ENTRYPOINT_GUARD: ${entryPath} omits ${expected}`);
  }
}

const handoff = JSON.parse(read('.argo/temp/ImplementationToCodingHandoff.json'));
for (const entryPath of requirements.keys()) {
  assert(handoff.frozenFiles.includes(entryPath), `WP_P1_ENTRYPOINT_GUARD: ${entryPath} is not frozen`);
}
assert(
  handoff.frozenFiles.includes('tests/harness/productionSemanticPersistenceHarness.js'),
  'WP_P1_ENTRYPOINT_GUARD: WP-P1 Harness is not frozen',
);

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

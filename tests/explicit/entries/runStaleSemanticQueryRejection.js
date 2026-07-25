const assert = require('node:assert');
const {
  readAsUnchangedConsumer,
  readForPurpose,
} = require('../../harness/intentArchitectureQueryHarness.js');

async function main() {
  // GIVEN canonical graph change with Updating or failed semantic-index state
  const canonicalRead = await readAsUnchangedConsumer();
  const result = await readForPurpose({
    purpose: 'audit',
    intent: 'Query while semantic index is stale',
    subject: 'grag-alignment-constraint',
  });
  const explicitCanonicalRead = await readForPurpose({
    purpose: 'graph-tidy',
    intent: 'Read explicit canonical graph anchor while semantic index is unaligned',
    subject: 'grag-alignment-constraint',
  });

  // WHEN pure semantic request disposition and canonical-read controls are observed
  // THEN stale semantic results are rejected without automatic full fallback
  assert.strictEqual(canonicalRead.status, 'passed', 'DT17_FULL_CANONICAL_READ_BLOCKED_BY_ALIGNMENT');
  assert.strictEqual(result.status, 'failed', 'DT17_STALE_SEMANTIC_QUERY_NOT_REJECTED');
  assert.strictEqual(result.error && result.error.category, 'SEMANTIC_INDEX_NOT_ALIGNED', 'DT17_ALIGNMENT_ERROR_MISSING');
  assert.strictEqual(result.error && result.error.fullSnapshotFallback, false, 'DT17_AUTOMATIC_FULL_FALLBACK_FORBIDDEN');
  assert.strictEqual(
    explicitCanonicalRead.status,
    'passed',
    'DT17_EXPLICIT_CANONICAL_ANCHOR_BLOCKED_BY_ALIGNMENT',
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

const assert = require('node:assert');
const { readForPurpose } = require('../../harness/intentArchitectureQueryHarness.js');

async function main() {
  // GIVEN canonical graph change with Updating or failed semantic-index state
  const result = await readForPurpose({
    purpose: 'audit',
    intent: 'Query while semantic index is stale',
    subject: 'grag-alignment-constraint',
  });

  // WHEN pure semantic request disposition is observed
  // THEN stale semantic results are rejected without automatic full fallback
  assert.strictEqual(result.status, 'failed', 'DT17_STALE_SEMANTIC_QUERY_NOT_REJECTED');
  assert.strictEqual(result.error && result.error.category, 'SEMANTIC_INDEX_NOT_ALIGNED', 'DT17_ALIGNMENT_ERROR_MISSING');
  assert.strictEqual(result.error && result.error.fullSnapshotFallback, false, 'DT17_AUTOMATIC_FULL_FALLBACK_FORBIDDEN');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

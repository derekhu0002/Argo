const assert = require('node:assert');
const {
  queryWithConflictingProjection,
} = require('../../harness/productionGraphRagHarness.js');

async function main() {
  // GIVEN a Neo4j projection that conflicts with the current canonical graph version and identities
  // WHEN a semantic query attempts to consume the stale projection
  const outcome = await queryWithConflictingProjection();

  // THEN canonical intent wins or the projection is rejected; projection-only intent is never returned
  const canonicalWon = outcome.status === 'passed'
    && outcome.canonicalAuthority === 'canonical'
    && outcome.document
    && outcome.document.elements.some(element => element.id === 'approved-element')
    && !outcome.document.elements.some(element => element.id === 'projection-only-element');
  const projectionRejected = outcome.status === 'blocked'
    && outcome.error
    && outcome.error.category === 'CANONICAL_PROJECTION_CONFLICT';
  assert(
    canonicalWon || projectionRejected,
    'TS02_CANONICAL_AUTHORITY_VIOLATED: stale projection must yield to canonical state or be rejected',
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

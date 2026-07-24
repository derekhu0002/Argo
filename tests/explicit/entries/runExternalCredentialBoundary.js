const {
  approvedEmbeddingQualification,
  assertBlocked,
  evaluateIndexDelivery,
} = require('../../harness/productionGraphRagHarness.js');

async function main() {
  // GIVEN Neo4j and embedding-provider credentials are absent from external configuration
  // WHEN the production release gate is evaluated
  const outcome = await evaluateIndexDelivery({
    configuration: {},
    embeddingQualification: approvedEmbeddingQualification(),
  });

  // THEN production delivery fails safely with no hardcoded or implicit credential fallback
  assertBlocked(outcome, 'EXTERNAL_CREDENTIALS_REQUIRED');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

const {
  approvedEmbeddingQualification,
  assertBlocked,
  evaluateIndexDelivery,
  externalProductionConfiguration,
} = require('../../harness/productionGraphRagHarness.js');

async function main() {
  // GIVEN no human approval for an otherwise complete embedding identity
  // WHEN index delivery is evaluated
  const unapproved = await evaluateIndexDelivery({
    configuration: externalProductionConfiguration(),
    embeddingQualification: approvedEmbeddingQualification({ approvedByHuman: false }),
  });
  // THEN delivery is blocked rather than treating configuration as approval
  assertBlocked(unapproved, 'EMBEDDING_QUALIFICATION_REQUIRED');

  // GIVEN explicit approval with missing model version or dimensions
  // WHEN index delivery is evaluated
  const incomplete = await evaluateIndexDelivery({
    configuration: externalProductionConfiguration(),
    embeddingQualification: approvedEmbeddingQualification({ version: undefined, dimensions: undefined }),
  });
  // THEN incomplete embedding identity blocks index delivery
  assertBlocked(incomplete, 'EMBEDDING_CONFIGURATION_REQUIRED');

  // GIVEN a request that marks embedding identity as implicit or defaulted
  // WHEN index delivery is evaluated
  const implicitDefault = await evaluateIndexDelivery({
    configuration: externalProductionConfiguration(),
    embeddingQualification: approvedEmbeddingQualification({ source: 'implicit-default' }),
  });
  // THEN an implicit model default is never accepted as qualification
  assertBlocked(implicitDefault, 'IMPLICIT_EMBEDDING_DEFAULT_PROHIBITED');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

const {
  approvedEmbeddingQualification,
  assertBlocked,
  assertBlockedField,
  evaluateEmbeddingQualification,
} = require('../../harness/productionGraphRagHarness.js');

async function main() {
  // GIVEN no human approval for an otherwise complete embedding identity
  // WHEN index delivery is evaluated
  const unapproved = await evaluateEmbeddingQualification(
    approvedEmbeddingQualification({ approvedByHuman: false }),
  );
  // THEN delivery is blocked rather than treating configuration as approval
  assertBlocked(unapproved, 'EMBEDDING_QUALIFICATION_REQUIRED');

  // GIVEN explicit approval with each required embedding identity field missing in isolation
  for (const missingField of ['provider', 'model', 'version', 'dimensions']) {
    // WHEN qualification is evaluated without that one field
    const incomplete = await evaluateEmbeddingQualification(
      approvedEmbeddingQualification({ [missingField]: undefined }),
    );
    // THEN the gate identifies that exact missing field and blocks index delivery
    assertBlockedField(incomplete, 'EMBEDDING_CONFIGURATION_REQUIRED', missingField);
  }

  // GIVEN a request that marks embedding identity as implicit or defaulted
  // WHEN index delivery is evaluated
  const implicitDefault = await evaluateEmbeddingQualification(
    approvedEmbeddingQualification({ source: 'implicit-default' }),
  );
  // THEN an implicit model default is never accepted as qualification
  assertBlocked(implicitDefault, 'IMPLICIT_EMBEDDING_DEFAULT_PROHIBITED');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

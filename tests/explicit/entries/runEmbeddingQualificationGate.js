const assert = require('node:assert');
const {
  approvedEmbeddingQualification,
  assertBlocked,
  assertBlockedField,
  evaluateEmbeddingQualification,
} = require('../../harness/productionGraphRagHarness.js');

async function main() {
  // GIVEN an explicitly human-approved, complete embedding identity
  // WHEN qualification is evaluated
  const approved = await evaluateEmbeddingQualification(approvedEmbeddingQualification());
  // THEN exact boolean approval and valid identity are accepted
  assert.strictEqual(approved.status, 'approved', 'EMBEDDING_VALID_QUALIFICATION_REJECTED');

  // GIVEN approval is false, undefined, a string, or another truthy non-boolean value
  for (const invalidApproval of [false, undefined, 'true', 1, {}, []]) {
    // WHEN embedding qualification is evaluated
    const unapproved = await evaluateEmbeddingQualification(
      approvedEmbeddingQualification({ approvedByHuman: invalidApproval }),
    );
    // THEN only the exact boolean true is accepted as human approval
    assertBlocked(unapproved, 'EMBEDDING_QUALIFICATION_REQUIRED');
  }

  // GIVEN explicit approval with each required embedding identity field missing in isolation
  for (const missingField of ['provider', 'model', 'version', 'dimensions']) {
    // WHEN qualification is evaluated without that one field
    const incomplete = await evaluateEmbeddingQualification(
      approvedEmbeddingQualification({ [missingField]: undefined }),
    );
    // THEN the gate identifies that exact missing field and blocks index delivery
    assertBlockedField(incomplete, 'EMBEDDING_CONFIGURATION_REQUIRED', missingField);
  }

  // GIVEN provider, model identity, or version is blank rather than absent
  for (const blankField of ['provider', 'model', 'version']) {
    for (const blankValue of ['', ' ', '\t\n']) {
      // WHEN qualification is evaluated with whitespace-only identity
      const blankIdentity = await evaluateEmbeddingQualification(
        approvedEmbeddingQualification({ [blankField]: blankValue }),
      );
      // THEN blank identity is rejected as that exact missing configuration field
      assertBlockedField(blankIdentity, 'EMBEDDING_CONFIGURATION_REQUIRED', blankField);
    }
  }

  // GIVEN dimensions is not a positive integer
  for (const invalidDimensions of [0, -1, 1.5, '1536', Number.NaN, Number.POSITIVE_INFINITY]) {
    // WHEN qualification is evaluated
    const invalidShape = await evaluateEmbeddingQualification(
      approvedEmbeddingQualification({ dimensions: invalidDimensions }),
    );
    // THEN numeric coercion and non-positive/non-integer values remain blocked
    assertBlockedField(invalidShape, 'EMBEDDING_CONFIGURATION_REQUIRED', 'dimensions');
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

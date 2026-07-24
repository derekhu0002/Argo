const assert = require('node:assert');
const {
  approvedEmbeddingQualification,
  assertBlocked,
  assertBlockedField,
  evaluateCredentialConfiguration,
  externalProductionConfiguration,
  inspectCredentialSourceBoundary,
} = require('../../harness/productionGraphRagHarness.js');

async function main() {
  // GIVEN each required external credential/configuration field is missing in isolation
  for (const missingField of ['neo4jUri', 'neo4jUsername', 'neo4jPassword', 'embeddingCredential']) {
    // WHEN production configuration is resolved for semantic query
    const outcome = await evaluateCredentialConfiguration(
      externalProductionConfiguration({ [missingField]: undefined }),
      'semantic-query',
    );
    // THEN the exact missing field blocks delivery without fallback
    assertBlockedField(outcome, 'EXTERNAL_CREDENTIALS_REQUIRED', missingField);
  }

  // GIVEN no credentials at all
  // WHEN production start and semantic query are attempted
  for (const operation of ['start', 'semantic-query']) {
    const outcome = await evaluateCredentialConfiguration({}, operation);
    // THEN both control points fail safely before external access
    assertBlocked(outcome, 'EXTERNAL_CREDENTIALS_REQUIRED');
  }

  // GIVEN all production Graph RAG and Neo4j source files
  // WHEN hardcoded/default credentials and Cypher credential transport are inspected
  const sourceAudit = inspectCredentialSourceBoundary();
  // THEN no credential literal/default or credential-bearing Cypher remains
  assert.deepStrictEqual(
    sourceAudit.hardcodedDefaults,
    [],
    `TS07_HARDCODED_CREDENTIAL_DEFAULT: ${sourceAudit.hardcodedDefaults.join(', ')}`,
  );
  assert.deepStrictEqual(
    sourceAudit.fallbackCredentials,
    [],
    `TS07_CREDENTIAL_FALLBACK_EXPRESSION: ${sourceAudit.fallbackCredentials.join(', ')}`,
  );
  assert.deepStrictEqual(
    sourceAudit.cypherCredentialLeaks,
    [],
    `TS07_CYPHER_CREDENTIAL_BOUNDARY_VIOLATION: ${sourceAudit.cypherCredentialLeaks.join(', ')}`,
  );

  assert.strictEqual(
    approvedEmbeddingQualification().approvedByHuman,
    true,
    'TS07_TEST_PRECONDITION_INVALID: credential checks must not be masked by qualification',
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

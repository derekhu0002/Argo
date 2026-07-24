const assert = require('node:assert');
const {
  inspectCredentialSourceText,
} = require('../../harness/productionGraphRagHarness.js');

const hardcodedFixtures = [
  'const config = { neo4jUri: "neo4j://fallback:7687" };',
  'const config = { neo4jUsername: "neo4j" };',
  'const config = { neo4jPassword: "secret" };',
  'const config = { embeddingCredential: "provider-token" };',
];
const fallbackFixtures = [
  'const uri = config.neo4jUri || "neo4j://fallback:7687";',
  'const username = config.neo4jUsername ?? "neo4j";',
  'const password = config.neo4jPassword ? config.neo4jPassword : "secret";',
  'const token = config.embeddingCredential || process.env.OTHER_TOKEN;',
];
const cypherTransportFixtures = [
  'session.run(query, { neo4jPassword: config.neo4jPassword });',
  'const parameters = { providerCredential: config.embeddingCredential }; session.run(query, parameters);',
  'const secret = config.embeddingCredential; const nested = { apiKey: secret }; tx.run(queryText, nested);',
  'const queryText = "CALL ai.text.embed($text, $embeddingCredential)"; const parameters = { embeddingCredential: config.embeddingCredential }; executor.run(queryText, parameters);',
];
const safeFixture = `
function requireExternalConfiguration(config) {
  if (typeof config.neo4jPassword !== 'string' || config.neo4jPassword.trim() === '') {
    throw new Error('EXTERNAL_CREDENTIALS_REQUIRED');
  }
  return config;
}
const queryText = 'MATCH (node { id: $id }) RETURN node';
const parameters = { id: requestedId };
session.run(queryText, parameters);
`;

// GIVEN bypass fixtures for direct literals, fallback operators, ternaries, and variableized Cypher parameters
// WHEN the structured credential source policy analyzes each fixture
// THEN every prohibited bypass is detected independently
for (const fixture of hardcodedFixtures) {
  const result = inspectCredentialSourceText(fixture);
  assert(
    result.hardcodedCredentialLiterals.length > 0,
    `CREDENTIAL_SOURCE_POLICY_SELF_TEST: missed hardcoded fixture ${fixture}`,
  );
}
for (const fixture of fallbackFixtures) {
  const result = inspectCredentialSourceText(fixture);
  assert(
    result.fallbackCredentialExpressions.length > 0,
    `CREDENTIAL_SOURCE_POLICY_SELF_TEST: missed fallback fixture ${fixture}`,
  );
}
for (const fixture of cypherTransportFixtures) {
  const result = inspectCredentialSourceText(fixture);
  assert(
    result.cypherCredentialTransports.length > 0,
    `CREDENTIAL_SOURCE_POLICY_SELF_TEST: missed Cypher transport fixture ${fixture}`,
  );
}
assert.deepStrictEqual(
  inspectCredentialSourceText(safeFixture),
  {
    hardcodedCredentialLiterals: [],
    fallbackCredentialExpressions: [],
    cypherCredentialTransports: [],
  },
  'CREDENTIAL_SOURCE_POLICY_SELF_TEST: safe external configuration and parameterized non-secret Cypher must pass',
);

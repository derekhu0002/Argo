const assert = require('node:assert');
const {
  assertSemanticRetrievalCalls,
  createSemanticRetrievalProbe,
  readExplicitQuery,
} = require('../../harness/intentArchitectureQueryHarness.js');

async function main() {
  // GIVEN the five legal purposes, the complete invalid-request matrix,
  // and test-owned probes at the semantic retrieval boundary
  const sharedIntent = 'Inspect the compatible intent-query boundary';
  const validQueries = [
    { purpose: 'intent-decision', intent: sharedIntent, expectsRetrieval: true },
    { purpose: 'implementation-design', intent: sharedIntent, expectsRetrieval: true },
    { purpose: 'coding-repair', intent: sharedIntent, expectsRetrieval: true },
    { purpose: 'audit', intent: sharedIntent, subject: 'query policy', expectsRetrieval: true },
    { purpose: 'graph-tidy', intent: sharedIntent, expectsRetrieval: false },
  ];
  const invalidQueries = [
    {
      label: 'missing purpose',
      query: { intent: sharedIntent },
      category: 'QUERY_PURPOSE_REQUIRED',
    },
    {
      label: 'invalid purpose',
      query: { purpose: 'unsupported-purpose', intent: sharedIntent },
      category: 'QUERY_PURPOSE_INVALID',
    },
    {
      label: 'missing intent',
      query: { purpose: 'implementation-design' },
      category: 'QUERY_INTENT_REQUIRED',
    },
    {
      label: 'empty intent',
      query: { purpose: 'implementation-design', intent: '   ' },
      category: 'QUERY_INTENT_REQUIRED',
    },
    {
      label: 'audit missing subject',
      query: { purpose: 'audit', intent: sharedIntent },
      category: 'AUDIT_SUBJECT_REQUIRED',
    },
    {
      label: 'audit empty subject',
      query: { purpose: 'audit', intent: sharedIntent, subject: '   ' },
      category: 'AUDIT_SUBJECT_REQUIRED',
    },
  ];

  // WHEN legal requests cross the boundary using a positive-control probe
  const validProbe = createSemanticRetrievalProbe();
  let expectedValidRetrievals = 0;
  for (const query of validQueries) {
    const result = await readExplicitQuery(query, validProbe);
    if (query.expectsRetrieval) {
      expectedValidRetrievals += 1;
    }

    // THEN every legal purpose is accepted and preserved at the contract boundary
    assertSemanticRetrievalCalls(
      validProbe,
      expectedValidRetrievals,
      'DT03_SEMANTIC_PROBE_NOT_WIRED',
    );
    assert.strictEqual(
      result.status,
      'passed',
      `DT03_VALID_PURPOSE_REJECTED: ${query.purpose} must remain a legal purpose`,
    );
    assert.strictEqual(
      result.query && result.query.purpose,
      query.purpose,
      `DT03_PURPOSE_NOT_PRESERVED: ${query.purpose} must remain explicit request data`,
    );
  }

  // WHEN invalid requests share a separate test-owned rejection probe
  const rejectionProbe = createSemanticRetrievalProbe();
  for (const { label, query, category } of invalidQueries) {
    const result = await readExplicitQuery(query, rejectionProbe);

    // THEN validation rejects each stable category before semantic retrieval
    assert.strictEqual(
      result.status,
      'failed',
      `DT03_INVALID_REQUEST_NOT_REJECTED: ${label}`,
    );
    assert.strictEqual(
      result.error && result.error.category,
      category,
      `DT03_REJECTION_CATEGORY_UNSTABLE: ${label} must expose ${category}`,
    );
    assertSemanticRetrievalCalls(
      rejectionProbe,
      0,
      `DT03_VALIDATION_AFTER_RETRIEVAL: ${label}`,
    );
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

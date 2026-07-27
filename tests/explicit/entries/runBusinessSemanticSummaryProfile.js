const assert = require('node:assert');

const { callTool } = require('../../../.argo/scripts/systemarchitecture-mcp-server.js');

async function main() {
  // GIVEN a semantic retrieval payload with high-cost debug evidence
  const vector = Array.from({ length: 1024 }, (_, index) => index / 1024);
  const retrieved = Object.freeze({
    seedsByType: Object.freeze({
      elements: Object.freeze([
        Object.freeze({ id: 'feature-1', objectType: 'Element', score: 0.93, vector }),
        Object.freeze({ id: 'feature-2', objectType: 'Element', score: 0.72, vector }),
      ]),
    }),
    closurePolicy: Object.freeze({
      category: 'implementation-design',
      policyId: 'w5.implementation-design.v1',
      queryTemplate: 'MATCH p = (:Element)-[*]->(:Element) RETURN p',
      parameterContract: Object.freeze(['purpose', 'anchors', 'subject', 'policyAnchorId']),
      archimateSemantics: Object.freeze([{ relationshipType: 'Realization' }]),
    }),
    boundary: Object.freeze({
      included: Object.freeze(['feature-1']),
      excluded: Object.freeze(['audit']),
      rationale: 'Business summaries need the policy rationale, not the whole executable contract.',
    }),
    closure: Object.freeze({
      elements: Object.freeze([
        Object.freeze({
          id: 'feature-1',
          name: 'High Risk Operation Safety Audit',
          type: 'Capability',
          description: `${'long business description '.repeat(20)}with details that should not be returned in full`,
          attributes: Object.freeze([
            Object.freeze({ name: 'deliveryStatus', value: 'delivered' }),
            Object.freeze({ name: 'functionalPoint.1', value: 'Risk event capture' }),
          ]),
          testcases: Object.freeze([
            Object.freeze({
              id: 'AT-HRA-008',
              status: 'passed',
              description: 'Full input and acceptance criteria should stay out of the business summary.',
            }),
          ]),
          canonicalVersion: 'canonical-v1',
        }),
      ]),
    }),
    endpointClosure: Object.freeze({ relationships: Object.freeze([]) }),
    viewClosure: Object.freeze({ views: Object.freeze([]) }),
    provenance: Object.freeze({
      objects: Object.freeze([
        Object.freeze({
          objectType: 'Element',
          objectId: 'feature-1',
          firstInclusionReason: 'semantic-seed',
          supplementaryReasons: Object.freeze(['purpose-policy-closure']),
          canonicalVersion: 'canonical-v1',
        }),
      ]),
      alignment: Object.freeze({ state: 'Aligned' }),
    }),
    canonicalVersion: 'canonical-v1',
    contentVersion: 'content-v1',
    indexVersion: 'index-v1',
  });
  const dependencies = {
    semanticOperatorJourney: Object.freeze({
      async query(request) {
        const document = request.responseProfile === 'debug' ? retrieved : retrieved;
        return {
          status: 'passed',
          graphPath: 'design/KG/SystemArchitecture.json',
          query: {
            ...request,
            mode: 'semantic-query',
            semanticRetrieval: 'invoked',
          },
          result: document,
          document,
        };
      },
    }),
  };

  // WHEN no responseProfile is requested
  const defaultResult = await invokeSemanticQuery({
    purpose: 'implementation-design',
    intent: 'Summarize business features',
    topN: 1,
  }, dependencies);

  // THEN the default payload is business-readable and omits high-cost debug fields
  assert.strictEqual(defaultResult.result.responseProfile, 'business-summary', 'BUSINESS_SUMMARY_PROFILE_NOT_DEFAULT');
  assert.strictEqual(
    defaultResult.result.semanticSeeds.elements[0].vector,
    undefined,
    'BUSINESS_SUMMARY_VECTOR_LEAKED',
  );
  assert.strictEqual(defaultResult.result.semanticSeeds.elements.length, 1, 'BUSINESS_SUMMARY_TOP_N_NOT_APPLIED');
  assert.strictEqual(defaultResult.result.policySummary.policyId, 'w5.implementation-design.v1', 'BUSINESS_SUMMARY_POLICY_ID_MISSING');
  assert.strictEqual(defaultResult.result.queryTemplate, undefined, 'BUSINESS_SUMMARY_QUERY_TEMPLATE_LEAKED');
  assert.strictEqual(defaultResult.result.parameterContract, undefined, 'BUSINESS_SUMMARY_PARAMETER_CONTRACT_LEAKED');
  assert.strictEqual(defaultResult.result.archimateSemantics, undefined, 'BUSINESS_SUMMARY_ARCHIMATE_SEMANTICS_LEAKED');
  assert.strictEqual(
    defaultResult.result.businessObjects.elements[0].canonicalVersion,
    undefined,
    'BUSINESS_SUMMARY_OBJECT_VERSION_REPEATED',
  );
  assert(defaultResult.result.businessObjects.elements[0].descriptionSummary.length < 200, 'BUSINESS_SUMMARY_DESCRIPTION_NOT_TRUNCATED');
  assert.strictEqual(defaultResult.result.businessObjects.elements[0].testCoverage[0].name, 'AT-HRA-008', 'BUSINESS_SUMMARY_TEST_NAME_MISSING');

  // WHEN debug evidence is explicitly requested
  const debugResult = await invokeSemanticQuery({
    purpose: 'implementation-design',
    intent: 'Debug semantic retrieval evidence',
    responseProfile: 'debug',
  }, dependencies);

  // THEN the original detailed evidence remains available for acceptance and troubleshooting
  assert(Array.isArray(debugResult.result.seedsByType.elements[0].vector), 'DEBUG_PROFILE_VECTOR_MISSING');
  assert.strictEqual(debugResult.result.closurePolicy.queryTemplate, retrieved.closurePolicy.queryTemplate, 'DEBUG_PROFILE_POLICY_TEMPLATE_MISSING');
  console.log('BUSINESS_SEMANTIC_SUMMARY_PROFILE_OK');
}

async function invokeSemanticQuery(query, dependencies) {
  const response = await callTool('getSystemArchitecture', { query }, dependencies);
  assert(response && Array.isArray(response.content), 'MCP_RESPONSE_CONTENT_MISSING');
  const parsed = JSON.parse(response.content[0].text);
  assert.strictEqual(parsed.status, 'passed', parsed.error && parsed.error.message);
  return parsed;
}

main().catch(error => {
  console.error(error && error.message ? error.message : error);
  process.exitCode = 1;
});

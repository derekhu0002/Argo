const assert = require('node:assert');
const {
  assertCompleteCanonicalSnapshot,
  assertParameterizedClosurePolicy,
  assertPurposeCategoryBoundary,
  assertSemanticRetrievalCalls,
  createSemanticRetrievalProbe,
  observeReturnedGraph,
  readCanonicalSnapshot,
  readForPurposeClosure,
} = require('../../harness/intentArchitectureQueryHarness.js');

const approvedAnchors = Object.freeze(['grag-seed-retrieval']);
const semanticClosureCategories = Object.freeze([
  'intent-decision',
  'implementation-design',
  'coding-repair',
  'audit',
]);
const purposeCategories = Object.freeze([
  ...semanticClosureCategories,
  'graph-tidy',
]);

async function main() {
  // GIVEN a semantic seed with a graph-mandatory but textually dissimilar dependency
  const implementationResult = await readForPurposeClosure({
    purpose: 'implementation-design',
    intent: 'Resolve mandatory implementation dependencies',
    anchors: approvedAnchors,
    callerIdentity: 'ImplementationDesign',
  });

  // WHEN deterministic purpose-policy closure expands the seed
  const closure = implementationResult.result && implementationResult.result.closure;

  // THEN mandatory closure is decided by named parameterized policy evidence
  assertParameterizedClosurePolicy(implementationResult, {
    category: 'implementation-design',
    failureCategory: 'DT06_PURPOSE_CLOSURE',
  });
  assert(Array.isArray(closure && closure.elements), 'DT06_PURPOSE_CLOSURE_MISSING');
  assert(
    closure.elements.some(element => element.firstInclusionReason === 'archimate-mandatory-dependency' && element.semanticScore === undefined),
    'DT06_TEXTUALLY_DISSIMILAR_DEPENDENCY_MISSING',
  );
  assert(
    closure.elements.every(element => element.firstInclusionReason !== 'generated-cypher-decision'),
    'DT06_FREE_GENERATED_CYPHER_DECIDED_MANDATORY_CLOSURE',
  );
  assert(
    closure.elements.every(element => element.firstInclusionReason !== 'semantic-seed' || element.semanticScore !== undefined),
    'DT06_DEPENDENCY_MISCLASSIFIED_AS_SEMANTIC_SEED',
  );

  // GIVEN equivalent anchors from a different caller and all five dispatch categories
  const repeatedImplementationResult = await readForPurposeClosure({
    purpose: 'implementation-design',
    intent: 'Resolve mandatory implementation dependencies',
    anchors: approvedAnchors,
    callerIdentity: 'CodingAndReparing',
  });
  const categoryResults = new Map();
  const graphTidyProbe = createSemanticRetrievalProbe();
  for (const purpose of purposeCategories) {
    categoryResults.set(purpose, await readForPurposeClosure({
      purpose,
      intent: `W5 boundary probe for ${purpose}`,
      anchors: approvedAnchors,
      ...(purpose === 'audit' ? { subject: 'grag-audit-policy' } : {}),
      callerIdentity: 'ImplementationDesign',
    }, purpose === 'graph-tidy' ? graphTidyProbe : undefined));
  }

  // WHEN caller identity changes and purpose category changes
  const originalBoundary = implementationResult.result && implementationResult.result.boundary;
  const repeatedBoundary = repeatedImplementationResult.result && repeatedImplementationResult.result.boundary;
  const policyIds = semanticClosureCategories.map(category => {
    const result = categoryResults.get(category);
    return result.result && result.result.closurePolicy && result.result.closurePolicy.policyId;
  });
  const graphTidyResult = categoryResults.get('graph-tidy');

  // THEN caller identity cannot select scope, four semantic policies remain independent,
  // and graph-tidy remains a fifth canonical full-snapshot dispatch with no semantic policy
  assert.deepStrictEqual(repeatedBoundary, originalBoundary, 'DT07_CALLER_IDENTITY_POLICY_FORBIDDEN');
  assert.strictEqual(categoryResults.size, purposeCategories.length, 'DT07_PURPOSE_DISPATCH_CATEGORY_MISSING');
  for (const category of semanticClosureCategories) {
    assertParameterizedClosurePolicy(categoryResults.get(category), {
      category,
      failureCategory: 'DT07_PURPOSE_POLICY',
    });
    assertPurposeCategoryBoundary(categoryResults.get(category), {
      category,
      failureCategory: 'DT07_PURPOSE_CATEGORY',
      excludedCategories: semanticClosureCategories.filter(purpose => purpose !== category),
    });
  }
  assert.strictEqual(new Set(policyIds).size, semanticClosureCategories.length, 'DT07_PURPOSE_CATEGORIES_NOT_INDEPENDENT');
  assertSemanticRetrievalCalls(graphTidyProbe, 0, 'DT07_GRAPH_TIDY_SEMANTIC_PATH_INVOKED');
  assert.strictEqual(graphTidyResult.query && graphTidyResult.query.mode, 'full-snapshot', 'DT07_GRAPH_TIDY_MODE_FAILURE');
  assert.strictEqual(graphTidyResult.query && graphTidyResult.query.semanticRetrieval, 'bypassed', 'DT07_GRAPH_TIDY_BYPASS_FAILURE');
  assert(
    !(graphTidyResult.result && graphTidyResult.result.closurePolicy && graphTidyResult.result.closurePolicy.policyId),
    'DT07_GRAPH_TIDY_SEMANTIC_POLICY_ID_FORBIDDEN',
  );
  assertCompleteCanonicalSnapshot(
    observeReturnedGraph(graphTidyResult),
    readCanonicalSnapshot(),
    'DT07_GRAPH_TIDY_SNAPSHOT_INCOMPLETE',
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

const assert = require('node:assert');
const {
  assertParameterizedClosurePolicy,
  assertPurposeCategoryBoundary,
  readForPurposeClosure,
} = require('../../harness/intentArchitectureQueryHarness.js');

const approvedAnchors = Object.freeze(['grag-seed-retrieval']);
const purposeCategories = Object.freeze([
  'intent-decision',
  'implementation-design',
  'coding-repair',
  'audit',
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

  // GIVEN equivalent anchors from a different caller and the same five approved categories
  const repeatedImplementationResult = await readForPurposeClosure({
    purpose: 'implementation-design',
    intent: 'Resolve mandatory implementation dependencies',
    anchors: approvedAnchors,
    callerIdentity: 'CodingAndReparing',
  });
  const categoryResults = [];
  for (const purpose of purposeCategories) {
    categoryResults.push(await readForPurposeClosure({
      purpose,
      intent: `W5 boundary probe for ${purpose}`,
      anchors: approvedAnchors,
      ...(purpose === 'audit' ? { subject: 'grag-audit-policy' } : {}),
      callerIdentity: 'ImplementationDesign',
    }));
  }

  // WHEN caller identity changes and purpose category changes
  const originalBoundary = implementationResult.result && implementationResult.result.boundary;
  const repeatedBoundary = repeatedImplementationResult.result && repeatedImplementationResult.result.boundary;
  const policyIds = categoryResults.map(result => result.result && result.result.closurePolicy && result.result.closurePolicy.policyId);

  // THEN caller identity cannot select scope, while all five purpose categories remain independent
  assert.deepStrictEqual(repeatedBoundary, originalBoundary, 'DT07_CALLER_IDENTITY_POLICY_FORBIDDEN');
  assert.strictEqual(new Set(policyIds).size, purposeCategories.length, 'DT07_PURPOSE_CATEGORIES_NOT_INDEPENDENT');
  for (let index = 0; index < purposeCategories.length; index += 1) {
    assertPurposeCategoryBoundary(categoryResults[index], {
      category: purposeCategories[index],
      failureCategory: 'DT07_PURPOSE_CATEGORY',
      excludedCategories: purposeCategories.filter(purpose => purpose !== purposeCategories[index]),
    });
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

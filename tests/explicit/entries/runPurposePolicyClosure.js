const assert = require('node:assert');
const { readForPurpose } = require('../../harness/intentArchitectureQueryHarness.js');

async function main() {
  // GIVEN a semantic seed with a graph-mandatory but textually dissimilar dependency
  const result = await readForPurpose({
    purpose: 'implementation-design',
    intent: 'Resolve mandatory implementation dependencies',
  });

  // WHEN deterministic purpose-policy closure expands the seed
  const closure = result.result && result.result.closure;

  // THEN dependencies carry policy provenance and caller identity does not select scope
  assert(Array.isArray(closure && closure.elements), 'DT06_PURPOSE_CLOSURE_MISSING');
  assert(
    closure.elements.every(element => element.firstInclusionReason !== 'semantic-seed' || element.semanticScore !== undefined),
    'DT06_DEPENDENCY_MISCLASSIFIED_AS_SEMANTIC_SEED',
  );
  assert.strictEqual(result.query && result.query.policySelectedBy, 'purpose', 'DT07_CALLER_IDENTITY_POLICY_FORBIDDEN');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

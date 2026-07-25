const assert = require('node:assert');
const {
  assertIntentDecisionClosure,
  readForPurposeClosure,
} = require('../../harness/intentArchitectureQueryHarness.js');

async function main() {
  // GIVEN an approved capability-change intent-decision query
  const result = await readForPurposeClosure({
    purpose: 'intent-decision',
    intent: 'Decide a capability change',
    anchors: ['grag-intent-decision-policy'],
    dissimilarMandatoryLineage: true,
    similarImplementationOnlyNeighbor: 'grag-implementation-policy',
  });

  // WHEN intent-decision closure is returned
  const decision = result.result && result.result.intentDecision;

  // THEN Why, What, business behavior, Acceptance, and absence evidence are purpose-scoped
  assertIntentDecisionClosure(result);
  assert(Array.isArray(decision && decision.realizationStateEvidence), 'DT08_REALIZATION_STATE_EVIDENCE_MISSING');
  assert.strictEqual(decision.includesImplementationTaskPlanning, false, 'DT08_IMPLEMENTATION_SCOPE_IMPORTED');
  assert.strictEqual(decision.includesGraphTidySnapshot, false, 'DT08_GRAPH_TIDY_SCOPE_IMPORTED');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

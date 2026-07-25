const assert = require('node:assert');
const {
  assertImplementationDesignClosure,
  readForPurposeClosure,
} = require('../../harness/intentArchitectureQueryHarness.js');

async function main() {
  // GIVEN an implementation-design target with approved multi-level dependencies
  const result = await readForPurposeClosure({
    purpose: 'implementation-design',
    intent: 'Resolve implementation boundary dependencies',
    anchors: ['grag-implementation-policy'],
    includeUpstreamPrerequisitesUntilDelivered: true,
    includeDownstreamWithinBusinessBoundary: true,
  });

  // WHEN upstream and downstream closure chains are observed
  const chains = result.result && result.result.dependencyChains;

  // THEN every chain terminates at a declared boundary with acceptance semantics
  assertImplementationDesignClosure(result);
  assert(chains.every(chain => chain.deliveredStopDecision !== 'ignored'), 'DT09_DELIVERED_STOP_DECISION_MISSING');
  assert.strictEqual(result.result.includesRepairIncidentEvidence, false, 'DT09_REPAIR_SCOPE_IMPORTED');
  assert.strictEqual(result.result.includesGraphTidySnapshot, false, 'DT09_GRAPH_TIDY_SCOPE_IMPORTED');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

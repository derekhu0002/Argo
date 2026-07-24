const assert = require('node:assert');
const { readForPurpose } = require('../../harness/intentArchitectureQueryHarness.js');

async function main() {
  // GIVEN an implementation-design target with approved multi-level dependencies
  const result = await readForPurpose({
    purpose: 'implementation-design',
    intent: 'Resolve implementation boundary dependencies',
  });

  // WHEN upstream and downstream closure chains are observed
  const chains = result.result && result.result.dependencyChains;

  // THEN every chain terminates at a declared boundary with acceptance semantics
  assert(Array.isArray(chains) && chains.length > 0, 'DT09_DEPENDENCY_CHAINS_MISSING');
  assert(
    chains.every(chain => chain.terminalBoundary && chain.acceptanceSemantics),
    'DT09_UNBOUNDED_IMPLEMENTATION_CHAIN',
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

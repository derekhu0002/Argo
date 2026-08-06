const {
  assertBoundedReturnContract,
  assertCodingStageDelegationGovernance,
  assertContextAccountabilityGovernance,
  assertDelegationProhibitions,
  assertDisjointWriteTrigger,
  assertExistingStageGatesPreserved,
  assertFailureDispositionGovernance,
  assertGranularityTrigger,
  assertHypothesisEvidenceGovernance,
  assertImplementationStageDelegationGovernance,
  assertIndependentUnitTrigger,
  assertMultiChannelTrigger,
  assertOpenDiscoveryTrigger,
  assertProxyAcceptanceGovernance,
  assertResourceGovernance,
  assertStageOwnedDispatchGovernance,
  assertTriggerGovernance,
  assertWriteGovernance,
} = require('../../harness/automaticDelegationGovernanceHarness.js');

async function main() {
  // Anchor inventory: DT-00 DT-01 DT-02 DT-03 DT-04 DT-05 DT-06 DT-06-A
  // DT-06-B DT-06-C DT-06-D DT-06-E DT-06-P DT-07 DT-08 DT-09
  // DT-10 DT-11 DT-12 DT-13 DT-14 DT-15.

  // GIVEN DT-00 large-work and atomic-work proxy scenarios under existing gates
  // WHEN automatic delegation governance is inspected across stage surfaces
  // THEN large work is bounded and atomic work remains local without weakening gates
  assertContextAccountabilityGovernance(); // DT-00

  // GIVEN DT-01 stage-owned dispatch and DT-15 cross-stage coordination
  // WHEN stage and Orchestrator surfaces are inspected
  // THEN only stage owners dispatch internal work and Orchestrator preserves existing gates
  assertStageOwnedDispatchGovernance(); // DT-01, DT-15

  // GIVEN DT-02 and DT-03 hypothesis evidence fixtures
  // WHEN delegated evidence channels return to a parent verifier
  // THEN evidence remains hypothesis-bound and yields one epistemic verdict
  assertHypothesisEvidenceGovernance(); // DT-02, DT-03

  // GIVEN DT-04 and DT-13 resource governance fixtures
  // WHEN a complex delegation tree and overflow work are planned
  // THEN depth stays at two child edges and active children stay at four or fewer
  assertResourceGovernance(); // DT-04, DT-13

  // GIVEN DT-05 write-set classification fixtures
  // WHEN prospective work is read-only, disjoint, shared, or ordered
  // THEN only authorized disjoint writes may parallelize and overlapping work serializes
  assertWriteGovernance(); // DT-05

  // GIVEN DT-06 hard-trigger and prohibition fixtures
  // WHEN the delegation decision policy is evaluated
  // THEN every trigger produces a plan or one explicit prohibition reason
  assertTriggerGovernance(); // DT-06

  // GIVEN DT-06-A architecture granularity above ten
  // WHEN the stage prepares execution
  // THEN independently verifiable slices are planned before delegated work starts
  assertGranularityTrigger(); // DT-06-A

  // GIVEN DT-06-B independent hypotheses or work packages
  // WHEN they have separate proof criteria and acceptance boundaries
  // THEN they can delegate separately and return to parent synthesis
  assertIndependentUnitTrigger(); // DT-06-B

  // GIVEN DT-06-C a hypothesis with multiple non-lightweight evidence channels
  // WHEN evidence must be gathered broadly
  // THEN bounded gatherers feed one verifier-owned verdict
  assertMultiChannelTrigger(); // DT-06-C

  // GIVEN DT-06-D disjoint dependency-independent authorized write sets
  // WHEN coding work is eligible for parallel execution
  // THEN concurrent children return exact non-colliding write sets
  assertDisjointWriteTrigger(); // DT-06-D

  // GIVEN DT-06-E broad unknown-repository or open-internet discovery
  // WHEN exploration or research is delegated
  // THEN the parent receives structured findings and evidence locations
  assertOpenDiscoveryTrigger(); // DT-06-E

  // GIVEN DT-06-P atomic, coupled, negative-value, or reserved-authority work
  // WHEN delegation would be unsafe or valueless
  // THEN no child launches and one prohibition reason is recorded
  assertDelegationProhibitions(); // DT-06-P

  // GIVEN DT-07 a child with large logs and many findings
  // WHEN it returns to the parent context
  // THEN only bounded identity, verdict, evidence, conflicts, changes, and next action return
  assertBoundedReturnContract(); // DT-07

  // GIVEN DT-08 recoverable failure, missing evidence, write collision, and authority conflict
  // WHEN the parent classifies non-success
  // THEN exactly one retry, supplement, serialize, or escalate disposition is chosen
  assertFailureDispositionGovernance(); // DT-08

  // GIVEN DT-11 disjoint local implementation design work and one shared interface
  // WHEN ImplementationDesign delegates locally
  // THEN root contract, dependency direction, frozen files, and handoff remain stage-owned
  assertImplementationStageDelegationGovernance(); // DT-11

  // GIVEN DT-12 two same-frontier coding chains converging downstream
  // WHEN CodingAndReparing dispatches repair work
  // THEN only disjoint frontier tasks parallelize and the main stage owner validates delivery
  assertCodingStageDelegationGovernance(); // DT-12

  // GIVEN DT-14 proxy-first acceptance scenarios
  // WHEN the phase-one release evidence is evaluated
  // THEN proxy behavior passes without claiming unavailable token-reduction telemetry
  assertProxyAcceptanceGovernance(); // DT-14

  // GIVEN existing stage, approval, handoff, audit, commit, and delivery gates
  // WHEN delegation governance is added
  // THEN those gates remain visible and authoritative
  assertExistingStageGatesPreserved();
}

main().catch(error => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});

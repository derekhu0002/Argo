const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');

const STAGE_SURFACES = Object.freeze({
  businessPartner: '.cursor/skills/business-partner/SKILL.md',
  intentionDesign: '.cursor/agents/IntentionDesign.md',
  implementationDesign: '.cursor/agents/ImplementationDesign.md',
  codingAndRepairing: '.cursor/agents/CodingAndReparing.md',
  orchestrator: '.cursor/agents/Orchestrator.md',
  fastOrchestrating: '.cursor/skills/fast-orchestrating/SKILL.md',
});

const ALL_SURFACES = Object.freeze(Object.values(STAGE_SURFACES));

function assertContextAccountabilityGovernance() {
  const corpus = readGovernanceCorpus();
  assertIncludesAll(corpus, [
    'automatic delegation',
    'atomic',
    'bounded',
    'structured evidence',
    'final accountability',
  ], 'AUTODEL_DT00_CONTEXT_ACCOUNTABILITY_MISSING');
  assertExistingStageGatesPreserved();
}

function assertStageOwnedDispatchGovernance() {
  assertIncludesAll(read(STAGE_SURFACES.businessPartner), [
    'delegate',
    'hypothesis',
    'evidence',
    'final business',
  ], 'AUTODEL_DT09_BUSINESSPARTNER_DELEGATION_CONTRACT_MISSING');
  for (const [stage, surface] of Object.entries({
    intentionDesign: STAGE_SURFACES.intentionDesign,
    implementationDesign: STAGE_SURFACES.implementationDesign,
    codingAndRepairing: STAGE_SURFACES.codingAndRepairing,
  })) {
    assertIncludesAll(read(surface), [
      'stage owner',
      'internal delegation',
      'final',
    ], `AUTODEL_DT01_STAGE_OWNER_DELEGATION_MISSING:${stage}`);
  }
  assertIncludesAll(read(STAGE_SURFACES.orchestrator), [
    'Orchestrator dispatches stages',
    'does not manage child',
    'stage commits',
    'handoff validation',
  ], 'AUTODEL_DT15_ORCHESTRATOR_BOUNDARY_MISSING');
}

function assertHypothesisEvidenceGovernance() {
  const corpus = readGovernanceCorpus();
  assertIncludesAll(corpus, [
    'hypothesis',
    'evidence plan',
    'proof',
    'falsification',
    'authority precedence',
    'supported',
    'refuted',
    'undetermined',
    'execution failure',
  ], 'AUTODEL_DT02_DT03_HYPOTHESIS_VERDICT_CONTRACT_MISSING');
}

function assertResourceGovernance() {
  const corpus = readGovernanceCorpus();
  assertIncludesAll(corpus, [
    'two child edges',
    'four active',
    'queue',
    'dependency-blocked',
  ], 'AUTODEL_DT04_DT13_RESOURCE_LIMITS_MISSING');
  assert(!/unbounded recursion/i.test(corpus), 'AUTODEL_DT04_UNBOUNDED_RECURSION_ALLOWED');
}

function assertWriteGovernance() {
  const corpus = readGovernanceCorpus();
  assertIncludesAll(corpus, [
    'read-only',
    'disjoint',
    'authorized write',
    'shared',
    'serialized',
    'write set',
  ], 'AUTODEL_DT05_WRITE_GOVERNANCE_MISSING');
}

function assertTriggerGovernance() {
  const corpus = readGovernanceCorpus();
  assertIncludesAll(corpus, [
    'G above 10',
    'independently decidable',
    'non-lightweight evidence channels',
    'disjoint authorized write sets',
    'broad unknown-repository',
    'open-internet',
    'prohibition reason',
  ], 'AUTODEL_DT06_TRIGGER_FAMILY_MISSING');
}

function assertGranularityTrigger() {
  assertIncludesAll(readGovernanceCorpus(), [
    'G above 10',
    'slice plan',
    'independently verifiable slice',
  ], 'AUTODEL_DT06_A_GRANULARITY_TRIGGER_MISSING');
}

function assertIndependentUnitTrigger() {
  assertIncludesAll(readGovernanceCorpus(), [
    'two independently decidable hypotheses',
    'delegated separately',
    'parent synthesizes',
  ], 'AUTODEL_DT06_B_INDEPENDENT_UNIT_TRIGGER_MISSING');
}

function assertMultiChannelTrigger() {
  assertIncludesAll(readGovernanceCorpus(), [
    'two non-lightweight evidence channels',
    'verifier',
    'channel gatherers',
    'singular verdict',
  ], 'AUTODEL_DT06_C_MULTICHANNEL_TRIGGER_MISSING');
}

function assertDisjointWriteTrigger() {
  assertIncludesAll(readGovernanceCorpus(), [
    'dependency-independent',
    'disjoint authorized write sets',
    'run concurrently',
    'exact write sets',
  ], 'AUTODEL_DT06_D_DISJOINT_WRITE_TRIGGER_MISSING');
}

function assertOpenDiscoveryTrigger() {
  assertIncludesAll(readGovernanceCorpus(), [
    'broad unknown-repository',
    'open-internet',
    'bounded exploration',
    'structured findings',
    'evidence locations',
  ], 'AUTODEL_DT06_E_OPEN_DISCOVERY_TRIGGER_MISSING');
}

function assertDelegationProhibitions() {
  assertIncludesAll(readGovernanceCorpus(), [
    'atomic local work',
    'shared-write',
    'negative-value',
    'reserved final',
    'no child',
  ], 'AUTODEL_DT06_P_PROHIBITION_MISSING');
}

function assertBoundedReturnContract() {
  assertIncludesAll(readGovernanceCorpus(), [
    'identity',
    'verdict',
    'decisive evidence',
    'conflicts',
    'change results',
    'next action',
    'strongest 3-5',
    'decisive counterexample',
    'without raw logs',
  ], 'AUTODEL_DT07_BOUNDED_RETURN_MISSING');
}

function assertFailureDispositionGovernance() {
  assertIncludesAll(readGovernanceCorpus(), [
    'one same-session retry',
    'supplement missing evidence',
    'serialize write conflict',
    'escalate authority',
    'exactly one disposition',
  ], 'AUTODEL_DT08_FAILURE_DISPOSITION_MISSING');
}

function assertImplementationStageDelegationGovernance() {
  assertIncludesAll(read(STAGE_SURFACES.implementationDesign), [
    'disjoint local stable-element contracts',
    'testcase-entrypoint',
    'root contract',
    'shared interface',
    'handoff',
  ], 'AUTODEL_DT11_IMPLEMENTATION_STAGE_DELEGATION_MISSING');
}

function assertCodingStageDelegationGovernance() {
  assertIncludesAll(read(STAGE_SURFACES.codingAndRepairing), [
    'same-frontier',
    'dependency DAG',
    'disjoint write sets',
    'convergent task waits',
    'full validation',
    'delivery regression',
  ], 'AUTODEL_DT12_CODING_STAGE_DELEGATION_MISSING');
}

function assertProxyAcceptanceGovernance() {
  const corpus = readGovernanceCorpus();
  assertIncludesAll(corpus, [
    'behavior proxy',
    'atomic tasks do not delegate',
    'bounded summaries',
    'depth',
    'concurrency',
    'retry',
    'existing gates pass',
  ], 'AUTODEL_DT14_PROXY_ACCEPTANCE_MISSING');
  assert(!/token[- ]reduction percentage/i.test(corpus), 'AUTODEL_DT14_UNTRUSTED_TOKEN_PERCENTAGE_CLAIMED');
}

function assertExistingStageGatesPreserved() {
  assertIncludesAll(read(STAGE_SURFACES.orchestrator), [
    'validateStageHandoff',
    'runArchitectureTests',
    'Stage Commit Governance',
    'Delivery Status Governance',
    'human partner approved',
  ], 'AUTODEL_EXISTING_STAGE_GATES_WEAKENED');
}

function readGovernanceCorpus() {
  return ALL_SURFACES.map(read).join('\n');
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

function assertIncludesAll(text, needles, failureCategory) {
  for (const needle of needles) {
    assert(
      text.toLowerCase().includes(needle.toLowerCase()),
      `${failureCategory}:${needle}`,
    );
  }
}

module.exports = {
  STAGE_SURFACES,
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
};

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
  assertNoContradictoryGateBypassLanguage(corpus, 'AUTODEL_DT00_GATE_CONTRADICTION');
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
  assertNoContradictoryGateBypassLanguage(read(STAGE_SURFACES.orchestrator), 'AUTODEL_DT15_ORCHESTRATOR_GATE_CONTRADICTION');
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
    'no third child edge',
    'stage owner to verifier to gatherer',
    'four active',
    'eligible queued work fills released slots',
    'dependency-blocked',
    'does not consume',
    'overflow queues by dependency, risk, and blocking impact',
  ], 'AUTODEL_DT04_DT13_RESOURCE_LIMITS_MISSING');
  assert(!/unbounded recursion/i.test(corpus), 'AUTODEL_DT04_UNBOUNDED_RECURSION_ALLOWED');
  assertNoContradictoryDelegationLanguage(corpus, 'AUTODEL_DT04_DT13_RESOURCE_CONTRADICTION');
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
    'missing channels',
    'conflicts',
    'change results',
    'next action',
    'strongest 3-5',
    'ordinary supports',
    'decisive counterexample',
    'evidence locations',
    'externally addressable',
    'without raw logs',
    'without full search process',
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
    'cross-element dependency direction',
    'frozen scope',
    'one owner',
    'handoff',
  ], 'AUTODEL_DT11_IMPLEMENTATION_STAGE_DELEGATION_MISSING');
  assertNoContradictoryDelegationLanguage(read(STAGE_SURFACES.implementationDesign), 'AUTODEL_DT11_DEPENDENCY_OWNER_CONTRADICTION');
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
  const orchestrator = read(STAGE_SURFACES.orchestrator);
  assertIncludesAll(orchestrator, [
    'validateStageHandoff',
    'runArchitectureTests',
    'Stage Commit Governance',
    'Delivery Status Governance',
    'human partner approved',
  ], 'AUTODEL_EXISTING_STAGE_GATES_WEAKENED');
  assertIncludesAll(orchestrator, [
    'stage commits',
    'approval',
    'audit',
    'delivery status',
    'final workflow closure',
  ], 'AUTODEL_EXISTING_GATE_INVENTORY_INCOMPLETE');
  assertNoContradictoryGateBypassLanguage(orchestrator, 'AUTODEL_EXISTING_GATE_CONTRADICTION');
}

function assertBusinessPartnerSynthesisGovernance() {
  const businessPartner = read(STAGE_SURFACES.businessPartner);
  assertIncludesAll(businessPartner, [
    'hypothesis verification',
    'local or internet evidence',
    'SMART framing',
    'MECE tree',
    'authority weighting',
    'recommendations',
    'user questions',
    'business acceptance',
    'final business verdict',
  ], 'AUTODEL_DT09_BUSINESS_SYNTHESIS_MISSING');
  assertNoContradictoryDelegationLanguage(businessPartner, 'AUTODEL_DT09_BUSINESS_SYNTHESIS_CONTRADICTION');
}

function assertIntentionDesignGraphWriterGovernance() {
  const intentionDesign = read(STAGE_SURFACES.intentionDesign);
  assertIncludesAll(intentionDesign, [
    'focused dependency branches',
    'concern mapping candidates',
    'coverage checks',
    'drift evidence',
    'only graph writer',
    'Viewpoint',
    'same-view endpoints',
    'ArchiMate-valid relationship',
    'preview',
    'apply',
    'validation',
  ], 'AUTODEL_DT10_GRAPH_WRITER_VIEWPOINT_MISSING');
  assertNoContradictoryGraphWriterLanguage(intentionDesign, 'AUTODEL_DT10_GRAPH_WRITER_CONTRADICTION');
}

function assertOrchestratorNoBypassGovernance() {
  const orchestrator = read(STAGE_SURFACES.orchestrator);
  assertIncludesAll(orchestrator, [
    'validated stage summaries',
    'bounded summaries',
    'not raw child evidence',
    'no stage is bypassed',
    'stage dispatch',
    'stage commits',
    'approvals',
    'handoff validation',
    'audit routing',
    'final workflow closure',
  ], 'AUTODEL_DT15_BOUNDED_SUMMARY_NO_BYPASS_MISSING');
  assertNoContradictoryGateBypassLanguage(orchestrator, 'AUTODEL_DT15_BOUNDED_SUMMARY_GATE_CONTRADICTION');
  assertNoContradictoryDelegationLanguage(orchestrator, 'AUTODEL_DT15_CHILD_MANAGEMENT_CONTRADICTION');
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

function assertNoContradictoryGateBypassLanguage(text, failureCategory) {
  assertNoPattern(text, /\b(skip|bypass|weaken|disable|replace)\s+(approval|human approval|handoff|validateStageHandoff|audit|commit|stage commit|delivery gate|delivery status|runArchitectureTests|full runner)\b/i, failureCategory);
  assertNoPattern(text, /\b(children|child agents|subagents)\s+(may|can|should|must)\s+(approve|commit|validate handoff|run final delivery|own final)\b/i, failureCategory);
}

function assertNoContradictoryDelegationLanguage(text, failureCategory) {
  assertNoPattern(text, /\bunbounded recursion\b/i, failureCategory);
  assertNoPattern(text, /\b(unlimited|uncapped)\s+(children|child agents|concurrency|delegation)\b/i, failureCategory);
  assertNoPattern(text, /\b(orchestrator)\s+(manages|owns|dispatches)\s+(child-level|internal child|stage-internal child)\b/i, failureCategory);
  assertNoPattern(text, /\bchild\s+(owns|decides|approves)\s+(final|business acceptance|stage judgment|handoff)\b/i, failureCategory);
}

function assertNoContradictoryGraphWriterLanguage(text, failureCategory) {
  assertNoPattern(text, /\b(parallel|multiple)\s+graph\s+writers\b/i, failureCategory);
  assertNoPattern(text, /\b(skip|bypass)\s+(Viewpoint|preview|apply|validation|same-view endpoint)\b/i, failureCategory);
}

function assertNoPattern(text, pattern, failureCategory) {
  assert(!pattern.test(text), failureCategory);
}

module.exports = {
  STAGE_SURFACES,
  assertBoundedReturnContract,
  assertBusinessPartnerSynthesisGovernance,
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
  assertIntentionDesignGraphWriterGovernance,
  assertMultiChannelTrigger,
  assertOpenDiscoveryTrigger,
  assertOrchestratorNoBypassGovernance,
  assertProxyAcceptanceGovernance,
  assertResourceGovernance,
  assertStageOwnedDispatchGovernance,
  assertTriggerGovernance,
  assertWriteGovernance,
};

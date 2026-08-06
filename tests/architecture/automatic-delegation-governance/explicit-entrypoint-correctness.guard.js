const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const entryPath = 'tests/explicit/entries/runAutomaticDelegationGovernance.js';
const harnessPath = 'tests/harness/automaticDelegationGovernanceHarness.js';
const entry = read(entryPath);
const harness = read(harnessPath);
const handoff = JSON.parse(read('.argo/temp/ImplementationToCodingHandoff.json'));

const anchors = [
  'DT-00',
  'DT-01',
  'DT-02',
  'DT-03',
  'DT-04',
  'DT-05',
  'DT-06',
  'DT-06-A',
  'DT-06-B',
  'DT-06-C',
  'DT-06-D',
  'DT-06-E',
  'DT-06-P',
  'DT-07',
  'DT-08',
  'DT-09',
  'DT-10',
  'DT-11',
  'DT-12',
  'DT-13',
  'DT-14',
  'DT-15',
];

// GIVEN the graph-mounted AUTODEL explicit testcase entrypoint
// WHEN Coding/Repair reads it as a frozen acceptance asset
// THEN every DT anchor is executable through Harness-owned business assertions
for (const marker of ['GIVEN', 'WHEN', 'THEN']) {
  assert(entry.includes(marker), `AUTODEL_ENTRY_${marker}_MISSING`);
}
assert(entry.includes("require('../../harness/automaticDelegationGovernanceHarness.js')"), 'AUTODEL_ENTRY_HARNESS_NOT_USED');
assert(!entry.includes("require('../../.argo/") && !entry.includes('child_process'), 'AUTODEL_ENTRY_EXPOSES_LOW_LEVEL_PLUMBING');
for (const anchor of anchors) {
  assert(entry.includes(anchor), `AUTODEL_ENTRY_ANCHOR_MISSING:${anchor}`);
}
for (const assertionName of [
  'assertContextAccountabilityGovernance',
  'assertStageOwnedDispatchGovernance',
  'assertHypothesisEvidenceGovernance',
  'assertResourceGovernance',
  'assertWriteGovernance',
  'assertTriggerGovernance',
  'assertGranularityTrigger',
  'assertIndependentUnitTrigger',
  'assertMultiChannelTrigger',
  'assertDisjointWriteTrigger',
  'assertOpenDiscoveryTrigger',
  'assertDelegationProhibitions',
  'assertBoundedReturnContract',
  'assertFailureDispositionGovernance',
  'assertBusinessPartnerSynthesisGovernance',
  'assertIntentionDesignGraphWriterGovernance',
  'assertImplementationStageDelegationGovernance',
  'assertCodingStageDelegationGovernance',
  'assertProxyAcceptanceGovernance',
  'assertOrchestratorNoBypassGovernance',
]) {
  assert(entry.includes(assertionName), `AUTODEL_ENTRY_ASSERTION_NOT_WIRED:${assertionName}`);
  assert(harness.includes(`function ${assertionName}`), `AUTODEL_HARNESS_ASSERTION_MISSING:${assertionName}`);
}
for (const category of [
  'AUTODEL_DT00_CONTEXT_ACCOUNTABILITY_MISSING',
  'AUTODEL_DT06_TRIGGER_FAMILY_MISSING',
  'AUTODEL_DT06_A_GRANULARITY_TRIGGER_MISSING',
  'AUTODEL_DT06_E_OPEN_DISCOVERY_TRIGGER_MISSING',
  'AUTODEL_DT06_P_PROHIBITION_MISSING',
  'AUTODEL_DT07_BOUNDED_RETURN_MISSING',
  'AUTODEL_DT09_BUSINESS_SYNTHESIS_MISSING',
  'AUTODEL_DT09_BUSINESS_SYNTHESIS_CONTRADICTION',
  'AUTODEL_DT10_GRAPH_WRITER_VIEWPOINT_MISSING',
  'AUTODEL_DT10_GRAPH_WRITER_CONTRADICTION',
  'AUTODEL_DT11_DEPENDENCY_OWNER_CONTRADICTION',
  'AUTODEL_DT14_PROXY_ACCEPTANCE_MISSING',
  'AUTODEL_DT15_BOUNDED_SUMMARY_NO_BYPASS_MISSING',
  'AUTODEL_DT15_BOUNDED_SUMMARY_GATE_CONTRADICTION',
  'AUTODEL_EXISTING_STAGE_GATES_WEAKENED',
  'AUTODEL_EXISTING_GATE_CONTRADICTION',
]) {
  assert(harness.includes(category), `AUTODEL_HARNESS_FAILURE_CATEGORY_MISSING:${category}`);
}
for (const helper of [
  'assertNoContradictoryGateBypassLanguage',
  'assertNoContradictoryDelegationLanguage',
  'assertNoContradictoryGraphWriterLanguage',
]) {
  assert(harness.includes(`function ${helper}`), `AUTODEL_HARNESS_CONTRADICTION_HELPER_MISSING:${helper}`);
}
for (const protectedTerm of [
  'eligible queued work fills released slots',
  'does not consume',
  'evidence locations',
  'externally addressable',
  'SMART framing',
  'MECE tree',
  'only graph writer',
  'same-view endpoints',
  'cross-element dependency direction',
  'not raw child evidence',
  'no stage is bypassed',
]) {
  assert(harness.includes(protectedTerm), `AUTODEL_HARNESS_SEMANTIC_TERM_MISSING:${protectedTerm}`);
}
for (const contradictoryPattern of [
  'skip|bypass|weaken|disable|replace',
  'unlimited|uncapped',
  'parallel|multiple',
]) {
  assert(harness.includes(contradictoryPattern), `AUTODEL_HARNESS_CONTRADICTION_PATTERN_MISSING:${contradictoryPattern}`);
}
assert(handoff.frozenFiles.includes(entryPath), 'AUTODEL_ENTRY_NOT_FROZEN');
assert(handoff.frozenFiles.includes(harnessPath), 'AUTODEL_HARNESS_NOT_FROZEN');
assert(
  handoff.criticalNonExplicitTests.some(test => test.path === 'tests/architecture/automatic-delegation-governance/explicit-entrypoint-correctness.guard.js'),
  'AUTODEL_EXPLICIT_GUARD_NOT_IN_HANDOFF',
);

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const graph = JSON.parse(read('design/KG/SystemArchitecture.json'));
const handoff = JSON.parse(read('.argo/temp/ImplementationToCodingHandoff.json'));

const expectedCases = new Map([
  ['ExplicitAcceptanceTestcase-AUTODEL-DT-00', 'tests/explicit/entries/runAutomaticDelegationGovernance.js#DT-00'],
  ['ExplicitAcceptanceTestcase-AUTODEL-DT-01', 'tests/explicit/entries/runAutomaticDelegationGovernance.js#DT-01'],
  ['ExplicitAcceptanceTestcase-AUTODEL-DT-02', 'tests/explicit/entries/runAutomaticDelegationGovernance.js#DT-02'],
  ['ExplicitAcceptanceTestcase-AUTODEL-DT-03', 'tests/explicit/entries/runAutomaticDelegationGovernance.js#DT-03'],
  ['ExplicitAcceptanceTestcase-AUTODEL-DT-04', 'tests/explicit/entries/runAutomaticDelegationGovernance.js#DT-04'],
  ['ExplicitAcceptanceTestcase-AUTODEL-DT-05', 'tests/explicit/entries/runAutomaticDelegationGovernance.js#DT-05'],
  ['ExplicitAcceptanceTestcase-AUTODEL-DT-06', 'tests/explicit/entries/runAutomaticDelegationGovernance.js#DT-06'],
  ['ExplicitAcceptanceTestcase-AUTODEL-DT-06-A', 'tests/explicit/entries/runAutomaticDelegationGovernance.js#DT-06-A'],
  ['ExplicitAcceptanceTestcase-AUTODEL-DT-06-B', 'tests/explicit/entries/runAutomaticDelegationGovernance.js#DT-06-B'],
  ['ExplicitAcceptanceTestcase-AUTODEL-DT-06-C', 'tests/explicit/entries/runAutomaticDelegationGovernance.js#DT-06-C'],
  ['ExplicitAcceptanceTestcase-AUTODEL-DT-06-D', 'tests/explicit/entries/runAutomaticDelegationGovernance.js#DT-06-D'],
  ['ExplicitAcceptanceTestcase-AUTODEL-DT-06-E', 'tests/explicit/entries/runAutomaticDelegationGovernance.js#DT-06-E'],
  ['ExplicitAcceptanceTestcase-AUTODEL-DT-06-P', 'tests/explicit/entries/runAutomaticDelegationGovernance.js#DT-06-P'],
  ['ExplicitAcceptanceTestcase-AUTODEL-DT-07', 'tests/explicit/entries/runAutomaticDelegationGovernance.js#DT-07'],
  ['ExplicitAcceptanceTestcase-AUTODEL-DT-08', 'tests/explicit/entries/runAutomaticDelegationGovernance.js#DT-08'],
  ['ExplicitAcceptanceTestcase-AUTODEL-DT-09', 'tests/explicit/entries/runAutomaticDelegationGovernance.js#DT-09'],
  ['ExplicitAcceptanceTestcase-AUTODEL-DT-10', 'tests/explicit/entries/runAutomaticDelegationGovernance.js#DT-10'],
  ['ExplicitAcceptanceTestcase-AUTODEL-DT-11', 'tests/explicit/entries/runAutomaticDelegationGovernance.js#DT-11'],
  ['ExplicitAcceptanceTestcase-AUTODEL-DT-12', 'tests/explicit/entries/runAutomaticDelegationGovernance.js#DT-12'],
  ['ExplicitAcceptanceTestcase-AUTODEL-DT-13', 'tests/explicit/entries/runAutomaticDelegationGovernance.js#DT-13'],
  ['ExplicitAcceptanceTestcase-AUTODEL-DT-14', 'tests/explicit/entries/runAutomaticDelegationGovernance.js#DT-14'],
  ['ExplicitAcceptanceTestcase-AUTODEL-DT-15', 'tests/explicit/entries/runAutomaticDelegationGovernance.js#DT-15'],
]);
const intentIds = new Set([
  'autodel-goal',
  'autodel-stage-ownership-principle',
  'autodel-hypothesis-governance-requirement',
  'autodel-resource-governance-constraint',
  'autodel-write-governance-requirement',
  'autodel-trigger-policy-requirement',
  'autodel-return-contract-requirement',
  'autodel-failure-governance-requirement',
  'autodel-proxy-acceptance-requirement',
  'autodel-businesspartner-function',
  'autodel-intention-function',
  'autodel-implementation-function',
  'autodel-coding-function',
  'autodel-orchestrator-function',
]);

// GIVEN the accepted governed delegation intent elements
// WHEN graph testcase mounts and implementation handoff paths are inspected
// THEN every explicit testcase resolves to the single frozen physical entrypoint and every direct intent element is present
const graphCases = new Map();
for (const element of graph.elements || []) {
  if (intentIds.has(element.id)) {
    assert(element.description, `AUTODEL_INTENT_DESCRIPTION_MISSING:${element.id}`);
  }
  for (const testcase of element.testcases || []) {
    graphCases.set(testcase.name, testcase.acceptanceCriteria);
  }
}
for (const intentId of intentIds) {
  assert(graph.elements.some(element => element.id === intentId), `AUTODEL_INTENT_ELEMENT_MISSING:${intentId}`);
}
for (const [name, pathWithAnchor] of expectedCases) {
  assert.strictEqual(graphCases.get(name), pathWithAnchor, `AUTODEL_GRAPH_ENTRYPOINT_MISMATCH:${name}`);
  const handoffEntry = handoff.explicitEntrypoints.find(entry => entry.testcaseName === name);
  assert(handoffEntry, `AUTODEL_HANDOFF_ENTRY_MISSING:${name}`);
  assert.strictEqual(handoffEntry.entryPath, pathWithAnchor, `AUTODEL_HANDOFF_ENTRYPOINT_MISMATCH:${name}`);
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

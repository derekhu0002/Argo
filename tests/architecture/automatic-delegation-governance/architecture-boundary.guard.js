const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const rootContract = read('OVERALL_ARCHITECTURE.md');
const testsContract = read('tests/ARCHITECTURE.md');
const cursorAgentsContract = read('.cursor/agents/ARCHITECTURE.md');
const cursorSkillsContract = read('.cursor/skills/ARCHITECTURE.md');
const handoff = JSON.parse(read('.argo/temp/ImplementationToCodingHandoff.json'));
const contractText = [rootContract, testsContract, cursorAgentsContract, cursorSkillsContract].join('\n');

const requiredFrozenFiles = [
  'tests/explicit/entries/runAutomaticDelegationGovernance.js',
  'tests/harness/automaticDelegationGovernanceHarness.js',
  'tests/architecture/automatic-delegation-governance/architecture-boundary.guard.js',
  'tests/architecture/automatic-delegation-governance/dependency-direction.guard.js',
  'tests/architecture/automatic-delegation-governance/explicit-entrypoint-correctness.guard.js',
  'tests/architecture/automatic-delegation-governance/implementation-traceability.guard.js',
  'design/KG/SystemArchitecture.json',
  '.argo/temp/automatic-delegation-expected-failures.json',
];
const allowedTargets = [
  '.cursor/skills/business-partner/SKILL.md',
  '.cursor/agents/IntentionDesign.md',
  '.cursor/agents/ImplementationDesign.md',
  '.cursor/agents/CodingAndReparing.md',
  '.cursor/agents/Orchestrator.md',
  '.cursor/skills/fast-orchestrating/SKILL.md',
];

// GIVEN the governed automatic delegation implementation boundary
// WHEN contracts, frozen files, and Coding authorization are inspected
// THEN implementation behavior is limited to agent governance surfaces and test assets remain frozen
for (const required of [
  'Agent Delegation Governance Boundary',
  'Governed Automatic Work Delegation',
  'automaticDelegationGovernanceHarness.js',
  'runAutomaticDelegationGovernance.js',
  'AUTODEL',
  'stage-owned',
  'bounded child work',
  'disjoint authorized writes',
  'existing approval, handoff, audit, commit, and delivery gates',
]) {
  assert(contractText.includes(required), `AUTODEL_ARCHITECTURE_BOUNDARY_CONTRACT_MISSING:${required}`);
}
for (const frozen of requiredFrozenFiles) {
  assert(handoff.frozenFiles.includes(frozen), `AUTODEL_FROZEN_FILE_MISSING:${frozen}`);
}
const targetPaths = normalizedTargetPaths(handoff);
assert.deepStrictEqual(targetPaths.sort(), allowedTargets.sort(), 'AUTODEL_CODING_TARGET_SET_NOT_AUTHORIZED');
assert(!targetPaths.includes('design/KG/SystemArchitecture.json'), 'AUTODEL_INTENT_GRAPH_WRONGLY_AUTHORIZED');
assert(!targetPaths.some(target => target.startsWith('tests/')), 'AUTODEL_TEST_FILE_WRONGLY_AUTHORIZED');
assert.strictEqual(handoff.expectedFailureRecordsPath, '.argo/temp/automatic-delegation-expected-failures.json', 'AUTODEL_EXPECTED_FAILURE_RECORD_PATH_CHANGED');

function normalizedTargetPaths(value) {
  return [
    ...new Set(
      (value.codingTargets || []).flatMap(target => {
        if (target.path) return [target.path];
        return target.targetPaths || [];
      }),
    ),
  ];
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

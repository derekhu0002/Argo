const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const handoff = JSON.parse(read('.argo/temp/ImplementationToCodingHandoff.json'));
const allowedTargets = new Set([
  '.cursor/skills/business-partner/SKILL.md',
  '.cursor/agents/IntentionDesign.md',
  '.cursor/agents/ImplementationDesign.md',
  '.cursor/agents/CodingAndReparing.md',
  '.cursor/agents/Orchestrator.md',
  '.cursor/skills/fast-orchestrating/SKILL.md',
]);
const frozenProductionAndIntent = [
  'design/KG/SystemArchitecture.json',
  'OVERALL_ARCHITECTURE.md',
  'tests/ARCHITECTURE.md',
  '.cursor/agents/ARCHITECTURE.md',
  '.cursor/skills/ARCHITECTURE.md',
  'tests/explicit/entries/runAutomaticDelegationGovernance.js',
  'tests/harness/automaticDelegationGovernanceHarness.js',
  'tests/architecture/automatic-delegation-governance/architecture-boundary.guard.js',
  'tests/architecture/automatic-delegation-governance/dependency-direction.guard.js',
  'tests/architecture/automatic-delegation-governance/explicit-entrypoint-correctness.guard.js',
  'tests/architecture/automatic-delegation-governance/implementation-traceability.guard.js',
];

// GIVEN the approved AUTODEL Coding scope
// WHEN authorized targets and frozen assets are inspected
// THEN Coding changes only agent governance text and never inverts production, test, or intent dependencies
const targetPaths = normalizedTargetPaths(handoff);
for (const target of targetPaths) {
  assert(allowedTargets.has(target), `AUTODEL_UNAUTHORIZED_CODING_TARGET:${target}`);
  const source = read(target);
  assert(!/require\s*\(|import\s+/.test(source), `AUTODEL_AGENT_SPEC_INTRODUCES_CODE_DEPENDENCY:${target}`);
  assert(!source.includes('runAutomaticDelegationGovernance.js'), `AUTODEL_AGENT_SPEC_DEPENDS_ON_ACCEPTANCE_ENTRY:${target}`);
}
for (const frozen of frozenProductionAndIntent) {
  assert(handoff.frozenFiles.includes(frozen), `AUTODEL_DEPENDENCY_GUARD_FROZEN_FILE_MISSING:${frozen}`);
  assert(!targetPaths.includes(frozen), `AUTODEL_FROZEN_FILE_AUTHORIZED_FOR_CODING:${frozen}`);
}
assert(
  handoff.taskExecutionPlan.executionStrategy.includes('Serialize shared gate edits'),
  'AUTODEL_TASK_PLAN_SHARED_GATES_NOT_SERIALIZED',
);
assert(
  handoff.taskExecutionPlan.tasks.some(task => task.taskId === 'AUTODEL-06-cross-stage-integration'),
  'AUTODEL_CROSS_STAGE_INTEGRATION_TASK_MISSING',
);

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

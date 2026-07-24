const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const handoff = JSON.parse(read('.argo/temp/ImplementationToCodingHandoff.json'));
const outOfScopeEntrypoints = [
  'tests/explicit/entries/runSevenWaveDeliveryGates.js',
  'tests/explicit/entries/runEmbeddingProviderAdapterLifecycle.js',
];
const forbiddenTestcases = [
  'ExplicitAcceptanceTestcase-TS-08',
  'ExplicitAcceptanceTestcase-TS-09-EmbeddingProviderAdapter',
];
const forbiddenImplementationPattern = /(?:embedding-provider-adapter|embeddingProviderAdapter|index-lifecycle|indexLifecycle|sevenWave|deliverySequence|generateAffectedEmbeddings)/i;

// GIVEN globally mounted TS-08/TS-09 entrypoints and the approved W2 coding handoff
// WHEN authorization scope is inspected
const codingTargetsText = JSON.stringify(handoff.codingTargets);
const tasks = handoff.taskExecutionPlan.tasks;

// THEN mounted out-of-scope evidence remains frozen but cannot authorize implementation
for (const entryPath of outOfScopeEntrypoints) {
  assert(
    handoff.frozenFiles.includes(entryPath),
    `CODING_SCOPE_AUTHORIZATION_GUARD: ${entryPath} must remain frozen`,
  );
}
for (const testcaseName of forbiddenTestcases) {
  assert(
    !codingTargetsText.includes(testcaseName),
    `CODING_SCOPE_AUTHORIZATION_GUARD: codingTargets authorize ${testcaseName}`,
  );
}
assert(
  !forbiddenImplementationPattern.test(codingTargetsText),
  'CODING_SCOPE_AUTHORIZATION_GUARD: codingTargets include adapter/lifecycle delivery',
);

for (const task of tasks) {
  const authorizationText = JSON.stringify({
    relatedTestcases: task.relatedTestcases,
    targetPaths: task.targetPaths,
    steps: task.steps,
    completionSignal: task.completionSignal,
  });
  for (const testcaseName of forbiddenTestcases) {
    assert(
      !authorizationText.includes(testcaseName),
      `CODING_SCOPE_AUTHORIZATION_GUARD: ${task.taskId} authorizes ${testcaseName}`,
    );
  }
  assert(
    !forbiddenImplementationPattern.test(authorizationText),
    `CODING_SCOPE_AUTHORIZATION_GUARD: ${task.taskId} authorizes adapter/lifecycle implementation`,
  );
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

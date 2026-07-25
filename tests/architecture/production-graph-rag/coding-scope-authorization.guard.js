const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const handoff = JSON.parse(read('.argo/temp/ImplementationToCodingHandoff.json'));
const isW3IndexLifecycleHandoff = /W3 Index Lifecycle|Exact-Threshold|DT-05|DT-16|DT-17/i.test(
  `${handoff.summary || ''} ${handoff.taskExecutionPlan && handoff.taskExecutionPlan.executionStrategy || ''}`,
);
const isTs09InScope = /TS-09|TS09|EmbeddingProviderAdapter|EmbeddingGeneration|generateAffectedEmbeddings/i.test(
  JSON.stringify({
    summary: handoff.summary,
    explicitEntrypoints: handoff.explicitEntrypoints,
    codingTargets: handoff.codingTargets,
    taskExecutionPlan: handoff.taskExecutionPlan,
  }),
);
const outOfScopeEntrypoints = [
  'tests/explicit/entries/runSevenWaveDeliveryGates.js',
];
if (!isTs09InScope) {
  outOfScopeEntrypoints.push('tests/explicit/entries/runEmbeddingProviderAdapterLifecycle.js');
}
const forbiddenTestcases = [
  'ExplicitAcceptanceTestcase-TS-08',
];
if (!isTs09InScope) {
  forbiddenTestcases.push('ExplicitAcceptanceTestcase-TS-09-EmbeddingProviderAdapter');
}
const forbiddenImplementationPattern = isW3IndexLifecycleHandoff
  ? /(?:sevenWave|deliverySequence)/i
  : /(?:embedding-provider-adapter|embeddingProviderAdapter|index-lifecycle|indexLifecycle|sevenWave|deliverySequence|generateAffectedEmbeddings)/i;

// GIVEN globally mounted delivery-control evidence and the approved coding handoff
// WHEN authorization scope is inspected
const codingTargetsText = JSON.stringify(handoff.codingTargets);
const tasks = handoff.taskExecutionPlan.tasks;
const executionStrategyText = String(handoff.taskExecutionPlan.executionStrategy || '');
const equivalentTopLevelAuthorizationText = JSON.stringify(
  Object.fromEntries(Object.entries(handoff)
    .filter(([key]) => /(?:strategy|completion|authorization|authorizedTargets)/i.test(key))),
);

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
for (const testcaseName of forbiddenTestcases) {
  assert(
    !executionStrategyText.includes(testcaseName)
      && !equivalentTopLevelAuthorizationText.includes(testcaseName),
    `CODING_SCOPE_AUTHORIZATION_GUARD: top-level authorization includes ${testcaseName}`,
  );
}
assert(
  !forbiddenImplementationPattern.test(executionStrategyText)
    && !forbiddenImplementationPattern.test(equivalentTopLevelAuthorizationText),
  'CODING_SCOPE_AUTHORIZATION_GUARD: top-level strategy/completion authorization includes adapter/lifecycle delivery',
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

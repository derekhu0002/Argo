const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const handoff = JSON.parse(read('.argo/temp/ImplementationToCodingHandoff.json'));
const isW3IndexLifecycleHandoff = /W3 Index Lifecycle|Exact-Threshold|DT-05|DT-16|DT-17/i.test(
  `${handoff.summary || ''} ${handoff.taskExecutionPlan && handoff.taskExecutionPlan.executionStrategy || ''}`,
);
const isW31MutationVectorHandoff = /W3\.1|Mutation-Driven Live Vector|MutationEmbeddingVector|runApplyMutationEmbeddingVectorE2E|createMutationEmbeddingVectorLifecycle/i.test(
  `${handoff.summary || ''} ${handoff.taskExecutionPlan && handoff.taskExecutionPlan.executionStrategy || ''} ${JSON.stringify(handoff.explicitEntrypoints || [])}`,
);
const handoffAuthorizationText = JSON.stringify({
  summary: handoff.summary,
  explicitEntrypoints: handoff.explicitEntrypoints,
  codingTargets: handoff.codingTargets,
  taskExecutionPlan: handoff.taskExecutionPlan,
});
const isTs09InScope = /TS-09|TS09|EmbeddingProviderAdapter|EmbeddingGeneration|generateAffectedEmbeddings/i.test(
  handoffAuthorizationText,
);
const isW7BusinessAcceptanceHandoff = /W7 Phase 1|W7-C1|W7-C2|evaluatePhase1QualityBenchmark|evaluateDeliverySequence/i.test(
  handoffAuthorizationText,
)
  && /ExplicitAcceptanceTestcase-DT-18/.test(handoffAuthorizationText)
  && /ExplicitAcceptanceTestcase-TS-08/.test(handoffAuthorizationText);
const isDt19InScope = /ExplicitAcceptanceTestcase-DT-05-R2-DT-19|runCapacityEvidence\.js/i.test(
  JSON.stringify({
    explicitEntrypoints: handoff.explicitEntrypoints,
    codingTargets: handoff.codingTargets,
    relatedTestcases: (handoff.taskExecutionPlan.tasks || []).map(task => task.relatedTestcases),
    targetPaths: (handoff.taskExecutionPlan.tasks || []).map(task => task.targetPaths),
  }),
);
const isDt19CapacityEvidenceHandoff = isDt19InScope
  && /evaluateCapacityEvidence|capacity evidence|DT-19/i.test(handoffAuthorizationText);
const outOfScopeEntrypoints = [];
if (!isW7BusinessAcceptanceHandoff) {
  outOfScopeEntrypoints.push('tests/explicit/entries/runSevenWaveDeliveryGates.js');
}
if (!isDt19CapacityEvidenceHandoff) {
  outOfScopeEntrypoints.push('tests/explicit/entries/runCapacityEvidence.js');
}
if (!isTs09InScope) {
  outOfScopeEntrypoints.push('tests/explicit/entries/runEmbeddingProviderAdapterLifecycle.js');
}
const forbiddenTestcases = [];
if (!isW7BusinessAcceptanceHandoff) {
  forbiddenTestcases.push('ExplicitAcceptanceTestcase-TS-08');
}
if (!isDt19CapacityEvidenceHandoff) {
  forbiddenTestcases.push('ExplicitAcceptanceTestcase-DT-05-R2-DT-19');
}
if (!isTs09InScope) {
  forbiddenTestcases.push('ExplicitAcceptanceTestcase-TS-09-EmbeddingProviderAdapter');
}
const forbiddenImplementationPattern = isW7BusinessAcceptanceHandoff
  ? /(?:embedding-provider-adapter|embeddingProviderAdapter|index-lifecycle|indexLifecycle|generateAffectedEmbeddings)/i
  : isDt19CapacityEvidenceHandoff
  ? /(?:sevenWave|deliverySequence|embedding-provider-adapter|embeddingProviderAdapter|index-lifecycle|indexLifecycle|generateAffectedEmbeddings)/i
  : isW3IndexLifecycleHandoff || isW31MutationVectorHandoff
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
if (!isDt19CapacityEvidenceHandoff) {
  assert.strictEqual(
    isDt19InScope,
    false,
    'CODING_SCOPE_AUTHORIZATION_GUARD: DT-19 capacity evidence entered authorized Coding scope',
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
  const targetAuthorizationText = JSON.stringify({
    relatedTestcases: task.relatedTestcases,
    targetPaths: task.targetPaths,
  });
  assert(
    !/deliveryStatus/i.test(targetAuthorizationText),
    `CODING_SCOPE_AUTHORIZATION_GUARD: ${task.taskId} authorizes manual deliveryStatus editing`,
  );
  if (isDt19CapacityEvidenceHandoff) {
    assert(
      (task.targetPaths || []).every(targetPath => targetPath === '.argo/scripts/graph-rag/productionGraphRagRuntime.js'),
      `CODING_SCOPE_AUTHORIZATION_GUARD: ${task.taskId} authorizes DT-19 work outside productionGraphRagRuntime.js`,
    );
  }
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
assert(
  /runner-owned deliveryStatus by hand/i.test(executionStrategyText)
    || tasks.some(task => /no hand-authored deliveryStatus changes/i.test(String(task.completionSignal || ''))),
  'CODING_SCOPE_AUTHORIZATION_GUARD: handoff must preserve runner-owned deliveryStatus authority',
);

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

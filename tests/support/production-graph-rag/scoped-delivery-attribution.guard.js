const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const handoff = readJson('.argo/temp/ImplementationToCodingHandoff.json');
const graph = readJson('design/KG/SystemArchitecture.json');
const scopeText = JSON.stringify({
  codingTargets: handoff.codingTargets,
  tasks: handoff.taskExecutionPlan.tasks,
});
const credentialRelation = graph.relationships.find(
  relationship => relationship.id === 'grag-rel-adapter-credentials',
);
const finalTask = handoff.taskExecutionPlan.tasks.find(task => task.taskId === 'W2-C7');

// GIVEN a globally valid intent relationship from the out-of-scope adapter to the credential constraint
assert(credentialRelation, 'SCOPED_DELIVERY_ATTRIBUTION_GUARD: credential relationship evidence is missing');
assert.strictEqual(
  credentialRelation.type,
  'Realization',
  'SCOPED_DELIVERY_ATTRIBUTION_GUARD: credential relationship semantics changed',
);
assert.strictEqual(
  credentialRelation.source_id,
  'grag-embedding-provider-adapter',
  'SCOPED_DELIVERY_ATTRIBUTION_GUARD: unexpected credential realizer',
);
assert.strictEqual(
  credentialRelation.target_id,
  'grag-credential-boundary',
  'SCOPED_DELIVERY_ATTRIBUTION_GUARD: unexpected credential target',
);

// WHEN the resumed Coding handoff defines this slice's completion
// THEN passing TS-07 is accepted as scoped credential evidence without claiming global intent delivery
assert(
  handoff.taskExecutionPlan.executionStrategy.toLowerCase().includes('scoped completion'),
  'SCOPED_DELIVERY_ATTRIBUTION_GUARD: execution strategy must distinguish scoped completion',
);
assert(finalTask, 'SCOPED_DELIVERY_ATTRIBUTION_GUARD: resumed Coding finalization task is missing');
for (const evidence of [
  '6/6 scoped explicit entrypoints',
  '6/6 critical guards',
  '0 delivered-to-not_delivered regression',
  'TS-07',
  'global grag-credential-boundary remains runner-owned',
]) {
  assert(
    finalTask.completionSignal.includes(evidence),
    `SCOPED_DELIVERY_ATTRIBUTION_GUARD: final completion omits ${evidence}`,
  );
}
assert(
  !finalTask.completionSignal.includes('five scoped intent anchors delivered'),
  'SCOPED_DELIVERY_ATTRIBUTION_GUARD: slice completion cannot require five global delivered anchors',
);

// THEN no implementation authorization leaks to the out-of-scope adapter or lifecycle
assert(
  !scopeText.includes('ExplicitAcceptanceTestcase-TS-09-EmbeddingProviderAdapter'),
  'SCOPED_DELIVERY_ATTRIBUTION_GUARD: TS-09 entered authorized task scope',
);
assert(
  !/(?:embedding-provider-adapter|embeddingProviderAdapter|index-lifecycle|indexLifecycle|generateAffectedEmbeddings)/i.test(scopeText),
  'SCOPED_DELIVERY_ATTRIBUTION_GUARD: adapter/lifecycle implementation entered authorized scope',
);

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8'));
}

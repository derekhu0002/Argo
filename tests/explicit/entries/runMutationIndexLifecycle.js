const assert = require('node:assert');
const { readForPurpose } = require('../../harness/intentArchitectureQueryHarness.js');

async function main() {
  // GIVEN create, update, and delete mutation classes across graph object categories
  const result = await readForPurpose({
    purpose: 'audit',
    intent: 'Verify semantic index mutation lifecycle',
    subject: 'grag-index-lifecycle',
  });

  // WHEN index lifecycle evidence is observed
  const lifecycle = result.result && result.result.indexLifecycle;

  // THEN all mutation classes advance version and deleted objects are absent
  assert(Array.isArray(lifecycle && lifecycle.observedMutationClasses), 'DT16_MUTATION_CLASSES_MISSING');
  assert.strictEqual(lifecycle && lifecycle.allAdvanceVersion, true, 'DT16_INDEX_VERSION_NOT_ADVANCED');
  assert.strictEqual(lifecycle && lifecycle.deletedObjectsRetrievable, false, 'DT16_DELETED_OBJECT_STILL_RETRIEVABLE');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

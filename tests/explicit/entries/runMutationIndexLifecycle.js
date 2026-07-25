const assert = require('node:assert');
const { readForPurpose } = require('../../harness/intentArchitectureQueryHarness.js');

async function main() {
  // GIVEN every canonical mutation class across graph object categories and semantic-index evidence
  const result = await readForPurpose({
    purpose: 'audit',
    intent: 'Verify every mutation advances semantic index lifecycle and version evidence',
    subject: 'grag-index-lifecycle',
  });

  // WHEN index lifecycle and persisted vector evidence are observed
  const lifecycle = result.result && result.result.indexLifecycle;
  const observedMutationClasses = lifecycle && lifecycle.observedMutationClasses;
  const indexEvidenceRecords = lifecycle && lifecycle.indexEvidenceRecords;

  // THEN all mutation classes advance version and deleted objects are absent
  assert(Array.isArray(observedMutationClasses), 'DT16_MUTATION_CLASSES_MISSING');
  for (const mutationClass of [
    'element-create',
    'element-update',
    'element-delete',
    'relationship-create',
    'relationship-update',
    'relationship-delete',
    'topology-only-update',
    'semantic-content-update',
    'view-membership-update',
  ]) {
    assert(observedMutationClasses.includes(mutationClass), `DT16_MUTATION_CLASS_NOT_OBSERVED:${mutationClass}`);
  }
  assert.strictEqual(lifecycle && lifecycle.allAdvanceVersion, true, 'DT16_INDEX_VERSION_NOT_ADVANCED');
  assert.strictEqual(lifecycle && lifecycle.deletedObjectsRetrievable, false, 'DT16_DELETED_OBJECT_STILL_RETRIEVABLE');
  assert.notStrictEqual(lifecycle && lifecycle.partialPersistenceAlignment, 'Aligned', 'DT16_PARTIAL_PERSISTENCE_MUST_NOT_ALIGN');

  // THEN semantic-index records carry complete versioned vector evidence
  assert(Array.isArray(indexEvidenceRecords), 'DT16_SEMANTIC_INDEX_RECORDS_MISSING');
  for (const objectType of ['Element', 'ArchitectureRelationship', 'View']) {
    assert(
      indexEvidenceRecords.some(record => record.objectType === objectType),
      `DT16_INDEX_RECORD_CHANNEL_MISSING:${objectType}`,
    );
  }
  for (const record of indexEvidenceRecords) {
    for (const field of [
      'objectId',
      'channel',
      'canonicalVersion',
      'contentVersion',
      'indexVersion',
      'provider',
      'model',
      'modelVersion',
      'dimensions',
    ]) {
      assert(record[field] !== undefined && record[field] !== '', `DT16_INDEX_EVIDENCE_FIELD_MISSING:${field}`);
    }
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

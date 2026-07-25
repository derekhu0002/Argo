const assert = require('node:assert');
const {
  runApplyMutationEmbeddingVectorE2E,
  safeCategory,
} = require('../../harness/liveEmbeddingProviderHarness.js');

async function main() {
  // GIVEN explicit W3.1 live opt-in, approved Qwen/Neo4j secret sources, and mutation fixtures touching Element, Relationship, and View
  // WHEN applySystemArchitectureMutation is followed by the production mutation-driven embedding lifecycle
  const observation = await runApplyMutationEmbeddingVectorE2E();

  // THEN the canonical mutation is the control point and the touched records are exact
  assert.strictEqual(observation.mutation.applied, true, 'W31_APPLY_MUTATION_REQUIRED');
  assert.deepStrictEqual(
    observation.touchedRecords.map(record => record.objectType).sort(),
    ['ArchitectureRelationship', 'Element', 'View'],
    'W31_TOUCHED_RECORD_EXTRACTION_INCOMPLETE',
  );

  // THEN the real approved Qwen profile is used and every vector is finite and queryable from Neo4j
  assert.strictEqual(observation.provider.profile.model, 'qwen3.7-text-embedding', 'W31_QWEN_MODEL_REQUIRED');
  assert.strictEqual(observation.provider.profile.dimensions, 1024, 'W31_QWEN_DIMENSIONS_REQUIRED');
  assert.strictEqual(observation.provider.offlineEvidenceAccepted, false, 'W31_OFFLINE_FAKE_EVIDENCE_PROHIBITED');
  assert(observation.provider.realRequestCount > 0, 'W31_REAL_QWEN_ADAPTER_CALL_REQUIRED');
  for (const record of observation.vectorEvidence) {
    assert.strictEqual(record.dimensions, 1024, `W31_VECTOR_DIMENSION_MISMATCH:${record.objectId}`);
    assert(Array.isArray(record.vector), `W31_VECTOR_MISSING:${record.objectId}`);
    assert.strictEqual(record.vector.length, 1024, `W31_VECTOR_LENGTH_MISMATCH:${record.objectId}`);
    assert(record.vector.every(value => typeof value === 'number' && Number.isFinite(value)), `W31_VECTOR_NON_FINITE:${record.objectId}`);
    for (const field of ['canonicalVersion', 'contentVersion', 'indexVersion', 'provider', 'model', 'modelVersion']) {
      assert(record[field] !== undefined && record[field] !== '', `W31_VERSION_EVIDENCE_MISSING:${field}:${record.objectId}`);
    }
  }
  assert.deepStrictEqual(
    observation.vectorQuery.returnedTouchedRecordIds.sort(),
    observation.touchedRecords.map(record => record.objectId).sort(),
    'W31_NEO4J_VECTOR_QUERY_NOT_QUERYABLE',
  );
  assert.strictEqual(observation.alignmentState, 'Aligned', 'W31_ALIGNMENT_AFTER_QUERYABLE_SUCCESS_REQUIRED');

  // THEN provider/persistence/query failures fail closed and do not leak secrets
  for (const failure of observation.failureMatrix) {
    assert(['Stale', 'Failed'].includes(failure.alignmentState), `W31_FAILURE_MUST_NOT_ALIGN:${failure.name}`);
    assert.strictEqual(failure.pureSemanticQueryRejected, true, `W31_UNALIGNED_QUERY_NOT_REJECTED:${failure.name}`);
    assert.strictEqual(failure.offlineEvidenceAccepted, false, `W31_FAILURE_FAKE_EVIDENCE_ACCEPTED:${failure.name}`);
  }
  assert.deepStrictEqual(observation.secretLeaks, [], 'W31_SECRET_LEAK');
}

main().catch(error => {
  console.error(safeCategory(error));
  process.exit(1);
});

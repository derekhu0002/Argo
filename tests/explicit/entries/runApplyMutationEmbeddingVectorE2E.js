const assert = require('node:assert');
const {
  runApplyMutationEmbeddingVectorE2E,
} = require('../../harness/liveEmbeddingProviderHarness.js');
const {
  assertPersistentIncrementalMatrix,
  runPersistentIncrementalMatrix,
} = require('../../harness/automaticSemanticLifecycleHarness.js');

async function main() {
  // GIVEN explicit W3.1 live opt-in, approved Qwen/Neo4j secret sources, and mutation fixtures touching Element, Relationship, and View
  // WHEN controlled production composition exercises the same persistent incremental boundary
  const persistentIncremental = await runPersistentIncrementalMatrix('W31');
  assertPersistentIncrementalMatrix(persistentIncremental, 'W31');

  // THEN code-complete evidence remains distinct from protected live-release evidence
  if (
    process.env.ARGO_LIVE_PROVIDER_E2E !== '1'
    || process.env.ARGO_W31_LIVE_MUTATION_VECTOR_E2E !== '1'
  ) return;

  // WHEN one live applySystemArchitectureMutation call automatically triggers the production lifecycle
  const observation = await runApplyMutationEmbeddingVectorE2E();

  // THEN the canonical mutation call is the only control point and the lifecycle is not created by the Harness
  assert.strictEqual(observation.mutationToolCallCount, 1, 'W31_SINGLE_MUTATION_TOOL_CALL_REQUIRED');
  assert.strictEqual(observation.lifecycleCreatedByHarness, false, 'W31_HARNESS_LIFECYCLE_CREATION_FORBIDDEN');
  assert.strictEqual(observation.expectedTouchedRecordsSubstituted, false, 'W31_EXPECTED_TOUCHED_RECORDS_SUBSTITUTION_FORBIDDEN');
  assert.strictEqual(observation.mutation.applied, true, 'W31_APPLY_MUTATION_REQUIRED');
  assert(observation.embeddingLifecycle, 'W31_EMBEDDING_LIFECYCLE_RESPONSE_REQUIRED');
  assert(observation.alignment, 'W31_ALIGNMENT_RESPONSE_REQUIRED');

  // THEN actual mutation response touched ids drive the lifecycle and the touched records are exact
  assert.deepStrictEqual(
    observation.touchedRecords.map(record => record.objectType).sort(),
    ['ArchitectureRelationship', 'Element', 'View'],
    'W31_TOUCHED_RECORD_EXTRACTION_INCOMPLETE',
  );
  assert.deepStrictEqual(
    observation.responseTouchedRecordIds.sort(),
    observation.touchedRecords.map(record => record.objectId).sort(),
    'W31_ACTUAL_TOUCHED_IDS_NOT_USED',
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
  assert.strictEqual(observation.alignment.state, 'Aligned', 'W31_ALIGNMENT_RESPONSE_NOT_ALIGNED');

  // THEN provider/persistence/query failures fail closed and do not leak secrets
  for (const failure of observation.failureMatrix) {
    assert(['Stale', 'Failed'].includes(failure.alignmentState), `W31_FAILURE_MUST_NOT_ALIGN:${failure.name}`);
    assert.strictEqual(failure.pureSemanticQueryRejected, true, `W31_UNALIGNED_QUERY_NOT_REJECTED:${failure.name}`);
    assert.strictEqual(failure.offlineEvidenceAccepted, false, `W31_FAILURE_FAKE_EVIDENCE_ACCEPTED:${failure.name}`);
  }
  assert.deepStrictEqual(observation.secretLeaks, [], 'W31_SECRET_LEAK');

}

main().catch(error => {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
});

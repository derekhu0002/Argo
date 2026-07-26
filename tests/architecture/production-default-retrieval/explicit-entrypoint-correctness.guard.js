const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const handoff = JSON.parse(read('.argo/temp/ImplementationToCodingHandoff.json'));
const entries = new Map([
  ['tests/explicit/entries/runDefaultMcpNeo4jVectorRetrieval.js', [
    'productionDefaultRetrievalHarness.js',
    'runCredentialSourceMatrix',
    'runDefaultMcpNeo4jVectorRetrieval',
    'runLegacyControlWordProductionGate',
    'runZeroResultDefaultMcpRetrieval',
    'assertCredentialSourceMatrix',
    'assertDefaultVectorRetrieval',
    'assertLegacyControlWordProductionGate',
    'assertZeroResultChannels',
    'assertFullSnapshotCompatibility',
  ]],
  ['tests/explicit/entries/runProductionSemanticReadinessGate.js', [
    'productionDefaultRetrievalHarness.js',
    'runReadinessMatrix',
    'assertReadinessMatrix',
    'assertFullSnapshotCompatibility',
    'SemanticIndexPending',
    'fullSnapshotFallback:false',
  ]],
]);

// GIVEN both mounted WP-P2 explicit testcase paths
// WHEN their readable phases, Harness use, assertions, and freeze status are inspected
// THEN Coding cannot weaken the physicalized business boundary
for (const [entryPath, observations] of entries) {
  const source = read(entryPath);
  for (const phase of ['GIVEN', 'WHEN', 'THEN']) {
    assert(source.includes(phase), `WP_P2_EXPLICIT_ENTRYPOINT_GUARD: ${entryPath} omits ${phase}`);
  }
  assert(!source.includes("require('../../.argo/"), `WP_P2_EXPLICIT_ENTRYPOINT_GUARD: ${entryPath} exposes production plumbing`);
  for (const observation of observations) {
    assert(source.includes(observation), `WP_P2_EXPLICIT_ENTRYPOINT_GUARD: ${entryPath} omits ${observation}`);
  }
  assert(handoff.frozenFiles.includes(entryPath), `WP_P2_EXPLICIT_ENTRYPOINT_GUARD: ${entryPath} is not frozen`);
}

const harnessPath = 'tests/harness/productionDefaultRetrievalHarness.js';
const harness = read(harnessPath);
const {
  inspectFrozenRawEvidenceContract,
  runRawEvidenceAssertionSelfTests,
} = require(path.join(repoRoot, ...harnessPath.split('/')));
const rawContract = inspectFrozenRawEvidenceContract();
assert.strictEqual(Object.isFrozen(rawContract), true, 'WP_P2_EXPLICIT_ENTRYPOINT_GUARD: raw evidence contract is mutable');
assert.deepStrictEqual(rawContract.compositionInputKeys, [
  'sourceBehavior',
  'sourceAdapters',
  'transport',
  'neo4jDriver',
]);
assert.deepStrictEqual(rawContract.prohibitedCompositionInputKeys, [
  'environment',
  'configuration',
  'semanticRetrievalBoundary',
  'readinessVerdict',
  'semanticResult',
  'seedLists',
]);
assert.deepStrictEqual(rawContract.credentialSourceCases, [
  { name: 'approved-process-source', expectedStatus: 'passed', expectedCategory: undefined },
  { name: 'missing-secret', expectedStatus: undefined, expectedCategory: 'APPROVED_SECRET_REQUIRED' },
  { name: 'unsafe-file-acl', expectedStatus: undefined, expectedCategory: 'SECRET_FILE_ACL_UNSAFE' },
  { name: 'conflicting-dual-source', expectedStatus: undefined, expectedCategory: 'SECRET_SOURCE_CONFLICT' },
  { name: 'legacy-neo4j-alias', expectedStatus: undefined, expectedCategory: 'SECRET_SOURCE_PROVENANCE_PROHIBITED' },
  { name: 'test-default-source', expectedStatus: undefined, expectedCategory: 'SECRET_SOURCE_PROVENANCE_PROHIBITED' },
  { name: 'fallback-source', expectedStatus: undefined, expectedCategory: 'SECRET_SOURCE_PROVENANCE_PROHIBITED' },
]);
assert.deepStrictEqual(rawContract.pagination, {
  initialWindowSize: 2,
  indexNames: {
    Element: 'argo_production_semantic_element_vector',
    ArchitectureRelationship: 'argo_production_semantic_relationship_vector',
    View: 'argo_production_semantic_view_vector',
  },
  parameterizedCypher: [
    'CALL db.index.vector.queryNodes($indexName, $topK, $vector)',
    'YIELD node, score',
    'WHERE node.channel = $channel',
    'RETURN properties(node) AS record, score',
    'ORDER BY score DESC',
  ].join('\n'),
  requiredOperationFields: ['channel', 'indexName', 'cypher', 'parameters.indexName', 'parameters.offset', 'parameters.windowSize', 'parameters.topK', 'parameters.vector'],
  requiredResponseFields: ['offset', 'windowSize', 'returnedCount', 'hasMore', 'nextOffset', 'windowExhausted'],
  qualifyingPeerBeyondInitialWindow: true,
  queryVectorEqualsRawProviderVector: true,
});
assert.deepStrictEqual(rawContract.approvedSourceEvidence, {
  requiredKeys: [
    'ARGO_EMBEDDING_BASE_URL',
    'ARGO_EMBEDDING_MODEL',
    'ARGO_EMBEDDING_PROVIDER',
    'ARGO_EMBEDDING_MODEL_VERSION',
    'ARGO_EMBEDDING_DIMENSIONS',
    'ARGO_NEO4J_DATABASE_URL',
    'ARGO_NEO4J_DATABASE_USERNAME',
    'ARGO_NEO4J_DATABASE_PASSWORD',
    'QWEN_KEY',
  ],
  source: 'process',
  operation: 'direct',
  everyReadPrecedesReadiness: true,
});
assert.deepStrictEqual(rawContract.defaultProductionRouting, {
  legacyControlWords: ['threshold-all', 'semantic seed'],
  explicitAnchors: ['grag-seed-retrieval'],
  absentCredentialCategory: 'APPROVED_SECRET_REQUIRED',
  deterministicRuntimeBypassForbidden: true,
});
assert.deepStrictEqual(rawContract.closure, {
  policyId: 'w5.implementation-design.v1',
  parameterContract: ['purpose', 'anchors', 'subject', 'policyAnchorId'],
  relationshipId: 'semprod-rel-default-query-service',
  selectedViewId: 'semprod-wp2-default-retrieval-readiness',
  excludedOverlappingViewId: 'semprod-wp2-vector-seed-closure',
  firstInclusionOrder: ['semantic-seed', 'purpose-policy-closure', 'complete-view-closure'],
  versionFields: ['canonicalVersion', 'contentVersion', 'indexVersion'],
  completeViewMetadata: true,
  parentViewpoint: true,
  versionedMembersAndRelationshipEndpoints: true,
  uniqueProvenanceForEveryReturnedObject: true,
});
assert.deepStrictEqual(rawContract.readinessCases, [
  { name: 'structural-only-pending', state: 'SemanticIndexPending', missingChannels: ['Element', 'ArchitectureRelationship', 'View'], mismatchedChannels: [], mismatchField: undefined },
  { name: 'partial-view-channel', state: 'Partial', missingChannels: ['View'], mismatchedChannels: [], mismatchField: undefined },
  { name: 'stale-canonical-version', state: 'Stale', missingChannels: [], mismatchedChannels: ['Element', 'ArchitectureRelationship', 'View'], mismatchField: undefined },
  { name: 'failed-index', state: 'Failed', missingChannels: [], mismatchedChannels: [], mismatchField: undefined },
  { name: 'unknown-state', state: 'Unknown', missingChannels: [], mismatchedChannels: [], mismatchField: undefined },
  { name: 'content-version-mismatch', state: 'Mismatched', missingChannels: [], mismatchedChannels: ['ArchitectureRelationship'], mismatchField: 'contentVersion' },
  { name: 'index-version-mismatch', state: 'Mismatched', missingChannels: [], mismatchedChannels: ['View'], mismatchField: 'indexVersion' },
  { name: 'complete-alignment', state: 'Aligned', missingChannels: [], mismatchedChannels: [], mismatchField: undefined },
]);
assert.deepStrictEqual(rawContract.operationOrder, [
  'credential-source-resolution',
  'semantic-readiness-read',
  'provider-request',
  'semantic-vector-window-query',
]);
assert.deepStrictEqual(runRawEvidenceAssertionSelfTests(), {
  approvedSourceReads: true,
  zeroResultRetrieval: true,
  vectorIndexCorrelation: true,
  parameterizedCypherCorrelation: true,
  providerQueryVectorCorrelation: true,
  completeViewMetadata: true,
  missingParentViewpoint: true,
  incompleteViewMembers: true,
  versionWrongViewMember: true,
  missingRelationshipEndpoint: true,
  wrongRelationshipEndpoint: true,
  completeReturnedObjectProvenance: true,
  duplicateFirstInclusionProvenance: true,
});
for (const rawProperty of [
  'readTestDefaultKey',
  'readFallbackKey',
  'windowEvidence',
  'windowExhausted',
  'nextOffset',
  'SP03_APPROVED_SOURCE_REQUIRED_KEY_READS_INCOMPLETE',
  'SP03_APPROVED_SOURCE_DIRECT_ATTRIBUTION_MISMATCH',
  'SP03_LEGACY_CONTROL_WORDS_BYPASSED_PRODUCTION_GATE',
  'SP03_LEGACY_CONTROL_WORDS_DID_NOT_REACH_CREDENTIAL_GATE',
  'SP03_ZERO_RESULT_QUERY_SEQUENCE_COUNT',
  'SP03_VECTOR_INDEX_NAME_MISMATCH',
  'SP03_PARAMETERIZED_VECTOR_CYPHER_MISMATCH',
  'SP03_QUERY_VECTOR_PROVIDER_VECTOR_MISMATCH',
  'SP03_TOPK_DID_NOT_EXPAND',
  'SP03_PURPOSE_POLICY_BOUND_PARAMETERS_MISMATCH',
  'SP03_ARCHIMATE_DIRECTION_SEMANTICS_MISMATCH',
  'SP03_ENDPOINT_SOURCE_OBJECT_MISMATCH',
  'SP03_SELECTED_VIEW_METADATA_MISMATCH',
  'SP03_SELECTED_VIEW_PARENT_VIEWPOINT',
  'SP03_SELECTED_VIEW_MEMBER_OBJECTS_INCOMPLETE',
  'SP03_SELECTED_VIEW_MEMBER:',
  'SP03_SELECTED_VIEW_RELATIONSHIP_SOURCE',
  'SP03_SELECTED_VIEW_RELATIONSHIP_TARGET',
  'SP03_OVERLAPPING_VIEW_CASCADE',
  'SP03_FIRST_INCLUSION_ORDER_MISMATCH',
  'SP03_PROVENANCE_VERSION_EVIDENCE_MISMATCH',
  'SP03_RETURNED_OBJECT_FIRST_INCLUSION_PROVENANCE_COUNT',
  'SP03_DUPLICATE_FIRST_INCLUSION_PROVENANCE',
  'SP04_CONTENT_VERSION_EVIDENCE_MISMATCH',
  'SP04_INDEX_VERSION_EVIDENCE_MISMATCH',
  'SP04_REJECTED_STATE_OPERATION_NOT_TERMINAL',
]) {
  assert(harness.includes(rawProperty), `WP_P2_EXPLICIT_ENTRYPOINT_GUARD: Harness omits raw evidence property ${rawProperty}`);
}
assert(!harness.includes('semanticRetrievalBoundary:'), 'WP_P2_EXPLICIT_ENTRYPOINT_GUARD: Harness injects a semantic retrieval boundary');
assert(!/withDefaultSemanticRetrievalTestComposition\(\{\s*environment/s.test(harness), 'WP_P2_EXPLICIT_ENTRYPOINT_GUARD: Harness injects ready-made environment credentials');
assert(handoff.frozenFiles.includes(harnessPath), 'WP_P2_EXPLICIT_ENTRYPOINT_GUARD: Harness is not frozen');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

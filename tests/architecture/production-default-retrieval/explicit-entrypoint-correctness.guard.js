const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const handoff = JSON.parse(read('.argo/temp/ImplementationToCodingHandoff.json'));
const entries = new Map([
  ['tests/explicit/entries/runDefaultMcpNeo4jVectorRetrieval.js', [
    'productionDefaultRetrievalHarness.js',
    'runCredentialSourceMatrix',
    'runDefaultMcpNeo4jVectorRetrieval',
    'runLegacyControlWordProductionGate',
    'runProductionQueryCredentialResolution',
    'runProductionQueryMixedLegacyRejections',
    'runZeroResultDefaultMcpRetrieval',
    'assertCredentialSourceMatrix',
    'assertDefaultVectorRetrieval',
    'assertLegacyControlWordProductionGate',
    'assertProductionQueryCredentialResolution',
    'assertProductionQueryMixedLegacyRejections',
    'assertZeroResultChannels',
    'assertFullSnapshotCompatibility',
  ]],
  ['tests/explicit/entries/runProductionSemanticReadinessGate.js', [
    'productionDefaultRetrievalHarness.js',
    'runReadinessMatrix',
    'runAnchoredGraphTidyCompatibilityControl',
    'assertReadinessMatrix',
    'assertAnchoredGraphTidyCompatibility',
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
  { name: 'mixed-canonical-argo-neo4j-uri', expectedStatus: undefined, expectedCategory: 'SECRET_SOURCE_PROVENANCE_PROHIBITED' },
  { name: 'mixed-canonical-argo-neo4j-username', expectedStatus: undefined, expectedCategory: 'SECRET_SOURCE_PROVENANCE_PROHIBITED' },
  { name: 'mixed-canonical-argo-neo4j-password', expectedStatus: undefined, expectedCategory: 'SECRET_SOURCE_PROVENANCE_PROHIBITED' },
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
assert.deepStrictEqual(rawContract.productionQueryCredentialContract, {
  useCase: 'production-semantic-query',
  actualUninjectedMcp: true,
  requiredResolverOptions: ['repositoryRoot', 'useCase'],
  prohibitedOptIns: ['ARGO_LIVE_PROVIDER_E2E', 'ARGO_W31_LIVE_MUTATION_VECTOR_E2E'],
  requiredLegacyInspectionKeys: ['ARGO_NEO4J_URI', 'ARGO_NEO4J_USERNAME', 'ARGO_NEO4J_PASSWORD'],
  legacyAttributionOrSelectionForbidden: true,
  mixedCanonicalLegacyCategory: 'SECRET_SOURCE_PROVENANCE_PROHIBITED',
  eventProducer: 'production-code',
  requiredBoundaryOrder: [
    'credential-source-resolution',
    'semantic-readiness-read',
    'provider-request',
    'semantic-vector-window-query',
  ],
});
assert.deepStrictEqual(rawContract.graphTidyBypass, {
  anchorsDoNotChangeBypass: true,
  downstreamOperationCount: 0,
  exactCanonicalSnapshot: true,
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
  'SP03_PRODUCTION_QUERY_SOURCE_ADAPTER_CONTRACT_MISSING',
  'SP03_DEFAULT_RETRIEVAL_PRODUCTION_USE_CASE_NOT_REQUESTED',
  'SP03_PRODUCTION_QUERY_NON_DIRECT_SOURCE_OPERATION',
  'SP03_PRODUCTION_QUERY_PROHIBITED_SOURCE_PATH',
  'SP03_PRODUCTION_QUERY_LEGACY_INSPECTION_MISSING',
  'SP03_MIXED_LEGACY_INSPECTION_MISSING',
  'SP03_MIXED_LEGACY_SOURCE_ACCEPTED',
  'SP03_MIXED_LEGACY_ATTRIBUTED_OR_SELECTED',
  'SP03_MIXED_LEGACY_DOWNSTREAM_USE',
  'SP03_PRODUCTION_QUERY_MIXED_LEGACY_MATRIX_INCOMPLETE',
  'SP03_ACTUAL_MIXED_LEGACY_INSPECTION_MISSING',
  'SP03_ACTUAL_MIXED_LEGACY_SOURCE_ACCEPTED',
  'SP03_ACTUAL_MIXED_LEGACY_ATTRIBUTED_OR_SELECTED',
  'SP03_ACTUAL_MIXED_LEGACY_DOWNSTREAM_USE',
  'SP03_PRODUCTION_QUERY_BOUNDARY_ORDER_MISMATCH',
  'SP04_ANCHORED_GRAPH_TIDY_NOT_FULL_SNAPSHOT',
  'SP04_ANCHORED_GRAPH_TIDY_INVOKED_SEMANTIC_OPERATIONS',
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
assert(
  harness.includes('createApprovedDefaultSemanticOperatorJourneyAdapter')
    && harness.includes('semanticOperatorJourney ? { semanticOperatorJourney } : undefined'),
  'WP_P2_EXPLICIT_ENTRYPOINT_GUARD: default semantic scenarios must use approved operator composition',
);
const compatibilityHarness = read('tests/harness/intentArchitectureQueryHarness.js');
assertInheritedSemanticOperatorComposition(harness, compatibilityHarness);
assert.throws(
  () => assertInheritedSemanticOperatorComposition(
    harness.replace(
      'semanticOperatorJourney ? { semanticOperatorJourney } : undefined',
      'semanticOperatorJourney ? undefined : undefined',
    ),
    compatibilityHarness,
  ),
  /WP_P2_EXPLICIT_ENTRYPOINT_GUARD/,
  'WP_P2_EXPLICIT_ENTRYPOINT_GUARD: default raw-fallback fixture passed',
);
assert.throws(
  () => assertInheritedSemanticOperatorComposition(
    harness,
    compatibilityHarness.replace(
      'semanticOperatorJourney: createApprovedSemanticOperatorJourneyAdapter(',
      'semanticRetrievalBoundary: createApprovedSemanticOperatorJourneyAdapter(',
    ),
  ),
  /WP_P2_EXPLICIT_ENTRYPOINT_GUARD/,
  'WP_P2_EXPLICIT_ENTRYPOINT_GUARD: compatibility raw-fallback fixture passed',
);
const {
  assertNoProbeCompatibilityUsesInjectedBoundary,
} = require(path.join(repoRoot, 'tests', 'harness', 'intentArchitectureQueryHarness.js'));
const wrapper = read('.argo/scripts/argo-mcp-server.js');
const innerServer = read('.argo/scripts/systemarchitecture-mcp-server.js');
assert(
  compatibilityHarness.includes("require('../../.argo/scripts/argo-mcp-server.js')")
    && compatibilityHarness.includes("callTool('getSystemArchitecture', args, null, testDependencies)"),
  'WP_P2_EXPLICIT_ENTRYPOINT_GUARD: deterministic compatibility probes must use wrapper argument four',
);
assert(
  wrapper.includes('async function callTool(name, args = {}, progressToken = null, dependencies = undefined)')
    && wrapper.includes('systemArchitectureMcp.callTool(name, args, dependencies)')
    && innerServer.includes('async function callTool(name, args = {}, dependencies = undefined)'),
  'WP_P2_EXPLICIT_ENTRYPOINT_GUARD: wrapper argument four must forward to inner argument three',
);
assert(
  !compatibilityHarness.includes("callTool('getSystemArchitecture', args, testDependencies)"),
  'WP_P2_EXPLICIT_ENTRYPOINT_GUARD: wrapper progressToken position cannot carry deterministic test dependencies',
);
const productionCredentialStart = harness.indexOf('async function runProductionQueryCredentialResolution()');
const productionCredentialEnd = harness.indexOf('function createInstrumentedProviderFetch', productionCredentialStart);
assert(
  productionCredentialStart >= 0 && productionCredentialEnd > productionCredentialStart,
  'WP_P2_EXPLICIT_ENTRYPOINT_GUARD: actual production credential scenario is missing',
);
const productionCredentialScenario = harness.slice(productionCredentialStart, productionCredentialEnd);
assert(
  productionCredentialScenario.includes("callTool('getSystemArchitecture'")
    && productionCredentialScenario.includes('liveConfiguration.resolveApprovedLiveConfiguration = options =>')
    && productionCredentialScenario.includes('runProductionQueryMixedLegacyRejections')
    && productionCredentialScenario.includes('item.mixedLegacyKey')
    && productionCredentialScenario.includes('runActualProductionQueryCredentialScenario'),
  'WP_P2_EXPLICIT_ENTRYPOINT_GUARD: credential matrix must invoke actual MCP orchestration through the approved operator with raw source instrumentation',
);
assert(
  !productionCredentialScenario.includes('observations.neo4jDriver.execute')
    && !productionCredentialScenario.includes('observations.transport.request'),
  'WP_P2_EXPLICIT_ENTRYPOINT_GUARD: Harness must not manually manufacture readiness/provider/vector progression',
);
assert(handoff.frozenFiles.includes(harnessPath), 'WP_P2_EXPLICIT_ENTRYPOINT_GUARD: Harness is not frozen');

assertNoProbeCompatibilityUsesInjectedBoundary()
  .then(evidence => {
    assert.deepStrictEqual(evidence, {
      wrapperDependencyArgument: 4,
      innerDependencyArgument: 3,
      invocationCount: 1,
    });
  })
  .catch(error => {
    console.error(error && error.stack ? error.stack : error);
    process.exitCode = 1;
  });

function assertInheritedSemanticOperatorComposition(defaultHarness, compatibilitySource) {
  const defaultAst = parse(defaultHarness, 'productionDefaultRetrievalHarness.js');
  const defaultCalls = semanticCallToolCalls(defaultAst);
  assert(
    defaultCalls.length >= 2
      && defaultCalls.every(call => (
        call.arguments.length >= 3
        && containsObjectProperty(call.arguments[2], 'semanticOperatorJourney')
        && !containsObjectProperty(call.arguments[2], 'semanticRetrievalBoundary')
      )),
    'WP_P2_EXPLICIT_ENTRYPOINT_GUARD: inherited default semantic callTool depends on raw fallback',
  );

  const compatibilityAst = parse(compatibilitySource, 'intentArchitectureQueryHarness.js');
  const compatibilityCalls = semanticCallToolCalls(compatibilityAst);
  assert.strictEqual(
    compatibilityCalls.length,
    1,
    'WP_P2_EXPLICIT_ENTRYPOINT_GUARD: compatibility callTool count changed',
  );
  const wrapperCall = compatibilityCalls[0];
  assert(
    wrapperCall.arguments.length === 4
      && ts.isIdentifier(wrapperCall.arguments[3]),
    'WP_P2_EXPLICIT_ENTRYPOINT_GUARD: compatibility semantic call lacks wrapper dependencies',
  );
  const dependencyDeclaration = variableDeclaration(
    compatibilityAst,
    wrapperCall.arguments[3].text,
  );
  assert(
    dependencyDeclaration
      && dependencyDeclaration.initializer
      && containsObjectProperty(
        dependencyDeclaration.initializer,
        'semanticOperatorJourney',
      )
      && !containsObjectProperty(
        dependencyDeclaration.initializer,
        'semanticRetrievalBoundary',
      ),
    'WP_P2_EXPLICIT_ENTRYPOINT_GUARD: compatibility semantic callTool depends on raw fallback',
  );
}

function semanticCallToolCalls(ast) {
  const calls = [];
  walk(ast, node => {
    if (
      ts.isCallExpression(node)
      && ts.isIdentifier(node.expression)
      && node.expression.text === 'callTool'
      && node.arguments.length > 0
      && ts.isStringLiteral(node.arguments[0])
      && node.arguments[0].text === 'getSystemArchitecture'
    ) calls.push(node);
  });
  return calls;
}

function containsObjectProperty(root, name) {
  let found = false;
  walk(root, node => {
    if (
      ts.isObjectLiteralExpression(node)
      && node.properties.some(property => (
        (ts.isPropertyAssignment(property) || ts.isShorthandPropertyAssignment(property))
        && property.name
        && property.name.getText() === name
      ))
    ) found = true;
  });
  return found;
}

function variableDeclaration(ast, name) {
  let found;
  walk(ast, node => {
    if (
      ts.isVariableDeclaration(node)
      && ts.isIdentifier(node.name)
      && node.name.text === name
    ) found = node;
  });
  return found;
}

function parse(source, label) {
  const ast = ts.createSourceFile(label, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  assert.strictEqual(
    ast.parseDiagnostics.length,
    0,
    `WP_P2_EXPLICIT_ENTRYPOINT_GUARD: ${label} is not parseable`,
  );
  return ast;
}

function walk(node, visit) {
  visit(node);
  ts.forEachChild(node, child => walk(child, visit));
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

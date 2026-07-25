const assert = require('node:assert');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const canonicalGraphPath = path.join(repoRoot, 'design', 'KG', 'SystemArchitecture.json');
const { callTool } = require('../../.argo/scripts/argo-mcp-server.js');

async function readAsUnchangedConsumer() {
  return invokeGetSystemArchitecture({});
}

async function readForPurpose({ purpose, intent, subject, ...rest }, probe) {
  const query = { purpose, intent, ...rest };
  if (subject !== undefined) {
    query.subject = subject;
  }
  return invokeGetSystemArchitecture({ query }, probe);
}

async function readForPurposeClosure(query, probe) {
  return readExplicitQuery(query, probe);
}

async function readExplicitQuery(query, probe) {
  return invokeGetSystemArchitecture({ query }, probe);
}

async function readWithoutPurpose({ intent }, probe) {
  return readExplicitQuery({ intent }, probe);
}

function readCanonicalSnapshot() {
  return JSON.parse(fs.readFileSync(canonicalGraphPath, 'utf8'));
}

function expectedLegacyEnvelope(canonicalSnapshot) {
  return {
    status: 'passed',
    graphPath: 'design/KG/SystemArchitecture.json',
    document: canonicalSnapshot,
  };
}

function observeReturnedGraph(result) {
  return result.document;
}

function governingCanonicalVersionFromLegacyResult(result) {
  const graph = observeReturnedGraph(result);
  assert(graph, 'DT00_LEGACY_GRAPH_MISSING: legacy reading must return canonical data');
  return graph.version
    || graph.canonicalVersion
    || (graph.metadata && graph.metadata.canonicalVersion)
    || canonicalGraphFingerprint(graph);
}

function canonicalGraphFingerprint(graph) {
  const identity = {
    name: graph.name || 'System',
    elements: (graph.elements || []).map(element => element.id).sort(),
    relationships: (graph.relationships || []).map(relationship => relationship.id).sort(),
    views: (graph.views || []).map(view => view.view_id).sort(),
  };
  return `canonical:${crypto.createHash('sha256').update(JSON.stringify(identity)).digest('hex')}`;
}

function extractSemanticCanonicalVersion(result) {
  return (result.query && result.query.canonicalVersion)
    || (result.result && result.result.canonicalVersion)
    || (result.result && result.result.provenance && result.result.provenance.canonicalVersion)
    || (result.document && result.document.canonicalVersion);
}

function createSemanticRetrievalProbe() {
  const invocations = [];
  const semanticRetrievalBoundary = Object.freeze({
    async retrieve(request) {
      invocations.push(request);
      return { elements: [], relationships: [], views: [] };
    },
  });
  return Object.freeze({
    semanticRetrievalBoundary,
    invocationCount() {
      return invocations.length;
    },
  });
}

function assertSemanticRetrievalCalls(probe, expectedCount, failureCategory) {
  assert.strictEqual(
    probe.invocationCount(),
    expectedCount,
    `${failureCategory}: semantic retrieval boundary invocation count`,
  );
}

function assertLegacyEnvelopeExternallyEquivalent(actual, expected) {
  assert.deepStrictEqual(
    actual,
    expected,
    'DT01_PUBLIC_ENVELOPE_CHANGED: no-argument response must retain the complete legacy public envelope',
  );
}

function assertNoQueryModeMetadata(result) {
  for (const forbiddenKey of ['query', 'mode', 'result', 'retrieval', 'provenance']) {
    assert(
      !Object.prototype.hasOwnProperty.call(result, forbiddenKey),
      `DT01_QUERY_METADATA_LEAKED: no-argument response must not add '${forbiddenKey}'`,
    );
  }
}

function assertCompleteCanonicalSnapshot(actual, expected, failureCategory) {
  assert.deepStrictEqual(
    actual,
    expected,
    `${failureCategory}: returned graph must equal the complete canonical Elements, Relationships, Views, and memberships`,
  );
}

function assertParameterizedClosurePolicy(result, expectation) {
  const policy = result && result.result && result.result.closurePolicy;
  assert(policy && typeof policy === 'object', `${expectation.failureCategory}_POLICY_MISSING`);
  assert.strictEqual(policy.category, expectation.category, `${expectation.failureCategory}_CATEGORY_MISMATCH`);
  assert(typeof policy.policyId === 'string' && policy.policyId.trim() !== '', `${expectation.failureCategory}_POLICY_ID_MISSING`);
  assert.strictEqual(policy.parameterizedCypher, true, `${expectation.failureCategory}_PARAMETERIZED_CYPHER_REQUIRED`);
  assert(policy.boundParameters && typeof policy.boundParameters === 'object' && !Array.isArray(policy.boundParameters), `${expectation.failureCategory}_BOUND_PARAMETERS_MISSING`);
  assert(Array.isArray(policy.archimateSemantics) && policy.archimateSemantics.length > 0, `${expectation.failureCategory}_ARCHIMATE_SEMANTICS_MISSING`);
  assert.strictEqual(policy.freeGeneratedCypherUsedForMandatoryClosure, false, `${expectation.failureCategory}_FREE_GENERATED_CYPHER_FORBIDDEN`);
  assert.strictEqual(policy.callerIdentitySelectsScope, false, `${expectation.failureCategory}_CALLER_IDENTITY_POLICY_FORBIDDEN`);
}

function assertPurposeCategoryBoundary(result, expectation) {
  const boundary = result && result.result && result.result.boundary;
  assert(boundary && typeof boundary === 'object', `${expectation.failureCategory}_BOUNDARY_MISSING`);
  assert.strictEqual(boundary.category, expectation.category, `${expectation.failureCategory}_BOUNDARY_CATEGORY_MISMATCH`);
  assert(Array.isArray(boundary.included) && boundary.included.length > 0, `${expectation.failureCategory}_INCLUDED_SCOPE_MISSING`);
  assert(Array.isArray(boundary.excluded), `${expectation.failureCategory}_EXCLUSIONS_MISSING`);
  for (const excludedCategory of expectation.excludedCategories || []) {
    assert(
      boundary.excluded.includes(excludedCategory),
      `${expectation.failureCategory}_CATEGORY_NOT_INDEPENDENT: ${excludedCategory}`,
    );
  }
}

function assertIntentDecisionClosure(result) {
  assertParameterizedClosurePolicy(result, {
    category: 'intent-decision',
    failureCategory: 'DT08_INTENT_DECISION',
  });
  assertPurposeCategoryBoundary(result, {
    category: 'intent-decision',
    failureCategory: 'DT08_INTENT_DECISION',
    excludedCategories: ['implementation-design', 'coding-repair', 'audit', 'graph-tidy'],
  });
  const concerns = result.result.intentDecision;
  for (const concern of ['why', 'what', 'businessBehavior', 'acceptance']) {
    assert(
      concerns && (concerns[concern] || (concerns.absent || []).includes(concern)),
      `DT08_INTENT_CONCERN_UNACCOUNTED: ${concern}`,
    );
  }
}

function assertImplementationDesignClosure(result) {
  assertParameterizedClosurePolicy(result, {
    category: 'implementation-design',
    failureCategory: 'DT09_IMPLEMENTATION_DESIGN',
  });
  assertPurposeCategoryBoundary(result, {
    category: 'implementation-design',
    failureCategory: 'DT09_IMPLEMENTATION_DESIGN',
    excludedCategories: ['intent-decision', 'coding-repair', 'audit', 'graph-tidy'],
  });
  const chains = result.result.dependencyChains;
  assert(Array.isArray(chains) && chains.length > 0, 'DT09_DEPENDENCY_CHAINS_MISSING');
  assert(
    chains.every(chain => chain.terminalBoundary && chain.acceptanceSemantics),
    'DT09_UNBOUNDED_IMPLEMENTATION_CHAIN',
  );
}

function assertCodingRepairClosure(result) {
  assertParameterizedClosurePolicy(result, {
    category: 'coding-repair',
    failureCategory: 'DT10_CODING_REPAIR',
  });
  assertPurposeCategoryBoundary(result, {
    category: 'coding-repair',
    failureCategory: 'DT10_CODING_REPAIR',
    excludedCategories: ['intent-decision', 'implementation-design', 'audit', 'graph-tidy'],
  });
  const repair = result.result.repairContext;
  assert.strictEqual(repair && repair.authority, 'intent', 'DT10_INTENT_AUTHORITY_MISSING');
  assert(Array.isArray(repair && repair.guardrails), 'DT10_REPAIR_GUARDRAILS_MISSING');
  assert.strictEqual(repair && repair.includesUnrelatedSimilarCapability, false, 'DT10_UNRELATED_CAPABILITY_INCLUDED');
}

function assertAuditProofClosure(result) {
  assertParameterizedClosurePolicy(result, {
    category: 'audit',
    failureCategory: 'DT11_AUDIT_PROOF',
  });
  assertPurposeCategoryBoundary(result, {
    category: 'audit',
    failureCategory: 'DT11_AUDIT_PROOF',
    excludedCategories: ['intent-decision', 'implementation-design', 'coding-repair', 'graph-tidy'],
  });
  const audit = result.result.auditProof;
  assert(Array.isArray(audit && audit.violations), 'DT11_AUDIT_VIOLATIONS_MISSING');
  assert(Array.isArray(audit && audit.evidenceExceptions), 'DT11_EVIDENCE_EXCEPTIONS_MISSING');
  assert.strictEqual(audit && audit.missingEvidenceTreatedAsPass, false, 'DT11_MISSING_EVIDENCE_FALSE_PASS');
}

function assertCoherentW6VersionEvidence(legacyResult, semanticResult) {
  const governingCanonicalVersion = governingCanonicalVersionFromLegacyResult(legacyResult);
  assert.strictEqual(
    semanticResult.query && semanticResult.query.purpose,
    'implementation-design',
    'DT00_QUERY_PURPOSE_MISSING: semantic evidence must preserve explicit purpose',
  );
  const semanticCanonicalVersion = extractSemanticCanonicalVersion(semanticResult);
  assert(
    semanticCanonicalVersion,
    'DT00_CANONICAL_VERSION_MISSING: semantic evidence must identify the governing canonical version',
  );
  assert.strictEqual(
    semanticCanonicalVersion,
    governingCanonicalVersion,
    'DT00_CANONICAL_VERSION_MISMATCH: semantic canonical version must match the governing legacy graph version',
  );
}

function assertRelationshipEndpointClosure(result, expectation = {}) {
  const endpointClosure = result && result.result && result.result.endpointClosure;
  assert(endpointClosure && typeof endpointClosure === 'object', 'DT13_ENDPOINT_CLOSURE_MISSING');
  assert(Array.isArray(endpointClosure.relationships), 'DT13_RELATIONSHIP_OBJECTS_MISSING');
  assert(endpointClosure.relationships.length > 0, 'DT13_RELATIONSHIPS_EMPTY');
  assert(Array.isArray(endpointClosure.structuralErrors), 'DT13_STRUCTURAL_ERROR_CHANNEL_MISSING');
  const governingCanonicalVersion = expectation.governingCanonicalVersion
    || extractSemanticCanonicalVersion(result)
    || (result.result && result.result.canonicalVersion);
  assert(governingCanonicalVersion, 'DT13_GOVERNING_VERSION_MISSING');
  for (const relationship of endpointClosure.relationships) {
    assert(relationship && relationship.id, 'DT13_RELATIONSHIP_ID_MISSING');
    assert(relationship.source && relationship.target, 'DT13_ENDPOINTS_INCOMPLETE');
    const sourceId = relationship.source_id || relationship.sourceId;
    const targetId = relationship.target_id || relationship.targetId;
    assert(sourceId, 'DT13_SOURCE_ID_MISSING');
    assert(targetId, 'DT13_TARGET_ID_MISSING');
    assert.strictEqual(relationship.source.id, sourceId, 'DT13_SOURCE_ID_MISMATCH');
    assert.strictEqual(relationship.target.id, targetId, 'DT13_TARGET_ID_MISMATCH');
    assert.strictEqual(
      relationship.canonicalVersion,
      governingCanonicalVersion,
      'DT13_RELATIONSHIP_VERSION_MISMATCH',
    );
    assert.strictEqual(
      relationship.source.canonicalVersion,
      governingCanonicalVersion,
      'DT13_SOURCE_VERSION_MISMATCH',
    );
    assert.strictEqual(
      relationship.target.canonicalVersion,
      governingCanonicalVersion,
      'DT13_TARGET_VERSION_MISMATCH',
    );
  }
  for (const category of ['dangling-endpoint', 'cross-version-endpoint']) {
    assert(
      endpointClosure.structuralErrors.some(error => error && error.category === category),
      `DT13_STRUCTURAL_ERROR_MISSING: ${category}`,
    );
  }
}

function assertCompleteViewClosure(result, expectation = {}) {
  const viewClosure = result && result.result && result.result.viewClosure;
  assert(viewClosure && typeof viewClosure === 'object', 'DT14_VIEW_CLOSURE_MISSING');
  assert(Array.isArray(viewClosure.views) && viewClosure.views.length > 0, 'DT14_TARGET_VIEW_MISSING');
  assert.strictEqual(viewClosure.overlappingViewCascade, false, 'DT14_OVERLAPPING_VIEW_CASCADE');
  for (const view of viewClosure.views) {
    assert(view.view_id && view.view_name, 'DT14_VIEW_METADATA_MISSING');
    assert(view.viewpointBinding || view.description, 'DT14_VIEWPOINT_BINDING_MISSING');
    assert(Array.isArray(view.included_elements), 'DT14_VIEW_MEMBER_IDS_MISSING');
    assert(Array.isArray(view.included_relationships), 'DT14_VIEW_RELATIONSHIP_IDS_MISSING');
    assert(Array.isArray(view.memberElements), 'DT14_VIEW_MEMBER_OBJECTS_MISSING');
    assert(Array.isArray(view.memberRelationships), 'DT14_VIEW_RELATIONSHIP_OBJECTS_MISSING');
    assertSetEqual(
      view.included_elements,
      view.memberElements.map(member => member && member.id),
      'DT14_MEMBER_OBJECT_SET_INCOMPLETE',
    );
    assertSetEqual(
      view.included_relationships,
      view.memberRelationships.map(relationship => relationship && relationship.id),
      'DT14_RELATIONSHIP_OBJECT_SET_INCOMPLETE',
    );
    if (expectation.requiresRelationships !== false) {
      assert(view.included_relationships.length > 0, 'DT14_IN_VIEW_RELATIONSHIPS_MISSING');
      assert(view.memberRelationships.length > 0, 'DT14_VIEW_RELATIONSHIP_OBJECTS_EMPTY');
    }
    if (expectation.parentViewpointRequired !== false) {
      assert(
        (view.parentViewpoint && (view.parentViewpoint.id || view.parentViewpoint.name))
          || (view.parent_element_id && view.parent_element_name),
        'DT14_PARENT_VIEWPOINT_MISSING',
      );
    }
    assert(
      view.memberRelationships.every(relationship => (
        relationship
        && relationship.source
        && relationship.target
        && relationship.source.id
        && relationship.target.id
      )),
      'DT14_VIEW_RELATIONSHIP_ENDPOINTS_MISSING',
    );
  }
}

function assertFirstInclusionProvenance(result, expectation = {}) {
  const provenance = result && result.result && result.result.provenance;
  assert(provenance && typeof provenance === 'object', 'DT15_PROVENANCE_EVIDENCE_MISSING');
  assert(Array.isArray(provenance.objects) && provenance.objects.length > 0, 'DT15_PROVENANCE_OBJECTS_MISSING');
  for (const object of provenance.objects) {
    assert(object.firstInclusionReason, 'DT15_FIRST_INCLUSION_REASON_MISSING');
    assert(!Array.isArray(object.firstInclusionReason), 'DT15_MULTIPLE_FIRST_INCLUSION_REASONS');
    assert(Array.isArray(object.supplementaryReasons), 'DT15_SUPPLEMENTARY_REASONS_MISSING');
    assert(
      !object.supplementaryReasons.includes(object.firstInclusionReason),
      'DT15_SUPPLEMENTARY_REASON_OVERWROTE_FIRST',
    );
  }
  assert(provenance.purpose, 'DT15_PURPOSE_EVIDENCE_MISSING');
  assert(provenance.policy && provenance.policy.policyId, 'DT15_POLICY_EVIDENCE_MISSING');
  assert(
    provenance.policy && (
      (provenance.policy.parameters && typeof provenance.policy.parameters === 'object')
      || (provenance.policy.boundParameters && typeof provenance.policy.boundParameters === 'object')
    ),
    'DT15_POLICY_PARAMETERS_MISSING',
  );
  assert(
    provenance.policy && Array.isArray(provenance.policy.anchors) && provenance.policy.anchors.length > 0,
    'DT15_POLICY_ANCHORS_MISSING',
  );
  assert(provenance.canonicalVersion, 'DT15_CANONICAL_VERSION_EVIDENCE_MISSING');
  assert(provenance.semanticIndex && provenance.semanticIndex.contentVersion, 'DT15_CONTENT_VERSION_EVIDENCE_MISSING');
  assert(provenance.semanticIndex && provenance.semanticIndex.indexVersion, 'DT15_INDEX_VERSION_EVIDENCE_MISSING');
  assert(provenance.alignment && provenance.alignment.state, 'DT15_ALIGNMENT_EVIDENCE_MISSING');
  for (const duplicateFixture of expectation.duplicatePathFixtures || []) {
    const object = provenance.objects.find(candidate => candidate && candidate.objectId === duplicateFixture.objectId);
    assert(object, `DT15_DUPLICATE_PATH_FIXTURE_MISSING: ${duplicateFixture.objectId}`);
    assert.strictEqual(
      object.firstInclusionReason,
      duplicateFixture.expectedFirstInclusionReason,
      `DT15_ORDERED_FIRST_REASON_MISMATCH: ${duplicateFixture.objectId}`,
    );
    for (const laterReason of duplicateFixture.expectedSupplementaryReasons || []) {
      assert(
        object.supplementaryReasons.includes(laterReason),
        `DT15_SUPPLEMENTARY_REASON_MISSING: ${duplicateFixture.objectId}:${laterReason}`,
      );
    }
  }
}

function assertUniqueCanonicalIdentities(graph, failureCategory) {
  assertUnique((graph.elements || []).map(element => element.id), `${failureCategory}: duplicate Element identity`);
  assertUnique((graph.relationships || []).map(relationship => relationship.id), `${failureCategory}: duplicate Relationship identity`);
  assertUnique((graph.views || []).map(view => view.view_id), `${failureCategory}: duplicate View identity`);
}

async function invokeGetSystemArchitecture(args, probe) {
  process.env.ARGO_REPO_ROOT = repoRoot;
  const testDependencies = probe
    ? { semanticRetrievalBoundary: probe.semanticRetrievalBoundary }
    : undefined;
  const response = await callTool('getSystemArchitecture', args, null, testDependencies);
  assert(response && Array.isArray(response.content), 'QUERY_BOUNDARY_PROTOCOL_FAILURE: MCP response must contain content');
  return JSON.parse(response.content[0].text);
}

function assertUnique(values, message) {
  assert.strictEqual(new Set(values).size, values.length, message);
}

function assertSetEqual(expectedValues, actualValues, message) {
  const expected = [...new Set((expectedValues || []).filter(Boolean))].sort();
  const actual = [...new Set((actualValues || []).filter(Boolean))].sort();
  assert.deepStrictEqual(actual, expected, message);
}

module.exports = {
  assertCompleteCanonicalSnapshot,
  assertAuditProofClosure,
  assertCodingRepairClosure,
  assertCoherentW6VersionEvidence,
  assertCompleteViewClosure,
  assertFirstInclusionProvenance,
  assertImplementationDesignClosure,
  assertIntentDecisionClosure,
  assertLegacyEnvelopeExternallyEquivalent,
  assertNoQueryModeMetadata,
  assertParameterizedClosurePolicy,
  assertPurposeCategoryBoundary,
  assertRelationshipEndpointClosure,
  assertSemanticRetrievalCalls,
  assertUniqueCanonicalIdentities,
  createSemanticRetrievalProbe,
  expectedLegacyEnvelope,
  extractSemanticCanonicalVersion,
  governingCanonicalVersionFromLegacyResult,
  observeReturnedGraph,
  readAsUnchangedConsumer,
  readCanonicalSnapshot,
  readExplicitQuery,
  readForPurpose,
  readForPurposeClosure,
  readWithoutPurpose,
};

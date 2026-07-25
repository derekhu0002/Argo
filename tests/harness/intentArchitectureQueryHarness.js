const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const canonicalGraphPath = path.join(repoRoot, 'design', 'KG', 'SystemArchitecture.json');
const { callTool } = require('../../.argo/scripts/argo-mcp-server.js');

async function readAsUnchangedConsumer() {
  return invokeGetSystemArchitecture({});
}

async function readForPurpose({ purpose, intent, subject }, probe) {
  const query = { purpose, intent };
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

module.exports = {
  assertCompleteCanonicalSnapshot,
  assertAuditProofClosure,
  assertCodingRepairClosure,
  assertImplementationDesignClosure,
  assertIntentDecisionClosure,
  assertLegacyEnvelopeExternallyEquivalent,
  assertNoQueryModeMetadata,
  assertParameterizedClosurePolicy,
  assertPurposeCategoryBoundary,
  assertSemanticRetrievalCalls,
  assertUniqueCanonicalIdentities,
  createSemanticRetrievalProbe,
  expectedLegacyEnvelope,
  observeReturnedGraph,
  readAsUnchangedConsumer,
  readCanonicalSnapshot,
  readExplicitQuery,
  readForPurpose,
  readForPurposeClosure,
  readWithoutPurpose,
};

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
  assertLegacyEnvelopeExternallyEquivalent,
  assertNoQueryModeMetadata,
  assertSemanticRetrievalCalls,
  assertUniqueCanonicalIdentities,
  createSemanticRetrievalProbe,
  expectedLegacyEnvelope,
  observeReturnedGraph,
  readAsUnchangedConsumer,
  readCanonicalSnapshot,
  readExplicitQuery,
  readForPurpose,
  readWithoutPurpose,
};

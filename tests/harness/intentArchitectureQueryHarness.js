const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const canonicalGraphPath = path.join(repoRoot, 'design', 'KG', 'SystemArchitecture.json');
const { callTool } = require('../../.argo/scripts/argo-mcp-server.js');

async function readAsUnchangedConsumer() {
  return invokeGetSystemArchitecture({});
}

async function readForPurpose({ purpose, intent, subject }) {
  const query = { purpose, intent };
  if (subject !== undefined) {
    query.subject = subject;
  }
  return invokeGetSystemArchitecture({ query });
}

function readCanonicalSnapshot() {
  return JSON.parse(fs.readFileSync(canonicalGraphPath, 'utf8'));
}

function observeReturnedGraph(result) {
  return result.document;
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

async function invokeGetSystemArchitecture(args) {
  process.env.ARGO_REPO_ROOT = repoRoot;
  const response = await callTool('getSystemArchitecture', args);
  assert(response && Array.isArray(response.content), 'QUERY_BOUNDARY_PROTOCOL_FAILURE: MCP response must contain content');
  return JSON.parse(response.content[0].text);
}

function assertUnique(values, message) {
  assert.strictEqual(new Set(values).size, values.length, message);
}

module.exports = {
  assertCompleteCanonicalSnapshot,
  assertUniqueCanonicalIdentities,
  observeReturnedGraph,
  readAsUnchangedConsumer,
  readCanonicalSnapshot,
  readForPurpose,
};

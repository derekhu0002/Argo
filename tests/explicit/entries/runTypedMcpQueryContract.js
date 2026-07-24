const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const canonicalGraphPath = path.join(repoRoot, 'design', 'KG', 'SystemArchitecture.json');
const { callTool } = require('../../../.argo/scripts/argo-mcp-server.js');

async function main() {
  process.env.ARGO_REPO_ROOT = repoRoot;

  const tool = readListedGetSystemArchitectureTool();
  assert(tool.inputSchema, 'TS00_INPUT_SCHEMA_MISSING: tools/list must declare inputSchema');
  assert(tool.inputSchema.properties.query, 'TS00_QUERY_SCHEMA_MISSING: inputSchema must declare query');
  assert(tool.outputSchema, 'TS00_OUTPUT_SCHEMA_MISSING: tools/list must declare outputSchema');
  assert.deepStrictEqual(
    tool.outputSchema.required,
    ['version', 'mode', 'document', 'query', 'error'],
    'TS00_OUTPUT_FIELDS_UNSTABLE: outputSchema must explicitly require the typed envelope fields',
  );
  assert.deepStrictEqual(
    tool.outputSchema.properties.mode.enum,
    ['full-snapshot', 'semantic-query', 'error'],
    'TS00_MODE_DISCRIMINATOR_MISSING: outputSchema must discriminate every response variant',
  );

  const canonicalGraph = JSON.parse(fs.readFileSync(canonicalGraphPath, 'utf8'));
  const snapshotResponse = await callTool('getSystemArchitecture');
  assertTypedResponse(snapshotResponse, {
    mode: 'full-snapshot',
    document: canonicalGraph,
    query: null,
    error: null,
  });
  assertLegacyText(snapshotResponse, {
    status: 'passed',
    graphPath: 'design/KG/SystemArchitecture.json',
    document: canonicalGraph,
  });

  const semanticDocument = { elements: [], relationships: [], views: [] };
  const semanticQuery = {
    purpose: 'implementation-design',
    intent: 'Return typed architecture context',
  };
  const semanticResponse = await callTool(
    'getSystemArchitecture',
    { query: semanticQuery },
    null,
    {
      semanticRetrievalBoundary: {
        async retrieve() {
          return semanticDocument;
        },
      },
    },
  );
  assertTypedResponse(semanticResponse, {
    mode: 'semantic-query',
    document: semanticDocument,
    query: {
      ...semanticQuery,
      mode: 'semantic-query',
      semanticRetrieval: 'invoked',
    },
    error: null,
  });
  assertLegacyStructuredSemanticsMatch(semanticResponse);

  const invalidPurposeResponse = await callTool('getSystemArchitecture', {
    query: {
      purpose: 'unsupported-purpose',
      intent: 'Reject an unsupported purpose',
    },
  });
  assertTypedError(invalidPurposeResponse, 'QUERY_PURPOSE_INVALID');

  const missingAuditSubjectResponse = await callTool('getSystemArchitecture', {
    query: {
      purpose: 'audit',
      intent: 'Audit the query boundary',
    },
  });
  assertTypedError(missingAuditSubjectResponse, 'AUDIT_SUBJECT_REQUIRED');
}

function readListedGetSystemArchitectureTool() {
  const result = spawnSync(process.execPath, ['.argo/scripts/argo-mcp-server.js'], {
    cwd: repoRoot,
    input: [
      JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'typed-contract-acceptance', version: '1' },
        },
      }),
      JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} }),
      JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }),
      '',
    ].join('\n'),
    encoding: 'utf8',
  });
  assert.strictEqual(result.status, 0, result.stderr);
  const responses = result.stdout.trim().split(/\r?\n/).map(line => JSON.parse(line));
  const listResponse = responses.find(response => response.id === 2);
  assert(listResponse, 'TS00_TOOLS_LIST_MISSING: tools/list response must exist');
  const tool = listResponse.result.tools.find(candidate => candidate.name === 'getSystemArchitecture');
  assert(tool, 'TS00_TOOL_DECLARATION_MISSING: getSystemArchitecture must be listed');
  return tool;
}

function assertTypedResponse(response, expected) {
  assert(response.structuredContent, 'TS00_STRUCTURED_CONTENT_MISSING: response must include structuredContent');
  assert.strictEqual(
    response.structuredContent.version,
    '1.0',
    'TS00_VERSION_MISSING: structured response must declare contract version 1.0',
  );
  for (const field of ['mode', 'document', 'query', 'error']) {
    assert.deepStrictEqual(
      response.structuredContent[field],
      expected[field],
      `TS00_TYPED_FIELD_MISMATCH: ${field}`,
    );
  }
}

function assertTypedError(response, expectedCategory) {
  assert.strictEqual(response.isError, true, 'TS00_TYPED_ERROR_FLAG_MISSING');
  assertTypedResponse(response, {
    mode: 'error',
    document: null,
    query: null,
    error: JSON.parse(response.content[0].text).error,
  });
  assert.strictEqual(
    response.structuredContent.error.category,
    expectedCategory,
    `TS00_TYPED_ERROR_CATEGORY_UNSTABLE: expected ${expectedCategory}`,
  );
  assert.strictEqual(typeof response.structuredContent.error.message, 'string');
  assertLegacyStructuredSemanticsMatch(response);
}

function assertLegacyText(response, expectedPayload) {
  assert(response.content && response.content[0] && response.content[0].type === 'text');
  assert.deepStrictEqual(JSON.parse(response.content[0].text), expectedPayload);
}

function assertLegacyStructuredSemanticsMatch(response) {
  const legacy = JSON.parse(response.content[0].text);
  const structured = response.structuredContent;
  assert.strictEqual(structured.mode, legacy.status === 'failed' ? 'error' : legacy.query.mode);
  assert.deepStrictEqual(structured.document, legacy.document || null);
  assert.deepStrictEqual(structured.query, legacy.query || null);
  assert.deepStrictEqual(structured.error, legacy.error || null);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const systemArchitectureMcp = require(path.join(repoRoot, '.argo', 'scripts', 'systemarchitecture-mcp-server.js'));

async function main() {
  const originalDebug = process.env.ARGO_MCP_MUTATION_RESPONSE_DEBUG;
  const originalLiveProvider = process.env.ARGO_LIVE_PROVIDER_E2E;
  const originalMutationVector = process.env.ARGO_W31_LIVE_MUTATION_VECTOR_E2E;
  try {
    process.env.ARGO_LIVE_PROVIDER_E2E = '0';
    process.env.ARGO_W31_LIVE_MUTATION_VECTOR_E2E = '0';

    delete process.env.ARGO_MCP_MUTATION_RESPONSE_DEBUG;
    const compact = await writeFixtureDescription('compact response');
    assert.deepStrictEqual(
      Object.keys(compact).sort(),
      ['content', 'embeddingLifecycle', 'isError', 'status', 'written'].sort(),
      'BP_AUTOALIGN_MUTATION_RESPONSE_DEFAULT_NOT_COMPACT',
    );
    assert.deepStrictEqual(
      Object.keys(compact.embeddingLifecycle),
      ['state'],
      'BP_AUTOALIGN_MUTATION_RESPONSE_DEFAULT_LIFECYCLE_NOT_COMPACT',
    );
    assert.strictEqual(compact.status, 'passed', 'BP_AUTOALIGN_MUTATION_RESPONSE_DEFAULT_STATUS');
    assert.strictEqual(compact.written, true, 'BP_AUTOALIGN_MUTATION_RESPONSE_DEFAULT_WRITTEN');
    assert.strictEqual(
      JSON.parse(compact.content[0].text).embeddingLifecycle.state,
      compact.embeddingLifecycle.state,
      'BP_AUTOALIGN_MUTATION_RESPONSE_CONTENT_NOT_COMPACT',
    );

    process.env.ARGO_MCP_MUTATION_RESPONSE_DEBUG = '1';
    const debug = await writeFixtureDescription('debug response');
    assert(Array.isArray(debug.touchedElementIds), 'BP_AUTOALIGN_MUTATION_RESPONSE_DEBUG_TOUCHED_IDS_MISSING');
    assert(debug.alignment, 'BP_AUTOALIGN_MUTATION_RESPONSE_DEBUG_ALIGNMENT_MISSING');
    assert(
      Object.prototype.hasOwnProperty.call(debug.embeddingLifecycle, 'alignmentState'),
      'BP_AUTOALIGN_MUTATION_RESPONSE_DEBUG_LIFECYCLE_DETAILS_MISSING',
    );
  } finally {
    restoreEnv('ARGO_MCP_MUTATION_RESPONSE_DEBUG', originalDebug);
    restoreEnv('ARGO_LIVE_PROVIDER_E2E', originalLiveProvider);
    restoreEnv('ARGO_W31_LIVE_MUTATION_VECTOR_E2E', originalMutationVector);
  }
}

async function writeFixtureDescription(description) {
  const { graphPath, tempRoot } = createFixtureGraph(description);
  try {
    const response = await systemArchitectureMcp.callTool('updateArchitectureElement', {
      architecturePath: path.relative(repoRoot, graphPath),
      id: '1798',
      patch: { description },
    });
    assert(response && Array.isArray(response.content), 'BP_AUTOALIGN_MUTATION_RESPONSE_TOOL_SHAPE_INVALID');
    return response;
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function createFixtureGraph(description) {
  const tempRoot = fs.mkdtempSync(path.join(repoRoot, 'tests', 'supporting', '.tmp-response-contract-'));
  const graphPath = path.join(tempRoot, 'SystemArchitecture.json');
  fs.writeFileSync(graphPath, JSON.stringify({
    name: 'SystemArchitecture',
    description: 'Mutation response contract fixture.',
    elements: [
      { id: '1798', name: 'Orchestrator', type: 'Outcome', description },
      { id: '1799', name: 'IntentionDesign', type: 'Application Component' },
      { id: '1800', name: 'ImplementationDesign', type: 'Application Component' },
      { id: '1801', name: 'CodingAndReparing', type: 'Application Component' },
      { id: '1803', name: 'SystemArchitecture', type: 'Application Function' },
      { id: '1805', name: 'argo_test', type: 'Application Component' },
    ],
    relationships: [
      {
        id: '1726',
        name: 'Assignment',
        type: 'Assignment',
        statement: 'IntentionDesign --(Assignment)--> SystemArchitecture',
        source_id: '1799',
        target_id: '1803',
        source_name: 'IntentionDesign',
        target_name: 'SystemArchitecture',
      },
    ],
    views: [
      {
        view_id: '237',
        view_name: 'SystemArchitecture',
        included_elements: ['1798', '1799', '1800', '1803', '1805'],
        included_relationships: ['1726'],
      },
      {
        view_id: '238',
        view_name: 'Business View',
        parent_element_id: '1798',
        parent_element_name: 'Orchestrator',
        included_elements: ['1798', '1799', '1803'],
      },
      {
        view_id: '239',
        view_name: 'Application View',
        parent_element_id: '1798',
        parent_element_name: 'Orchestrator',
        included_elements: ['1798', '1799', '1800', '1801'],
      },
    ],
  }, null, 2));
  return { graphPath, tempRoot };
}

function restoreEnv(name, value) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }
  process.env[name] = value;
}

main().catch(error => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});

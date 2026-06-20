const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { callTool } = require('../../.cursor/tools/systemarchitecture/server.js');

const repoRoot = path.resolve(__dirname, '..', '..');
const sourceGraphPath = path.join(repoRoot, 'design', 'KG', 'SystemArchitecture.json');

async function main() {
  const tempRoot = fs.mkdtempSync(path.join(ensureTempDirectory(), 'case-'));
  const tempGraphPath = path.join(tempRoot, 'SystemArchitecture.json');
  fs.copyFileSync(sourceGraphPath, tempGraphPath);

  process.env.ARGO_REPO_ROOT = repoRoot;

  await rejectsInvalidRelationshipWithoutWriting(tempGraphPath);
  await previewsValidElementMutation(tempGraphPath);
}

function ensureTempDirectory() {
  const tempDirectory = path.join(repoRoot, 'tests', 'mcp', '.tmp');
  fs.mkdirSync(tempDirectory, { recursive: true });
  return tempDirectory;
}

async function rejectsInvalidRelationshipWithoutWriting(tempGraphPath) {
  const before = fs.readFileSync(tempGraphPath, 'utf8');
  const response = await callTool('previewSystemArchitectureMutation', {
    architecturePath: path.relative(repoRoot, tempGraphPath),
    mutations: [
      {
        type: 'addRelationship',
        relationship: {
          id: 'mcp-invalid-triggering',
          statement: 'SystemArchitecture --(Triggering)--> Orchestrator',
          name: 'Triggering',
          source_id: '1803',
          target_id: '1798',
          source_name: 'SystemArchitecture',
          target_name: 'Orchestrator',
        },
      },
    ],
  });

  const payload = parseToolPayload(response);
  assert.strictEqual(payload.status, 'failed');
  assert.strictEqual(payload.written, false);
  assert(
    payload.errors.some(error => error.includes('violates ArchiMate grammar')),
    `Expected ArchiMate grammar error, got: ${JSON.stringify(payload.errors)}`,
  );
  assert.strictEqual(fs.readFileSync(tempGraphPath, 'utf8'), before);
}

async function previewsValidElementMutation(tempGraphPath) {
  const response = await callTool('previewSystemArchitectureMutation', {
    architecturePath: path.relative(repoRoot, tempGraphPath),
    mutations: [
      {
        type: 'addElement',
        element: {
          id: 'mcp-valid-outcome',
          name: 'MCP governed graph mutation outcome',
          type: 'Outcome',
          description: 'SystemArchitecture graph changes are accepted only through the MCP mutation gateway.',
        },
      },
    ],
  });

  const payload = parseToolPayload(response);
  assert.deepStrictEqual(payload.errors, []);
  assert.strictEqual(payload.status, 'passed');
  assert.strictEqual(payload.written, false);
  assert.strictEqual(payload.after.elementCount, payload.before.elementCount + 1);
}

function parseToolPayload(response) {
  assert(response && Array.isArray(response.content), 'MCP response must contain content');
  return JSON.parse(response.content[0].text);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

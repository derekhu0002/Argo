const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const sourceGraphPath = path.join(repoRoot, 'design', 'KG', 'SystemArchitecture.json');
const serverEntrypoints = [
  '.cursor/tools/systemarchitecture/server.js',
  '.github/tools/systemarchitecture/server.js',
  '.opencode/tools/systemarchitecture/server.js',
];
const validatorEntrypoints = [
  '.cursor/tools/validator/server.js',
  '.github/tools/validator/server.js',
  '.opencode/tools/validator/server.js',
];

async function main() {
  process.env.ARGO_REPO_ROOT = repoRoot;

  for (const validatorEntrypoint of validatorEntrypoints) {
    const { callTool } = require(path.join(repoRoot, validatorEntrypoint));
    await validatesCurrentGraph(callTool, validatorEntrypoint);
  }

  for (const serverEntrypoint of serverEntrypoints) {
    const { callTool } = require(path.join(repoRoot, serverEntrypoint));
    const tempRoot = fs.mkdtempSync(path.join(ensureTempDirectory(), 'case-'));
    const tempGraphPath = path.join(tempRoot, 'SystemArchitecture.json');
    fs.copyFileSync(sourceGraphPath, tempGraphPath);

    await rejectsInvalidRelationshipWithoutWriting(callTool, tempGraphPath, serverEntrypoint);
    await previewsValidElementMutation(callTool, tempGraphPath, serverEntrypoint);
  }
}

function ensureTempDirectory() {
  const tempDirectory = path.join(repoRoot, 'tests', 'mcp', '.tmp');
  fs.mkdirSync(tempDirectory, { recursive: true });
  return tempDirectory;
}

async function rejectsInvalidRelationshipWithoutWriting(callTool, tempGraphPath, serverEntrypoint) {
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
    `Expected ArchiMate grammar error from ${serverEntrypoint}, got: ${JSON.stringify(payload.errors)}`,
  );
  assert.strictEqual(fs.readFileSync(tempGraphPath, 'utf8'), before);
}

async function previewsValidElementMutation(callTool, tempGraphPath, serverEntrypoint) {
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
  assert.deepStrictEqual(payload.errors, [], serverEntrypoint);
  assert.strictEqual(payload.status, 'passed');
  assert.strictEqual(payload.written, false);
  assert.strictEqual(payload.after.elementCount, payload.before.elementCount + 1);
}

async function validatesCurrentGraph(callTool, validatorEntrypoint) {
  const response = await callTool('validateSystemArchitecture', {});
  const payload = parseToolPayload(response);
  assert.strictEqual(payload.status, 'passed', validatorEntrypoint);
}

function parseToolPayload(response) {
  assert(response && Array.isArray(response.content), 'MCP response must contain content');
  return JSON.parse(response.content[0].text);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

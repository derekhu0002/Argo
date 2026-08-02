const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const argoMcp = require(path.join(repoRoot, '.argo', 'scripts', 'argo-mcp-server.js'));

async function main() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'argo-mcp-env-'));
  const keys = [
    'ARGO_REPO_ROOT',
    'ARGO_LIVE_PROVIDER_E2E',
    'ARGO_NEO4J_DATABASE_URL',
    'ARGO_NEO4J_DATABASE_USERNAME',
  ];
  const previous = new Map(keys.map(key => [key, process.env[key]]));
  try {
    fs.writeFileSync(path.join(root, 'Argo.feap'), 'controlled template');
    fs.mkdirSync(path.join(root, '.argo'), { recursive: true });
    fs.mkdirSync(path.join(root, 'design', 'KG'), { recursive: true });
    fs.copyFileSync(
      path.join(repoRoot, 'design', 'KG', 'SystemArchitecture.json'),
      path.join(root, 'design', 'KG', 'SystemArchitecture.json'),
    );
    fs.writeFileSync(path.join(root, '.argo', '.env'), [
      'ARGO_LIVE_PROVIDER_E2E=',
      'ARGO_NEO4J_DATABASE_URL=neo4j://repository-env.invalid:7687',
      'ARGO_NEO4J_DATABASE_USERNAME=repository-user',
    ].join('\n'));

    process.env.ARGO_REPO_ROOT = root;
    delete process.env.ARGO_LIVE_PROVIDER_E2E;
    delete process.env.ARGO_NEO4J_DATABASE_URL;
    process.env.ARGO_NEO4J_DATABASE_USERNAME = 'process-user';

    const response = await argoMcp.handleRequest({
      jsonrpc: '2.0',
      id: 'mcp-repository-env',
      method: 'tools/call',
      params: {
        name: 'initializeWorkspace',
        arguments: {},
      },
    });
    const payload = JSON.parse(response.result.content[0].text);

    assert.strictEqual(payload.status, 'ok', 'MCP_REPOSITORY_ENV_INIT_FAILED');
    assert.strictEqual(
      process.env.ARGO_NEO4J_DATABASE_URL,
      'neo4j://repository-env.invalid:7687',
      'MCP_REPOSITORY_ENV_FILE_NOT_LOADED',
    );
    assert.strictEqual(
      process.env.ARGO_NEO4J_DATABASE_USERNAME,
      'process-user',
      'MCP_REPOSITORY_ENV_PROCESS_PRECEDENCE_LOST',
    );
  } finally {
    for (const [key, value] of previous.entries()) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    fs.rmSync(root, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

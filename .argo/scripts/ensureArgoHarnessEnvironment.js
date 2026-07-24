const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const argoMcp = require('./argo-mcp-server.js');
const {
  DEFAULT_GRAPH_PATH,
  createDriver,
  ensureDatabaseExists,
  getNeo4jConfig,
  getNeo4jGraphSyncState,
  syncArchitectureToNeo4j,
  verifyArchitectureSync,
} = require('./neo4j-system-architecture-store.js');

const REQUIRED_TOOL_NAMES = [
  'getSystemArchitecture',
  'applySystemArchitectureMutation',
  'validateSystemArchitecture',
];

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const workspaceRoot = resolveWorkspaceRoot();
  const reportPath = path.join(workspaceRoot, '.argo', 'temp', 'argo-harness-init-report.json');
  const report = {
    status: 'ok',
    workspaceRoot,
    generatedAt: new Date().toISOString(),
    mode: options.checkOnly ? 'check-only' : 'prepare-and-check',
    reportPath: normalizeRelativePath(path.relative(workspaceRoot, reportPath)),
  };

  try {
    report.mcp = verifyArgoMcpServer({ workspaceRoot });
    report.systemArchitecture = await verifyCanonicalSystemArchitecture();
    report.neo4j = await ensureNeo4jProjection({ checkOnly: options.checkOnly });
  } catch (error) {
    report.status = 'failed';
    report.error = String(error && error.stack ? error.stack : error);
  }

  if (report.mcp && report.mcp.status === 'failed') {
    report.status = 'failed';
  }
  if (report.systemArchitecture && report.systemArchitecture.status === 'failed') {
    report.status = 'failed';
  }
  if (report.neo4j && report.neo4j.status === 'failed') {
    report.status = 'failed';
  }

  writeJson(reportPath, report);
  console.log(JSON.stringify(report, null, 2));

  if (report.status !== 'ok') {
    process.exit(1);
  }
}

function parseArgs(argv) {
  const options = {
    checkOnly: false,
  };

  for (const token of argv) {
    if (token === '--check-only') {
      options.checkOnly = true;
      continue;
    }
    throw new Error(`Unsupported argument: ${token}`);
  }

  return options;
}

function resolveWorkspaceRoot() {
  return process.env.ARGO_REPO_ROOT
    || process.env.WORKSPACE_FOLDER
    || path.resolve(__dirname, '..', '..');
}

function verifyArgoMcpServer({ workspaceRoot }) {
  const serverPath = path.join(workspaceRoot, '.argo', 'scripts', 'argo-mcp-server.js');
  const requests = [
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'argo-init-skill', version: '1' } } },
    { jsonrpc: '2.0', method: 'notifications/initialized', params: {} },
    { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
    { jsonrpc: '2.0', id: 3, method: 'ping', params: {} },
  ];
  const input = `${requests.map(entry => JSON.stringify(entry)).join('\n')}\n`;
  const result = spawnSync(process.execPath, [serverPath], {
    cwd: workspaceRoot,
    input,
    encoding: 'utf8',
  });

  if (result.error) {
    return {
      status: 'failed',
      error: String(result.error),
    };
  }
  if (result.status !== 0) {
    return {
      status: 'failed',
      error: result.stderr || `argo MCP exited with code ${result.status}`,
    };
  }

  const responses = String(result.stdout || '')
    .split(/\r?\n/)
    .filter(line => line.trim())
    .map(line => JSON.parse(line));
  const initializeResponse = responses.find(entry => entry.id === 1);
  const toolsListResponse = responses.find(entry => entry.id === 2);
  const pingResponse = responses.find(entry => entry.id === 3);

  if (!initializeResponse || !toolsListResponse || !pingResponse) {
    return {
      status: 'failed',
      error: 'argo MCP did not return initialize/tools-list/ping responses as expected.',
    };
  }

  const toolNames = (toolsListResponse.result && toolsListResponse.result.tools ? toolsListResponse.result.tools : [])
    .map(tool => tool.name)
    .sort();
  const missingTools = REQUIRED_TOOL_NAMES.filter(name => !toolNames.includes(name));
  if (missingTools.length > 0) {
    return {
      status: 'failed',
      error: `argo MCP is missing required tools: ${missingTools.join(', ')}`,
      toolCount: toolNames.length,
    };
  }

  return {
    status: 'ok',
    protocolVersion: initializeResponse.result && initializeResponse.result.protocolVersion,
    serverName: initializeResponse.result && initializeResponse.result.serverInfo && initializeResponse.result.serverInfo.name,
    toolCount: toolNames.length,
    checkedTools: REQUIRED_TOOL_NAMES,
    ping: 'ok',
  };
}

async function verifyCanonicalSystemArchitecture() {
  const getResponse = await argoMcp.callTool('getSystemArchitecture', {
    architecturePath: DEFAULT_GRAPH_PATH,
  });
  const getPayload = parseToolPayload(getResponse);
  if (getPayload.status !== 'passed') {
    return {
      status: 'failed',
      error: `getSystemArchitecture failed for ${DEFAULT_GRAPH_PATH}`,
      payload: getPayload,
    };
  }

  const validateResponse = await argoMcp.callTool('validateSystemArchitecture', {});
  const validatePayload = parseToolPayload(validateResponse);
  if (validatePayload.status !== 'passed') {
    return {
      status: 'failed',
      graphPath: getPayload.graphPath,
      error: 'validateSystemArchitecture reported errors.',
      errors: validatePayload.errors || [],
    };
  }

  return {
    status: 'ok',
    graphPath: getPayload.graphPath,
    elementCount: Array.isArray(getPayload.document && getPayload.document.elements) ? getPayload.document.elements.length : 0,
    relationshipCount: Array.isArray(getPayload.document && getPayload.document.relationships) ? getPayload.document.relationships.length : 0,
    viewCount: Array.isArray(getPayload.document && getPayload.document.views) ? getPayload.document.views.length : 0,
    neo4jRecovery: getPayload.neo4jRecovery || null,
  };
}

async function ensureNeo4jProjection({ checkOnly }) {
  const config = getNeo4jConfig();
  const dirtyBefore = getNeo4jGraphSyncState(DEFAULT_GRAPH_PATH);
  const driver = createDriver(config);
  let databaseProvision = null;
  try {
    await driver.verifyConnectivity();
    if (!checkOnly) {
      databaseProvision = await ensureDatabaseExists(driver, config.database);
    }
  } catch (error) {
    await driver.close();
    return {
      status: 'failed',
      uri: config.uri,
      database: config.database,
      dirtyBefore,
      error: String(error && error.message ? error.message : error),
    };
  }

  await driver.close();

  let syncResult = null;
  if (!checkOnly) {
    syncResult = await syncArchitectureToNeo4j({ architecturePath: DEFAULT_GRAPH_PATH, ...config });
    databaseProvision = syncResult.databaseProvision;
  }

  const verification = await verifyArchitectureSync({ architecturePath: DEFAULT_GRAPH_PATH, ...config });
  if (!verification.matches) {
    return {
      status: 'failed',
      uri: config.uri,
      database: config.database,
      databaseProvision: verification.databaseProvision || databaseProvision,
      dirtyBefore,
      initialSync: syncResult ? syncResult.counts : null,
      verification,
    };
  }

  return {
    status: 'ok',
    uri: config.uri,
    database: config.database,
    databaseProvision: verification.databaseProvision || databaseProvision,
    dirtyBefore,
    initialSync: syncResult ? {
      graphKey: syncResult.graphKey,
      counts: syncResult.counts,
    } : null,
    verification,
  };
}

function parseToolPayload(result) {
  if (!result || !Array.isArray(result.content) || result.content.length === 0) {
    throw new Error('Unexpected MCP tool result shape.');
  }
  return JSON.parse(result.content[0].text);
}

function normalizeRelativePath(value) {
  return String(value).replace(/\\/g, '/');
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

main().catch(error => {
  console.error(String(error && error.stack ? error.stack : error));
  process.exit(1);
});
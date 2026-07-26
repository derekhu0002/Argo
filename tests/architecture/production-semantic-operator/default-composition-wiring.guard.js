const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const operatorPath = '.argo/scripts/graph-rag/semanticOperatorJourney.js';
const cliPath = '.argo/scripts/semanticOperatorJourneyCli.js';
const systemPath = '.argo/scripts/systemarchitecture-mcp-server.js';
const gatewayPath = '.argo/scripts/argo-mcp-server.js';
const handoff = JSON.parse(read('.argo/temp/ImplementationToCodingHandoff.json'));
const local = read('.argo/scripts/graph-rag/ARCHITECTURE.md');

const exactOperatorPorts = [
  'initializeWorkspace',
  'syncCanonicalStructuralProjection',
  'resolveApprovedConfiguration',
  'runSemanticBackfill',
  'readSemanticReadiness',
  'querySystemArchitecture',
];
const acceptedFactories = [
  'createProductionGraphRagRuntime',
  'createDefaultSemanticRetrieval',
  'resolveApprovedLiveConfiguration',
  'createProductionSemanticOperatorJourney',
];
const operatorTools = [
  'startNewProjectSemanticJourney',
  'backfillSystemArchitectureSemanticProjection',
  'verifySystemArchitectureSemanticReadiness',
  'getSystemArchitecture',
];

// GIVEN WP-P3 may compose, but may not replace, accepted WP-P1/WP-P2 boundaries
// WHEN contracts, authorization, and any materialized default production wiring are inspected
// THEN the exact accepted factories/tools and inward port allowlist are mandatory
for (const required of [...exactOperatorPorts, ...acceptedFactories, ...operatorTools]) {
  assert(
    local.includes(required) || JSON.stringify(handoff.taskExecutionPlan).includes(required),
    `WP_P3_DEFAULT_WIRING_GUARD: contract or plan omits ${required}`,
  );
}

if (exists(operatorPath)) {
  const operator = read(operatorPath);
  for (const port of exactOperatorPorts) {
    assert(operator.includes(port), `WP_P3_DEFAULT_WIRING_GUARD: operator omits inward port ${port}`);
  }
  for (const forbiddenImport of [
    'productionSemanticBackfill.js',
    'productionSemanticCheckpointStore.js',
    'productionSemanticNeo4jAdapter.js',
    'productionSemanticProjectionStore.js',
    'defaultSemanticRetrieval.js',
    'liveEmbeddingProviderConfig.js',
    'productionGraphRagRuntime.js',
  ]) {
    assert(
      !operator.includes(forbiddenImport),
      `WP_P3_DEFAULT_WIRING_GUARD: operator bypasses dependency port with ${forbiddenImport}`,
    );
  }
}

if (exists(operatorPath) || exists(cliPath)) {
  const system = read(systemPath);
  for (const factory of acceptedFactories) {
    assert(system.includes(factory), `WP_P3_DEFAULT_WIRING_GUARD: default MCP wiring omits ${factory}`);
  }
  for (const tool of operatorTools) {
    assert(system.includes(tool), `WP_P3_DEFAULT_WIRING_GUARD: System Architecture MCP omits ${tool}`);
  }

  const gateway = read(gatewayPath);
  for (const tool of operatorTools) {
    assert(gateway.includes(tool), `WP_P3_DEFAULT_WIRING_GUARD: unified MCP gateway omits ${tool}`);
  }
  assert(
    gateway.includes('systemArchitectureMcp.callTool(name, args, dependencies)'),
    'WP_P3_DEFAULT_WIRING_GUARD: gateway does not delegate operator tools unchanged',
  );
}

if (exists(cliPath)) {
  const cli = read(cliPath);
  assert(
    cli.includes("require('./graph-rag/semanticOperatorJourney.js')"),
    'WP_P3_DEFAULT_WIRING_GUARD: CLI does not use the production operator factory',
  );
  assert(cli.includes('runSemanticOperatorCommand'), 'WP_P3_DEFAULT_WIRING_GUARD: CLI export missing');
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, ...relativePath.split('/')));
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

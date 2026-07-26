const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const workspaceRoot = process.env.SP05_OPERATOR_WORKSPACE_ROOT;
const statePath = process.env.SP05_OPERATOR_STATE_PATH;

const {
  createProductionSemanticOperatorJourney,
} = require('../../.argo/scripts/graph-rag/semanticOperatorJourney.js');
const {
  createSemanticReadinessAttestationStore,
} = require('../../.argo/scripts/graph-rag/semanticReadinessAttestationStore.js');
const {
  createReadinessAttestationMetadataAdapter,
} = require('../../.argo/scripts/graph-rag/systemMetadataCommandAdapter.js');
const {
  runCliProcess,
} = require('../../.argo/scripts/semanticOperatorJourneyCli.js');

if (!workspaceRoot || !statePath) {
  throw new Error('SP05_OPERATOR_PROCESS_FIXTURE_PATHS_REQUIRED');
}

function readState() {
  return JSON.parse(fs.readFileSync(statePath, 'utf8'));
}

function updateState(update) {
  const state = readState();
  update(state);
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

function record(kind, details = {}) {
  updateState(state => {
    state.events.push({ sequence: state.events.length + 1, kind, ...details });
  });
}

async function createJourney() {
  const metadataAdapter = process.platform === 'win32'
    ? createReadinessAttestationMetadataAdapter({ repositoryRoot: workspaceRoot })
    : undefined;
  const observedMetadataAdapter = metadataAdapter && process.env.SP05_ATTESTATION_OWNER_OVERRIDE
    ? Object.freeze({
      ...metadataAdapter,
      readReadinessAttestationOwner() {
        return {
          status: 0,
          stdout: `${process.env.SP05_ATTESTATION_OWNER_OVERRIDE}\r\n`,
        };
      },
    })
    : metadataAdapter;
  const attestationStore = createSemanticReadinessAttestationStore({
    repositoryRoot: workspaceRoot,
    graphPath: 'design/KG/SystemArchitecture.json',
    metadataAdapter: observedMetadataAdapter,
  });
  return createProductionSemanticOperatorJourney({
    async initializeWorkspace() {
      record('initialize');
      return { status: 'initialized' };
    },
    async syncCanonicalStructuralProjection() {
      record('structural-projection');
      return { status: 'completed', semanticState: 'SemanticIndexPending' };
    },
    async resolveApprovedConfiguration() {
      record('configuration');
      return { sourceEvidence: { kind: 'approved-external', secretValuesExcluded: true } };
    },
    async runSemanticBackfill(request) {
      record('backfill', { explicitOptIn: request.explicitOptIn });
      if (request.explicitOptIn !== true) {
        const error = new Error('SEMANTIC_BACKFILL_OPT_IN_REQUIRED');
        error.category = 'SEMANTIC_BACKFILL_OPT_IN_REQUIRED';
        error.fullSnapshotFallback = false;
        throw error;
      }
      return { status: 'completed' };
    },
    async readSemanticReadiness() {
      record('readiness-read');
      return readState().readiness;
    },
    async querySystemArchitecture() {
      record('semantic-query');
      return {
        status: 'passed',
        query: { mode: 'semantic-query' },
        document: { elements: [], relationships: [], views: [] },
        readinessVerified: true,
      };
    },
    readinessAttestationStore: attestationStore,
  });
}

async function runMcpMutation() {
  const graphPath = path.join(workspaceRoot, 'design', 'KG', 'SystemArchitecture.json');
  const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
  const element = graph.elements[0];
  if (!element) throw new Error('SP05_MUTATION_FIXTURE_ELEMENT_REQUIRED');
  const systemArchitectureMcp = require('../../.argo/scripts/systemarchitecture-mcp-server.js');
  const result = await systemArchitectureMcp.callTool('updateArchitectureElement', {
    id: element.id,
    patch: {
      description: `${element.description || element.name} — SP05 mutation invalidation probe`,
    },
  });
  process.stdout.write(`${JSON.stringify(result)}\n`);
  return { exitCode: result.status === 'passed' ? 0 : 1 };
}

const operation = process.argv[2] === 'mcp-mutation'
  ? runMcpMutation()
  : runCliProcess({
    argv: process.argv.slice(2),
    dependencies: {
      repositoryRoot: workspaceRoot,
      createSemanticOperatorJourney: createJourney,
    },
    stdout: process.stdout,
    stderr: process.stderr,
  });

operation.then(
  result => {
    process.exitCode = result.exitCode;
  },
  error => {
    process.stderr.write(`${JSON.stringify({
      status: 'failed',
      error: {
        category: error && error.category ? error.category : 'PROCESS_FIXTURE_FAILED',
        message: error && error.message ? error.message : String(error),
      },
    })}\n`);
    process.exitCode = 1;
  },
);

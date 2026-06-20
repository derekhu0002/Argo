const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

const validatorMcp = require('./validator-mcp-server.js');
const systemArchitectureMcp = require('./systemarchitecture-mcp-server.js');

const HANDOFF_FILES_TO_RESET = [
  ['design', 'KG', 'IntentToImplementationHandoff.json'],
  ['design', 'KG', 'ImplementationToCodingHandoff.json'],
];
const EA_TEMPLATE_PATH_CANDIDATES = [
  ['.opencode', 'customtools', 'EA-model-template.feap'],
  ['.opencode', 'EA-model-template.feap'],
  ['eatool', 'EA-model-template.feap'],
  ['EA-model-template.feap'],
  ['Argo.feap'],
];
const WINDOWS_RESERVED_NAMES = new Set([
  'CON', 'PRN', 'AUX', 'NUL',
  'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
  'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
]);

const VALIDATOR_TOOL_NAMES = new Set([
  'validateSystemArchitecture',
  'validateStageHandoff',
  'runArchitectureTests',
]);
const SYSTEM_ARCHITECTURE_TOOL_NAMES = new Set([
  'getSystemArchitecture',
  'previewSystemArchitectureMutation',
  'applySystemArchitectureMutation',
  'addArchitectureElement',
  'updateArchitectureElement',
  'addArchitectureRelationship',
  'updateArchitectureRelationship',
  'addArchitectureView',
  'updateArchitectureView',
  'removeArchitectureView',
]);

const TOOLS = [
  {
    name: 'initializeWorkspace',
    description: 'Bootstrap an Argo workspace by copying the EA template target and resetting stage handoff artifacts.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'validateSystemArchitecture',
    description: 'Validate design/KG/SystemArchitecture.json through the repository-native schema and graph validator.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'validateStageHandoff',
    description: 'Validate Argo stage handoff JSON. Use stage intent-to-implementation or implementation-to-coding, or omit to validate all supported stages.',
    inputSchema: {
      type: 'object',
      properties: {
        stage: {
          type: 'string',
          enum: ['intent-to-implementation', 'implementation-to-coding'],
          description: 'Optional handoff stage to validate.',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'runArchitectureTests',
    description: 'Execute explicit architecture testcases from the intent graph and refresh design/KG/test-failure-records.json.',
    inputSchema: {
      type: 'object',
      properties: {
        architecturePath: {
          type: 'string',
          description: 'Optional architecture graph path relative to workspace root. Default: design/KG/SystemArchitecture.json',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'getSystemArchitecture',
    description: 'Read the current SystemArchitecture graph without modifying it.',
    inputSchema: {
      type: 'object',
      properties: {
        architecturePath: { type: 'string', description: 'Default: design/KG/SystemArchitecture.json' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'previewSystemArchitectureMutation',
    description: 'Dry-run graph mutations and return validation errors and a summary without writing the graph.',
    inputSchema: mutationInputSchema(),
  },
  {
    name: 'applySystemArchitectureMutation',
    description: 'Apply graph mutations only after schema, graph, and ArchiMate checks pass.',
    inputSchema: mutationInputSchema(),
  },
  {
    name: 'addArchitectureElement',
    description: 'Add one element through the governed SystemArchitecture mutation gateway.',
    inputSchema: {
      type: 'object',
      required: ['element', 'view_ids'],
      properties: {
        element: { type: 'object' },
        view_ids: { type: 'array', minItems: 1, items: { type: 'string' } },
        architecturePath: { type: 'string', description: 'Default: design/KG/SystemArchitecture.json' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'updateArchitectureElement',
    description: 'Patch one element through the governed SystemArchitecture mutation gateway.',
    inputSchema: {
      type: 'object',
      required: ['id', 'patch'],
      properties: {
        id: { type: 'string' },
        patch: { type: 'object' },
        architecturePath: { type: 'string', description: 'Default: design/KG/SystemArchitecture.json' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'addArchitectureRelationship',
    description: 'Add one relationship through the governed SystemArchitecture mutation gateway.',
    inputSchema: {
      type: 'object',
      required: ['relationship', 'view_ids'],
      properties: {
        relationship: { type: 'object' },
        view_ids: { type: 'array', minItems: 1, items: { type: 'string' } },
        architecturePath: { type: 'string', description: 'Default: design/KG/SystemArchitecture.json' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'updateArchitectureRelationship',
    description: 'Patch one relationship through the governed SystemArchitecture mutation gateway.',
    inputSchema: {
      type: 'object',
      required: ['id', 'patch'],
      properties: {
        id: { type: 'string' },
        patch: { type: 'object' },
        architecturePath: { type: 'string', description: 'Default: design/KG/SystemArchitecture.json' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'addArchitectureView',
    description: 'Add one view through the governed SystemArchitecture mutation gateway.',
    inputSchema: {
      type: 'object',
      required: ['view'],
      properties: {
        view: { type: 'object' },
        architecturePath: { type: 'string', description: 'Default: design/KG/SystemArchitecture.json' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'updateArchitectureView',
    description: 'Patch one view through the governed SystemArchitecture mutation gateway.',
    inputSchema: {
      type: 'object',
      required: ['view_id', 'patch'],
      properties: {
        view_id: { type: 'string' },
        patch: { type: 'object' },
        architecturePath: { type: 'string', description: 'Default: design/KG/SystemArchitecture.json' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'removeArchitectureView',
    description: 'Remove one view through the governed SystemArchitecture mutation gateway.',
    inputSchema: {
      type: 'object',
      required: ['view_id'],
      properties: {
        view_id: { type: 'string' },
        architecturePath: { type: 'string', description: 'Default: design/KG/SystemArchitecture.json' },
      },
      additionalProperties: false,
    },
  },
];

function mutationInputSchema() {
  return {
    type: 'object',
    required: ['mutations'],
    properties: {
      architecturePath: { type: 'string', description: 'Default: design/KG/SystemArchitecture.json' },
      mutations: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['type'],
          properties: {
            type: {
              type: 'string',
              enum: [
                'addElement',
                'updateElement',
                'removeElement',
                'addRelationship',
                'updateRelationship',
                'removeRelationship',
                'addView',
                'updateView',
                'removeView',
              ],
            },
            element: { type: 'object' },
            relationship: { type: 'object' },
            view: { type: 'object' },
            id: { type: 'string' },
            patch: { type: 'object' },
            view_id: { type: 'string' },
            view_ids: { type: 'array', minItems: 1, items: { type: 'string' } },
            element_ids: { type: 'array', items: { type: 'string' } },
            relationship_ids: { type: 'array', items: { type: 'string' } },
          },
          additionalProperties: false,
        },
      },
    },
    additionalProperties: false,
  };
}

function resolveWorkspaceRoot() {
  return process.env.ARGO_REPO_ROOT
    || process.env.WORKSPACE_FOLDER
    || path.resolve(__dirname, '..');
}

async function callTool(name, args = {}) {
  if (name === 'initializeWorkspace') {
    return toolResult(await initializeWorkspace(resolveWorkspaceRoot()));
  }
  if (VALIDATOR_TOOL_NAMES.has(name)) {
    return validatorMcp.callTool(name, args);
  }
  if (SYSTEM_ARCHITECTURE_TOOL_NAMES.has(name)) {
    return systemArchitectureMcp.callTool(name, args);
  }
  throw new Error(`Unknown tool: ${name}`);
}

async function initializeWorkspace(workspaceRoot) {
  const workspaceName = path.basename(workspaceRoot);
  const createdFiles = [];
  const updatedFiles = [];
  const removedFiles = [];
  const skippedSteps = [];

  const templateSourcePath = resolveTemplateSourcePath(workspaceRoot);
  const targetFeapName = buildTargetFileName(workspaceName);
  const targetFeapPath = path.join(workspaceRoot, targetFeapName);
  if (!fs.existsSync(targetFeapPath)) {
    await fs.promises.copyFile(templateSourcePath, targetFeapPath);
    createdFiles.push(normalizeRelativePath(targetFeapName));
  } else {
    skippedSteps.push(`${normalizeRelativePath(targetFeapName)} already exists`);
  }

  for (const handoffPath of HANDOFF_FILES_TO_RESET) {
    const absolutePath = path.join(workspaceRoot, ...handoffPath);
    if (fs.existsSync(absolutePath)) {
      await fs.promises.rm(absolutePath, { force: true });
      removedFiles.push(normalizeRelativePath(path.relative(workspaceRoot, absolutePath)));
    }
  }

  return {
    workspaceRoot,
    targetFeapName,
    createdFiles,
    updatedFiles,
    removedFiles,
    skippedSteps,
    status: 'ok',
  };
}

function resolveTemplateSourcePath(workspaceRoot) {
  for (const candidate of EA_TEMPLATE_PATH_CANDIDATES) {
    const absolutePath = path.join(workspaceRoot, ...candidate);
    if (fs.existsSync(absolutePath)) {
      return absolutePath;
    }
  }
  throw new Error(`Unable to locate EA template. Checked: ${EA_TEMPLATE_PATH_CANDIDATES.map(candidate => candidate.join('/')).join(', ')}`);
}

function buildTargetFileName(workspaceName) {
  const sanitized = sanitizeFileName(workspaceName) || 'workspace';
  const safeBaseName = WINDOWS_RESERVED_NAMES.has(sanitized.toUpperCase())
    ? `${sanitized}_workspace`
    : sanitized;
  return `${safeBaseName}.feap`;
}

function sanitizeFileName(value) {
  return value
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/[.\s]+$/g, '')
    .trim();
}

function normalizeRelativePath(value) {
  return String(value).replace(/\\/g, '/');
}

function toolResult(payload) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(payload, null, 2),
      },
    ],
    isError: payload.status === 'failed',
  };
}

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

async function handleRequest(request) {
  const { id, method, params } = request;

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: {
          name: 'argo',
          version: '1.0.0',
        },
      },
    };
  }

  if (method === 'notifications/initialized') {
    return null;
  }

  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: { tools: TOOLS },
    };
  }

  if (method === 'tools/call') {
    try {
      const result = await callTool(params.name, params.arguments || {});
      return { jsonrpc: '2.0', id, result };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: String(error && error.stack ? error.stack : error),
            },
          ],
          isError: true,
        },
      };
    }
  }

  if (method === 'ping') {
    return { jsonrpc: '2.0', id, result: {} };
  }

  return {
    jsonrpc: '2.0',
    id,
    error: {
      code: -32601,
      message: `Method not found: ${method}`,
    },
  };
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line.trim()) {
      continue;
    }
    let request;
    try {
      request = JSON.parse(line);
    } catch {
      continue;
    }
    const response = await handleRequest(request);
    if (response) {
      send(response);
    }
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  callTool,
  main,
};

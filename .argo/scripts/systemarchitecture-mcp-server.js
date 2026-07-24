const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

const DEFAULT_GRAPH_PATH = 'design/KG/SystemArchitecture.json';
const LEGAL_QUERY_PURPOSES = new Set([
  'intent-decision',
  'implementation-design',
  'coding-repair',
  'audit',
  'graph-tidy',
]);
const SCHEMA_PATH_CANDIDATES = [
  '.argo/schema/SystemArchitecture.schema.json',
];

const {
  validateGraphSemantics,
  validateArchiMateEndpointMatrix,
  validateViewElementLimits,
} = require('./graph-semantics.js');
const architectureDiffPlantuml = require('./generateArchitectureDiffPlantuml.js');
const {
  DEFAULT_GRAPH_PATH: NEO4J_DEFAULT_GRAPH_PATH,
  recoverNeo4jSyncIfNeeded,
  syncArchitectureToNeo4j,
} = require('./neo4j-system-architecture-store.js');

const HANDLED_MUTATION_TYPES = new Set([
  'addElement',
  'updateElement',
  'removeElement',
  'addRelationship',
  'updateRelationship',
  'removeRelationship',
  'addView',
  'updateView',
  'removeView',
]);

const TOOLS = [
  {
    name: 'getSystemArchitecture',
    description: 'Start here. read-only tool for inspecting current elements, relationships, views, and ids before planning mutations. Use before preview or focused mutation tools.',
    inputSchema: {
      type: 'object',
      properties: {
        architecturePath: { type: 'string', description: `Default: ${DEFAULT_GRAPH_PATH}` },
        query: {
          type: 'object',
          properties: {
            purpose: {
              type: 'string',
              enum: Array.from(LEGAL_QUERY_PURPOSES),
            },
            intent: { type: 'string' },
            subject: { type: 'string' },
          },
          additionalProperties: true,
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'getIntentElementContext',
    description: 'read-only query that returns an intent subgraph context for one element. Uses ArchiMate semantic dependency traversal with dependencyDepth and dependentDepth, preserving native subgraph elements, relationships, and views.',
    inputSchema: intentElementContextInputSchema(),
  },
  {
    name: 'validateSystemArchitecture',
    description: 'Validate design/KG/SystemArchitecture.json through the repository-native schema and graph validator.',
    inputSchema: {
      type: 'object',
      properties: {
        architecturePath: { type: 'string', description: `Default: ${DEFAULT_GRAPH_PATH}` },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'generateArchitectureDiffPlantuml',
    description: 'Generate a timestamped PlantUML Markdown tree for current git diff changes in SystemArchitecture.json. The tool compares HEAD and working tree, extracts changed elements/relationships, and writes to .argo/temp/architecture_analysis/.',
    inputSchema: {
      type: 'object',
      properties: {
        architecturePath: {
          type: 'string',
          description: `Optional architecture graph path relative to workspace root. Default: ${DEFAULT_GRAPH_PATH}`,
        },
        outputDir: {
          type: 'string',
          description: 'Optional output directory relative to workspace root. Default: .argo/temp/architecture_analysis',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'previewSystemArchitectureMutation',
    description: 'Use before apply for complex or risky changes. Performs a dry-run of one or more mutations, runs schema, graph, view, and ArchiMate 3.2 validation, and does not write the graph.',
    inputSchema: mutationInputSchema(),
  },
  {
    name: 'applySystemArchitectureMutation',
    description: 'Use for multi-step or dependent graph changes that should be validated and written atomically. Prefer focused tools for a single simple add, update, or remove operation.',
    inputSchema: mutationInputSchema(),
  },
  {
    name: 'addArchitectureElement',
    description: 'Use for one element. Creates a new element or adds an existing element to view_ids. view_ids is required so elements never exist outside views. Set dryRun to preview without writing.',
    inputSchema: {
      type: 'object',
      required: ['element', 'view_ids'],
      properties: {
        element: { type: 'object' },
        view_ids: { type: 'array', minItems: 1, items: { type: 'string' } },
        dryRun: { type: 'boolean', description: 'When true, validates and returns the result without writing to the graph. Default: false.' },
        architecturePath: { type: 'string', description: `Default: ${DEFAULT_GRAPH_PATH}` },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'updateArchitectureElement',
    description: 'Use for one global element metadata patch. Does not change view membership. Element id and type are immutable; remove and re-add to change them. Set dryRun to preview without writing.',
    inputSchema: {
      type: 'object',
      required: ['id', 'patch'],
      properties: {
        id: { type: 'string' },
        patch: { type: 'object' },
        dryRun: { type: 'boolean', description: 'When true, validates and returns the result without writing to the graph. Default: false.' },
        architecturePath: { type: 'string', description: `Default: ${DEFAULT_GRAPH_PATH}` },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'removeArchitectureElement',
    description: 'Use for one element removal. With view_ids, removes only from those views and cascades related relationships in the same views; without view_ids, removes from all views and the graph. Set dryRun to preview without writing.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string' },
        view_ids: { type: 'array', minItems: 1, items: { type: 'string' } },
        dryRun: { type: 'boolean', description: 'When true, validates and returns the result without writing to the graph. Default: false.' },
        architecturePath: { type: 'string', description: `Default: ${DEFAULT_GRAPH_PATH}` },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'addArchitectureRelationship',
    description: 'Use for one relationship. Creates a new relationship or adds an existing relationship to view_ids. relationship.type is the ArchiMate 3.2 relationship type and is validated against endpoint element types. Set dryRun to preview without writing.',
    inputSchema: {
      type: 'object',
      required: ['relationship', 'view_ids'],
      properties: {
        relationship: { type: 'object' },
        view_ids: { type: 'array', minItems: 1, items: { type: 'string' } },
        dryRun: { type: 'boolean', description: 'When true, validates and returns the result without writing to the graph. Default: false.' },
        architecturePath: { type: 'string', description: `Default: ${DEFAULT_GRAPH_PATH}` },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'updateArchitectureRelationship',
    description: 'Use for one global relationship metadata patch, such as name, statement, source_name, or target_name. Relationship id and type are immutable; remove and re-add to change them. Set dryRun to preview without writing.',
    inputSchema: {
      type: 'object',
      required: ['id', 'patch'],
      properties: {
        id: { type: 'string' },
        patch: { type: 'object' },
        dryRun: { type: 'boolean', description: 'When true, validates and returns the result without writing to the graph. Default: false.' },
        architecturePath: { type: 'string', description: `Default: ${DEFAULT_GRAPH_PATH}` },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'removeArchitectureRelationship',
    description: 'Use for one relationship removal. With view_ids, removes only from those views; without view_ids, removes from all views and deletes it from the graph. Set dryRun to preview without writing.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string' },
        view_ids: { type: 'array', minItems: 1, items: { type: 'string' } },
        dryRun: { type: 'boolean', description: 'When true, validates and returns the result without writing to the graph. Default: false.' },
        architecturePath: { type: 'string', description: `Default: ${DEFAULT_GRAPH_PATH}` },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'addArchitectureView',
    description: 'Use for one view. The graph must have exactly one top-level view named SystemArchitecture; all sub-views must attach to an element with parent_element_id. Set dryRun to preview without writing.',
    inputSchema: {
      type: 'object',
      required: ['view'],
      properties: {
        view: { type: 'object' },
        dryRun: { type: 'boolean', description: 'When true, validates and returns the result without writing to the graph. Default: false.' },
        architecturePath: { type: 'string', description: `Default: ${DEFAULT_GRAPH_PATH}` },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'updateArchitectureView',
    description: 'Use for one view metadata or membership patch. Keep the one top-level view named SystemArchitecture and attach sub-views to parent elements. Set dryRun to preview without writing.',
    inputSchema: {
      type: 'object',
      required: ['view_id', 'patch'],
      properties: {
        view_id: { type: 'string' },
        patch: { type: 'object' },
        dryRun: { type: 'boolean', description: 'When true, validates and returns the result without writing to the graph. Default: false.' },
        architecturePath: { type: 'string', description: `Default: ${DEFAULT_GRAPH_PATH}` },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'removeArchitectureView',
    description: 'Use for one view removal. After removal, every remaining element and relationship must still belong to at least one view. Set dryRun to preview without writing.',
    inputSchema: {
      type: 'object',
      required: ['view_id'],
      properties: {
        view_id: { type: 'string' },
        dryRun: { type: 'boolean', description: 'When true, validates and returns the result without writing to the graph. Default: false.' },
        architecturePath: { type: 'string', description: `Default: ${DEFAULT_GRAPH_PATH}` },
      },
      additionalProperties: false,
    },
  },
];

function intentElementContextInputSchema() {
  return {
    type: 'object',
    properties: {
      architecturePath: { type: 'string', description: `Default: ${DEFAULT_GRAPH_PATH}` },
      elementId: { type: 'string' },
      elementName: { type: 'string' },
      profile: {
        type: 'string',
        enum: ['implementation-design', 'coding-repair', 'audit', 'generic-agent'],
        description: 'Default: generic-agent. Affects workContext enrichment only; subgraph shape stays native.',
      },
      dependencyDepth: { type: 'number', description: 'Default: 2. Semantic dependencies needed by the focus element.' },
      dependentDepth: { type: 'number', description: 'Default: 1. Semantic dependents that rely on the focus element.' },
      associationDepth: { type: 'number', description: 'Default: 1. Association neighbors are expanded at least one layer.' },
      associationNeighborDependencyDepth: { type: 'number', description: 'Default: 0. Optional dependency expansion from association neighbors.' },
    },
    additionalProperties: false,
  };
}

function mutationInputSchema() {
  return {
    type: 'object',
    required: ['mutations'],
    properties: {
      architecturePath: { type: 'string', description: `Default: ${DEFAULT_GRAPH_PATH}` },
      mutations: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['type'],
          properties: {
            type: { type: 'string', enum: Array.from(HANDLED_MUTATION_TYPES) },
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
    || path.resolve(__dirname, '..', '..');
}

function resolveWorkspacePath(workspaceRoot, relativePath) {
  const normalizedPath = normalizeRelativePath(relativePath || DEFAULT_GRAPH_PATH);
  const absolutePath = path.resolve(workspaceRoot, normalizedPath);
  const normalizedRoot = path.resolve(workspaceRoot);
  if (!absolutePath.startsWith(normalizedRoot)) {
    throw new Error(`Path escapes workspace root: ${relativePath}`);
  }
  return { absolutePath, relativePath: normalizedPath };
}

function normalizeRelativePath(value) {
  return String(value).replace(/\\/g, '/').replace(/^\/+/, '');
}

function resolveSchemaPath(workspaceRoot) {
  for (const candidate of SCHEMA_PATH_CANDIDATES) {
    const absolutePath = path.join(workspaceRoot, candidate);
    if (fs.existsSync(absolutePath)) {
      return { absolutePath, relativePath: candidate };
    }
  }
  throw new Error(`Unable to locate SystemArchitecture schema. Checked: ${SCHEMA_PATH_CANDIDATES.join(', ')}`);
}

function readJson(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Failed to parse ${label}: ${String(error)}`);
  }
}

async function loadContext(args = {}) {
  const workspaceRoot = resolveWorkspaceRoot();
  const graphPath = resolveWorkspacePath(workspaceRoot, args.architecturePath || DEFAULT_GRAPH_PATH);
  const schemaPath = resolveSchemaPath(workspaceRoot);
  const context = {
    workspaceRoot,
    graphPath,
    schemaPath,
    document: readJson(graphPath.absolutePath, graphPath.relativePath),
    schema: readJson(schemaPath.absolutePath, schemaPath.relativePath),
  };
  context.neo4jSyncRecovery = await recoverNeo4jSyncIfNeeded({
    architecturePath: graphPath.relativePath,
    document: context.document,
  });
  return context;
}

function validateDocument(document, schema, options = {}) {
  const errors = [];
  validateAgainstSchema(document, schema, '#', errors, schema);
  validateGraphSemantics(document, errors);
  validateArchiMateEndpointMatrix(document, errors, {
    touchedRelationshipIds: options.touchedRelationshipIds,
  });
  validateViewElementLimits(document, errors, {
    touchedViewIds: options.validateAllViewElementLimits
      ? (document.views || []).map(view => view && view.view_id)
      : options.touchedViewIds,
  });
  return errors;
}

function buildIntentElementContext(context, args = {}) {
  const profile = args.profile || 'generic-agent';
  const focusResult = resolveFocusElement(context.document, args);
  if (focusResult.status !== 'passed') {
    return focusResult;
  }

  const dependencyDepth = normalizeDepth(args.dependencyDepth, 2);
  const dependentDepth = normalizeDepth(args.dependentDepth, 1);
  const associationDepth = Math.max(1, normalizeDepth(args.associationDepth, 1));
  const associationNeighborDependencyDepth = normalizeDepth(args.associationNeighborDependencyDepth, 0);
  const graphIndex = buildGraphIndex(context.document);
  const focusElement = focusResult.element;
  const includedElementIds = new Set([focusElement.id]);
  const includedRelationshipIds = new Set();
  const dependencyDepthByElement = new Map([[focusElement.id, 0]]);
  const dependentDepthByElement = new Map([[focusElement.id, 0]]);
  const associationDepthByElement = new Map([[focusElement.id, 0]]);

  traverseSemanticContext({
    startId: focusElement.id,
    maxDepth: dependencyDepth,
    mode: 'dependency',
    graphIndex,
    includedElementIds,
    includedRelationshipIds,
    depthByElement: dependencyDepthByElement,
  });
  traverseSemanticContext({
    startId: focusElement.id,
    maxDepth: dependentDepth,
    mode: 'dependent',
    graphIndex,
    includedElementIds,
    includedRelationshipIds,
    depthByElement: dependentDepthByElement,
  });
  traverseSemanticContext({
    startId: focusElement.id,
    maxDepth: associationDepth,
    mode: 'association',
    graphIndex,
    includedElementIds,
    includedRelationshipIds,
    depthByElement: associationDepthByElement,
  });

  if (associationNeighborDependencyDepth > 0) {
    for (const [elementId, depth] of associationDepthByElement.entries()) {
      if (elementId === focusElement.id || depth < 1) {
        continue;
      }
      traverseSemanticContext({
        startId: elementId,
        maxDepth: associationNeighborDependencyDepth,
        mode: 'dependency',
        graphIndex,
        includedElementIds,
        includedRelationshipIds,
        depthByElement: new Map([[elementId, 0]]),
      });
    }
  }

  includeViewAnchors(context.document, includedElementIds, includedRelationshipIds, graphIndex);
  const boundary = buildBoundary({
    graphIndex,
    includedElementIds,
    dependencyDepthByElement,
    dependentDepthByElement,
    associationDepthByElement,
    dependencyDepth,
    dependentDepth,
    associationDepth,
  });
  const explorationHints = buildExplorationHints(boundary, {
    profile,
    dependencyDepth,
    dependentDepth,
    associationDepth,
  });

  return {
    status: 'passed',
    query: {
      architecturePath: context.graphPath.relativePath,
      elementId: focusElement.id,
      elementName: focusElement.name,
      profile,
      dependencyDepth,
      dependentDepth,
      associationDepth,
      associationNeighborDependencyDepth,
      traversalMode: 'archimate-semantic',
    },
    focusElementId: focusElement.id,
    subgraph: buildNativeSubgraph(context.document, includedElementIds, includedRelationshipIds),
    boundary,
    explorationHints,
    workContext: {},
    diagnostics: [],
  };
}

function resolveFocusElement(document, args) {
  if (args.elementId) {
    const element = (document.elements || []).find(entry => entry.id === args.elementId);
    if (!element) {
      return {
        status: 'failed',
        error: `Element '${args.elementId}' does not exist`,
        candidates: [],
      };
    }
    return { status: 'passed', element };
  }

  if (!args.elementName) {
    return {
      status: 'failed',
      error: 'elementId or elementName is required',
      candidates: [],
    };
  }

  const matches = (document.elements || []).filter(element => element.name === args.elementName);
  if (matches.length === 1) {
    return { status: 'passed', element: matches[0] };
  }
  if (matches.length > 1) {
    return {
      status: 'ambiguous',
      error: `Element name '${args.elementName}' matched multiple elements`,
      candidates: matches.map(element => ({ id: element.id, name: element.name, type: element.type })),
    };
  }
  return {
    status: 'failed',
    error: `Element name '${args.elementName}' does not exist`,
    candidates: [],
  };
}

function normalizeDepth(value, defaultValue) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return defaultValue;
  }
  return Math.floor(numericValue);
}

function buildGraphIndex(document) {
  const relationshipById = new Map();
  const elementById = new Map((document.elements || []).map(element => [element.id, element]));
  const relationshipsByElementId = new Map();
  for (const relationship of document.relationships || []) {
    relationshipById.set(relationship.id, relationship);
    addIndexedRelationship(relationshipsByElementId, relationship.source_id, relationship);
    addIndexedRelationship(relationshipsByElementId, relationship.target_id, relationship);
  }
  return { elementById, relationshipById, relationshipsByElementId };
}

function addIndexedRelationship(index, elementId, relationship) {
  if (!index.has(elementId)) {
    index.set(elementId, []);
  }
  index.get(elementId).push(relationship);
}

function traverseSemanticContext(options) {
  const {
    startId,
    maxDepth,
    mode,
    graphIndex,
    includedElementIds,
    includedRelationshipIds,
    depthByElement,
  } = options;
  if (maxDepth < 1) {
    return;
  }

  const queue = [{ elementId: startId, depth: 0 }];
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    if (current.depth >= maxDepth) {
      continue;
    }
    for (const edge of resolveSemanticEdges(current.elementId, graphIndex)) {
      if (edge.kind !== mode) {
        continue;
      }
      const nextDepth = current.depth + 1;
      includedElementIds.add(edge.neighborId);
      includedRelationshipIds.add(edge.relationship.id);
      if (!depthByElement.has(edge.neighborId) || nextDepth < depthByElement.get(edge.neighborId)) {
        depthByElement.set(edge.neighborId, nextDepth);
        queue.push({ elementId: edge.neighborId, depth: nextDepth });
      }
    }
  }
}

function resolveSemanticEdges(elementId, graphIndex) {
  const edges = [];
  for (const relationship of graphIndex.relationshipsByElementId.get(elementId) || []) {
    const isSource = relationship.source_id === elementId;
    const neighborId = isSource ? relationship.target_id : relationship.source_id;
    const relationshipType = relationship.type;

    if (relationshipType === 'Association') {
      edges.push({ kind: 'association', neighborId, relationship });
      continue;
    }

    const sourceDependsOnTarget = ['Access', 'Assignment', 'Specialization', 'Composition', 'Aggregation'].includes(relationshipType);
    const targetDependsOnSource = ['Serving', 'Realization', 'Flow', 'Triggering', 'Influence'].includes(relationshipType);
    if (sourceDependsOnTarget) {
      edges.push({ kind: isSource ? 'dependency' : 'dependent', neighborId, relationship });
      continue;
    }
    if (targetDependsOnSource) {
      edges.push({ kind: isSource ? 'dependent' : 'dependency', neighborId, relationship });
    }
  }
  return edges;
}

function includeViewAnchors(document, includedElementIds, includedRelationshipIds, graphIndex) {
  let changed = true;
  while (changed) {
    changed = false;
    for (const view of document.views || []) {
      if (!viewTouchesSubgraph(view, includedElementIds, includedRelationshipIds)) {
        continue;
      }
      if (view.parent_element_id && !includedElementIds.has(view.parent_element_id) && graphIndex.elementById.has(view.parent_element_id)) {
        includedElementIds.add(view.parent_element_id);
        changed = true;
      }
    }
    for (const elementId of Array.from(includedElementIds)) {
      const element = graphIndex.elementById.get(elementId);
      if (element && element.parent && !includedElementIds.has(element.parent) && graphIndex.elementById.has(element.parent)) {
        includedElementIds.add(element.parent);
        changed = true;
      }
    }
  }
}

function viewTouchesSubgraph(view, includedElementIds, includedRelationshipIds) {
  return (view.included_elements || []).some(elementId => includedElementIds.has(elementId))
    || (view.included_relationships || []).some(relationshipId => includedRelationshipIds.has(relationshipId));
}

function buildBoundary(options) {
  return {
    truncatedDependencies: collectTruncatedBoundary({
      ...options,
      depthByElement: mergeBoundaryDepths(options.dependencyDepthByElement, options.associationDepthByElement),
      maxDepth: options.dependencyDepth,
      kind: 'dependency',
    }),
    truncatedDependents: collectTruncatedBoundary({
      ...options,
      depthByElement: options.dependentDepthByElement,
      maxDepth: options.dependentDepth,
      kind: 'dependent',
    }),
  };
}

function mergeBoundaryDepths(primaryDepths, associationDepths) {
  const merged = new Map(primaryDepths);
  for (const [elementId, depth] of associationDepths.entries()) {
    if (!merged.has(elementId) || depth < merged.get(elementId)) {
      merged.set(elementId, depth);
    }
  }
  return merged;
}

function collectTruncatedBoundary(options) {
  const {
    graphIndex,
    includedElementIds,
    depthByElement,
    maxDepth,
    kind,
  } = options;
  const truncated = [];
  if (maxDepth < 0) {
    return truncated;
  }
  for (const [elementId, depth] of depthByElement.entries()) {
    if (depth < maxDepth && kind !== 'dependency') {
      continue;
    }
    const unexpandedEdges = resolveSemanticEdges(elementId, graphIndex).filter(edge => (
      (edge.kind === kind || (kind === 'dependency' && edge.kind === 'association'))
      && !includedElementIds.has(edge.neighborId)
    ));
    if (unexpandedEdges.length === 0) {
      continue;
    }
    const element = graphIndex.elementById.get(elementId);
    truncated.push({
      elementId,
      elementName: element ? element.name : undefined,
      direction: kind,
      remainingEdgeCount: unexpandedEdges.length,
      relationshipIds: unexpandedEdges.map(edge => edge.relationship.id),
      reason: `${kind} depth limit reached`,
    });
  }
  return truncated;
}

function buildExplorationHints(boundary, defaults) {
  const hints = [];
  for (const entry of boundary.truncatedDependencies || []) {
    hints.push({
      reason: `Element ${entry.elementId} has unexpanded dependency context`,
      suggestedTool: 'getIntentElementContext',
      suggestedArguments: {
        elementId: entry.elementId,
        profile: defaults.profile,
        dependencyDepth: Math.max(1, defaults.dependencyDepth),
        dependentDepth: 0,
        associationDepth: defaults.associationDepth,
      },
    });
  }
  for (const entry of boundary.truncatedDependents || []) {
    hints.push({
      reason: `Element ${entry.elementId} has unexpanded dependent context`,
      suggestedTool: 'getIntentElementContext',
      suggestedArguments: {
        elementId: entry.elementId,
        profile: defaults.profile,
        dependencyDepth: 0,
        dependentDepth: Math.max(1, defaults.dependentDepth),
        associationDepth: defaults.associationDepth,
      },
    });
  }
  return hints;
}

function buildNativeSubgraph(document, includedElementIds, includedRelationshipIds) {
  const elements = (document.elements || [])
    .filter(element => includedElementIds.has(element.id))
    .map(clone);
  const relationships = (document.relationships || [])
    .filter(relationship => includedRelationshipIds.has(relationship.id))
    .map(clone);
  const views = (document.views || [])
    .filter(view => viewTouchesSubgraph(view, includedElementIds, includedRelationshipIds))
    .map(view => {
      const viewCopy = clone(view);
      if (Array.isArray(viewCopy.included_elements)) {
        viewCopy.included_elements = viewCopy.included_elements.filter(elementId => includedElementIds.has(elementId));
      }
      if (Array.isArray(viewCopy.included_relationships)) {
        viewCopy.included_relationships = viewCopy.included_relationships.filter(relationshipId => includedRelationshipIds.has(relationshipId));
      }
      return viewCopy;
    });
  return { elements, relationships, views };
}

function applyMutations(document, mutations) {
  const nextDocument = clone(document);
  const touchedElementIds = new Set();
  const touchedRelationshipIds = new Set();
  const touchedViewIds = new Set();
  const viewLimitCheckIds = new Set();
  const mutationSummaries = [];

  if (!Array.isArray(mutations) || mutations.length === 0) {
    throw new Error('mutations must contain at least one mutation');
  }

  for (const mutation of mutations) {
    if (!mutation || typeof mutation !== 'object' || !HANDLED_MUTATION_TYPES.has(mutation.type)) {
      throw new Error(`Unsupported mutation type: ${mutation && mutation.type}`);
    }

    if (mutation.type === 'addElement') {
      requireObject(mutation.element, 'mutation.element');
      const scopedViews = requireViewScope(nextDocument.views, mutation.view_ids, 'mutation.view_ids');
      requireId(mutation.element.id, 'mutation.element.id');
      const existingElement = findById(nextDocument.elements, mutation.element.id);
      if (!existingElement) {
        nextDocument.elements.push(clone(mutation.element));
      }
      for (const view of scopedViews) {
        view.included_elements = addUnique(view.included_elements || [], [mutation.element.id]);
        touchedViewIds.add(view.view_id);
        viewLimitCheckIds.add(view.view_id);
      }
      touchedElementIds.add(mutation.element.id);
      mutationSummaries.push({
        type: mutation.type,
        id: mutation.element.id,
        view_ids: mutation.view_ids,
        created: !existingElement,
      });
      continue;
    }

    if (mutation.type === 'updateElement') {
      requireId(mutation.id, 'mutation.id');
      requireObject(mutation.patch, 'mutation.patch');
      const element = findById(nextDocument.elements, mutation.id);
      if (!element) {
        throw new Error(`Element '${mutation.id}' does not exist`);
      }
      requirePatchDoesNotChangeElementIdentityOrType(mutation.id, mutation.patch);
      Object.assign(element, clone(mutation.patch));
      touchedElementIds.add(element.id);
      mutationSummaries.push({ type: mutation.type, id: element.id });
      continue;
    }

    if (mutation.type === 'removeElement') {
      requireId(mutation.id, 'mutation.id');
      const element = findById(nextDocument.elements, mutation.id);
      if (!element) {
        throw new Error(`Element '${mutation.id}' does not exist`);
      }
      const scopedViews = mutation.view_ids === undefined
        ? nextDocument.views
        : requireViewScope(nextDocument.views, mutation.view_ids, 'mutation.view_ids');
      const relatedRelationshipIds = nextDocument.relationships
        .filter(relationship => relationship.source_id === mutation.id || relationship.target_id === mutation.id)
        .map(relationship => relationship.id);
      for (const view of scopedViews) {
        view.included_elements = removeEntries(view.included_elements || [], [mutation.id]);
        view.included_relationships = removeEntries(view.included_relationships || [], relatedRelationshipIds);
        touchedViewIds.add(view.view_id);
      }
      const stillIncludedInView = nextDocument.views.some(view => (
        Array.isArray(view.included_elements) && view.included_elements.includes(mutation.id)
      ));
      if (!stillIncludedInView) {
        for (const view of nextDocument.views) {
          view.included_relationships = removeEntries(view.included_relationships || [], relatedRelationshipIds);
          touchedViewIds.add(view.view_id);
        }
        nextDocument.elements = nextDocument.elements.filter(entry => entry.id !== mutation.id);
      }
      const relationshipIdsStillInViews = new Set();
      for (const view of nextDocument.views) {
        for (const relationshipId of view.included_relationships || []) {
          relationshipIdsStillInViews.add(relationshipId);
        }
      }
      nextDocument.relationships = nextDocument.relationships.filter(relationship => (
        !relatedRelationshipIds.includes(relationship.id) || relationshipIdsStillInViews.has(relationship.id)
      ));
      touchedElementIds.add(mutation.id);
      for (const relationshipId of relatedRelationshipIds) {
        touchedRelationshipIds.add(relationshipId);
      }
      mutationSummaries.push({
        type: mutation.type,
        id: mutation.id,
        view_ids: mutation.view_ids,
        removed_from_graph: !stillIncludedInView,
        removed_relationship_ids: relatedRelationshipIds.filter(relationshipId => !relationshipIdsStillInViews.has(relationshipId)),
      });
      continue;
    }

    if (mutation.type === 'addRelationship') {
      requireObject(mutation.relationship, 'mutation.relationship');
      const scopedViews = requireViewScope(nextDocument.views, mutation.view_ids, 'mutation.view_ids');
      requireId(mutation.relationship.id, 'mutation.relationship.id');
      const existingRelationship = findById(nextDocument.relationships, mutation.relationship.id);
      if (!existingRelationship) {
        nextDocument.relationships.push(clone(mutation.relationship));
      }
      for (const view of scopedViews) {
        view.included_relationships = addUnique(view.included_relationships || [], [mutation.relationship.id]);
        touchedViewIds.add(view.view_id);
      }
      touchedRelationshipIds.add(mutation.relationship.id);
      mutationSummaries.push({
        type: mutation.type,
        id: mutation.relationship.id,
        view_ids: mutation.view_ids,
        created: !existingRelationship,
      });
      continue;
    }

    if (mutation.type === 'updateRelationship') {
      requireId(mutation.id, 'mutation.id');
      requireObject(mutation.patch, 'mutation.patch');
      const relationship = findById(nextDocument.relationships, mutation.id);
      if (!relationship) {
        throw new Error(`Relationship '${mutation.id}' does not exist`);
      }
      requirePatchDoesNotChangeRelationshipIdentityOrType(mutation.id, mutation.patch);
      Object.assign(relationship, clone(mutation.patch));
      touchedRelationshipIds.add(relationship.id);
      mutationSummaries.push({ type: mutation.type, id: relationship.id });
      continue;
    }

    if (mutation.type === 'removeRelationship') {
      requireId(mutation.id, 'mutation.id');
      const relationship = findById(nextDocument.relationships, mutation.id);
      if (!relationship) {
        throw new Error(`Relationship '${mutation.id}' does not exist`);
      }
      const scopedViews = mutation.view_ids === undefined
        ? nextDocument.views
        : requireViewScope(nextDocument.views, mutation.view_ids, 'mutation.view_ids');
      for (const view of scopedViews) {
        view.included_relationships = removeEntries(view.included_relationships || [], [mutation.id]);
        touchedViewIds.add(view.view_id);
      }
      const stillIncludedInView = nextDocument.views.some(view => (
        Array.isArray(view.included_relationships) && view.included_relationships.includes(mutation.id)
      ));
      if (!stillIncludedInView) {
        nextDocument.relationships = nextDocument.relationships.filter(entry => entry.id !== mutation.id);
      }
      touchedRelationshipIds.add(mutation.id);
      mutationSummaries.push({
        type: mutation.type,
        id: mutation.id,
        view_ids: mutation.view_ids,
        removed_from_graph: !stillIncludedInView,
      });
      continue;
    }

    if (mutation.type === 'addView') {
      requireObject(mutation.view, 'mutation.view');
      if (findView(nextDocument.views, mutation.view.view_id)) {
        throw new Error(`View '${mutation.view.view_id}' already exists`);
      }
      nextDocument.views.push(clone(mutation.view));
      touchedViewIds.add(mutation.view.view_id);
      viewLimitCheckIds.add(mutation.view.view_id);
      mutationSummaries.push({ type: mutation.type, id: mutation.view.view_id });
      continue;
    }

    if (mutation.type === 'updateView') {
      requireId(mutation.view_id, 'mutation.view_id');
      requireObject(mutation.patch, 'mutation.patch');
      const view = findView(nextDocument.views, mutation.view_id);
      if (!view) {
        throw new Error(`View '${mutation.view_id}' does not exist`);
      }
      Object.assign(view, clone(mutation.patch));
      touchedViewIds.add(view.view_id);
      if (Object.prototype.hasOwnProperty.call(mutation.patch, 'included_elements')) {
        viewLimitCheckIds.add(view.view_id);
      }
      mutationSummaries.push({ type: mutation.type, id: view.view_id });
      continue;
    }

    if (mutation.type === 'removeView') {
      requireId(mutation.view_id, 'mutation.view_id');
      const beforeCount = nextDocument.views.length;
      nextDocument.views = nextDocument.views.filter(view => view.view_id !== mutation.view_id);
      if (nextDocument.views.length === beforeCount) {
        throw new Error(`View '${mutation.view_id}' does not exist`);
      }
      mutationSummaries.push({ type: mutation.type, id: mutation.view_id });
      continue;
    }

  }

  return {
    document: nextDocument,
    touchedElementIds: Array.from(touchedElementIds),
    touchedRelationshipIds: Array.from(touchedRelationshipIds),
    touchedViewIds: Array.from(touchedViewIds),
    viewLimitCheckIds: Array.from(viewLimitCheckIds),
    mutationSummaries,
  };
}

function requireObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function requireId(value, label) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
}

function requireViewScope(views, viewIds, label) {
  if (!Array.isArray(viewIds) || viewIds.length === 0) {
    throw new Error(`${label} must contain at least one view id`);
  }

  const scopedViews = [];
  const seenViewIds = new Set();
  for (const viewId of viewIds) {
    requireId(viewId, `${label}[]`);
    if (seenViewIds.has(viewId)) {
      continue;
    }
    const view = findView(views, viewId);
    if (!view) {
      throw new Error(`View '${viewId}' does not exist`);
    }
    scopedViews.push(view);
    seenViewIds.add(viewId);
  }
  return scopedViews;
}

function requirePatchDoesNotChangeElementIdentityOrType(elementId, patch) {
  if (Object.prototype.hasOwnProperty.call(patch, 'id')) {
    throw new Error(`Element '${elementId}' id cannot be updated; remove and re-add the element to change its id`);
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'type')) {
    throw new Error(`Element '${elementId}' type cannot be updated; remove and re-add the element to change its type`);
  }
}

function requirePatchDoesNotChangeRelationshipIdentityOrType(relationshipId, patch) {
  if (Object.prototype.hasOwnProperty.call(patch, 'id')) {
    throw new Error(`Relationship '${relationshipId}' id cannot be updated; remove and re-add the relationship to change its id`);
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'type')) {
    throw new Error(`Relationship '${relationshipId}' type cannot be updated; remove and re-add the relationship to change its type`);
  }
}

function findById(entries, id) {
  return Array.isArray(entries) ? entries.find(entry => entry && entry.id === id) : undefined;
}

function findView(entries, viewId) {
  return Array.isArray(entries) ? entries.find(entry => entry && entry.view_id === viewId) : undefined;
}

function addUnique(existing, additions) {
  const result = Array.isArray(existing) ? [...existing] : [];
  for (const addition of additions) {
    if (!result.includes(addition)) {
      result.push(addition);
    }
  }
  return result;
}

function removeEntries(existing, removals) {
  const removalSet = new Set(removals);
  return (Array.isArray(existing) ? existing : []).filter(entry => !removalSet.has(entry));
}

async function buildMutationResult(context, mutations, write) {
  const beforeSummary = summarizeDocument(context.document);
  let mutationResult;
  try {
    mutationResult = applyMutations(context.document, mutations);
  } catch (error) {
    const errors = [String(error && error.message ? error.message : error)];
    return {
      status: 'failed',
      written: false,
      graphPath: context.graphPath.relativePath,
      schemaPath: context.schemaPath.relativePath,
      mutations: [],
      touchedElementIds: [],
      touchedRelationshipIds: [],
      before: beforeSummary,
      after: beforeSummary,
      errors,
      guidance: buildFailureGuidance(errors),
    };
  }
  const errors = validateDocument(mutationResult.document, context.schema, {
    touchedRelationshipIds: mutationResult.touchedRelationshipIds,
    touchedViewIds: mutationResult.viewLimitCheckIds,
  });
  const afterSummary = summarizeDocument(mutationResult.document);
  const result = {
    status: errors.length === 0 ? 'passed' : 'failed',
    written: false,
    graphPath: context.graphPath.relativePath,
    schemaPath: context.schemaPath.relativePath,
    mutations: mutationResult.mutationSummaries,
    touchedElementIds: mutationResult.touchedElementIds,
    touchedRelationshipIds: mutationResult.touchedRelationshipIds,
    touchedViewIds: mutationResult.touchedViewIds,
    viewLimitCheckIds: mutationResult.viewLimitCheckIds,
    before: beforeSummary,
    after: afterSummary,
    errors,
  };
  if (errors.length > 0) {
    result.guidance = buildFailureGuidance(errors);
  }

  if (errors.length > 0 || !write) {
    return result;
  }

  writeGraph(context.graphPath.absolutePath, mutationResult.document);
  result.written = true;

  if (shouldSyncCanonicalGraphToNeo4j(context.graphPath.relativePath)) {
    try {
      const syncResult = await syncArchitectureToNeo4j({
        architecturePath: context.graphPath.relativePath,
        document: mutationResult.document,
      });
      result.neo4jSync = {
        status: 'passed',
        graphKey: syncResult.graphKey,
        counts: syncResult.counts,
      };
    } catch (error) {
      const errorMessage = String(error && error.message ? error.message : error);
      result.neo4jSync = {
        status: 'failed',
        error: errorMessage,
      };
      result.warnings = addUnique(result.warnings || [], [
        `SystemArchitecture.json was written, but Neo4j sync failed: ${errorMessage}`,
        'Run node .argo/scripts/syncSystemArchitectureToNeo4j.js to rebuild the Neo4j projection for the canonical intent graph.',
      ]);
    }
  }

  return result;
}

function shouldSyncCanonicalGraphToNeo4j(relativeGraphPath) {
  return normalizeRelativePath(relativeGraphPath) === normalizeRelativePath(NEO4J_DEFAULT_GRAPH_PATH);
}

function buildFailureGuidance(errors) {
  const guidance = [];
  for (const error of errors || []) {
    addGuidanceForError(guidance, String(error));
  }
  if (guidance.length === 0 && Array.isArray(errors) && errors.length > 0) {
    guidance.push('Inspect the error text, call getSystemArchitecture to refresh ids and current view membership, then retry with previewSystemArchitectureMutation before writing.');
  }
  return guidance;
}

function addGuidanceForError(guidance, error) {
  if (error.includes('mutation.view_ids must contain at least one view id')) {
    pushUnique(guidance, 'Select the target view_ids explicitly. Call getSystemArchitecture to inspect existing views, then retry the add/remove operation with the intended view_ids.');
  }
  if (error.includes('violates ArchiMate 3.2 relationship matrix')) {
    pushUnique(guidance, 'Check relationship.type and the source and target element types against ArchiMate 3.2. If the intended meaning is still valid, choose a compliant relationship type or change the endpoint element types by remove-and-add.');
  }
  if (error.includes('uses unsupported ArchiMate relationship type')) {
    pushUnique(guidance, 'Use relationship.type for the ArchiMate relationship type and choose one of the schema-supported ArchiMate 3.2 relationship types.');
  }
  if (error.includes('id cannot be updated') || error.includes('type cannot be updated')) {
    pushUnique(guidance, 'Do not patch immutable identity or type fields. To change an id or type, remove the existing element or relationship, then add the replacement with the desired id or type.');
  }
  if (error.includes('must be included in at least one view')) {
    pushUnique(guidance, 'Every element and relationship must belong to at least one view. Add it with view_ids, or add the existing object to an appropriate view before validating again.');
  }
  if (error.includes('must declare parent_element_id') || error.includes('top-level view')) {
    pushUnique(guidance, 'Keep exactly one top-level view named SystemArchitecture. For any sub-view, set parent_element_id to an existing element and keep parent_element_name aligned with that element name.');
  }
  if (error.includes('must contain at most 7 elements')) {
    pushUnique(guidance, 'Do not force more than 7 elements into one view. Pause and think about layered architecture: split the view into layered sub-views, attach each sub-view with parent_element_id, and move lower-level elements into the appropriate child view before retrying.');
  }
  if (error.includes('does not exist') || error.includes('references missing')) {
    pushUnique(guidance, 'Refresh current ids with getSystemArchitecture. Do not guess ids; use existing element, relationship, and view ids or create missing objects first.');
  }
}

function pushUnique(entries, entry) {
  if (!entries.includes(entry)) {
    entries.push(entry);
  }
}

function summarizeDocument(document) {
  return {
    elementCount: Array.isArray(document.elements) ? document.elements.length : 0,
    relationshipCount: Array.isArray(document.relationships) ? document.relationships.length : 0,
    viewCount: Array.isArray(document.views) ? document.views.length : 0,
  };
}

function writeGraph(graphPath, document) {
  const tempPath = `${graphPath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  fs.renameSync(tempPath, graphPath);
}

function validateAgainstSchema(value, schemaNode, pointer, errors, rootSchema) {
  if (!schemaNode || typeof schemaNode !== 'object') {
    return;
  }

  const resolvedSchema = schemaNode.$ref ? resolveRef(schemaNode.$ref, rootSchema, errors, pointer) : schemaNode;
  if (!resolvedSchema) {
    return;
  }

  if (resolvedSchema.const !== undefined && !isDeepStrictEqual(value, resolvedSchema.const)) {
    errors.push(`${pointer} must equal ${JSON.stringify(resolvedSchema.const)}`);
    return;
  }

  if (resolvedSchema.enum && !resolvedSchema.enum.some(option => isDeepStrictEqual(option, value))) {
    errors.push(`${pointer} must be one of: ${resolvedSchema.enum.map(option => JSON.stringify(option)).join(', ')}`);
    return;
  }

  if (resolvedSchema.type !== undefined) {
    validateType(value, resolvedSchema.type, pointer, errors);
    if (!typeMatches(value, resolvedSchema.type)) {
      return;
    }
  }

  if (typeof resolvedSchema.minLength === 'number' && (typeof value !== 'string' || value.length < resolvedSchema.minLength)) {
    errors.push(`${pointer} must be at least ${resolvedSchema.minLength} character(s) long`);
  }

  if (resolvedSchema.pattern) {
    const matcher = new RegExp(resolvedSchema.pattern);
    if (typeof value !== 'string' || !matcher.test(value)) {
      errors.push(`${pointer} must match pattern ${JSON.stringify(resolvedSchema.pattern)}`);
    }
  }

  if (typeof resolvedSchema.minItems === 'number' && (!Array.isArray(value) || value.length < resolvedSchema.minItems)) {
    errors.push(`${pointer} must contain at least ${resolvedSchema.minItems} item(s)`);
  }

  if (resolvedSchema.type === 'object') {
    validateObject(value, resolvedSchema, pointer, errors, rootSchema);
    return;
  }

  if (resolvedSchema.type === 'array') {
    validateArray(value, resolvedSchema, pointer, errors, rootSchema);
  }
}

function validateObject(value, schemaNode, pointer, errors, rootSchema) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return;
  }

  const properties = schemaNode.properties || {};
  const required = Array.isArray(schemaNode.required) ? schemaNode.required : [];
  for (const key of required) {
    if (!(key in value)) {
      errors.push(`${pointer} is missing required property '${key}'`);
    }
  }

  if (schemaNode.additionalProperties === false) {
    for (const key of Object.keys(value)) {
      if (!(key in properties)) {
        errors.push(`${pointer} contains unsupported property '${key}'`);
      }
    }
  }

  for (const [key, propertySchema] of Object.entries(properties)) {
    if (key in value) {
      validateAgainstSchema(value[key], propertySchema, `${pointer}.${key}`, errors, rootSchema);
    }
  }
}

function validateArray(value, schemaNode, pointer, errors, rootSchema) {
  if (!Array.isArray(value)) {
    return;
  }

  if (schemaNode.items) {
    value.forEach((entry, index) => {
      validateAgainstSchema(entry, schemaNode.items, `${pointer}[${index}]`, errors, rootSchema);
    });
  }
}

function validateType(value, expectedType, pointer, errors) {
  if (!typeMatches(value, expectedType)) {
    const printableType = Array.isArray(expectedType) ? expectedType.join(' or ') : expectedType;
    errors.push(`${pointer} must be of type ${printableType}`);
  }
}

function typeMatches(value, expectedType) {
  if (Array.isArray(expectedType)) {
    return expectedType.some(candidate => typeMatches(value, candidate));
  }
  switch (expectedType) {
    case 'object':
      return value !== null && typeof value === 'object' && !Array.isArray(value);
    case 'array':
      return Array.isArray(value);
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'integer':
      return typeof value === 'number' && Number.isInteger(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'null':
      return value === null;
    default:
      return true;
  }
}

function resolveRef(ref, rootSchema, errors, pointer) {
  if (!ref.startsWith('#/')) {
    errors.push(`${pointer} uses unsupported $ref '${ref}'`);
    return undefined;
  }

  const segments = ref.slice(2).split('/');
  let current = rootSchema;
  for (const segment of segments) {
    if (!current || typeof current !== 'object' || !(segment in current)) {
      errors.push(`${pointer} references missing schema path '${ref}'`);
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

function isDeepStrictEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function validateExplicitQuery(query) {
  if (!query || typeof query !== 'object' || Array.isArray(query) || !query.purpose) {
    return queryError('QUERY_PURPOSE_REQUIRED', 'Explicit queries require a purpose');
  }
  if (!LEGAL_QUERY_PURPOSES.has(query.purpose)) {
    return queryError('QUERY_PURPOSE_INVALID', `Unsupported query purpose: ${query.purpose}`);
  }
  if (typeof query.intent !== 'string' || query.intent.trim().length === 0) {
    return queryError('QUERY_INTENT_REQUIRED', 'Explicit queries require a non-blank intent');
  }
  if (
    query.purpose === 'audit'
    && (typeof query.subject !== 'string' || query.subject.trim().length === 0)
  ) {
    return queryError('AUDIT_SUBJECT_REQUIRED', 'Audit queries require a non-blank subject');
  }

  return {
    status: 'passed',
    query: {
      ...query,
      intent: query.intent.trim(),
      ...(query.subject === undefined ? {} : { subject: query.subject.trim() }),
    },
  };
}

function queryError(category, message) {
  return {
    status: 'failed',
    error: { category, message },
  };
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

async function callTool(name, args = {}, dependencies = undefined) {
  if (name === 'getSystemArchitecture') {
    if (Object.prototype.hasOwnProperty.call(args, 'query')) {
      const validation = validateExplicitQuery(args.query);
      if (validation.status === 'failed') {
        return toolResult(validation);
      }

      const query = validation.query;
      if (query.purpose === 'graph-tidy') {
        const context = await loadContext(args);
        return toolResult(attachContextWarnings({
          status: 'passed',
          graphPath: context.graphPath.relativePath,
          query: {
            ...query,
            mode: 'full-snapshot',
            semanticRetrieval: 'bypassed',
          },
          document: context.document,
        }, context));
      }

      const semanticRetrievalBoundary = dependencies && dependencies.semanticRetrievalBoundary;
      if (!semanticRetrievalBoundary || typeof semanticRetrievalBoundary.retrieve !== 'function') {
        return toolResult(queryError(
          'SEMANTIC_RETRIEVAL_UNAVAILABLE',
          'Semantic retrieval boundary is unavailable',
        ));
      }
      const document = await semanticRetrievalBoundary.retrieve(query);
      return toolResult({
        status: 'passed',
        graphPath: normalizeRelativePath(args.architecturePath || DEFAULT_GRAPH_PATH),
        query: {
          ...query,
          mode: 'semantic-query',
          semanticRetrieval: 'invoked',
        },
        document,
      });
    }

    const context = await loadContext(args);
    return toolResult(attachContextWarnings({
      status: 'passed',
      graphPath: context.graphPath.relativePath,
      document: context.document,
    }, context));
  }

  if (name === 'getIntentElementContext') {
    const context = await loadContext(args);
    return toolResult(attachContextWarnings(buildIntentElementContext(context, args), context));
  }

  if (name === 'validateSystemArchitecture') {
    const context = await loadContext(args);
    const errors = validateDocument(context.document, context.schema, {
      validateAllViewElementLimits: true,
    });
    return toolResult(attachContextWarnings({
      status: errors.length === 0 ? 'passed' : 'failed',
      graphPath: context.graphPath.relativePath,
      schemaPath: context.schemaPath.relativePath,
      errors,
    }, context));
  }

  if (name === 'generateArchitectureDiffPlantuml') {
    return toolResult(architectureDiffPlantuml.generateArchitectureDiffPlantuml({
      workspaceRoot: resolveWorkspaceRoot(),
      architecturePath: args.architecturePath,
      outputDir: args.outputDir,
    }));
  }

  if (name === 'previewSystemArchitectureMutation') {
    const context = await loadContext(args);
    return toolResult(attachContextWarnings(await buildMutationResult(context, args.mutations, false), context));
  }

  if (name === 'applySystemArchitectureMutation') {
    const context = await loadContext(args);
    return toolResult(attachContextWarnings(await buildMutationResult(context, args.mutations, true), context));
  }

  if (name === 'addArchitectureElement') {
    const context = await loadContext(args);
    return toolResult(attachContextWarnings(await buildMutationResult(context, [{ type: 'addElement', element: args.element, view_ids: args.view_ids }], !args.dryRun), context));
  }

  if (name === 'updateArchitectureElement') {
    const context = await loadContext(args);
    return toolResult(attachContextWarnings(await buildMutationResult(context, [{ type: 'updateElement', id: args.id, patch: args.patch }], !args.dryRun), context));
  }

  if (name === 'removeArchitectureElement') {
    const context = await loadContext(args);
    return toolResult(attachContextWarnings(await buildMutationResult(context, [{ type: 'removeElement', id: args.id, view_ids: args.view_ids }], !args.dryRun), context));
  }

  if (name === 'addArchitectureRelationship') {
    const context = await loadContext(args);
    return toolResult(attachContextWarnings(await buildMutationResult(context, [{ type: 'addRelationship', relationship: args.relationship, view_ids: args.view_ids }], !args.dryRun), context));
  }

  if (name === 'updateArchitectureRelationship') {
    const context = await loadContext(args);
    return toolResult(attachContextWarnings(await buildMutationResult(context, [{ type: 'updateRelationship', id: args.id, patch: args.patch }], !args.dryRun), context));
  }

  if (name === 'removeArchitectureRelationship') {
    const context = await loadContext(args);
    return toolResult(attachContextWarnings(await buildMutationResult(context, [{ type: 'removeRelationship', id: args.id, view_ids: args.view_ids }], !args.dryRun), context));
  }

  if (name === 'addArchitectureView') {
    const context = await loadContext(args);
    return toolResult(attachContextWarnings(await buildMutationResult(context, [{ type: 'addView', view: args.view }], !args.dryRun), context));
  }

  if (name === 'updateArchitectureView') {
    const context = await loadContext(args);
    return toolResult(attachContextWarnings(await buildMutationResult(context, [{ type: 'updateView', view_id: args.view_id, patch: args.patch }], !args.dryRun), context));
  }

  if (name === 'removeArchitectureView') {
    const context = await loadContext(args);
    return toolResult(attachContextWarnings(await buildMutationResult(context, [{ type: 'removeView', view_id: args.view_id }], !args.dryRun), context));
  }

  throw new Error(`Unknown tool: ${name}`);
}

function attachContextWarnings(payload, context) {
  const recovery = context && context.neo4jSyncRecovery;
  if (!recovery || !recovery.attempted) {
    return payload;
  }

  payload.neo4jRecovery = recovery;
  if (recovery.status === 'failed') {
    payload.warnings = addUnique(payload.warnings || [], [
      `Neo4j automatic resync failed before servicing ${context.graphPath.relativePath}: ${recovery.error}`,
      'The canonical JSON graph is still being served and written. Neo4j will be retried again on the next canonical read or write, or you can run node .argo/scripts/syncSystemArchitectureToNeo4j.js manually.',
    ]);
  }
  return payload;
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
  TOOLS,
  applyMutations,
  callTool,
  loadContext,
  main,
  validateDocument,
};

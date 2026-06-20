const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

const DEFAULT_GRAPH_PATH = 'design/KG/SystemArchitecture.json';
const SCHEMA_PATH_CANDIDATES = [
  'schema/SystemArchitecture.schema.json',
];

const {
  elementTypeMetadata,
  relationshipCategoryByType,
  auditRelationshipEndpointTypes,
} = require('./archimate32-rules');

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
    description: 'Read the current SystemArchitecture graph without modifying it.',
    inputSchema: {
      type: 'object',
      properties: {
        architecturePath: { type: 'string', description: `Default: ${DEFAULT_GRAPH_PATH}` },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'validateSystemArchitecture',
    description: 'Validate the current SystemArchitecture graph through schema, graph, and ArchiMate metadata rules.',
    inputSchema: {
      type: 'object',
      properties: {
        architecturePath: { type: 'string', description: `Default: ${DEFAULT_GRAPH_PATH}` },
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
        architecturePath: { type: 'string', description: `Default: ${DEFAULT_GRAPH_PATH}` },
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
        architecturePath: { type: 'string', description: `Default: ${DEFAULT_GRAPH_PATH}` },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'removeArchitectureElement',
    description: 'Remove one element from selected views, or from all views and the graph when no view_ids are provided.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string' },
        view_ids: { type: 'array', minItems: 1, items: { type: 'string' } },
        architecturePath: { type: 'string', description: `Default: ${DEFAULT_GRAPH_PATH}` },
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
        architecturePath: { type: 'string', description: `Default: ${DEFAULT_GRAPH_PATH}` },
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
        architecturePath: { type: 'string', description: `Default: ${DEFAULT_GRAPH_PATH}` },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'removeArchitectureRelationship',
    description: 'Remove one relationship from selected views, or from all views and the graph when no view_ids are provided.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string' },
        view_ids: { type: 'array', minItems: 1, items: { type: 'string' } },
        architecturePath: { type: 'string', description: `Default: ${DEFAULT_GRAPH_PATH}` },
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
        architecturePath: { type: 'string', description: `Default: ${DEFAULT_GRAPH_PATH}` },
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
        architecturePath: { type: 'string', description: `Default: ${DEFAULT_GRAPH_PATH}` },
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
        architecturePath: { type: 'string', description: `Default: ${DEFAULT_GRAPH_PATH}` },
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
    || path.resolve(__dirname, '..');
}

function resolveWorkspacePath(workspaceRoot, relativePath) {
  const normalizedPath = normalizeRelativePath(relativePath || DEFAULT_GRAPH_PATH);
  const absolutePath = path.resolve(workspaceRoot, normalizedPath);
  if (!absolutePath.startsWith(workspaceRoot)) {
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

function loadContext(args = {}) {
  const workspaceRoot = resolveWorkspaceRoot();
  const graphPath = resolveWorkspacePath(workspaceRoot, args.architecturePath || DEFAULT_GRAPH_PATH);
  const schemaPath = resolveSchemaPath(workspaceRoot);
  return {
    workspaceRoot,
    graphPath,
    schemaPath,
    document: readJson(graphPath.absolutePath, graphPath.relativePath),
    schema: readJson(schemaPath.absolutePath, schemaPath.relativePath),
  };
}

function validateDocument(document, schema, options = {}) {
  const errors = [];
  validateAgainstSchema(document, schema, '#', errors, schema);
  validateGraphSemantics(document, errors);
  validateTouchedArchiMateGrammar(document, options.touchedRelationshipIds || [], errors);
  return errors;
}

function applyMutations(document, mutations) {
  const nextDocument = clone(document);
  const touchedElementIds = new Set();
  const touchedRelationshipIds = new Set();
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
      }
      const stillIncludedInView = nextDocument.views.some(view => (
        Array.isArray(view.included_elements) && view.included_elements.includes(mutation.id)
      ));
      if (!stillIncludedInView) {
        for (const view of nextDocument.views) {
          view.included_relationships = removeEntries(view.included_relationships || [], relatedRelationshipIds);
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

function requireElementInViews(elementId, views) {
  for (const view of views) {
    if (!Array.isArray(view.included_elements) || !view.included_elements.includes(elementId)) {
      throw new Error(`Element '${elementId}' is not included in view '${view.view_id}'`);
    }
  }
}

function requireRelationshipInViews(relationshipId, views) {
  for (const view of views) {
    if (!Array.isArray(view.included_relationships) || !view.included_relationships.includes(relationshipId)) {
      throw new Error(`Relationship '${relationshipId}' is not included in view '${view.view_id}'`);
    }
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

function buildMutationResult(context, mutations, write) {
  const beforeSummary = summarizeDocument(context.document);
  let mutationResult;
  try {
    mutationResult = applyMutations(context.document, mutations);
  } catch (error) {
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
      errors: [String(error && error.message ? error.message : error)],
    };
  }
  const errors = validateDocument(mutationResult.document, context.schema, {
    touchedRelationshipIds: mutationResult.touchedRelationshipIds,
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
    before: beforeSummary,
    after: afterSummary,
    errors,
  };

  if (errors.length > 0 || !write) {
    return result;
  }

  writeGraph(context.graphPath.absolutePath, mutationResult.document);
  result.written = true;
  return result;
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

function validateGraphSemantics(document, errors) {
  if (!document || typeof document !== 'object') {
    return;
  }

  const elements = Array.isArray(document.elements) ? document.elements : [];
  const relationships = Array.isArray(document.relationships) ? document.relationships : [];
  const views = Array.isArray(document.views) ? document.views : [];
  const elementById = new Map();
  const relationshipById = new Map();

  for (const element of elements) {
    if (!element || typeof element !== 'object') {
      continue;
    }
    if (elementById.has(element.id)) {
      errors.push(`elements contains duplicate id '${element.id}'`);
      continue;
    }
    elementById.set(element.id, element);
    if (!elementTypeMetadata.has(element.type)) {
      errors.push(`elements '${element.id}' uses unsupported ArchiMate element type '${element.type}'`);
    }
  }

  for (const element of elements) {
    if (!element || typeof element !== 'object' || !element.parent) {
      continue;
    }
    if (!elementById.has(element.parent)) {
      errors.push(`elements '${element.id}' references missing parent '${element.parent}'`);
    }
  }

  for (const relationship of relationships) {
    if (!relationship || typeof relationship !== 'object') {
      continue;
    }
    if (relationshipById.has(relationship.id)) {
      errors.push(`relationships contains duplicate id '${relationship.id}'`);
      continue;
    }
    relationshipById.set(relationship.id, relationship);
    if (!relationshipCategoryByType.has(relationship.name)) {
      errors.push(`relationships '${relationship.id}' uses unsupported ArchiMate relationship type '${relationship.name}'`);
    }

    const source = elementById.get(relationship.source_id);
    if (!source) {
      errors.push(`relationships '${relationship.id}' references missing source_id '${relationship.source_id}'`);
    } else if (relationship.source_name !== source.name) {
      errors.push(`relationships '${relationship.id}' source_name '${relationship.source_name}' does not match element '${relationship.source_id}' name '${source.name}'`);
    }

    const target = elementById.get(relationship.target_id);
    if (!target) {
      errors.push(`relationships '${relationship.id}' references missing target_id '${relationship.target_id}'`);
    } else if (relationship.target_name !== target.name) {
      errors.push(`relationships '${relationship.id}' target_name '${relationship.target_name}' does not match element '${relationship.target_id}' name '${target.name}'`);
    }

    const expectedStatement = source && target
      ? `${source.name} --(${relationship.name})--> ${target.name}`
      : undefined;
    if (expectedStatement && relationship.statement !== expectedStatement) {
      errors.push(`relationships '${relationship.id}' statement must be '${expectedStatement}'`);
    }
  }

  const topLevelViews = views.filter(view => view && typeof view === 'object' && !view.parent_element_id);
  if (topLevelViews.length !== 1) {
    errors.push(`views must contain exactly one top-level view named 'SystemArchitecture'; found ${topLevelViews.length}`);
  } else if (topLevelViews[0].view_name !== 'SystemArchitecture') {
    errors.push(`top-level view '${topLevelViews[0].view_id}' view_name must be 'SystemArchitecture'`);
  }

  const elementIdsIncludedInViews = new Set();
  const relationshipIdsIncludedInViews = new Set();
  for (const view of views) {
    if (!view || typeof view !== 'object') {
      continue;
    }
    if (!view.parent_element_id && view.view_name !== 'SystemArchitecture') {
      errors.push(`views '${view.view_id}' must declare parent_element_id unless it is the top-level SystemArchitecture view`);
    }
    if (view.parent_element_id) {
      const parent = elementById.get(view.parent_element_id);
      if (!parent) {
        errors.push(`views '${view.view_id}' references missing parent_element_id '${view.parent_element_id}'`);
      } else if (view.parent_element_name && view.parent_element_name !== parent.name) {
        errors.push(`views '${view.view_id}' parent_element_name '${view.parent_element_name}' does not match element '${view.parent_element_id}' name '${parent.name}'`);
      }
    }
    for (const elementId of view.included_elements || []) {
      elementIdsIncludedInViews.add(elementId);
      if (!elementById.has(elementId)) {
        errors.push(`views '${view.view_id}' references missing included element '${elementId}'`);
      }
    }
    for (const relationshipId of view.included_relationships || []) {
      relationshipIdsIncludedInViews.add(relationshipId);
      if (!relationshipById.has(relationshipId)) {
        errors.push(`views '${view.view_id}' references missing included relationship '${relationshipId}'`);
      }
    }
  }

  for (const element of elements) {
    if (element && typeof element === 'object' && !elementIdsIncludedInViews.has(element.id)) {
      errors.push(`elements '${element.id}' must be included in at least one view`);
    }
  }

  for (const relationship of relationships) {
    if (relationship && typeof relationship === 'object' && !relationshipIdsIncludedInViews.has(relationship.id)) {
      errors.push(`relationships '${relationship.id}' must be included in at least one view`);
    }
  }
}

function validateTouchedArchiMateGrammar(document, touchedRelationshipIds, errors) {
  if (!Array.isArray(touchedRelationshipIds) || touchedRelationshipIds.length === 0) {
    return;
  }

  errors.push(...auditRelationshipEndpointTypes(document, touchedRelationshipIds));
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

async function callTool(name, args = {}) {
  if (name === 'getSystemArchitecture') {
    const context = loadContext(args);
    return toolResult({
      status: 'passed',
      graphPath: context.graphPath.relativePath,
      document: context.document,
    });
  }

  if (name === 'validateSystemArchitecture') {
    const context = loadContext(args);
    const errors = validateDocument(context.document, context.schema);
    return toolResult({
      status: errors.length === 0 ? 'passed' : 'failed',
      graphPath: context.graphPath.relativePath,
      schemaPath: context.schemaPath.relativePath,
      errors,
    });
  }

  if (name === 'previewSystemArchitectureMutation') {
    const context = loadContext(args);
    return toolResult(buildMutationResult(context, args.mutations, false));
  }

  if (name === 'applySystemArchitectureMutation') {
    const context = loadContext(args);
    return toolResult(buildMutationResult(context, args.mutations, true));
  }

  if (name === 'addArchitectureElement') {
    const context = loadContext(args);
    return toolResult(buildMutationResult(context, [{ type: 'addElement', element: args.element, view_ids: args.view_ids }], true));
  }

  if (name === 'updateArchitectureElement') {
    const context = loadContext(args);
    return toolResult(buildMutationResult(context, [{ type: 'updateElement', id: args.id, patch: args.patch }], true));
  }

  if (name === 'removeArchitectureElement') {
    const context = loadContext(args);
    return toolResult(buildMutationResult(context, [{ type: 'removeElement', id: args.id, view_ids: args.view_ids }], true));
  }

  if (name === 'addArchitectureRelationship') {
    const context = loadContext(args);
    return toolResult(buildMutationResult(context, [{ type: 'addRelationship', relationship: args.relationship, view_ids: args.view_ids }], true));
  }

  if (name === 'updateArchitectureRelationship') {
    const context = loadContext(args);
    return toolResult(buildMutationResult(context, [{ type: 'updateRelationship', id: args.id, patch: args.patch }], true));
  }

  if (name === 'removeArchitectureRelationship') {
    const context = loadContext(args);
    return toolResult(buildMutationResult(context, [{ type: 'removeRelationship', id: args.id, view_ids: args.view_ids }], true));
  }

  if (name === 'addArchitectureView') {
    const context = loadContext(args);
    return toolResult(buildMutationResult(context, [{ type: 'addView', view: args.view }], true));
  }

  if (name === 'updateArchitectureView') {
    const context = loadContext(args);
    return toolResult(buildMutationResult(context, [{ type: 'updateView', view_id: args.view_id, patch: args.patch }], true));
  }

  if (name === 'removeArchitectureView') {
    const context = loadContext(args);
    return toolResult(buildMutationResult(context, [{ type: 'removeView', view_id: args.view_id }], true));
  }

  throw new Error(`Unknown tool: ${name}`);
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
  applyMutations,
  callTool,
  loadContext,
  main,
  validateDocument,
};

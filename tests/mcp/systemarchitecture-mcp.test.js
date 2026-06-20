const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const sourceGraphPath = path.join(repoRoot, 'design', 'KG', 'SystemArchitecture.json');
const mcpConfigPaths = [
  '.cursor/mcp.json',
  '.github/mcp.json',
  '.opencode/mcp.json',
];
const { callTool } = require('../../scripts/argo-mcp-server.js');
const archimateRules = require('../../scripts/archimate32-rules.js');

async function main() {
  process.env.ARGO_REPO_ROOT = repoRoot;

  validatesUnifiedMcpConfiguration();
  validatesNoDuplicateMcpExecutionAssets();
  validatesArchimate32RuleCoverage();
  validatesRelationshipSchemaRequiresTypeAndSeparatesName();
  await validatesFocusedViewToolsAreListed();
  await validatesAgentFacingToolGuidance();
  await validatesCurrentGraph();

  const tempRoot = fs.mkdtempSync(path.join(ensureTempDirectory(), 'case-'));
  const tempGraphPath = path.join(tempRoot, 'SystemArchitecture.json');
  fs.copyFileSync(sourceGraphPath, tempGraphPath);

  await rejectsInvalidRelationshipWithoutWriting(tempGraphPath);
  await rejectsRelationshipWithInvalidArchiMate32EndpointTypes(tempGraphPath);
  await rejectsRelationshipOutsideArchiMate32Matrix(tempGraphPath);
  await rejectsElementMutationWithoutViewScope(tempGraphPath);
  await rejectsRelationshipMutationWithoutViewScope(tempGraphPath);
  await rejectsElementAndRelationshipIdentityTypeUpdates(tempGraphPath);
  await previewsGlobalUpdateMutationsWithoutViewScope(tempGraphPath);
  await removesRelationshipFromSpecifiedViewOnlyWhenOtherViewsStillReferenceIt(tempGraphPath);
  await removesRelationshipFromGraphWhenSpecifiedViewWasLastMembership(tempGraphPath);
  await removesRelationshipFromAllViewsAndGraphWithoutViewScope(tempGraphPath);
  await removesElementThroughFocusedTool(tempGraphPath);
  await removesRelationshipThroughFocusedTool(tempGraphPath);
  await previewsValidElementMutation(tempGraphPath);
  await appliesExistingElementToAdditionalView(tempGraphPath);
  await removesElementFromSpecifiedViewOnlyWhenOtherViewsStillReferenceIt(tempGraphPath);
  await removesElementFromGraphWhenSpecifiedViewWasLastMembership(tempGraphPath);
  await removesElementFromAllViewsAndGraphWithoutViewScope(tempGraphPath);
  await appliesExistingRelationshipToAdditionalView(tempGraphPath);
  await previewsViewLifecycleMutations(tempGraphPath);
  await rejectsSubviewWithoutParentElement(tempGraphPath);
}

function validatesUnifiedMcpConfiguration() {
  for (const configPath of mcpConfigPaths) {
    const config = JSON.parse(fs.readFileSync(path.join(repoRoot, configPath), 'utf8'));
    assert.deepStrictEqual(Object.keys(config.mcpServers), ['argo'], configPath);
    assert.deepStrictEqual(config.mcpServers.argo.args, ['${workspaceFolder}/scripts/argo-mcp-server.js'], configPath);
  }
}

async function validatesFocusedViewToolsAreListed() {
  const tools = await callMcpStdio([
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'smoke', version: '1' } } },
    { jsonrpc: '2.0', method: 'notifications/initialized', params: {} },
    { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
  ]);
  const listResponse = tools.find(response => response.id === 2);
  const toolNames = listResponse.result.tools.map(tool => tool.name);
  assert(toolNames.includes('addArchitectureView'));
  assert(toolNames.includes('updateArchitectureView'));
  assert(toolNames.includes('removeArchitectureView'));
  assert(toolNames.includes('removeArchitectureElement'));
  assert(toolNames.includes('removeArchitectureRelationship'));
  assert(!toolNames.includes('addViewMembership'));
  assert(!toolNames.includes('removeViewMembership'));
}

async function validatesAgentFacingToolGuidance() {
  const tools = await callMcpStdio([
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'smoke', version: '1' } } },
    { jsonrpc: '2.0', method: 'notifications/initialized', params: {} },
    { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
  ]);
  const listResponse = tools.find(response => response.id === 2);
  const toolByName = new Map(listResponse.result.tools.map(tool => [tool.name, tool]));

  assertDescriptionIncludes(toolByName, 'getSystemArchitecture', ['Start here', 'read-only']);
  assertDescriptionIncludes(toolByName, 'previewSystemArchitectureMutation', ['Use before apply', 'dry-run', 'does not write']);
  assertDescriptionIncludes(toolByName, 'applySystemArchitectureMutation', ['Use for multi-step', 'atomic']);
  assertDescriptionIncludes(toolByName, 'addArchitectureElement', ['Use for one element', 'view_ids']);
  assertDescriptionIncludes(toolByName, 'addArchitectureRelationship', ['relationship.type', 'ArchiMate 3.2']);
  assertDescriptionIncludes(toolByName, 'removeArchitectureElement', ['cascades related relationships', 'view_ids']);
  assertDescriptionIncludes(toolByName, 'removeArchitectureRelationship', ['view_ids', 'all views']);
  assertDescriptionIncludes(toolByName, 'addArchitectureView', ['one top-level view', 'sub-views']);
}

function assertDescriptionIncludes(toolByName, toolName, expectedFragments) {
  const tool = toolByName.get(toolName);
  assert(tool, `Expected ${toolName} to be listed`);
  for (const expectedFragment of expectedFragments) {
    assert(
      tool.description.includes(expectedFragment),
      `Expected ${toolName} description to include '${expectedFragment}', got: ${tool.description}`,
    );
  }
}

function validatesNoDuplicateMcpExecutionAssets() {
  const removedPaths = [
    '.cursor/argoschema',
    '.github/argoschema',
    '.opencode/argoschema',
    '.cursor/validator/script',
    '.github/validator/script',
    '.opencode/validator/script',
    '.opencode/tools/argo.ts',
    '.opencode/tools/validator.ts',
  ];

  for (const removedPath of removedPaths) {
    assert.strictEqual(fs.existsSync(path.join(repoRoot, removedPath)), false, removedPath);
  }
}

function validatesArchimate32RuleCoverage() {
  const matrixCombinationCount = Object.values(archimateRules.RELATIONSHIP_TARGET_MATRIX)
    .flatMap(sourceMap => Object.values(sourceMap))
    .reduce((total, targets) => total + targets.length, 0);

  assert.strictEqual(matrixCombinationCount, 10484);
  assert.strictEqual(archimateRules.isSupportedElementType('Junction'), false);
  assert.strictEqual(archimateRules.isSupportedElementType('And Junction'), true);
  assert.strictEqual(archimateRules.isSupportedElementType('Or Junction'), true);
  assert.strictEqual(
    archimateRules.RELATIONSHIP_TARGET_MATRIX.Composition.ApplicationComponent.includes('DataObject'),
    false,
  );
  assert.strictEqual(
    archimateRules.RELATIONSHIP_TARGET_MATRIX.Assignment.ApplicationComponent.includes('ApplicationFunction'),
    true,
  );
}

function validatesRelationshipSchemaRequiresTypeAndSeparatesName() {
  const schema = JSON.parse(fs.readFileSync(path.join(repoRoot, 'schema', 'SystemArchitecture.schema.json'), 'utf8'));
  const relationshipSchema = schema.$defs.relationship;

  assert(relationshipSchema.required.includes('name'));
  assert(relationshipSchema.required.includes('type'));
  assert.deepStrictEqual(relationshipSchema.properties.name, { $ref: '#/$defs/nonEmptyString' });
  assert.deepStrictEqual(relationshipSchema.properties.type, { $ref: '#/$defs/archimateRelationshipType' });
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
        view_ids: ['237'],
        relationship: {
          id: 'mcp-invalid-triggering',
          statement: 'SystemArchitecture --(Triggering)--> Orchestrator',
          name: 'Invalid SystemArchitecture to Orchestrator trigger',
          type: 'Triggering',
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
    payload.errors.some(error => error.includes('violates ArchiMate 3.2 relationship matrix')),
    `Expected ArchiMate grammar error, got: ${JSON.stringify(payload.errors)}`,
  );
  assert.strictEqual(fs.readFileSync(tempGraphPath, 'utf8'), before);
}

async function rejectsRelationshipWithInvalidArchiMate32EndpointTypes(tempGraphPath) {
  const response = await callTool('previewSystemArchitectureMutation', {
    architecturePath: path.relative(repoRoot, tempGraphPath),
    mutations: [
      {
        type: 'addRelationship',
        view_ids: ['237'],
        relationship: {
          id: 'mcp-invalid-serving-source',
          statement: 'SystemArchitecture --(Serving)--> Orchestrator',
          name: 'Invalid SystemArchitecture serving Orchestrator',
          type: 'Serving',
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
  assert(
    payload.errors.some(error => error.includes('violates ArchiMate 3.2 relationship matrix')),
    `Expected ArchiMate 3.2 endpoint type error, got: ${JSON.stringify(payload.errors)}`,
  );
}

async function rejectsRelationshipOutsideArchiMate32Matrix(tempGraphPath) {
  const response = await callTool('previewSystemArchitectureMutation', {
    architecturePath: path.relative(repoRoot, tempGraphPath),
    mutations: [
      {
        type: 'addRelationship',
        view_ids: ['237'],
        relationship: {
          id: 'mcp-invalid-composition-matrix',
          statement: 'Orchestrator --(Composition)--> SystemArchitecture',
          name: 'Invalid Orchestrator composition',
          type: 'Composition',
          source_id: '1798',
          target_id: '1803',
          source_name: 'Orchestrator',
          target_name: 'SystemArchitecture',
        },
      },
    ],
  });

  const payload = parseToolPayload(response);
  assert.strictEqual(payload.status, 'failed');
  assert(
    payload.errors.some(error => error.includes('violates ArchiMate 3.2 relationship matrix')),
    `Expected ArchiMate 3.2 matrix error, got: ${JSON.stringify(payload.errors)}`,
  );
}

async function previewsValidElementMutation(tempGraphPath) {
  const response = await callTool('previewSystemArchitectureMutation', {
    architecturePath: path.relative(repoRoot, tempGraphPath),
    mutations: [
      {
        type: 'addElement',
        view_ids: ['237'],
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

async function appliesExistingElementToAdditionalView(tempGraphPath) {
  const response = await callTool('applySystemArchitectureMutation', {
    architecturePath: path.relative(repoRoot, tempGraphPath),
    mutations: [
      {
        type: 'addElement',
        view_ids: ['237'],
        element: {
          id: '1798',
        },
      },
    ],
  });

  const payload = parseToolPayload(response);
  assert.deepStrictEqual(payload.errors, []);
  assert.strictEqual(payload.status, 'passed');
  assert.strictEqual(payload.written, true);
  assert.strictEqual(payload.after.elementCount, payload.before.elementCount);

  const writtenGraph = JSON.parse(fs.readFileSync(tempGraphPath, 'utf8'));
  const topLevelView = writtenGraph.views.find(view => view.view_id === '237');
  assert(topLevelView.included_elements.includes('1798'));
}

async function appliesExistingRelationshipToAdditionalView(tempGraphPath) {
  const response = await callTool('applySystemArchitectureMutation', {
    architecturePath: path.relative(repoRoot, tempGraphPath),
    mutations: [
      {
        type: 'addRelationship',
        view_ids: ['237'],
        relationship: {
          id: '1726',
        },
      },
    ],
  });

  const payload = parseToolPayload(response);
  assert.deepStrictEqual(payload.errors, []);
  assert.strictEqual(payload.status, 'passed');
  assert.strictEqual(payload.written, true);
  assert.strictEqual(payload.after.relationshipCount, payload.before.relationshipCount);

  const writtenGraph = JSON.parse(fs.readFileSync(tempGraphPath, 'utf8'));
  const topLevelView = writtenGraph.views.find(view => view.view_id === '237');
  assert(topLevelView.included_relationships.includes('1726'));
}

async function rejectsElementMutationWithoutViewScope(tempGraphPath) {
  const response = await callTool('previewSystemArchitectureMutation', {
    architecturePath: path.relative(repoRoot, tempGraphPath),
    mutations: [
      {
        type: 'addElement',
        element: {
          id: 'mcp-orphan-element',
          name: 'MCP orphan element',
          type: 'Outcome',
          description: 'This element is intentionally omitted from all views.',
        },
      },
    ],
  });

  const payload = parseToolPayload(response);
  assert.strictEqual(payload.status, 'failed');
  assert(
    payload.errors.some(error => error.includes('mutation.view_ids must contain at least one view id')),
    `Expected missing element view_ids error, got: ${JSON.stringify(payload.errors)}`,
  );
}

async function rejectsRelationshipMutationWithoutViewScope(tempGraphPath) {
  const response = await callTool('previewSystemArchitectureMutation', {
    architecturePath: path.relative(repoRoot, tempGraphPath),
    mutations: [
      {
        type: 'addRelationship',
        relationship: {
          id: 'mcp-orphan-relationship',
          statement: 'Orchestrator --(Assignment)--> argo_test',
          name: 'Orchestrator assignment to argo_test',
          type: 'Assignment',
          source_id: '1798',
          target_id: '1805',
          source_name: 'Orchestrator',
          target_name: 'argo_test',
        },
      },
    ],
  });

  const payload = parseToolPayload(response);
  assert.strictEqual(payload.status, 'failed');
  assert(
    payload.errors.some(error => error.includes('mutation.view_ids must contain at least one view id')),
    `Expected missing relationship view_ids error, got: ${JSON.stringify(payload.errors)}`,
  );
}

async function previewsGlobalUpdateMutationsWithoutViewScope(tempGraphPath) {
  const response = await callTool('previewSystemArchitectureMutation', {
    architecturePath: path.relative(repoRoot, tempGraphPath),
    mutations: [
      {
        type: 'updateElement',
        id: '1798',
        patch: {
          description: 'Updated globally without a view scope.',
        },
      },
      {
        type: 'updateRelationship',
        id: '1726',
        patch: {
          source_name: 'IntentionDesign',
        },
      },
    ],
  });

  const payload = parseToolPayload(response);
  assert.deepStrictEqual(payload.errors, []);
  assert.strictEqual(payload.status, 'passed');
  assert.strictEqual(payload.written, false);
  assert.deepStrictEqual(payload.mutations.map(mutation => mutation.type), ['updateElement', 'updateRelationship']);
}

async function rejectsElementAndRelationshipIdentityTypeUpdates(tempGraphPath) {
  const cases = [
    {
      mutation: { type: 'updateElement', id: '1798', patch: { id: 'mcp-renamed-element' } },
      expected: "Element '1798' id cannot be updated",
    },
    {
      mutation: { type: 'updateElement', id: '1798', patch: { type: 'Application Service' } },
      expected: "Element '1798' type cannot be updated",
    },
    {
      mutation: { type: 'updateRelationship', id: '1726', patch: { id: 'mcp-renamed-relationship' } },
      expected: "Relationship '1726' id cannot be updated",
    },
    {
      mutation: { type: 'updateRelationship', id: '1726', patch: { type: 'Association' } },
      expected: "Relationship '1726' type cannot be updated",
    },
  ];

  for (const testCase of cases) {
    const before = fs.readFileSync(tempGraphPath, 'utf8');
    const response = await callTool('previewSystemArchitectureMutation', {
      architecturePath: path.relative(repoRoot, tempGraphPath),
      mutations: [testCase.mutation],
    });

    const payload = parseToolPayload(response);
    assert.strictEqual(payload.status, 'failed');
    assert(
      payload.errors.some(error => error.includes(testCase.expected)),
      `Expected immutable identity/type error, got: ${JSON.stringify(payload.errors)}`,
    );
    assert.strictEqual(fs.readFileSync(tempGraphPath, 'utf8'), before);
  }
}

async function removesRelationshipFromSpecifiedViewOnlyWhenOtherViewsStillReferenceIt(tempGraphPath) {
  const response = await callTool('applySystemArchitectureMutation', {
    architecturePath: path.relative(repoRoot, tempGraphPath),
    mutations: [
      {
        type: 'addRelationship',
        view_ids: ['237', '238'],
        relationship: {
          id: 'mcp-scoped-remove-relationship',
          statement: 'Orchestrator --(Association)--> IntentionDesign',
          name: 'Scoped remove relationship',
          type: 'Association',
          source_id: '1798',
          target_id: '1799',
          source_name: 'Orchestrator',
          target_name: 'IntentionDesign',
        },
      },
      {
        type: 'removeRelationship',
        id: 'mcp-scoped-remove-relationship',
        view_ids: ['237'],
      },
    ],
  });

  const payload = parseToolPayload(response);
  assert.deepStrictEqual(payload.errors, []);
  assert.strictEqual(payload.status, 'passed');
  assert.strictEqual(payload.written, true);
  assert.strictEqual(payload.after.relationshipCount, payload.before.relationshipCount + 1);

  const writtenGraph = JSON.parse(fs.readFileSync(tempGraphPath, 'utf8'));
  assert(writtenGraph.relationships.some(relationship => relationship.id === 'mcp-scoped-remove-relationship'));
  const topLevelView = writtenGraph.views.find(view => view.view_id === '237');
  const developmentView = writtenGraph.views.find(view => view.view_id === '238');
  assert(!topLevelView.included_relationships.includes('mcp-scoped-remove-relationship'));
  assert(developmentView.included_relationships.includes('mcp-scoped-remove-relationship'));
}

async function removesRelationshipFromGraphWhenSpecifiedViewWasLastMembership(tempGraphPath) {
  const response = await callTool('applySystemArchitectureMutation', {
    architecturePath: path.relative(repoRoot, tempGraphPath),
    mutations: [
      {
        type: 'addRelationship',
        view_ids: ['237'],
        relationship: {
          id: 'mcp-last-view-relationship',
          statement: 'Orchestrator --(Association)--> ImplementationDesign',
          name: 'Last view relationship',
          type: 'Association',
          source_id: '1798',
          target_id: '1800',
          source_name: 'Orchestrator',
          target_name: 'ImplementationDesign',
        },
      },
      {
        type: 'removeRelationship',
        id: 'mcp-last-view-relationship',
        view_ids: ['237'],
      },
    ],
  });

  const payload = parseToolPayload(response);
  assert.deepStrictEqual(payload.errors, []);
  assert.strictEqual(payload.status, 'passed');
  assert.strictEqual(payload.written, true);
  assert.strictEqual(payload.after.relationshipCount, payload.before.relationshipCount);

  const writtenGraph = JSON.parse(fs.readFileSync(tempGraphPath, 'utf8'));
  assert(!writtenGraph.relationships.some(relationship => relationship.id === 'mcp-last-view-relationship'));
  assert(writtenGraph.views.every(view => !(view.included_relationships || []).includes('mcp-last-view-relationship')));
}

async function removesRelationshipFromAllViewsAndGraphWithoutViewScope(tempGraphPath) {
  const response = await callTool('applySystemArchitectureMutation', {
    architecturePath: path.relative(repoRoot, tempGraphPath),
    mutations: [
      {
        type: 'addRelationship',
        view_ids: ['237', '238'],
        relationship: {
          id: 'mcp-global-remove-relationship',
          statement: 'Orchestrator --(Association)--> CodingAndReparing',
          name: 'Global remove relationship',
          type: 'Association',
          source_id: '1798',
          target_id: '1801',
          source_name: 'Orchestrator',
          target_name: 'CodingAndReparing',
        },
      },
      {
        type: 'removeRelationship',
        id: 'mcp-global-remove-relationship',
      },
    ],
  });

  const payload = parseToolPayload(response);
  assert.deepStrictEqual(payload.errors, []);
  assert.strictEqual(payload.status, 'passed');
  assert.strictEqual(payload.written, true);
  assert.strictEqual(payload.after.relationshipCount, payload.before.relationshipCount);

  const writtenGraph = JSON.parse(fs.readFileSync(tempGraphPath, 'utf8'));
  assert(!writtenGraph.relationships.some(relationship => relationship.id === 'mcp-global-remove-relationship'));
  assert(writtenGraph.views.every(view => !(view.included_relationships || []).includes('mcp-global-remove-relationship')));
}

async function removesElementThroughFocusedTool(tempGraphPath) {
  await callTool('applySystemArchitectureMutation', {
    architecturePath: path.relative(repoRoot, tempGraphPath),
    mutations: [
      {
        type: 'addElement',
        view_ids: ['237'],
        element: {
          id: 'mcp-focused-remove-element',
          name: 'Focused remove element',
          type: 'Outcome',
          description: 'Used to validate the focused removeArchitectureElement tool.',
        },
      },
    ],
  });

  const response = await callTool('removeArchitectureElement', {
    architecturePath: path.relative(repoRoot, tempGraphPath),
    id: 'mcp-focused-remove-element',
  });

  const payload = parseToolPayload(response);
  assert.deepStrictEqual(payload.errors, []);
  assert.strictEqual(payload.status, 'passed');
  assert.strictEqual(payload.written, true);

  const writtenGraph = JSON.parse(fs.readFileSync(tempGraphPath, 'utf8'));
  assert(!writtenGraph.elements.some(element => element.id === 'mcp-focused-remove-element'));
  assert(writtenGraph.views.every(view => !(view.included_elements || []).includes('mcp-focused-remove-element')));
}

async function removesRelationshipThroughFocusedTool(tempGraphPath) {
  await callTool('applySystemArchitectureMutation', {
    architecturePath: path.relative(repoRoot, tempGraphPath),
    mutations: [
      {
        type: 'addRelationship',
        view_ids: ['237'],
        relationship: {
          id: 'mcp-focused-remove-relationship',
          statement: 'Orchestrator --(Association)--> IntentionDesign',
          name: 'Focused remove relationship',
          type: 'Association',
          source_id: '1798',
          target_id: '1799',
          source_name: 'Orchestrator',
          target_name: 'IntentionDesign',
        },
      },
    ],
  });

  const response = await callTool('removeArchitectureRelationship', {
    architecturePath: path.relative(repoRoot, tempGraphPath),
    id: 'mcp-focused-remove-relationship',
  });

  const payload = parseToolPayload(response);
  assert.deepStrictEqual(payload.errors, []);
  assert.strictEqual(payload.status, 'passed');
  assert.strictEqual(payload.written, true);

  const writtenGraph = JSON.parse(fs.readFileSync(tempGraphPath, 'utf8'));
  assert(!writtenGraph.relationships.some(relationship => relationship.id === 'mcp-focused-remove-relationship'));
  assert(writtenGraph.views.every(view => !(view.included_relationships || []).includes('mcp-focused-remove-relationship')));
}

async function removesElementFromSpecifiedViewOnlyWhenOtherViewsStillReferenceIt(tempGraphPath) {
  const response = await callTool('applySystemArchitectureMutation', {
    architecturePath: path.relative(repoRoot, tempGraphPath),
    mutations: [
      {
        type: 'addElement',
        view_ids: ['237', '238'],
        element: {
          id: 'mcp-scoped-remove-source',
          name: 'Scoped remove source',
          type: 'Outcome',
          description: 'Used to validate scoped element removal with related relationships.',
        },
      },
      {
        type: 'addElement',
        view_ids: ['237', '238'],
        element: {
          id: 'mcp-scoped-remove-target',
          name: 'Scoped remove target',
          type: 'Outcome',
          description: 'Used to validate scoped element removal with related relationships.',
        },
      },
      {
        type: 'addRelationship',
        view_ids: ['237', '238'],
        relationship: {
          id: 'mcp-scoped-remove-relation',
          statement: 'Scoped remove source --(Association)--> Scoped remove target',
          name: 'Scoped remove relation',
          type: 'Association',
          source_id: 'mcp-scoped-remove-source',
          target_id: 'mcp-scoped-remove-target',
          source_name: 'Scoped remove source',
          target_name: 'Scoped remove target',
        },
      },
      {
        type: 'removeElement',
        id: 'mcp-scoped-remove-source',
        view_ids: ['237'],
      },
    ],
  });

  const payload = parseToolPayload(response);
  assert.deepStrictEqual(payload.errors, []);
  assert.strictEqual(payload.status, 'passed');
  assert.strictEqual(payload.written, true);
  assert.strictEqual(payload.after.elementCount, payload.before.elementCount + 2);
  assert.strictEqual(payload.after.relationshipCount, payload.before.relationshipCount + 1);

  const writtenGraph = JSON.parse(fs.readFileSync(tempGraphPath, 'utf8'));
  assert(writtenGraph.elements.some(element => element.id === 'mcp-scoped-remove-source'));
  assert(writtenGraph.relationships.some(relationship => relationship.id === 'mcp-scoped-remove-relation'));
  const topLevelView = writtenGraph.views.find(view => view.view_id === '237');
  const developmentView = writtenGraph.views.find(view => view.view_id === '238');
  const remainingViews = writtenGraph.views.filter(view => (view.included_elements || []).includes('mcp-scoped-remove-source'));
  assert(!topLevelView.included_elements.includes('mcp-scoped-remove-source'));
  assert(!topLevelView.included_relationships.includes('mcp-scoped-remove-relation'));
  assert(developmentView.included_elements.includes('mcp-scoped-remove-source'));
  assert(developmentView.included_relationships.includes('mcp-scoped-remove-relation'));
  assert(remainingViews.length > 0);
}

async function removesElementFromGraphWhenSpecifiedViewWasLastMembership(tempGraphPath) {
  const response = await callTool('applySystemArchitectureMutation', {
    architecturePath: path.relative(repoRoot, tempGraphPath),
    mutations: [
      {
        type: 'addElement',
        view_ids: ['237'],
        element: {
          id: 'mcp-last-view-element',
          name: 'Temporary last view element',
          type: 'Outcome',
          description: 'Used to validate scoped element removal from the final referencing view.',
        },
      },
      {
        type: 'removeElement',
        id: 'mcp-last-view-element',
        view_ids: ['237'],
      },
    ],
  });

  const payload = parseToolPayload(response);
  assert.deepStrictEqual(payload.errors, []);
  assert.strictEqual(payload.status, 'passed');
  assert.strictEqual(payload.written, true);
  assert.strictEqual(payload.after.elementCount, payload.before.elementCount);

  const writtenGraph = JSON.parse(fs.readFileSync(tempGraphPath, 'utf8'));
  assert(!writtenGraph.elements.some(element => element.id === 'mcp-last-view-element'));
  assert(writtenGraph.views.every(view => !(view.included_elements || []).includes('mcp-last-view-element')));
}

async function removesElementFromAllViewsAndGraphWithoutViewScope(tempGraphPath) {
  const response = await callTool('applySystemArchitectureMutation', {
    architecturePath: path.relative(repoRoot, tempGraphPath),
    mutations: [
      {
        type: 'addElement',
        view_ids: ['237', '238'],
        element: {
          id: 'mcp-global-remove-source',
          name: 'Temporary global remove source',
          type: 'Outcome',
          description: 'Used to validate global element removal without a view scope.',
        },
      },
      {
        type: 'addElement',
        view_ids: ['237', '238'],
        element: {
          id: 'mcp-global-remove-target',
          name: 'Temporary global remove target',
          type: 'Outcome',
          description: 'Used to validate global element removal without a view scope.',
        },
      },
      {
        type: 'addRelationship',
        view_ids: ['237', '238'],
        relationship: {
          id: 'mcp-global-remove-relation',
          statement: 'Temporary global remove source --(Association)--> Temporary global remove target',
          name: 'Global remove relation',
          type: 'Association',
          source_id: 'mcp-global-remove-source',
          target_id: 'mcp-global-remove-target',
          source_name: 'Temporary global remove source',
          target_name: 'Temporary global remove target',
        },
      },
      {
        type: 'removeElement',
        id: 'mcp-global-remove-source',
      },
    ],
  });

  const payload = parseToolPayload(response);
  assert.deepStrictEqual(payload.errors, []);
  assert.strictEqual(payload.status, 'passed');
  assert.strictEqual(payload.written, true);
  assert.strictEqual(payload.after.elementCount, payload.before.elementCount + 1);
  assert.strictEqual(payload.after.relationshipCount, payload.before.relationshipCount);

  const writtenGraph = JSON.parse(fs.readFileSync(tempGraphPath, 'utf8'));
  assert(!writtenGraph.elements.some(element => element.id === 'mcp-global-remove-source'));
  assert(writtenGraph.elements.some(element => element.id === 'mcp-global-remove-target'));
  assert(!writtenGraph.relationships.some(relationship => relationship.id === 'mcp-global-remove-relation'));
  assert(writtenGraph.views.every(view => !(view.included_elements || []).includes('mcp-global-remove-source')));
  assert(writtenGraph.views.every(view => !(view.included_relationships || []).includes('mcp-global-remove-relation')));
}

async function previewsViewLifecycleMutations(tempGraphPath) {
  const response = await callTool('previewSystemArchitectureMutation', {
    architecturePath: path.relative(repoRoot, tempGraphPath),
    mutations: [
      {
        type: 'addView',
        view: {
          view_id: 'mcp-valid-view',
          view_name: 'MCP governed view',
          parent_element_id: '1798',
          parent_element_name: 'Orchestrator',
          description: 'A temporary view used to validate governed view lifecycle mutations.',
        },
      },
      {
        type: 'updateView',
        view_id: 'mcp-valid-view',
        patch: {
          view_name: 'MCP governed view updated',
        },
      },
      {
        type: 'removeView',
        view_id: 'mcp-valid-view',
      },
    ],
  });

  const payload = parseToolPayload(response);
  assert.deepStrictEqual(payload.errors, []);
  assert.strictEqual(payload.status, 'passed');
  assert.strictEqual(payload.written, false);
  assert.strictEqual(payload.after.viewCount, payload.before.viewCount);
  assert.deepStrictEqual(payload.mutations.map(mutation => mutation.type), ['addView', 'updateView', 'removeView']);
}

async function rejectsSubviewWithoutParentElement(tempGraphPath) {
  const response = await callTool('previewSystemArchitectureMutation', {
    architecturePath: path.relative(repoRoot, tempGraphPath),
    mutations: [
      {
        type: 'addView',
        view: {
          view_id: 'mcp-invalid-orphan-view',
          view_name: 'Orphan sub view',
        },
      },
    ],
  });

  const payload = parseToolPayload(response);
  assert.strictEqual(payload.status, 'failed');
  assert(
    payload.errors.some(error => error.includes('must declare parent_element_id')),
    `Expected missing parent_element_id error, got: ${JSON.stringify(payload.errors)}`,
  );
}

async function validatesCurrentGraph() {
  const response = await callTool('validateSystemArchitecture', {});
  const payload = parseToolPayload(response);
  assert.strictEqual(payload.status, 'passed');
}

function parseToolPayload(response) {
  assert(response && Array.isArray(response.content), 'MCP response must contain content');
  return JSON.parse(response.content[0].text);
}

async function callMcpStdio(requests) {
  const result = spawnSync(process.execPath, ['scripts/argo-mcp-server.js'], {
    cwd: repoRoot,
    input: `${requests.map(request => JSON.stringify(request)).join('\n')}\n`,
    encoding: 'utf8',
  });
  assert.strictEqual(result.status, 0, result.stderr);
  return result.stdout
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map(line => JSON.parse(line));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

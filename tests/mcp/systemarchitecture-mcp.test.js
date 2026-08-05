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
const { callTool } = require('../../.argo/scripts/argo-mcp-server.js');
const systemArchitectureMcp = require('../../.argo/scripts/systemarchitecture-mcp-server.js');
const archimateRules = require('../../.argo/scripts/archimate32-rules.js');

async function main() {
  process.env.ARGO_REPO_ROOT = repoRoot;
  process.env.ARGO_MCP_MUTATION_RESPONSE_DEBUG = '1';

  validatesUnifiedMcpConfiguration();
  validatesNoDuplicateMcpExecutionAssets();
  validatesArchimate32RuleCoverage();
  validatesRelationshipSchemaRequiresTypeAndSeparatesName();
  validatesImplementationTraceProposalSchema();
  validatesTotalValidatorUsesFixedGraphAndViewLimitRule();
  await validatesFocusedViewToolsAreListed();
  await validatesAgentFacingToolGuidance();
  await validatesFocusedToolDryRunDoesNotWrite();
  await validatesCurrentGraph();
  rejectsIntentHandoffWhenListedElementHasNoMountedTestcase();
  allowsIntentHandoffWhenOnlyDependencyElementHasNoMountedTestcase();

  const tempRoot = fs.mkdtempSync(path.join(ensureTempDirectory(), 'case-'));
  const tempGraphPath = path.join(tempRoot, 'SystemArchitecture.json');
  fs.writeFileSync(tempGraphPath, JSON.stringify(buildMutationTestGraph(), null, 2));

  await rejectsInvalidRelationshipWithoutWriting(tempGraphPath);
  await rejectsRelationshipWithInvalidArchiMate32EndpointTypes(tempGraphPath);
  await rejectsRelationshipOutsideArchiMate32Matrix(tempGraphPath);
  await rejectsElementMutationWithoutViewScope(tempGraphPath);
  await rejectsRelationshipMutationWithoutViewScope(tempGraphPath);
  await rejectsElementAndRelationshipIdentityTypeUpdates(tempGraphPath);
  await rejectsElementAdditionWhenViewWouldExceedFifteenElements();
  await previewsGlobalUpdateMutationsWithoutViewScope(tempGraphPath);
  await returnsIntentElementContextWithSemanticTraversal();
  await treatsCompositionAndAggregationAsSourceToTargetDependencies();
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
  await allowsViewLifecycleWithoutExistingMembers(tempGraphPath);
  await rejectsViewLifecycleWithMissingMembers(tempGraphPath);
  await rejectsViewRelationshipWithoutEndpointsInSameView(tempGraphPath);
  await rejectsSubviewWithoutParentElement(tempGraphPath);
}

function validatesUnifiedMcpConfiguration() {
  for (const configPath of mcpConfigPaths) {
    const absoluteConfigPath = path.join(repoRoot, configPath);
    if (!fs.existsSync(absoluteConfigPath)) {
      continue;
    }
    const config = JSON.parse(fs.readFileSync(absoluteConfigPath, 'utf8'));
    const servers = config.mcpServers || config.servers;
    assert(servers, `${configPath} must define MCP servers`);
    assert.deepStrictEqual(Object.keys(servers), ['argo'], configPath);
    const argoArgs = servers.argo.args || [];
    assert(
      argoArgs.some(arg => arg.replace(/\\/g, '/').endsWith('.argo/scripts/argo-mcp-server.js')),
      `${configPath} must point to .argo/scripts/argo-mcp-server.js`,
    );
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
  assert(toolNames.includes('getIntentElementContext'));
  assert(toolNames.includes('validateTraceProposal'));
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
  assertDescriptionIncludes(toolByName, 'addArchitectureElement', ['Use for one element', 'view_ids', 'dryRun']);
  assertDescriptionIncludes(toolByName, 'addArchitectureRelationship', ['relationship.type', 'ArchiMate 3.2']);
  assertDescriptionIncludes(toolByName, 'removeArchitectureElement', ['cascades related relationships', 'view_ids']);
  assertDescriptionIncludes(toolByName, 'removeArchitectureRelationship', ['view_ids', 'all views']);
  assertDescriptionIncludes(toolByName, 'addArchitectureView', ['one top-level view', 'sub-views']);
  assertDescriptionIncludes(toolByName, 'getIntentElementContext', ['read-only', 'subgraph', 'dependencyDepth']);
  assertDescriptionIncludes(toolByName, 'validateTraceProposal', ['Validate', 'ImplementationToIntentTraceProposal']);
  assert.deepStrictEqual(
    Object.keys(toolByName.get('validateSystemArchitecture').inputSchema.properties),
    [],
  );
  assert.strictEqual(
    systemArchitectureMcp.TOOLS.some(tool => tool.name === 'validateSystemArchitecture'),
    false,
    'systemarchitecture-mcp-server must not expose a duplicate validateSystemArchitecture tool',
  );
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

function assertGuidanceIncludes(payload, expectedFragments) {
  assert(Array.isArray(payload.guidance), `Expected guidance array, got: ${JSON.stringify(payload)}`);
  const guidanceText = payload.guidance.join('\n');
  for (const expectedFragment of expectedFragments) {
    assert(
      guidanceText.includes(expectedFragment),
      `Expected guidance to include '${expectedFragment}', got: ${JSON.stringify(payload.guidance)}`,
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
  const schema = JSON.parse(fs.readFileSync(path.join(repoRoot, '.argo', 'schema', 'SystemArchitecture.schema.json'), 'utf8'));
  const relationshipSchema = schema.$defs.relationship;

  assert(relationshipSchema.required.includes('name'));
  assert(relationshipSchema.required.includes('type'));
  assert.deepStrictEqual(relationshipSchema.properties.name, { $ref: '#/$defs/nonEmptyString' });
  assert.deepStrictEqual(relationshipSchema.properties.type, { $ref: '#/$defs/archimateRelationshipType' });
}

function validatesImplementationTraceProposalSchema() {
  const schemaPath = path.join(repoRoot, '.argo', 'schema', 'ImplementationToIntentTraceProposal.schema.json');
  assert(fs.existsSync(schemaPath), 'ImplementationToIntentTraceProposal schema must exist');

  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  assert.strictEqual(schema.additionalProperties, false);
  assert(schema.required.includes('proposalType'));
  assert(schema.required.includes('sourceAgent'));
  assert(schema.required.includes('targetAgent'));
  assert(schema.required.includes('lifecycle'));
  assert(schema.required.includes('sourceIntentGraphPath'));
  assert(schema.required.includes('implementationContracts'));
  assert(schema.required.includes('anchorProposals'));
  assert.strictEqual(schema.properties.proposalType.const, 'implementation-to-intent-trace');
  assert.strictEqual(schema.properties.sourceAgent.const, 'ImplementationDesign');
  assert.strictEqual(schema.properties.targetAgent.const, 'IntentionDesign');
  assert.strictEqual(schema.properties.lifecycle.const, 'temporary-trace-proposal');

  const anchorSchema = schema.$defs.anchorProposal;
  for (const requiredField of [
    'intentElementId',
    'implementationElementName',
    'implementationElementKind',
    'implementsType',
    'tracePurpose',
    'contractPaths',
    'contextEntryPoints',
    'excludedDetails',
  ]) {
    assert(anchorSchema.required.includes(requiredField), `anchorProposal must require ${requiredField}`);
  }
  assert(anchorSchema.properties.implementationElementKind.enum.includes('stable-directory'));
  assert(anchorSchema.properties.implementationElementKind.enum.includes('explicit-test-entry'));
  assert.deepStrictEqual(anchorSchema.properties.implementsType.enum, ['direct', 'indirect']);
}

function validatesTotalValidatorUsesFixedGraphAndViewLimitRule() {
  const script = fs.readFileSync(path.join(repoRoot, '.argo', 'scripts', 'validateSystemArchitecture.js'), 'utf8');
  assert(script.includes("path.join('design', 'KG', 'SystemArchitecture.json')"));
  assert(!script.includes('process.argv[2]'));
  // View element limit now lives in shared graph-semantics.js; validateSystemArchitecture.js delegates.
  assert(script.includes('validateViewElementLimits'));
  const semantics = fs.readFileSync(path.join(repoRoot, '.argo', 'scripts', 'graph-semantics.js'), 'utf8');
  assert(semantics.includes('must contain at most ${MAX_INCLUDED_ELEMENTS} elements')
    || semantics.includes('must contain at most 15 elements'));
}

async function rejectsElementAdditionWhenViewWouldExceedFifteenElements() {
  const tempRoot = fs.mkdtempSync(path.join(ensureTempDirectory(), 'view-limit-'));
  const tempGraphPath = path.join(tempRoot, 'SystemArchitecture.json');
  fs.writeFileSync(tempGraphPath, JSON.stringify(buildFifteenElementViewGraph(), null, 2));

  const response = await callTool('previewSystemArchitectureMutation', {
    architecturePath: path.relative(repoRoot, tempGraphPath),
    mutations: [
      {
        type: 'addElement',
        view_ids: ['fifteen-element-view'],
        element: {
          id: 'sixteenth-element',
          name: 'Sixteenth Element',
          type: 'Application Component',
        },
      },
    ],
  });

  const payload = parseToolPayload(response);
  assert.strictEqual(payload.status, 'failed');
  assert.strictEqual(payload.written, false);
  assert(
    payload.errors.some(error => error.includes('must contain at most 15 elements')),
    `Expected view size limit error, got: ${JSON.stringify(payload.errors)}`,
  );
  assertGuidanceIncludes(payload, ['split the view into layered sub-views', 'parent_element_id']);
}

function buildFifteenElementViewGraph() {
  const elements = Array.from({ length: 15 }, (_, index) => ({
    id: `element-${index + 1}`,
    name: `Element ${index + 1}`,
    type: 'Application Component',
  }));
  return {
    name: 'SystemArchitecture',
    description: 'Temporary graph for view element limit tests.',
    elements,
    relationships: [
      {
        id: 'root-association',
        statement: 'Element 1 --(Association)--> Element 2',
        name: 'Association',
        type: 'Association',
        source_id: 'element-1',
        target_id: 'element-2',
        source_name: 'Element 1',
        target_name: 'Element 2',
      },
    ],
    views: [
      {
        view_id: 'root-view',
        view_name: 'SystemArchitecture',
        included_elements: ['element-1'],
      },
      {
        view_id: 'fifteen-element-view',
        view_name: 'Fifteen Element View',
        parent_element_id: 'element-1',
        parent_element_name: 'Element 1',
        included_elements: elements.map(element => element.id),
        included_relationships: ['root-association'],
      },
    ],
  };
}

function buildMutationTestGraph() {
  // Self-contained test graph with known IDs for mutation tests.
  // Uses real ArchiMate types so endpoint matrix validation produces deterministic results.
  // 1803 (SystemArchitecture, ApplicationFunction) → Triggering/Serving → 1798 (Orchestrator, Outcome): INVALID
  // 1798 (Outcome) → Composition → 1803 (ApplicationFunction): INVALID
  // 1799 (IntentionDesign, ApplicationComponent) → Assignment → 1803 (ApplicationFunction): VALID
  const elements = [
    { id: '1798', name: 'Orchestrator', type: 'Outcome' },
    { id: '1799', name: 'IntentionDesign', type: 'Application Component' },
    { id: '1800', name: 'ImplementationDesign', type: 'Application Component' },
    { id: '1801', name: 'CodingAndReparing', type: 'Application Component' },
    { id: '1803', name: 'SystemArchitecture', type: 'Application Function' },
    { id: '1805', name: 'argo_test', type: 'Application Component' },
  ];
  const relationships = [
    {
      id: '1726',
      name: 'Assignment',
      type: 'Assignment',
      statement: 'IntentionDesign --(Assignment)--> SystemArchitecture',
      source_id: '1799',
      target_id: '1803',
      source_name: 'IntentionDesign',
      target_name: 'SystemArchitecture',
    },
  ];
  const views = [
    {
      view_id: '237',
      view_name: 'SystemArchitecture',
      included_elements: ['1798', '1799', '1800', '1803', '1805'],
      included_relationships: ['1726'],
    },
    {
      view_id: '238',
      view_name: 'Business View',
      parent_element_id: '1798',
      parent_element_name: 'Orchestrator',
      included_elements: ['1798', '1799', '1803'],
    },
    {
      view_id: '239',
      view_name: 'Application View',
      parent_element_id: '1798',
      parent_element_name: 'Orchestrator',
      included_elements: ['1798', '1799', '1800', '1801'],
    },
    {
      view_id: '241',
      view_name: 'Data Access View',
      parent_element_id: '1798',
      parent_element_name: 'Orchestrator',
      included_elements: ['1799', '1800'],
    },
  ];
  return {
    name: 'SystemArchitecture',
    description: 'Test graph for mutation MCP tests.',
    elements,
    relationships,
    views,
  };
}

function ensureTempDirectory() {
  const tempDirectory = path.join(repoRoot, 'tests', 'mcp', '.tmp');
  fs.mkdirSync(tempDirectory, { recursive: true });
  return tempDirectory;
}

function rejectsIntentHandoffWhenListedElementHasNoMountedTestcase() {
  const tempRoot = fs.mkdtempSync(path.join(ensureTempDirectory(), 'handoff-coverage-'));
  fs.mkdirSync(path.join(tempRoot, 'design', 'KG'), { recursive: true });
  fs.mkdirSync(path.join(tempRoot, '.argo', 'schema'), { recursive: true });
  fs.mkdirSync(path.join(tempRoot, '.argo', 'temp'), { recursive: true });
  fs.copyFileSync(
    path.join(repoRoot, '.argo', 'schema', 'IntentToImplementationHandoff.schema.json'),
    path.join(tempRoot, '.argo', 'schema', 'IntentToImplementationHandoff.schema.json'),
  );
  fs.writeFileSync(
    path.join(tempRoot, 'design', 'KG', 'SystemArchitecture.json'),
    JSON.stringify(buildIntentHandoffCoverageGraph(), null, 2),
  );
  fs.writeFileSync(
    path.join(tempRoot, '.argo', 'temp', 'IntentToImplementationHandoff.json'),
    JSON.stringify({
      stage: 'intent-to-implementation',
      generatedAt: '2026-06-24T00:00:00.000Z',
      sourceIntentGraphPath: 'design/KG/SystemArchitecture.json',
      intentElementIds: ['focus'],
    }, null, 2),
  );

  const result = spawnSync(process.execPath, [path.join(repoRoot, '.argo', 'scripts', 'validateStageHandoff.js'), 'intent-to-implementation'], {
    cwd: tempRoot,
    env: {
      ...process.env,
      ARGO_REPO_ROOT: tempRoot,
    },
    encoding: 'utf8',
  });

  assert.notStrictEqual(result.status, 0, result.stdout);
  assert(
    result.stderr.includes("intent element 'focus'"),
    `Expected missing focus testcase error, got stderr: ${result.stderr}`,
  );
  assert(
    result.stderr.includes('Mount Acceptance Test testcases that cover this element'),
    `Expected testcase mounting guidance, got stderr: ${result.stderr}`,
  );
  assert(
    !result.stderr.includes("intent element 'dependency'"),
    `Validator must only check listed handoff elements, got stderr: ${result.stderr}`,
  );
}

function allowsIntentHandoffWhenOnlyDependencyElementHasNoMountedTestcase() {
  const tempRoot = fs.mkdtempSync(path.join(ensureTempDirectory(), 'handoff-focus-only-'));
  fs.mkdirSync(path.join(tempRoot, 'design', 'KG'), { recursive: true });
  fs.mkdirSync(path.join(tempRoot, '.argo', 'schema'), { recursive: true });
  fs.mkdirSync(path.join(tempRoot, '.argo', 'temp'), { recursive: true });
  fs.copyFileSync(
    path.join(repoRoot, '.argo', 'schema', 'IntentToImplementationHandoff.schema.json'),
    path.join(tempRoot, '.argo', 'schema', 'IntentToImplementationHandoff.schema.json'),
  );
  fs.writeFileSync(
    path.join(tempRoot, 'design', 'KG', 'SystemArchitecture.json'),
    JSON.stringify(buildIntentHandoffCoverageGraph({ focusHasTestcase: true }), null, 2),
  );
  fs.writeFileSync(
    path.join(tempRoot, '.argo', 'temp', 'IntentToImplementationHandoff.json'),
    JSON.stringify({
      stage: 'intent-to-implementation',
      generatedAt: '2026-06-24T00:00:00.000Z',
      sourceIntentGraphPath: 'design/KG/SystemArchitecture.json',
      intentElementIds: ['focus'],
    }, null, 2),
  );

  const result = spawnSync(process.execPath, [path.join(repoRoot, '.argo', 'scripts', 'validateStageHandoff.js'), 'intent-to-implementation'], {
    cwd: tempRoot,
    env: {
      ...process.env,
      ARGO_REPO_ROOT: tempRoot,
    },
    encoding: 'utf8',
  });

  assert.strictEqual(result.status, 0, result.stderr);
}

function buildIntentHandoffCoverageGraph(options = {}) {
  const focusElement = {
    id: 'focus',
    name: 'Focus Element',
    type: 'Application Component',
    attributes: [
      { name: 'functionalPoint', description: 'The focus behavior must be observable.' },
    ],
  };

  if (options.focusHasTestcase) {
    focusElement.testcases = [
      {
        name: 'focus_acceptance_test',
        description: 'Covers the focus behavior.',
        type: 'Acceptance Test',
        Input: 'Run the focus acceptance entrypoint.',
        acceptanceCriteria: 'tests/explicit/entries/runIntentGraphTopLevelDrilldown.js',
      },
    ];
  }

  return {
    name: 'SystemArchitecture',
    elements: [
      focusElement,
      {
        id: 'dependency',
        name: 'Dependency Element',
        type: 'Data Object',
        attributes: [
          { name: 'functionalPoint', description: 'The dependency behavior must be observable.' },
        ],
      },
    ],
    relationships: [
      {
        id: 'focus-access-dependency',
        statement: 'Focus Element --(Access)--> Dependency Element',
        name: 'Access',
        type: 'Access',
        source_id: 'focus',
        target_id: 'dependency',
        source_name: 'Focus Element',
        target_name: 'Dependency Element',
      },
    ],
  };
}

async function returnsIntentElementContextWithSemanticTraversal() {
  const tempRoot = fs.mkdtempSync(path.join(ensureTempDirectory(), 'context-'));
  const tempGraphPath = path.join(tempRoot, 'SystemArchitecture.json');
  fs.writeFileSync(tempGraphPath, JSON.stringify(buildContextQueryGraph(), null, 2));

  const response = await callTool('getIntentElementContext', {
    architecturePath: path.relative(repoRoot, tempGraphPath),
    elementId: 'focus',
    dependencyDepth: 1,
    dependentDepth: 1,
  });

  const payload = parseToolPayload(response);
  assert.strictEqual(payload.status, 'passed');
  assert.strictEqual(payload.focusElementId, 'focus');
  assert.strictEqual(payload.query.traversalMode, 'archimate-semantic');
  assert(!Object.prototype.hasOwnProperty.call(payload.subgraph, 'name'));
  assert(!Object.prototype.hasOwnProperty.call(payload.subgraph, 'description'));

  const elementIds = payload.subgraph.elements.map(element => element.id).sort();
  assert.deepStrictEqual(elementIds, [
    'aggregate',
    'assigned-function',
    'associated',
    'base-contract',
    'concrete-realizer',
    'dependent',
    'direct-data',
    'flow-source',
    'focus',
    'influencer',
    'provider',
    'trigger-source',
    'whole',
  ]);

  const relationshipIds = payload.subgraph.relationships.map(relationship => relationship.id).sort();
  assert.deepStrictEqual(relationshipIds, [
    'aggregate-contains-focus',
    'concrete-realizes-focus',
    'dependent-accesses-focus',
    'flow-source-flows-to-focus',
    'focus-accesses-data',
    'focus-assigned-to-function',
    'focus-associated-with-associated',
    'focus-specializes-base',
    'influencer-influences-focus',
    'provider-serves-focus',
    'trigger-source-triggers-focus',
    'whole-composes-focus',
  ]);
  const schema = JSON.parse(fs.readFileSync(path.join(repoRoot, '.argo', 'schema', 'SystemArchitecture.schema.json'), 'utf8'));
  const expectedRelationshipTypes = schema.$defs.archimateRelationshipType.enum.slice().sort();
  const actualRelationshipTypes = Array.from(new Set(payload.subgraph.relationships.map(relationship => relationship.type))).sort();
  assert.deepStrictEqual(actualRelationshipTypes, expectedRelationshipTypes);

  assert(payload.subgraph.views.some(view => view.view_id === 'context-view'));
  assert(payload.boundary.truncatedDependencies.some(entry => entry.elementId === 'associated'));
  assert(payload.explorationHints.some(hint => hint.suggestedArguments.elementId === 'associated'));
}

async function treatsCompositionAndAggregationAsSourceToTargetDependencies() {
  const tempRoot = fs.mkdtempSync(path.join(ensureTempDirectory(), 'context-structural-direction-'));
  const tempGraphPath = path.join(tempRoot, 'SystemArchitecture.json');
  fs.writeFileSync(tempGraphPath, JSON.stringify(buildContextQueryGraph(), null, 2));

  const response = await callTool('getIntentElementContext', {
    architecturePath: path.relative(repoRoot, tempGraphPath),
    elementId: 'focus',
    dependencyDepth: 1,
    dependentDepth: 0,
    associationDepth: 1,
  });

  const payload = parseToolPayload(response);
  assert.strictEqual(payload.status, 'passed');

  const dependencyRelationshipIds = payload.subgraph.relationships
    .map(relationship => relationship.id)
    .sort();
  assert(!dependencyRelationshipIds.includes('whole-composes-focus'));
  assert(!dependencyRelationshipIds.includes('aggregate-contains-focus'));
}

function buildContextQueryGraph() {
  const elements = [
    { id: 'focus', name: 'Focus', type: 'Application Component' },
    { id: 'provider', name: 'Provider', type: 'Application Service' },
    { id: 'whole', name: 'Whole', type: 'Application Component' },
    { id: 'aggregate', name: 'Aggregate', type: 'Application Component' },
    { id: 'associated', name: 'Associated', type: 'Application Component' },
    { id: 'associated-dependency', name: 'Associated Dependency', type: 'Data Object' },
    { id: 'dependent', name: 'Dependent', type: 'Application Component' },
    { id: 'direct-data', name: 'Direct Data', type: 'Data Object' },
    { id: 'assigned-function', name: 'Assigned Function', type: 'Application Function' },
    { id: 'concrete-realizer', name: 'Concrete Realizer', type: 'Application Component' },
    { id: 'trigger-source', name: 'Trigger Source', type: 'Application Event' },
    { id: 'flow-source', name: 'Flow Source', type: 'Data Object' },
    { id: 'influencer', name: 'Influencer', type: 'Driver' },
    { id: 'base-contract', name: 'Base Contract', type: 'Application Component' },
  ];
  const relationships = [
    contextRelationship('provider-serves-focus', 'Serving', 'provider', 'focus', elements),
    contextRelationship('whole-composes-focus', 'Composition', 'whole', 'focus', elements),
    contextRelationship('aggregate-contains-focus', 'Aggregation', 'aggregate', 'focus', elements),
    contextRelationship('focus-associated-with-associated', 'Association', 'focus', 'associated', elements),
    contextRelationship('associated-accesses-dependency', 'Access', 'associated', 'associated-dependency', elements),
    contextRelationship('dependent-accesses-focus', 'Access', 'dependent', 'focus', elements),
    contextRelationship('focus-accesses-data', 'Access', 'focus', 'direct-data', elements),
    contextRelationship('focus-assigned-to-function', 'Assignment', 'focus', 'assigned-function', elements),
    contextRelationship('concrete-realizes-focus', 'Realization', 'concrete-realizer', 'focus', elements),
    contextRelationship('trigger-source-triggers-focus', 'Triggering', 'trigger-source', 'focus', elements),
    contextRelationship('flow-source-flows-to-focus', 'Flow', 'flow-source', 'focus', elements),
    contextRelationship('influencer-influences-focus', 'Influence', 'influencer', 'focus', elements),
    contextRelationship('focus-specializes-base', 'Specialization', 'focus', 'base-contract', elements),
  ];
  return {
    name: 'SystemArchitecture',
    description: 'Temporary graph for intent context query tests.',
    elements,
    relationships,
    views: [
      {
        view_id: 'context-view',
        view_name: 'Context View',
        included_elements: elements.map(element => element.id),
        included_relationships: relationships.map(relationship => relationship.id),
      },
    ],
  };
}

function contextRelationship(id, type, sourceId, targetId, elements) {
  const elementById = new Map(elements.map(element => [element.id, element]));
  const source = elementById.get(sourceId);
  const target = elementById.get(targetId);
  return {
    id,
    statement: `${source.name} --(${type})--> ${target.name}`,
    name: type,
    type,
    source_id: sourceId,
    target_id: targetId,
    source_name: source.name,
    target_name: target.name,
  };
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
  assertGuidanceIncludes(payload, ['Check relationship.type', 'source and target element types']);
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
        type: 'addElement',
        view_ids: ['238'],
        element: {
          id: '1799',
        },
      },
      {
        type: 'addElement',
        view_ids: ['238'],
        element: {
          id: '1803',
        },
      },
      {
        type: 'addRelationship',
        view_ids: ['238'],
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
  const businessView = writtenGraph.views.find(view => view.view_id === '238');
  assert(businessView.included_relationships.includes('1726'));
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
  assertGuidanceIncludes(payload, ['Select the target view_ids', 'getSystemArchitecture']);
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
  assertGuidanceIncludes(payload, ['Select the target view_ids', 'getSystemArchitecture']);
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
    assertGuidanceIncludes(payload, ['Do not patch immutable identity or type fields', 'remove', 'add']);
    assert.strictEqual(fs.readFileSync(tempGraphPath, 'utf8'), before);
  }
}

async function removesRelationshipFromSpecifiedViewOnlyWhenOtherViewsStillReferenceIt(tempGraphPath) {
  const response = await callTool('applySystemArchitectureMutation', {
    architecturePath: path.relative(repoRoot, tempGraphPath),
    mutations: [
      {
        type: 'addRelationship',
        view_ids: ['239', '241'],
        relationship: {
          id: 'mcp-scoped-remove-relationship',
          statement: 'IntentionDesign --(Association)--> ImplementationDesign',
          name: 'Scoped remove relationship',
          type: 'Association',
          source_id: '1799',
          target_id: '1800',
          source_name: 'IntentionDesign',
          target_name: 'ImplementationDesign',
        },
      },
      {
        type: 'removeRelationship',
        id: 'mcp-scoped-remove-relationship',
        view_ids: ['239'],
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
  const applicationView = writtenGraph.views.find(view => view.view_id === '239');
  const dataAccessView = writtenGraph.views.find(view => view.view_id === '241');
  assert(!applicationView.included_relationships.includes('mcp-scoped-remove-relationship'));
  assert(dataAccessView.included_relationships.includes('mcp-scoped-remove-relationship'));
}

async function removesRelationshipFromGraphWhenSpecifiedViewWasLastMembership(tempGraphPath) {
  const response = await callTool('applySystemArchitectureMutation', {
    architecturePath: path.relative(repoRoot, tempGraphPath),
    mutations: [
      {
        type: 'addRelationship',
        view_ids: ['239'],
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
        view_ids: ['239'],
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
        view_ids: ['239', '241'],
        relationship: {
          id: 'mcp-global-remove-relationship',
          statement: 'IntentionDesign --(Association)--> CodingAndReparing',
          name: 'Global remove relationship',
          type: 'Association',
          source_id: '1799',
          target_id: '1801',
          source_name: 'IntentionDesign',
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
        view_ids: ['239'],
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

async function allowsViewLifecycleWithoutExistingMembers(tempGraphPath) {
  const response = await callTool('previewSystemArchitectureMutation', {
    architecturePath: path.relative(repoRoot, tempGraphPath),
    mutations: [
      {
        type: 'addView',
        view: {
          view_id: 'mcp-empty-member-view',
          view_name: 'Empty member view',
          parent_element_id: '1798',
          parent_element_name: 'Orchestrator',
        },
      },
      {
        type: 'updateView',
        view_id: 'mcp-empty-member-view',
        patch: {
          included_elements: [],
          included_relationships: [],
        },
      },
    ],
  });

  const payload = parseToolPayload(response);
  assert.deepStrictEqual(payload.errors, []);
  assert.strictEqual(payload.status, 'passed');
  assert.strictEqual(payload.written, false);
  assert.strictEqual(payload.after.viewCount, payload.before.viewCount + 1);
  assert.deepStrictEqual(payload.mutations.map(mutation => mutation.type), ['addView', 'updateView']);
}

async function rejectsViewLifecycleWithMissingMembers(tempGraphPath) {
  const addResponse = await callTool('previewSystemArchitectureMutation', {
    architecturePath: path.relative(repoRoot, tempGraphPath),
    mutations: [
      {
        type: 'addView',
        view: {
          view_id: 'mcp-future-member-view',
          view_name: 'Future member view',
          parent_element_id: '1798',
          parent_element_name: 'Orchestrator',
          included_elements: ['future-element-before-it-exists'],
          included_relationships: ['future-relationship-before-it-exists'],
        },
      },
    ],
  });

  const addPayload = parseToolPayload(addResponse);
  assert.strictEqual(addPayload.status, 'failed');
  assert(
    addPayload.errors.some(error => error.includes("references missing included element 'future-element-before-it-exists'")),
    `Expected missing included element error, got: ${JSON.stringify(addPayload.errors)}`,
  );
  assert(
    addPayload.errors.some(error => error.includes("references missing included relationship 'future-relationship-before-it-exists'")),
    `Expected missing included relationship error, got: ${JSON.stringify(addPayload.errors)}`,
  );

  const updateResponse = await callTool('previewSystemArchitectureMutation', {
    architecturePath: path.relative(repoRoot, tempGraphPath),
    mutations: [
      {
        type: 'addView',
        view: {
          view_id: 'mcp-update-future-member-view',
          view_name: 'Update future member view',
          parent_element_id: '1798',
          parent_element_name: 'Orchestrator',
        },
      },
      {
        type: 'updateView',
        view_id: 'mcp-update-future-member-view',
        patch: {
          included_elements: ['future-element-after-update'],
          included_relationships: ['future-relationship-after-update'],
        },
      },
    ],
  });

  const updatePayload = parseToolPayload(updateResponse);
  assert.strictEqual(updatePayload.status, 'failed');
  assert(
    updatePayload.errors.some(error => error.includes("references missing included element 'future-element-after-update'")),
    `Expected missing included element error, got: ${JSON.stringify(updatePayload.errors)}`,
  );
  assert(
    updatePayload.errors.some(error => error.includes("references missing included relationship 'future-relationship-after-update'")),
    `Expected missing included relationship error, got: ${JSON.stringify(updatePayload.errors)}`,
  );
}

async function rejectsViewRelationshipWithoutEndpointsInSameView(tempGraphPath) {
  const response = await callTool('previewSystemArchitectureMutation', {
    architecturePath: path.relative(repoRoot, tempGraphPath),
    mutations: [
      {
        type: 'addView',
        view: {
          view_id: 'mcp-relationship-without-endpoints-view',
          view_name: 'Relationship without endpoints view',
          parent_element_id: '1798',
          parent_element_name: 'Orchestrator',
          included_elements: ['1798'],
          included_relationships: ['1726'],
        },
      },
    ],
  });

  const payload = parseToolPayload(response);
  assert.strictEqual(payload.status, 'failed');
  assert(
    payload.errors.some(error => error.includes("views 'mcp-relationship-without-endpoints-view' includes relationship '1726' but not source element '1799'")),
    `Expected missing source endpoint error, got: ${JSON.stringify(payload.errors)}`,
  );
  assert(
    payload.errors.some(error => error.includes("views 'mcp-relationship-without-endpoints-view' includes relationship '1726' but not target element '1803'")),
    `Expected missing target endpoint error, got: ${JSON.stringify(payload.errors)}`,
  );
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

async function validatesFocusedToolDryRunDoesNotWrite() {
  const tempRoot = fs.mkdtempSync(path.join(ensureTempDirectory(), 'dryrun-'));
  const tempGraphPath = path.join(tempRoot, 'SystemArchitecture.json');
  fs.writeFileSync(tempGraphPath, JSON.stringify(buildMinimalValidGraph(), null, 2));

  const beforeContent = fs.readFileSync(tempGraphPath, 'utf8');
  const relativePath = path.relative(repoRoot, tempGraphPath);

  // dryRun: true → should NOT write
  const dryResponse = await systemArchitectureMcp.callTool('addArchitectureElement', {
    architecturePath: relativePath,
    element: { id: 'e3', name: 'DryRunElement', type: 'Application Component' },
    view_ids: ['v1'],
    dryRun: true,
  });
  const dryPayload = parseToolPayload(dryResponse);
  assert.strictEqual(dryPayload.status, 'passed', JSON.stringify(dryPayload.errors));
  assert.strictEqual(dryPayload.written, false);
  assert.strictEqual(dryPayload.after.elementCount, dryPayload.before.elementCount + 1);
  assert.strictEqual(fs.readFileSync(tempGraphPath, 'utf8'), beforeContent,
    'dryRun must not modify the graph file');

  // dryRun: false (default) → should write
  const writeResponse = await systemArchitectureMcp.callTool('addArchitectureElement', {
    architecturePath: relativePath,
    element: { id: 'e3', name: 'DryRunElement', type: 'Application Component' },
    view_ids: ['v1'],
  });
  const writePayload = parseToolPayload(writeResponse);
  assert.strictEqual(writePayload.status, 'passed', JSON.stringify(writePayload.errors));
  assert.strictEqual(writePayload.written, true);
  assert.notStrictEqual(fs.readFileSync(tempGraphPath, 'utf8'), beforeContent,
    'default (no dryRun) must write to the graph file');
}

async function validatesCurrentGraph() {
  const response = await callTool('validateSystemArchitecture', {});
  const payload = parseToolPayload(response);
  assert.strictEqual(payload.status, 'passed', JSON.stringify(payload.errors));
  assert.strictEqual(
    payload.command.length,
    2,
    `validateSystemArchitecture must not pass an architecture path: ${JSON.stringify(payload.command)}`,
  );
}

function buildMinimalValidGraph() {
  return {
    name: 'SystemArchitecture',
    description: 'Minimal valid graph for validator pipeline tests.',
    elements: [
      { id: 'e1', name: 'Root', type: 'Application Component' },
      { id: 'e2', name: 'Child', type: 'Application Component' },
    ],
    relationships: [
      {
        id: 'r1',
        name: 'Composition',
        type: 'Composition',
        statement: 'Root --(Composition)--> Child',
        source_id: 'e1',
        target_id: 'e2',
        source_name: 'Root',
        target_name: 'Child',
      },
    ],
    views: [
      {
        view_id: 'v1',
        view_name: 'SystemArchitecture',
        included_elements: ['e1', 'e2'],
        included_relationships: ['r1'],
      },
    ],
  };
}

function parseToolPayload(response) {
  assert(response && Array.isArray(response.content), 'MCP response must contain content');
  return JSON.parse(response.content[0].text);
}

async function callMcpStdio(requests) {
  const result = spawnSync(process.execPath, ['.argo/scripts/argo-mcp-server.js'], {
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

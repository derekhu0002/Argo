const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { callTool } = require('../../../.argo/scripts/systemarchitecture-mcp-server.js');
const { handleRequest } = require('../../../.argo/scripts/argo-mcp-server.js');

const repoRoot = path.resolve(__dirname, '..', '..', '..');

const canonicalGraph = Object.freeze({
  name: 'MCP Semantic Contract Fixture',
  elements: Object.freeze([
    Object.freeze({ id: 'element-a', name: 'Element A', type: 'Capability', description: 'Canonical A' }),
    Object.freeze({ id: 'element-b', name: 'Element B', type: 'Capability', description: 'Canonical B' }),
    Object.freeze({ id: 'element-c', name: 'Element C', type: 'Capability', description: 'Canonical C' }),
  ]),
  relationships: Object.freeze([
    Object.freeze({ id: 'rel-ab', name: 'A serves B', type: 'Serving', source_id: 'element-a', target_id: 'element-b' }),
    Object.freeze({ id: 'rel-bc', name: 'B serves C', type: 'Serving', source_id: 'element-b', target_id: 'element-c' }),
  ]),
  views: Object.freeze([
    Object.freeze({
      view_id: 'view-primary',
      view_name: 'Primary View',
      description: 'Viewpoint: Application Usage Viewpoint; Concern: primary; Purpose: deciding; Scope: fixture; Rationale: fixture.',
      included_elements: Object.freeze(['element-a']),
      included_relationships: Object.freeze(['rel-ab']),
    }),
    Object.freeze({
      view_id: 'view-overlap',
      view_name: 'Overlapping View',
      description: 'Viewpoint: Application Usage Viewpoint; Concern: overlap; Purpose: deciding; Scope: fixture; Rationale: fixture.',
      included_elements: Object.freeze(['element-a']),
      included_relationships: Object.freeze([]),
    }),
  ]),
});

const canonicalDocument = Object.freeze({
  elements: canonicalGraph.elements,
  relationships: canonicalGraph.relationships,
  views: canonicalGraph.views,
});

const BROKEN_RELATIONSHIP_CATEGORY = 'SEMANTIC_SUBSET_RELATIONSHIP_MISSING';
const BROKEN_VIEW_CATEGORY = 'SEMANTIC_SUBSET_VIEW_MISSING';

const EXPECTED_CURRENT_FAILURE_CASES = new Set([
  'reject-response-shape-controls',
  'canonical-object-subset-only',
  'element-hit-no-neighbor-expansion',
  'relationship-endpoint-closure',
  'view-membership-closure',
  'no-overlapping-view-cascade',
  'broken-relationship-endpoint-rejection',
  'broken-view-reference-rejection',
]);

async function main() {
  process.env.ARGO_REPO_ROOT = repoRoot;
  const fixture = createCanonicalFixture();

  try {
    // GIVEN the approved BP-MCP-SEM explicit testcase boundary anchors
    const cases = [
      {
        name: 'reject-response-shape-controls',
        run: async () => {
          for (const [field, value] of forbiddenControlMatrix()) {
            const { payload } = await invokeSemanticQuery(
              {
                purpose: 'implementation-design',
                intent: 'Reject response shape controls from semantic query consumers',
                anchors: ['reject-response-shape-controls'],
                [field]: value,
              },
              createSemanticJourney({
                architecturePath: fixture.architecturePath,
                document: createSemanticEvidence({
                  seedsByType: {
                    elements: [seed('element-a')],
                  },
                  closureElements: ['element-a'],
                  returnedRelationships: [],
                  returnedViews: [],
                }),
              }),
              fixture.architecturePath,
            );
            assert.strictEqual(
              payload.status,
              'failed',
              `reject-response-shape-controls must fail closed for ${field}=${value}`,
            );
            assert.strictEqual(
              payload.error && payload.error.category,
              'QUERY_RESPONSE_SHAPE_CONTROL_FORBIDDEN',
              `reject-response-shape-controls must emit QUERY_RESPONSE_SHAPE_CONTROL_FORBIDDEN for ${field}=${value}`,
            );
          }
          const noAnchorQuery = {
            purpose: 'implementation-design',
            intent: 'Reject response shape controls from public no-anchor semantic query consumers',
            responseProfile: 'debug',
          };
          const noAnchorDependencies = createSemanticJourney({
            architecturePath: fixture.architecturePath,
            document: createSemanticEvidence({
              seedsByType: {
                elements: [seed('element-a')],
              },
              closureElements: ['element-a'],
              returnedRelationships: [],
              returnedViews: [],
            }),
          });
          const noAnchorDirect = await invokeSemanticQuery(
            noAnchorQuery,
            noAnchorDependencies,
            fixture.architecturePath,
          );
          assertFailClosed(
            noAnchorDirect.payload,
            'reject-response-shape-controls no-anchor direct callTool',
            'QUERY_RESPONSE_SHAPE_CONTROL_FORBIDDEN',
          );
          const noAnchorUnified = await invokeUnifiedMcpTool(
            {
              architecturePath: fixture.architecturePath,
              query: noAnchorQuery,
            },
            noAnchorDependencies,
          );
          assertFailClosed(
            noAnchorUnified.payload,
            'reject-response-shape-controls no-anchor unified MCP handler',
            'QUERY_RESPONSE_SHAPE_CONTROL_FORBIDDEN',
          );
        },
      },
      {
      name: 'canonical-object-subset-only',
      run: async () => {
        const { payload } = await invokeSemanticQuery(
          {
            purpose: 'implementation-design',
            intent: 'Return canonical semantic query objects only',
            anchors: ['canonical-object-subset-only'],
          },
          createSemanticJourney({
            architecturePath: fixture.architecturePath,
            document: createSemanticEvidence({
              seedsByType: {
                elements: [seed('element-a')],
                relationships: [seed('rel-ab', 'ArchitectureRelationship')],
                views: [seed('view-primary', 'View')],
              },
              closureElements: ['element-a', 'element-b', 'element-c'],
              nonCanonicalClosureElements: [syntheticPolicyElement()],
              returnedRelationships: ['rel-ab', 'rel-bc'],
              returnedViews: ['view-primary', 'view-overlap'],
            }),
          }),
          fixture.architecturePath,
        );
        assertSemanticSuccess(payload, 'canonical-object-subset-only');
        assertCanonicalSuccessPayload(payload, canonicalDocument, 'canonical-object-subset-only');

        const noAnchorDependencies = createSemanticJourney({
          architecturePath: fixture.architecturePath,
          document: createSemanticEvidence({
            seedsByType: {
              elements: [seed('element-a')],
              relationships: [seed('rel-ab', 'ArchitectureRelationship')],
              views: [seed('view-primary', 'View')],
            },
            closureElements: ['element-a', 'element-b', 'element-c'],
            nonCanonicalClosureElements: [syntheticPolicyElement()],
            returnedRelationships: ['rel-ab', 'rel-bc'],
            returnedViews: ['view-primary', 'view-overlap'],
          }),
        });
        const noAnchorQuery = {
          purpose: 'implementation-design',
          intent: 'Return canonical semantic query objects only through the public no-anchor path',
        };
        const noAnchorDirect = await invokeSemanticQuery(
          noAnchorQuery,
          noAnchorDependencies,
          fixture.architecturePath,
        );
        assertSemanticSuccess(noAnchorDirect.payload, 'canonical-object-subset-only no-anchor direct callTool');
        assertCanonicalSuccessPayload(
          noAnchorDirect.payload,
          canonicalDocument,
          'canonical-object-subset-only no-anchor direct callTool',
        );
        const noAnchorUnified = await invokeUnifiedMcpTool(
          {
            architecturePath: fixture.architecturePath,
            query: noAnchorQuery,
          },
          noAnchorDependencies,
        );
        assertSemanticSuccess(noAnchorUnified.payload, 'canonical-object-subset-only no-anchor unified MCP handler');
        assertCanonicalSuccessPayload(
          noAnchorUnified.payload,
          canonicalDocument,
          'canonical-object-subset-only no-anchor unified MCP handler',
        );
      },
      },
      {
      name: 'element-hit-no-neighbor-expansion',
      run: async () => {
        const { payload } = await invokeSemanticQuery(
          {
            purpose: 'implementation-design',
            intent: 'Return only the matched Element and no neighbor expansion',
            anchors: ['element-hit-no-neighbor-expansion'],
          },
          createSemanticJourney({
            architecturePath: fixture.architecturePath,
            document: createSemanticEvidence({
              seedsByType: {
                elements: [seed('element-a')],
              },
              closureElements: ['element-a'],
              returnedRelationships: [],
              returnedViews: [],
            }),
          }),
          fixture.architecturePath,
        );
        assertSemanticSuccess(payload, 'element-hit-no-neighbor-expansion');
        assertCanonicalSuccessPayload(
          payload,
          {
            elements: [canonicalElement('element-a')],
            relationships: [],
            views: [],
          },
          'element-hit-no-neighbor-expansion',
        );
      },
      },
      {
      name: 'relationship-endpoint-closure',
      run: async () => {
        const { payload } = await invokeSemanticQuery(
          {
            purpose: 'implementation-design',
            intent: 'Return relationship endpoint closure without unrelated neighbors',
            anchors: ['relationship-endpoint-closure'],
          },
          createSemanticJourney({
            architecturePath: fixture.architecturePath,
            document: createSemanticEvidence({
              seedsByType: {
                relationships: [seed('rel-ab', 'ArchitectureRelationship')],
              },
              closureElements: ['element-a', 'element-b'],
              returnedRelationships: ['rel-ab'],
              returnedViews: [],
            }),
          }),
          fixture.architecturePath,
        );
        assertSemanticSuccess(payload, 'relationship-endpoint-closure');
        assertCanonicalSuccessPayload(
          payload,
          {
            elements: [canonicalElement('element-a'), canonicalElement('element-b')],
            relationships: [canonicalRelationship('rel-ab')],
            views: [],
          },
          'relationship-endpoint-closure',
        );
      },
      },
      {
      name: 'view-membership-closure',
      run: async () => {
        const { payload } = await invokeSemanticQuery(
          {
            purpose: 'implementation-design',
            intent: 'Return the selected View with members and endpoint closure',
            anchors: ['view-membership-closure'],
          },
          createSemanticJourney({
            architecturePath: fixture.architecturePath,
            document: createSemanticEvidence({
              seedsByType: {
                views: [seed('view-primary', 'View')],
              },
              closureElements: ['element-a', 'element-b'],
              returnedRelationships: ['rel-ab'],
              returnedViews: ['view-primary'],
            }),
          }),
          fixture.architecturePath,
        );
        assertSemanticSuccess(payload, 'view-membership-closure');
        assertCanonicalSuccessPayload(
          payload,
          {
            elements: [canonicalElement('element-a'), canonicalElement('element-b')],
            relationships: [canonicalRelationship('rel-ab')],
            views: [canonicalView('view-primary')],
          },
          'view-membership-closure',
        );
      },
      },
      {
      name: 'no-overlapping-view-cascade',
      run: async () => {
        const { payload } = await invokeSemanticQuery(
          {
            purpose: 'implementation-design',
            intent: 'Exclude overlapping Views that were not independently selected',
            anchors: ['no-overlapping-view-cascade'],
          },
          createSemanticJourney({
            architecturePath: fixture.architecturePath,
            document: createSemanticEvidence({
              seedsByType: {
                views: [seed('view-primary', 'View')],
              },
              closureElements: ['element-a', 'element-b'],
              returnedRelationships: ['rel-ab'],
              returnedViews: ['view-primary'],
            }),
          }),
          fixture.architecturePath,
        );
        assertSemanticSuccess(payload, 'no-overlapping-view-cascade');
        const document = requireCanonicalDocument(payload, 'no-overlapping-view-cascade');
        assert(
          !document.views.some(view => view.view_id === 'view-overlap'),
          'no-overlapping-view-cascade must not include view-overlap',
        );
      },
      },
      {
      name: 'broken-relationship-endpoint-rejection',
      run: async () => {
        const { payload } = await invokeSemanticQuery(
          {
            purpose: 'implementation-design',
            intent: 'Reject relationship results with missing endpoint closure references',
            anchors: ['broken-relationship-endpoint-rejection'],
          },
          createSemanticJourney({
            architecturePath: fixture.architecturePath,
            document: createSemanticEvidence({
              seedsByType: {
                relationships: [seed('rel-ab', 'ArchitectureRelationship')],
              },
              closureElements: ['element-a'],
              returnedRelationships: ['rel-ab'],
              returnedViews: [],
            }),
          }),
          fixture.architecturePath,
        );
        assertFailClosed(
          payload,
          'broken-relationship-endpoint-rejection',
          BROKEN_RELATIONSHIP_CATEGORY,
        );
      },
      },
      {
      name: 'broken-view-reference-rejection',
      run: async () => {
        const { payload } = await invokeSemanticQuery(
          {
            purpose: 'implementation-design',
            intent: 'Reject View results with broken member references',
            anchors: ['broken-view-reference-rejection'],
          },
          createSemanticJourney({
            architecturePath: fixture.architecturePath,
            document: createSemanticEvidence({
              seedsByType: {
                views: [seed('view-primary', 'View')],
              },
              closureElements: ['element-b'],
              returnedRelationships: [],
              returnedViews: ['view-primary'],
            }),
          }),
          fixture.architecturePath,
        );
        assertFailClosed(
          payload,
          'broken-view-reference-rejection',
          BROKEN_VIEW_CATEGORY,
        );
      },
      },
      {
      name: 'production-nested-closure-evidence',
      run: async () => {
        const { payload } = await invokeSemanticQuery(
          {
            purpose: 'implementation-design',
            intent: 'Accept production structural closure evidence nested inside relationships and views',
            anchors: ['production-nested-closure-evidence'],
          },
          createSemanticJourney({
            architecturePath: fixture.architecturePath,
            document: createSemanticEvidence({
              seedsByType: {
                views: [seed('view-primary', 'View')],
              },
              closureElements: [],
              rawClosureElements: [qualifiedClosureNoise('View:view-overlap')],
              returnedRelationships: [],
              returnedViews: [],
              nestedEndpointRelationships: [relationshipWithEndpoints('rel-ab')],
              nestedViews: [viewWithMembers('view-primary')],
            }),
          }),
          fixture.architecturePath,
        );
        assertSemanticSuccess(payload, 'production-nested-closure-evidence');
        assertCanonicalSuccessPayload(
          payload,
          {
            elements: [canonicalElement('element-a'), canonicalElement('element-b')],
            relationships: [canonicalRelationship('rel-ab')],
            views: [canonicalView('view-primary')],
          },
          'production-nested-closure-evidence',
        );
      },
      },
      {
      name: 'preserve-full-snapshot-read-modes',
      run: async () => {
        const noQuery = await invokeTool({}, undefined, fixture.architecturePath);
        assert.strictEqual(
          noQuery.structured && noQuery.structured.mode,
          'full-snapshot',
          'preserve-full-snapshot-read-modes omitted-query must stay full-snapshot',
        );
        assert.deepStrictEqual(
          noQuery.payload.document,
          canonicalGraph,
          'preserve-full-snapshot-read-modes omitted-query must return the temp canonical fixture',
        );
        assert.strictEqual(
          Object.prototype.hasOwnProperty.call(noQuery.payload, 'query'),
          false,
          'preserve-full-snapshot-read-modes omitted-query must preserve legacy snapshot payload shape',
        );

        const graphTidy = await invokeTool({
          query: {
            purpose: 'graph-tidy',
            intent: 'Prepare a graph tidy mutation without semantic retrieval',
          },
        }, undefined, fixture.architecturePath);
        assert.deepStrictEqual(
          graphTidy.payload.document,
          canonicalGraph,
          'preserve-full-snapshot-read-modes graph-tidy must return the temp canonical fixture',
        );
        assert.strictEqual(
          graphTidy.payload.query && graphTidy.payload.query.mode,
          'full-snapshot',
          'preserve-full-snapshot-read-modes graph-tidy must report full-snapshot mode',
        );
        assert.strictEqual(
          graphTidy.payload.query && graphTidy.payload.query.semanticRetrieval,
          'bypassed',
          'preserve-full-snapshot-read-modes graph-tidy must bypass semantic retrieval',
        );
        assert.deepStrictEqual(
          graphTidy.payload.document,
          canonicalGraph,
          'preserve-full-snapshot-read-modes graph-tidy must preserve the full canonical snapshot',
        );
      },
      },
    ];

    const selectedAnchor = (process.env.ARGO_TESTCASE_ANCHOR || '').trim();
    const selectedCases = selectedAnchor
      ? cases.filter(testCase => testCase.name === selectedAnchor)
      : cases;
    if (selectedAnchor && selectedCases.length === 0) {
      throw new Error(`UNKNOWN_TESTCASE_ANCHOR: ${selectedAnchor}`);
    }

    const failures = [];
    // WHEN Coding/Repair invokes either the whole script or a graph-mounted anchor
    for (const testCase of selectedCases) {
      try {
        await testCase.run();
        console.log(`PASS ${testCase.name}`);
      } catch (error) {
        failures.push({
          name: testCase.name,
          expectedContractFailure: EXPECTED_CURRENT_FAILURE_CASES.has(testCase.name),
          message: error && error.message ? error.message : String(error),
        });
        console.log(`FAIL ${testCase.name}`);
      }
    }

    if (failures.length === 0) {
      // THEN every requested business-readable contract case has passed
      console.log('MCP_SEMANTIC_QUERY_CONTRACT_OK');
      return;
    }

    const unexpected = failures.filter(item => !item.expectedContractFailure);
    const expected = failures.filter(item => item.expectedContractFailure);
    if (unexpected.length > 0) {
      throw new Error([
        'TASK_QUALITY_FAILURES:',
        ...unexpected.map(formatFailure),
        ...(expected.length === 0
          ? []
          : ['EXPECTED_CONTRACT_FAILURES_OBSERVED:', ...expected.map(formatFailure)]),
      ].join('\n'));
    }

    throw new Error([
      'EXPECTED_CONTRACT_FAILURES:',
      ...expected.map(formatFailure),
    ].join('\n'));
  } finally {
    cleanupCanonicalFixture(fixture);
  }
}

function formatFailure(failure) {
  return `- ${failure.name}: ${failure.message}`;
}

function canonicalElement(id) {
  return canonicalGraph.elements.find(element => element.id === id);
}

function canonicalRelationship(id) {
  return canonicalGraph.relationships.find(relationship => relationship.id === id);
}

function canonicalView(viewId) {
  return canonicalGraph.views.find(view => view.view_id === viewId);
}

function syntheticPolicyElement() {
  return Object.freeze({
    id: 'grag-intent-decision-policy',
    name: 'grag-intent-decision-policy',
    type: 'Application Function',
    firstInclusionReason: 'declared-purpose-policy',
  });
}

function relationshipWithEndpoints(id) {
  const relationship = canonicalRelationship(id);
  return Object.freeze({
    ...relationship,
    source: canonicalElement(relationship.source_id),
    target: canonicalElement(relationship.target_id),
  });
}

function viewWithMembers(viewId) {
  const view = canonicalView(viewId);
  return Object.freeze({
    ...view,
    memberElements: Object.freeze((view.included_elements || []).map(canonicalElement)),
    memberRelationships: Object.freeze((view.included_relationships || []).map(relationshipWithEndpoints)),
  });
}

function qualifiedClosureNoise(id) {
  return Object.freeze({
    id,
    name: id,
    type: 'Application Function',
  });
}

function seed(id, objectType = 'Element', score = 0.99) {
  return Object.freeze({ id, objectType, score });
}

function createSemanticJourney({ architecturePath, document }) {
  return {
    semanticOperatorJourney: Object.freeze({
      async query(request) {
        return {
          status: 'passed',
          graphPath: architecturePath,
          query: {
            ...request,
            mode: 'semantic-query',
            semanticRetrieval: 'invoked',
          },
          result: document,
          document,
        };
      },
    }),
  };
}

function createSemanticEvidence({
  seedsByType,
  closureElements,
  rawClosureElements = [],
  nonCanonicalClosureElements = [],
  returnedRelationships,
  returnedViews,
  nestedEndpointRelationships = [],
  nestedViews = [],
}) {
  const provenanceObjects = [];
  for (const item of seedsByType.elements || []) {
    provenanceObjects.push(provenance(item.objectType, item.id, 'semantic-seed'));
  }
  for (const item of seedsByType.relationships || []) {
    provenanceObjects.push(provenance(item.objectType, item.id, 'semantic-seed'));
  }
  for (const item of seedsByType.views || []) {
    provenanceObjects.push(provenance(item.objectType, item.id, 'semantic-seed'));
  }
  for (const id of closureElements) {
    if (!provenanceObjects.some(item => item.objectType === 'Element' && item.objectId === id)) {
      provenanceObjects.push(provenance('Element', id, 'purpose-policy-closure'));
    }
  }
  for (const item of nonCanonicalClosureElements) {
    if (!provenanceObjects.some(record => record.objectType === 'Element' && record.objectId === item.id)) {
      provenanceObjects.push(provenance('Element', item.id, item.firstInclusionReason || 'purpose-policy-closure'));
    }
  }
  for (const id of returnedRelationships) {
    if (!provenanceObjects.some(item => item.objectType === 'ArchitectureRelationship' && item.objectId === id)) {
      provenanceObjects.push(provenance('ArchitectureRelationship', id, 'relationship-endpoint-closure'));
    }
  }
  for (const id of returnedViews) {
    if (!provenanceObjects.some(item => item.objectType === 'View' && item.objectId === id)) {
      provenanceObjects.push(provenance('View', id, 'view-membership-closure'));
    }
  }

  return Object.freeze({
    seedsByType: Object.freeze({
      elements: Object.freeze([...(seedsByType.elements || [])]),
      relationships: Object.freeze([...(seedsByType.relationships || [])]),
      views: Object.freeze([...(seedsByType.views || [])]),
    }),
    closurePolicy: Object.freeze({
      category: 'implementation-design',
      policyId: 'w5.implementation-design.v1',
      queryTemplate: 'MATCH p = (:Element)-[:Serving]->(:Element) RETURN p',
      parameterContract: Object.freeze(['purpose', 'anchors', 'intent']),
      archimateSemantics: Object.freeze([{ relationshipType: 'Serving' }]),
    }),
    boundary: Object.freeze({
      included: Object.freeze([
        ...closureElements,
        ...nonCanonicalClosureElements.map(item => item.id),
        ...returnedRelationships,
        ...returnedViews,
      ]),
      excluded: Object.freeze([]),
      rationale: 'Return the canonical contract subset only.',
    }),
    closure: Object.freeze({
      elements: Object.freeze([
        ...closureElements.map(canonicalElement),
        ...rawClosureElements,
        ...nonCanonicalClosureElements,
      ]),
    }),
    endpointClosure: Object.freeze({
      relationships: Object.freeze([
        ...returnedRelationships.map(canonicalRelationship),
        ...nestedEndpointRelationships,
      ]),
    }),
    viewClosure: Object.freeze({
      views: Object.freeze([
        ...returnedViews.map(canonicalView),
        ...nestedViews,
      ]),
      overlappingViewCascade: false,
    }),
    provenance: Object.freeze({
      objects: Object.freeze(provenanceObjects),
      alignment: Object.freeze({ state: 'Aligned' }),
    }),
    canonicalVersion: 'canonical-v1',
    contentVersion: 'content-v1',
    indexVersion: 'index-v1',
    businessObjects: Object.freeze({ shouldDisappear: true }),
    semanticSeeds: Object.freeze({ shouldDisappear: true }),
    hitReasons: Object.freeze([{ shouldDisappear: true }]),
    policySummary: Object.freeze({ shouldDisappear: true }),
    boundarySummary: Object.freeze({ shouldDisappear: true }),
    semanticIndex: Object.freeze({ shouldDisappear: true }),
    descriptionSummary: 'should disappear',
    testCoverage: Object.freeze([{ shouldDisappear: true }]),
    expandWith: 'should disappear',
    queryTemplate: 'should disappear',
    parameterContract: Object.freeze(['should disappear']),
    archimateSemantics: Object.freeze([{ shouldDisappear: true }]),
  });
}

function forbiddenControlMatrix() {
  const fields = ['responseProfile', 'detail', 'outputMode'];
  const values = {
    debug: ['debug', 'DEBUG', 'DeBuG'],
    full: ['full', 'FULL', 'Full'],
    evidence: ['evidence', 'EVIDENCE', 'Evidence'],
  };
  const matrix = [];
  for (const field of fields) {
    for (const variants of Object.values(values)) {
      for (const value of variants) {
        matrix.push([field, value]);
      }
    }
  }
  return matrix;
}

function provenance(objectType, objectId, firstInclusionReason) {
  return Object.freeze({
    objectType,
    objectId,
    firstInclusionReason,
    supplementaryReasons: Object.freeze([]),
    canonicalVersion: 'canonical-v1',
  });
}

function createCanonicalFixture() {
  const fileName = `task-1-semantic-contract-fixture-${process.pid}-${Date.now()}.json`;
  const absolutePath = path.join(repoRoot, '.superpowers', 'sdd', fileName);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(canonicalGraph, null, 2)}\n`);
  return {
    absolutePath,
    architecturePath: toWorkspaceRelativePath(absolutePath),
  };
}

function cleanupCanonicalFixture(fixture) {
  if (!fixture) return;
  try {
    fs.unlinkSync(fixture.absolutePath);
  } catch (_error) {
    // Best-effort cleanup only.
  }
}

function toWorkspaceRelativePath(absolutePath) {
  return path.relative(repoRoot, absolutePath).replace(/\\/g, '/');
}

async function invokeSemanticQuery(query, dependencies, architecturePath) {
  return invokeTool({ query }, dependencies, architecturePath);
}

async function invokeTool(args = {}, dependencies = undefined, architecturePath = undefined) {
  const response = await callTool('getSystemArchitecture', {
    ...args,
    ...(architecturePath ? { architecturePath } : {}),
  }, dependencies);
  const payload = response && Array.isArray(response.content)
    ? JSON.parse(response.content[0].text)
    : response;
  assert(payload && typeof payload === 'object', 'MCP response payload must be an object');
  return {
    response,
    payload,
    structured: response && response.structuredContent ? response.structuredContent : null,
  };
}

async function invokeUnifiedMcpTool(args = {}, dependencies = undefined) {
  const response = await handleRequest({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'getSystemArchitecture',
      arguments: args,
    },
  }, dependencies);
  assert(response && response.result, 'Unified MCP response must include result');
  const payload = response.result && Array.isArray(response.result.content)
    ? JSON.parse(response.result.content[0].text)
    : response.result;
  assert(payload && typeof payload === 'object', 'Unified MCP response payload must be an object');
  return {
    response,
    payload,
    structured: response.result && response.result.structuredContent ? response.result.structuredContent : null,
  };
}

function assertSemanticSuccess(payload, caseName) {
  assert.strictEqual(payload.status, 'passed', `${caseName} must succeed once the contract is implemented`);
}

function assertCanonicalSuccessPayload(payload, expectedDocument, caseName) {
  assert.strictEqual(
    Object.prototype.hasOwnProperty.call(payload, 'result'),
    false,
    `${caseName} must not expose a business-summary result envelope`,
  );
  const document = requireCanonicalDocument(payload, caseName);
  assert.deepStrictEqual(document, expectedDocument, `${caseName} must return the canonical document subset`);
  assertNoDerivedSemanticFields(document, caseName);
}

function requireCanonicalDocument(payload, caseName) {
  assert(payload && payload.document, `${caseName} must expose document`);
  assert.deepStrictEqual(
    Object.keys(payload.document).sort(),
    ['elements', 'relationships', 'views'],
    `${caseName} document must contain only canonical object collections`,
  );
  return payload.document;
}

function assertNoDerivedSemanticFields(document, caseName) {
  for (const field of [
    'businessObjects',
    'semanticSeeds',
    'hitReasons',
    'policySummary',
    'boundarySummary',
    'semanticIndex',
    'descriptionSummary',
    'testCoverage',
    'expandWith',
    'queryTemplate',
    'parameterContract',
    'archimateSemantics',
  ]) {
    assert.strictEqual(
      Object.prototype.hasOwnProperty.call(document, field),
      false,
      `${caseName} document must not expose derived field ${field}`,
    );
  }
}

function assertFailClosed(payload, caseName, expectedCategory) {
  assert.strictEqual(payload.status, 'failed', `${caseName} must fail closed`);
  assert(payload.error && typeof payload.error.category === 'string' && payload.error.category.length > 0, `${caseName} must return a failure category`);
  assert.strictEqual(
    payload.error.category,
    expectedCategory,
    `${caseName} must emit ${expectedCategory}`,
  );
  if (Object.prototype.hasOwnProperty.call(payload.error, 'fullSnapshotFallback')) {
    assert.strictEqual(
      payload.error.fullSnapshotFallback,
      false,
      `${caseName} must not silently fall back to a full snapshot`,
    );
  }
}

function assertCanonicalSnapshotShape(document, caseName) {
  assert(document && typeof document === 'object', `${caseName} must return a document object`);
  assert.strictEqual(typeof document.name, 'string', `${caseName} must preserve the canonical graph name`);
  assert(Array.isArray(document.elements), `${caseName} must preserve canonical elements`);
  assert(Array.isArray(document.relationships), `${caseName} must preserve canonical relationships`);
  assert(Array.isArray(document.views), `${caseName} must preserve canonical views`);
}

main().catch(error => {
  console.error(error && error.message ? error.message : error);
  process.exitCode = 1;
});

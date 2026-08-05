const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { callTool } = require('../../.argo/scripts/argo-mcp-server.js');

const repoRoot = path.resolve(__dirname, '..', '..');

async function observeGlobalViewCapacityBoundary() {
  for (const scenario of globalViewpointScenarios()) {
    const acceptedAtEight = await previewAddViewWithElementCount(8, scenario);
    assertPassedWithoutFormerSevenLimit(
      acceptedAtEight,
      `VIEW15_GLOBAL_SCOPE_8_REJECTED:${scenario.scenarioId}`,
    );

    const previewAcceptedAtFifteen = await previewAddViewWithElementCount(15, scenario);
    assertPassedWithoutFormerSevenLimit(
      previewAcceptedAtFifteen,
      `VIEW15_GLOBAL_SCOPE_15_REJECTED:${scenario.scenarioId}`,
    );

    const writtenAtFifteen = await writeAddViewWithElementCount(15, scenario);
    assertWritePassedAndPersisted(
      writtenAtFifteen,
      `view15-${scenario.scenarioId}-15-element-view`,
      `VIEW15_GLOBAL_SCOPE_15_WRITE_REJECTED:${scenario.scenarioId}`,
    );

    const previewRejectedAtSixteen = await previewAddViewWithElementCount(16, scenario);
    assertOverflowRejectedWithObservedCount(
      previewRejectedAtSixteen,
      `VIEW15_GLOBAL_SCOPE_16_PREVIEW:${scenario.scenarioId}`,
    );

    const writeRejectedAtSixteen = await writeAddViewWithElementCount(16, scenario);
    assertActualWriteRejected(
      writeRejectedAtSixteen.payload,
      `VIEW15_GLOBAL_SCOPE_16_WRITE_ACCEPTED:${scenario.scenarioId}`,
    );
    assertViewNotPersisted(
      writeRejectedAtSixteen.graphPath,
      `view15-${scenario.scenarioId}-16-element-view`,
      `VIEW15_GLOBAL_SCOPE_16_WRITE_PERSISTED:${scenario.scenarioId}`,
    );
  }
}

async function observeDirectMembershipGrowth() {
  for (const scenario of globalViewpointScenarios()) {
    const focusedElementGrowth = await focusedAddElementIntroducingMembership(scenario);
    assertOverflowRejectedWithObservedCount(
      focusedElementGrowth.diagnosticPayload,
      `VIEW15_DIRECT_GROWTH_FOCUSED_ADD_ELEMENT:${scenario.scenarioId}`,
    );
    assertActualWriteRejected(
      focusedElementGrowth.payload,
      `VIEW15_DIRECT_GROWTH_FOCUSED_ADD_ELEMENT_ACCEPTED:${scenario.scenarioId}`,
    );
    assertMembershipsUnchanged(
      focusedElementGrowth.graphPath,
      focusedElementGrowth.beforeMemberships,
      `VIEW15_DIRECT_GROWTH_FOCUSED_ADD_ELEMENT_PERSISTED:${scenario.scenarioId}`,
    );

    const batchElementGrowth = await applyAddElementIntroducingMembership(scenario);
    assertOverflowRejectedWithObservedCount(
      batchElementGrowth.diagnosticPayload,
      `VIEW15_DIRECT_GROWTH_BATCH_ADD_ELEMENT:${scenario.scenarioId}`,
    );
    assertActualWriteRejected(
      batchElementGrowth.payload,
      `VIEW15_DIRECT_GROWTH_BATCH_ADD_ELEMENT_ACCEPTED:${scenario.scenarioId}`,
    );
    assertMembershipsUnchanged(
      batchElementGrowth.graphPath,
      batchElementGrowth.beforeMemberships,
      `VIEW15_DIRECT_GROWTH_BATCH_ADD_ELEMENT_PERSISTED:${scenario.scenarioId}`,
    );

    const focusedViewGrowth = await focusedUpdateViewIntroducingMembership(scenario);
    assertOverflowRejectedWithObservedCount(
      focusedViewGrowth.diagnosticPayload,
      `VIEW15_DIRECT_GROWTH_FOCUSED_UPDATE_VIEW:${scenario.scenarioId}`,
    );
    assertActualWriteRejected(
      focusedViewGrowth.payload,
      `VIEW15_DIRECT_GROWTH_FOCUSED_UPDATE_VIEW_ACCEPTED:${scenario.scenarioId}`,
    );
    assertMembershipsUnchanged(
      focusedViewGrowth.graphPath,
      focusedViewGrowth.beforeMemberships,
      `VIEW15_DIRECT_GROWTH_FOCUSED_UPDATE_VIEW_PERSISTED:${scenario.scenarioId}`,
    );

    const batchViewGrowth = await applyUpdateViewIntroducingMembership(scenario);
    assertOverflowRejectedWithObservedCount(
      batchViewGrowth.diagnosticPayload,
      `VIEW15_DIRECT_GROWTH_BATCH_UPDATE_VIEW:${scenario.scenarioId}`,
    );
    assertActualWriteRejected(
      batchViewGrowth.payload,
      `VIEW15_DIRECT_GROWTH_BATCH_UPDATE_VIEW_ACCEPTED:${scenario.scenarioId}`,
    );
    assertMembershipsUnchanged(
      batchViewGrowth.graphPath,
      batchViewGrowth.beforeMemberships,
      `VIEW15_DIRECT_GROWTH_BATCH_UPDATE_VIEW_PERSISTED:${scenario.scenarioId}`,
    );
  }
}

async function observeRelationshipCountingBoundary() {
  const relationshipRichView = await previewAddRelationshipRichFifteenElementView();
  assertPassedWithoutFormerSevenLimit(
    relationshipRichView,
    'VIEW15_RELATIONSHIP_COUNTED_AGAINST_CAPACITY',
  );

  const missingEndpointView = await previewAddViewWithMissingRelationshipEndpoint();
  assert.strictEqual(
    missingEndpointView.status,
    'failed',
    'VIEW15_RELATIONSHIP_MISSING_ENDPOINT_ACCEPTED',
  );
  assertErrorIncludes(
    missingEndpointView,
    "includes relationship 'view15-rel-1' but not target element 'view15-element-2'",
    'VIEW15_RELATIONSHIP_ENDPOINT_COHABITATION_NOT_REPORTED',
  );
  assertNoErrorIncludes(
    missingEndpointView,
    'must contain at most',
    'VIEW15_RELATIONSHIP_ENDPOINT_REJECTED_AS_CAPACITY',
  );
}

async function observeProspectiveCapacityStability() {
  const { graphPath, beforeMemberships } = writeTemporaryCanonicalGraph('view15-no-migration-');
  const graph = readGraph(graphPath);
  const activationElement = (graph.elements || []).find(element => element && element.id);
  assert(activationElement, 'VIEW15_NO_MIGRATION_CANONICAL_ELEMENT_MISSING');

  const response = await callTool('previewSystemArchitectureMutation', {
    architecturePath: workspaceRelativePath(graphPath),
    mutations: [
      {
        type: 'updateElement',
        id: activationElement.id,
        patch: {
          description: `${activationElement.description || activationElement.name || activationElement.id} Policy activation marker that must not recompose View memberships.`,
        },
      },
    ],
  });
  const payload = parseToolPayload(response);

  const afterMemberships = captureViewMemberships(readGraph(graphPath));
  assert.deepStrictEqual(
    afterMemberships,
    beforeMemberships,
    'VIEW15_NO_MIGRATION_MEMBERSHIP_RECOMPOSED',
  );
  assert.strictEqual(
    beforeMemberships.length,
    (graph.views || []).length,
    'VIEW15_NO_MIGRATION_NOT_ALL_CANONICAL_VIEWS_CAPTURED',
  );

  assert.strictEqual(payload.status, 'passed', failureCategory(payload, 'VIEW15_NO_MIGRATION_ACTIVATION_FAILED'));
  assert.strictEqual(payload.written, false, 'VIEW15_NO_MIGRATION_PREVIEW_WROTE_TEMP_GRAPH');
}

async function observeActiveAuthorityConsistency() {
  const historicalEvidence = historicalSevenEvidence()
    .map(({ relativePath, requiredPhrases }) => ({
      relativePath,
      missingPhrases: requiredPhrases.filter(phrase => !readWorkspaceFile(relativePath).includes(phrase)),
    }))
    .filter(result => result.missingPhrases.length > 0);

  assert.deepStrictEqual(
    historicalEvidence,
    [],
    `VIEW15_CONSISTENCY_HISTORICAL_EVIDENCE_REWRITTEN:${JSON.stringify(historicalEvidence)}`,
  );

  const graphAuthority = observeActiveAuthorityGraphWording();
  assert.deepStrictEqual(
    graphAuthority,
    [],
    `VIEW15_CONSISTENCY_GRAPH_AUTHORITY_MISMATCH:${JSON.stringify(graphAuthority)}`,
  );

  const activeAuthoritySurfaces = activeAuthoritySurfaceEvidence();
  const staleSevenSurfaces = activeAuthoritySurfaces
    .map(({ relativePath }) => ({
      relativePath,
      stalePhrases: activeSevenPhrases(readWorkspaceFile(relativePath)),
    }))
    .filter(result => result.stalePhrases.length > 0);

  assert.deepStrictEqual(
    staleSevenSurfaces,
    [],
    `VIEW15_CONSISTENCY_ACTIVE_SEVEN_AUTHORITY:${JSON.stringify(staleSevenSurfaces)}`,
  );

  const missingFifteenSurfaces = activeAuthoritySurfaces
    .map(({ relativePath, requiredPhrases }) => ({
      relativePath,
      missingPhrases: requiredPhrases.filter(phrase => !readWorkspaceFile(relativePath).includes(phrase)),
    }))
    .filter(result => result.missingPhrases.length > 0);

  assert.deepStrictEqual(
    missingFifteenSurfaces,
    [],
    `VIEW15_CONSISTENCY_ACTIVE_FIFTEEN_AUTHORITY_MISSING:${JSON.stringify(missingFifteenSurfaces)}`,
  );
}

async function observeIndirectEndpointMembershipGrowth() {
  const focusedAddRelationshipGrowth = await focusedAddRelationshipIntroducingEndpoint();
  assertOverflowRejectedWithObservedCount(
    focusedAddRelationshipGrowth.diagnosticPayload,
    'VIEW15_INDIRECT_GROWTH_FOCUSED_ADD_RELATIONSHIP',
  );
  assertActualWriteRejected(
    focusedAddRelationshipGrowth.payload,
    'VIEW15_INDIRECT_GROWTH_FOCUSED_ADD_RELATIONSHIP_ACCEPTED',
  );
  assertMembershipsUnchanged(
    focusedAddRelationshipGrowth.graphPath,
    focusedAddRelationshipGrowth.beforeMemberships,
    'VIEW15_INDIRECT_GROWTH_FOCUSED_ADD_RELATIONSHIP_PERSISTED',
  );

  const focusedUpdateRelationshipGrowth = await focusedUpdateRelationshipIntroducingEndpoint();
  assertOverflowRejectedWithObservedCount(
    focusedUpdateRelationshipGrowth.diagnosticPayload,
    'VIEW15_INDIRECT_GROWTH_FOCUSED_UPDATE_RELATIONSHIP',
  );
  assertActualWriteRejected(
    focusedUpdateRelationshipGrowth.payload,
    'VIEW15_INDIRECT_GROWTH_FOCUSED_UPDATE_RELATIONSHIP_ACCEPTED',
  );
  assertMembershipsUnchanged(
    focusedUpdateRelationshipGrowth.graphPath,
    focusedUpdateRelationshipGrowth.beforeMemberships,
    'VIEW15_INDIRECT_GROWTH_FOCUSED_UPDATE_RELATIONSHIP_PERSISTED',
  );

  const addRelationshipGrowth = await previewAddRelationshipIntroducingEndpoint();
  assertOverflowRejectedWithObservedCount(
    addRelationshipGrowth.diagnosticPayload,
    'VIEW15_INDIRECT_GROWTH_BATCH_ADD_RELATIONSHIP',
  );
  assertActualWriteRejected(
    addRelationshipGrowth.payload,
    'VIEW15_INDIRECT_GROWTH_BATCH_ADD_RELATIONSHIP_ACCEPTED',
  );
  assertMembershipsUnchanged(
    addRelationshipGrowth.graphPath,
    addRelationshipGrowth.beforeMemberships,
    'VIEW15_INDIRECT_GROWTH_BATCH_ADD_RELATIONSHIP_PERSISTED',
  );

  const updateRelationshipGrowth = await previewUpdateRelationshipIntroducingEndpoint();
  assertOverflowRejectedWithObservedCount(
    updateRelationshipGrowth.diagnosticPayload,
    'VIEW15_INDIRECT_GROWTH_BATCH_UPDATE_RELATIONSHIP',
  );
  assertActualWriteRejected(
    updateRelationshipGrowth.payload,
    'VIEW15_INDIRECT_GROWTH_BATCH_UPDATE_RELATIONSHIP_ACCEPTED',
  );
  assertMembershipsUnchanged(
    updateRelationshipGrowth.graphPath,
    updateRelationshipGrowth.beforeMemberships,
    'VIEW15_INDIRECT_GROWTH_BATCH_UPDATE_RELATIONSHIP_PERSISTED',
  );
}

async function previewAddViewWithElementCount(elementCount, scenario) {
  const { graphPath } = writeTemporaryGraph(
    buildGraphWithElements(elementCount, { scenario }),
    `view15-${scenario.scenarioId}-${elementCount}-`,
  );
  const response = await callTool('previewSystemArchitectureMutation', {
    architecturePath: workspaceRelativePath(graphPath),
    mutations: [
      {
        type: 'addView',
        view: {
          view_id: `view15-${scenario.scenarioId}-${elementCount}-element-view`,
          view_name: `View 15 ${scenario.scenarioName} ${elementCount} Element View`,
          parent_element_id: scenario.viewpointId,
          parent_element_name: scenario.viewpointName,
          description: viewpointBindingDescription(scenario),
          included_elements: elementIds(elementCount),
          included_relationships: [],
        },
      },
    ],
  });
  return parseToolPayload(response);
}

async function writeAddViewWithElementCount(elementCount, scenario) {
  const { graphPath } = writeTemporaryGraph(
    buildGraphWithElements(elementCount, { scenario }),
    `view15-write-${scenario.scenarioId}-${elementCount}-`,
  );
  const view = {
    view_id: `view15-${scenario.scenarioId}-${elementCount}-element-view`,
    view_name: `View 15 ${scenario.scenarioName} ${elementCount} Element View`,
    parent_element_id: scenario.viewpointId,
    parent_element_name: scenario.viewpointName,
    description: viewpointBindingDescription(scenario),
    included_elements: elementIds(elementCount),
    included_relationships: [],
  };
  const response = await callTool('addArchitectureView', {
    architecturePath: workspaceRelativePath(graphPath),
    view,
  });
  return {
    graphPath,
    payload: parseToolPayload(response),
  };
}

async function focusedAddRelationshipIntroducingEndpoint() {
  const { graphPath, beforeMemberships } = writeTemporaryGraph(buildGraphWithElements(16, { relationshipCount: 1 }), 'view15-focused-indirect-add-');
  const diagnosticResponse = await callTool('addArchitectureRelationship', {
    architecturePath: workspaceRelativePath(graphPath),
    dryRun: true,
    view_ids: ['view15-fifteen-member-view'],
    relationship: {
      id: 'view15-focused-indirect-new-endpoint',
      statement: 'View 15 Element 15 --(Association)--> View 15 Element 16',
      name: 'View 15 focused indirect new endpoint',
      type: 'Association',
      source_id: 'view15-element-15',
      target_id: 'view15-element-16',
      source_name: 'View 15 Element 15',
      target_name: 'View 15 Element 16',
    },
  });
  const response = await callTool('addArchitectureRelationship', {
    architecturePath: workspaceRelativePath(graphPath),
    view_ids: ['view15-fifteen-member-view'],
    relationship: {
      id: 'view15-focused-indirect-new-endpoint',
      statement: 'View 15 Element 15 --(Association)--> View 15 Element 16',
      name: 'View 15 focused indirect new endpoint',
      type: 'Association',
      source_id: 'view15-element-15',
      target_id: 'view15-element-16',
      source_name: 'View 15 Element 15',
      target_name: 'View 15 Element 16',
    },
  });
  return {
    graphPath,
    beforeMemberships,
    diagnosticPayload: parseToolPayload(diagnosticResponse),
    payload: parseToolPayload(response),
  };
}

async function focusedUpdateRelationshipIntroducingEndpoint() {
  const { graphPath, beforeMemberships } = writeTemporaryGraph(buildGraphWithElements(16, { relationshipCount: 1 }), 'view15-focused-indirect-update-');
  const diagnosticResponse = await callTool('updateArchitectureRelationship', {
    architecturePath: workspaceRelativePath(graphPath),
    dryRun: true,
    id: 'view15-rel-1',
    patch: {
      statement: 'View 15 Element 1 --(Association)--> View 15 Element 16',
      target_id: 'view15-element-16',
      target_name: 'View 15 Element 16',
    },
  });
  const response = await callTool('updateArchitectureRelationship', {
    architecturePath: workspaceRelativePath(graphPath),
    id: 'view15-rel-1',
    patch: {
      statement: 'View 15 Element 1 --(Association)--> View 15 Element 16',
      target_id: 'view15-element-16',
      target_name: 'View 15 Element 16',
    },
  });
  return {
    graphPath,
    beforeMemberships,
    diagnosticPayload: parseToolPayload(diagnosticResponse),
    payload: parseToolPayload(response),
  };
}

async function focusedAddElementIntroducingMembership(scenario) {
  const { graphPath, beforeMemberships } = writeTemporaryGraph(
    buildGraphWithElements(15, { scenario }),
    `view15-focused-direct-add-element-${scenario.scenarioId}-`,
  );
  const diagnosticResponse = await callTool('addArchitectureElement', {
    architecturePath: workspaceRelativePath(graphPath),
    dryRun: true,
    view_ids: ['view15-fifteen-member-view'],
    element: {
      id: 'view15-element-16',
      name: 'View 15 Element 16',
      type: scenario.elementType || 'Application Component',
    },
  });
  const response = await callTool('addArchitectureElement', {
    architecturePath: workspaceRelativePath(graphPath),
    view_ids: ['view15-fifteen-member-view'],
    element: {
      id: 'view15-element-16',
      name: 'View 15 Element 16',
      type: scenario.elementType || 'Application Component',
    },
  });
  return {
    graphPath,
    beforeMemberships,
    diagnosticPayload: parseToolPayload(diagnosticResponse),
    payload: parseToolPayload(response),
  };
}

async function applyAddElementIntroducingMembership(scenario) {
  const { graphPath, beforeMemberships } = writeTemporaryGraph(
    buildGraphWithElements(15, { scenario }),
    `view15-batch-direct-add-element-${scenario.scenarioId}-`,
  );
  const diagnosticResponse = await callTool('previewSystemArchitectureMutation', {
    architecturePath: workspaceRelativePath(graphPath),
    mutations: [
      {
        type: 'addElement',
        view_ids: ['view15-fifteen-member-view'],
        element: {
          id: 'view15-element-16',
          name: 'View 15 Element 16',
          type: scenario.elementType || 'Application Component',
        },
      },
    ],
  });
  const response = await callTool('applySystemArchitectureMutation', {
    architecturePath: workspaceRelativePath(graphPath),
    mutations: [
      {
        type: 'addElement',
        view_ids: ['view15-fifteen-member-view'],
        element: {
          id: 'view15-element-16',
          name: 'View 15 Element 16',
          type: scenario.elementType || 'Application Component',
        },
      },
    ],
  });
  return {
    graphPath,
    beforeMemberships,
    diagnosticPayload: parseToolPayload(diagnosticResponse),
    payload: parseToolPayload(response),
  };
}

async function focusedUpdateViewIntroducingMembership(scenario) {
  const { graphPath, beforeMemberships } = writeTemporaryGraph(
    buildGraphWithElements(16, { scenario }),
    `view15-focused-direct-update-view-${scenario.scenarioId}-`,
  );
  const diagnosticResponse = await callTool('updateArchitectureView', {
    architecturePath: workspaceRelativePath(graphPath),
    dryRun: true,
    view_id: 'view15-fifteen-member-view',
    patch: {
      included_elements: elementIds(16),
    },
  });
  const response = await callTool('updateArchitectureView', {
    architecturePath: workspaceRelativePath(graphPath),
    view_id: 'view15-fifteen-member-view',
    patch: {
      included_elements: elementIds(16),
    },
  });
  return {
    graphPath,
    beforeMemberships,
    diagnosticPayload: parseToolPayload(diagnosticResponse),
    payload: parseToolPayload(response),
  };
}

async function applyUpdateViewIntroducingMembership(scenario) {
  const { graphPath, beforeMemberships } = writeTemporaryGraph(
    buildGraphWithElements(16, { scenario }),
    `view15-batch-direct-update-view-${scenario.scenarioId}-`,
  );
  const diagnosticResponse = await callTool('previewSystemArchitectureMutation', {
    architecturePath: workspaceRelativePath(graphPath),
    mutations: [
      {
        type: 'updateView',
        view_id: 'view15-fifteen-member-view',
        patch: {
          included_elements: elementIds(16),
        },
      },
    ],
  });
  const response = await callTool('applySystemArchitectureMutation', {
    architecturePath: workspaceRelativePath(graphPath),
    mutations: [
      {
        type: 'updateView',
        view_id: 'view15-fifteen-member-view',
        patch: {
          included_elements: elementIds(16),
        },
      },
    ],
  });
  return {
    graphPath,
    beforeMemberships,
    diagnosticPayload: parseToolPayload(diagnosticResponse),
    payload: parseToolPayload(response),
  };
}

async function previewAddRelationshipRichFifteenElementView() {
  const { graphPath } = writeTemporaryGraph(buildGraphWithElements(15, { relationshipCount: 4 }), 'view15-relationships-');
  const response = await callTool('previewSystemArchitectureMutation', {
    architecturePath: workspaceRelativePath(graphPath),
    mutations: [
      {
        type: 'addView',
        view: {
          view_id: 'view15-relationship-rich-view',
          view_name: 'View 15 Relationship Rich View',
          parent_element_id: 'view15-element-1',
          parent_element_name: 'View 15 Element 1',
          description: 'Temporary View 15 relationship-counting acceptance fixture.',
          included_elements: elementIds(15),
          included_relationships: relationshipIds(4),
        },
      },
    ],
  });
  return parseToolPayload(response);
}

async function previewAddViewWithMissingRelationshipEndpoint() {
  const { graphPath } = writeTemporaryGraph(buildGraphWithElements(2, { relationshipCount: 1 }), 'view15-endpoint-');
  const response = await callTool('previewSystemArchitectureMutation', {
    architecturePath: workspaceRelativePath(graphPath),
    mutations: [
      {
        type: 'addView',
        view: {
          view_id: 'view15-missing-endpoint-view',
          view_name: 'View 15 Missing Endpoint View',
          parent_element_id: 'view15-element-1',
          parent_element_name: 'View 15 Element 1',
          description: 'Temporary View 15 endpoint coexistence acceptance fixture.',
          included_elements: ['view15-element-1'],
          included_relationships: ['view15-rel-1'],
        },
      },
    ],
  });
  return parseToolPayload(response);
}

async function previewAddRelationshipIntroducingEndpoint() {
  const { graphPath, beforeMemberships } = writeTemporaryGraph(buildGraphWithElements(16, { relationshipCount: 1 }), 'view15-indirect-add-');
  const mutations = [
    {
      type: 'addRelationship',
      view_ids: ['view15-fifteen-member-view'],
      relationship: {
        id: 'view15-indirect-new-endpoint',
        statement: 'View 15 Element 15 --(Association)--> View 15 Element 16',
        name: 'View 15 indirect new endpoint',
        type: 'Association',
        source_id: 'view15-element-15',
        target_id: 'view15-element-16',
        source_name: 'View 15 Element 15',
        target_name: 'View 15 Element 16',
      },
    },
  ];
  const diagnosticResponse = await callTool('previewSystemArchitectureMutation', {
    architecturePath: workspaceRelativePath(graphPath),
    mutations,
  });
  const response = await callTool('applySystemArchitectureMutation', {
    architecturePath: workspaceRelativePath(graphPath),
    mutations,
  });
  return {
    graphPath,
    beforeMemberships,
    diagnosticPayload: parseToolPayload(diagnosticResponse),
    payload: parseToolPayload(response),
  };
}

async function previewUpdateRelationshipIntroducingEndpoint() {
  const { graphPath, beforeMemberships } = writeTemporaryGraph(buildGraphWithElements(16, { relationshipCount: 1 }), 'view15-indirect-update-');
  const mutations = [
    {
      type: 'updateRelationship',
      id: 'view15-rel-1',
      patch: {
        statement: 'View 15 Element 1 --(Association)--> View 15 Element 16',
        target_id: 'view15-element-16',
        target_name: 'View 15 Element 16',
      },
    },
  ];
  const diagnosticResponse = await callTool('previewSystemArchitectureMutation', {
    architecturePath: workspaceRelativePath(graphPath),
    mutations,
  });
  const response = await callTool('applySystemArchitectureMutation', {
    architecturePath: workspaceRelativePath(graphPath),
    mutations,
  });
  return {
    graphPath,
    beforeMemberships,
    diagnosticPayload: parseToolPayload(diagnosticResponse),
    payload: parseToolPayload(response),
  };
}

function buildGraphWithElements(elementCount, options = {}) {
  const relationshipCount = options.relationshipCount === undefined
    ? 1
    : options.relationshipCount;
  const scenario = options.scenario || globalViewpointScenarios()[0];
  const elements = elementIds(elementCount).map((id, index) => ({
    id,
    name: `View 15 Element ${index + 1}`,
    type: scenario.elementType || 'Application Component',
  }));
  elements.unshift({
    id: scenario.viewpointId,
    name: scenario.viewpointName,
    type: 'Grouping',
    description: `Temporary ${scenario.viewpointName} anchor for View15 capacity coverage.`,
  });
  const relationships = relationshipIds(relationshipCount).map((id, index) => ({
    id,
    statement: `View 15 Element ${index + 1} --(Association)--> View 15 Element ${index + 2}`,
    name: `View 15 Relationship ${index + 1}`,
    type: 'Association',
    source_id: `view15-element-${index + 1}`,
    target_id: `view15-element-${index + 2}`,
    source_name: `View 15 Element ${index + 1}`,
    target_name: `View 15 Element ${index + 2}`,
  }));

  return {
    name: 'SystemArchitecture',
    description: 'Temporary graph for View 15 implementation-design acceptance tests.',
    elements,
    relationships,
    views: [
      {
        view_id: 'view15-root',
        view_name: 'SystemArchitecture',
        included_elements: elementCount > 1
          ? [scenario.viewpointId, 'view15-element-1', 'view15-element-2']
          : [scenario.viewpointId, 'view15-element-1'],
        included_relationships: relationshipCount > 0 ? ['view15-rel-1'] : [],
      },
      {
        view_id: 'view15-existing-membership',
        view_name: 'View 15 Existing Membership',
        parent_element_id: 'view15-element-1',
        parent_element_name: 'View 15 Element 1',
        description: 'Pre-existing membership fixture that policy activation must not recompose.',
        included_elements: elementIds(Math.min(15, elementCount)),
        included_relationships: relationshipIds(relationshipCount),
      },
      {
        view_id: 'view15-fifteen-member-view',
        view_name: 'View 15 Fifteen Member View',
        parent_element_id: 'view15-element-1',
        parent_element_name: 'View 15 Element 1',
        description: 'Existing 15-element fixture used to test indirect endpoint membership growth.',
        included_elements: elementIds(Math.min(15, elementCount)),
        included_relationships: relationshipCount > 0 ? ['view15-rel-1'] : [],
      },
    ],
  };
}

function globalViewpointScenarios() {
  return [
    {
      scenarioId: 'stakeholder-motivation',
      scenarioName: 'Stakeholder Motivation',
      viewpointId: 'view15-stakeholder-viewpoint',
      viewpointName: 'View15 Stakeholder Viewpoint',
      concern: 'stakeholder motivation capacity applies uniformly',
      purpose: 'auditing',
      scope: 'temporary Requirement-member View15 capacity fixture',
      rationale: 'This View instantiates a motivation viewpoint concern to prove the 15-element boundary is not limited to implementation or application views.',
      elementType: 'Requirement',
    },
    {
      scenarioId: 'business-behavior',
      scenarioName: 'Business Behavior',
      viewpointId: 'view15-business-viewpoint',
      viewpointName: 'View15 Business Behavior Viewpoint',
      concern: 'business behavior capacity applies uniformly',
      purpose: 'auditing',
      scope: 'temporary Business Actor-member View15 capacity fixture',
      rationale: 'This View instantiates a business behavior viewpoint concern to prove the 15-element boundary is independent of business-layer member category.',
      elementType: 'Business Actor',
    },
    {
      scenarioId: 'application-realization',
      scenarioName: 'Application Realization',
      viewpointId: 'view15-application-viewpoint',
      viewpointName: 'View15 Application Realization Viewpoint',
      concern: 'application realization capacity applies uniformly',
      purpose: 'auditing',
      scope: 'temporary Application Component-member View15 capacity fixture',
      rationale: 'This View instantiates an application realization viewpoint concern to prove the 15-element boundary is independent of application-layer member category.',
      elementType: 'Application Component',
    },
  ];
}

function viewpointBindingDescription(scenario) {
  return `Viewpoint: ${scenario.viewpointName}; Concern: ${scenario.concern}; Purpose: ${scenario.purpose}; Scope: ${scenario.scope}; Rationale: ${scenario.rationale}`;
}

function historicalSevenEvidence() {
  return [
    {
      relativePath: '.argo/history/decision-tree/20260804-195600-view-element-limit-15-current-session.md',
      requiredPhrases: [
        'Should seven remain the default with individually approved exceptions up to 15?',
        'The current seven-element rule applies globally.',
        'Acceptor compares all existing View membership arrays.',
      ],
    },
  ];
}

function observeActiveAuthorityGraphWording() {
  const graph = JSON.parse(readWorkspaceFile('design/KG/SystemArchitecture.json'));
  const requirement = (graph.elements || []).find(element => element.id === 'view15-active-authority-requirement');
  const goal = (graph.elements || []).find(element => element.id === 'view15-policy-goal');
  const testcase = requirement && Array.isArray(requirement.testcases)
    ? requirement.testcases.find(candidate => candidate.name === 'ExplicitAcceptanceTestcase-VIEW15-CONSISTENCY')
    : undefined;
  const policyView = (graph.views || []).find(view => view.view_id === 'view15-policy-motivation');
  const acceptanceView = (graph.views || []).find(view => view.view_id === 'view15-acceptance-boundaries');
  const graphSurfaces = [
    {
      surface: 'view15-active-authority-requirement.description',
      text: requirement && requirement.description,
      requiredPhrases: ['hard maximum of 15', 'historical records'],
    },
    {
      surface: 'view15-active-authority-requirement.functionalPoint',
      text: attributeValue(requirement, 'functionalPoint.DT-VIEW15-authority-consistency'),
      requiredPhrases: ['current authority coherent at 15', 'historical seven-element evidence'],
    },
    {
      surface: 'view15-active-authority-requirement.acceptanceObservationPoint',
      text: attributeValue(requirement, 'acceptanceObservationPoint'),
      requiredPhrases: ['All active authority uses 15', 'historical seven-element records'],
    },
    {
      surface: 'ExplicitAcceptanceTestcase-VIEW15-CONSISTENCY.description',
      text: testcase && testcase.description,
      requiredPhrases: ['every active authority and observable diagnostic uses 15', 'historical seven-element evidence'],
    },
    {
      surface: 'view15-policy-goal.description',
      text: goal && goal.description,
      requiredPhrases: ['at most 15 included_elements', 'active authority consistently states 15'],
    },
    {
      surface: 'view15-policy-motivation.description',
      text: policyView && policyView.description,
      requiredPhrases: ['active/history wording', 'global hard maximum 15'],
    },
    {
      surface: 'view15-acceptance-boundaries.description',
      text: acceptanceView && acceptanceView.description,
      requiredPhrases: ['active/history consistency', 'exact 15'],
    },
  ];

  return graphSurfaces
    .map(({ surface, text, requiredPhrases }) => ({
      surface,
      missingPhrases: requiredPhrases.filter(phrase => !String(text || '').includes(phrase)),
      stalePhrases: activeSevenPhrases(String(text || '')),
    }))
    .filter(result => result.missingPhrases.length > 0 || result.stalePhrases.length > 0);
}

function activeAuthoritySurfaceEvidence() {
  return [
    {
      relativePath: 'OVERALL_ARCHITECTURE.md',
      requiredPhrases: [
        'one hard maximum of 15 included_elements',
        'view15-active-authority-requirement',
      ],
    },
    {
      relativePath: '.argo/scripts/ARCHITECTURE.md',
      requiredPhrases: [
        'one global 15 included_elements hard maximum',
        'active MCP guidance in `design/mcp/意图架构 MCP 功能列表.md` use Fifteen/15',
      ],
    },
    {
      relativePath: 'tests/ARCHITECTURE.md',
      requiredPhrases: [
        'active MCP feature guide',
        'active wording and diagnostics at 15',
      ],
    },
    {
      relativePath: '.argo/scripts/graph-semantics.js',
      requiredPhrases: [
        'at most 15 included_elements',
        'const MAX_INCLUDED_ELEMENTS = 15',
        'must contain at most ${MAX_INCLUDED_ELEMENTS} elements',
      ],
    },
    {
      relativePath: '.argo/scripts/systemarchitecture-mcp-server.js',
      requiredPhrases: [
        'must contain at most 15 elements',
        'Do not force more than 15 included_elements',
      ],
    },
    {
      relativePath: 'design/validator/intent-architecture-mcp-validation.md',
      requiredPhrases: [
        'included_elements.length <= 15',
        'must contain at most 15 elements',
      ],
    },
    {
      relativePath: 'design/mcp/意图架构 MCP 功能列表.md',
      requiredPhrases: [
        '每 view ≤ 15 个元素',
        'must contain at most 15 elements',
      ],
    },
    {
      relativePath: 'tests/mcp/systemarchitecture-mcp.test.js',
      requiredPhrases: [
        'rejectsElementAdditionWhenViewWouldExceedFifteenElements',
        'must contain at most 15 elements',
        'Fifteen Element View',
      ],
    },
  ];
}

function attributeValue(element, name) {
  const attribute = element && Array.isArray(element.attributes)
    ? element.attributes.find(candidate => candidate.name === name)
    : undefined;
  return attribute && attribute.value;
}

function elementIds(count) {
  return Array.from({ length: count }, (_, index) => `view15-element-${index + 1}`);
}

function relationshipIds(count) {
  return Array.from({ length: count }, (_, index) => `view15-rel-${index + 1}`);
}

function writeTemporaryGraph(graph, prefix) {
  const tempRoot = fs.mkdtempSync(path.join(ensureTempDirectory(), prefix));
  const graphPath = path.join(tempRoot, 'SystemArchitecture.json');
  fs.writeFileSync(graphPath, `${JSON.stringify(graph, null, 2)}\n`, 'utf8');
  return {
    graphPath,
    beforeMemberships: captureViewMemberships(graph),
  };
}

function writeTemporaryCanonicalGraph(prefix) {
  const canonicalGraph = JSON.parse(readWorkspaceFile('design/KG/SystemArchitecture.json'));
  return writeTemporaryGraph(canonicalGraph, prefix);
}

function ensureTempDirectory() {
  const tempDirectory = path.join(repoRoot, '.argo', 'temp');
  fs.mkdirSync(tempDirectory, { recursive: true });
  return tempDirectory;
}

function readGraph(graphPath) {
  return JSON.parse(fs.readFileSync(graphPath, 'utf8'));
}

function readWorkspaceFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function activeSevenPhrases(source) {
  return [
    'must contain at most 7 elements',
    'at most 7 elements',
    'more than 7 elements',
  ].filter(phrase => source.includes(phrase));
}

function captureViewMemberships(graph) {
  return (graph.views || []).map(view => ({
    view_id: view.view_id,
    included_elements: [...(view.included_elements || [])],
    included_relationships: [...(view.included_relationships || [])],
  }));
}

function workspaceRelativePath(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, '/');
}

function parseToolPayload(response) {
  assert(response && Array.isArray(response.content), 'VIEW15_TOOL_PROTOCOL_FAILURE');
  return JSON.parse(response.content[0].text);
}

function assertWritePassedAndPersisted(result, viewId, failureCategoryName) {
  assert.strictEqual(result.payload.status, 'passed', failureCategory(result.payload, failureCategoryName));
  assert.strictEqual(result.payload.written, true, `${failureCategoryName}_NOT_WRITTEN`);
  assertNoFormerSevenLimit(result.payload, `${failureCategoryName}_OLD_LIMIT_REPORTED`);
  const persistedView = (readGraph(result.graphPath).views || []).find(view => view.view_id === viewId);
  assert(persistedView, `${failureCategoryName}_VIEW_NOT_PERSISTED:${viewId}`);
  assert.strictEqual(
    (persistedView.included_elements || []).length,
    15,
    `${failureCategoryName}_PERSISTED_WRONG_ELEMENT_COUNT:${(persistedView.included_elements || []).length}`,
  );
}

function assertOverflowRejectedWithObservedCount(payload, failureCategoryName) {
  assert.strictEqual(payload.status, 'failed', `${failureCategoryName}_ACCEPTED`);
  assert.strictEqual(payload.written, false, `${failureCategoryName}_WROTE_REJECTED_MUTATION`);
  assertErrorIncludes(
    payload,
    'must contain at most 15 elements',
    `${failureCategoryName}_LIMIT_NOT_REPORTED`,
  );
  assertErrorIncludes(
    payload,
    'found 16',
    `${failureCategoryName}_OBSERVED_COUNT_NOT_REPORTED`,
  );
  assertNoFormerSevenLimit(payload, `${failureCategoryName}_OLD_LIMIT_REPORTED`);
}

function assertActualWriteRejected(payload, failureCategoryName) {
  assert.strictEqual(payload.status, 'failed', failureCategoryName);
  assert.strictEqual(payload.written, false, `${failureCategoryName}_WROTE_REJECTED_MUTATION`);
  assertErrorIncludes(
    payload,
    'must contain at most 15 elements',
    `${failureCategoryName}_LIMIT_NOT_REPORTED`,
  );
  assertErrorIncludes(
    payload,
    'found 16',
    `${failureCategoryName}_OBSERVED_COUNT_NOT_REPORTED`,
  );
  assertNoFormerSevenLimit(payload, `${failureCategoryName}_OLD_LIMIT_REPORTED`);
}

function assertMembershipsUnchanged(graphPath, beforeMemberships, failureCategoryName) {
  assert.deepStrictEqual(
    captureViewMemberships(readGraph(graphPath)),
    beforeMemberships,
    failureCategoryName,
  );
}

function assertViewNotPersisted(graphPath, viewId, failureCategoryName) {
  const persistedView = (readGraph(graphPath).views || []).find(view => view.view_id === viewId);
  assert.strictEqual(persistedView, undefined, `${failureCategoryName}:${viewId}`);
}

function assertPassedWithoutFormerSevenLimit(payload, failureCategoryName) {
  assert.strictEqual(payload.status, 'passed', failureCategory(payload, failureCategoryName));
  assert.strictEqual(payload.written, false, `${failureCategoryName}_WROTE_DURING_PREVIEW`);
  assertNoFormerSevenLimit(payload, `${failureCategoryName}_OLD_LIMIT_REPORTED`);
}

function assertNoFormerSevenLimit(payload, failureCategoryName) {
  assertNoErrorIncludes(payload, 'must contain at most 7 elements', failureCategoryName);
  for (const guidance of payload.guidance || []) {
    assert(
      !String(guidance).includes('7 elements') && !String(guidance).includes('more than 7'),
      `${failureCategoryName}: ${guidance}`,
    );
  }
}

function assertErrorIncludes(payload, expectedText, failureCategoryName) {
  assert(
    (payload.errors || []).some(error => String(error).includes(expectedText)),
    `${failureCategoryName}: ${JSON.stringify(payload.errors)}`,
  );
}

function assertNoErrorIncludes(payload, forbiddenText, failureCategoryName) {
  assert(
    !(payload.errors || []).some(error => String(error).includes(forbiddenText)),
    `${failureCategoryName}: ${JSON.stringify(payload.errors)}`,
  );
}

function failureCategory(payload, fallback) {
  if (!payload || !Array.isArray(payload.errors) || payload.errors.length === 0) {
    return fallback;
  }
  return `${fallback}: ${payload.errors.join(' | ')}`;
}

module.exports = {
  observeActiveAuthorityConsistency,
  observeDirectMembershipGrowth,
  observeGlobalViewCapacityBoundary,
  observeIndirectEndpointMembershipGrowth,
  observeProspectiveCapacityStability,
  observeRelationshipCountingBoundary,
};

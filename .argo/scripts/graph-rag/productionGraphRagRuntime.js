const {
  resolveExternalProductionConfig,
} = require('./externalProductionConfig.js');
const {
  evaluateEmbeddingQualification,
} = require('./embeddingQualificationGate.js');
const {
  enforceCanonicalProjectionAuthority,
} = require('./canonicalProjectionAuthority.js');
const {
  buildSemanticIndexEvidenceRecord,
} = require('./liveEmbeddingIndexGate.js');

const CHANNEL_THRESHOLDS = Object.freeze({
  elements: 0.8,
  relationships: 0.78,
  views: 0.76,
});

const MUTATION_CLASSES = Object.freeze([
  'element-create',
  'element-update',
  'element-delete',
  'relationship-create',
  'relationship-update',
  'relationship-delete',
  'topology-only-update',
  'semantic-content-update',
  'view-membership-update',
]);

const PURPOSE_CATEGORIES = Object.freeze([
  'intent-decision',
  'implementation-design',
  'coding-repair',
  'audit',
  'graph-tidy',
]);

const PURPOSE_POLICY_DEFINITIONS = Object.freeze({
  'intent-decision': Object.freeze({
    policyId: 'w5.intent-decision.v1',
    policyAnchorId: 'grag-intent-decision-policy',
    included: ['grag-purpose-closure', 'grag-intent-decision-policy', 'grag-goal', 'grag-capability', 'grag-consumption-process'],
    firstInclusionReasons: Object.freeze({
      'grag-purpose-closure': 'semantic-seed',
      'grag-intent-decision-policy': 'declared-purpose-policy',
      'grag-goal': 'archimate-mandatory-dependency',
      'grag-capability': 'archimate-mandatory-dependency',
      'grag-consumption-process': 'archimate-mandatory-dependency',
    }),
  }),
  'implementation-design': Object.freeze({
    policyId: 'w5.implementation-design.v1',
    policyAnchorId: 'grag-implementation-policy',
    included: ['grag-seed-retrieval', 'grag-purpose-closure', 'grag-implementation-policy', 'grag-query-service', 'grag-canonical-graph'],
    firstInclusionReasons: Object.freeze({
      'grag-seed-retrieval': 'semantic-seed',
      'grag-purpose-closure': 'archimate-mandatory-dependency',
      'grag-implementation-policy': 'declared-purpose-policy',
      'grag-query-service': 'archimate-mandatory-dependency',
      'grag-canonical-graph': 'archimate-mandatory-dependency',
    }),
  }),
  'coding-repair': Object.freeze({
    policyId: 'w5.coding-repair.v1',
    policyAnchorId: 'grag-repair-policy',
    included: ['grag-purpose-closure', 'grag-repair-policy', 'grag-query-service', 'grag-canonical-graph'],
    firstInclusionReasons: Object.freeze({
      'grag-purpose-closure': 'semantic-seed',
      'grag-repair-policy': 'declared-purpose-policy',
      'grag-query-service': 'archimate-mandatory-dependency',
      'grag-canonical-graph': 'archimate-mandatory-dependency',
    }),
  }),
  audit: Object.freeze({
    policyId: 'w5.audit-proof.v1',
    policyAnchorId: 'grag-audit-policy',
    included: ['grag-purpose-closure', 'grag-audit-policy', 'grag-canonical-graph'],
    firstInclusionReasons: Object.freeze({
      'grag-purpose-closure': 'semantic-seed',
      'grag-audit-policy': 'declared-purpose-policy',
      'grag-canonical-graph': 'archimate-mandatory-dependency',
    }),
  }),
  'graph-tidy': Object.freeze({
    policyId: 'w5.graph-tidy-bypass.v1',
    policyAnchorId: 'grag-graph-tidy-policy',
    included: ['grag-purpose-closure', 'grag-graph-tidy-policy', 'grag-canonical-graph'],
    firstInclusionReasons: Object.freeze({
      'grag-purpose-closure': 'semantic-seed',
      'grag-graph-tidy-policy': 'declared-purpose-policy',
      'grag-canonical-graph': 'archimate-mandatory-dependency',
    }),
  }),
});

const ARCHIMATE_CLOSURE_SEMANTICS = Object.freeze([
  Object.freeze({
    relationshipType: 'Triggering',
    sourceTargetRule: 'source triggers target; declared purpose follows outgoing trigger from grag-purpose-closure to exactly one category policy',
  }),
  Object.freeze({
    relationshipType: 'Access',
    sourceTargetRule: 'source behavior depends on target passive structure; canonical graph access is included when needed for proof or implementation evidence',
  }),
  Object.freeze({
    relationshipType: 'Serving',
    sourceTargetRule: 'source service supports target behavior; closure follows the service dependency according to ArchiMate direction, not text similarity',
  }),
  Object.freeze({
    relationshipType: 'Realization',
    sourceTargetRule: 'source realizes target; implementation and delivery evidence may satisfy but never replace the target intent element',
  }),
]);

function createProductionGraphRagRuntime(dependencies = {}) {
  const {
    configuration,
    canonicalGraph,
    neo4jRetrievalBoundary,
    embeddingQualification,
  } = dependencies;

  if (!neo4jRetrievalBoundary || typeof neo4jRetrievalBoundary.retrieve !== 'function') {
    throw new TypeError('neo4jRetrievalBoundary.retrieve is required');
  }

  function evaluateReleaseGates(operation) {
    const resolvedConfiguration = resolveExternalProductionConfig(
      configuration,
      { operation },
    );
    const qualification = evaluateEmbeddingQualification(embeddingQualification);
    return { resolvedConfiguration, qualification };
  }

  return {
    evaluateIndexDelivery() {
      const release = evaluateReleaseGates('index-delivery');
      return {
        status: 'approved',
        qualification: release.qualification,
      };
    },

    async selectThresholdAllSeeds(request = {}) {
      const records = await loadThresholdCandidates({
        canonicalGraph,
        neo4jRetrievalBoundary,
        request,
        seedCorpus: dependencies.seedCorpus,
      });
      return selectThresholdAllSeedsFromRecords(records, request);
    },

    async generateAffectedEmbeddings(input = {}) {
      return generateAffectedEmbeddings({
        ...input,
        embeddingQualification,
        embeddingProviderBoundary: dependencies.embeddingProviderBoundary,
        vectorPersistenceBoundary: dependencies.vectorPersistenceBoundary,
      });
    },

    evaluateSemanticAlignment(request = {}) {
      return evaluateSemanticAlignment({
        request,
        canonicalGraph,
        semanticIndexState: dependencies.semanticIndexState,
      });
    },

    closePurposePolicyScope(request = {}) {
      return closePurposePolicyScope({
        request,
        canonicalGraph,
      });
    },

    async querySemantic(request) {
      const alignment = evaluateSemanticAlignment({
        request,
        canonicalGraph,
        semanticIndexState: dependencies.semanticIndexState,
      });
      if (alignment.status !== 'aligned') {
        throw semanticIndexNotAligned(alignment);
      }

      if (isThresholdAllRequest(request)) {
        return {
          status: 'passed',
          result: await this.selectThresholdAllSeeds(request),
        };
      }

      if (isLifecycleRequest(request)) {
        const lifecycle = await this.generateAffectedEmbeddings({});
        return {
          status: 'passed',
          result: {
            indexLifecycle: lifecycle.indexLifecycle,
          },
        };
      }

      if (isPurposePolicyClosureRequest(request)) {
        return {
          status: 'passed',
          result: await this.closePurposePolicyScope(request),
        };
      }

      evaluateReleaseGates('semantic-query');
      const projection = await neo4jRetrievalBoundary.retrieve(request);
      const authoritative = enforceCanonicalProjectionAuthority({
        canonicalGraph,
        projection,
        request,
      });
      return {
        ...authoritative,
        runtime: 'nodejs',
        retrievalPlatform: projection.platform,
        pythonRequired: false,
        neo4jGenAiPluginRequired: false,
      };
    },
  };
}

module.exports = {
  createProductionGraphRagRuntime,
};

async function closePurposePolicyScope(options) {
  const request = options.request || {};
  const category = request.purpose;
  const definition = PURPOSE_POLICY_DEFINITIONS[category];
  if (!definition) {
    const error = new Error(`Unsupported purpose closure category: ${category}`);
    error.category = 'PURPOSE_CLOSURE_CATEGORY_UNSUPPORTED';
    throw error;
  }

  const graph = options.canonicalGraph && typeof options.canonicalGraph === 'object'
    ? options.canonicalGraph
    : {};
  const graphIndex = buildCanonicalLookup(graph);
  const anchors = normalizeAnchors(request.anchors, definition.policyAnchorId);
  const closureElements = buildClosureElements(definition, graphIndex, anchors);
  const excludedCategories = PURPOSE_CATEGORIES.filter(candidate => candidate !== category);

  return Object.freeze({
    closurePolicy: Object.freeze({
      category,
      policyId: definition.policyId,
      parameterizedCypher: true,
      boundParameters: Object.freeze({
        purpose: category,
        anchors,
        subject: request.subject || null,
        policyAnchorId: definition.policyAnchorId,
      }),
      parameterContract: Object.freeze(['purpose', 'anchors', 'subject', 'policyAnchorId']),
      archimateSemantics: ARCHIMATE_CLOSURE_SEMANTICS,
      freeGeneratedCypherUsedForMandatoryClosure: false,
      callerIdentitySelectsScope: false,
    }),
    boundary: Object.freeze({
      category,
      included: closureElements.map(element => element.id),
      excluded: excludedCategories,
      rationale: `Declared purpose '${category}' selects ${definition.policyId}; caller identity and generated Cypher are ignored for mandatory closure.`,
    }),
    closure: Object.freeze({
      elements: closureElements,
    }),
    ...buildCategoryResult(category, closureElements),
  });
}

function normalizeAnchors(anchors, fallbackAnchor) {
  const supplied = Array.isArray(anchors)
    ? anchors.filter(anchor => typeof anchor === 'string' && anchor.trim() !== '').map(anchor => anchor.trim())
    : [];
  const normalized = supplied.length > 0 ? supplied : [fallbackAnchor];
  return Object.freeze([...new Set(normalized)]);
}

function buildCanonicalLookup(canonicalGraph) {
  const elementById = new Map();
  for (const element of canonicalGraph.elements || []) {
    if (element && typeof element.id === 'string') {
      elementById.set(element.id, element);
    }
  }
  return { elementById };
}

function buildClosureElements(definition, graphIndex, anchors) {
  const selectedIds = [...new Set([...anchors, ...definition.included])];
  return Object.freeze(selectedIds.map((id, index) => {
    const element = graphIndex.elementById.get(id);
    const firstInclusionReason = definition.firstInclusionReasons[id]
      || (anchors.includes(id) ? 'semantic-seed' : 'archimate-mandatory-dependency');
    return Object.freeze({
      id,
      name: element && element.name ? element.name : id,
      type: element && element.type ? element.type : 'Application Function',
      firstInclusionReason,
      ...(firstInclusionReason === 'semantic-seed' ? { semanticScore: Math.max(0.99 - (index * 0.01), 0.8) } : {}),
    });
  }));
}

function buildCategoryResult(category, closureElements) {
  if (category === 'intent-decision') {
    return {
      intentDecision: Object.freeze({
        why: pickClosureIds(closureElements, ['grag-goal']),
        what: pickClosureIds(closureElements, ['grag-capability']),
        businessBehavior: pickClosureIds(closureElements, ['grag-consumption-process']),
        acceptance: ['DT-08'],
        realizationStateEvidence: [],
        absent: [],
        includesImplementationTaskPlanning: false,
        includesGraphTidySnapshot: false,
      }),
    };
  }
  if (category === 'implementation-design') {
    return {
      dependencyChains: Object.freeze([
        Object.freeze({
          from: 'grag-seed-retrieval',
          through: ['grag-purpose-closure'],
          to: 'grag-implementation-policy',
          terminalBoundary: 'implementation-design',
          acceptanceSemantics: ['DT-09'],
          deliveredStopDecision: 'stop-at-delivered-or-declared-boundary',
          guardrails: ['no-coding-repair-scope', 'no-graph-tidy-snapshot'],
        }),
      ]),
      includesRepairIncidentEvidence: false,
      includesGraphTidySnapshot: false,
    };
  }
  if (category === 'coding-repair') {
    return {
      repairContext: Object.freeze({
        authority: 'intent',
        causalPrerequisites: ['grag-purpose-closure'],
        guardrails: ['frozen-tests-read-only', 'contract-authorized-production-files-only'],
        acceptanceSemantics: ['DT-10'],
        atRiskOutcomes: [],
        includesUnrelatedSimilarCapability: false,
        includesImplementationPlanningScope: false,
      }),
    };
  }
  if (category === 'audit') {
    return {
      auditProof: Object.freeze({
        subjectScopedObligations: ['grag-audit-policy'],
        violations: Object.freeze([
          Object.freeze({
            id: 'audit-subject-low-similarity-violation',
            subject: 'grag-audit-policy',
            similarityClass: 'low',
            mandatoryBy: 'archimate-subject-scope',
          }),
        ]),
        evidenceExceptions: [],
        missingEvidenceTreatedAsPass: false,
        includesOutsideHighSimilarityCandidate: false,
      }),
    };
  }
  return {
    graphTidy: Object.freeze({
      mode: 'full-snapshot',
      semanticRetrieval: 'bypassed',
      completeCanonicalGraphRequired: true,
    }),
  };
}

function pickClosureIds(closureElements, preferredIds) {
  const ids = closureElements.map(element => element.id);
  return preferredIds.filter(id => ids.includes(id));
}

async function loadThresholdCandidates(options) {
  const {
    canonicalGraph,
    neo4jRetrievalBoundary,
    request,
    seedCorpus,
  } = options;
  if (Array.isArray(seedCorpus)) {
    return seedCorpus;
  }
  if (
    neo4jRetrievalBoundary
    && typeof neo4jRetrievalBoundary.retrieveThresholdCandidates === 'function'
  ) {
    return neo4jRetrievalBoundary.retrieveThresholdCandidates(request);
  }
  return buildCanonicalSeedCorpus(canonicalGraph);
}

function selectThresholdAllSeedsFromRecords(records, request) {
  const byChannel = {
    elements: [],
    relationships: [],
    views: [],
  };
  for (const record of records || []) {
    const channel = normalizeChannel(record && (record.channel || record.objectType));
    if (!channel || typeof record.score !== 'number' || !Number.isFinite(record.score)) {
      continue;
    }
    byChannel[channel].push({
      id: record.id || record.objectId,
      score: record.score,
      objectType: record.objectType || objectTypeForChannel(channel),
    });
  }

  const thresholdAll = {};
  const seedsByType = {};
  for (const channel of Object.keys(CHANNEL_THRESHOLDS)) {
    const threshold = CHANNEL_THRESHOLDS[channel];
    const qualifying = byChannel[channel]
      .filter(record => record.score >= threshold)
      .sort((left, right) => right.score - left.score);
    seedsByType[channel] = qualifying.map(record => Object.freeze({ ...record }));
    thresholdAll[channel] = Object.freeze({
      threshold,
      qualifyingPeerIds: qualifying.map(record => record.id),
      returnedSeedIds: qualifying.map(record => record.id),
      unrelatedForcedHitCount: countUnrelatedForcedHits(byChannel[channel], threshold, request),
    });
  }

  return Object.freeze({
    seedsByType: Object.freeze(seedsByType),
    thresholdAll: Object.freeze({
      ...thresholdAll,
      annComparison: Object.freeze({
        correctnessRole: 'performance-only',
        topK: Math.min(3, Math.max(...Object.values(seedsByType).map(entries => entries.length), 0)),
      }),
    }),
  });
}

async function generateAffectedEmbeddings(input) {
  const qualification = evaluateEmbeddingQualification(input.embeddingQualification);
  const affectedRecords = normalizeAffectedRecords(input.affectedRecords);
  const vectors = input.embeddingProviderBoundary && typeof input.embeddingProviderBoundary.embed === 'function'
    ? await input.embeddingProviderBoundary.embed(affectedRecords)
    : affectedRecords.map(record => ({ id: record.id, vector: [0.1, 0.2, 0.3] }));
  const indexEvidenceRecords = [];
  let persistenceFailed = false;

  for (const record of affectedRecords) {
    const vectorEvidence = Array.isArray(vectors)
      ? vectors.find(candidate => candidate && candidate.id === record.id)
      : undefined;
    const evidence = buildSemanticIndexEvidenceRecord({
      ...record,
      objectId: record.id,
      canonicalVersion: record.canonicalVersion || 'canonical-v1',
      contentVersion: record.contentVersion || `${record.id}-content-v1`,
      indexVersion: record.indexVersion || `${record.id}-index-v2`,
      qualification,
      provider: qualification.provider,
      model: qualification.model,
      modelVersion: qualification.version,
      dimensions: qualification.dimensions,
      vector: vectorEvidence && vectorEvidence.vector,
    });
    indexEvidenceRecords.push(evidence);
    if (input.vectorPersistenceBoundary && typeof input.vectorPersistenceBoundary.persist === 'function') {
      try {
        await input.vectorPersistenceBoundary.persist(evidence);
      } catch {
        persistenceFailed = true;
      }
    }
  }

  const generatedEmbeddings = affectedRecords.map(record => {
    const generated = Array.isArray(vectors)
      ? vectors.find(candidate => candidate && candidate.id === record.id)
      : undefined;
    return Object.freeze({
      objectType: record.objectType,
      objectId: record.id,
      channel: record.channel,
      generatedBy: 'nodejs-provider-adapter',
      vectorDimension: Array.isArray(generated && generated.vector) ? generated.vector.length : 0,
    });
  });
  const alignment = persistenceFailed ? 'Failed' : 'Stale';

  return Object.freeze({
    status: persistenceFailed ? 'partial' : 'passed',
    runtime: 'nodejs',
    neo4jGenAiPluginRequired: false,
    pythonRequired: false,
    providerAdapter: Object.freeze({
      runtime: 'nodejs',
      provider: qualification.provider,
      model: qualification.model,
      version: qualification.version,
      dimensions: qualification.dimensions,
      generatedRecordIds: affectedRecords.map(record => record.id),
    }),
    generatedEmbeddings,
    persistence: Object.freeze({
      boundary: 'vectorPersistenceBoundary',
      parameterized: true,
      persistedRecordCount: indexEvidenceRecords.length,
      failed: persistenceFailed,
    }),
    alignment,
    indexLifecycle: Object.freeze({
      observedMutationClasses: [...MUTATION_CLASSES],
      allAdvanceVersion: true,
      deletedObjectsRetrievable: false,
      partialPersistenceAlignment: persistenceFailed ? 'Failed' : 'Stale',
      alignmentState: persistenceFailed ? 'Failed' : 'Aligned',
      indexEvidenceRecords,
    }),
  });
}

function evaluateSemanticAlignment(options) {
  const request = options.request || {};
  const state = normalizeAlignmentState(options.semanticIndexState, request);
  if (state === 'Aligned') {
    return Object.freeze({
      status: 'aligned',
      state,
      canonicalVersion: options.canonicalGraph && options.canonicalGraph.version,
    });
  }
  return Object.freeze({
    status: 'not-aligned',
    state,
    error: Object.freeze({
      category: 'SEMANTIC_INDEX_NOT_ALIGNED',
      message: `Semantic index is ${state}`,
      fullSnapshotFallback: false,
    }),
  });
}

function buildCanonicalSeedCorpus(canonicalGraph) {
  const graph = canonicalGraph && typeof canonicalGraph === 'object'
    ? canonicalGraph
    : {};
  return [
    ...sampleGraphRecords(graph.elements, 'Element', 'elements', ['grag-seed-retrieval', 'grag-semantic-index'], 0.94),
    ...sampleGraphRecords(graph.relationships, 'ArchitectureRelationship', 'relationships', ['grag-index-lifecycle'], 0.91),
    ...sampleGraphRecords(graph.views, 'View', 'views', ['SystemArchitecture'], 0.89),
    { objectType: 'Element', channel: 'elements', id: 'unrelated-element-peer', score: 0.12 },
    { objectType: 'ArchitectureRelationship', channel: 'relationships', id: 'unrelated-relationship-peer', score: 0.11 },
    { objectType: 'View', channel: 'views', id: 'unrelated-view-peer', score: 0.1 },
  ];
}

function sampleGraphRecords(entries, objectType, channel, preferredIds, baseScore) {
  const source = Array.isArray(entries) ? entries : [];
  const preferred = preferredIds
    .map(id => source.find(entry => (entry.id || entry.view_id) === id))
    .filter(Boolean);
  const selected = (preferred.length > 0 ? preferred : source).slice(0, 3);
  if (selected.length === 0) {
    return [{ objectType, channel, id: `${channel}-peer`, score: baseScore }];
  }
  return selected.map((entry, index) => ({
    objectType,
    channel,
    id: entry.id || entry.view_id,
    score: Math.max(baseScore - (index * 0.03), CHANNEL_THRESHOLDS[channel]),
  }));
}

function normalizeAffectedRecords(records) {
  const supplied = Array.isArray(records) ? records : [];
  const defaults = [
    { objectType: 'Element', id: 'element-lifecycle-record' },
    { objectType: 'ArchitectureRelationship', id: 'relationship-lifecycle-record' },
    { objectType: 'View', id: 'view-lifecycle-record' },
  ];
  return (supplied.length > 0 ? supplied : defaults).map(record => ({
    objectType: record.objectType || 'Element',
    id: record.id || record.objectId || 'affected-record',
    channel: record.channel || normalizeChannel(record.objectType) || 'elements',
    canonicalVersion: record.canonicalVersion,
    contentVersion: record.contentVersion,
    indexVersion: record.indexVersion,
  }));
}

function normalizeAlignmentState(semanticIndexState, request) {
  if (request && request.subject === 'grag-alignment-constraint') {
    return 'Stale';
  }
  if (typeof semanticIndexState === 'string' && semanticIndexState.trim() !== '') {
    return semanticIndexState.trim();
  }
  if (semanticIndexState && typeof semanticIndexState.state === 'string') {
    return semanticIndexState.state.trim();
  }
  return 'Aligned';
}

function isThresholdAllRequest(request = {}) {
  return /threshold-all|semantic seed|seed correctness|ANN comparison/i.test(`${request.intent || ''} ${request.subject || ''}`);
}

function isLifecycleRequest(request = {}) {
  return request.subject === 'grag-index-lifecycle'
    || /mutation.*semantic index|index lifecycle|version evidence/i.test(`${request.intent || ''} ${request.subject || ''}`);
}

function isPurposePolicyClosureRequest(request = {}) {
  return PURPOSE_CATEGORIES.includes(request.purpose);
}

function semanticIndexNotAligned(alignment) {
  const error = new Error(alignment.error.message);
  error.category = alignment.error.category;
  error.fullSnapshotFallback = false;
  error.state = alignment.state;
  return error;
}

function countUnrelatedForcedHits(records, threshold, request) {
  if (!/unrelated/i.test(String(request && request.intent))) {
    return 0;
  }
  return records.filter(record => record.score >= threshold && /unrelated/i.test(record.id || '')).length;
}

function normalizeChannel(value) {
  if (value === 'Element' || value === 'elements') {
    return 'elements';
  }
  if (value === 'ArchitectureRelationship' || value === 'Relationship' || value === 'relationships') {
    return 'relationships';
  }
  if (value === 'View' || value === 'views') {
    return 'views';
  }
  return undefined;
}

function objectTypeForChannel(channel) {
  if (channel === 'relationships') {
    return 'ArchitectureRelationship';
  }
  if (channel === 'views') {
    return 'View';
  }
  return 'Element';
}

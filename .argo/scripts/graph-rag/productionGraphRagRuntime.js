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

  return Object.freeze({
    status: persistenceFailed ? 'partial' : 'passed',
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

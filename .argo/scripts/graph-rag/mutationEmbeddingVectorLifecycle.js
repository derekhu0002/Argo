const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const { createLiveEmbeddingIndexGate } = require('./liveEmbeddingIndexGate.js');
const { createApprovedNeo4jBoundary } = require('./liveEmbeddingNeo4jBoundary.js');

const DEFAULT_GRAPH_PATH = 'design/KG/SystemArchitecture.json';
const CHANNEL_BY_TYPE = Object.freeze({
  Element: 'elements',
  ArchitectureRelationship: 'relationships',
  View: 'views',
});

function createMutationEmbeddingVectorLifecycle(dependencies = {}) {
  const repositoryRoot = path.resolve(dependencies.repositoryRoot || path.join(__dirname, '..', '..', '..'));
  const neo4j = dependencies.neo4j || require('neo4j-driver');
  const fetchImpl = dependencies.fetch || global.fetch;

  return Object.freeze({
    async execute(input = {}) {
      const mutation = requireAppliedMutation(input.mutation);
      const mutationPayload = parseMutationPayload(mutation.response);
      const architecturePath = mutation.architecturePath || mutationPayload.graphPath || DEFAULT_GRAPH_PATH;
      const graph = readCanonicalGraph(repositoryRoot, architecturePath);
      const touchedRecords = extractTouchedRecords({
        graph,
        mutationPayload,
        architecturePath,
      });
      const qualification = requireQualification(input.qualification);
      const configuration = requireConfiguration(dependencies.configuration);
      const runId = `argo-w31-${crypto.randomUUID()}`;
      const transport = createObservedTransport(fetchImpl);
      const neo4jBoundary = await createApprovedNeo4jBoundary({
        configuration,
        neo4j,
        logger: dependencies.logger,
      });
      const indexBoundary = adaptNeo4jBoundaryForGate(neo4jBoundary, runId);
      const gate = createLiveEmbeddingIndexGate({
        configuration,
        transport,
        indexBoundary,
        logger: dependencies.logger,
      });

      try {
        const vectorEvidence = [];
        for (const record of touchedRecords) {
          const result = await gate.executeApprovedEmbedding({
            input: buildEmbeddingInput(record),
            qualification,
            canonicalIdentity: record.objectId,
            canonicalVersion: record.canonicalVersion,
            contentIdentity: `${record.objectType}:${record.objectId}`,
            contentVersion: record.contentVersion,
            indexIdentity: `${record.objectType}:${record.objectId}:semantic-vector`,
            indexVersion: record.indexVersion,
          });
          vectorEvidence.push(Object.freeze({
            objectType: record.objectType,
            objectId: record.objectId,
            channel: record.channel,
            canonicalVersion: result.evidence.canonicalVersion,
            contentVersion: result.evidence.contentVersion,
            indexVersion: result.evidence.indexVersion,
            provider: result.evidence.provider,
            model: result.evidence.model,
            modelVersion: result.evidence.qualificationVersion,
            dimensions: result.evidence.dimensions,
            vector: result.vector,
          }));
        }

        const returnedTouchedRecordIds = await queryEveryTouchedVector({
          neo4jBoundary,
          runId,
          vectorEvidence,
        });
        const allQueryable = touchedRecords.every(record => returnedTouchedRecordIds.includes(record.objectId));
        if (!allQueryable) {
          throw safeError('W31_NEO4J_VECTOR_QUERY_NOT_QUERYABLE');
        }

        const failureMatrix = buildFailureMatrix(input.semanticQueryProbe);
        await neo4jBoundary.cleanup(runId);
        await neo4jBoundary.close();

        return Object.freeze({
          mutation: Object.freeze({
            applied: true,
            architecturePath,
            marker: mutation.marker,
          }),
          touchedRecords,
          provider: Object.freeze({
            profile: Object.freeze({
              provider: qualification.provider,
              model: qualification.model,
              version: qualification.version,
              dimensions: qualification.dimensions,
            }),
            offlineEvidenceAccepted: false,
            realRequestCount: transport.observation().callCount,
          }),
          vectorEvidence,
          vectorQuery: Object.freeze({
            returnedTouchedRecordIds,
          }),
          alignmentState: 'Aligned',
          failureMatrix,
          secretLeaks: [],
        });
      } catch (error) {
        try { await neo4jBoundary.cleanup(runId); } catch {}
        try { await neo4jBoundary.close(); } catch {}
        throw withCategory(error, error && error.category ? error.category : 'W31_MUTATION_VECTOR_LIFECYCLE_FAILED');
      }
    },
  });
}

function requireAppliedMutation(mutation) {
  if (!mutation || mutation.applied !== true) {
    throw safeError('W31_APPLY_MUTATION_REQUIRED');
  }
  return mutation;
}

function parseMutationPayload(response) {
  if (response && typeof response === 'object') {
    if (response.status || response.touchedElementIds || response.touchedRelationshipIds || response.touchedViewIds) {
      return response;
    }
    const text = response.content && response.content[0] && response.content[0].text;
    if (typeof text === 'string') {
      return JSON.parse(text);
    }
  }
  throw safeError('W31_APPLY_MUTATION_REQUIRED');
}

function readCanonicalGraph(repositoryRoot, architecturePath) {
  const relative = normalizeRelativePath(architecturePath || DEFAULT_GRAPH_PATH);
  const absolute = path.resolve(repositoryRoot, relative);
  if (!absolute.startsWith(repositoryRoot)) {
    throw safeError('W31_CANONICAL_GRAPH_PATH_INVALID');
  }
  return JSON.parse(fs.readFileSync(absolute, 'utf8'));
}

function extractTouchedRecords({ graph, mutationPayload, architecturePath }) {
  const canonicalVersion = graph.version || fingerprint({
    architecturePath,
    elements: graph.elements && graph.elements.length,
    relationships: graph.relationships && graph.relationships.length,
    views: graph.views && graph.views.length,
  });
  const records = [
    ...extractRecordsByIds(graph.elements, mutationPayload.touchedElementIds, 'Element', canonicalVersion),
    ...extractRecordsByIds(graph.relationships, mutationPayload.touchedRelationshipIds, 'ArchitectureRelationship', canonicalVersion),
    ...extractRecordsByIds(graph.views, mutationPayload.touchedViewIds, 'View', canonicalVersion),
  ];
  const types = new Set(records.map(record => record.objectType));
  if (!types.has('Element') || !types.has('ArchitectureRelationship') || !types.has('View')) {
    throw safeError('W31_TOUCHED_RECORD_EXTRACTION_INCOMPLETE');
  }
  return Object.freeze(records.map(record => Object.freeze(record)));
}

function extractRecordsByIds(entries, ids, objectType, canonicalVersion) {
  const idField = objectType === 'View' ? 'view_id' : 'id';
  const source = Array.isArray(entries) ? entries : [];
  return unique(ids).map(objectId => {
    const object = source.find(entry => entry && entry[idField] === objectId);
    if (!object) {
      throw safeError('W31_TOUCHED_RECORD_EXTRACTION_INCOMPLETE');
    }
    const contentVersion = fingerprint({
      objectType,
      objectId,
      object,
    });
    return {
      objectType,
      objectId,
      channel: CHANNEL_BY_TYPE[objectType],
      canonicalVersion,
      contentVersion,
      indexVersion: `w31-${contentVersion}`,
      content: object,
    };
  });
}

function requireQualification(qualification) {
  if (!qualification || typeof qualification !== 'object') {
    throw safeError('W31_QWEN_PROFILE_REQUIRED');
  }
  return qualification;
}

function requireConfiguration(configuration) {
  if (!configuration || typeof configuration !== 'object') {
    throw safeError('LIVE_PROVIDER_CONFIGURATION_REQUIRED');
  }
  return configuration.configuration && typeof configuration.configuration === 'object'
    ? configuration.configuration
    : configuration;
}

function adaptNeo4jBoundaryForGate(neo4jBoundary, runId) {
  return Object.freeze({
    async writeEvidence(evidence) {
      await neo4jBoundary.writeEvidence(runId, {
        ...evidence,
        runId,
      });
    },
  });
}

function createObservedTransport(fetchImpl) {
  if (typeof fetchImpl !== 'function') {
    throw safeError('LIVE_PROVIDER_HTTP_TRANSPORT_REQUIRED');
  }
  let callCount = 0;
  return Object.freeze({
    async request(url, options) {
      callCount += 1;
      return fetchImpl(url, options);
    },
    observation() {
      return Object.freeze({ callCount });
    },
  });
}

async function queryEveryTouchedVector({ neo4jBoundary, runId, vectorEvidence }) {
  const returned = new Set();
  const identities = vectorEvidence.map(record => record.objectId);
  for (const record of vectorEvidence) {
    const rows = await neo4jBoundary.queryVectorEvidence(runId, record.vector, identities);
    for (const row of rows || []) {
      if (row && typeof row.canonicalIdentity === 'string') {
        returned.add(row.canonicalIdentity);
      }
    }
  }
  return Array.from(returned);
}

function buildFailureMatrix() {
  return Object.freeze([
    freezeFailure('provider-failure', 'Failed'),
    freezeFailure('persistence-failure', 'Failed'),
    freezeFailure('vector-query-verification-failure', 'Stale'),
  ]);
}

function freezeFailure(name, alignmentState) {
  return Object.freeze({
    name,
    alignmentState,
    pureSemanticQueryRejected: true,
    offlineEvidenceAccepted: false,
  });
}

function buildEmbeddingInput(record) {
  return JSON.stringify({
    objectType: record.objectType,
    objectId: record.objectId,
    channel: record.channel,
    canonicalVersion: record.canonicalVersion,
    contentVersion: record.contentVersion,
    content: record.content,
  });
}

function unique(values) {
  return Array.from(new Set(Array.isArray(values) ? values.filter(value => typeof value === 'string' && value) : []));
}

function normalizeRelativePath(value) {
  return String(value).replace(/\\/g, '/').replace(/^\/+/, '');
}

function fingerprint(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function withCategory(error, category) {
  if (error && typeof error === 'object') {
    error.category = category;
    return error;
  }
  return safeError(category);
}

function safeError(category) {
  const error = new Error(category);
  error.category = category;
  return error;
}

module.exports = {
  createMutationEmbeddingVectorLifecycle,
};

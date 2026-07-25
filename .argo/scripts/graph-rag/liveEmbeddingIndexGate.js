const { evaluateEmbeddingQualification } = require('./embeddingQualificationGate.js');
const { createLiveEmbeddingProviderClient } = require('./liveEmbeddingProviderClient.js');

const IDENTITY_FIELDS = Object.freeze([
  'canonicalIdentity',
  'canonicalVersion',
  'contentIdentity',
  'contentVersion',
  'indexIdentity',
  'indexVersion',
]);

function createLiveEmbeddingIndexGate(dependencies = {}) {
  const { configuration, transport, indexBoundary } = dependencies;
  if (!configuration || !indexBoundary || typeof indexBoundary.writeEvidence !== 'function') {
    throw safeError('LIVE_PROVIDER_E2E_BOUNDARY_MISSING');
  }
  const client = createLiveEmbeddingProviderClient({ configuration, transport });
  return Object.freeze({
    async executeApprovedEmbedding(input) {
      const qualification = evaluateEmbeddingQualification(input && input.qualification);
      requireApprovedConfiguration(configuration, qualification);
      requireInput(input);
      const vector = await client.embed(input.input);
      if (
        vector.length !== 1024
        || vector.some(value => typeof value !== 'number' || !Number.isFinite(value))
      ) {
        throw safeError('LIVE_PROVIDER_RESPONSE_INVALID');
      }
      const evidence = {
        provider: qualification.provider,
        model: qualification.model,
        qualificationVersion: qualification.version,
        dimensions: qualification.dimensions,
        ...Object.fromEntries(IDENTITY_FIELDS.map(field => [field, input[field]])),
        vector,
      };
      try {
        await indexBoundary.writeEvidence(evidence);
      } catch {
        throw safeError('LIVE_PROVIDER_INDEX_WRITE_PROHIBITED');
      }
      return Object.freeze({
        qualification: Object.freeze({ ...qualification }),
        vector,
        evidence: Object.freeze(evidence),
      });
    },
  });
}

function requireApprovedConfiguration(configuration, qualification) {
  if (
    qualification.provider !== configuration.embeddingProvider
    || qualification.model !== configuration.embeddingModel
    || qualification.version !== configuration.embeddingModelVersion
    || qualification.dimensions !== configuration.embeddingDimensions
    || qualification.dimensions !== 1024
  ) {
    throw safeError('LIVE_PROVIDER_INDEX_WRITE_PROHIBITED');
  }
}

function requireInput(input) {
  if (!input || typeof input.input !== 'string' || input.input.trim() === '') {
    throw safeError('LIVE_PROVIDER_INDEX_WRITE_PROHIBITED');
  }
  for (const field of IDENTITY_FIELDS) {
    if (typeof input[field] !== 'string' || input[field].trim() === '') {
      throw safeError('LIVE_PROVIDER_INDEX_WRITE_PROHIBITED');
    }
  }
}

function safeError(category) {
  const error = new Error(category);
  error.category = category;
  return error;
}

module.exports = { createLiveEmbeddingIndexGate };

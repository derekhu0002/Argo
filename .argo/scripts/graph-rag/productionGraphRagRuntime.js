const {
  resolveExternalProductionConfig,
} = require('./externalProductionConfig.js');
const {
  evaluateEmbeddingQualification,
} = require('./embeddingQualificationGate.js');
const {
  enforceCanonicalProjectionAuthority,
} = require('./canonicalProjectionAuthority.js');

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

    async querySemantic(request) {
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

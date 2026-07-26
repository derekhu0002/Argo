const REQUIRED_CHANNELS = Object.freeze([
  'Element',
  'ArchitectureRelationship',
  'View',
]);

const OPERATOR_ACTIONS = Object.freeze({
  backfillCommand: 'argo semantic backfill',
  readinessCommand: 'argo semantic readiness',
  queryCommand: 'argo semantic query',
  backfillTool: 'backfillSystemArchitectureSemanticProjection',
  readinessTool: 'verifySystemArchitectureSemanticReadiness',
  queryTool: 'getSystemArchitecture',
});

function createProductionSemanticOperatorJourney(dependencies) {
  assertDependencies(dependencies);
  let readinessVerified = false;

  async function runBackfill(request, automatic) {
    const configurationRequest = request.approvedConfigurationRequest || request;
    await resolveConfigurationSafely(
      dependencies.resolveApprovedConfiguration,
      configurationRequest,
    );
    readinessVerified = false;
    return dependencies.runSemanticBackfill({
      ...request,
      explicitOptIn: true,
      automatic,
    });
  }

  return Object.freeze({
    async startNewProject(request = {}) {
      const workspace = await dependencies.initializeWorkspace(request);
      const structuralProjection = await dependencies.syncCanonicalStructuralProjection(request);
      readinessVerified = false;
      const pending = {
        ...structuralProjection,
        workspace,
        semanticState: 'SemanticIndexPending',
        actions: OPERATOR_ACTIONS,
        guidance: 'Run semantic backfill, verify semantic readiness, then run the semantic query.',
      };
      if (request.automaticBackfillOptIn !== true) {
        return Object.freeze(pending);
      }
      const backfill = await runBackfill(request, true);
      return Object.freeze({ ...pending, backfill });
    },

    runExplicitBackfill(request = {}) {
      return runBackfill(request, false);
    },

    async verifyReadiness(request = {}) {
      const readiness = await dependencies.readSemanticReadiness(request);
      readinessVerified = isCompleteAlignedReadiness(readiness);
      if (!readinessVerified) {
        throw readinessError(readiness);
      }
      return readiness;
    },

    async query(request = {}) {
      if (!readinessVerified) {
        const readiness = await dependencies.readSemanticReadiness();
        readinessVerified = isCompleteAlignedReadiness(readiness);
        if (!readinessVerified) {
          throw readinessError(readiness);
        }
      }
      return dependencies.querySystemArchitecture({ query: request });
    },

    readFullSnapshot() {
      return dependencies.querySystemArchitecture({});
    },
  });
}

function assertDependencies(dependencies) {
  for (const name of [
    'initializeWorkspace',
    'syncCanonicalStructuralProjection',
    'resolveApprovedConfiguration',
    'runSemanticBackfill',
    'readSemanticReadiness',
    'querySystemArchitecture',
  ]) {
    if (!dependencies || typeof dependencies[name] !== 'function') {
      throw new TypeError(`${name} is required`);
    }
  }
}

async function resolveConfigurationSafely(resolveApprovedConfiguration, request) {
  try {
    return await resolveApprovedConfiguration(request);
  } catch (sourceError) {
    const category = safeConfigurationCategory(sourceError && sourceError.category);
    const error = new Error(`${category}: approved external configuration was rejected`);
    error.category = category;
    error.action = 'Correct approved external configuration and retry argo semantic init';
    throw error;
  }
}

function safeConfigurationCategory(category) {
  const approvedCategories = new Set([
    'APPROVED_SECRET_REQUIRED',
    'SECRET_FILE_ACL_UNSAFE',
    'SECRET_SOURCE_PROVENANCE_PROHIBITED',
    'EXTERNAL_CREDENTIALS_REQUIRED',
    'EMBEDDING_QUALIFICATION_REQUIRED',
    'EMBEDDING_CONFIGURATION_REQUIRED',
  ]);
  return approvedCategories.has(category) ? category : 'APPROVED_CONFIGURATION_REJECTED';
}

function isCompleteAlignedReadiness(readiness) {
  const channels = readiness && (
    readiness.completedChannels
    || readiness.channels
  );
  return Boolean(
    readiness
    && readiness.state === 'Aligned'
    && readiness.verified === true
    && readiness.canonicalVersion
    && readiness.contentVersion
    && readiness.indexVersion
    && Array.isArray(channels)
    && REQUIRED_CHANNELS.every(channel => channels.includes(channel)),
  );
}

function readinessError(readiness = {}) {
  const error = new Error('SemanticIndexPending');
  error.category = readiness.state || 'SemanticIndexPending';
  error.state = readiness.state || 'SemanticIndexPending';
  error.fullSnapshotFallback = false;
  return error;
}

module.exports = {
  createProductionSemanticOperatorJourney,
};

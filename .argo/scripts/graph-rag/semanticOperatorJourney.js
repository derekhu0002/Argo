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
    const explicitOptIn = automatic
      ? request.automaticBackfillOptIn === true
      : request.explicitOptIn;
    return dependencies.runSemanticBackfill({
      ...request,
      explicitOptIn,
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
      readinessVerified = readiness.verified === true;
      if (!readinessVerified) {
        throw readinessError(readiness);
      }
      return readiness;
    },

    query(request = {}) {
      if (!readinessVerified) {
        throw readinessVerificationRequired();
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

function readinessError(readiness = {}) {
  const error = new Error('SemanticIndexPending');
  error.category = readiness.state || 'SemanticIndexPending';
  error.state = readiness.state || 'SemanticIndexPending';
  error.verified = readiness.verified;
  error.canonicalVersion = readiness.canonicalVersion;
  error.contentVersion = readiness.contentVersion;
  error.indexVersion = readiness.indexVersion;
  error.completedChannels = readiness.completedChannels;
  error.missingChannels = readiness.missingChannels;
  error.mismatchedChannels = readiness.mismatchedChannels;
  error.fullSnapshotFallback = readiness.fullSnapshotFallback;
  return error;
}

function readinessVerificationRequired() {
  const error = new Error('SEMANTIC_READINESS_VERIFICATION_REQUIRED');
  error.category = 'SEMANTIC_READINESS_VERIFICATION_REQUIRED';
  error.fullSnapshotFallback = false;
  return error;
}

module.exports = {
  createProductionSemanticOperatorJourney,
};

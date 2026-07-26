const OPERATOR_ACTIONS = Object.freeze({
  backfillCommand: 'argo semantic backfill',
  readinessCommand: 'argo semantic readiness',
  queryCommand: 'argo semantic query',
  backfillTool: 'backfillSystemArchitectureSemanticProjection',
  readinessTool: 'verifySystemArchitectureSemanticReadiness',
  queryTool: 'getSystemArchitecture',
});

function createProductionSemanticOperatorJourney(dependencies) {
  dependencies = {
    ...dependencies,
    readinessAttestationStore: dependencies && dependencies.readinessAttestationStore
      ? dependencies.readinessAttestationStore
      : createVolatileReadinessAttestationStore(),
  };
  assertDependencies(dependencies);
  let readinessVerified = false;

  async function runBackfill(request, automatic) {
    const configurationRequest = request.approvedConfigurationRequest || request;
    await resolveConfigurationSafely(
      dependencies.resolveApprovedConfiguration,
      configurationRequest,
    );
    readinessVerified = false;
    await dependencies.readinessAttestationStore.clear();
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
      await dependencies.readinessAttestationStore.clear();
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
      if (readiness.verified !== true) {
        throw readinessError(readiness);
      }
      if (!readinessVerified) {
        throw readinessError(readiness);
      }
      await dependencies.readinessAttestationStore.record({
        ...readiness,
        authorizationOperation: 'verifyReadiness',
      });
      return readiness;
    },

    async query(request = {}) {
      if (readinessVerified) {
        return queryAfterLocalVerification(request);
      }
      const attestation = await dependencies.readinessAttestationStore.read();
      if (!attestation) throw readinessVerificationRequired();
      const readiness = await dependencies.readSemanticReadiness();
      if (!await dependencies.readinessAttestationStore.validate(attestation, readiness)) {
        await dependencies.readinessAttestationStore.clear();
        throw readinessAttestationStale(readiness);
      }
      return dependencies.querySystemArchitecture({ query: request });
    },

    readFullSnapshot() {
      return dependencies.querySystemArchitecture({});
    },
  });

  function queryAfterLocalVerification(request) {
    return dependencies.querySystemArchitecture({ query: request });
  }
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
  const store = dependencies && dependencies.readinessAttestationStore;
  for (const name of ['record', 'read', 'clear', 'validate']) {
    if (!store || typeof store[name] !== 'function') {
      throw new TypeError(`readinessAttestationStore.${name} is required`);
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
  error.action = 'Run semantic readiness before semantic query';
  return error;
}

function readinessAttestationStale(readiness = {}) {
  const error = readinessError(readiness);
  error.message = 'SEMANTIC_READINESS_ATTESTATION_STALE';
  error.category = 'SEMANTIC_READINESS_ATTESTATION_STALE';
  error.action = 'Run semantic readiness verification again before semantic query';
  return error;
}

function createVolatileReadinessAttestationStore() {
  let record;
  return Object.freeze({
    clear() {
      record = undefined;
    },
    read() {
      return record;
    },
    record(readiness) {
      record = Object.freeze({ ...readiness });
      return record;
    },
    validate(attestation, readiness) {
      return attestation.verified === true && readiness.verified === true;
    },
  });
}

module.exports = {
  createProductionSemanticOperatorJourney,
};

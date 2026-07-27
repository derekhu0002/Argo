const LIVE_PROVIDER_GATE = 'ARGO_LIVE_PROVIDER_E2E';
const MUTATION_VECTOR_GATE = 'ARGO_W31_LIVE_MUTATION_VECTOR_E2E';

function createProductionSemanticOperatorJourney(dependencies) {
  assertDependencies(dependencies);

  async function runBackfill(request, automatic) {
    const configurationRequest = request.approvedConfigurationRequest || request;
    await resolveConfigurationSafely(
      dependencies.resolveApprovedConfiguration,
      configurationRequest,
    );
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
      const pending = {
        ...structuralProjection,
        workspace,
        semanticState: 'SemanticIndexPending',
        guidance: 'Enable both canonical semantic gates with approved external configuration, then run argo init again.',
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
      if (readiness.verified !== true) {
        throw readinessError(readiness);
      }
      return readiness;
    },

    async query(request = {}) {
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

async function runCanonicalSemanticInit(dependencies, request = {}) {
  requireCanonicalInitDependencies(dependencies);
  const providerGate = readGate(dependencies.configurationBehavior, LIVE_PROVIDER_GATE);
  const mutationGate = readGate(dependencies.configurationBehavior, MUTATION_VECTOR_GATE);
  const gateDecision = evaluateDualGate(providerGate, mutationGate);
  if (gateDecision === 'disabled') {
    return Object.freeze({
      state: 'SemanticDisabled',
      alignment: 'SemanticIndexPending',
      fullSnapshotFallback: false,
    });
  }
  if (gateDecision !== 'enabled') {
    throw safeLifecycleError(
      'SEMANTIC_LIFECYCLE_GATE_INVALID',
      'Set both semantic lifecycle gates to exactly 1, or disable both.',
    );
  }

  await resolveCanonicalConfiguration(dependencies.configurationBehavior, request);
  const backfill = await dependencies.productionGraphRagRuntime.runSemanticBackfill({
    ...request,
    explicitOptIn: true,
    automatic: true,
  });
  if (!backfill || backfill.alignmentState !== 'Aligned') {
    throw safeLifecycleError(
      'SEMANTIC_RECONCILIATION_INCOMPLETE',
      'Repair the durable semantic reconciliation failure, then run argo init again.',
    );
  }
  const queryable = await dependencies.finalReadiness.verifyQueryability(backfill);
  if (queryable !== true) {
    throw safeLifecycleError(
      'SEMANTIC_QUERYABILITY_NOT_VERIFIED',
      'Repair semantic vector queryability, then run argo init again.',
    );
  }
  const coherent = await dependencies.finalReadiness.verifyGlobalCoherence(backfill);
  if (coherent !== true) {
    throw safeLifecycleError(
      'SEMANTIC_GLOBAL_COHERENCE_NOT_VERIFIED',
      'Repair semantic global coherence, then run argo init again.',
    );
  }
  const contentVersion = backfill.contentVersion || backfill.canonicalVersion;
  const indexVersion = backfill.indexVersion || backfill.canonicalVersion;
  const alignedEvidence = Object.freeze({
    state: 'Aligned',
    verified: true,
    canonicalVersion: backfill.canonicalVersion,
    contentVersion,
    indexVersion,
    completedChannels: ['Element', 'ArchitectureRelationship', 'View'],
    missingChannels: [],
    mismatchedChannels: [],
    fullSnapshotFallback: false,
    channels: Object.freeze(Object.entries(backfill.channels || {}).map(([channel]) => (
      Object.freeze({
        channel,
        state: 'Aligned',
        canonicalVersion: backfill.canonicalVersion,
        contentVersion,
        indexVersion,
      })
    ))),
  });
  await dependencies.finalReadiness.recordAligned(alignedEvidence);
  return Object.freeze({
    state: 'Aligned',
    alignment: 'Aligned',
    backfill,
    readiness: alignedEvidence,
    fullSnapshotFallback: false,
  });
}

function requireCanonicalInitDependencies(dependencies) {
  if (!dependencies || !dependencies.configurationBehavior) {
    throw new TypeError('configurationBehavior is required');
  }
  if (
    !dependencies.productionGraphRagRuntime
    || typeof dependencies.productionGraphRagRuntime.runSemanticBackfill !== 'function'
  ) {
    throw new TypeError('productionGraphRagRuntime.runSemanticBackfill is required');
  }
  for (const name of ['verifyQueryability', 'verifyGlobalCoherence', 'recordAligned']) {
    if (!dependencies.finalReadiness || typeof dependencies.finalReadiness[name] !== 'function') {
      throw new TypeError(`finalReadiness.${name} is required`);
    }
  }
}

function readGate(configurationBehavior, name) {
  if (typeof configurationBehavior.readGate === 'function') {
    return configurationBehavior.readGate(name);
  }
  if (configurationBehavior.gates && typeof configurationBehavior.gates === 'object') {
    return configurationBehavior.gates[name];
  }
  return process.env[name];
}

function evaluateDualGate(providerGate, mutationGate) {
  const providerDisabled = providerGate === undefined || providerGate === '';
  const mutationDisabled = mutationGate === undefined || mutationGate === '';
  if (providerDisabled && mutationDisabled) return 'disabled';
  if (providerGate === '1' && mutationGate === '1') return 'enabled';
  return 'invalid';
}

async function resolveCanonicalConfiguration(configurationBehavior, request) {
  try {
    if (typeof configurationBehavior.readExternalConfiguration === 'function') {
      return await configurationBehavior.readExternalConfiguration(request);
    }
    if (configurationBehavior.state === 'valid-external-only') {
      return configurationBehavior;
    }
    if (typeof configurationBehavior.resolve === 'function') {
      return configurationBehavior.resolve(request);
    }
    throw safeLifecycleError(
      'EXTERNAL_CREDENTIALS_REQUIRED',
      'Provide approved external semantic configuration, then run argo init again.',
    );
  } catch (error) {
    throw sanitizeLifecycleError(error);
  }
}

function sanitizeLifecycleError(sourceError) {
  const approvedCategories = new Set([
    'APPROVED_SECRET_REQUIRED',
    'SECRET_FILE_ACL_UNSAFE',
    'SECRET_SOURCE_PROVENANCE_PROHIBITED',
    'EXTERNAL_CREDENTIALS_REQUIRED',
    'EMBEDDING_QUALIFICATION_REQUIRED',
    'EMBEDDING_CONFIGURATION_REQUIRED',
  ]);
  const category = approvedCategories.has(sourceError && sourceError.category)
    ? sourceError.category
    : 'APPROVED_CONFIGURATION_REJECTED';
  return safeLifecycleError(
    category,
    'Correct approved external configuration and retry argo init.',
  );
}

function safeLifecycleError(category, action) {
  const error = new Error(category);
  error.category = category;
  error.action = action;
  error.fullSnapshotFallback = false;
  return error;
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

module.exports = {
  createProductionSemanticOperatorJourney,
  runCanonicalSemanticInit,
};

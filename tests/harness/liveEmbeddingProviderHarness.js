const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const liveGatePath = path.join(repoRoot, '.argo', 'scripts', 'graph-rag', 'liveEmbeddingIndexGate.js');
const liveConfigPath = path.join(repoRoot, '.argo', 'scripts', 'graph-rag', 'liveEmbeddingProviderConfig.js');
const liveNeo4jBoundaryPath = path.join(repoRoot, '.argo', 'scripts', 'graph-rag', 'liveEmbeddingNeo4jBoundary.js');
const LIVE_OPT_IN = 'ARGO_LIVE_PROVIDER_E2E';
const W31_LIVE_OPT_IN = 'ARGO_W31_LIVE_MUTATION_VECTOR_E2E';
const APPROVED_PROFILE = Object.freeze({
  approvedByHuman: true,
  provider: 'alibaba-cloud-model-studio-openai-compatible-cn-beijing',
  baseUrl: 'https://llm-clids9mqc5o1mbvb.cn-beijing.maas.aliyuncs.com/compatible-mode/v1',
  model: 'qwen3.7-text-embedding',
  version: 'qualification-2026-07-25',
  dimensions: 1024,
  source: 'explicit-human-approval',
});
const FAILURE_CASES = Object.freeze([
  { name: 'unapproved-identity', qualification: { approvedByHuman: false }, transport: 'must-not-call', expectedCalls: 0 },
  { name: 'wrong-model', qualification: { model: 'unapproved-model' }, transport: 'must-not-call', expectedCalls: 0 },
  { name: 'wrong-version', qualification: { version: 'unapproved-version' }, transport: 'must-not-call', expectedCalls: 0 },
  { name: 'wrong-dimensions', qualification: { dimensions: 1536 }, transport: 'must-not-call', expectedCalls: 0 },
  { name: 'missing-model', qualification: { model: undefined }, transport: 'must-not-call', expectedCalls: 0 },
  { name: 'missing-dimensions', qualification: { dimensions: undefined }, transport: 'must-not-call', expectedCalls: 0 },
  { name: 'provider-error', qualification: {}, transport: 'provider-error', expectedCalls: 1 },
  { name: 'non-finite-vector', qualification: {}, transport: 'non-finite-vector', expectedCalls: 1 },
  { name: 'dimension-mismatch', qualification: {}, transport: 'dimension-mismatch', expectedCalls: 1 },
]);
const APPROVED_SOURCE_FIXTURES = Object.freeze([
  { name: 'process-only', expectedStatus: 'accepted', process: true, expectedSource: 'process' },
  { name: 'file-only', expectedStatus: 'accepted', file: true, expectedSource: 'file' },
  { name: 'matching-dual', expectedStatus: 'accepted', file: true, process: true, expectedSource: 'process' },
  { name: 'qwen-conflict', expectedCategory: 'SECRET_SOURCE_CONFLICT', file: true, process: true, conflictKey: 'QWEN_KEY' },
  { name: 'database-password-conflict', expectedCategory: 'SECRET_SOURCE_CONFLICT', file: true, process: true, conflictKey: 'ARGO_NEO4J_DATABASE_PASSWORD' },
  { name: 'missing-secret', expectedCategory: 'APPROVED_SECRET_REQUIRED', process: true, omitKey: 'QWEN_KEY' },
  { name: 'blank-secret', expectedCategory: 'APPROVED_SECRET_REQUIRED', process: true, blankKey: 'ARGO_NEO4J_DATABASE_PASSWORD' },
  { name: 'duplicate-key', expectedCategory: 'SECRET_FILE_DUPLICATE_KEY', file: true, duplicateKey: 'QWEN_KEY' },
  { name: 'unknown-secret', expectedCategory: 'SECRET_FILE_UNKNOWN_KEY', file: true, unknownKey: 'OTHER_API_TOKEN' },
  { name: 'root-file', expectedCategory: 'SECRET_FILE_PATH_PROHIBITED', file: true, relativePath: '.env' },
  { name: 'alternate-file', expectedCategory: 'SECRET_FILE_PATH_PROHIBITED', file: true, relativePath: 'config/.env' },
  { name: 'tracked-file', expectedCategory: 'SECRET_FILE_TRACKED', file: true, tracked: true },
  { name: 'not-ignored', expectedCategory: 'SECRET_FILE_NOT_IGNORED', file: true, ignored: false },
  { name: 'reparse-file', expectedCategory: 'SECRET_FILE_REPARSE_PROHIBITED', file: true, reparse: true },
  { name: 'acl-current-explicit-allow', expectedStatus: 'accepted', file: true, expectedSource: 'file', aclCase: 'current-explicit-allow' },
  { name: 'acl-current-explicit-allow-deny', expectedCategory: 'SECRET_FILE_ACL_UNSAFE', file: true, aclCase: 'current-explicit-allow-deny' },
  { name: 'acl-current-inherited-allow', expectedStatus: 'accepted', file: true, expectedSource: 'file', aclCase: 'current-inherited-allow' },
  { name: 'acl-current-inherited-deny', expectedCategory: 'SECRET_FILE_ACL_UNSAFE', file: true, aclCase: 'current-inherited-deny' },
  { name: 'acl-current-explicit-allow-inherited-deny', expectedCategory: 'SECRET_FILE_ACL_UNSAFE', file: true, aclCase: 'current-explicit-allow-inherited-deny' },
  { name: 'acl-current-explicit-deny-inherited-allow', expectedCategory: 'SECRET_FILE_ACL_UNSAFE', file: true, aclCase: 'current-explicit-deny-inherited-allow' },
  { name: 'acl-broad-explicit-allow', expectedCategory: 'SECRET_FILE_ACL_UNSAFE', file: true, aclCase: 'broad-explicit-allow' },
  { name: 'acl-broad-inherited-allow', expectedCategory: 'SECRET_FILE_ACL_UNSAFE', file: true, aclCase: 'broad-inherited-allow' },
  { name: 'acl-broad-deny-only', expectedStatus: 'accepted', file: true, expectedSource: 'file', aclCase: 'broad-deny-only' },
  { name: 'acl-broad-allow-deny', expectedStatus: 'accepted', file: true, expectedSource: 'file', aclCase: 'broad-allow-deny' },
  { name: 'acl-unverifiable', expectedCategory: 'SECRET_FILE_ACL_UNVERIFIABLE', file: true, aclCase: 'unverifiable' },
  { name: 'cli-source', expectedCategory: 'SECRET_SOURCE_PROVENANCE_PROHIBITED', process: true, accessMutation: 'cli' },
  { name: 'literal-source', expectedCategory: 'SECRET_SOURCE_PROVENANCE_PROHIBITED', process: true, accessMutation: 'literal' },
  { name: 'fallback-source', expectedCategory: 'SECRET_SOURCE_PROVENANCE_PROHIBITED', process: true, accessMutation: 'fallback' },
  { name: 'alias-source', expectedCategory: 'SECRET_SOURCE_PROVENANCE_PROHIBITED', process: true, accessMutation: 'alias' },
  { name: 'indirect-source', expectedCategory: 'SECRET_SOURCE_PROVENANCE_PROHIBITED', process: true, accessMutation: 'indirect' },
  { name: 'forged-trace', expectedCategory: 'SOURCE_TRACE_UNTRUSTED', process: true, traceMutation: 'forged' },
  { name: 'mutable-trace', expectedCategory: 'SOURCE_TRACE_UNTRUSTED', process: true, traceMutation: 'mutable' },
  { name: 'invalid-trace-schema', expectedCategory: 'SOURCE_TRACE_INVALID', process: true, traceMutation: 'invalid-schema' },
  { name: 'requested-key-trace-mismatch', expectedCategory: 'SOURCE_TRACE_INVALID', process: true, traceMutation: 'requested-key-mismatch' },
  { name: 'requested-path-trace-mismatch', expectedCategory: 'SOURCE_TRACE_INVALID', file: true, traceMutation: 'requested-path-mismatch' },
  { name: 'trace-missing-field', expectedCategory: 'SOURCE_TRACE_INVALID', process: true, traceMutation: 'missing-field' },
  { name: 'trace-extra-field', expectedCategory: 'SOURCE_TRACE_INVALID', process: true, traceMutation: 'extra-field' },
  { name: 'trace-wrong-field-type', expectedCategory: 'SOURCE_TRACE_INVALID', process: true, traceMutation: 'wrong-field-type' },
  { name: 'untrusted-adapter', expectedCategory: 'SOURCE_ADAPTER_UNTRUSTED', process: true, trustMutation: 'untrusted' },
  { name: 'cloned-adapter', expectedCategory: 'SOURCE_ADAPTER_UNTRUSTED', process: true, trustMutation: 'cloned' },
  { name: 'self-issued-trust', expectedCategory: 'SOURCE_ADAPTER_UNTRUSTED', process: true, trustMutation: 'self-issued' },
]);

async function runLiveEmbeddingProviderE2E() {
  requireLiveOptIn('LIVE_PROVIDER_E2E_OPT_IN_REQUIRED');
  const configuration = await resolveApprovedLiveConfiguration();
  const createGate = loadLiveGateFactory();
  const input = `Argo live embedding ${crypto.randomUUID()}`;
  const identities = dynamicEvidenceIdentities();
  const transport = createObservedHttpTransport(global.fetch);
  const indexBoundary = await createControlledNeo4jIndexBoundary('success', configuration);
  const logger = createCapturingLogger();

  try {
    const gate = createGate({
      configuration,
      transport,
      indexBoundary,
      logger,
    });
    const writesBefore = await indexBoundary.countWrites();
    const success = await gate.executeApprovedEmbedding({
      input,
      qualification: approvedProviderProfile(),
      ...identities,
    });
    const writesAfter = await indexBoundary.countWrites();
    const graphEvidence = await indexBoundary.readEvidence();
    const transportObservation = transport.observation();
    const failureObservations = await runFailureMatrix(createGate, identities, configuration);
    const writesAfterCleanup = await indexBoundary.cleanup();

    return {
      input,
      identities,
      success,
      transportObservation,
      writesBefore,
      writesAfter,
      writesAfterCleanup,
      graphEvidence,
      cypherEvidence: indexBoundary.observedCypher(),
      failureObservations,
      logs: logger.observations(),
      approvedProfile: approvedProviderProfile(),
    };
  } catch (error) {
    await indexBoundary.cleanup();
    throw error;
  }
}

async function runFailureMatrix(createGate, identities, configuration) {
  const observations = [];
  for (const testCase of FAILURE_CASES) {
    const indexBoundary = await createControlledNeo4jIndexBoundary(testCase.name, configuration);
    const logger = createCapturingLogger();
    const canary = `redaction-canary-${crypto.randomUUID()}`;
    const transport = createFailureTransport(testCase.transport, canary);
    try {
      const gate = createGate({
        configuration,
        transport,
        indexBoundary,
        logger,
      });
      const before = await indexBoundary.countWrites();
      const outcome = await captureOutcome(() => gate.executeApprovedEmbedding({
        input: `Argo failure probe ${crypto.randomUUID()}`,
        qualification: approvedProviderProfile(testCase.qualification),
        ...identities,
      }));
      const after = await indexBoundary.countWrites();
      const remainingAfterCleanup = await indexBoundary.cleanup();
      const observable = {
        outcome,
        logs: logger.observations(),
      };
      observations.push({
        name: testCase.name,
        providerCalls: transport.observation().callCount,
        expectedProviderCalls: testCase.expectedCalls,
        before,
        after,
        remainingAfterCleanup,
        status: outcome.status,
        category: outcome.category,
        redactionLeaks: findSecretLeaks(canary, [
          { name: `${testCase.name}:error`, value: observable },
        ]),
      });
    } catch (error) {
      await indexBoundary.cleanup();
      throw error;
    }
  }
  return observations;
}

async function runLiveProviderSecretIsolation() {
  requireLiveOptIn('LIVE_PROVIDER_SECRET_ISOLATION_OPT_IN_REQUIRED');
  const sourceFixtures = await runApprovedSourceFixtureMatrix();
  const observation = await runLiveEmbeddingProviderE2E();
  const createGate = loadLiveGateFactory();
  const redaction = await runRedactionCanaryProbe(createGate);
  const observableArtifacts = [
    { name: 'requestObservation', value: observation.transportObservation.requests },
    { name: 'responseObservation', value: observation.transportObservation.responses },
    { name: 'qualificationEvidence', value: observation.success.qualification },
    { name: 'graphEvidence', value: observation.graphEvidence },
    { name: 'cypherTextAndParameters', value: observation.cypherEvidence },
    { name: 'failureObservations', value: observation.failureObservations },
    { name: 'logs', value: observation.logs },
    ...readPersistentArtifactsRecursively(),
  ];
  return {
    observation,
    sourceFixtures,
    redaction,
    inspectedArtifactNames: observableArtifacts.map(artifact => artifact.name),
    forbiddenSecretFields: findForbiddenSecretFields(observableArtifacts),
  };
}

async function runApplyMutationEmbeddingVectorE2E() {
  requireW31LiveOptIn();
  const mutation = await applyDisposableW31MutationFixture();
  return normalizeAutomaticMutationLifecycleObservation(mutation);
}

async function runRedactionCanaryProbe(createGate) {
  const failureCanary = `redaction-failure-canary-${crypto.randomUUID()}`;
  const transport = createFailureTransport('provider-error', failureCanary);
  const indexBoundary = createInMemoryZeroWriteBoundary();
  const logger = createCapturingLogger();
  const captured = await captureProcessOutput(async () => {
    const gate = createGate({
      configuration: approvedSyntheticConfiguration(),
      transport,
      indexBoundary,
      logger,
    });
    return captureOutcome(() => gate.executeApprovedEmbedding({
      input: `Argo redaction probe ${crypto.randomUUID()}`,
      qualification: approvedProviderProfile(),
      ...dynamicEvidenceIdentities(),
    }));
  });
  const artifacts = [
    { name: 'errorMessages', value: captured.result },
    { name: 'stdout', value: captured.stdout },
    { name: 'stderr', value: captured.stderr },
    { name: 'logs', value: logger.observations() },
    { name: 'latestFailureRecords', value: readOptional('design/KG/test-failure-records.json') },
    ...readPersistentArtifactsRecursively(),
  ];
  const syntheticSuccess = await runSyntheticSuccessCanaryProbe(createGate);
  const neo4jAuthentication = await runNeo4jAuthenticationCanaryProbe();
  return {
    failure: {
      category: captured.result.category,
      providerCalls: transport.observation().callCount,
      writes: indexBoundary.writeCount(),
      leaks: findSecretLeaks(failureCanary, artifacts),
    },
    syntheticSuccess,
    neo4jAuthentication,
    inspectedArtifactNames: [
      ...artifacts.map(artifact => artifact.name),
      'cypherTextAndParameters',
      'graphEvidence',
    ],
  };
}

async function runSyntheticSuccessCanaryProbe(createGate) {
  const canary = `redaction-success-canary-${crypto.randomUUID()}`;
  const vector = Array.from({ length: 1024 }, (_, index) => index / 2048);
  const transport = createSyntheticSuccessTransport(vector);
  const indexBoundary = createRecordingInMemoryIndexBoundary();
  const gate = createGate({
    configuration: approvedSyntheticConfiguration(),
    transport,
    indexBoundary,
    logger: createCapturingLogger(),
  });
  await gate.executeApprovedEmbedding({
    input: `Argo synthetic success ${crypto.randomUUID()}`,
    qualification: approvedProviderProfile(),
    ...dynamicEvidenceIdentities(),
    canonicalIdentity: canary,
  });
  const recordedChannels = [
    { name: 'cypherTextAndParameters', value: indexBoundary.observedCypher() },
    { name: 'graphEvidence', value: indexBoundary.readEvidence() },
  ];
  const detectedLeakChannels = findSecretLeaks(canary, recordedChannels);
  const persistedBeforeCleanup = indexBoundary.persistedCount();
  await indexBoundary.cleanup();
  const postCleanupArtifacts = [
    { name: 'cypherTextAndParameters', value: indexBoundary.observedCypher() },
    { name: 'graphEvidence', value: indexBoundary.readEvidence() },
    ...readPersistentArtifactsRecursively(),
  ];
  return {
    providerCalls: transport.observation().callCount,
    detectedLeakChannels,
    persistedBeforeCleanup,
    persistedAfterCleanup: indexBoundary.persistedCount(),
    postCleanupLeaks: findSecretLeaks(canary, postCleanupArtifacts),
    generatedArtifactLeaks: findSecretLeaks(canary, readPersistentArtifactsRecursively()),
  };
}

async function runRecordingBoundaryCanarySelfTest() {
  const canary = `recording-boundary-canary-${crypto.randomUUID()}`;
  const indexBoundary = createRecordingInMemoryIndexBoundary();
  await indexBoundary.writeEvidence({
    displayLabel: canary,
    nested: { neutralValue: canary },
  });
  const detectedLeakChannels = findSecretLeaks(canary, [
    { name: 'cypherTextAndParameters', value: indexBoundary.observedCypher() },
    { name: 'graphEvidence', value: indexBoundary.readEvidence() },
  ]);
  const persistedBeforeCleanup = indexBoundary.persistedCount();
  await indexBoundary.cleanup();
  return {
    detectedLeakChannels,
    persistedBeforeCleanup,
    persistedAfterCleanup: indexBoundary.persistedCount(),
    postCleanupLeaks: findSecretLeaks(canary, [
      { name: 'cypherTextAndParameters', value: indexBoundary.observedCypher() },
      { name: 'graphEvidence', value: indexBoundary.readEvidence() },
      ...readPersistentArtifactsRecursively(),
    ]),
  };
}

function createObservedHttpTransport(fetchImpl) {
  if (typeof fetchImpl !== 'function') {
    throw safeError('LIVE_PROVIDER_HTTP_TRANSPORT_REQUIRED');
  }
  const requests = [];
  const responses = [];
  return {
    async request(url, options = {}) {
      const parsedUrl = new URL(url);
      const body = JSON.parse(String(options.body || '{}'));
      requests.push({
        origin: parsedUrl.origin,
        path: parsedUrl.pathname,
        method: options.method,
        model: body.model,
        dimensions: body.dimensions,
        input: body.input,
        protectedHeaderPresent: hasProtectedHeader(options.headers),
      });
      const response = await fetchImpl(url, options);
      const payload = await response.clone().json();
      const vector = payload?.data?.[0]?.embedding;
      responses.push({
        status: response.status,
        vector,
        vectorFingerprint: fingerprint(vector),
      });
      return response;
    },
    observation() {
      return {
        callCount: requests.length,
        requests: [...requests],
        responses: [...responses],
      };
    },
  };
}

function createFailureTransport(mode, canary = 'synthetic-provider-error') {
  let callCount = 0;
  return {
    async request() {
      callCount += 1;
      if (mode === 'must-not-call') {
        throw safeError('PROVIDER_CALLED_BEFORE_QUALIFICATION');
      }
      if (mode === 'provider-error') {
        throw new Error(canary);
      }
      const length = mode === 'dimension-mismatch' ? 7 : 1024;
      const vector = Array.from({ length }, (_, index) => (
        mode === 'non-finite-vector' && index === 11 ? Number.NaN : index / 1024
      ));
      return fakeJsonResponse({ data: [{ embedding: vector }] });
    },
    observation() {
      return { callCount };
    },
  };
}

function createSyntheticSuccessTransport(vector) {
  let callCount = 0;
  return {
    async request() {
      callCount += 1;
      return fakeJsonResponse({ data: [{ embedding: vector }] });
    },
    observation() {
      return { callCount };
    },
  };
}

function fakeJsonResponse(payload) {
  return {
    ok: true,
    status: 200,
    clone() {
      return this;
    },
    async json() {
      return payload;
    },
  };
}

function approvedProviderProfile(overrides = {}) {
  return { ...APPROVED_PROFILE, ...overrides };
}

function dynamicEvidenceIdentities() {
  const sentinel = crypto.randomUUID();
  return {
    canonicalIdentity: `canonical-${sentinel}`,
    canonicalVersion: `canonical-version-${sentinel}`,
    contentIdentity: `content-${sentinel}`,
    contentVersion: `content-version-${sentinel}`,
    indexIdentity: `index-${sentinel}`,
    indexVersion: `index-version-${sentinel}`,
  };
}

function requireLiveOptIn(category) {
  if (process.env[LIVE_OPT_IN] !== '1') {
    throw safeError(category);
  }
}

function requireW31LiveOptIn() {
  if (process.env[W31_LIVE_OPT_IN] !== '1' || process.env[LIVE_OPT_IN] !== '1') {
    throw safeError('W31_MUTATION_VECTOR_E2E_OPT_IN_REQUIRED');
  }
}

async function resolveApprovedLiveConfiguration() {
  if (!fs.existsSync(liveConfigPath)) {
    throw safeError('LIVE_PROVIDER_CONFIGURATION_BOUNDARY_MISSING');
  }
  delete require.cache[require.resolve(liveConfigPath)];
  const boundary = require(liveConfigPath);
  if (typeof boundary.resolveApprovedLiveConfiguration !== 'function') {
    throw safeError('LIVE_PROVIDER_CONFIGURATION_API_MISSING');
  }
  return boundary.resolveApprovedLiveConfiguration({
    repositoryRoot: repoRoot,
  });
}

async function runApprovedSourceFixtureMatrix() {
  const configurationBoundary = loadApprovedConfigurationBoundary();
  const observations = [];
  for (const fixture of APPROVED_SOURCE_FIXTURES) {
    observations.push(await runApprovedSourceFixture(configurationBoundary, fixture));
  }
  return observations;
}

async function runApprovedSourceFixture(configurationBoundary, fixture) {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'argo-approved-source-'));
  const qwen = `fixture-qwen-${crypto.randomUUID()}`;
  const neo4jPassword = `fixture-neo4j-${crypto.randomUUID()}`;
  const approvedValues = approvedFixtureEnvironment(qwen, neo4jPassword);
  const processValues = fixture.process ? { ...approvedValues } : {};
  const fileEntries = fixture.file ? Object.entries(approvedValues) : [];
  mutateFixtureValues(processValues, fileEntries, fixture);
  const relativePath = fixture.relativePath || '.argo/.env';
  const filePath = path.join(temporaryRoot, ...relativePath.split('/'));
  const sourceTrace = [];
  const traceTrustChecks = [];
  const expectedAttribution = fixture.expectedSource
    ? Object.fromEntries(Object.keys(approvedValues).map(key => [key, fixture.expectedSource]))
    : undefined;
  const sourceBehavior = createSourceFixtureBehavior(
    fixture,
    processValues,
    fileEntries,
    filePath,
  );
  const observeTrace = Object.freeze(event => {
    if (event && event.phase === 'issued') sourceTrace.push(event.trace);
    if (event && event.phase === 'validated') {
      traceTrustChecks.push({ trace: event.trace, trusted: event.trusted === true });
    }
  });
  if (fixture.file) {
    if (fixture.duplicateKey) fileEntries.push([fixture.duplicateKey, fixture.duplicateKey === 'QWEN_KEY' ? qwen : neo4jPassword]);
    if (fixture.unknownKey) fileEntries.push([fixture.unknownKey, 'synthetic']);
  }
  const effects = { fetch: 0, driver: 0, create: 0, write: 0 };
  try {
    if (fixture.file) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, fileEntries.map(([key, value]) => `${key}=${value}`).join('\n'), { flag: 'wx', mode: 0o600 });
    }
    const captured = await captureProcessOutput(async () => {
      try {
        return {
          status: 'accepted',
          value: await invokeFixtureConfigurationBoundary(configurationBoundary, {
            fixture,
            repositoryRoot: temporaryRoot,
            sourceBehavior,
            observeTrace,
            adapters: {
              filesystem: createFilesystemFixtureAdapter(fixture),
              git: createGitFixtureAdapter(fixture),
              acl: createAclFixtureAdapter(fixture),
              forbiddenSideEffects: createForbiddenSideEffectAdapter(effects),
            },
          }),
        };
      } catch (error) {
        return { status: 'blocked', category: safeCategory(error), rawError: error };
      }
    });
    const outcome = captured.result;
    const leaks = findSourceOutcomeLeaks({
      outcome,
      captured,
      qwen,
      neo4jPassword,
    });
    const observation = {
      name: fixture.name,
      status: outcome.status,
      category: outcome.category,
      attribution: outcome.value && outcome.value.attribution,
      normalizedConfigMatches: outcome.value
        ? normalizedFixtureConfigurationMatches(outcome.value, approvedValues)
        : undefined,
      sourceTrace,
      sourceTraceComplete: outcome.value
        ? acceptedSourceTraceComplete(fixture, sourceTrace, Object.keys(approvedValues), filePath)
        : undefined,
      traceTrustValidationComplete: outcome.value
        ? sourceTrace.length > 0
          && traceTrustChecks.length === sourceTrace.length
          && traceTrustChecks.every(check => check.trusted)
        : undefined,
      effects,
      leaks,
      expectedStatus: fixture.expectedStatus,
      expectedCategory: fixture.expectedCategory,
      expectedAttribution,
    };
    return observation;
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

function approvedFixtureEnvironment(qwen, neo4jPassword) {
  return {
    ARGO_EMBEDDING_BASE_URL: APPROVED_PROFILE.baseUrl,
    ARGO_EMBEDDING_MODEL: APPROVED_PROFILE.model,
    ARGO_EMBEDDING_PROVIDER: APPROVED_PROFILE.provider,
    ARGO_EMBEDDING_MODEL_VERSION: APPROVED_PROFILE.version,
    ARGO_EMBEDDING_DIMENSIONS: String(APPROVED_PROFILE.dimensions),
    ARGO_NEO4J_DATABASE_URL: 'neo4j://synthetic.invalid',
    ARGO_NEO4J_DATABASE_USERNAME: 'synthetic-user',
    ARGO_NEO4J_DATABASE_PASSWORD: neo4jPassword,
    QWEN_KEY: qwen,
  };
}

function mutateFixtureValues(processValues, fileEntries, fixture) {
  const fileIndex = key => fileEntries.findIndex(([entryKey]) => entryKey === key);
  if (fixture.omitKey) {
    delete processValues[fixture.omitKey];
    const index = fileIndex(fixture.omitKey);
    if (index >= 0) fileEntries.splice(index, 1);
  }
  if (fixture.blankKey) {
    if (Object.hasOwn(processValues, fixture.blankKey)) processValues[fixture.blankKey] = ' ';
    const index = fileIndex(fixture.blankKey);
    if (index >= 0) fileEntries[index][1] = ' ';
  }
  if (fixture.conflictKey) {
    const index = fileIndex(fixture.conflictKey);
    if (index >= 0) fileEntries[index][1] = `${fileEntries[index][1]}-different`;
  }
}

function loadApprovedConfigurationBoundary() {
  if (!fs.existsSync(liveConfigPath)) throw safeError('LIVE_PROVIDER_CONFIGURATION_BOUNDARY_MISSING');
  delete require.cache[require.resolve(liveConfigPath)];
  const boundary = require(liveConfigPath);
  if (
    typeof boundary.resolveApprovedLiveConfiguration !== 'function'
      || typeof boundary.withApprovedLiveConfigurationTestComposition !== 'function'
  ) {
    throw safeError('LIVE_PROVIDER_CONFIGURATION_API_MISSING');
  }
  return Object.freeze({
    resolveApprovedLiveConfiguration: boundary.resolveApprovedLiveConfiguration,
    withApprovedLiveConfigurationTestComposition: boundary.withApprovedLiveConfigurationTestComposition,
  });
}

async function invokeFixtureConfigurationBoundary(configurationBoundary, context) {
  const {
    fixture,
    repositoryRoot,
    sourceBehavior,
    observeTrace,
    adapters,
  } = context;
  if (fixture.trustMutation) {
    return configurationBoundary.resolveApprovedLiveConfiguration({
      repositoryRoot,
      adapters: {
        ...adapters,
        source: createUntrustedSourceAdapter(fixture, sourceBehavior),
      },
    });
  }
  return configurationBoundary.withApprovedLiveConfigurationTestComposition({
    sourceBehavior,
    observeTrace,
    adapters,
  }, resolveForTest => resolveForTest({ repositoryRoot }));
}

function createUntrustedSourceAdapter(fixture, sourceBehavior) {
  const base = {
    readProcessKey: sourceBehavior.readProcessKey,
    readFileEntries: sourceBehavior.readFileEntries,
  };
  if (fixture.trustMutation === 'self-issued') {
    return { ...base, isIssuedTrace: () => true };
  }
  if (fixture.trustMutation === 'cloned') {
    return { ...base };
  }
  return base;
}

function createFilesystemFixtureAdapter(fixture) {
  return {
    existsSync: fs.existsSync,
    lstatSync(targetPath) {
      const stat = fs.lstatSync(targetPath);
      if (!fixture.reparse) return stat;
      return new Proxy(stat, {
        get(target, property) {
          if (property === 'isSymbolicLink') return () => true;
          return Reflect.get(target, property);
        },
      });
    },
    readFileSync() {
      throw safeError('STRUCTURED_SOURCE_ADAPTER_REQUIRED');
    },
    realpathSync: fs.realpathSync,
  };
}

function createSourceFixtureBehavior(fixture, processValues, fileEntries, filePath) {
  const targetKey = 'QWEN_KEY';
  const processMutation = fixture.accessMutation || (
    fixture.traceMutation && fixture.traceMutation !== 'requested-path-mismatch'
      ? fixture.traceMutation
      : undefined
  );
  const behavior = {
    expectedFilePath: filePath,
    readProcessKey(key) {
      if (key === targetKey && processMutation) return undefined;
      return processValues[key];
    },
    readFileEntries() {
      if (fixture.traceMutation === 'requested-path-mismatch') return undefined;
      return fileEntries.map(([key, value]) => [key, value]);
    },
  };
  const processOperationNames = {
    cli: 'readCliKey',
    literal: 'readLiteralKey',
    fallback: 'readFallbackKey',
    alias: 'readAliasedProcessKey',
    indirect: 'readIndirectProcessKey',
    forged: 'readProcessKeyWithForgedTrace',
    mutable: 'readProcessKeyWithMutableTrace',
    'invalid-schema': 'readProcessKeyWithInvalidTraceSchema',
    'requested-key-mismatch': 'readProcessKeyWithRequestedKeyMismatch',
    'missing-field': 'readProcessKeyWithMissingTraceField',
    'extra-field': 'readProcessKeyWithExtraTraceField',
    'wrong-field-type': 'readProcessKeyWithWrongTraceFieldType',
  };
  if (processMutation) {
    behavior[processOperationNames[processMutation]] = key => processValues[key];
  }
  if (fixture.traceMutation === 'requested-path-mismatch') {
    behavior.readFileEntriesWithRequestedPathMismatch = () => (
      fileEntries.map(([key, value]) => [key, value])
    );
  }
  return Object.freeze(behavior);
}

async function applyDisposableW31MutationFixture() {
  const { callTool } = require('../../.argo/scripts/argo-mcp-server.js');
  fs.mkdirSync(path.join(repoRoot, '.argo', 'temp'), { recursive: true });
  const temporaryRoot = fs.mkdtempSync(path.join(repoRoot, '.argo', 'temp', 'w31-mutation-'));
  const temporaryGraphPath = path.join(temporaryRoot, 'SystemArchitecture.json');
  fs.copyFileSync(path.join(repoRoot, 'design', 'KG', 'SystemArchitecture.json'), temporaryGraphPath);
  const marker = `w31-live-vector-${crypto.randomUUID()}`;
  const architecturePath = path.relative(repoRoot, temporaryGraphPath);
  const response = await callTool('applySystemArchitectureMutation', {
    architecturePath,
    mutations: [
      {
        type: 'updateElement',
        id: 'grag-wp-3-1',
        patch: {
          description: `W3.1 live vector mutation fixture ${marker}`,
        },
      },
      {
        type: 'updateRelationship',
        id: 'grag-rel-w31-index-lifecycle',
        patch: {
          description: `W3.1 vector lifecycle relationship fixture ${marker}`,
        },
      },
      {
        type: 'updateView',
        id: 'grag-w31-integration-acceptance',
        patch: {
          description: `W3.1 vector queryability view fixture ${marker}`,
        },
      },
    ],
  });
  return {
    applied: Boolean(response && (response.status === 'passed' || response.status === 'success' || response.ok === true)),
    architecturePath,
    marker,
    response,
  };
}

function normalizeAutomaticMutationLifecycleObservation(mutation) {
  const response = parseToolPayload(mutation.response);
  const embeddingLifecycle = response.embeddingLifecycle;
  const alignment = response.alignment;
  if (!embeddingLifecycle || typeof embeddingLifecycle !== 'object') {
    throw safeError('W31_EMBEDDING_LIFECYCLE_RESPONSE_REQUIRED');
  }
  if (!alignment || typeof alignment !== 'object') {
    throw safeError('W31_ALIGNMENT_RESPONSE_REQUIRED');
  }
  const responseTouchedRecordIds = touchedIdsFromResponse(response);
  const touchedRecords = Array.isArray(embeddingLifecycle.touchedRecords)
    ? embeddingLifecycle.touchedRecords
    : [];
  return {
    mutationToolCallCount: 1,
    lifecycleCreatedByHarness: false,
    expectedTouchedRecordsSubstituted: false,
    mutation: {
      applied: mutation.applied,
      architecturePath: mutation.architecturePath,
      marker: mutation.marker,
      response,
    },
    embeddingLifecycle,
    alignment,
    responseTouchedRecordIds,
    touchedRecords,
    provider: embeddingLifecycle.provider,
    vectorEvidence: embeddingLifecycle.vectorEvidence,
    vectorQuery: embeddingLifecycle.vectorQuery,
    alignmentState: embeddingLifecycle.alignmentState || alignment.state,
    failureMatrix: embeddingLifecycle.failureMatrix || [],
    secretLeaks: embeddingLifecycle.secretLeaks || [],
  };
}

function parseToolPayload(response) {
  if (response && typeof response === 'object') {
    if (response.embeddingLifecycle || response.alignment || response.touchedElementIds) {
      return response;
    }
    const text = response.content && response.content[0] && response.content[0].text;
    if (typeof text === 'string') {
      return JSON.parse(text);
    }
  }
  throw safeError('W31_MUTATION_RESPONSE_REQUIRED');
}

function touchedIdsFromResponse(response) {
  return [
    ...stringArray(response.touchedElementIds),
    ...stringArray(response.touchedRelationshipIds),
    ...stringArray(response.touchedViewIds),
  ];
}

function stringArray(value) {
  return Array.isArray(value) ? value.filter(entry => typeof entry === 'string' && entry.length > 0) : [];
}

function runStructuredSourceAdapterContractSelfTest() {
  const key = 'QWEN_KEY';
  const value = `source-interface-${crypto.randomUUID()}`;
  const makeBehavior = fixture => createSourceFixtureBehavior(
    fixture,
    { [key]: value },
    [[key, value]],
    'D:\\synthetic\\.argo\\.env',
  );
  const direct = makeBehavior({});
  const prohibitedMethods = {
    cli: 'readCliKey',
    literal: 'readLiteralKey',
    fallback: 'readFallbackKey',
    alias: 'readAliasedProcessKey',
    indirect: 'readIndirectProcessKey',
  };
  const prohibited = Object.fromEntries(Object.entries(prohibitedMethods).map(([mutation, method]) => {
    const behavior = makeBehavior({ accessMutation: mutation });
    return [mutation, {
      sameValue: behavior[method](key) === direct.readProcessKey(key),
      directReadSuppressed: behavior.readProcessKey(key) === undefined,
      operationMethod: method,
    }];
  }));
  const mismatchMethods = [
    ['requested-key-mismatch', 'readProcessKeyWithRequestedKeyMismatch'],
    ['requested-path-mismatch', 'readFileEntriesWithRequestedPathMismatch'],
    ['missing-field', 'readProcessKeyWithMissingTraceField'],
    ['extra-field', 'readProcessKeyWithExtraTraceField'],
    ['wrong-field-type', 'readProcessKeyWithWrongTraceFieldType'],
  ];
  return {
    behaviorFrozen: Object.isFrozen(direct),
    directValuePresent: direct.readProcessKey(key) === value,
    fileEntriesPresent: direct.readFileEntries('D:\\synthetic\\.argo\\.env').length === 1,
    exposesTrustVerdict: Object.hasOwn(direct, 'isIssuedTrace'),
    prohibited,
    mismatchMethodsPresent: mismatchMethods.every(([mutation, method]) => (
      typeof makeBehavior({
        traceMutation: mutation,
        file: mutation === 'requested-path-mismatch',
      })[method] === 'function'
    )),
  };
}

function createGitFixtureAdapter(fixture) {
  return {
    isIgnored() {
      return fixture.ignored !== false;
    },
    isTracked() {
      return fixture.tracked === true;
    },
  };
}

function createAclFixtureAdapter(fixture) {
  const identity = 'ARGO\\FixtureRunner';
  const matrix = {
    'current-explicit-allow': { status: 0, identity, stdout: `${identity}:(R)` },
    'current-explicit-allow-deny': { status: 0, identity, stdout: `${identity}:(R)\n${identity}:(DENY)(R)` },
    'current-inherited-allow': { status: 0, identity, stdout: `${identity}:(I)(RX)` },
    'current-inherited-deny': { status: 0, identity, stdout: `${identity}:(I)(DENY)(R)` },
    'current-explicit-allow-inherited-deny': { status: 0, identity, stdout: `${identity}:(R)\n${identity}:(I)(DENY)(R)` },
    'current-explicit-deny-inherited-allow': { status: 0, identity, stdout: `${identity}:(DENY)(R)\n${identity}:(I)(RX)` },
    'broad-explicit-allow': { status: 0, identity, stdout: `${identity}:(R)\nEveryone:(R)` },
    'broad-inherited-allow': { status: 0, identity, stdout: `${identity}:(F)\nBUILTIN\\Users:(I)(RX)` },
    'broad-deny-only': { status: 0, identity, stdout: `${identity}:(R)\nEveryone:(DENY)(R)` },
    'broad-allow-deny': { status: 0, identity, stdout: `${identity}:(R)\nAuthenticated Users:(R)\nAuthenticated Users:(DENY)(R)` },
    unverifiable: { status: 1, identity, stdout: '' },
  };
  return {
    inspect() {
      return matrix[fixture.aclCase || 'current-explicit-allow'];
    },
  };
}

function createForbiddenSideEffectAdapter(effects) {
  return {
    fetch() { effects.fetch += 1; },
    openDriver() { effects.driver += 1; },
    createNode() { effects.create += 1; },
    writeIndex() { effects.write += 1; },
  };
}

function normalizedFixtureConfigurationMatches(result, values) {
  const expected = {
    embeddingBaseUrl: values.ARGO_EMBEDDING_BASE_URL,
    embeddingModel: values.ARGO_EMBEDDING_MODEL,
    embeddingProvider: values.ARGO_EMBEDDING_PROVIDER,
    embeddingModelVersion: values.ARGO_EMBEDDING_MODEL_VERSION,
    embeddingDimensions: Number(values.ARGO_EMBEDDING_DIMENSIONS),
    neo4jDatabaseUrl: values.ARGO_NEO4J_DATABASE_URL,
    neo4jDatabaseUsername: values.ARGO_NEO4J_DATABASE_USERNAME,
    neo4jDatabasePassword: values.ARGO_NEO4J_DATABASE_PASSWORD,
    qwenKey: values.QWEN_KEY,
  };
  return result.configuration
    && Object.keys(expected).length === Object.keys(result.configuration).length
    && Object.entries(expected).every(([key, value]) => result.configuration[key] === value);
}

function acceptedSourceTraceComplete(fixture, trace, keys, filePath) {
  const exactTraceKeys = ['aliasChain', 'key', 'operation', 'path', 'sourceKind'];
  const requiredSources = fixture.file && fixture.process ? ['process', 'file'] : [fixture.expectedSource];
  return requiredSources.every(sourceKind => keys.every(key => trace.some(access => (
    Object.isFrozen(access)
      && Object.isFrozen(access.aliasChain)
      && JSON.stringify(Object.keys(access).sort()) === JSON.stringify(exactTraceKeys)
      && access.sourceKind === sourceKind
      && access.path === (sourceKind === 'file' ? filePath : null)
      && access.key === key
      && access.operation === 'read'
      && access.aliasChain.length === 1
      && access.aliasChain[0] === key
  ))));
}

function loadLiveGateFactory() {
  if (!fs.existsSync(liveGatePath)) {
    throw safeError('LIVE_PROVIDER_E2E_BOUNDARY_MISSING');
  }
  delete require.cache[require.resolve(liveGatePath)];
  const boundary = require(liveGatePath);
  if (typeof boundary.createLiveEmbeddingIndexGate !== 'function') {
    throw safeError('LIVE_PROVIDER_E2E_API_MISSING');
  }
  return boundary.createLiveEmbeddingIndexGate;
}

async function createControlledNeo4jIndexBoundary(label, configuration, injectedNeo4j) {
  const neo4j = injectedNeo4j || require('neo4j-driver');
  const uri = requireConfigurationValue(configuration, 'neo4jDatabaseUrl');
  const username = requireConfigurationValue(configuration, 'neo4jDatabaseUsername');
  const password = requireConfigurationValue(configuration, 'neo4jDatabasePassword');
  const runId = `argo-live-${label}-${crypto.randomUUID()}`;
  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  const observedCypher = [];
  let closed = false;
  await driver.verifyConnectivity();

  async function query(cypher, parameters = {}) {
    observedCypher.push({ cypher, parameters });
    const session = driver.session();
    try {
      return await session.run(cypher, parameters);
    } finally {
      await session.close();
    }
  }

  async function countWrites() {
    const result = await query(
      'MATCH (e:ArgoLiveEmbeddingEvidence { runId: $runId }) RETURN count(e) AS count',
      { runId },
    );
    return result.records[0].get('count').toNumber();
  }

  return {
    runId,
    async writeEvidence(evidence) {
      await query(
        'CREATE (e:ArgoLiveEmbeddingEvidence { runId: $runId, vector: $vector, provider: $provider, model: $model, qualificationVersion: $qualificationVersion, dimensions: $dimensions, canonicalIdentity: $canonicalIdentity, canonicalVersion: $canonicalVersion, contentIdentity: $contentIdentity, contentVersion: $contentVersion, indexIdentity: $indexIdentity, indexVersion: $indexVersion })',
        { runId, ...evidence },
      );
    },
    countWrites,
    async readEvidence() {
      const result = await query(
        'MATCH (e:ArgoLiveEmbeddingEvidence { runId: $runId }) RETURN e { .runId, .provider, .model, .qualificationVersion, .dimensions, .canonicalIdentity, .canonicalVersion, .contentIdentity, .contentVersion, .indexIdentity, .indexVersion, .vector } AS evidence',
        { runId },
      );
      return result.records.map(record => normalizeNeo4jEvidence(record.get('evidence')));
    },
    observedCypher() {
      return [...observedCypher];
    },
    async cleanup() {
      if (closed) {
        return 0;
      }
      await query('MATCH (e:ArgoLiveEmbeddingEvidence { runId: $runId }) DELETE e', { runId });
      const remaining = await countWrites();
      await driver.close();
      closed = true;
      return remaining;
    },
  };
}

async function runNeo4jAuthenticationCanaryProbe() {
  const createApprovedNeo4jBoundary = loadApprovedNeo4jBoundaryFactory();
  const passwordCanary = `neo4j-auth-canary-${crypto.randomUUID()}`;
  const configuration = {
    neo4jDatabaseUrl: 'neo4j://synthetic.invalid',
    neo4jDatabaseUsername: 'synthetic-user',
    neo4jDatabasePassword: passwordCanary,
  };
  const runId = `auth-success-${crypto.randomUUID()}`;
  const successLogger = createCapturingLogger();
  const successAdapter = createRecordingNeo4jAdapter({ expectedPassword: passwordCanary });
  const successCaptured = await captureProcessOutput(async () => {
    const boundary = await createApprovedNeo4jBoundary({
      configuration,
      neo4j: successAdapter,
      logger: successLogger,
    });
    const writesBefore = await boundary.countWrites(runId);
    const graphEvidence = await boundary.readEvidence(runId);
    const writesAfterCleanup = await boundary.cleanup(runId);
    await boundary.close();
    return { writesBefore, graphEvidence, writesAfterCleanup };
  });
  const failureLogger = createCapturingLogger();
  const failureAdapter = createRecordingNeo4jAdapter({
    expectedPassword: passwordCanary,
    failAuthentication: true,
  });
  const failureCaptured = await captureProcessOutput(() => captureRawOutcome(
    () => createApprovedNeo4jBoundary({
      configuration,
      neo4j: failureAdapter,
      logger: failureLogger,
    }),
  ));
  const successObservation = successAdapter.observation();
  const failureObservation = failureAdapter.observation();
  const unifiedChannels = [
    { name: 'rawError', value: [failureCaptured.result.rawError, failureObservation.rawExceptions] },
    { name: 'sanitizedError', value: failureCaptured.result.sanitized },
    { name: 'successLogger', value: successLogger.observations() },
    { name: 'failureLogger', value: failureLogger.observations() },
    { name: 'successStdout', value: successCaptured.stdout },
    { name: 'successStderr', value: successCaptured.stderr },
    { name: 'failureStdout', value: failureCaptured.stdout },
    { name: 'failureStderr', value: failureCaptured.stderr },
    { name: 'authCalls', value: [successObservation.authCalls, failureObservation.authCalls] },
    { name: 'driverCalls', value: [successObservation.driverCalls, failureObservation.driverCalls] },
    { name: 'cypherTextAndParameters', value: [successObservation.queries, failureObservation.queries] },
    { name: 'graphEvidence', value: successCaptured.result.graphEvidence },
    { name: 'persistence', value: {
      writesBefore: successCaptured.result.writesBefore,
      writesAfterCleanup: successCaptured.result.writesAfterCleanup,
    } },
    { name: 'artifacts', value: readPersistentArtifactsRecursively() },
  ];
  return {
    authCalls: successObservation.authCalls,
    authenticationFailure: failureCaptured.result.sanitized,
    driverCalls: successObservation.driverCalls.length,
    failureDriverCalls: failureObservation.driverCalls.length,
    failureQueries: failureObservation.queries.length,
    writesBefore: successCaptured.result.writesBefore,
    graphEvidenceCount: successCaptured.result.graphEvidence.length,
    writesAfterCleanup: successCaptured.result.writesAfterCleanup,
    inspectedChannelNames: unifiedChannels.map(channel => channel.name),
    leaks: findSecretLeaks(passwordCanary, unifiedChannels),
    leakDetectorChannels: runAuthenticationLeakDetectorSelfTest(passwordCanary),
  };
}

async function captureRawOutcome(action) {
  try {
    await action();
    return { rawError: undefined, sanitized: { status: 'unexpected-success' } };
  } catch (rawError) {
    const category = safeCategory(rawError);
    return {
      rawError,
      sanitized: { status: 'blocked', category, message: category },
    };
  }
}

function runAuthenticationLeakDetectorSelfTest(canary) {
  const channelNames = [
    'rawError',
    'sanitizedError',
    'logger',
    'stdout',
    'stderr',
    'authCalls',
    'driverCalls',
    'cypherTextAndParameters',
    'graphEvidence',
    'persistence',
    'artifacts',
  ];
  return channelNames.filter(name => findSecretLeaks(canary, [
    {
      name,
      value: name === 'rawError'
        ? new Error('outer-auth-failure', { cause: new Error(canary) })
        : { neutral: canary },
    },
  ]).includes(name));
}

function runArtifactSerializationContractSelfTest(canary) {
  const stableValues = [
    ['undefined', undefined],
    ['null', null],
    ['number', 42],
    ['boolean', true],
    ['bigint', 42n],
    ['symbol', Symbol('stable')],
    ['error', new Error('stable')],
    ['aggregateError', new AggregateError([new Error('stable')], 'aggregate')],
    ['object', { stable: true }],
  ];
  const circular = { value: canary };
  circular.self = circular;
  const canaryChannels = [
    { name: 'string', value: canary },
    { name: 'symbol', value: Symbol(canary) },
    { name: 'error', value: new Error('outer', { cause: new Error(canary) }) },
    { name: 'aggregateError', value: new AggregateError([new Error(canary)], 'aggregate') },
    { name: 'object', value: { neutral: canary } },
    { name: 'buffer', value: Buffer.from(canary) },
    { name: 'circular', value: circular },
  ];
  return {
    stableKinds: stableValues
      .filter(([, value]) => typeof serializeArtifact(value) === 'string')
      .map(([kind]) => kind),
    emptyChannelLeaks: findSecretLeaks(canary, [
      { name: 'undefined', value: undefined },
      { name: 'null', value: null },
    ]),
    detectedCanaryChannels: findSecretLeaks(canary, canaryChannels),
    acceptedFixtureContinued: findSourceOutcomeLeaks({
      outcome: { status: 'accepted', rawError: undefined },
      captured: { stdout: '', stderr: '' },
      qwen: 'accepted-qwen-canary',
      neo4jPassword: 'accepted-neo4j-canary',
      artifacts: [],
    }).length === 0,
  };
}

function loadApprovedNeo4jBoundaryFactory() {
  if (!fs.existsSync(liveNeo4jBoundaryPath)) {
    throw safeError('LIVE_PROVIDER_NEO4J_BOUNDARY_MISSING');
  }
  delete require.cache[require.resolve(liveNeo4jBoundaryPath)];
  const boundary = require(liveNeo4jBoundaryPath);
  if (typeof boundary.createApprovedNeo4jBoundary !== 'function') {
    throw safeError('LIVE_PROVIDER_NEO4J_BOUNDARY_API_MISSING');
  }
  return boundary.createApprovedNeo4jBoundary;
}

function createRecordingNeo4jAdapter({ expectedPassword, failAuthentication = false }) {
  const authCalls = [];
  const driverCalls = [];
  const queries = [];
  const rawExceptions = [];
  return {
    auth: {
      basic(username, password) {
        authCalls.push({
          usernamePresent: typeof username === 'string' && username.length > 0,
          passwordMatches: password === expectedPassword,
        });
        return { type: 'basic-auth' };
      },
    },
    driver(uri, authentication) {
      driverCalls.push({ uri, authentication });
      return {
        async verifyConnectivity() {
          if (failAuthentication) {
            const error = new Error('NEO4J_AUTHENTICATION_FAILED');
            rawExceptions.push(error);
            throw error;
          }
        },
        session() {
          return {
            async run(cypher, parameters) {
              queries.push({ cypher, parameters });
              return {
                records: cypher.includes('RETURN count')
                  ? [{ get: () => ({ toNumber: () => 0 }) }]
                  : [],
              };
            },
            async close() {},
          };
        },
        async close() {},
      };
    },
    observation() {
      return {
        authCalls: [...authCalls],
        driverCalls: [...driverCalls],
        queries: [...queries],
        rawExceptions: [...rawExceptions],
      };
    },
  };
}

function normalizeNeo4jEvidence(evidence) {
  const dimensions = evidence && evidence.dimensions;
  return {
    ...evidence,
    dimensions: dimensions && typeof dimensions.toNumber === 'function'
      ? dimensions.toNumber()
      : dimensions,
  };
}

function createInMemoryZeroWriteBoundary() {
  let writes = 0;
  return {
    async writeEvidence() {
      writes += 1;
    },
    writeCount() {
      return writes;
    },
  };
}

function createRecordingInMemoryIndexBoundary() {
  const graphEvidence = [];
  const cypherTextAndParameters = [];
  return {
    async writeEvidence(evidence) {
      const capturedEvidence = structuredClone(evidence);
      graphEvidence.push(capturedEvidence);
      cypherTextAndParameters.push({
        cypher: 'CREATE (e:ArgoLiveEmbeddingEvidence) SET e = $evidence',
        parameters: { evidence: capturedEvidence },
      });
    },
    observedCypher() {
      return structuredClone(cypherTextAndParameters);
    },
    readEvidence() {
      return structuredClone(graphEvidence);
    },
    persistedCount() {
      return graphEvidence.length;
    },
    async cleanup() {
      graphEvidence.length = 0;
      cypherTextAndParameters.length = 0;
    },
  };
}

function createCapturingLogger() {
  const values = [];
  return {
    info(...args) {
      values.push({ level: 'info', args });
    },
    warn(...args) {
      values.push({ level: 'warn', args });
    },
    error(...args) {
      values.push({ level: 'error', args });
    },
    observations() {
      return [...values];
    },
  };
}

async function captureOutcome(action) {
  try {
    await action();
    return { status: 'unexpected-success' };
  } catch (error) {
    return {
      status: 'blocked',
      category: safeCategory(error),
      message: safeCategory(error),
    };
  }
}

async function captureProcessOutput(action) {
  const stdout = [];
  const stderr = [];
  const originalStdoutWrite = process.stdout.write;
  const originalStderrWrite = process.stderr.write;
  process.stdout.write = function captureStdout(chunk, ...args) {
    stdout.push(String(chunk));
    return true;
  };
  process.stderr.write = function captureStderr(chunk, ...args) {
    stderr.push(String(chunk));
    return true;
  };
  try {
    const result = await action();
    return { result, stdout, stderr };
  } finally {
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
  }
}

function approvedSyntheticConfiguration() {
  return {
    embeddingBaseUrl: APPROVED_PROFILE.baseUrl,
    embeddingModel: APPROVED_PROFILE.model,
    embeddingProvider: APPROVED_PROFILE.provider,
    embeddingModelVersion: APPROVED_PROFILE.version,
    embeddingDimensions: APPROVED_PROFILE.dimensions,
    qwenKey: `synthetic-qwen-${crypto.randomUUID()}`,
    neo4jDatabaseUrl: 'neo4j://synthetic.invalid',
    neo4jDatabaseUsername: 'synthetic-user',
    neo4jDatabasePassword: `synthetic-neo4j-${crypto.randomUUID()}`,
  };
}

function readPersistentArtifactsRecursively() {
  const artifacts = [
    { name: 'design/KG/SystemArchitecture.json', value: readOptional('design/KG/SystemArchitecture.json') },
    { name: 'design/KG/test-failure-records.json', value: readOptional('design/KG/test-failure-records.json') },
  ];
  for (const relativeDirectory of ['tests/.artifacts/live-provider', 'tests/snapshots']) {
    collectFilesRecursively(relativeDirectory, artifacts);
  }
  return artifacts;
}

function collectFilesRecursively(relativePath, artifacts) {
  const absolutePath = path.join(repoRoot, ...relativePath.split('/'));
  if (!fs.existsSync(absolutePath)) {
    return;
  }
  for (const entry of fs.readdirSync(absolutePath, { withFileTypes: true })) {
    const childRelativePath = `${relativePath}/${entry.name}`;
    if (entry.isDirectory()) {
      collectFilesRecursively(childRelativePath, artifacts);
    } else if (entry.isFile()) {
      artifacts.push({ name: childRelativePath, value: fs.readFileSync(path.join(absolutePath, entry.name)) });
    }
  }
}

function findSecretLeaks(secret, artifacts) {
  if (typeof secret !== 'string' || secret.length === 0) {
    throw safeError('SECRET_INSPECTION_VALUE_REQUIRED');
  }
  return artifacts
    .filter(artifact => serializeArtifact(artifact.value).includes(secret))
    .map(artifact => artifact.name);
}

function findSourceOutcomeLeaks({
  outcome,
  captured,
  qwen,
  neo4jPassword,
  artifacts = readPersistentArtifactsRecursively(),
}) {
  const channels = [
    { name: 'configurationError', value: outcome.rawError },
    { name: 'stdout', value: captured.stdout },
    { name: 'stderr', value: captured.stderr },
    ...artifacts,
  ];
  return [
    ...findSecretLeaks(qwen, channels),
    ...findSecretLeaks(neo4jPassword, channels),
  ];
}

function findForbiddenSecretFields(artifacts) {
  const forbidden = /(?:authorization|api[_-]?key|credential|secret|token)/i;
  const findings = [];
  for (const artifact of artifacts) {
    inspectKeys(artifact.value, artifact.name, forbidden, findings);
  }
  return findings;
}

function inspectKeys(value, location, forbidden, findings) {
  if (!value || typeof value !== 'object' || Buffer.isBuffer(value)) {
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (forbidden.test(key) && typeof child !== 'boolean') {
      findings.push(`${location}:${key}`);
    }
    inspectKeys(child, `${location}.${key}`, forbidden, findings);
  }
}

function serializeArtifact(value) {
  if (value === undefined || value === null) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (Buffer.isBuffer(value)) {
    return value.toString('utf8');
  }
  if (typeof value !== 'object') {
    return String(value);
  }
  const serialized = JSON.stringify(toSerializableArtifact(value, new WeakSet()));
  return typeof serialized === 'string' ? serialized : '';
}

function toSerializableArtifact(value, seen) {
  if (Buffer.isBuffer(value)) return value.toString('utf8');
  if (value === null || value === undefined) return '';
  if (typeof value !== 'object') return String(value);
  if (seen.has(value)) return '[circular]';
  seen.add(value);
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack || '',
      cause: toSerializableArtifact(value.cause, seen),
      errors: toSerializableArtifact(value.errors, seen),
      properties: Object.fromEntries(Object.entries(value).map(([key, child]) => [
        key,
        toSerializableArtifact(child, seen),
      ])),
    };
  }
  if (Array.isArray(value)) return value.map(item => toSerializableArtifact(item, seen));
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [
    key,
    toSerializableArtifact(child, seen),
  ]));
}

function hasProtectedHeader(headers) {
  if (!headers) {
    return false;
  }
  if (typeof headers.get === 'function') {
    return headers.has('authorization');
  }
  return Object.keys(headers).some(key => key.toLowerCase() === 'authorization');
}

function fingerprint(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function requireConfigurationValue(configuration, name) {
  const value = configuration && configuration[name];
  if (typeof value !== 'string' || value.trim() === '') {
    const error = safeError('CONTROLLED_NEO4J_CONFIG_REQUIRED');
    error.field = name;
    throw error;
  }
  return value;
}

function readOptional(relativePath) {
  const absolutePath = path.join(repoRoot, ...relativePath.split('/'));
  return fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath) : Buffer.alloc(0);
}

function safeCategory(error) {
  return typeof error?.category === 'string' ? error.category : 'LIVE_PROVIDER_OPERATION_FAILED';
}

function safeError(category) {
  const error = new Error(category);
  error.category = category;
  return error;
}

module.exports = {
  APPROVED_SOURCE_FIXTURES,
  FAILURE_CASES,
  approvedProviderProfile,
  findForbiddenSecretFields,
  findSecretLeaks,
  runApplyMutationEmbeddingVectorE2E,
  runLiveEmbeddingProviderE2E,
  runLiveProviderSecretIsolation,
  runNeo4jAuthenticationCanaryProbe,
  runApprovedSourceFixtureMatrix,
  runArtifactSerializationContractSelfTest,
  runAuthenticationLeakDetectorSelfTest,
  runStructuredSourceAdapterContractSelfTest,
  runRecordingBoundaryCanarySelfTest,
  runRedactionCanaryProbe,
  safeCategory,
};

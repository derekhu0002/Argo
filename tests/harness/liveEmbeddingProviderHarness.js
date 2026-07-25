const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const liveGatePath = path.join(repoRoot, '.argo', 'scripts', 'graph-rag', 'liveEmbeddingIndexGate.js');
const liveConfigPath = path.join(repoRoot, '.argo', 'scripts', 'graph-rag', 'liveEmbeddingProviderConfig.js');
const LIVE_OPT_IN = 'ARGO_LIVE_PROVIDER_E2E';
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
  { name: 'process-only', expectedStatus: 'accepted', expectedAttribution: { QWEN_KEY: 'process', ARGO_NEO4J_DATABASE_PASSWORD: 'process' } },
  { name: 'file-only', expectedStatus: 'accepted', file: true, expectedAttribution: { QWEN_KEY: 'file', ARGO_NEO4J_DATABASE_PASSWORD: 'file' } },
  { name: 'matching-dual', expectedStatus: 'accepted', file: true, process: true, expectedAttribution: { QWEN_KEY: 'process', ARGO_NEO4J_DATABASE_PASSWORD: 'process' } },
  { name: 'qwen-conflict', expectedCategory: 'SECRET_SOURCE_CONFLICT', file: true, process: true, conflictKey: 'QWEN_KEY' },
  { name: 'database-password-conflict', expectedCategory: 'SECRET_SOURCE_CONFLICT', file: true, process: true, conflictKey: 'ARGO_NEO4J_DATABASE_PASSWORD' },
  { name: 'missing-secret', expectedCategory: 'APPROVED_SECRET_REQUIRED', omitKey: 'QWEN_KEY' },
  { name: 'blank-secret', expectedCategory: 'APPROVED_SECRET_REQUIRED', blankKey: 'ARGO_NEO4J_DATABASE_PASSWORD' },
  { name: 'duplicate-key', expectedCategory: 'SECRET_FILE_DUPLICATE_KEY', file: true, duplicateKey: 'QWEN_KEY' },
  { name: 'unknown-secret', expectedCategory: 'SECRET_FILE_UNKNOWN_KEY', file: true, unknownKey: 'OTHER_API_TOKEN' },
  { name: 'root-file', expectedCategory: 'SECRET_FILE_PATH_PROHIBITED', file: true, relativePath: '.env' },
  { name: 'alternate-file', expectedCategory: 'SECRET_FILE_PATH_PROHIBITED', file: true, relativePath: 'config/.env' },
  { name: 'tracked-file', expectedCategory: 'SECRET_FILE_TRACKED', file: true, tracked: true },
  { name: 'not-ignored', expectedCategory: 'SECRET_FILE_NOT_IGNORED', file: true, ignored: false },
  { name: 'reparse-file', expectedCategory: 'SECRET_FILE_REPARSE_PROHIBITED', file: true, reparse: true },
  { name: 'acl-current-allow', expectedStatus: 'accepted', file: true, expectedAttribution: { QWEN_KEY: 'file', ARGO_NEO4J_DATABASE_PASSWORD: 'file' }, aclCase: 'current-allow' },
  { name: 'acl-current-deny', expectedCategory: 'SECRET_FILE_ACL_UNSAFE', file: true, aclCase: 'current-deny' },
  { name: 'acl-broad-inherited-allow', expectedCategory: 'SECRET_FILE_ACL_UNSAFE', file: true, aclCase: 'broad-inherited-allow' },
  { name: 'acl-broad-deny-only', expectedStatus: 'accepted', file: true, expectedAttribution: { QWEN_KEY: 'file', ARGO_NEO4J_DATABASE_PASSWORD: 'file' }, aclCase: 'broad-deny-only' },
  { name: 'acl-unverifiable', expectedCategory: 'SECRET_FILE_ACL_UNVERIFIABLE', file: true, aclCase: 'unverifiable' },
  { name: 'cli-source', expectedCategory: 'SECRET_SOURCE_PROVENANCE_PROHIBITED', argv: ['--QWEN_KEY=synthetic'] },
  { name: 'literal-source', expectedCategory: 'SECRET_SOURCE_PROVENANCE_PROHIBITED', provenance: 'literal' },
  { name: 'fallback-source', expectedCategory: 'SECRET_SOURCE_PROVENANCE_PROHIBITED', provenance: 'fallback' },
  { name: 'alias-source', expectedCategory: 'SECRET_SOURCE_PROVENANCE_PROHIBITED', provenance: 'alias' },
  { name: 'indirect-source', expectedCategory: 'SECRET_SOURCE_PROVENANCE_PROHIBITED', provenance: 'indirect' },
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
    environment: process.env,
  });
}

async function runApprovedSourceFixtureMatrix() {
  const resolveConfiguration = loadApprovedConfigurationBoundary();
  const observations = [];
  for (const fixture of APPROVED_SOURCE_FIXTURES) {
    observations.push(await runApprovedSourceFixture(resolveConfiguration, fixture));
  }
  return observations;
}

async function runApprovedSourceFixture(resolveConfiguration, fixture) {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'argo-approved-source-'));
  const qwen = `fixture-qwen-${crypto.randomUUID()}`;
  const neo4jPassword = `fixture-neo4j-${crypto.randomUUID()}`;
  const processValues = {};
  const fileEntries = [];
  const useProcess = fixture.process || !fixture.file;
  if (useProcess && fixture.omitKey !== 'QWEN_KEY') processValues.QWEN_KEY = fixture.blankKey === 'QWEN_KEY' ? ' ' : qwen;
  if (useProcess && fixture.omitKey !== 'ARGO_NEO4J_DATABASE_PASSWORD') {
    processValues.ARGO_NEO4J_DATABASE_PASSWORD = fixture.blankKey === 'ARGO_NEO4J_DATABASE_PASSWORD' ? ' ' : neo4jPassword;
  }
  if (fixture.file) {
    if (fixture.omitKey !== 'QWEN_KEY') fileEntries.push(['QWEN_KEY', fixture.conflictKey === 'QWEN_KEY' ? `${qwen}-different` : qwen]);
    if (fixture.omitKey !== 'ARGO_NEO4J_DATABASE_PASSWORD') {
      fileEntries.push(['ARGO_NEO4J_DATABASE_PASSWORD', fixture.conflictKey === 'ARGO_NEO4J_DATABASE_PASSWORD' ? `${neo4jPassword}-different` : neo4jPassword]);
    }
    if (fixture.duplicateKey) fileEntries.push([fixture.duplicateKey, fixture.duplicateKey === 'QWEN_KEY' ? qwen : neo4jPassword]);
    if (fixture.unknownKey) fileEntries.push([fixture.unknownKey, 'synthetic']);
  }
  const relativePath = fixture.relativePath || '.argo/.env';
  const filePath = path.join(temporaryRoot, ...relativePath.split('/'));
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
          value: await resolveConfiguration({
            repositoryRoot: temporaryRoot,
            environment: processValues,
            argv: fixture.argv || [],
            provenance: fixture.provenance || 'direct',
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
    const leaks = [
      ...findSecretLeaks(qwen, [
        { name: 'configurationError', value: outcome.rawError },
        { name: 'stdout', value: captured.stdout },
        { name: 'stderr', value: captured.stderr },
        ...readPersistentArtifactsRecursively(),
      ]),
      ...findSecretLeaks(neo4jPassword, [
        { name: 'configurationError', value: outcome.rawError },
        { name: 'stdout', value: captured.stdout },
        { name: 'stderr', value: captured.stderr },
        ...readPersistentArtifactsRecursively(),
      ]),
    ];
    const observation = {
      name: fixture.name,
      status: outcome.status,
      category: outcome.category,
      attribution: outcome.value && outcome.value.attribution,
      selectedValuesMatch: outcome.value
        ? selectedFixtureValuesMatch(outcome.value, qwen, neo4jPassword)
        : undefined,
      effects,
      leaks,
      expectedStatus: fixture.expectedStatus,
      expectedCategory: fixture.expectedCategory,
      expectedAttribution: fixture.expectedAttribution,
    };
    return observation;
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

function loadApprovedConfigurationBoundary() {
  if (!fs.existsSync(liveConfigPath)) throw safeError('LIVE_PROVIDER_CONFIGURATION_BOUNDARY_MISSING');
  delete require.cache[require.resolve(liveConfigPath)];
  const boundary = require(liveConfigPath);
  if (typeof boundary.resolveApprovedLiveConfiguration !== 'function') {
    throw safeError('LIVE_PROVIDER_CONFIGURATION_API_MISSING');
  }
  return boundary.resolveApprovedLiveConfiguration;
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
    readFileSync: fs.readFileSync,
    realpathSync: fs.realpathSync,
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
    'current-allow': { status: 0, identity, stdout: `${identity}:(R)` },
    'current-deny': { status: 0, identity, stdout: `${identity}:(DENY)(R)` },
    'broad-inherited-allow': { status: 0, identity, stdout: `${identity}:(F)\nBUILTIN\\Users:(I)(RX)` },
    'broad-deny-only': { status: 0, identity, stdout: `${identity}:(R)\nEveryone:(DENY)(R)` },
    unverifiable: { status: 1, identity, stdout: '' },
  };
  return {
    inspect() {
      return matrix[fixture.aclCase || 'current-allow'];
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

function selectedFixtureValuesMatch(result, qwen, neo4jPassword) {
  return result.configuration
    && result.configuration.qwenKey === qwen
    && result.configuration.neo4jDatabasePassword === neo4jPassword;
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
  const passwordCanary = `neo4j-auth-canary-${crypto.randomUUID()}`;
  const configuration = {
    neo4jDatabaseUrl: 'neo4j://synthetic.invalid',
    neo4jDatabaseUsername: 'synthetic-user',
    neo4jDatabasePassword: passwordCanary,
  };
  const successAdapter = createRecordingNeo4jAdapter();
  const boundary = await createControlledNeo4jIndexBoundary('auth-success', configuration, successAdapter);
  await boundary.countWrites();
  await boundary.cleanup();
  const failureAdapter = createRecordingNeo4jAdapter(passwordCanary);
  const failure = await captureOutcome(() => createControlledNeo4jIndexBoundary(
    'auth-failure',
    configuration,
    failureAdapter,
  ));
  return {
    authCalls: successAdapter.observation().authCalls.map(call => ({
      usernameMatches: call.username === configuration.neo4jDatabaseUsername,
      passwordMatches: call.password === passwordCanary,
    })),
    cypherLeaks: findSecretLeaks(passwordCanary, [
      { name: 'cypherTextAndParameters', value: successAdapter.observation().queries },
    ]),
    authenticationFailure: failure,
    authenticationFailureLeaks: findSecretLeaks(passwordCanary, [
      { name: 'authenticationFailure', value: failure },
    ]),
    failureQueries: failureAdapter.observation().queries.length,
  };
}

function createRecordingNeo4jAdapter(authenticationFailureCanary) {
  const authCalls = [];
  const queries = [];
  return {
    auth: {
      basic(username, password) {
        authCalls.push({ username, password });
        return { type: 'basic-auth' };
      },
    },
    driver() {
      return {
        async verifyConnectivity() {
          if (authenticationFailureCanary) throw new Error(authenticationFailureCanary);
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
      return { authCalls: [...authCalls], queries: [...queries] };
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
  if (Buffer.isBuffer(value)) {
    return value.toString('utf8');
  }
  if (value instanceof Error) {
    return `${value.name}\n${value.message}\n${value.stack || ''}`;
  }
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value);
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
  runLiveEmbeddingProviderE2E,
  runLiveProviderSecretIsolation,
  runNeo4jAuthenticationCanaryProbe,
  runApprovedSourceFixtureMatrix,
  runRecordingBoundaryCanarySelfTest,
  runRedactionCanaryProbe,
  safeCategory,
};

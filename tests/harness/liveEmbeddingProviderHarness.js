const crypto = require('node:crypto');
const fs = require('node:fs');
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
  const approvedSecretChannels = runApprovedSecretChannelSelfTest();
  return {
    failure: {
      category: captured.result.category,
      providerCalls: transport.observation().callCount,
      writes: indexBoundary.writeCount(),
      leaks: findSecretLeaks(failureCanary, artifacts),
    },
    syntheticSuccess,
    approvedSecretChannels,
    inspectedArtifactNames: [
      ...artifacts.map(artifact => artifact.name),
      'cypherTextAndParameters',
      'graphEvidence',
    ],
  };
}

function runApprovedSecretChannelSelfTest() {
  const results = {};
  for (const [name, canary] of [
    ['QWEN_KEY', `qwen-channel-${crypto.randomUUID()}`],
    ['ARGO_NEO4J_DATABASE_PASSWORD', `neo4j-channel-${crypto.randomUUID()}`],
  ]) {
    const rawChannels = [
      { name: 'processSource', value: { neutral: canary } },
      { name: 'fileSource', value: { neutral: canary } },
      { name: 'conflictError', value: new Error(canary) },
      { name: 'aclError', value: new Error(canary) },
      { name: 'connectionAuthenticationError', value: new Error(canary) },
    ];
    const sanitizedChannels = [
      { name: 'conflictError', value: 'SECRET_SOURCE_CONFLICT' },
      { name: 'aclError', value: 'SECRET_FILE_ACL_UNSAFE' },
      { name: 'connectionAuthenticationError', value: 'NEO4J_AUTHENTICATION_FAILED' },
    ];
    results[name] = {
      detectedRawChannels: findSecretLeaks(canary, rawChannels),
      sanitizedLeaks: findSecretLeaks(canary, sanitizedChannels),
    };
  }
  return results;
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

async function createControlledNeo4jIndexBoundary(label, configuration) {
  const neo4j = require('neo4j-driver');
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
  FAILURE_CASES,
  approvedProviderProfile,
  findForbiddenSecretFields,
  findSecretLeaks,
  runLiveEmbeddingProviderE2E,
  runLiveProviderSecretIsolation,
  runRecordingBoundaryCanarySelfTest,
  runRedactionCanaryProbe,
  safeCategory,
};

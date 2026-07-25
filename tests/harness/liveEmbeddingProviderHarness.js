const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const liveGatePath = path.join(repoRoot, '.argo', 'scripts', 'graph-rag', 'liveEmbeddingIndexGate.js');
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
  requireProcessSecretPresence();
  const createGate = loadLiveGateFactory();
  const input = `Argo live embedding ${crypto.randomUUID()}`;
  const identities = dynamicEvidenceIdentities();
  const transport = createObservedHttpTransport(global.fetch);
  const indexBoundary = await createControlledNeo4jIndexBoundary('success');
  const logger = createCapturingLogger();

  try {
    const gate = createGate({
      environment: process.env,
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
    const failureObservations = await runFailureMatrix(createGate, identities);
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

async function runFailureMatrix(createGate, identities) {
  const observations = [];
  for (const testCase of FAILURE_CASES) {
    const indexBoundary = await createControlledNeo4jIndexBoundary(testCase.name);
    const logger = createCapturingLogger();
    const canary = `redaction-canary-${crypto.randomUUID()}`;
    const transport = createFailureTransport(testCase.transport, canary);
    try {
      const gate = createGate({
        environment: process.env,
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
  requireProcessSecretPresence();
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
  const canary = `redaction-canary-${crypto.randomUUID()}`;
  const transport = createFailureTransport('provider-error', canary);
  const indexBoundary = createInMemoryZeroWriteBoundary();
  const logger = createCapturingLogger();
  const captured = await captureProcessOutput(async () => {
    const gate = createGate({
      environment: approvedSyntheticEnvironment(canary),
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
  return {
    category: captured.result.category,
    providerCalls: transport.observation().callCount,
    writes: indexBoundary.writeCount(),
    inspectedArtifactNames: artifacts.map(artifact => artifact.name),
    leaks: findSecretLeaks(canary, artifacts),
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

function requireProcessSecretPresence() {
  if (!Object.prototype.hasOwnProperty.call(process.env, 'QWEN_KEY')
    || typeof process.env.QWEN_KEY !== 'string'
    || process.env.QWEN_KEY.length === 0) {
    throw safeError('QWEN_KEY_REQUIRED');
  }
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

async function createControlledNeo4jIndexBoundary(label) {
  const neo4j = require('neo4j-driver');
  const uri = requireExternalValue('ARGO_NEO4J_URI');
  const username = requireExternalValue('ARGO_NEO4J_USERNAME');
  const password = requireExternalValue('ARGO_NEO4J_PASSWORD');
  const database = process.env.ARGO_NEO4J_DATABASE;
  const runId = `argo-live-${label}-${crypto.randomUUID()}`;
  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  const observedCypher = [];
  let closed = false;
  await driver.verifyConnectivity();

  async function query(cypher, parameters = {}) {
    observedCypher.push({ cypher, parameters });
    const session = driver.session(database ? { database } : {});
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

function approvedSyntheticEnvironment(canary) {
  return {
    [LIVE_OPT_IN]: '1',
    QWEN_KEY: canary,
    ARGO_EMBEDDING_BASE_URL: APPROVED_PROFILE.baseUrl,
    ARGO_EMBEDDING_MODEL: APPROVED_PROFILE.model,
    ARGO_EMBEDDING_PROVIDER: APPROVED_PROFILE.provider,
    ARGO_EMBEDDING_MODEL_VERSION: APPROVED_PROFILE.version,
    ARGO_EMBEDDING_DIMENSIONS: String(APPROVED_PROFILE.dimensions),
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

function requireExternalValue(name) {
  const value = process.env[name];
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
  runRedactionCanaryProbe,
  safeCategory,
};

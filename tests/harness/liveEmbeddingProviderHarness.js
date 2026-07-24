const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const liveGatePath = path.join(
  repoRoot,
  '.argo',
  'scripts',
  'graph-rag',
  'liveEmbeddingIndexGate.js',
);
const LIVE_OPT_IN = 'ARGO_LIVE_PROVIDER_E2E';
const LIVE_INPUT = 'Argo controlled live embedding qualification probe';
const APPROVED_PROFILE = Object.freeze({
  approvedByHuman: true,
  provider: 'alibaba-cloud-model-studio-openai-compatible-cn-beijing',
  baseUrl: 'https://llm-clids9mqc5o1mbvb.cn-beijing.maas.aliyuncs.com/compatible-mode/v1',
  model: 'qwen3.7-text-embedding',
  version: 'qualification-2026-07-25',
  dimensions: 1024,
  source: 'explicit-human-approval',
});
const FAILURE_SCENARIOS = Object.freeze([
  'provider-error',
  'unapproved-identity',
  'missing-model',
  'missing-dimensions',
  'non-finite-vector',
  'dimension-mismatch',
]);

async function runLiveEmbeddingProviderE2E() {
  requireLiveOptIn('LIVE_PROVIDER_E2E_OPT_IN_REQUIRED');
  const boundary = loadLiveGate();
  const successIndex = await createControlledNeo4jIndexBoundary('success');
  const failureObservations = [];
  const logs = [];
  const logger = createCapturingLogger(logs);

  try {
    const writesBefore = await successIndex.countWrites();
    const success = await boundary.executeApprovedEmbedding({
      input: LIVE_INPUT,
      qualification: approvedProviderProfile(),
      indexBoundary: successIndex,
      logger,
    });
    const writesAfter = await successIndex.countWrites();
    const graphEvidence = await successIndex.readEvidence();

    for (const scenario of FAILURE_SCENARIOS) {
      const failureIndex = await createControlledNeo4jIndexBoundary(scenario);
      try {
        const before = await failureIndex.countWrites();
        const outcome = await captureOutcome(() => boundary.executeFailureScenario({
          scenario,
          input: LIVE_INPUT,
          qualification: approvedProviderProfile(),
          indexBoundary: failureIndex,
          logger,
        }));
        const after = await failureIndex.countWrites();
        failureObservations.push({
          scenario,
          before,
          after,
          status: outcome.status,
          category: outcome.category,
        });
      } finally {
        await failureIndex.cleanup();
      }
    }

    return {
      liveOptIn: true,
      success,
      writesBefore,
      writesAfter,
      graphEvidence,
      cypherEvidence: successIndex.observedCypher(),
      failureObservations,
      logs,
      approvedProfile: approvedProviderProfile(),
    };
  } finally {
    await successIndex.cleanup();
  }
}

async function runLiveProviderSecretIsolation() {
  requireLiveOptIn('LIVE_PROVIDER_SECRET_ISOLATION_OPT_IN_REQUIRED');
  const secret = requireProcessSecret();
  const observation = await runLiveEmbeddingProviderE2E();
  const observableArtifacts = [
    { name: 'requestEvidence', value: observation.success.requestEvidence },
    { name: 'qualificationEvidence', value: observation.success.qualification },
    { name: 'graphEvidence', value: observation.graphEvidence },
    { name: 'cypherTextAndParameters', value: observation.cypherEvidence },
    { name: 'failureObservations', value: observation.failureObservations },
    { name: 'logs', value: observation.logs },
    ...readPersistentArtifacts(),
  ];
  const leaks = findSecretLeaks(secret, observableArtifacts);
  return {
    observation,
    inspectedArtifactNames: observableArtifacts.map(artifact => artifact.name),
    leaks,
  };
}

function approvedProviderProfile(overrides = {}) {
  return { ...APPROVED_PROFILE, ...overrides };
}

function requireLiveOptIn(category) {
  if (process.env[LIVE_OPT_IN] !== '1') {
    throw safeError(category);
  }
}

function requireProcessSecret() {
  const value = process.env.QWEN_KEY;
  if (typeof value !== 'string' || value.length === 0) {
    throw safeError('QWEN_KEY_REQUIRED');
  }
  return value;
}

function loadLiveGate() {
  if (!fs.existsSync(liveGatePath)) {
    throw safeError('LIVE_PROVIDER_E2E_BOUNDARY_MISSING');
  }
  delete require.cache[require.resolve(liveGatePath)];
  const boundary = require(liveGatePath);
  if (typeof boundary.executeApprovedEmbedding !== 'function'
    || typeof boundary.executeFailureScenario !== 'function') {
    throw safeError('LIVE_PROVIDER_E2E_API_MISSING');
  }
  return boundary;
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

  return {
    runId,
    async writeEvidence(evidence) {
      await query(
        'CREATE (e:ArgoLiveEmbeddingEvidence { runId: $runId, vector: $vector, provider: $provider, model: $model, qualificationVersion: $qualificationVersion, dimensions: $dimensions })',
        {
          runId,
          vector: evidence.vector,
          provider: evidence.provider,
          model: evidence.model,
          qualificationVersion: evidence.qualificationVersion,
          dimensions: evidence.dimensions,
        },
      );
    },
    async countWrites() {
      const result = await query(
        'MATCH (e:ArgoLiveEmbeddingEvidence { runId: $runId }) RETURN count(e) AS count',
        { runId },
      );
      return result.records[0].get('count').toNumber();
    },
    async readEvidence() {
      const result = await query(
        'MATCH (e:ArgoLiveEmbeddingEvidence { runId: $runId }) RETURN e { .runId, .provider, .model, .qualificationVersion, .dimensions, vectorLength: size(e.vector) } AS evidence',
        { runId },
      );
      return result.records.map(record => record.get('evidence'));
    },
    observedCypher() {
      return [...observedCypher];
    },
    async cleanup() {
      try {
        await query(
          'MATCH (e:ArgoLiveEmbeddingEvidence { runId: $runId }) DELETE e',
          { runId },
        );
      } finally {
        await driver.close();
      }
    },
  };
}

function createCapturingLogger(logs) {
  return {
    info(...values) {
      logs.push({ level: 'info', values });
    },
    warn(...values) {
      logs.push({ level: 'warn', values });
    },
    error(...values) {
      logs.push({ level: 'error', values });
    },
  };
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

async function captureOutcome(action) {
  try {
    await action();
    return { status: 'unexpected-write-eligible-success' };
  } catch (error) {
    return {
      status: 'blocked',
      category: safeCategory(error),
    };
  }
}

function readPersistentArtifacts() {
  const artifacts = [];
  for (const relativePath of [
    'design/KG/SystemArchitecture.json',
    'design/KG/test-failure-records.json',
  ]) {
    artifacts.push({
      name: relativePath,
      value: fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8'),
    });
  }
  for (const relativeDirectory of [
    'tests/.artifacts/live-provider',
    'tests/snapshots',
  ]) {
    const absoluteDirectory = path.join(repoRoot, ...relativeDirectory.split('/'));
    if (!fs.existsSync(absoluteDirectory)) {
      continue;
    }
    for (const entry of fs.readdirSync(absoluteDirectory, { withFileTypes: true })) {
      if (entry.isFile()) {
        artifacts.push({
          name: `${relativeDirectory}/${entry.name}`,
          value: fs.readFileSync(path.join(absoluteDirectory, entry.name)),
        });
      }
    }
  }
  return artifacts;
}

function findSecretLeaks(secret, artifacts) {
  if (typeof secret !== 'string' || secret.length === 0) {
    throw safeError('SECRET_INSPECTION_VALUE_REQUIRED');
  }
  return artifacts
    .filter(artifact => serializeArtifact(artifact.value).includes(secret))
    .map(artifact => artifact.name);
}

function serializeArtifact(value) {
  if (Buffer.isBuffer(value)) {
    return value.toString('utf8');
  }
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value);
}

function safeCategory(error) {
  return typeof error?.category === 'string'
    ? error.category
    : 'LIVE_PROVIDER_OPERATION_FAILED';
}

function safeError(category) {
  const error = new Error(category);
  error.category = category;
  return error;
}

module.exports = {
  FAILURE_SCENARIOS,
  approvedProviderProfile,
  findSecretLeaks,
  runLiveEmbeddingProviderE2E,
  runLiveProviderSecretIsolation,
  safeCategory,
};

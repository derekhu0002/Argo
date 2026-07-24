const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const runtimePath = path.join(repoRoot, '.argo', 'scripts', 'graph-rag', 'productionGraphRagRuntime.js');
const externalConfigPath = path.join(repoRoot, '.argo', 'scripts', 'graph-rag', 'externalProductionConfig.js');
const qualificationGatePath = path.join(repoRoot, '.argo', 'scripts', 'graph-rag', 'embeddingQualificationGate.js');
const canonicalAuthorityPath = path.join(repoRoot, '.argo', 'scripts', 'graph-rag', 'canonicalProjectionAuthority.js');
const nativeRetrievalPath = path.join(repoRoot, '.argo', 'scripts', 'graph-rag', 'neo4jNativeRetrieval.js');

function approvedEmbeddingQualification(overrides = {}) {
  return {
    approvedByHuman: true,
    provider: 'approved-test-provider',
    model: 'approved-test-model',
    version: '2026-07-24',
    dimensions: 1536,
    ...overrides,
  };
}

function externalProductionConfiguration(overrides = {}) {
  return {
    neo4jUri: 'neo4j://test.invalid:7687',
    neo4jUsername: 'externally-supplied-user',
    neo4jPassword: 'externally-supplied-test-secret',
    embeddingCredential: 'externally-supplied-test-token',
    ...overrides,
  };
}

function canonicalGraphFixture() {
  return {
    version: 'canonical-v2',
    elements: [{ id: 'approved-element', name: 'Approved Intent' }],
    relationships: [],
    views: [],
  };
}

function createNativeRetrievalProbe() {
  const requests = [];
  const queryBoundary = {
    async query(request) {
      requests.push(request);
      return {
        retrievalPlatform: 'neo4j-native',
        canonicalVersion: 'canonical-v2',
        seeds: [{ objectType: 'Element', id: 'approved-element' }],
      };
    },
  };
  return {
    queryBoundary,
    invocationCount() {
      return requests.length;
    },
    observedRequests() {
      return [...requests];
    },
  };
}

function alignedNativeRetrievalBoundary() {
  return {
    async retrieve(request) {
      return {
        platform: 'neo4j-native',
        canonicalVersion: 'canonical-v2',
        seeds: [{ objectType: 'Element', id: request.intent === 'Find approved production intent'
          ? 'approved-element'
          : 'unexpected-request' }],
      };
    },
  };
}

function conflictingNativeRetrievalBoundary() {
  return {
    async retrieve() {
      return {
        platform: 'neo4j-native',
        canonicalVersion: 'stale-projection-v1',
        seeds: [{ objectType: 'Element', id: 'projection-only-element' }],
      };
    },
  };
}

async function runProductionSemanticQuery(overrides = {}) {
  const runtime = createRuntime({
    configuration: externalProductionConfiguration(),
    embeddingQualification: approvedEmbeddingQualification(),
    canonicalGraph: canonicalGraphFixture(),
    neo4jRetrievalBoundary: alignedNativeRetrievalBoundary(),
    ...overrides,
  });
  return runtime.querySemantic({ intent: 'Find approved production intent' });
}

async function evaluateCredentialConfiguration(configuration, operation) {
  const boundary = loadBoundary(
    externalConfigPath,
    'EXTERNAL_PRODUCTION_CONFIG_BOUNDARY_MISSING',
  );
  assert.strictEqual(
    typeof boundary.resolveExternalProductionConfig,
    'function',
    'EXTERNAL_PRODUCTION_CONFIG_API_MISSING: export resolveExternalProductionConfig(configuration, context)',
  );
  return captureBusinessOutcome(() => boundary.resolveExternalProductionConfig(
    configuration,
    { operation },
  ));
}

async function evaluateEmbeddingQualification(embeddingQualification) {
  const boundary = loadBoundary(
    qualificationGatePath,
    'EMBEDDING_QUALIFICATION_BOUNDARY_MISSING',
  );
  assert.strictEqual(
    typeof boundary.evaluateEmbeddingQualification,
    'function',
    'EMBEDDING_QUALIFICATION_API_MISSING: export evaluateEmbeddingQualification(qualification)',
  );
  return captureBusinessOutcome(() => boundary.evaluateEmbeddingQualification(embeddingQualification));
}

async function queryWithConflictingProjection() {
  const boundary = loadBoundary(
    canonicalAuthorityPath,
    'CANONICAL_PROJECTION_AUTHORITY_BOUNDARY_MISSING',
  );
  assert.strictEqual(
    typeof boundary.enforceCanonicalProjectionAuthority,
    'function',
    'CANONICAL_PROJECTION_AUTHORITY_API_MISSING: export enforceCanonicalProjectionAuthority(input)',
  );
  const request = { intent: 'Read the approved canonical element' };
  const projection = await conflictingNativeRetrievalBoundary().retrieve(request);
  return captureBusinessOutcome(() => boundary.enforceCanonicalProjectionAuthority({
    canonicalGraph: canonicalGraphFixture(),
    projection,
    request,
  }));
}

async function runNativeRetrievalRequest(request) {
  const boundary = loadBoundary(
    nativeRetrievalPath,
    'NEO4J_NATIVE_RETRIEVAL_BOUNDARY_MISSING',
  );
  assert.strictEqual(
    typeof boundary.createNeo4jNativeRetrieval,
    'function',
    'NEO4J_NATIVE_RETRIEVAL_API_MISSING: export createNeo4jNativeRetrieval(dependencies)',
  );
  const probe = createNativeRetrievalProbe();
  const retrieval = boundary.createNeo4jNativeRetrieval({
    queryBoundary: probe.queryBoundary,
  });
  const result = await retrieval.retrieve(request);
  return {
    result,
    invocationCount: probe.invocationCount(),
    observedRequests: probe.observedRequests(),
  };
}

function inspectCredentialSourceBoundary() {
  const sourcePaths = [
    '.argo/scripts/neo4j-system-architecture-store.js',
    ...listGraphRagJavaScriptPaths(),
  ];
  const hardcodedDefaults = [];
  const cypherCredentialLeaks = [];
  for (const relativePath of sourcePaths) {
    const source = fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
    if (/const\s+DEFAULT_NEO4J_(?:URI|USERNAME|PASSWORD)\s*=\s*['"][^'"]+['"]/.test(source)
      || /(?:neo4jPassword|embeddingCredential)\s*:\s*['"][^'"]+['"]/.test(source)) {
      hardcodedDefaults.push(relativePath);
    }
    if (/(?:MATCH|CALL|CREATE|MERGE)[\s\S]{0,300}(?:password|credential|apiKey)/i.test(source)
      || /ai\.text\.embed(?:Batch)?\s*\([\s\S]{0,300}(?:password|credential|apiKey)/i.test(source)) {
      cypherCredentialLeaks.push(relativePath);
    }
  }
  return { hardcodedDefaults, cypherCredentialLeaks };
}

async function evaluateSevenWaveDelivery(completedWaves) {
  const runtime = createRuntime({
    configuration: externalProductionConfiguration(),
    embeddingQualification: approvedEmbeddingQualification(),
    canonicalGraph: canonicalGraphFixture(),
    neo4jRetrievalBoundary: alignedNativeRetrievalBoundary(),
  });
  return captureBusinessOutcome(() => runtime.evaluateDeliverySequence({ completedWaves }));
}

async function runEmbeddingProviderLifecycle() {
  const persistedRecords = [];
  const runtime = createRuntime({
    configuration: externalProductionConfiguration(),
    embeddingQualification: approvedEmbeddingQualification(),
    canonicalGraph: canonicalGraphFixture(),
    neo4jRetrievalBoundary: alignedNativeRetrievalBoundary(),
    embeddingProviderBoundary: {
      async embed(records) {
        return records.map(record => ({ id: record.id, vector: [0.1, 0.2, 0.3] }));
      },
    },
    vectorPersistenceBoundary: {
      async persist(record) {
        persistedRecords.push(record);
      },
    },
  });
  const outcome = await captureBusinessOutcome(() => runtime.generateAffectedEmbeddings({
    affectedRecords: [
      { objectType: 'Element', id: 'element-1' },
      { objectType: 'ArchitectureRelationship', id: 'relationship-1' },
      { objectType: 'View', id: 'view-1' },
    ],
  }));
  return { outcome, persistedRecords };
}

function assertBlocked(outcome, expectedCategory) {
  assert.strictEqual(
    outcome && outcome.status,
    'blocked',
    `${expectedCategory}: delivery must be blocked`,
  );
  assert.strictEqual(
    outcome && outcome.error && outcome.error.category,
    expectedCategory,
    `${expectedCategory}: stable blocking category is required`,
  );
}

function assertBlockedField(outcome, expectedCategory, expectedField) {
  assertBlocked(outcome, expectedCategory);
  assert.strictEqual(
    outcome && outcome.error && outcome.error.field,
    expectedField,
    `${expectedCategory}: missing field must identify ${expectedField}`,
  );
}

function createRuntime(dependencies) {
  const boundary = loadBoundary(runtimePath, 'PRODUCTION_GRAPH_RAG_RUNTIME_MISSING');
  assert.strictEqual(
    typeof boundary.createProductionGraphRagRuntime,
    'function',
    'PRODUCTION_GRAPH_RAG_BOUNDARY_MISSING: export createProductionGraphRagRuntime(dependencies)',
  );
  return boundary.createProductionGraphRagRuntime(dependencies);
}

function loadBoundary(boundaryPath, missingCategory) {
  assert(
    fs.existsSync(boundaryPath),
    `${missingCategory}: implement the contracted public boundary`,
  );
  return require(boundaryPath);
}

function listGraphRagJavaScriptPaths() {
  const directory = path.join(repoRoot, '.argo', 'scripts', 'graph-rag');
  return fs.readdirSync(directory)
    .filter(file => file.endsWith('.js'))
    .map(file => `.argo/scripts/graph-rag/${file}`);
}

async function captureBusinessOutcome(action) {
  try {
    return await action();
  } catch (error) {
    return {
      status: 'blocked',
      error: {
        category: error && error.category,
        message: error && error.message,
        field: error && error.field,
      },
    };
  }
}

module.exports = {
  alignedNativeRetrievalBoundary,
  approvedEmbeddingQualification,
  assertBlocked,
  assertBlockedField,
  canonicalGraphFixture,
  conflictingNativeRetrievalBoundary,
  createNativeRetrievalProbe,
  evaluateCredentialConfiguration,
  evaluateEmbeddingQualification,
  evaluateSevenWaveDelivery,
  externalProductionConfiguration,
  inspectCredentialSourceBoundary,
  queryWithConflictingProjection,
  runEmbeddingProviderLifecycle,
  runNativeRetrievalRequest,
  runProductionSemanticQuery,
};

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const runtimePath = path.join(repoRoot, '.argo', 'scripts', 'graph-rag', 'productionGraphRagRuntime.js');

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

function alignedNativeRetrievalBoundary() {
  return {
    async retrieve() {
      return {
        platform: 'neo4j-native',
        canonicalVersion: 'canonical-v2',
        seeds: [{ objectType: 'Element', id: 'approved-element' }],
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

async function evaluateIndexDelivery({ configuration, embeddingQualification }) {
  const runtime = createRuntime({
    configuration,
    embeddingQualification,
    canonicalGraph: canonicalGraphFixture(),
    neo4jRetrievalBoundary: alignedNativeRetrievalBoundary(),
  });
  return captureBusinessOutcome(() => runtime.evaluateIndexDelivery());
}

async function queryWithConflictingProjection() {
  const runtime = createRuntime({
    configuration: externalProductionConfiguration(),
    embeddingQualification: approvedEmbeddingQualification(),
    canonicalGraph: canonicalGraphFixture(),
    neo4jRetrievalBoundary: conflictingNativeRetrievalBoundary(),
  });
  return captureBusinessOutcome(() => runtime.querySemantic({
    intent: 'Read the approved canonical element',
  }));
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

function createRuntime(dependencies) {
  assert(
    fs.existsSync(runtimePath),
    'PRODUCTION_GRAPH_RAG_RUNTIME_MISSING: implement the contracted Node.js production boundary',
  );
  const boundary = require(runtimePath);
  assert.strictEqual(
    typeof boundary.createProductionGraphRagRuntime,
    'function',
    'PRODUCTION_GRAPH_RAG_BOUNDARY_MISSING: export createProductionGraphRagRuntime(dependencies)',
  );
  return boundary.createProductionGraphRagRuntime(dependencies);
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
      },
    };
  }
}

module.exports = {
  alignedNativeRetrievalBoundary,
  approvedEmbeddingQualification,
  assertBlocked,
  canonicalGraphFixture,
  conflictingNativeRetrievalBoundary,
  evaluateIndexDelivery,
  evaluateSevenWaveDelivery,
  externalProductionConfiguration,
  queryWithConflictingProjection,
  runEmbeddingProviderLifecycle,
  runProductionSemanticQuery,
};

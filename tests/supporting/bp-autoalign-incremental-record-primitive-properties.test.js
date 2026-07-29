const assert = require('node:assert');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const {
  createPersistentMutationEmbeddingLifecycle,
  withPersistentMutationEmbeddingLifecycleTestComposition,
} = require(path.join(repoRoot, '.argo', 'scripts', 'graph-rag', 'mutationEmbeddingVectorLifecycle.js'));
const {
  createProductionSemanticNeo4jAdapter,
} = require(path.join(repoRoot, '.argo', 'scripts', 'graph-rag', 'semantic-persistence', 'productionSemanticNeo4jAdapter.js'));
const {
  createProductionSemanticProjectionStore,
} = require(path.join(repoRoot, '.argo', 'scripts', 'graph-rag', 'semantic-persistence', 'productionSemanticProjectionStore.js'));

async function main() {
  const observedWrites = [];
  const projectionStore = createProductionSemanticProjectionStore({
    persistenceAdapter: createProductionSemanticNeo4jAdapter({
      configuration: {},
      driver: createPrimitiveOnlyDriver(observedWrites),
    }),
    canonicalAuthority: {
      assertProjectionOnly() {
        return { authority: 'canonical-json' };
      },
    },
    configuration: {
      neo4jDatabaseUrl: 'neo4j://controlled.invalid:7687',
      neo4jDatabaseUsername: 'controlled-user',
      neo4jDatabasePassword: 'controlled-password',
      embeddingCredential: 'controlled-provider-key',
    },
    qualification: approvedQualification(),
  });
  const readinessEvents = [];
  const lifecycle = createPersistentMutationEmbeddingLifecycle();
  const canonicalWrite = {
    written: true,
    architecturePath: 'design/KG/SystemArchitecture.json',
    document: {
      name: 'Primitive Property Pressure Graph',
      elements: [
        {
          id: 'bp-autoalign-goal',
          name: 'Business-Reliable Semantic Lifecycle Completion',
          type: 'Goal',
          description: 'primitive property pressure',
          attributes: [{ name: 'nested', value: 'fixture' }],
        },
      ],
      relationships: [],
      views: [],
    },
    mutations: [{ type: 'updateElement', id: 'bp-autoalign-goal' }],
    touchedElementIds: ['bp-autoalign-goal'],
    touchedRelationshipIds: [],
    touchedViewIds: [],
  };

  const outcome = await withPersistentMutationEmbeddingLifecycleTestComposition({
    observeLifecycleInput() {},
    readiness: {
      async invalidate(evidence) { readinessEvents.push(['invalidate', evidence]); },
      async recordAligned(evidence) { readinessEvents.push(['aligned', evidence]); },
      async recordFailure(evidence) { readinessEvents.push(['failure', evidence]); },
    },
    configuration: {
      async resolve() { return approvedConfiguration(); },
    },
    provider: {
      async embed() {
        return Array.from({ length: 1024 }, (_, index) => index / 2048);
      },
    },
    projectionStore,
    queryability: {
      async verifyTouched() { return true; },
    },
    coherence: {
      async verifyGlobal() { return true; },
    },
  }, () => lifecycle.reconcile({
    canonicalWrite,
    preview: false,
    gates: {
      ARGO_LIVE_PROVIDER_E2E: '1',
      ARGO_W31_LIVE_MUTATION_VECTOR_E2E: '1',
    },
  }));

  assert.strictEqual(outcome.state, 'Aligned', 'BP_AUTOALIGN_INCREMENTAL_PRIMITIVE_PROPERTIES_NOT_ALIGNED');
  assert.strictEqual(observedWrites.length, 1, 'BP_AUTOALIGN_INCREMENTAL_PRIMITIVE_PROPERTIES_WRITE_MISSING');
  assert(
    !Object.prototype.hasOwnProperty.call(observedWrites[0], 'content'),
    'BP_AUTOALIGN_INCREMENTAL_RECORD_NESTED_CONTENT_PERSISTED',
  );
  assert(
    readinessEvents.some(([kind]) => kind === 'aligned'),
    'BP_AUTOALIGN_INCREMENTAL_PRIMITIVE_PROPERTIES_READINESS_NOT_ALIGNED',
  );
}

function createPrimitiveOnlyDriver(observedWrites) {
  return {
    session() {
      return {
        async executeWrite(callback) {
          return callback({
            run(query, parameters = {}) {
              if (Array.isArray(parameters.records)) {
                for (const record of parameters.records) {
                  assertPrimitiveNeo4jProperties(record);
                  observedWrites.push(Object.freeze({ ...record }));
                }
              }
              return Promise.resolve({ records: [] });
            },
          });
        },
        async executeRead(callback) {
          return callback({
            run() {
              return Promise.resolve({ records: observedWrites.map(record => ({ get: () => record })) });
            },
          });
        },
        async close() {},
      };
    },
    async close() {},
  };
}

function assertPrimitiveNeo4jProperties(record) {
  for (const [key, value] of Object.entries(record)) {
    if (Array.isArray(value)) {
      assert(
        value.every(item => item === null || ['string', 'number', 'boolean'].includes(typeof item)),
        `BP_AUTOALIGN_INCREMENTAL_NEO4J_ARRAY_PROPERTY_INVALID:${key}`,
      );
      continue;
    }
    assert(
      value === null || ['string', 'number', 'boolean'].includes(typeof value),
      `BP_AUTOALIGN_INCREMENTAL_NEO4J_PROPERTY_NOT_PRIMITIVE:${key}`,
    );
  }
}

function approvedQualification() {
  return {
    approvedByHuman: true,
    provider: 'alibaba-cloud-model-studio-openai-compatible-cn-beijing',
    model: 'qwen3.7-text-embedding',
    version: 'qualification-2026-07-25',
    dimensions: 1024,
  };
}

function approvedConfiguration() {
  return {
    provider: 'alibaba-cloud-model-studio-openai-compatible-cn-beijing',
    model: 'qwen3.7-text-embedding',
    modelVersion: 'qualification-2026-07-25',
    dimensions: 1024,
  };
}

main().catch(error => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});

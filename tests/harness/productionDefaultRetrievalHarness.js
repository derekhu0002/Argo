const assert = require('node:assert');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const canonicalPath = path.join(repoRoot, 'design', 'KG', 'SystemArchitecture.json');
const defaultRetrievalPath = path.join(repoRoot, '.argo', 'scripts', 'graph-rag', 'defaultSemanticRetrieval.js');
const liveConfigurationPath = path.join(repoRoot, '.argo', 'scripts', 'graph-rag', 'liveEmbeddingProviderConfig.js');
const systemArchitectureMcpPath = path.join(repoRoot, '.argo', 'scripts', 'systemarchitecture-mcp-server.js');
const CHANNELS = Object.freeze(['Element', 'ArchitectureRelationship', 'View']);
const CHANNEL_KEYS = Object.freeze({
  Element: 'elements',
  ArchitectureRelationship: 'relationships',
  View: 'views',
});
const INDEX_NAMES = Object.freeze({
  Element: 'argo_production_semantic_element_vector',
  ArchitectureRelationship: 'argo_production_semantic_relationship_vector',
  View: 'argo_production_semantic_view_vector',
});
const INITIAL_WINDOW_SIZE = 2;
const SELECTED_VIEW_ID = 'semprod-wp2-default-retrieval-readiness';
const OVERLAPPING_VIEW_ID = 'semprod-wp2-vector-seed-closure';
const ENDPOINT_RELATIONSHIP_ID = 'semprod-rel-default-query-service';
const CONTENT_VERSION = 'content:wp-p2-aligned';
const INDEX_VERSION = 'index:wp-p2-aligned';
const APPROVED_PROFILE = Object.freeze({
  provider: 'alibaba-cloud-model-studio-openai-compatible-cn-beijing',
  baseUrl: 'https://llm-clids9mqc5o1mbvb.cn-beijing.maas.aliyuncs.com/compatible-mode/v1',
  model: 'qwen3.7-text-embedding',
  version: 'qualification-2026-07-25',
  dimensions: 1024,
});
const APPROVED_SOURCE_KEYS = Object.freeze([
  'ARGO_EMBEDDING_BASE_URL',
  'ARGO_EMBEDDING_MODEL',
  'ARGO_EMBEDDING_PROVIDER',
  'ARGO_EMBEDDING_MODEL_VERSION',
  'ARGO_EMBEDDING_DIMENSIONS',
  'ARGO_NEO4J_DATABASE_URL',
  'ARGO_NEO4J_DATABASE_USERNAME',
  'ARGO_NEO4J_DATABASE_PASSWORD',
  'QWEN_KEY',
]);
const LEGACY_SOURCE_KEYS = Object.freeze([
  'ARGO_NEO4J_URI',
  'ARGO_NEO4J_USERNAME',
  'ARGO_NEO4J_PASSWORD',
]);
const VECTOR_QUERY_CYPHER = [
  'CALL db.index.vector.queryNodes($indexName, $topK, $vector)',
  'YIELD node, score',
  'WHERE node.channel = $channel',
  'RETURN properties(node) AS record, score',
  'ORDER BY score DESC',
].join('\n');
const CREDENTIAL_SOURCE_CASES = Object.freeze([
  Object.freeze({ name: 'approved-process-source', expectedStatus: 'passed' }),
  Object.freeze({ name: 'missing-secret', omitKey: 'QWEN_KEY', expectedCategory: 'APPROVED_SECRET_REQUIRED' }),
  Object.freeze({ name: 'unsafe-file-acl', source: 'file', aclCase: 'broad-explicit-allow', expectedCategory: 'SECRET_FILE_ACL_UNSAFE' }),
  Object.freeze({ name: 'conflicting-dual-source', source: 'dual-conflict', expectedCategory: 'SECRET_SOURCE_CONFLICT' }),
  Object.freeze({ name: 'legacy-neo4j-alias', legacyOnly: true, expectedCategory: 'SECRET_SOURCE_PROVENANCE_PROHIBITED' }),
  ...LEGACY_SOURCE_KEYS.map(mixedLegacyKey => Object.freeze({
    name: `mixed-canonical-${mixedLegacyKey.toLowerCase().replaceAll('_', '-')}`,
    mixedLegacyKey,
    expectedCategory: 'SECRET_SOURCE_PROVENANCE_PROHIBITED',
  })),
  Object.freeze({ name: 'test-default-source', sourceOperation: 'test-default', expectedCategory: 'SECRET_SOURCE_PROVENANCE_PROHIBITED' }),
  Object.freeze({ name: 'fallback-source', sourceOperation: 'fallback', expectedCategory: 'SECRET_SOURCE_PROVENANCE_PROHIBITED' }),
]);
const READINESS_CASES = Object.freeze([
  Object.freeze({
    name: 'structural-only-pending',
    state: 'SemanticIndexPending',
    missingChannels: CHANNELS,
    mismatchedChannels: [],
    contentVersion: null,
    indexVersion: null,
  }),
  Object.freeze({
    name: 'partial-view-channel',
    state: 'Partial',
    missingChannels: ['View'],
    mismatchedChannels: [],
  }),
  Object.freeze({
    name: 'stale-canonical-version',
    state: 'Stale',
    canonicalVersion: 'canonical:stale',
    missingChannels: [],
    mismatchedChannels: CHANNELS,
  }),
  Object.freeze({
    name: 'failed-index',
    state: 'Failed',
    missingChannels: [],
    mismatchedChannels: [],
  }),
  Object.freeze({
    name: 'unknown-state',
    state: 'Unknown',
    missingChannels: [],
    mismatchedChannels: [],
  }),
  Object.freeze({
    name: 'content-version-mismatch',
    state: 'Mismatched',
    mismatchField: 'contentVersion',
    mismatchChannel: 'ArchitectureRelationship',
    missingChannels: [],
    mismatchedChannels: ['ArchitectureRelationship'],
  }),
  Object.freeze({
    name: 'index-version-mismatch',
    state: 'Mismatched',
    mismatchField: 'indexVersion',
    mismatchChannel: 'View',
    missingChannels: [],
    mismatchedChannels: ['View'],
  }),
  Object.freeze({
    name: 'complete-alignment',
    state: 'Aligned',
    missingChannels: [],
    mismatchedChannels: [],
    expectedAccepted: true,
  }),
]);
const RAW_EVIDENCE_CONTRACT = deepFreeze({
  compositionInputKeys: ['sourceBehavior', 'sourceAdapters', 'transport', 'neo4jDriver'],
  prohibitedCompositionInputKeys: ['environment', 'configuration', 'semanticRetrievalBoundary', 'readinessVerdict', 'semanticResult', 'seedLists'],
  credentialSourceCases: CREDENTIAL_SOURCE_CASES.map(item => ({
    name: item.name,
    expectedStatus: item.expectedStatus,
    expectedCategory: item.expectedCategory,
  })),
  pagination: {
    initialWindowSize: INITIAL_WINDOW_SIZE,
    indexNames: INDEX_NAMES,
    parameterizedCypher: VECTOR_QUERY_CYPHER,
    requiredOperationFields: ['channel', 'indexName', 'cypher', 'parameters.indexName', 'parameters.offset', 'parameters.windowSize', 'parameters.topK', 'parameters.vector'],
    requiredResponseFields: ['offset', 'windowSize', 'returnedCount', 'hasMore', 'nextOffset', 'windowExhausted'],
    qualifyingPeerBeyondInitialWindow: true,
    queryVectorEqualsRawProviderVector: true,
  },
  approvedSourceEvidence: {
    requiredKeys: APPROVED_SOURCE_KEYS,
    source: 'process',
    operation: 'direct',
    everyReadPrecedesReadiness: true,
  },
  defaultProductionRouting: {
    legacyControlWords: ['threshold-all', 'semantic seed'],
    explicitAnchors: ['grag-seed-retrieval'],
    absentCredentialCategory: 'APPROVED_SECRET_REQUIRED',
    deterministicRuntimeBypassForbidden: true,
  },
  productionQueryCredentialContract: {
    useCase: 'production-semantic-query',
    actualUninjectedMcp: true,
    requiredResolverOptions: ['repositoryRoot', 'useCase'],
    prohibitedOptIns: ['ARGO_LIVE_PROVIDER_E2E', 'ARGO_W31_LIVE_MUTATION_VECTOR_E2E'],
    requiredLegacyInspectionKeys: LEGACY_SOURCE_KEYS,
    legacyAttributionOrSelectionForbidden: true,
    mixedCanonicalLegacyCategory: 'SECRET_SOURCE_PROVENANCE_PROHIBITED',
    eventProducer: 'production-code',
    requiredBoundaryOrder: [
      'credential-source-resolution',
      'semantic-readiness-read',
      'provider-request',
      'semantic-vector-window-query',
    ],
  },
  graphTidyBypass: {
    anchorsDoNotChangeBypass: true,
    downstreamOperationCount: 0,
    exactCanonicalSnapshot: true,
  },
  closure: {
    policyId: 'w5.implementation-design.v1',
    parameterContract: ['purpose', 'anchors', 'subject', 'policyAnchorId'],
    relationshipId: ENDPOINT_RELATIONSHIP_ID,
    selectedViewId: SELECTED_VIEW_ID,
    excludedOverlappingViewId: OVERLAPPING_VIEW_ID,
    firstInclusionOrder: ['semantic-seed', 'purpose-policy-closure', 'complete-view-closure'],
    versionFields: ['canonicalVersion', 'contentVersion', 'indexVersion'],
    completeViewMetadata: true,
    parentViewpoint: true,
    versionedMembersAndRelationshipEndpoints: true,
    uniqueProvenanceForEveryReturnedObject: true,
  },
  readinessCases: READINESS_CASES.map(item => ({
    name: item.name,
    state: item.state,
    missingChannels: item.missingChannels,
    mismatchedChannels: item.mismatchedChannels,
    mismatchField: item.mismatchField,
  })),
  operationOrder: ['credential-source-resolution', 'semantic-readiness-read', 'provider-request', 'semantic-vector-window-query'],
});

function canonicalSnapshot() {
  return JSON.parse(fs.readFileSync(canonicalPath, 'utf8'));
}

function canonicalVersion(snapshot = canonicalSnapshot()) {
  const identity = {
    name: snapshot.name || 'System',
    elements: (snapshot.elements || []).map(element => element.id).sort(),
    relationships: (snapshot.relationships || []).map(relationship => relationship.id).sort(),
    views: (snapshot.views || []).map(view => view.view_id).sort(),
  };
  return `canonical:${crypto.createHash('sha256').update(JSON.stringify(identity)).digest('hex')}`;
}

function alignedReadiness() {
  const version = canonicalVersion();
  return {
    state: 'Aligned',
    canonicalVersion: version,
    contentVersion: CONTENT_VERSION,
    indexVersion: INDEX_VERSION,
    channels: CHANNELS.map(channel => ({
      channel,
      state: 'Aligned',
      canonicalVersion: version,
      contentVersion: CONTENT_VERSION,
      indexVersion: INDEX_VERSION,
    })),
  };
}

function readinessFixture(definition) {
  const readiness = alignedReadiness();
  readiness.state = definition.state;
  if (Object.hasOwn(definition, 'canonicalVersion')) readiness.canonicalVersion = definition.canonicalVersion;
  if (Object.hasOwn(definition, 'contentVersion')) readiness.contentVersion = definition.contentVersion;
  if (Object.hasOwn(definition, 'indexVersion')) readiness.indexVersion = definition.indexVersion;
  readiness.channels = readiness.channels.filter(channel => !definition.missingChannels.includes(channel.channel));
  if (definition.mismatchField) {
    readiness.channels = readiness.channels.map(channel => (
      channel.channel === definition.mismatchChannel
        ? { ...channel, [definition.mismatchField]: `${definition.mismatchField}:mismatched` }
        : channel
    ));
  }
  return readiness;
}

function defaultCandidates() {
  return {
    Element: [
      candidate('Element', 'semprod-default-vector-retrieval', 0.97),
      candidate('Element', 'grag-query-service', 0.94),
      candidate('Element', 'grag-native-retrieval-service', 0.92),
      candidate('Element', 'grag-seed-retrieval', 0.89),
      candidate('Element', 'below-threshold-element', 0.21),
    ],
    ArchitectureRelationship: [
      candidate('ArchitectureRelationship', ENDPOINT_RELATIONSHIP_ID, 0.95),
      candidate('ArchitectureRelationship', 'semprod-rel-default-seeds', 0.91),
      candidate('ArchitectureRelationship', 'semprod-rel-default-readiness', 0.88),
      candidate('ArchitectureRelationship', 'below-threshold-relationship', 0.19),
    ],
    View: [
      candidate('View', SELECTED_VIEW_ID, 0.93),
      candidate('View', 'semprod-requirements-realization', 0.9),
      candidate('View', 'SystemArchitecture', 0.87),
      candidate('View', 'below-threshold-view', 0.17),
    ],
  };
}

function candidate(channel, canonicalIdentity, score) {
  return Object.freeze({
    channel,
    canonicalIdentity,
    score,
    canonicalVersion: canonicalVersion(),
    contentVersion: CONTENT_VERSION,
    indexVersion: INDEX_VERSION,
    provider: APPROVED_PROFILE.provider,
    model: APPROVED_PROFILE.model,
    modelVersion: APPROVED_PROFILE.version,
    dimensions: APPROVED_PROFILE.dimensions,
  });
}

async function runDefaultMcpNeo4jVectorRetrieval() {
  return runDefaultSemanticScenario({
    sourceFixture: CREDENTIAL_SOURCE_CASES[0],
    readiness: alignedReadiness(),
    candidatesByChannel: defaultCandidates(),
    query: {
      purpose: 'implementation-design',
      intent: 'Design the WP-P2 default vector retrieval boundary and deterministic closure',
    },
  });
}

async function runZeroResultDefaultMcpRetrieval() {
  return runDefaultSemanticScenario({
    sourceFixture: CREDENTIAL_SOURCE_CASES[0],
    readiness: alignedReadiness(),
    candidatesByChannel: Object.fromEntries(CHANNELS.map(channel => [channel, []])),
    query: {
      purpose: 'implementation-design',
      intent: 'An unrelated semantic request with no qualifying production records',
    },
  });
}

async function runLegacyControlWordProductionGate() {
  return runDefaultSemanticScenario({
    sourceFixture: CREDENTIAL_SOURCE_CASES.find(fixture => fixture.name === 'missing-secret'),
    readiness: alignedReadiness(),
    candidatesByChannel: defaultCandidates(),
    query: {
      purpose: 'implementation-design',
      intent: 'threshold-all semantic seed compatibility words must still use production retrieval',
      anchors: ['grag-seed-retrieval'],
    },
  });
}

async function runCredentialSourceMatrix() {
  const outcomes = [];
  for (const fixture of CREDENTIAL_SOURCE_CASES) {
    const observation = await runDefaultSemanticScenario({
      sourceFixture: fixture,
      readiness: alignedReadiness(),
      candidatesByChannel: defaultCandidates(),
      query: {
        purpose: 'implementation-design',
        intent: `WP-P2 external credential source fixture ${fixture.name}`,
      },
    });
    outcomes.push(Object.freeze({ fixture, observation }));
  }
  return Object.freeze(outcomes);
}

async function runReadinessMatrix() {
  const outcomes = [];
  for (const definition of READINESS_CASES) {
    const readiness = readinessFixture(definition);
    const observation = await runDefaultSemanticScenario({
      sourceFixture: CREDENTIAL_SOURCE_CASES[0],
      readiness,
      candidatesByChannel: defaultCandidates(),
      missingBoundaryCategory: 'SP04_DEFAULT_READINESS_BOUNDARY_MISSING',
      query: {
        purpose: 'implementation-design',
        intent: `WP-P2 readiness fixture ${definition.name}`,
      },
    });
    outcomes.push(Object.freeze({ definition, readiness, observation }));
  }
  return Object.freeze(outcomes);
}

async function runFullSnapshotCompatibilityControls() {
  const before = canonicalSnapshot();
  const noArgument = await callDefaultGetSystemArchitecture({});
  const graphTidy = await callDefaultGetSystemArchitecture({
    query: {
      purpose: 'graph-tidy',
      intent: 'Prepare a graph mutation from the complete canonical snapshot',
    },
  });
  return Object.freeze({ before, noArgument, graphTidy });
}

async function runProductionQueryCredentialResolution() {
  return runActualProductionQueryCredentialScenario(
    CREDENTIAL_SOURCE_CASES[0],
    'Resolve valid external production query credentials and retrieve semantic context',
  );
}

async function runProductionQueryMixedLegacyRejections() {
  const outcomes = [];
  for (const fixture of CREDENTIAL_SOURCE_CASES.filter(item => item.mixedLegacyKey)) {
    const observation = await runActualProductionQueryCredentialScenario(
      fixture,
      `Reject mixed canonical and legacy production query source ${fixture.mixedLegacyKey}`,
    );
    outcomes.push(Object.freeze({ fixture, observation }));
  }
  return Object.freeze(outcomes);
}

async function runActualProductionQueryCredentialScenario(sourceFixture, intent) {
  const observations = createRawProductionObservations({
    sourceFixture,
    readiness: alignedReadiness(),
    candidatesByChannel: defaultCandidates(),
  });
  const {
    withApprovedLiveConfigurationTestComposition,
  } = require(liveConfigurationPath);
  const liveConfiguration = require(liveConfigurationPath);
  const defaultModulePath = require.resolve(defaultRetrievalPath);
  const systemModulePath = require.resolve(systemArchitectureMcpPath);
  const neo4jModulePath = require.resolve('neo4j-driver');
  require(neo4jModulePath);
  const previousDefaultModule = require.cache[defaultModulePath];
  const previousSystemModule = require.cache[systemModulePath];
  const previousNeo4jExports = require.cache[neo4jModulePath].exports;
  const previousResolver = liveConfiguration.resolveApprovedLiveConfiguration;
  const previousFetch = global.fetch;
  const resolverOptions = [];
  const productionEvents = [];
  let result;
  let error;
  try {
    await withApprovedLiveConfigurationTestComposition({
      sourceBehavior: observations.sourceBehavior,
      adapters: observations.sourceAdapters,
    }, async trustedResolver => {
      liveConfiguration.resolveApprovedLiveConfiguration = options => {
        resolverOptions.push(Object.freeze({ ...(options || {}) }));
        return trustedResolver(options);
      };
      require.cache[neo4jModulePath].exports = createInstrumentedNeo4jModule(productionEvents);
      global.fetch = createInstrumentedProviderFetch(productionEvents);
      delete require.cache[defaultModulePath];
      delete require.cache[systemModulePath];
      const { callTool } = require(systemArchitectureMcpPath);
      const semanticOperatorJourney = createApprovedDefaultSemanticOperatorJourneyAdapter();
      result = await callTool('getSystemArchitecture', {
        query: {
          purpose: 'implementation-design',
          intent,
        },
      }, { semanticOperatorJourney });
    });
  } catch (caught) {
    error = caught;
  } finally {
    liveConfiguration.resolveApprovedLiveConfiguration = previousResolver;
    global.fetch = previousFetch;
    require.cache[neo4jModulePath].exports = previousNeo4jExports;
    if (previousDefaultModule) require.cache[defaultModulePath] = previousDefaultModule;
    else delete require.cache[defaultModulePath];
    if (previousSystemModule) require.cache[systemModulePath] = previousSystemModule;
    else delete require.cache[systemModulePath];
  }
  return Object.freeze({
    result,
    error,
    resolverOptions: Object.freeze([...resolverOptions]),
    sourceLedger: observations.operationLedger(),
    productionEvents: Object.freeze([...productionEvents]),
  });
}

function createInstrumentedProviderFetch(productionEvents) {
  const vector = Object.freeze(Array.from({ length: 1024 }, (_, index) => (
    Number(((index + 1) / 2048).toFixed(8))
  )));
  return async function instrumentedProviderFetch() {
    productionEvents.push(Object.freeze({ kind: 'provider-request' }));
    return {
      ok: true,
      async json() {
        return { data: [{ embedding: vector }] };
      },
    };
  };
}

function createInstrumentedNeo4jModule(productionEvents) {
  let operationCount = 0;
  return Object.freeze({
    auth: Object.freeze({
      basic(username, password) {
        return Object.freeze({ username, password });
      },
    }),
    driver() {
      return Object.freeze({
        session() {
          return Object.freeze({
            async run() {
              operationCount += 1;
              if (operationCount === 1) {
                productionEvents.push(Object.freeze({ kind: 'semantic-readiness-read' }));
                return {
                  records: [Object.freeze({
                    get(key) {
                      return key === 'readiness' ? alignedReadiness() : undefined;
                    },
                  })],
                };
              }
              productionEvents.push(Object.freeze({ kind: 'semantic-vector-window-query' }));
              return { records: [] };
            },
            async close() {},
          });
        },
        async close() {},
      });
    },
  });
}

async function runAnchoredGraphTidyCompatibilityControl() {
  const before = canonicalSnapshot();
  const observations = createRawProductionObservations({
    sourceFixture: CREDENTIAL_SOURCE_CASES[0],
    readiness: alignedReadiness(),
    candidatesByChannel: defaultCandidates(),
  });
  const boundary = loadDefaultRetrievalBoundary('SP04_ANCHORED_GRAPH_TIDY_BOUNDARY_MISSING');
  let result;
  await boundary.withDefaultSemanticRetrievalTestComposition({
    sourceBehavior: observations.sourceBehavior,
    sourceAdapters: observations.sourceAdapters,
    transport: observations.transport,
    neo4jDriver: observations.neo4jDriver,
  }, async () => {
    result = await callDefaultGetSystemArchitecture({
      query: {
        purpose: 'graph-tidy',
        intent: 'Read the complete canonical graph while preserving explicit anchors',
        anchors: ['grag-purpose-closure'],
      },
    });
  });
  return Object.freeze({
    before,
    result,
    operationLedger: observations.operationLedger(),
    readinessReads: observations.readinessReads(),
    providerRequests: observations.providerRequests(),
    vectorQueries: observations.vectorQueries(),
  });
}

async function runDefaultSemanticScenario({
  sourceFixture,
  readiness,
  candidatesByChannel,
  query,
  missingBoundaryCategory = 'SP03_DEFAULT_VECTOR_RETRIEVAL_BOUNDARY_MISSING',
}) {
  const boundary = loadDefaultRetrievalBoundary(missingBoundaryCategory);
  assert.strictEqual(
    typeof boundary.withDefaultSemanticRetrievalTestComposition,
    'function',
    'SP03_DEFAULT_VECTOR_RETRIEVAL_TEST_COMPOSITION_MISSING',
  );
  const observations = createRawProductionObservations({
    sourceFixture,
    readiness,
    candidatesByChannel,
  });
  const composition = {
    sourceBehavior: observations.sourceBehavior,
    sourceAdapters: observations.sourceAdapters,
    transport: observations.transport,
    neo4jDriver: observations.neo4jDriver,
  };
  assert.deepStrictEqual(Object.keys(composition).sort(), [...RAW_EVIDENCE_CONTRACT.compositionInputKeys].sort());
  let result;
  await boundary.withDefaultSemanticRetrievalTestComposition(composition, async () => {
    result = await callDefaultGetSystemArchitecture({ query });
  });
  return Object.freeze({
    result,
    operationLedger: observations.operationLedger(),
    providerRequests: observations.providerRequests(),
    providerResponses: observations.providerResponses(),
    readinessReads: observations.readinessReads(),
    vectorQueries: observations.vectorQueries(),
    vectorWindowResponses: observations.vectorWindowResponses(),
    expectedCandidates: candidatesByChannel,
    sourceFixture,
  });
}

function createRawProductionObservations({ sourceFixture, readiness, candidatesByChannel }) {
  const ledger = [];
  const providerCalls = [];
  const providerResponseVectors = [];
  const readinessOperations = [];
  const vectorOperations = [];
  const vectorResponses = [];
  let sequence = 0;
  const record = (kind, detail = {}) => {
    const event = Object.freeze({ sequence: ++sequence, kind, ...detail });
    ledger.push(event);
    return event;
  };
  const source = createRawSourceFixture(sourceFixture, record);
  const queryVector = Object.freeze(Array.from({ length: 1024 }, (_, index) => (
    Number(((index + 1) / 2048).toFixed(8))
  )));
  const transport = Object.freeze({
    async request(url, init) {
      const event = record('provider-request', { url });
      providerCalls.push(Object.freeze({ sequence: event.sequence, url, init }));
      providerResponseVectors.push(Object.freeze({
        sequence: event.sequence,
        vector: queryVector,
      }));
      return {
        ok: true,
        async json() {
          return { data: [{ embedding: queryVector }] };
        },
      };
    },
  });
  const neo4jDriver = Object.freeze({
    async execute(operation) {
      if (operation && operation.kind === 'semantic-readiness-read') {
        const event = record('semantic-readiness-read');
        readinessOperations.push(Object.freeze({ sequence: event.sequence, ...freezeOperation(operation) }));
        return { records: [readiness] };
      }
      if (operation && operation.kind === 'semantic-vector-window-query') {
        const event = record('semantic-vector-window-query', {
          channel: operation.channel,
          offset: operation.parameters && operation.parameters.offset,
        });
        const frozenOperation = Object.freeze({ sequence: event.sequence, ...freezeOperation(operation) });
        vectorOperations.push(frozenOperation);
        const candidates = candidatesByChannel[operation.channel] || [];
        const offset = operation.parameters && operation.parameters.offset;
        const windowSize = operation.parameters && operation.parameters.windowSize;
        const topK = operation.parameters && operation.parameters.topK;
        assert(Number.isInteger(offset) && offset >= 0, `SP03_RAW_WINDOW_OFFSET_REQUIRED:${operation.channel}`);
        assert(Number.isInteger(windowSize) && windowSize > 0, `SP03_RAW_WINDOW_SIZE_REQUIRED:${operation.channel}`);
        assert.strictEqual(topK, offset + windowSize, `SP03_EXPANDING_TOPK_REQUIRED:${operation.channel}`);
        const records = candidates.slice(0, topK);
        const newRecords = records.slice(offset);
        const hasMore = topK < candidates.length;
        const windowEvidence = Object.freeze({
          offset,
          windowSize,
          returnedCount: newRecords.length,
          hasMore,
          nextOffset: hasMore ? topK : null,
          windowExhausted: !hasMore,
        });
        vectorResponses.push(Object.freeze({
          operationSequence: event.sequence,
          channel: operation.channel,
          records: Object.freeze([...records]),
          newRecords: Object.freeze([...newRecords]),
          ...windowEvidence,
        }));
        return { records, windowEvidence };
      }
      throw new Error(`WP_P2_UNEXPECTED_NEO4J_OPERATION:${operation && operation.kind}`);
    },
    async close() {},
  });
  return Object.freeze({
    sourceBehavior: source.sourceBehavior,
    sourceAdapters: source.sourceAdapters,
    transport,
    neo4jDriver,
    operationLedger: () => Object.freeze([...ledger]),
    providerRequests: () => Object.freeze([...providerCalls]),
    providerResponses: () => Object.freeze([...providerResponseVectors]),
    readinessReads: () => Object.freeze([...readinessOperations]),
    vectorQueries: () => Object.freeze([...vectorOperations]),
    vectorWindowResponses: () => Object.freeze([...vectorResponses]),
  });
}

function createRawSourceFixture(fixture, record) {
  const marker = crypto.randomUUID();
  const approved = approvedSourceValues(marker);
  const processValues = fixture.source === 'file' ? {} : { ...approved };
  const fileValues = fixture.source === 'file' || fixture.source === 'dual-conflict'
    ? { ...approved }
    : {};
  if (fixture.omitKey) delete processValues[fixture.omitKey];
  if (fixture.source === 'dual-conflict') fileValues.QWEN_KEY = `${approved.QWEN_KEY}-conflict`;
  if (fixture.legacyOnly) {
    delete processValues.ARGO_NEO4J_DATABASE_URL;
    delete processValues.ARGO_NEO4J_DATABASE_USERNAME;
    delete processValues.ARGO_NEO4J_DATABASE_PASSWORD;
    processValues.ARGO_NEO4J_URI = `neo4j://legacy-${marker}.invalid`;
    processValues.ARGO_NEO4J_USERNAME = `legacy-${marker}`;
    processValues.ARGO_NEO4J_PASSWORD = `legacy-password-${marker}`;
  }
  if (fixture.mixedLegacyKey) {
    processValues[fixture.mixedLegacyKey] = fixture.mixedLegacyKey === 'ARGO_NEO4J_URI'
      ? `neo4j://mixed-legacy-${marker}.invalid:7687`
      : `mixed-legacy-${marker}`;
  }
  const sourceBehavior = {
    expectedFilePath: path.join(repoRoot, '.argo', '.env'),
    readProcessKey(key) {
      record('credential-source-resolution', { source: 'process', key, operation: 'direct' });
      return fixture.sourceOperation ? undefined : processValues[key];
    },
    readFileEntries() {
      record('credential-source-resolution', { source: 'file', operation: 'direct' });
      return Object.entries(fileValues);
    },
  };
  if (fixture.sourceOperation === 'fallback') {
    sourceBehavior.readFallbackKey = key => {
      record('credential-source-resolution', { source: 'process', key, operation: 'fallback' });
      return approved[key];
    };
  }
  if (fixture.sourceOperation === 'test-default') {
    sourceBehavior.readTestDefaultKey = key => {
      record('credential-source-resolution', { source: 'test-default', key, operation: 'test-default' });
      return approved[key];
    };
  }
  const identity = 'ARGO\\WpP2Fixture';
  const aclOutput = fixture.aclCase === 'broad-explicit-allow'
    ? `${identity}:(R)\nEveryone:(R)`
    : `${identity}:(R)`;
  const sourceAdapters = Object.freeze({
    filesystem: Object.freeze({
      existsSync: () => Object.keys(fileValues).length > 0,
      lstatSync: () => Object.freeze({
        isFile: () => true,
        isSymbolicLink: () => false,
      }),
      realpathSync: value => value,
    }),
    git: Object.freeze({
      isIgnored: () => true,
      isTracked: () => false,
    }),
    acl: Object.freeze({
      inspect: () => Object.freeze({ status: 0, identity, stdout: aclOutput }),
    }),
  });
  return Object.freeze({
    sourceBehavior: Object.freeze(sourceBehavior),
    sourceAdapters,
  });
}

function approvedSourceValues(marker) {
  return {
    ARGO_EMBEDDING_BASE_URL: APPROVED_PROFILE.baseUrl,
    ARGO_EMBEDDING_MODEL: APPROVED_PROFILE.model,
    ARGO_EMBEDDING_PROVIDER: APPROVED_PROFILE.provider,
    ARGO_EMBEDDING_MODEL_VERSION: APPROVED_PROFILE.version,
    ARGO_EMBEDDING_DIMENSIONS: String(APPROVED_PROFILE.dimensions),
    ARGO_NEO4J_DATABASE_URL: `neo4j://wp-p2-${marker}.invalid:7687`,
    ARGO_NEO4J_DATABASE_USERNAME: `wp-p2-user-${marker}`,
    ARGO_NEO4J_DATABASE_PASSWORD: `wp-p2-password-${marker}`,
    QWEN_KEY: `wp-p2-qwen-${marker}`,
  };
}

function assertCredentialSourceMatrix(outcomes) {
  assert.deepStrictEqual(
    outcomes.map(outcome => outcome.fixture.name),
    CREDENTIAL_SOURCE_CASES.map(fixture => fixture.name),
    'SP03_CREDENTIAL_SOURCE_MATRIX_INCOMPLETE',
  );
  for (const { fixture, observation } of outcomes) {
    if (fixture.expectedStatus === 'passed') {
      assert.strictEqual(observation.result && observation.result.status, 'passed', 'SP03_APPROVED_EXTERNAL_SOURCE_REJECTED');
      assertApprovedCredentialSourceEvidence(observation);
      continue;
    }
    if (fixture.mixedLegacyKey) {
      assertMixedCanonicalLegacyRejection(fixture, observation);
      continue;
    }
    assert.strictEqual(observation.result && observation.result.status, 'failed', `SP03_PROHIBITED_CREDENTIAL_SOURCE_ACCEPTED:${fixture.name}`);
    assert.strictEqual(observation.result.error && observation.result.error.category, fixture.expectedCategory, `SP03_CREDENTIAL_SOURCE_CATEGORY_MISMATCH:${fixture.name}`);
    assert.strictEqual(observation.readinessReads.length, 0, `SP03_PROHIBITED_SOURCE_REACHED_READINESS:${fixture.name}`);
    assert.strictEqual(observation.providerRequests.length, 0, `SP03_PROHIBITED_SOURCE_REACHED_PROVIDER:${fixture.name}`);
    assert.strictEqual(observation.vectorQueries.length, 0, `SP03_PROHIBITED_SOURCE_REACHED_VECTOR_QUERY:${fixture.name}`);
    assert(
      observation.operationLedger.every(event => event.kind === 'credential-source-resolution'),
      `SP03_PROHIBITED_SOURCE_SIDE_EFFECT:${fixture.name}`,
    );
  }
}

function assertMixedCanonicalLegacyRejection(fixture, observation) {
  const legacyInspectionReads = observation.operationLedger.filter(event => (
    event.kind === 'credential-source-resolution'
    && event.source === 'process'
    && event.operation === 'direct'
    && LEGACY_SOURCE_KEYS.includes(event.key)
  ));
  assert.deepStrictEqual(
    legacyInspectionReads.map(event => event.key).sort(),
    [...LEGACY_SOURCE_KEYS].sort(),
    `SP03_MIXED_LEGACY_INSPECTION_MISSING:${fixture.mixedLegacyKey}`,
  );
  assert.strictEqual(
    observation.result && observation.result.status,
    'failed',
    `SP03_MIXED_LEGACY_SOURCE_ACCEPTED:${fixture.mixedLegacyKey}`,
  );
  assert.strictEqual(
    observation.result.error && observation.result.error.category,
    'SECRET_SOURCE_PROVENANCE_PROHIBITED',
    `SP03_MIXED_LEGACY_REJECTION_CATEGORY_MISMATCH:${fixture.mixedLegacyKey}`,
  );
  assert(
    !(observation.result && observation.result.result && observation.result.result.configurationEvidence),
    `SP03_MIXED_LEGACY_ATTRIBUTED_OR_SELECTED:${fixture.mixedLegacyKey}`,
  );
  assert.strictEqual(observation.readinessReads.length, 0, `SP03_MIXED_LEGACY_REACHED_READINESS:${fixture.mixedLegacyKey}`);
  assert.strictEqual(observation.providerRequests.length, 0, `SP03_MIXED_LEGACY_REACHED_PROVIDER:${fixture.mixedLegacyKey}`);
  assert.strictEqual(observation.vectorQueries.length, 0, `SP03_MIXED_LEGACY_REACHED_VECTOR_QUERY:${fixture.mixedLegacyKey}`);
  assert(
    observation.operationLedger.every(event => event.kind === 'credential-source-resolution'),
    `SP03_MIXED_LEGACY_DOWNSTREAM_USE:${fixture.mixedLegacyKey}`,
  );
}

function assertApprovedCredentialSourceEvidence(observation) {
  const approvedReads = observation.operationLedger.filter(event => (
    event.kind === 'credential-source-resolution'
    && event.source === 'process'
    && event.operation === 'direct'
    && APPROVED_SOURCE_KEYS.includes(event.key)
  ));
  assert.deepStrictEqual(
    approvedReads.map(event => event.key).sort(),
    [...APPROVED_SOURCE_KEYS].sort(),
    'SP03_APPROVED_SOURCE_REQUIRED_KEY_READS_INCOMPLETE',
  );
  assert.strictEqual(
    new Set(approvedReads.map(event => event.key)).size,
    APPROVED_SOURCE_KEYS.length,
    'SP03_APPROVED_SOURCE_KEY_READ_DUPLICATED',
  );
  assert(
    !observation.operationLedger.some(event => (
      event.kind === 'credential-source-resolution'
      && ['test-default', 'fallback'].includes(event.operation)
    )),
    'SP03_APPROVED_SOURCE_USED_PROHIBITED_OPERATION',
  );
  const expectedAttribution = Object.fromEntries(APPROVED_SOURCE_KEYS.map(key => [key, 'process']));
  assert.deepStrictEqual(
    observation.result
      && observation.result.result
      && observation.result.result.configurationEvidence
      && observation.result.result.configurationEvidence.attribution,
    expectedAttribution,
    'SP03_APPROVED_SOURCE_DIRECT_ATTRIBUTION_MISMATCH',
  );
  assert.strictEqual(observation.readinessReads.length, 1, 'SP03_APPROVED_SOURCE_READINESS_MISSING');
  const readinessSequence = observation.readinessReads[0].sequence;
  assert(
    approvedReads.every(event => event.sequence < readinessSequence),
    'SP03_APPROVED_SOURCE_READ_AFTER_READINESS',
  );
}

function assertDefaultVectorRetrieval(observation) {
  assert.strictEqual(observation.result && observation.result.status, 'passed', 'SP03_DEFAULT_MCP_SEMANTIC_QUERY_FAILED');
  assert.strictEqual(observation.providerRequests.length, 1, 'SP03_QUALIFIED_QUERY_EMBEDDING_REQUIRED');
  const providerRequest = observation.providerRequests[0];
  const providerBody = JSON.parse(providerRequest.init && providerRequest.init.body);
  assert.strictEqual(providerRequest.url, `${APPROVED_PROFILE.baseUrl}/embeddings`, 'SP03_QUERY_EMBEDDING_ENDPOINT_REQUIRED');
  assert.strictEqual(providerBody.model, APPROVED_PROFILE.model, 'SP03_APPROVED_QUERY_EMBEDDING_MODEL_REQUIRED');
  assert.strictEqual(providerBody.dimensions, APPROVED_PROFILE.dimensions, 'SP03_APPROVED_QUERY_EMBEDDING_DIMENSIONS_REQUIRED');
  assert(!JSON.stringify(observation).includes('approved-test-provider'), 'SP03_PRODUCTION_TEST_PROFILE_FORBIDDEN');
  assertApprovedCredentialSourceEvidence(observation);
  assertReadinessBeforeProviderAndVector(observation, 'SP03');
  assertRawPaginationCompleteness(observation);
  assertExactClosureAndVersions(observation);
}

function assertProductionQueryCredentialResolution(observation) {
  assert.deepStrictEqual(
    observation.resolverOptions,
    [{ repositoryRoot: repoRoot, useCase: 'production-semantic-query' }],
    'SP03_DEFAULT_RETRIEVAL_PRODUCTION_USE_CASE_NOT_REQUESTED',
  );
  assert(
    !observation.error,
    `SP03_PRODUCTION_QUERY_SOURCE_ADAPTER_CONTRACT_MISSING: ${
      observation.error && (observation.error.category || observation.error.message)
    }`,
  );
  assert.strictEqual(observation.result && observation.result.status, 'passed', 'SP03_PRODUCTION_QUERY_RESULT_FAILED');
  const sourceReads = observation.sourceLedger.filter(event => event.kind === 'credential-source-resolution');
  assert(sourceReads.length > 0, 'SP03_PRODUCTION_QUERY_SOURCE_READS_MISSING');
  assert(
    sourceReads.every(event => event.operation === 'direct'),
    'SP03_PRODUCTION_QUERY_NON_DIRECT_SOURCE_OPERATION',
  );
  assert(
    !sourceReads.some(event => (
      event.source === 'test-default'
      || event.operation === 'fallback'
    )),
    'SP03_PRODUCTION_QUERY_PROHIBITED_SOURCE_PATH',
  );
  const legacyInspectionReads = sourceReads.filter(event => LEGACY_SOURCE_KEYS.includes(event.key));
  assert.deepStrictEqual(
    legacyInspectionReads.map(event => event.key).sort(),
    [...LEGACY_SOURCE_KEYS].sort(),
    'SP03_PRODUCTION_QUERY_LEGACY_INSPECTION_MISSING',
  );
  assert.deepStrictEqual(
    observation.productionEvents.map(event => event.kind),
    [
      'semantic-readiness-read',
      'provider-request',
      'semantic-vector-window-query',
      'semantic-vector-window-query',
      'semantic-vector-window-query',
    ],
    'SP03_PRODUCTION_QUERY_BOUNDARY_ORDER_MISMATCH',
  );
}

function assertProductionQueryMixedLegacyRejections(outcomes) {
  assert.deepStrictEqual(
    outcomes.map(outcome => outcome.fixture.mixedLegacyKey),
    [...LEGACY_SOURCE_KEYS],
    'SP03_PRODUCTION_QUERY_MIXED_LEGACY_MATRIX_INCOMPLETE',
  );
  for (const { fixture, observation } of outcomes) {
    assert.deepStrictEqual(
      observation.resolverOptions,
      [{ repositoryRoot: repoRoot, useCase: 'production-semantic-query' }],
      `SP03_MIXED_LEGACY_PRODUCTION_USE_CASE_NOT_REQUESTED:${fixture.mixedLegacyKey}`,
    );
    assert(
      !observation.error,
      `SP03_MIXED_LEGACY_ORCHESTRATION_ERROR:${fixture.mixedLegacyKey}:${
        observation.error && (observation.error.category || observation.error.message)
      }`,
    );
    const sourceReads = observation.sourceLedger.filter(event => event.kind === 'credential-source-resolution');
    const legacyInspectionReads = sourceReads.filter(event => (
      event.source === 'process'
      && event.operation === 'direct'
      && LEGACY_SOURCE_KEYS.includes(event.key)
    ));
    assert.deepStrictEqual(
      legacyInspectionReads.map(event => event.key).sort(),
      [...LEGACY_SOURCE_KEYS].sort(),
      `SP03_ACTUAL_MIXED_LEGACY_INSPECTION_MISSING:${fixture.mixedLegacyKey}`,
    );
    assert.strictEqual(
      observation.result && observation.result.status,
      'failed',
      `SP03_ACTUAL_MIXED_LEGACY_SOURCE_ACCEPTED:${fixture.mixedLegacyKey}`,
    );
    assert.strictEqual(
      observation.result.error && observation.result.error.category,
      'SECRET_SOURCE_PROVENANCE_PROHIBITED',
      `SP03_ACTUAL_MIXED_LEGACY_CATEGORY_MISMATCH:${fixture.mixedLegacyKey}`,
    );
    assert.deepStrictEqual(
      observation.productionEvents,
      [],
      `SP03_ACTUAL_MIXED_LEGACY_DOWNSTREAM_USE:${fixture.mixedLegacyKey}`,
    );
    assert(
      !(observation.result.result && observation.result.result.configurationEvidence),
      `SP03_ACTUAL_MIXED_LEGACY_ATTRIBUTED_OR_SELECTED:${fixture.mixedLegacyKey}`,
    );
  }
}

function assertAnchoredGraphTidyCompatibility(observation) {
  assert.strictEqual(
    observation.operationLedger.length,
    0,
    'SP04_ANCHORED_GRAPH_TIDY_INVOKED_SEMANTIC_OPERATIONS',
  );
  assert.strictEqual(observation.readinessReads.length, 0, 'SP04_ANCHORED_GRAPH_TIDY_INVOKED_READINESS');
  assert.strictEqual(observation.providerRequests.length, 0, 'SP04_ANCHORED_GRAPH_TIDY_INVOKED_PROVIDER');
  assert.strictEqual(observation.vectorQueries.length, 0, 'SP04_ANCHORED_GRAPH_TIDY_INVOKED_VECTOR');
  assert.deepStrictEqual(
    observation.result,
    { status: 'passed', graphPath: 'design/KG/SystemArchitecture.json', document: observation.before },
    'SP04_ANCHORED_GRAPH_TIDY_NOT_FULL_SNAPSHOT',
  );
}

function assertLegacyControlWordProductionGate(observation) {
  assert.strictEqual(
    observation.result && observation.result.status,
    'failed',
    'SP03_LEGACY_CONTROL_WORDS_BYPASSED_PRODUCTION_GATE',
  );
  assert.strictEqual(
    observation.result && observation.result.error && observation.result.error.category,
    'APPROVED_SECRET_REQUIRED',
    'SP03_LEGACY_CONTROL_WORDS_DID_NOT_REACH_CREDENTIAL_GATE',
  );
  assert.strictEqual(observation.readinessReads.length, 0, 'SP03_LEGACY_CONTROL_WORDS_REACHED_READINESS_WITHOUT_CREDENTIALS');
  assert.strictEqual(observation.providerRequests.length, 0, 'SP03_LEGACY_CONTROL_WORDS_REACHED_PROVIDER_WITHOUT_CREDENTIALS');
  assert.strictEqual(observation.vectorQueries.length, 0, 'SP03_LEGACY_CONTROL_WORDS_REACHED_VECTOR_QUERY_WITHOUT_CREDENTIALS');
  assert(
    observation.operationLedger.length > 0
      && observation.operationLedger.every(event => event.kind === 'credential-source-resolution'),
    'SP03_LEGACY_CONTROL_WORDS_CREDENTIAL_ORDER_INVALID',
  );
}

function assertRawPaginationCompleteness(observation) {
  assertVectorQueryContract(observation);
  for (const channel of CHANNELS) {
    const operations = observation.vectorQueries.filter(item => item.channel === channel);
    const responses = observation.vectorWindowResponses.filter(item => item.channel === channel);
    assert(operations.length >= 2, `SP03_RAW_MULTI_WINDOW_EVIDENCE_MISSING:${channel}`);
    assert.strictEqual(operations[0].parameters.offset, 0, `SP03_INITIAL_WINDOW_OFFSET_INVALID:${channel}`);
    assert.strictEqual(operations[0].parameters.windowSize, INITIAL_WINDOW_SIZE, `SP03_INITIAL_WINDOW_SIZE_INVALID:${channel}`);
    assert.deepStrictEqual(
      operations.map(item => item.parameters.topK),
      operations.map((item, index) => INITIAL_WINDOW_SIZE * (index + 1)),
      `SP03_TOPK_DID_NOT_EXPAND:${channel}`,
    );
    assert.deepStrictEqual(
      operations.map(item => item.parameters.offset),
      responses.map(item => item.offset),
      `SP03_RAW_WINDOW_RESPONSE_CORRELATION_FAILED:${channel}`,
    );
    for (let index = 1; index < operations.length; index += 1) {
      assert.strictEqual(
        operations[index].parameters.offset,
        responses[index - 1].nextOffset,
        `SP03_RAW_WINDOW_CURSOR_NOT_FOLLOWED:${channel}:${index}`,
      );
    }
    assert.strictEqual(responses.at(-1).windowExhausted, true, `SP03_RAW_WINDOW_NOT_EXHAUSTED:${channel}`);
    assert.strictEqual(responses.at(-1).hasMore, false, `SP03_RAW_WINDOW_FALSE_COMPLETION:${channel}`);
    const qualifyingBeyondInitial = (observation.expectedCandidates[channel] || [])
      .slice(INITIAL_WINDOW_SIZE)
      .filter(item => item.score >= channelThreshold(channel))
      .map(item => item.canonicalIdentity);
    assert(qualifyingBeyondInitial.length > 0, `SP03_QUALIFYING_BEYOND_INITIAL_WINDOW_FIXTURE_MISSING:${channel}`);
    const returned = returnedSeedIds(observation.result.result, channel);
    for (const peerId of qualifyingBeyondInitial) {
      assert(returned.includes(peerId), `SP03_QUALIFYING_PEER_BEYOND_INITIAL_WINDOW_OMITTED:${channel}:${peerId}`);
    }
    const allQualifying = (observation.expectedCandidates[channel] || [])
      .filter(item => item.score >= channelThreshold(channel))
      .map(item => item.canonicalIdentity);
    assert.deepStrictEqual(returned, allQualifying, `SP03_THRESHOLD_ALL_INCOMPLETE:${channel}`);
  }
}

function assertVectorQueryContract(observation) {
  assert.strictEqual(observation.providerResponses.length, 1, 'SP03_RAW_PROVIDER_VECTOR_REQUIRED');
  const providerVector = observation.providerResponses[0].vector;
  assert(Array.isArray(providerVector) && providerVector.length === APPROVED_PROFILE.dimensions, 'SP03_RAW_PROVIDER_VECTOR_DIMENSIONS_MISMATCH');
  for (const channel of CHANNELS) {
    const operations = observation.vectorQueries.filter(item => item.channel === channel);
    assert(operations.length > 0, `SP03_VECTOR_CHANNEL_QUERY_MISSING:${channel}`);
    for (const operation of operations) {
      assert.strictEqual(operation.indexName, INDEX_NAMES[channel], `SP03_VECTOR_INDEX_NAME_MISMATCH:${channel}`);
      assert.strictEqual(operation.cypher, VECTOR_QUERY_CYPHER, `SP03_PARAMETERIZED_VECTOR_CYPHER_MISMATCH:${channel}`);
      assert.strictEqual(operation.parameters.indexName, INDEX_NAMES[channel], `SP03_VECTOR_INDEX_PARAMETER_MISMATCH:${channel}`);
      assert.strictEqual(operation.parameters.channel, channel, `SP03_VECTOR_CHANNEL_PARAMETER_MISMATCH:${channel}`);
      assert.strictEqual(operation.parameters.topK, operation.parameters.offset + operation.parameters.windowSize, `SP03_VECTOR_TOPK_WINDOW_MISMATCH:${channel}`);
      assert.deepStrictEqual(operation.parameters.vector, providerVector, `SP03_QUERY_VECTOR_PROVIDER_VECTOR_MISMATCH:${channel}`);
    }
  }
}

function assertExactClosureAndVersions(observation) {
  const evidence = observation.result.result || {};
  const allSeedIds = CHANNELS.flatMap(channel => returnedSeedIds(evidence, channel));
  assert.deepStrictEqual(evidence.closurePolicy && evidence.closurePolicy.boundParameters, {
    purpose: 'implementation-design',
    anchors: allSeedIds,
    subject: null,
    policyAnchorId: 'grag-implementation-policy',
  }, 'SP03_PURPOSE_POLICY_BOUND_PARAMETERS_MISMATCH');
  assert.strictEqual(evidence.closurePolicy && evidence.closurePolicy.policyId, 'w5.implementation-design.v1', 'SP03_PURPOSE_POLICY_ID_MISMATCH');
  assert.strictEqual(evidence.closurePolicy && evidence.closurePolicy.parameterizedCypher, true, 'SP03_PARAMETERIZED_PURPOSE_POLICY_REQUIRED');
  assert.deepStrictEqual(
    evidence.closurePolicy && evidence.closurePolicy.parameterContract,
    ['purpose', 'anchors', 'subject', 'policyAnchorId'],
    'SP03_PURPOSE_PARAMETER_CONTRACT_MISMATCH',
  );
  const realization = (evidence.closurePolicy.archimateSemantics || []).find(item => item.relationshipType === 'Realization');
  assert.deepStrictEqual(realization, {
    relationshipType: 'Realization',
    sourceTargetRule: 'source realizes target; implementation and delivery evidence may satisfy but never replace the target intent element',
  }, 'SP03_ARCHIMATE_DIRECTION_SEMANTICS_MISMATCH');

  const endpoint = (evidence.endpointClosure && evidence.endpointClosure.relationships || [])
    .find(item => item.id === ENDPOINT_RELATIONSHIP_ID);
  assert(endpoint, 'SP03_REQUIRED_ENDPOINT_RELATIONSHIP_MISSING');
  assert.strictEqual(endpoint.source_id, 'semprod-default-vector-retrieval', 'SP03_ENDPOINT_SOURCE_ID_MISMATCH');
  assert.strictEqual(endpoint.target_id, 'grag-query-service', 'SP03_ENDPOINT_TARGET_ID_MISMATCH');
  assert.strictEqual(endpoint.source && endpoint.source.id, endpoint.source_id, 'SP03_ENDPOINT_SOURCE_OBJECT_MISMATCH');
  assert.strictEqual(endpoint.target && endpoint.target.id, endpoint.target_id, 'SP03_ENDPOINT_TARGET_OBJECT_MISMATCH');
  const snapshot = canonicalSnapshot();
  assertVersionedCanonicalObject(
    endpoint.source,
    snapshot.elements.find(element => element.id === endpoint.source_id),
    'SP03_ENDPOINT_SOURCE',
  );
  assertVersionedCanonicalObject(
    endpoint.target,
    snapshot.elements.find(element => element.id === endpoint.target_id),
    'SP03_ENDPOINT_TARGET',
  );

  const views = evidence.viewClosure && evidence.viewClosure.views || [];
  const selected = views.find(view => view.view_id === SELECTED_VIEW_ID);
  assert(selected, 'SP03_SELECTED_VIEW_MISSING');
  assert(!views.some(view => view.view_id === OVERLAPPING_VIEW_ID), 'SP03_OVERLAPPING_VIEW_CASCADE');
  const canonicalView = snapshot.views.find(view => view.view_id === SELECTED_VIEW_ID);
  assertCompleteSelectedView(selected, canonicalView, snapshot);

  const provenance = evidence.provenance && evidence.provenance.objects || [];
  const seeded = provenance.find(item => item.objectId === 'semprod-default-vector-retrieval');
  assert.strictEqual(seeded && seeded.firstInclusionReason, 'semantic-seed', 'SP03_FIRST_INCLUSION_ORDER_MISMATCH');
  assert.deepStrictEqual(
    seeded && seeded.supplementaryReasons,
    ['purpose-policy-closure', 'complete-view-closure'],
    'SP03_SUPPLEMENTARY_PROVENANCE_ORDER_MISMATCH',
  );
  const relationshipReason = provenance.find(item => item.objectId === ENDPOINT_RELATIONSHIP_ID);
  assert.strictEqual(relationshipReason && relationshipReason.firstInclusionReason, 'semantic-seed', 'SP03_RELATIONSHIP_FIRST_INCLUSION_MISMATCH');
  assert(relationshipReason.supplementaryReasons.includes('relationship-endpoint-closure'), 'SP03_ENDPOINT_PROVENANCE_MISSING');
  const viewReason = provenance.find(item => item.objectId === SELECTED_VIEW_ID);
  assert.strictEqual(viewReason && viewReason.firstInclusionReason, 'semantic-seed', 'SP03_VIEW_FIRST_INCLUSION_MISMATCH');
  assert(viewReason.supplementaryReasons.includes('complete-view-closure'), 'SP03_VIEW_COMPLETION_PROVENANCE_MISSING');
  assertUniqueFirstInclusionProvenance(evidence);

  assert.strictEqual(evidence.canonicalVersion, canonicalVersion(), 'SP03_CANONICAL_VERSION_MISMATCH');
  assert.strictEqual(evidence.contentVersion, CONTENT_VERSION, 'SP03_CONTENT_VERSION_MISMATCH');
  assert.strictEqual(evidence.indexVersion, INDEX_VERSION, 'SP03_INDEX_VERSION_MISMATCH');
  assert.deepStrictEqual(evidence.provenance && evidence.provenance.semanticIndex, {
    contentVersion: CONTENT_VERSION,
    indexVersion: INDEX_VERSION,
  }, 'SP03_PROVENANCE_VERSION_EVIDENCE_MISMATCH');
}

function assertCompleteSelectedView(selected, canonicalView, snapshot) {
  for (const [key, value] of Object.entries(canonicalView)) {
    assert.deepStrictEqual(selected[key], value, `SP03_SELECTED_VIEW_METADATA_MISMATCH:${key}`);
  }
  assert.deepStrictEqual(selected.viewpointBinding, {
    viewpoint: 'Implementation and Migration Viewpoint',
    description: canonicalView.description,
  }, 'SP03_SELECTED_VIEWPOINT_BINDING_MISMATCH');
  const canonicalParent = snapshot.elements.find(element => element.id === canonicalView.parent_element_id);
  assertVersionedCanonicalObject(selected.parentViewpoint, canonicalParent, 'SP03_SELECTED_VIEW_PARENT_VIEWPOINT');
  assert.strictEqual(selected.memberElements.length, canonicalView.included_elements.length, 'SP03_SELECTED_VIEW_MEMBER_OBJECTS_INCOMPLETE');
  for (let index = 0; index < canonicalView.included_elements.length; index += 1) {
    const elementId = canonicalView.included_elements[index];
    assertVersionedCanonicalObject(
      selected.memberElements[index],
      snapshot.elements.find(element => element.id === elementId),
      `SP03_SELECTED_VIEW_MEMBER:${elementId}`,
    );
  }
  assert.strictEqual(selected.memberRelationships.length, canonicalView.included_relationships.length, 'SP03_SELECTED_VIEW_RELATIONSHIP_OBJECTS_INCOMPLETE');
  for (let index = 0; index < canonicalView.included_relationships.length; index += 1) {
    const relationshipId = canonicalView.included_relationships[index];
    const actual = selected.memberRelationships[index];
    const canonicalRelationship = snapshot.relationships.find(item => item.id === relationshipId);
    assertVersionedCanonicalObject(actual, canonicalRelationship, `SP03_SELECTED_VIEW_RELATIONSHIP:${relationshipId}`);
    assertVersionedCanonicalObject(
      actual.source,
      snapshot.elements.find(element => element.id === canonicalRelationship.source_id),
      `SP03_SELECTED_VIEW_RELATIONSHIP_SOURCE:${relationshipId}`,
    );
    assertVersionedCanonicalObject(
      actual.target,
      snapshot.elements.find(element => element.id === canonicalRelationship.target_id),
      `SP03_SELECTED_VIEW_RELATIONSHIP_TARGET:${relationshipId}`,
    );
  }
}

function assertVersionedCanonicalObject(actual, canonical, category) {
  assert(actual && canonical, `${category}_OBJECT_MISSING`);
  for (const [key, value] of Object.entries(canonical)) {
    assert.deepStrictEqual(actual[key], value, `${category}_CANONICAL_FIELD_MISMATCH:${key}`);
  }
  assert.strictEqual(actual.canonicalVersion, canonicalVersion(), `${category}_CANONICAL_VERSION_MISMATCH`);
  assert.strictEqual(actual.contentVersion, CONTENT_VERSION, `${category}_CONTENT_VERSION_MISMATCH`);
  assert.strictEqual(actual.indexVersion, INDEX_VERSION, `${category}_INDEX_VERSION_MISMATCH`);
}

function assertUniqueFirstInclusionProvenance(evidence) {
  const provenance = evidence.provenance && evidence.provenance.objects || [];
  const keys = provenance.map(item => `${item.objectType}:${item.objectId}`);
  assert.strictEqual(new Set(keys).size, keys.length, 'SP03_DUPLICATE_FIRST_INCLUSION_PROVENANCE');
  for (const returnedObject of collectReturnedObjects(evidence)) {
    const matches = provenance.filter(item => (
      item.objectType === returnedObject.objectType
      && item.objectId === returnedObject.objectId
    ));
    assert.strictEqual(
      matches.length,
      1,
      `SP03_RETURNED_OBJECT_FIRST_INCLUSION_PROVENANCE_COUNT:${returnedObject.objectType}:${returnedObject.objectId}`,
    );
    assert.strictEqual(typeof matches[0].firstInclusionReason, 'string', `SP03_FIRST_INCLUSION_REASON_MISSING:${returnedObject.objectType}:${returnedObject.objectId}`);
    assert(Array.isArray(matches[0].supplementaryReasons), `SP03_SUPPLEMENTARY_PROVENANCE_MISSING:${returnedObject.objectType}:${returnedObject.objectId}`);
  }
}

function collectReturnedObjects(evidence) {
  const collected = [];
  const add = (objectType, objectId) => {
    if (objectId) collected.push({ objectType, objectId });
  };
  for (const [channel, key] of Object.entries(CHANNEL_KEYS)) {
    for (const item of (evidence.seedsByType && evidence.seedsByType[key]) || []) {
      add(channel, item.id || item.canonicalIdentity);
    }
  }
  for (const relationship of (evidence.endpointClosure && evidence.endpointClosure.relationships) || []) {
    add('ArchitectureRelationship', relationship.id);
    add('Element', relationship.source_id);
    add('Element', relationship.target_id);
  }
  for (const view of (evidence.viewClosure && evidence.viewClosure.views) || []) {
    add('View', view.view_id);
    for (const element of view.memberElements || []) add('Element', element.id);
    for (const relationship of view.memberRelationships || []) {
      add('ArchitectureRelationship', relationship.id);
      add('Element', relationship.source_id);
      add('Element', relationship.target_id);
    }
  }
  return [...new Map(collected.map(item => [`${item.objectType}:${item.objectId}`, item])).values()];
}

function assertReadinessMatrix(outcomes) {
  assert.deepStrictEqual(
    outcomes.map(item => item.definition.name),
    READINESS_CASES.map(item => item.name),
    'SP04_READINESS_MATRIX_INCOMPLETE',
  );
  for (const { definition, readiness, observation } of outcomes) {
    if (definition.expectedAccepted) {
      assert.strictEqual(observation.result && observation.result.status, 'passed', 'SP04_COMPLETE_ALIGNMENT_REJECTED');
      assertReadinessBeforeProviderAndVector(observation, 'SP04');
      continue;
    }
    const error = observation.result && observation.result.error;
    assert.strictEqual(observation.result && observation.result.status, 'failed', `SP04_NON_ALIGNED_QUERY_ACCEPTED:${definition.name}`);
    assert.strictEqual(error && error.category, 'SEMANTIC_INDEX_NOT_ALIGNED', `SP04_READINESS_CATEGORY_MISSING:${definition.name}`);
    assert.strictEqual(error && error.fullSnapshotFallback, false, `SP04_SILENT_SNAPSHOT_FALLBACK:${definition.name}`);
    assert.strictEqual(error && error.state, definition.state, `SP04_ACTIONABLE_STATE_MISMATCH:${definition.name}`);
    assert.strictEqual(error && error.canonicalVersion, readiness.canonicalVersion, `SP04_CANONICAL_VERSION_EVIDENCE_MISMATCH:${definition.name}`);
    assert.strictEqual(error && error.contentVersion, readiness.contentVersion, `SP04_CONTENT_VERSION_EVIDENCE_MISMATCH:${definition.name}`);
    assert.strictEqual(error && error.indexVersion, readiness.indexVersion, `SP04_INDEX_VERSION_EVIDENCE_MISMATCH:${definition.name}`);
    assert.deepStrictEqual(error && error.missingChannels, definition.missingChannels, `SP04_MISSING_CHANNEL_EVIDENCE_MISMATCH:${definition.name}`);
    assert.deepStrictEqual(error && error.mismatchedChannels, definition.mismatchedChannels, `SP04_MISMATCHED_CHANNEL_EVIDENCE_MISMATCH:${definition.name}`);
    assert.strictEqual(observation.readinessReads.length, 1, `SP04_READINESS_READ_COUNT_MISMATCH:${definition.name}`);
    assert.strictEqual(observation.providerRequests.length, 0, `SP04_REJECTED_STATE_REACHED_PROVIDER:${definition.name}`);
    assert.strictEqual(observation.vectorQueries.length, 0, `SP04_REJECTED_STATE_REACHED_VECTOR_RETRIEVAL:${definition.name}`);
    const readinessSequence = observation.readinessReads[0].sequence;
    assert(
      observation.operationLedger
        .filter(event => event.kind === 'credential-source-resolution')
        .every(event => event.sequence < readinessSequence),
      `SP04_CREDENTIAL_RESOLUTION_ORDER_INVALID:${definition.name}`,
    );
    assert.strictEqual(
      observation.operationLedger.at(-1).kind,
      'semantic-readiness-read',
      `SP04_REJECTED_STATE_OPERATION_NOT_TERMINAL:${definition.name}`,
    );
  }
}

function assertReadinessBeforeProviderAndVector(observation, prefix) {
  assertReadinessBeforeProviderAndVectorCounts(observation, prefix, 6);
}

function assertReadinessBeforeProviderAndVectorCounts(observation, prefix, minimumVectorQueries) {
  assert.strictEqual(observation.readinessReads.length, 1, `${prefix}_PERSISTENT_READINESS_READ_REQUIRED`);
  const readinessSequence = observation.readinessReads[0].sequence;
  assert.strictEqual(observation.providerRequests.length, 1, `${prefix}_QUERY_EMBEDDING_CALL_COUNT`);
  assert(observation.providerRequests[0].sequence > readinessSequence, `${prefix}_PROVIDER_EXECUTED_BEFORE_READINESS`);
  assert(observation.vectorQueries.length >= minimumVectorQueries, `${prefix}_PAGINATED_VECTOR_QUERY_EVIDENCE_INCOMPLETE`);
  assert(
    observation.vectorQueries.every(operation => operation.sequence > observation.providerRequests[0].sequence),
    `${prefix}_VECTOR_QUERY_EXECUTED_BEFORE_PROVIDER`,
  );
  for (let index = 1; index < observation.operationLedger.length; index += 1) {
    assert(
      observation.operationLedger[index].sequence > observation.operationLedger[index - 1].sequence,
      `${prefix}_TOTAL_OPERATION_ORDER_INVALID`,
    );
  }
}

function assertZeroResultChannels(observation) {
  assert.strictEqual(observation.result && observation.result.status, 'passed', 'SP03_ZERO_RESULT_QUERY_FAILED');
  assertApprovedCredentialSourceEvidence(observation);
  assertZeroResultRetrievalEvidence(observation);
}

function assertZeroResultRetrievalEvidence(observation) {
  assert.strictEqual(observation.readinessReads.length, 1, 'SP03_ZERO_RESULT_READINESS_MISSING');
  assert.strictEqual(observation.providerRequests.length, 1, 'SP03_ZERO_RESULT_EMBEDDING_MISSING');
  assertVectorQueryContract(observation);
  for (const channel of CHANNELS) {
    assert.deepStrictEqual(returnedSeedIds(observation.result.result, channel), [], `SP03_ZERO_RESULT_INVALID:${channel}`);
    const operations = observation.vectorQueries.filter(item => item.channel === channel);
    const responses = observation.vectorWindowResponses.filter(item => item.channel === channel);
    assert.strictEqual(operations.length, 1, `SP03_ZERO_RESULT_QUERY_SEQUENCE_COUNT:${channel}`);
    assert.strictEqual(operations[0].parameters.offset, 0, `SP03_ZERO_RESULT_INITIAL_OFFSET:${channel}`);
    assert.strictEqual(operations[0].parameters.windowSize, INITIAL_WINDOW_SIZE, `SP03_ZERO_RESULT_INITIAL_WINDOW:${channel}`);
    assert.strictEqual(operations[0].parameters.topK, INITIAL_WINDOW_SIZE, `SP03_ZERO_RESULT_INITIAL_TOPK:${channel}`);
    assert.strictEqual(responses.length, 1, `SP03_ZERO_RESULT_RESPONSE_COUNT:${channel}`);
    assert.strictEqual(responses[0].returnedCount, 0, `SP03_ZERO_RESULT_RAW_RECORDS_NOT_EMPTY:${channel}`);
    assert.strictEqual(responses[0].hasMore, false, `SP03_ZERO_RESULT_HAS_MORE_INVALID:${channel}`);
    assert.strictEqual(responses[0].windowExhausted, true, `SP03_ZERO_RESULT_NOT_EXHAUSTED:${channel}`);
  }
  assertReadinessBeforeProviderAndVectorCounts(observation, 'SP03_ZERO_RESULT', CHANNELS.length);
}

function runRawEvidenceAssertionSelfTests() {
  const snapshot = canonicalSnapshot();
  const canonicalView = snapshot.views.find(view => view.view_id === SELECTED_VIEW_ID);
  const providerVector = Array.from({ length: APPROVED_PROFILE.dimensions }, () => 0.5);
  return deepFreeze({
    approvedSourceReads: expectAssertionFailure(
      () => assertApprovedCredentialSourceEvidence({
        operationLedger: [],
        readinessReads: [{ sequence: 1 }],
        result: { result: { configurationEvidence: { attribution: {} } } },
      }),
      'SP03_APPROVED_SOURCE_REQUIRED_KEY_READS_INCOMPLETE',
    ),
    zeroResultRetrieval: expectAssertionFailure(
      () => assertZeroResultRetrievalEvidence({
        readinessReads: [{ sequence: 1 }],
        providerRequests: [{ sequence: 2 }],
        providerResponses: [{ sequence: 2, vector: providerVector }],
        vectorQueries: [],
        vectorWindowResponses: [],
        operationLedger: [
          { sequence: 1, kind: 'semantic-readiness-read' },
          { sequence: 2, kind: 'provider-request' },
        ],
        result: { result: { seedsByType: { elements: [], relationships: [], views: [] } } },
      }),
      'SP03_VECTOR_CHANNEL_QUERY_MISSING:Element',
    ),
    vectorIndexCorrelation: expectAssertionFailure(
      () => assertVectorQueryContract({
        providerResponses: [{ sequence: 1, vector: providerVector }],
        vectorQueries: selfTestVectorOperations(providerVector, { Element: { indexName: 'wrong-index' } }),
      }),
      'SP03_VECTOR_INDEX_NAME_MISMATCH:Element',
    ),
    parameterizedCypherCorrelation: expectAssertionFailure(
      () => assertVectorQueryContract({
        providerResponses: [{ sequence: 1, vector: providerVector }],
        vectorQueries: selfTestVectorOperations(providerVector, { Element: { cypher: 'MATCH (n) RETURN n' } }),
      }),
      'SP03_PARAMETERIZED_VECTOR_CYPHER_MISMATCH:Element',
    ),
    providerQueryVectorCorrelation: expectAssertionFailure(
      () => assertVectorQueryContract({
        providerResponses: [{ sequence: 1, vector: providerVector }],
        vectorQueries: selfTestVectorOperations(providerVector, {
          Element: { parameters: { vector: Array.from({ length: APPROVED_PROFILE.dimensions }, () => 0.25) } },
        }),
      }),
      'SP03_QUERY_VECTOR_PROVIDER_VECTOR_MISMATCH:Element',
    ),
    completeViewMetadata: expectAssertionFailure(
      () => assertCompleteSelectedView({
        ...canonicalView,
        view_name: 'Incomplete metadata substitute',
      }, canonicalView, snapshot),
      'SP03_SELECTED_VIEW_METADATA_MISMATCH:view_name',
    ),
    missingParentViewpoint: expectAssertionFailure(
      () => {
        const selected = selfTestCompleteSelectedView(snapshot);
        delete selected.parentViewpoint;
        assertCompleteSelectedView(selected, canonicalView, snapshot);
      },
      'SP03_SELECTED_VIEW_PARENT_VIEWPOINT_OBJECT_MISSING',
    ),
    incompleteViewMembers: expectAssertionFailure(
      () => {
        const selected = selfTestCompleteSelectedView(snapshot);
        selected.memberElements = selected.memberElements.slice(0, -1);
        assertCompleteSelectedView(selected, canonicalView, snapshot);
      },
      'SP03_SELECTED_VIEW_MEMBER_OBJECTS_INCOMPLETE',
    ),
    versionWrongViewMember: expectAssertionFailure(
      () => {
        const selected = selfTestCompleteSelectedView(snapshot);
        selected.memberElements[0] = {
          ...selected.memberElements[0],
          canonicalVersion: 'canonical:wrong',
        };
        assertCompleteSelectedView(selected, canonicalView, snapshot);
      },
      `SP03_SELECTED_VIEW_MEMBER:${canonicalView.included_elements[0]}_CANONICAL_VERSION_MISMATCH`,
    ),
    missingRelationshipEndpoint: expectAssertionFailure(
      () => {
        const selected = selfTestCompleteSelectedView(snapshot);
        selected.memberRelationships[0] = {
          ...selected.memberRelationships[0],
          source: undefined,
        };
        assertCompleteSelectedView(selected, canonicalView, snapshot);
      },
      `SP03_SELECTED_VIEW_RELATIONSHIP_SOURCE:${canonicalView.included_relationships[0]}_OBJECT_MISSING`,
    ),
    wrongRelationshipEndpoint: expectAssertionFailure(
      () => {
        const selected = selfTestCompleteSelectedView(snapshot);
        selected.memberRelationships[0] = {
          ...selected.memberRelationships[0],
          target: {
            ...selected.memberRelationships[0].target,
            id: 'wrong-endpoint',
          },
        };
        assertCompleteSelectedView(selected, canonicalView, snapshot);
      },
      `SP03_SELECTED_VIEW_RELATIONSHIP_TARGET:${canonicalView.included_relationships[0]}_CANONICAL_FIELD_MISMATCH:id`,
    ),
    completeReturnedObjectProvenance: expectAssertionFailure(
      () => assertUniqueFirstInclusionProvenance({
        seedsByType: {
          elements: [{ id: 'semprod-default-vector-retrieval' }],
          relationships: [],
          views: [],
        },
        provenance: { objects: [] },
      }),
      'SP03_RETURNED_OBJECT_FIRST_INCLUSION_PROVENANCE_COUNT:Element:semprod-default-vector-retrieval',
    ),
    duplicateFirstInclusionProvenance: expectAssertionFailure(
      () => assertUniqueFirstInclusionProvenance({
        seedsByType: {
          elements: [{ id: 'semprod-default-vector-retrieval' }],
          relationships: [],
          views: [],
        },
        provenance: {
          objects: [
            {
              objectType: 'Element',
              objectId: 'semprod-default-vector-retrieval',
              firstInclusionReason: 'semantic-seed',
              supplementaryReasons: [],
            },
            {
              objectType: 'Element',
              objectId: 'semprod-default-vector-retrieval',
              firstInclusionReason: 'purpose-policy-closure',
              supplementaryReasons: [],
            },
          ],
        },
      }),
      'SP03_DUPLICATE_FIRST_INCLUSION_PROVENANCE',
    ),
  });
}

function selfTestCompleteSelectedView(snapshot) {
  const canonicalView = snapshot.views.find(view => view.view_id === SELECTED_VIEW_ID);
  return {
    ...canonicalView,
    viewpointBinding: {
      viewpoint: 'Implementation and Migration Viewpoint',
      description: canonicalView.description,
    },
    parentViewpoint: selfTestVersionedCanonicalObject(
      snapshot.elements.find(element => element.id === canonicalView.parent_element_id),
    ),
    memberElements: canonicalView.included_elements.map(elementId => (
      selfTestVersionedCanonicalObject(snapshot.elements.find(element => element.id === elementId))
    )),
    memberRelationships: canonicalView.included_relationships.map(relationshipId => {
      const relationship = snapshot.relationships.find(item => item.id === relationshipId);
      return {
        ...selfTestVersionedCanonicalObject(relationship),
        source: selfTestVersionedCanonicalObject(
          snapshot.elements.find(element => element.id === relationship.source_id),
        ),
        target: selfTestVersionedCanonicalObject(
          snapshot.elements.find(element => element.id === relationship.target_id),
        ),
      };
    }),
  };
}

function selfTestVersionedCanonicalObject(canonical) {
  return {
    ...canonical,
    canonicalVersion: canonicalVersion(),
    contentVersion: CONTENT_VERSION,
    indexVersion: INDEX_VERSION,
  };
}

function selfTestVectorOperations(providerVector, overrides = {}) {
  return CHANNELS.map(channel => {
    const override = overrides[channel] || {};
    return {
      channel,
      indexName: INDEX_NAMES[channel],
      cypher: VECTOR_QUERY_CYPHER,
      ...override,
      parameters: {
        indexName: INDEX_NAMES[channel],
        channel,
        offset: 0,
        windowSize: INITIAL_WINDOW_SIZE,
        topK: INITIAL_WINDOW_SIZE,
        vector: providerVector,
        ...(override.parameters || {}),
      },
    };
  });
}

function expectAssertionFailure(callback, expectedMessage) {
  let error;
  try {
    callback();
  } catch (caught) {
    error = caught;
  }
  assert(error instanceof assert.AssertionError, `WP_P2_RAW_EVIDENCE_SELF_TEST_DID_NOT_REJECT:${expectedMessage}`);
  assert(String(error.message).includes(expectedMessage), `WP_P2_RAW_EVIDENCE_SELF_TEST_WRONG_REJECTION:${expectedMessage}:${error.message}`);
  return true;
}

function assertFullSnapshotCompatibility(controls) {
  assert.strictEqual(controls.noArgument.status, 'passed', 'SP04_NO_ARGUMENT_FULL_SNAPSHOT_BLOCKED');
  assert.deepStrictEqual(controls.noArgument.document, controls.before, 'SP04_NO_ARGUMENT_FULL_SNAPSHOT_CHANGED');
  assert.strictEqual(controls.graphTidy.status, 'passed', 'SP04_GRAPH_TIDY_FULL_SNAPSHOT_BLOCKED');
  assert.strictEqual(controls.graphTidy.query && controls.graphTidy.query.mode, 'full-snapshot', 'SP04_GRAPH_TIDY_MODE_CHANGED');
  assert.strictEqual(controls.graphTidy.query && controls.graphTidy.query.semanticRetrieval, 'bypassed', 'SP04_GRAPH_TIDY_RETRIEVAL_NOT_BYPASSED');
  assert.deepStrictEqual(controls.graphTidy.document, controls.before, 'SP04_GRAPH_TIDY_FULL_SNAPSHOT_CHANGED');
}

function inspectFrozenRawEvidenceContract() {
  return RAW_EVIDENCE_CONTRACT;
}

function returnedSeedIds(evidence, channel) {
  const key = CHANNEL_KEYS[channel];
  return ((evidence && evidence.seedsByType && evidence.seedsByType[key]) || [])
    .map(item => item.id || item.canonicalIdentity);
}

function loadDefaultRetrievalBoundary(missingBoundaryCategory) {
  assert(
    fs.existsSync(defaultRetrievalPath),
    `${missingBoundaryCategory}: create production defaultSemanticRetrieval.js`,
  );
  return require(defaultRetrievalPath);
}

function callDefaultGetSystemArchitecture(args) {
  const { callTool } = require(systemArchitectureMcpPath);
  const semanticOperatorJourney = args
    && args.query
    && args.query.purpose !== 'graph-tidy'
    ? createApprovedDefaultSemanticOperatorJourneyAdapter()
    : undefined;
  return callTool(
    'getSystemArchitecture',
    args,
    semanticOperatorJourney ? { semanticOperatorJourney } : undefined,
  );
}

function createApprovedDefaultSemanticOperatorJourneyAdapter() {
  const { createDefaultSemanticRetrieval } = loadDefaultRetrievalBoundary(
    'SP03_DEFAULT_VECTOR_RETRIEVAL_BOUNDARY_MISSING',
  );
  return createApprovedSemanticOperatorJourneyAdapter(
    createDefaultSemanticRetrieval({
      canonicalGraph: JSON.parse(fs.readFileSync(canonicalPath, 'utf8')),
      repositoryRoot: repoRoot,
    }),
  );
}

function createApprovedSemanticOperatorJourneyAdapter(semanticRetrievalBoundary) {
  assert(
    semanticRetrievalBoundary && typeof semanticRetrievalBoundary.retrieve === 'function',
    'SP03_APPROVED_OPERATOR_RETRIEVAL_REQUIRED',
  );
  return Object.freeze({
    async query(query) {
      try {
        const document = await semanticRetrievalBoundary.retrieve(query);
        return semanticMcpResult({
          status: 'passed',
          graphPath: 'design/KG/SystemArchitecture.json',
          query: {
            ...query,
            mode: 'semantic-query',
            semanticRetrieval: 'invoked',
          },
          ...(document && Object.prototype.hasOwnProperty.call(document, 'result')
            ? { result: document.result }
            : { result: document }),
          document,
        });
      } catch (error) {
        const evidence = {};
        for (const field of [
          'fullSnapshotFallback',
          'state',
          'canonicalVersion',
          'contentVersion',
          'indexVersion',
          'completedChannels',
          'missingChannels',
          'mismatchedChannels',
        ]) {
          if (error && Object.prototype.hasOwnProperty.call(error, field)) {
            evidence[field] = error[field];
          }
        }
        return semanticMcpResult({
          status: 'failed',
          error: {
            category: error && error.category
              ? error.category
              : 'SEMANTIC_RETRIEVAL_FAILED',
            message: error && error.message
              ? error.message
              : 'Semantic retrieval failed',
            ...evidence,
          },
        });
      }
    },
  });
}

function semanticMcpResult(payload) {
  const failed = payload.status === 'failed';
  return {
    ...payload,
    content: [{
      type: 'text',
      text: JSON.stringify(payload, null, 2),
    }],
    structuredContent: {
      version: '1.0',
      mode: failed ? 'error' : ((payload.query && payload.query.mode) || 'full-snapshot'),
      document: failed ? null : payload.document,
      query: failed ? null : (payload.query || null),
      error: failed ? payload.error : null,
    },
    isError: failed,
  };
}

function channelThreshold(channel) {
  return channel === 'Element' ? 0.8 : channel === 'ArchitectureRelationship' ? 0.78 : 0.76;
}

function freezeOperation(operation) {
  return Object.freeze({
    ...(operation || {}),
    parameters: Object.freeze({ ...((operation && operation.parameters) || {}) }),
  });
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

module.exports = {
  assertAnchoredGraphTidyCompatibility,
  assertCredentialSourceMatrix,
  assertDefaultVectorRetrieval,
  assertFullSnapshotCompatibility,
  assertLegacyControlWordProductionGate,
  assertProductionQueryCredentialResolution,
  assertProductionQueryMixedLegacyRejections,
  assertReadinessMatrix,
  assertZeroResultChannels,
  inspectFrozenRawEvidenceContract,
  runRawEvidenceAssertionSelfTests,
  runAnchoredGraphTidyCompatibilityControl,
  runCredentialSourceMatrix,
  runProductionQueryCredentialResolution,
  runProductionQueryMixedLegacyRejections,
  runDefaultMcpNeo4jVectorRetrieval,
  runFullSnapshotCompatibilityControls,
  runLegacyControlWordProductionGate,
  runReadinessMatrix,
  runZeroResultDefaultMcpRetrieval,
};

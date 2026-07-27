const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { AsyncLocalStorage } = require('node:async_hooks');

const { createLiveEmbeddingIndexGate } = require('./liveEmbeddingIndexGate.js');
const { createApprovedNeo4jBoundary } = require('./liveEmbeddingNeo4jBoundary.js');
const {
  resolveApprovedLiveConfiguration,
} = require('./liveEmbeddingProviderConfig.js');
const {
  createLiveEmbeddingProviderClient,
} = require('./liveEmbeddingProviderClient.js');
const {
  createProductionSemanticNeo4jAdapter,
} = require('./semantic-persistence/productionSemanticNeo4jAdapter.js');
const {
  createProductionSemanticProjectionStore,
} = require('./semantic-persistence/productionSemanticProjectionStore.js');

const DEFAULT_GRAPH_PATH = 'design/KG/SystemArchitecture.json';
const CHANNEL_BY_TYPE = Object.freeze({
  Element: 'elements',
  ArchitectureRelationship: 'relationships',
  View: 'views',
});
const persistentCompositionStorage = new AsyncLocalStorage();
const PERSISTENT_CHANNELS = Object.freeze(['Element', 'ArchitectureRelationship', 'View']);

function createPersistentMutationEmbeddingLifecycle(dependencies = {}) {
  const productionDependencies = hasPersistentLifecyclePorts(dependencies)
    ? dependencies
    : createProductionPersistentLifecycleDependencies(dependencies);
  return Object.freeze({
    reconcile(input = {}) {
      const active = persistentCompositionStorage.getStore();
      return persistentReconcile(active || productionDependencies, input);
    },
  });
}

async function withPersistentMutationEmbeddingLifecycleTestComposition(composition, callback) {
  if (!composition || typeof callback !== 'function') {
    throw new TypeError('Persistent mutation lifecycle composition and callback are required');
  }
  return persistentCompositionStorage.run(Object.freeze({ ...composition }), callback);
}

function hasPersistentLifecyclePorts(dependencies) {
  return Boolean(
    dependencies
    && dependencies.readiness
    && dependencies.configuration
    && dependencies.provider
    && dependencies.projectionStore
    && dependencies.queryability
    && dependencies.coherence,
  );
}

function createProductionPersistentLifecycleDependencies(options = {}) {
  const repositoryRoot = path.resolve(
    options.repositoryRoot
    || process.env.ARGO_REPO_ROOT
    || process.env.WORKSPACE_FOLDER
    || path.join(__dirname, '..', '..', '..'),
  );
  let pendingReadiness;
  let resources;

  async function requireResources() {
    if (resources) return resources;
    const configurationEvidence = await resolveApprovedLiveConfiguration({
      repositoryRoot,
      requiredOptIns: ['ARGO_LIVE_PROVIDER_E2E', 'ARGO_W31_LIVE_MUTATION_VECTOR_E2E'],
    });
    const configuration = configurationEvidence.configuration;
    const neo4j = require('neo4j-driver');
    const driver = neo4j.driver(
      configuration.neo4jDatabaseUrl,
      neo4j.auth.basic(
        configuration.neo4jDatabaseUsername,
        configuration.neo4jDatabasePassword,
      ),
    );
    const qualification = Object.freeze({
      approvedByHuman: true,
      provider: configuration.embeddingProvider,
      model: configuration.embeddingModel,
      version: configuration.embeddingModelVersion,
      dimensions: configuration.embeddingDimensions,
      source: 'explicit-human-approval',
    });
    const storeConfiguration = Object.freeze({
      ...configuration,
      embeddingCredential: configuration.qwenKey,
    });
    const persistenceAdapter = createProductionSemanticNeo4jAdapter({
      driver,
      configuration: storeConfiguration,
    });
    const projectionStore = createProductionSemanticProjectionStore({
      persistenceAdapter,
      canonicalAuthority: Object.freeze({
        assertProjectionOnly() {
          return Object.freeze({
            authority: 'canonical-json',
            projectionRole: 'subordinate-projection-index',
          });
        },
      }),
      configuration: storeConfiguration,
      qualification,
    });
    const provider = createLiveEmbeddingProviderClient({
      configuration,
      transport: Object.freeze({
        request(url, requestOptions) {
          if (typeof global.fetch !== 'function') {
            throw safePersistentError(
              'LIVE_PROVIDER_TRANSPORT_UNAVAILABLE',
              'Provide the approved HTTPS embedding transport, then run argo init.',
            );
          }
          return global.fetch(url, requestOptions);
        },
      }),
    });
    resources = Object.freeze({
      configuration,
      driver,
      projectionStore,
      provider,
    });
    if (pendingReadiness) {
      await writeProductionReadiness(resources, pendingReadiness);
    }
    return resources;
  }

  return Object.freeze({
    readiness: Object.freeze({
      async invalidate(evidence) {
        pendingReadiness = Object.freeze({ ...evidence });
        if (resources) await writeProductionReadiness(resources, pendingReadiness);
      },
      async recordAligned(evidence) {
        pendingReadiness = Object.freeze({ ...evidence });
        if (resources) await writeProductionReadiness(resources, pendingReadiness);
      },
      async recordFailure(evidence) {
        pendingReadiness = Object.freeze({ ...evidence });
        if (resources) await writeProductionReadiness(resources, pendingReadiness);
      },
    }),
    configuration: Object.freeze({
      async resolve() {
        const active = await requireResources();
        return active.configuration;
      },
    }),
    provider: Object.freeze({
      async embed(content) {
        const active = await requireResources();
        return active.provider.embed(JSON.stringify(content));
      },
    }),
    projectionStore: Object.freeze({
      async upsertRecords(records) {
        const active = await requireResources();
        return active.projectionStore.upsertRecords(records);
      },
      async deleteTombstones(tombstones) {
        const active = await requireResources();
        return active.projectionStore.deleteTombstones(tombstones);
      },
      async readRecords() {
        const active = await requireResources();
        return active.projectionStore.readRecords();
      },
      async close() {
        if (resources) await resources.projectionStore.close();
      },
    }),
    queryability: Object.freeze({
      async verifyTouched({ records, tombstones }) {
        const active = await requireResources();
        const persisted = await active.projectionStore.readRecords();
        const byIdentity = new Map(persisted.map(record => [record.canonicalIdentity, record]));
        return records.every(record => {
          const stored = byIdentity.get(record.canonicalIdentity);
          return stored
            && stored.canonicalVersion === record.canonicalVersion
            && stored.contentVersion === record.contentVersion
            && stored.indexVersion === record.indexVersion
            && Array.isArray(stored.vector)
            && stored.vector.length === record.dimensions;
        }) && tombstones.every(tombstone => !byIdentity.has(tombstone.canonicalIdentity));
      },
    }),
    coherence: Object.freeze({
      async verifyGlobal({ canonicalWrite }) {
        const active = await requireResources();
        const persisted = await active.projectionStore.readRecords();
        const expectedVersion = persistentVersions(canonicalWrite).canonicalVersion;
        const channels = new Set(persisted.map(record => record.channel));
        return PERSISTENT_CHANNELS.every(channel => channels.has(channel))
          && persisted.every(record => record.canonicalVersion === expectedVersion);
      },
    }),
  });
}

async function writeProductionReadiness(resources, evidence) {
  const session = resources.driver.session(
    resources.configuration.neo4jDatabase === undefined
      ? undefined
      : { database: resources.configuration.neo4jDatabase },
  );
  try {
    await session.run([
      'MERGE (readiness:ArgoProductionSemanticReadiness {identity: $identity})',
      'SET readiness.state = $state,',
      '    readiness.verified = $verified,',
      '    readiness.canonicalVersion = $canonicalVersion,',
      '    readiness.contentVersion = $contentVersion,',
      '    readiness.indexVersion = $indexVersion,',
      '    readiness.completedChannels = $completedChannels,',
      '    readiness.missingChannels = $missingChannels,',
      '    readiness.mismatchedChannels = $mismatchedChannels,',
      '    readiness.fullSnapshotFallback = false,',
      '    readiness.category = $category,',
      '    readiness.action = $action,',
      '    readiness.revision = coalesce(readiness.revision, 0) + 1,',
      '    readiness.recordId = coalesce(readiness.recordId, $recordId)',
      'RETURN properties(readiness) AS readiness',
    ].join('\n'), {
      identity: 'argo-production-semantic-index',
      recordId: crypto.randomUUID(),
      state: evidence.state || 'Stale',
      verified: evidence.verified === true,
      canonicalVersion: evidence.canonicalVersion || '',
      contentVersion: evidence.contentVersion || '',
      indexVersion: evidence.indexVersion || '',
      completedChannels: evidence.completedChannels || [],
      missingChannels: evidence.missingChannels || [...PERSISTENT_CHANNELS],
      mismatchedChannels: evidence.mismatchedChannels || [],
      category: evidence.category || 'SEMANTIC_INDEX_NOT_ALIGNED',
      action: evidence.action || 'Run argo init to reconcile the semantic index.',
    });
  } finally {
    await session.close();
  }
}

async function persistentReconcile(dependencies, input) {
  requirePersistentDependencies(dependencies);
  if (input.preview === true) {
    return Object.freeze({
      state: 'Preview',
      alignmentState: 'Preview',
      fullSnapshotFallback: false,
    });
  }
  if (typeof dependencies.observeLifecycleInput === 'function') {
    dependencies.observeLifecycleInput(input);
  }

  const canonicalWrite = requireCanonicalWrite(input.canonicalWrite);
  const versions = persistentVersions(canonicalWrite);
  await dependencies.readiness.invalidate({
    ...versions,
    state: 'Stale',
    verified: false,
    completedChannels: [],
    missingChannels: [...PERSISTENT_CHANNELS],
    mismatchedChannels: [],
    fullSnapshotFallback: false,
  });

  const gateDecision = persistentGateDecision(input.gates || {});
  if (gateDecision === 'disabled') {
    return persistentOutcome('SemanticIndexPending', 'SEMANTIC_LIFECYCLE_DISABLED', versions);
  }
  if (gateDecision !== 'enabled') {
    return recordPersistentFailure(
      dependencies,
      versions,
      safePersistentError(
        'SEMANTIC_LIFECYCLE_GATE_INVALID',
        'Set both semantic lifecycle gates to exactly 1, or disable both.',
      ),
    );
  }

  try {
    const configuration = await dependencies.configuration.resolve();
    const work = buildPersistentWork(canonicalWrite, configuration, versions);
    const records = [];
    for (const item of work.upserts) {
      const vector = await dependencies.provider.embed(item.content, {
        configuration,
        objectId: item.objectId,
        channel: item.channel,
      });
      records.push(Object.freeze({
        ...item,
        vector: requirePersistentVector(vector, item.dimensions),
      }));
    }
    for (const tombstone of work.tombstones) {
      const vector = await dependencies.provider.embed({
        removed: true,
        objectId: tombstone.objectId,
        channel: tombstone.channel,
        canonicalVersion: tombstone.canonicalVersion,
      }, {
        configuration,
        objectId: tombstone.objectId,
        channel: tombstone.channel,
      });
      requirePersistentVector(vector, tombstone.dimensions);
    }
    if (records.length > 0) {
      await dependencies.projectionStore.upsertRecords(records);
    }
    if (work.tombstones.length > 0) {
      await dependencies.projectionStore.deleteTombstones(work.tombstones);
    }
    const queryable = await dependencies.queryability.verifyTouched({
      records,
      tombstones: work.tombstones,
      canonicalWrite,
    });
    if (queryable !== true) {
      throw safePersistentError(
        'QUERYABILITY_FAILED',
        'Repair touched semantic record queryability, then run argo init.',
      );
    }
    const coherent = await dependencies.coherence.verifyGlobal({
      records,
      tombstones: work.tombstones,
      canonicalWrite,
    });
    if (coherent !== true) {
      throw safePersistentError(
        'GLOBAL_COHERENCE_FAILED',
        'Repair semantic global coherence, then run argo init.',
      );
    }
    const aligned = persistentReadinessEvidence('Aligned', versions);
    await dependencies.readiness.recordAligned(aligned);
    return Object.freeze({
      state: 'Aligned',
      alignmentState: 'Aligned',
      records: Object.freeze(records),
      tombstones: Object.freeze(work.tombstones),
      alignment: Object.freeze({
        ...aligned,
        category: 'SEMANTIC_INDEX_ALIGNED',
        action: 'Semantic index is ready.',
      }),
      fullSnapshotFallback: false,
    });
  } catch (error) {
    return recordPersistentFailure(dependencies, versions, error);
  }
}

function requirePersistentDependencies(dependencies) {
  const required = [
    ['readiness', 'invalidate'],
    ['readiness', 'recordAligned'],
    ['readiness', 'recordFailure'],
    ['configuration', 'resolve'],
    ['provider', 'embed'],
    ['projectionStore', 'upsertRecords'],
    ['projectionStore', 'deleteTombstones'],
    ['queryability', 'verifyTouched'],
    ['coherence', 'verifyGlobal'],
  ];
  for (const [boundary, method] of required) {
    if (!dependencies || !dependencies[boundary] || typeof dependencies[boundary][method] !== 'function') {
      throw new TypeError(`${boundary}.${method} is required`);
    }
  }
}

function requireCanonicalWrite(canonicalWrite) {
  if (
    !canonicalWrite
    || canonicalWrite.written !== true
    || !canonicalWrite.document
    || typeof canonicalWrite.document !== 'object'
  ) {
    throw safePersistentError(
      'CANONICAL_WRITE_REQUIRED',
      'Apply a valid canonical write before semantic reconciliation.',
    );
  }
  return canonicalWrite;
}

function persistentGateDecision(gates) {
  const provider = gates.ARGO_LIVE_PROVIDER_E2E;
  const mutation = gates.ARGO_W31_LIVE_MUTATION_VECTOR_E2E;
  const providerDisabled = provider === undefined || provider === '';
  const mutationDisabled = mutation === undefined || mutation === '';
  if (providerDisabled && mutationDisabled) return 'disabled';
  if (provider === '1' && mutation === '1') return 'enabled';
  return 'invalid';
}

function persistentVersions(canonicalWrite) {
  const canonicalVersion = canonicalWrite.document.version
    || `canonical:${fingerprint({
      name: canonicalWrite.document.name || 'System',
      elements: (canonicalWrite.document.elements || []).map(element => element.id).sort(),
      relationships: (canonicalWrite.document.relationships || []).map(relationship => relationship.id).sort(),
      views: (canonicalWrite.document.views || []).map(view => view.view_id).sort(),
    })}`;
  return Object.freeze({
    canonicalVersion,
    contentVersion: `content:${fingerprint({
      touchedElementIds: unique(canonicalWrite.touchedElementIds),
      touchedRelationshipIds: unique(canonicalWrite.touchedRelationshipIds),
      touchedViewIds: unique(canonicalWrite.touchedViewIds),
    })}`,
    indexVersion: `index:${fingerprint({
      canonicalVersion,
      mutations: canonicalWrite.mutations || [],
    })}`,
  });
}

function buildPersistentWork(canonicalWrite, configuration, versions) {
  const graph = canonicalWrite.document;
  const profile = persistentProfile(configuration);
  const removeOnly = Array.isArray(canonicalWrite.mutations)
    && canonicalWrite.mutations.length > 0
    && canonicalWrite.mutations.every(mutation => (
      mutation && typeof mutation.type === 'string' && mutation.type.startsWith('remove')
    ));
  const definitions = [
    {
      channel: 'Element',
      ids: unique(canonicalWrite.touchedElementIds),
      entries: graph.elements || [],
      idField: 'id',
    },
    {
      channel: 'ArchitectureRelationship',
      ids: unique(canonicalWrite.touchedRelationshipIds),
      entries: graph.relationships || [],
      idField: 'id',
    },
    {
      channel: 'View',
      ids: unique(canonicalWrite.touchedViewIds),
      entries: graph.views || [],
      idField: 'view_id',
    },
  ];
  const upserts = [];
  const tombstones = [];
  for (const definition of definitions) {
    for (const objectId of definition.ids) {
      const content = definition.entries.find(entry => entry && entry[definition.idField] === objectId);
      const base = {
        objectId,
        canonicalIdentity: `${definition.channel}:${objectId}`,
        channel: definition.channel,
        ...versions,
        ...profile,
      };
      if (content && !removeOnly) {
        upserts.push(Object.freeze({
          ...base,
          contentVersion: `content:${fingerprint(content)}`,
          indexVersion: `index:${fingerprint({ objectId, content, canonicalVersion: versions.canonicalVersion })}`,
          content,
        }));
      } else {
        tombstones.push(Object.freeze(base));
      }
    }
  }
  return Object.freeze({
    upserts: Object.freeze(upserts),
    tombstones: Object.freeze(tombstones),
  });
}

function persistentProfile(configuration) {
  const profile = configuration && typeof configuration === 'object' ? configuration : {};
  const provider = profile.provider || profile.embeddingProvider;
  const model = profile.model || profile.embeddingModel;
  const modelVersion = profile.modelVersion || profile.embeddingModelVersion || profile.version;
  const dimensions = profile.dimensions || profile.embeddingDimensions;
  if (
    typeof provider !== 'string'
    || typeof model !== 'string'
    || typeof modelVersion !== 'string'
    || !Number.isInteger(dimensions)
    || dimensions <= 0
  ) {
    throw safePersistentError(
      'EMBEDDING_QUALIFICATION_REQUIRED',
      'Provide the approved provider qualification, then run argo init.',
    );
  }
  return Object.freeze({ provider, model, modelVersion, dimensions });
}

function requirePersistentVector(vector, dimensions) {
  if (
    !Array.isArray(vector)
    || vector.length !== dimensions
    || vector.some(value => typeof value !== 'number' || !Number.isFinite(value))
  ) {
    throw safePersistentError(
      'PROVIDER_VECTOR_INVALID',
      'Repair the qualified embedding provider response, then run argo init.',
    );
  }
  return Object.freeze([...vector]);
}

async function recordPersistentFailure(dependencies, versions, sourceError) {
  const category = safePersistentCategory(sourceError && sourceError.category);
  const state = ['QUERYABILITY_FAILED', 'GLOBAL_COHERENCE_FAILED'].includes(category)
    ? 'Stale'
    : 'Failed';
  const evidence = Object.freeze({
    ...persistentReadinessEvidence(state, versions),
    category,
    action: safePersistentAction(category),
  });
  await dependencies.readiness.recordFailure(evidence);
  return Object.freeze({
    state,
    alignmentState: state,
    alignment: evidence,
    fullSnapshotFallback: false,
  });
}

function persistentReadinessEvidence(state, versions) {
  return Object.freeze({
    state,
    verified: state === 'Aligned',
    ...versions,
    completedChannels: state === 'Aligned' ? [...PERSISTENT_CHANNELS] : [],
    missingChannels: state === 'Aligned' ? [] : [...PERSISTENT_CHANNELS],
    mismatchedChannels: [],
    channels: Object.freeze(PERSISTENT_CHANNELS.map(channel => Object.freeze({
      channel,
      canonicalVersion: versions.canonicalVersion,
      contentVersion: versions.contentVersion,
      indexVersion: versions.indexVersion,
      complete: state === 'Aligned',
    }))),
    fullSnapshotFallback: false,
  });
}

function persistentOutcome(state, category, versions) {
  return Object.freeze({
    state,
    alignmentState: state,
    alignment: Object.freeze({
      ...persistentReadinessEvidence(state, versions),
      category,
      action: 'Enable both semantic lifecycle gates with approved external configuration, then run argo init.',
    }),
    fullSnapshotFallback: false,
  });
}

function safePersistentCategory(category) {
  const approved = new Set([
    'SEMANTIC_LIFECYCLE_GATE_INVALID',
    'EXTERNAL_CREDENTIALS_REQUIRED',
    'SECRET_FILE_ACL_UNSAFE',
    'SECRET_SOURCE_PROVENANCE_PROHIBITED',
    'EMBEDDING_QUALIFICATION_REQUIRED',
    'PROVIDER_FAILED',
    'PROVIDER_VECTOR_INVALID',
    'PERSISTENCE_FAILED',
    'QUERYABILITY_FAILED',
    'GLOBAL_COHERENCE_FAILED',
  ]);
  return approved.has(category) ? category : 'SEMANTIC_LIFECYCLE_FAILED';
}

function safePersistentAction(category) {
  if (category === 'SEMANTIC_LIFECYCLE_GATE_INVALID') {
    return 'Set both semantic lifecycle gates to exactly 1, or disable both.';
  }
  if (category === 'SECRET_FILE_ACL_UNSAFE' || category === 'SECRET_SOURCE_PROVENANCE_PROHIBITED') {
    return 'Correct approved external configuration trust and retry argo init.';
  }
  return 'Repair the semantic lifecycle failure, then run argo init.';
}

function safePersistentError(category, action) {
  const error = new Error(category);
  error.category = category;
  error.action = action;
  error.fullSnapshotFallback = false;
  return error;
}

function createMutationEmbeddingVectorLifecycle(dependencies = {}) {
  const repositoryRoot = path.resolve(dependencies.repositoryRoot || path.join(__dirname, '..', '..', '..'));
  const neo4j = dependencies.neo4j || require('neo4j-driver');
  const fetchImpl = dependencies.fetch || global.fetch;

  return Object.freeze({
    async execute(input = {}) {
      const mutation = requireAppliedMutation(input.mutation);
      const mutationPayload = parseMutationPayload(mutation.response);
      const architecturePath = mutation.architecturePath || mutationPayload.graphPath || DEFAULT_GRAPH_PATH;
      const graph = readCanonicalGraph(repositoryRoot, architecturePath);
      const touchedRecords = extractTouchedRecords({
        graph,
        mutationPayload,
        architecturePath,
      });
      const qualification = requireQualification(input.qualification);
      const configuration = requireConfiguration(dependencies.configuration);
      const runId = `argo-w31-${crypto.randomUUID()}`;
      const transport = createObservedTransport(fetchImpl);
      const neo4jBoundary = createLazyNeo4jBoundary({
        configuration,
        neo4j,
        logger: dependencies.logger,
      });
      const indexBoundary = adaptNeo4jBoundaryForGate(neo4jBoundary, runId);
      const gate = createLiveEmbeddingIndexGate({
        configuration,
        transport,
        indexBoundary,
        logger: dependencies.logger,
      });

      try {
        const vectorEvidence = await generateVectorEvidenceForRecords({
          touchedRecords,
          gate,
          qualification,
        });
        const returnedTouchedRecordIds = await queryEveryTouchedVector({
          neo4jBoundary,
          runId,
          vectorEvidence,
        });
        const allQueryable = touchedRecords.every(record => returnedTouchedRecordIds.includes(record.objectId));
        if (!allQueryable) {
          throw safeError('W31_NEO4J_VECTOR_QUERY_NOT_QUERYABLE');
        }

        const failureMatrix = await buildFailureMatrix({
          touchedRecords,
          qualification,
          configuration,
          semanticQueryProbe: input.semanticQueryProbe,
        });
        await neo4jBoundary.cleanup(runId);
        await neo4jBoundary.close();

        return Object.freeze({
          mutation: Object.freeze({
            applied: true,
            architecturePath,
            marker: mutation.marker,
          }),
          touchedRecords,
          provider: Object.freeze({
            profile: Object.freeze({
              provider: qualification.provider,
              model: qualification.model,
              version: qualification.version,
              dimensions: qualification.dimensions,
            }),
            offlineEvidenceAccepted: false,
            realRequestCount: transport.observation().callCount,
          }),
          vectorEvidence,
          vectorQuery: Object.freeze({
            returnedTouchedRecordIds,
          }),
          alignmentState: 'Aligned',
          failureMatrix,
          secretLeaks: [],
        });
      } catch (error) {
        try { await neo4jBoundary.cleanup(runId); } catch {}
        try { await neo4jBoundary.close(); } catch {}
        return buildFailureOutcome({
          mutation,
          architecturePath,
          touchedRecords,
          qualification,
          transport,
          error,
          semanticQueryProbe: input.semanticQueryProbe,
        });
      }
    },
  });
}

function requireAppliedMutation(mutation) {
  if (!mutation || mutation.applied !== true) {
    throw safeError('W31_APPLY_MUTATION_REQUIRED');
  }
  return mutation;
}

function parseMutationPayload(response) {
  if (response && typeof response === 'object') {
    if (response.status || response.touchedElementIds || response.touchedRelationshipIds || response.touchedViewIds) {
      return response;
    }
    const text = response.content && response.content[0] && response.content[0].text;
    if (typeof text === 'string') {
      return JSON.parse(text);
    }
  }
  throw safeError('W31_APPLY_MUTATION_REQUIRED');
}

function readCanonicalGraph(repositoryRoot, architecturePath) {
  const relative = normalizeRelativePath(architecturePath || DEFAULT_GRAPH_PATH);
  const absolute = path.resolve(repositoryRoot, relative);
  if (!absolute.startsWith(repositoryRoot)) {
    throw safeError('W31_CANONICAL_GRAPH_PATH_INVALID');
  }
  return JSON.parse(fs.readFileSync(absolute, 'utf8'));
}

function extractTouchedRecords({ graph, mutationPayload, architecturePath }) {
  const canonicalVersion = graph.version || fingerprint({
    architecturePath,
    elements: graph.elements && graph.elements.length,
    relationships: graph.relationships && graph.relationships.length,
    views: graph.views && graph.views.length,
  });
  const records = [
    ...extractRecordsByIds(graph.elements, mutationPayload.touchedElementIds, 'Element', canonicalVersion),
    ...extractRecordsByIds(graph.relationships, mutationPayload.touchedRelationshipIds, 'ArchitectureRelationship', canonicalVersion),
    ...extractRecordsByIds(graph.views, mutationPayload.touchedViewIds, 'View', canonicalVersion),
  ];
  const types = new Set(records.map(record => record.objectType));
  if (!types.has('Element') || !types.has('ArchitectureRelationship') || !types.has('View')) {
    throw safeError('W31_TOUCHED_RECORD_EXTRACTION_INCOMPLETE');
  }
  return Object.freeze(records.map(record => Object.freeze(record)));
}

function extractRecordsByIds(entries, ids, objectType, canonicalVersion) {
  const idField = objectType === 'View' ? 'view_id' : 'id';
  const source = Array.isArray(entries) ? entries : [];
  return unique(ids).map(objectId => {
    const object = source.find(entry => entry && entry[idField] === objectId);
    if (!object) {
      throw safeError('W31_TOUCHED_RECORD_EXTRACTION_INCOMPLETE');
    }
    const contentVersion = fingerprint({
      objectType,
      objectId,
      object,
    });
    return {
      objectType,
      objectId,
      channel: CHANNEL_BY_TYPE[objectType],
      canonicalVersion,
      contentVersion,
      indexVersion: `w31-${contentVersion}`,
      content: object,
    };
  });
}

function requireQualification(qualification) {
  if (!qualification || typeof qualification !== 'object') {
    throw safeError('W31_QWEN_PROFILE_REQUIRED');
  }
  return qualification;
}

function requireConfiguration(configuration) {
  if (!configuration || typeof configuration !== 'object') {
    throw safeError('LIVE_PROVIDER_CONFIGURATION_REQUIRED');
  }
  return configuration.configuration && typeof configuration.configuration === 'object'
    ? configuration.configuration
    : configuration;
}

function createLazyNeo4jBoundary(options) {
  let opened;
  return Object.freeze({
    async open() {
      if (!opened) {
        opened = await createApprovedNeo4jBoundary(options);
      }
      return opened;
    },
    async cleanup(runId) {
      if (!opened) {
        return 0;
      }
      return opened.cleanup(runId);
    },
    async close() {
      if (!opened) {
        return;
      }
      await opened.close();
    },
    async queryVectorEvidence(runId, vector, canonicalIdentities) {
      const boundary = await this.open();
      return boundary.queryVectorEvidence(runId, vector, canonicalIdentities);
    },
  });
}

function adaptNeo4jBoundaryForGate(neo4jBoundary, runId) {
  return Object.freeze({
    async writeEvidence(evidence) {
      const boundary = await neo4jBoundary.open();
      await boundary.writeEvidence(runId, {
        ...evidence,
        runId,
      });
    },
  });
}

function createObservedTransport(fetchImpl) {
  if (typeof fetchImpl !== 'function') {
    throw safeError('LIVE_PROVIDER_HTTP_TRANSPORT_REQUIRED');
  }
  let callCount = 0;
  return Object.freeze({
    async request(url, options) {
      callCount += 1;
      return fetchImpl(url, options);
    },
    observation() {
      return Object.freeze({ callCount });
    },
  });
}

async function generateVectorEvidenceForRecords({ touchedRecords, gate, qualification }) {
  const vectorEvidence = [];
  for (const record of touchedRecords) {
    const result = await gate.executeApprovedEmbedding({
      input: buildEmbeddingInput(record),
      qualification,
      canonicalIdentity: record.objectId,
      canonicalVersion: record.canonicalVersion,
      contentIdentity: `${record.objectType}:${record.objectId}`,
      contentVersion: record.contentVersion,
      indexIdentity: `${record.objectType}:${record.objectId}:semantic-vector`,
      indexVersion: record.indexVersion,
    });
    vectorEvidence.push(Object.freeze({
      objectType: record.objectType,
      objectId: record.objectId,
      channel: record.channel,
      canonicalVersion: result.evidence.canonicalVersion,
      contentVersion: result.evidence.contentVersion,
      indexVersion: result.evidence.indexVersion,
      provider: result.evidence.provider,
      model: result.evidence.model,
      modelVersion: result.evidence.qualificationVersion,
      dimensions: result.evidence.dimensions,
      vector: result.vector,
    }));
  }
  return vectorEvidence;
}

async function queryEveryTouchedVector({ neo4jBoundary, runId, vectorEvidence }) {
  const returned = new Set();
  const identities = vectorEvidence.map(record => record.objectId);
  for (const record of vectorEvidence) {
    const rows = await neo4jBoundary.queryVectorEvidence(runId, record.vector, identities);
    for (const row of rows || []) {
      if (row && typeof row.canonicalIdentity === 'string') {
        returned.add(row.canonicalIdentity);
      }
    }
  }
  return Array.from(returned);
}

async function buildFailureMatrix({ touchedRecords, qualification, configuration, semanticQueryProbe }) {
  return Object.freeze([
    await runFailureProbe({
      name: 'provider-failure',
      alignmentState: 'Failed',
      touchedRecords,
      qualification,
      configuration,
      semanticQueryProbe,
      transport: createFailingTransport('LIVE_PROVIDER_REQUEST_FAILED'),
      indexBoundary: createRecordingIndexBoundary(),
      queryBoundary: createQueryBoundary(),
    }),
    await runFailureProbe({
      name: 'persistence-failure',
      alignmentState: 'Failed',
      touchedRecords,
      qualification,
      configuration,
      semanticQueryProbe,
      transport: createSyntheticVectorTransport(),
      indexBoundary: createFailingIndexBoundary(),
      queryBoundary: createQueryBoundary(),
    }),
    await runFailureProbe({
      name: 'vector-query-verification-failure',
      alignmentState: 'Stale',
      touchedRecords,
      qualification,
      configuration,
      semanticQueryProbe,
      transport: createSyntheticVectorTransport(),
      indexBoundary: createRecordingIndexBoundary(),
      queryBoundary: createQueryBoundary({ omitMatches: true }),
    }),
  ]);
}

async function runFailureProbe(options) {
  const gate = createLiveEmbeddingIndexGate({
    configuration: options.configuration,
    transport: options.transport,
    indexBoundary: options.indexBoundary,
  });
  try {
    const vectorEvidence = await generateVectorEvidenceForRecords({
      touchedRecords: options.touchedRecords,
      gate,
      qualification: options.qualification,
    });
    const returnedTouchedRecordIds = await queryEveryTouchedVector({
      neo4jBoundary: options.queryBoundary,
      runId: 'failure-probe',
      vectorEvidence,
    });
    const allQueryable = options.touchedRecords.every(record => returnedTouchedRecordIds.includes(record.objectId));
    if (!allQueryable) {
      throw safeError('W31_NEO4J_VECTOR_QUERY_NOT_QUERYABLE');
    }
    throw safeError('W31_FAILURE_PROBE_UNEXPECTED_ALIGNMENT');
  } catch (error) {
    return freezeFailure({
      name: options.name,
      alignmentState: options.alignmentState,
      error,
      semanticQueryProbe: options.semanticQueryProbe,
    });
  }
}

function buildFailureOutcome(options) {
  return Object.freeze({
    mutation: Object.freeze({
      applied: true,
      architecturePath: options.architecturePath,
      marker: options.mutation.marker,
    }),
    touchedRecords: options.touchedRecords,
    provider: Object.freeze({
      profile: Object.freeze({
        provider: options.qualification.provider,
        model: options.qualification.model,
        version: options.qualification.version,
        dimensions: options.qualification.dimensions,
      }),
      offlineEvidenceAccepted: false,
      realRequestCount: options.transport.observation().callCount,
    }),
    vectorEvidence: [],
    vectorQuery: Object.freeze({
      returnedTouchedRecordIds: [],
    }),
    alignmentState: failureAlignmentState(options.error),
    failureMatrix: Object.freeze([
      freezeFailure({
        name: failureName(options.error),
        alignmentState: failureAlignmentState(options.error),
        error: options.error,
        semanticQueryProbe: options.semanticQueryProbe,
      }),
    ]),
    pureSemanticQueryRejected: true,
    semanticQueryRejection: buildSemanticQueryRejection(options.semanticQueryProbe, failureAlignmentState(options.error)),
    secretLeaks: [],
  });
}

function freezeFailure({ name, alignmentState, error, semanticQueryProbe }) {
  return Object.freeze({
    name,
    alignmentState,
    category: error && error.category ? error.category : 'W31_MUTATION_VECTOR_LIFECYCLE_FAILED',
    pureSemanticQueryRejected: true,
    semanticQueryRejection: buildSemanticQueryRejection(semanticQueryProbe, alignmentState),
    offlineEvidenceAccepted: false,
  });
}

function createFailingTransport(category) {
  let callCount = 0;
  return Object.freeze({
    async request() {
      callCount += 1;
      throw safeError(category);
    },
    observation() {
      return Object.freeze({ callCount });
    },
  });
}

function createSyntheticVectorTransport() {
  let callCount = 0;
  return Object.freeze({
    async request() {
      callCount += 1;
      return Object.freeze({
        ok: true,
        async json() {
          return {
            data: [
              {
                embedding: Array.from({ length: 1024 }, (_, index) => index / 2048),
              },
            ],
          };
        },
      });
    },
    observation() {
      return Object.freeze({ callCount });
    },
  });
}

function createRecordingIndexBoundary() {
  const evidence = [];
  return Object.freeze({
    async writeEvidence(record) {
      evidence.push(record);
    },
    evidence() {
      return [...evidence];
    },
  });
}

function createFailingIndexBoundary() {
  return Object.freeze({
    async writeEvidence() {
      throw safeError('LIVE_PROVIDER_INDEX_WRITE_PROHIBITED');
    },
  });
}

function createQueryBoundary(options = {}) {
  return Object.freeze({
    async queryVectorEvidence(runId, vector, canonicalIdentities) {
      if (options.omitMatches) {
        return [];
      }
      return canonicalIdentities.map(canonicalIdentity => Object.freeze({ canonicalIdentity }));
    },
  });
}

function failureAlignmentState(error) {
  const category = error && error.category;
  return category === 'W31_NEO4J_VECTOR_QUERY_NOT_QUERYABLE' ? 'Stale' : 'Failed';
}

function failureName(error) {
  const category = error && error.category;
  if (category === 'W31_NEO4J_VECTOR_QUERY_NOT_QUERYABLE') {
    return 'vector-query-verification-failure';
  }
  if (category === 'LIVE_PROVIDER_INDEX_WRITE_PROHIBITED') {
    return 'persistence-failure';
  }
  return 'provider-failure';
}

function buildSemanticQueryRejection(semanticQueryProbe, alignmentState) {
  const request = semanticQueryProbe && semanticQueryProbe.pureSemanticRequest;
  return Object.freeze({
    request: request && typeof request === 'object' ? Object.freeze({ ...request }) : null,
    status: 'rejected',
    alignmentState,
    category: 'SEMANTIC_INDEX_NOT_ALIGNED',
    fullSnapshotFallback: false,
  });
}

function buildEmbeddingInput(record) {
  return JSON.stringify({
    objectType: record.objectType,
    objectId: record.objectId,
    channel: record.channel,
    canonicalVersion: record.canonicalVersion,
    contentVersion: record.contentVersion,
    content: record.content,
  });
}

function unique(values) {
  return Array.from(new Set(Array.isArray(values) ? values.filter(value => typeof value === 'string' && value) : []));
}

function normalizeRelativePath(value) {
  return String(value).replace(/\\/g, '/').replace(/^\/+/, '');
}

function fingerprint(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function withCategory(error, category) {
  if (error && typeof error === 'object') {
    error.category = category;
    return error;
  }
  return safeError(category);
}

function safeError(category) {
  const error = new Error(category);
  error.category = category;
  return error;
}

module.exports = {
  createMutationEmbeddingVectorLifecycle,
  createPersistentMutationEmbeddingLifecycle,
  withPersistentMutationEmbeddingLifecycleTestComposition,
};

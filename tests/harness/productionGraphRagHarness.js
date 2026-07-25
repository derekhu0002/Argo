const assert = require('node:assert');
const crypto = require('node:crypto');
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

function phase1BusinessBenchmarkFixture() {
  const purposes = [
    'intent-decision',
    'implementation-design',
    'coding-repair',
    'audit',
    'graph-tidy',
  ];
  return {
    benchmarkId: 'w7-phase1-five-purpose-business-benchmark',
    purposes: purposes.map((purpose, index) => ({
      purpose,
      mandatoryKeySeedIds: [`${purpose}-key-seed`],
      expectedClosureIds: [`${purpose}-closure`],
      unrelatedQueryId: `${purpose}-unrelated-control`,
      minimumPrecisionEvidenceName: `precision.${purpose}`,
      ordinal: index + 1,
    })),
  };
}

function createNativeRetrievalProbe() {
  const requests = [];
  const sentinel = crypto.randomUUID();
  const expectedResult = {
    retrievalPlatform: `neo4j-native-${sentinel}`,
    canonicalVersion: `canonical-${sentinel}`,
    seeds: [
      {
        objectType: 'Element',
        id: `element-${sentinel}`,
        score: Number(`0.${sentinel.replace(/\D/g, '').slice(0, 6) || '731'}`),
      },
      {
        objectType: 'View',
        id: `view-${sentinel}`,
        membershipEvidence: [`member-${sentinel}`],
      },
    ],
    providerEvidence: {
      sentinel,
      generatedAt: new Date().toISOString(),
    },
  };
  const queryBoundary = {
    async query(request) {
      requests.push(request);
      return expectedResult;
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
    expectedResult() {
      return expectedResult;
    },
    sentinel,
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
    expectedResult: probe.expectedResult(),
    sentinel: probe.sentinel,
  };
}

function inspectCredentialSourceBoundary() {
  const sourcePaths = [
    '.argo/scripts/neo4j-system-architecture-store.js',
    ...listGraphRagJavaScriptPaths(),
  ];
  const hardcodedDefaults = [];
  const cypherCredentialLeaks = [];
  const fallbackCredentials = [];
  for (const relativePath of sourcePaths) {
    const source = fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
    const result = inspectCredentialSourceText(source);
    if (result.hardcodedCredentialLiterals.length > 0) {
      hardcodedDefaults.push(relativePath);
    }
    if (result.fallbackCredentialExpressions.length > 0) {
      fallbackCredentials.push(relativePath);
    }
    if (result.cypherCredentialTransports.length > 0) {
      cypherCredentialLeaks.push(relativePath);
    }
  }
  return { hardcodedDefaults, fallbackCredentials, cypherCredentialLeaks };
}

function inspectCredentialSourceText(source) {
  const credentialName = String.raw`(?:neo4jUri|neo4jUsername|neo4jPassword|embeddingCredential|embeddingApiKey|apiKey|providerCredential)`;
  const credentialReference = String.raw`(?:[A-Za-z_$][\w$]*\s*\.\s*)?${credentialName}`;
  const hardcodedCredentialLiterals = collectMatches(source, new RegExp(
    String.raw`(?:DEFAULT_[A-Z0-9_]*(?:URI|USERNAME|PASSWORD|CREDENTIAL|API_KEY)|${credentialName})\s*(?::|=)\s*(['"\x60])(?:\\.|(?!\1)[\s\S])+\1`,
    'gi',
  ));
  const fallbackCredentialExpressions = [
    ...collectMatches(source, new RegExp(`${credentialReference}\\s*(?:\\|\\||\\?\\?)`, 'gi')),
    ...collectMatches(source, new RegExp(`${credentialReference}\\s*\\?[^:;]+:`, 'gi')),
  ];

  const taintedIdentifiers = findCredentialTaintedIdentifiers(source, credentialName);
  const cypherCredentialTransports = [];
  for (const call of extractRunCalls(source)) {
    const transportsCredential = new RegExp(credentialName, 'i').test(call.arguments)
      || [...taintedIdentifiers].some(identifier => new RegExp(`\\b${escapeRegex(identifier)}\\b`).test(call.arguments));
    if (transportsCredential) {
      cypherCredentialTransports.push(call.text);
    }
  }
  for (const call of extractNamedCalls(source, /ai\.text\.embed(?:Batch)?/gi)) {
    if (new RegExp(credentialName, 'i').test(call.arguments)
      || [...taintedIdentifiers].some(identifier => new RegExp(`\\b${escapeRegex(identifier)}\\b`).test(call.arguments))) {
      cypherCredentialTransports.push(call.text);
    }
  }

  return {
    hardcodedCredentialLiterals,
    fallbackCredentialExpressions,
    cypherCredentialTransports,
  };
}

async function evaluateSevenWaveDelivery(completedWaves) {
  const request = Array.isArray(completedWaves)
    ? { completedWaves }
    : { ...(completedWaves || {}) };
  const runtime = createRuntime({
    configuration: externalProductionConfiguration(),
    embeddingQualification: approvedEmbeddingQualification(),
    canonicalGraph: canonicalGraphFixture(),
    neo4jRetrievalBoundary: alignedNativeRetrievalBoundary(),
  });
  if (typeof runtime.evaluateDeliverySequence !== 'function') {
    return blockedOutcome('TS08_DELIVERY_SEQUENCE_BOUNDARY_MISSING');
  }
  return captureBusinessOutcome(() => runtime.evaluateDeliverySequence(request));
}

async function evaluatePhase1QualityBenchmark(request = {}) {
  const runtime = createRuntime({
    configuration: externalProductionConfiguration(),
    embeddingQualification: approvedEmbeddingQualification(),
    canonicalGraph: canonicalGraphFixture(),
    neo4jRetrievalBoundary: alignedNativeRetrievalBoundary(),
    seedCorpus: request.seedCorpus,
  });
  if (typeof runtime.evaluatePhase1QualityBenchmark !== 'function') {
    return blockedOutcome('DT18_PHASE1_QUALITY_BENCHMARK_BOUNDARY_MISSING');
  }
  return captureBusinessOutcome(() => runtime.evaluatePhase1QualityBenchmark({
    benchmark: request.benchmark || phase1BusinessBenchmarkFixture(),
    prerequisiteEvidence: request.prerequisiteEvidence || acceptedWaveEvidence(),
  }));
}

function acceptedWaveEvidence() {
  return {
    W2: 'accepted',
    W3: 'accepted',
    W4: 'accepted',
    W5: 'accepted',
    W6: 'accepted',
  };
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

function findCredentialTaintedIdentifiers(source, credentialName) {
  const declarations = [...source.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([\s\S]*?);/g)]
    .map(match => ({ identifier: match[1], expression: match[2] }));
  const tainted = new Set();
  let changed = true;
  while (changed) {
    changed = false;
    for (const declaration of declarations) {
      if (tainted.has(declaration.identifier)) {
        continue;
      }
      const referencesCredential = new RegExp(credentialName, 'i').test(declaration.expression);
      const referencesTainted = [...tainted]
        .some(identifier => new RegExp(`\\b${escapeRegex(identifier)}\\b`).test(declaration.expression));
      if (referencesCredential || referencesTainted) {
        tainted.add(declaration.identifier);
        changed = true;
      }
    }
  }
  return tainted;
}

function extractRunCalls(source) {
  return extractNamedCalls(source, /(?:session|tx|transaction|runner|executor)\s*\.\s*run/gi);
}

function extractNamedCalls(source, namePattern) {
  const calls = [];
  for (const match of source.matchAll(namePattern)) {
    let cursor = match.index + match[0].length;
    while (/\s/.test(source[cursor] || '')) {
      cursor += 1;
    }
    if (source[cursor] !== '(') {
      continue;
    }
    const end = findClosingParenthesis(source, cursor);
    if (end > cursor) {
      calls.push({
        arguments: source.slice(cursor + 1, end),
        text: source.slice(match.index, end + 1),
      });
    }
  }
  return calls;
}

function findClosingParenthesis(source, openingIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = openingIndex; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }
    if (character === '\'' || character === '"' || character === '`') {
      quote = character;
    } else if (character === '(') {
      depth += 1;
    } else if (character === ')') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }
  return -1;
}

function collectMatches(source, pattern) {
  return [...source.matchAll(pattern)].map(match => match[0]);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

function blockedOutcome(category, extra = {}) {
  return {
    status: 'blocked',
    error: {
      category,
      ...extra,
    },
  };
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
  evaluatePhase1QualityBenchmark,
  evaluateSevenWaveDelivery,
  externalProductionConfiguration,
  inspectCredentialSourceBoundary,
  inspectCredentialSourceText,
  phase1BusinessBenchmarkFixture,
  queryWithConflictingProjection,
  runEmbeddingProviderLifecycle,
  runNativeRetrievalRequest,
  runProductionSemanticQuery,
};

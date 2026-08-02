const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const graph = readJson('design/KG/SystemArchitecture.json');
const testContract = read('tests/ARCHITECTURE.md');
const harnessPath = 'tests/harness/liveEmbeddingProviderHarness.js';
const liveEntryPath = 'tests/explicit/entries/runLiveEmbeddingProviderE2E.js';
const secretEntryPath = 'tests/explicit/entries/runLiveEmbeddingProviderSecretIsolation.js';
const w31EntryPath = 'tests/explicit/entries/runApplyMutationEmbeddingVectorE2E.js';
const harness = read(harnessPath);
const liveConfig = read('.argo/scripts/graph-rag/liveEmbeddingProviderConfig.js');
const liveEntry = read(liveEntryPath);
const secretEntry = read(secretEntryPath);
const w31Entry = read(w31EntryPath);

// GIVEN default/offline execution
// WHEN the Harness is inspected
// THEN opt-in blocks before loading production boundaries, touching secret state, or opening Neo4j
const optInCheck = harness.indexOf("resolveApprovedLiveConfiguration({ requiredOptIns: [LIVE_OPT_IN] })");
const w31OptInCheck = harness.indexOf("resolveApprovedLiveConfiguration({ requiredOptIns: [LIVE_OPT_IN, W31_LIVE_OPT_IN] })");
const secretPresenceCheck = optInCheck;
const boundaryLoad = harness.indexOf('const createGate = loadLiveGateFactory()');
const transportCreation = harness.indexOf('const transport = createObservedHttpTransport(global.fetch)');
const neo4jOpen = harness.indexOf("require('neo4j-driver')");
assert(optInCheck >= 0, 'LIVE_PROVIDER_OPT_IN_GUARD: live opt-in category is missing');
assert(w31OptInCheck >= 0, 'LIVE_PROVIDER_OPT_IN_GUARD: W3.1 opt-in category is missing');
assert(secretPresenceCheck === optInCheck, 'LIVE_PROVIDER_OPT_IN_GUARD: opt-in must be part of secret preflight');
assert(boundaryLoad > secretPresenceCheck, 'LIVE_PROVIDER_OPT_IN_GUARD: production boundary loads before secret preflight');
assert(transportCreation > secretPresenceCheck, 'LIVE_PROVIDER_OPT_IN_GUARD: transport constructs before secret preflight');
assert(neo4jOpen > secretPresenceCheck, 'LIVE_PROVIDER_OPT_IN_GUARD: Neo4j opens before secret preflight');
assert(
  harness.includes("resolveApprovedLiveConfiguration({ requiredOptIns: [LIVE_OPT_IN] })"),
  'LIVE_PROVIDER_OPT_IN_GUARD: live opt-in must be resolved from approved configuration',
);
assert(
  harness.includes("resolveApprovedLiveConfiguration({ requiredOptIns: [LIVE_OPT_IN, W31_LIVE_OPT_IN] })")
    && liveConfig.includes('W31_MUTATION_VECTOR_E2E_OPT_IN_REQUIRED'),
  'LIVE_PROVIDER_OPT_IN_GUARD: W3.1 mutation-vector opt-in must be resolved from approved configuration',
);

// THEN fake/default outcomes cannot satisfy live evidence
for (const requiredAssertion of [
  'TS06_PROVIDER_E2E_REAL_HTTP_CALL_COUNT',
  'TS06_PROVIDER_E2E_EXPLICIT_REQUEST_REQUIRED',
  'TS06_PROVIDER_E2E_TRANSPORT_RESPONSE_NOT_PROPAGATED',
  'TS06_PROVIDER_E2E_VECTOR_REQUIRED',
  'TS06_PROVIDER_E2E_DIMENSION_MISMATCH',
  'TS06_PROVIDER_E2E_NON_FINITE_VECTOR',
  'TS06_PROVIDER_E2E_SUCCESS_WRITE_REQUIRED',
  'TS06_PROVIDER_E2E_PERSISTED_METADATA_MISMATCH',
  'TS06_PROVIDER_E2E_ZERO_WRITE_VIOLATION',
]) {
  assert(liveEntry.includes(requiredAssertion), `LIVE_PROVIDER_OPT_IN_GUARD: live entry omits ${requiredAssertion}`);
}
assert(
  secretEntry.includes('TS07_PROVIDER_SECRET_TRANSPORT_OBSERVATION_REQUIRED'),
  'LIVE_PROVIDER_OPT_IN_GUARD: secret entry can accept fake live evidence',
);
for (const source of [harness, liveEntry, secretEntry, w31Entry]) {
  assert(!/\bskip(?:ped)?\b/i.test(source), 'LIVE_PROVIDER_OPT_IN_GUARD: live evidence may be skipped');
  assert(!source.includes("status: 'passed'"), 'LIVE_PROVIDER_OPT_IN_GUARD: offline path fabricates pass status');
  assert(!source.includes('liveProviderCall'), 'LIVE_PROVIDER_OPT_IN_GUARD: production boolean can claim live evidence');
  assert(!source.includes('executeFailureScenario'), 'LIVE_PROVIDER_OPT_IN_GUARD: scenario-labelled production branch remains');
}
for (const requiredAssertion of [
  'W31_SINGLE_MUTATION_TOOL_CALL_REQUIRED',
  'W31_HARNESS_LIFECYCLE_CREATION_FORBIDDEN',
  'W31_EXPECTED_TOUCHED_RECORDS_SUBSTITUTION_FORBIDDEN',
  'W31_EMBEDDING_LIFECYCLE_RESPONSE_REQUIRED',
  'W31_ALIGNMENT_RESPONSE_REQUIRED',
  'W31_ACTUAL_TOUCHED_IDS_NOT_USED',
  'W31_OFFLINE_FAKE_EVIDENCE_PROHIBITED',
  'W31_REAL_QWEN_ADAPTER_CALL_REQUIRED',
  'W31_NEO4J_VECTOR_QUERY_NOT_QUERYABLE',
  'W31_FAILURE_MUST_NOT_ALIGN',
  'W31_UNALIGNED_QUERY_NOT_REJECTED',
]) {
  assert(w31Entry.includes(requiredAssertion), `LIVE_PROVIDER_OPT_IN_GUARD: W3.1 entry omits ${requiredAssertion}`);
}
for (const requiredObservation of [
  'createObservedHttpTransport',
  'callCount',
  'origin',
  'path',
  'model',
  'dimensions',
  'vectorFingerprint',
]) {
  assert(harness.includes(requiredObservation), `LIVE_PROVIDER_OPT_IN_GUARD: transport omits ${requiredObservation}`);
}
for (const prohibitedHarnessPattern of [
  'loadMutationVectorLifecycleFactory',
  'createMutationEmbeddingVectorLifecycle',
  'lifecycle.execute',
  'expectedTouchedRecords:',
  'expectedTouchedRecords,',
  'mutation.expectedTouchedRecords',
]) {
  assert(
    !harness.includes(prohibitedHarnessPattern),
    `LIVE_PROVIDER_OPT_IN_GUARD: Harness manually drives W3.1 lifecycle via ${prohibitedHarnessPattern}`,
  );
}
for (const requiredMutationResponseEvidence of [
  'embeddingLifecycle',
  'alignment',
  'touchedElementIds',
  'touchedRelationshipIds',
  'touchedViewIds',
]) {
  assert(
    harness.includes(requiredMutationResponseEvidence),
    `LIVE_PROVIDER_OPT_IN_GUARD: W3.1 Harness omits mutation response evidence ${requiredMutationResponseEvidence}`,
  );
}

// THEN default failure categories remain executable in their persistently mounted entries
for (const [testcaseName, failureReason, entryPath] of [
  ['ExplicitAcceptanceTestcase-TS-06-Provider-E2E', 'LIVE_PROVIDER_E2E_OPT_IN_REQUIRED', liveEntryPath],
  [
    'ExplicitAcceptanceTestcase-TS-07-Provider-Secret-Isolation',
    'LIVE_PROVIDER_E2E_OPT_IN_REQUIRED',
    secretEntryPath,
  ],
  [
    'ExplicitAcceptanceTestcase-W3-1-MutationEmbeddingVectorE2E',
    'W31_MUTATION_VECTOR_E2E_OPT_IN_REQUIRED',
    w31EntryPath,
  ],
]) {
  const mounted = (graph.elements || [])
    .flatMap(element => element.testcases || [])
    .find(testcase => testcase.name === testcaseName);
  const source = read(entryPath);
  assert(mounted, `LIVE_PROVIDER_OPT_IN_GUARD: graph omits ${testcaseName}`);
  assert.strictEqual(
    mounted.acceptanceCriteria,
    entryPath,
    `LIVE_PROVIDER_OPT_IN_GUARD: mounted entry drifted for ${testcaseName}`,
  );
  assert(
    `${source}\n${harness}\n${liveConfig}`.includes(failureReason),
    `LIVE_PROVIDER_OPT_IN_GUARD: executable failure category drifted for ${testcaseName}`,
  );
  assert(
    testContract.includes(entryPath),
    `LIVE_PROVIDER_OPT_IN_GUARD: ${entryPath} lacks persistent test contract evidence`,
  );
}
assert(
  testContract.includes(harnessPath),
  'LIVE_PROVIDER_OPT_IN_GUARD: live Harness lacks persistent test contract evidence',
);

const secretGuard = read('tests/architecture/production-graph-rag/live-provider-secret-isolation.guard.js');
for (const requiredPreflight of [
  'process-only',
  'file-only',
  'matching-dual',
  'SECRET_SOURCE_CONFLICT',
  'SECRET_FILE_ACL_UNVERIFIABLE',
  'runApprovedSourceFixtureMatrix',
]) {
  assert(
    `${secretGuard}\n${harness}`.includes(requiredPreflight),
    `LIVE_PROVIDER_OPT_IN_GUARD: preflight omits ${requiredPreflight}`,
  );
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const graph = readJson('design/KG/SystemArchitecture.json');
const failureRecords = readJson('design/KG/test-failure-records.json');
const handoff = readJson('.argo/temp/ImplementationToCodingHandoff.json');
const rootContract = read('OVERALL_ARCHITECTURE.md');
const localContract = read('.argo/scripts/graph-rag/ARCHITECTURE.md');
const testContract = read('tests/ARCHITECTURE.md');
const envExample = read('.argo/.env.example');
const gitignore = read('.gitignore');
const approvedProfile = [
  'alibaba-cloud-model-studio-openai-compatible-cn-beijing',
  'https://llm-clids9mqc5o1mbvb.cn-beijing.maas.aliyuncs.com/compatible-mode/v1',
  'qwen3.7-text-embedding',
  'qualification-2026-07-25',
  '1024',
];
const requiredEnvironmentNames = [
  'ARGO_EMBEDDING_BASE_URL',
  'ARGO_EMBEDDING_MODEL',
  'ARGO_EMBEDDING_PROVIDER',
  'ARGO_EMBEDDING_MODEL_VERSION',
  'ARGO_EMBEDDING_DIMENSIONS',
  'ARGO_NEO4J_DATABASE_URL',
  'ARGO_NEO4J_DATABASE_USERNAME',
  'ARGO_NEO4J_DATABASE_PASSWORD',
  'QWEN_KEY',
];
const mountedEntries = new Map([
  ['ExplicitAcceptanceTestcase-TS-06-Provider-E2E', 'tests/explicit/entries/runLiveEmbeddingProviderE2E.js'],
  ['ExplicitAcceptanceTestcase-TS-07-Provider-Secret-Isolation', 'tests/explicit/entries/runLiveEmbeddingProviderSecretIsolation.js'],
  ['ExplicitAcceptanceTestcase-W3-1-MutationEmbeddingVectorE2E', 'tests/explicit/entries/runApplyMutationEmbeddingVectorE2E.js'],
]);
const handoffScopeText = JSON.stringify({
  summary: handoff.summary,
  explicitEntrypoints: handoff.explicitEntrypoints,
  codingTargets: handoff.codingTargets,
  taskExecutionPlan: handoff.taskExecutionPlan,
});
const inScopeLiveTestcases = new Set(
  [...mountedEntries.keys()].filter(testcaseName => handoffScopeText.includes(testcaseName)),
);
const isW31Handoff = inScopeLiveTestcases.has('ExplicitAcceptanceTestcase-W3-1-MutationEmbeddingVectorE2E');

// GIVEN the approved live-provider profile
// WHEN implementation and test contracts are inspected
// THEN every identity field, explicit dimension, opt-in boundary, and controlled Neo4j boundary is fixed
for (const value of approvedProfile) {
  assert(rootContract.includes(value), `LIVE_PROVIDER_CONTRACT_GUARD: root contract omits ${value}`);
  assert(localContract.includes(value), `LIVE_PROVIDER_CONTRACT_GUARD: local contract omits ${value}`);
}
for (const requiredText of [
  'explicit opt-in',
  'controlled Neo4j',
  'finite',
  'zero index writes',
  'QWEN_KEY',
  'embeddingLifecycle',
  'alignment',
  'Harness-created lifecycle execution',
]) {
  assert(
    localContract.toLowerCase().includes(requiredText.toLowerCase()),
    `LIVE_PROVIDER_CONTRACT_GUARD: local contract omits ${requiredText}`,
  );
}
assert(
  testContract.toLowerCase().includes('default/offline ci')
    && testContract.toLowerCase().includes('never substitutes'),
  'LIVE_PROVIDER_CONTRACT_GUARD: fake evidence substitution remains possible',
);
assert(!localContract.includes('executeFailureScenario'), 'LIVE_PROVIDER_CONTRACT_GUARD: scenario test API remains');
assert(
  rootContract.includes('Harness observes the actual request target/body/count and raw response'),
  'LIVE_PROVIDER_CONTRACT_GUARD: transport-owned HTTP evidence is missing',
);
assert(
  rootContract.includes('one successful `applySystemArchitectureMutation` write call automatically invokes the embedding lifecycle')
    && rootContract.includes('expected-touched-record substitution'),
  'LIVE_PROVIDER_CONTRACT_GUARD: automatic mutation-triggered W3.1 boundary is missing',
);

// THEN the canonical example contains approved empty placeholders only
for (const name of requiredEnvironmentNames) {
  assert(
    new RegExp(`^${name}=\\s*$`, 'm').test(envExample),
    `LIVE_PROVIDER_CONTRACT_GUARD: .argo/.env.example placeholder drifted ${name}`,
  );
}
assert(gitignore.split(/\r?\n/).includes('.env'), 'LIVE_PROVIDER_CONTRACT_GUARD: .env is not ignored');
assert(gitignore.split(/\r?\n/).includes('.env.*'), 'LIVE_PROVIDER_CONTRACT_GUARD: .env variants are not ignored');
assert(gitignore.split(/\r?\n/).includes('!.argo/.env.example'), 'LIVE_PROVIDER_CONTRACT_GUARD: canonical example is not committable');

// THEN intent-mounted testcases map to physical entries; current scope uses the handoff,
// while accepted historical scope remains bound to the persistent test contract
for (const [testcaseName, entryPath] of mountedEntries) {
  const mounted = graph.elements
    .flatMap(element => element.testcases || [])
    .find(testcase => testcase.name === testcaseName);
  assert(mounted, `LIVE_PROVIDER_CONTRACT_GUARD: ${testcaseName} is not mounted`);
  assert.strictEqual(
    mounted.acceptanceCriteria,
    entryPath,
    `LIVE_PROVIDER_CONTRACT_GUARD: ${testcaseName} mounted path drifted`,
  );
  if (inScopeLiveTestcases.has(testcaseName)) {
    assert(
      handoff.explicitEntrypoints.some(entry => (
        entry.testcaseName === testcaseName && entry.entryPath === entryPath
      )),
      `LIVE_PROVIDER_CONTRACT_GUARD: handoff omits ${testcaseName}`,
    );
    assert(
      handoff.frozenFiles.includes(entryPath),
      `LIVE_PROVIDER_CONTRACT_GUARD: current-scope ${entryPath} is not frozen`,
    );
  } else {
    assert(
      testContract.includes(entryPath),
      `LIVE_PROVIDER_CONTRACT_GUARD: accepted ${entryPath} lacks persistent test contract evidence`,
    );
  }
}

// THEN runner-owned expected live failures are recorded without adding schema-invalid handoff fields
const expectedLiveFailures = {
  'ExplicitAcceptanceTestcase-TS-06-Provider-E2E': 'LIVE_PROVIDER_E2E_OPT_IN_REQUIRED',
  'ExplicitAcceptanceTestcase-TS-07-Provider-Secret-Isolation': 'LIVE_PROVIDER_SECRET_ISOLATION_OPT_IN_REQUIRED',
};
if (isW31Handoff) {
  expectedLiveFailures['ExplicitAcceptanceTestcase-W3-1-MutationEmbeddingVectorE2E'] = 'W31_MUTATION_VECTOR_E2E_OPT_IN_REQUIRED';
  assert(
    (handoff.summary || '').includes('pre-coding baseline')
      || (handoff.openGaps || []).some(gap => gap.includes('pre-coding baseline')),
    'LIVE_PROVIDER_CONTRACT_GUARD: W3.1 baseline evidence is not described in schema-valid fields',
  );
}
for (const [testcaseName, category] of Object.entries(expectedLiveFailures)) {
  if (!inScopeLiveTestcases.has(testcaseName) && !isW31Handoff) {
    continue;
  }
  const explicitEntrypoint = (handoff.explicitEntrypoints || [])
    .find(entry => entry.testcaseName === testcaseName);
  if (explicitEntrypoint && explicitEntrypoint.initialExecutionStatus === 'passed') {
    continue;
  }
  const record = failureRecords.find(candidate => candidate.testcasename === testcaseName);
  assert(record, `LIVE_PROVIDER_CONTRACT_GUARD: runner record missing ${testcaseName}`);
  assert(
    String(record.failureError || '').includes(category),
    `LIVE_PROVIDER_CONTRACT_GUARD: stale runner failure ${testcaseName}`,
  );
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

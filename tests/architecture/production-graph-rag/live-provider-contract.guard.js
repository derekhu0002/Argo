const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const graph = readJson('design/KG/SystemArchitecture.json');
const handoff = readJson('.argo/temp/ImplementationToCodingHandoff.json');
const rootContract = read('OVERALL_ARCHITECTURE.md');
const localContract = read('.argo/scripts/graph-rag/ARCHITECTURE.md');
const testContract = read('tests/ARCHITECTURE.md');
const envExample = read('.env.example');
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
];
const mountedEntries = new Map([
  ['ExplicitAcceptanceTestcase-TS-06-Provider-E2E', 'tests/explicit/entries/runLiveEmbeddingProviderE2E.js'],
  ['ExplicitAcceptanceTestcase-TS-07-Provider-Secret-Isolation', 'tests/explicit/entries/runLiveEmbeddingProviderSecretIsolation.js'],
]);

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

// THEN committed .env guidance contains only approved non-sensitive embedding configuration
for (const name of requiredEnvironmentNames) {
  assert(envExample.includes(`${name}=`), `LIVE_PROVIDER_CONTRACT_GUARD: .env.example omits ${name}`);
}
assert(!envExample.includes('QWEN_KEY'), 'LIVE_PROVIDER_CONTRACT_GUARD: .env.example exposes secret key slot');
assert(gitignore.split(/\r?\n/).includes('.env'), 'LIVE_PROVIDER_CONTRACT_GUARD: .env is not ignored');
assert(gitignore.split(/\r?\n/).includes('.env.*'), 'LIVE_PROVIDER_CONTRACT_GUARD: .env variants are not ignored');
assert(gitignore.split(/\r?\n/).includes('!.env.example'), 'LIVE_PROVIDER_CONTRACT_GUARD: .env.example is not committable');

// THEN both intent-mounted testcases map to frozen physical entries in the handoff
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
  assert(
    handoff.explicitEntrypoints.some(entry => (
      entry.testcaseName === testcaseName && entry.entryPath === entryPath
    )),
    `LIVE_PROVIDER_CONTRACT_GUARD: handoff omits ${testcaseName}`,
  );
  assert(handoff.frozenFiles.includes(entryPath), `LIVE_PROVIDER_CONTRACT_GUARD: ${entryPath} is not frozen`);
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

const assert = require('node:assert');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const {
  compactMutationResponse,
} = require(path.join(repoRoot, '.argo', 'scripts', 'systemarchitecture-mcp-server.js'));

async function main() {
  const compact = compactMutationResponse({
    status: 'passed',
    written: true,
    graphPath: 'design/KG/SystemArchitecture.json',
    mutations: [{ type: 'updateElement', id: 'bp-autoalign-goal' }],
    touchedElementIds: ['bp-autoalign-goal'],
    alignment: {
      state: 'Aligned',
      category: 'SEMANTIC_INDEX_ALIGNED',
    },
    businessComplete: true,
    embeddingLifecycle: {
      state: 'Aligned',
      alignmentState: 'Aligned',
      records: [{ canonicalIdentity: 'Element:bp-autoalign-goal', vector: [0.1, 0.2] }],
    },
  });
  assert.deepStrictEqual(
    compact,
    {
      status: 'passed',
      written: true,
      embeddingLifecycle: { state: 'Aligned' },
    },
    'BP_AUTOALIGN_MUTATION_RESPONSE_DEFAULT_NOT_COMPACT',
  );
}

main().catch(error => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const readmePath = path.join(repoRoot, 'README.md');

const requiredAdoptionFragments = [
  'ARGO HARNESS',
  'Total\\ Certainty',
  '意图架构 Data',
  '架构服务 MCP',
  'HARNESS 工程流',
  '一次交付如何运行',
  '快速上手',
  '选择正确入口',
  'design/README.md',
  'design/mcp/',
  'design/validator/',
];

const deepSemanticDetailFragments = [
  'Production Semantic Operator Journey',
  'ARGO_EMBEDDING_BASE_URL',
  'ARGO_NEO4J_DATABASE_URL',
  'QWEN_KEY',
  'semantic:init',
  'semantic:backfill',
  'semantic:readiness',
  'semantic:query',
  'automatic-backfill',
  'startNewProjectSemanticJourney',
  'verifySystemArchitectureSemanticReadiness',
  'neo4jUri is required for start',
];

function main() {
  // GIVEN a first-time adopter uses only the root README as the product entry.
  const readme = fs.readFileSync(readmePath, 'utf8');

  // WHEN Coding reduces root README noise for WP2.
  assertRequiredAdoptionContent(readme);
  assertRoutesDeepReferences(readme);

  // THEN deep semantic operator, credential, command, and lifecycle details stay in design references.
  assertNoInlineDeepSemanticLifecycle(readme);
}

function assertRequiredAdoptionContent(readme) {
  for (const fragment of requiredAdoptionFragments) {
    assert.ok(
      readme.includes(fragment),
      `ROOT_README_ADOPTION_CONTENT_MISSING: expected README.md to retain ${fragment}`,
    );
  }
}

function assertRoutesDeepReferences(readme) {
  const requiredReferenceLinks = [
    /\]\(design\/README\.md\)/,
    /\]\(design\/mcp\/[^)]+\)/,
    /\]\(design\/validator\/[^)]+\)/,
  ];

  for (const linkPattern of requiredReferenceLinks) {
    assert.ok(
      linkPattern.test(readme),
      `ROOT_README_DEEP_REFERENCE_ROUTE_MISSING: expected README.md to link ${linkPattern}`,
    );
  }
}

function assertNoInlineDeepSemanticLifecycle(readme) {
  const inlineDetails = deepSemanticDetailFragments.filter((fragment) => readme.includes(fragment));
  assert.deepStrictEqual(
    inlineDetails,
    [],
    `ROOT_README_INLINE_SEMANTIC_LIFECYCLE_DETAIL: route these details to design/mcp or design/validator instead of keeping them inline in README.md: ${inlineDetails.join(', ')}`,
  );
}

main();

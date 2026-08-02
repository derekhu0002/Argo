const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const designReadmePath = path.join(repoRoot, 'design', 'README.md');

const requiredDesignRoutes = [
  { label: 'overall architecture', pattern: /\]\(architecture\.md\)/ },
  { label: 'harness flow', pattern: /\]\(argo-harness\/README\.md\)/ },
  { label: 'agent and skill design', pattern: /\]\(argo-harness\/agents-and-skills\.md\)/ },
  { label: 'usage scenarios', pattern: /\]\(argo-harness\/usage-scenarios\/README\.md\)/ },
  { label: 'intent architecture', pattern: /\]\(intent-architecture\/README\.md\)/ },
  { label: 'MCP feature list', pattern: /\]\(mcp\/[^)]+\)/ },
  { label: 'validator', pattern: /\]\(validator\/intent-architecture-mcp-validation\.md\)/ },
  { label: 'schema and EA mapping', pattern: /\]\(schema-ea-mapping\.md\)/ },
  { label: 'specific-domain templates', pattern: /\]\(specific-domain\/README\.md\)/ },
  { label: 'marketing comparison', pattern: /\]\(marketing\/solution-comparison-argo-openspec-superpower-ecc\.md\)/ },
  { label: 'research notes boundary', pattern: /\]\(\.\.\/notes\/[^)]+\)/ },
  { label: 'root README product entry', pattern: /\]\(\.\.\/README\.md\)/ },
  { label: 'root CONTRIBUTING governance entry', pattern: /\]\(\.\.\/CONTRIBUTING\.md\)/ },
];

const requiredGovernanceFragments = [
  'design/KG/SystemArchitecture.json',
  '.argo/temp/ImplementationToCodingHandoff.json',
  'tests/ARCHITECTURE.md',
  'fact-source',
  'root README',
  'CONTRIBUTING.md',
  'notes/',
];

const prohibitedDeepDuplicationFragments = [
  'ARGO_NEO4J_DATABASE_URL',
  'QWEN_KEY',
  'semantic:init',
  'semantic:backfill',
  'semantic:readiness',
  'semantic:query',
  'startNewProjectSemanticJourney',
  'verifySystemArchitectureSemanticReadiness',
  'neo4jUri is required for start',
];

function main() {
  // GIVEN design/README.md is the stable design/system map after root README and CONTRIBUTING exist.
  const designReadme = fs.readFileSync(designReadmePath, 'utf8');

  // WHEN Coding calibrates WP4 design navigation.
  assertRoutesAllStableDesignAuthorities(designReadme);
  assertDeclaresFactSourceGovernance(designReadme);

  // THEN design/README.md routes to authority and does not duplicate deep operational content.
  assertNoDeepSpecDuplication(designReadme);
}

function assertRoutesAllStableDesignAuthorities(designReadme) {
  for (const route of requiredDesignRoutes) {
    assert.ok(
      route.pattern.test(designReadme),
      `DESIGN_NAVIGATION_ROUTE_MISSING: design/README.md must link the ${route.label} authority`,
    );
  }
}

function assertDeclaresFactSourceGovernance(designReadme) {
  for (const fragment of requiredGovernanceFragments) {
    assert.ok(
      designReadme.includes(fragment),
      `DESIGN_NAVIGATION_FACT_SOURCE_BOUNDARY_MISSING: design/README.md must mention ${fragment}`,
    );
  }
}

function assertNoDeepSpecDuplication(designReadme) {
  const duplicatedDetails = prohibitedDeepDuplicationFragments.filter((fragment) => designReadme.includes(fragment));
  assert.deepStrictEqual(
    duplicatedDetails,
    [],
    `DESIGN_NAVIGATION_INLINE_DEEP_SPEC: route these details to design/mcp or design/validator instead of duplicating them in design/README.md: ${duplicatedDetails.join(', ')}`,
  );
}

main();

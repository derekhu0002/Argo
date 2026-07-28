const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const graphPath = path.join(repoRoot, 'design', 'KG', 'SystemArchitecture.json');
const decisionTreePath = path.join(
  repoRoot,
  '.argo',
  'history',
  'decision-tree',
  '20260728-121500-readme-docs-dual-entry-task-tidy-current-session.md',
);

const CASES = new Map([
  [
    'doc-01-root-readme-adoption-router',
    {
      testcaseName: 'ExplicitAcceptanceTestcase-DOC-01',
      elementId: 'docsys-root-readme-entry',
      controlPoint: 'first-time external reader opens only README.md',
      run: ({ graph, decisionTree }) => {
        // GIVEN the accepted dual-entry/root-noise decision for external readers
        assertElementContains(graph, 'docsys-root-readme-entry', [
          'positioning',
          'problem',
          'three components',
          'curated deep links',
          'without inline semantic lifecycle internals',
        ]);
        assertDecisionEvidence(decisionTree, ['dual entrypoints', 'root README noise reduction']);

        // THEN the root README element is the adoption router, not the deep authority.
        assertAttributeIncludes(
          graph,
          'docsys-root-readme-entry',
          'contentBoundary',
          'Summarizes and routes',
        );
      },
    },
  ],
  [
    'doc-02-contributor-governance-router',
    {
      testcaseName: 'ExplicitAcceptanceTestcase-DOC-02',
      elementId: 'docsys-contributor-governance-entry',
      controlPoint: 'contributor prepares to change MCP, validator, tests, or docs',
      run: ({ graph }) => {
        // GIVEN the accepted contributor/governance entrypoint requirement
        assertElementContains(graph, 'docsys-contributor-governance-entry', [
          'fact-source priority',
          'allowed edit surfaces',
          'validation commands',
          'test boundaries',
          'documentation maintenance rules',
        ]);

        // THEN the remaining filename choice is explicit residual coordination.
        assertAttributeIncludes(
          graph,
          'docsys-contributor-governance-entry',
          'openPackagingDecision',
          'Root-level CONTRIBUTING.md is recommended',
        );
      },
    },
  ],
  [
    'doc-03-stable-design-reference-routing',
    {
      testcaseName: 'ExplicitAcceptanceTestcase-DOC-03',
      elementId: 'docsys-stable-design-reference',
      controlPoint: 'reader searches from root README for MCP or validator details',
      run: ({ graph }) => {
        // GIVEN stable architecture details belong under design/ references
        assertElementContains(graph, 'docsys-stable-design-reference', [
          'design/',
          'MCP operations',
          'validation',
          'stage handoff',
        ]);
        assertRepoPathExists('design/mcp');
        assertRepoPathExists('design/validator');

        // THEN design/ is the stable reference authority for deep details.
        assertAttributeIncludes(
          graph,
          'docsys-stable-design-reference',
          'authorityScope',
          'linked rather than duplicated in root README',
        );
      },
    },
  ],
  [
    'doc-04-content-boundary-placement',
    {
      testcaseName: 'ExplicitAcceptanceTestcase-DOC-04',
      elementId: 'docsys-content-boundary-requirement',
      controlPoint: 'maintainer adds domain, marketing, research, or stable design content',
      run: ({ graph }) => {
        // GIVEN each documentation layer has one authority role
        assertElementContains(graph, 'docsys-content-boundary-requirement', [
          'Root README summarizes and links',
          'contributor entry governs changes',
          'design owns stable specs',
          'notes own research',
          'domain-specific documentation owns domain extension',
        ]);
        assertRepoPathExists('design/specific-domain');
        assertRepoPathExists('design/marketing');
        assertRepoPathExists('notes');

        // THEN content placement remains an information architecture decision.
        assertAttributeIncludes(
          graph,
          'docsys-content-boundary-requirement',
          'acceptanceObservationPoint',
          'Stable facts appear once as authority',
        );
      },
    },
  ],
]);

function main() {
  const requestedAnchor = process.env.ARGO_TESTCASE_ANCHOR;
  const cases = requestedAnchor ? [[requestedAnchor, requireCase(requestedAnchor)]] : Array.from(CASES.entries());
  const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
  const decisionTree = fs.readFileSync(decisionTreePath, 'utf8');

  for (const [anchor, testcase] of cases) {
    // WHEN the WP1 information architecture decision is verified
    assertMountedEntrypoint(graph, testcase.elementId, testcase.testcaseName, anchor);
    testcase.run({ graph, decisionTree });
  }
}

function requireCase(anchor) {
  const testcase = CASES.get(anchor);
  assert.ok(testcase, `Unknown documentation information architecture anchor: ${anchor}`);
  return testcase;
}

function assertMountedEntrypoint(graph, elementId, testcaseName, anchor) {
  const element = findElement(graph, elementId);
  const testcase = (element.testcases || []).find((candidate) => candidate.name === testcaseName);
  assert.ok(testcase, `${testcaseName} must remain mounted on ${elementId}`);
  assert.strictEqual(
    testcase.acceptanceCriteria,
    `tests/explicit/entries/runDocumentationInformationArchitectureDecision.js#${anchor}`,
    `${testcaseName} must point at the frozen WP1 entrypoint anchor`,
  );
}

function assertElementContains(graph, elementId, expectedFragments) {
  const element = findElement(graph, elementId);
  const searchableText = [
    element.name,
    element.type,
    element.description,
    ...(element.attributes || []).flatMap((attribute) => [attribute.name, attribute.value, attribute.description]),
  ].join('\n');

  for (const fragment of expectedFragments) {
    assert.ok(
      searchableText.includes(fragment),
      `${elementId} must include business evidence fragment: ${fragment}`,
    );
  }
}

function assertAttributeIncludes(graph, elementId, attributeName, expectedFragment) {
  const element = findElement(graph, elementId);
  const attribute = (element.attributes || []).find((candidate) => candidate.name === attributeName);
  assert.ok(attribute, `${elementId} must keep attribute ${attributeName}`);
  assert.ok(
    String(attribute.value || attribute.description || '').includes(expectedFragment),
    `${elementId}.${attributeName} must include: ${expectedFragment}`,
  );
}

function assertDecisionEvidence(decisionTree, expectedFragments) {
  for (const fragment of expectedFragments) {
    assert.ok(decisionTree.includes(fragment), `decision tree must include: ${fragment}`);
  }
}

function assertRepoPathExists(relativePath) {
  assert.ok(fs.existsSync(path.join(repoRoot, relativePath)), `${relativePath} must exist for WP1 routing evidence`);
}

function findElement(graph, elementId) {
  const element = (graph.elements || []).find((candidate) => candidate.id === elementId);
  assert.ok(element, `Expected intent element ${elementId}`);
  return element;
}

main();

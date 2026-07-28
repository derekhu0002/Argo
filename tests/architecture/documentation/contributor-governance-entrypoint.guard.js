const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const contributorGuidePath = path.join(repoRoot, 'CONTRIBUTING.md');

const requiredContentFragments = [
  'fact-source priority',
  'safe change surfaces',
  'stage boundaries',
  'validation commands',
  'explicit testcase',
  'frozen files',
  'documentation maintenance',
  'forbidden shortcuts',
  'design/KG/SystemArchitecture.json',
  '.argo/temp/ImplementationToCodingHandoff.json',
  'package.json',
];

const requiredReferenceLinks = [
  /\]\(design\/README\.md\)/,
  /\]\(design\/argo-harness\/README\.md\)/,
  /\]\(design\/mcp\/[^)]+\)/,
  /\]\(design\/validator\/intent-architecture-mcp-validation\.md\)/,
  /\]\(tests\/ARCHITECTURE\.md\)/,
];

const prohibitedInlineDeepSpecFragments = [
  'Production Semantic Operator Journey',
  'startNewProjectSemanticJourney',
  'verifySystemArchitectureSemanticReadiness',
  'neo4jUri is required for start',
];

const prohibitedRootContractAuthorityFragments = [
  'OVERALL_ARCHITECTURE.md',
];

function main() {
  // GIVEN an internal maintainer prepares to change MCP, validator, tests, or docs.
  assert.ok(
    fs.existsSync(contributorGuidePath),
    'CONTRIBUTOR_ENTRYPOINT_MISSING: create root-level CONTRIBUTING.md for contributor governance',
  );
  const contributorGuide = fs.readFileSync(contributorGuidePath, 'utf8');

  // WHEN Coding implements the WP3 contributor/governance entrypoint.
  assertRequiredContributorGovernance(contributorGuide);
  assertStableReferenceLinks(contributorGuide);

  // THEN the guide routes to authority, exposes safe boundaries, and avoids deep spec duplication.
  assertNoDeepSpecDuplication(contributorGuide);
  assertNoRootContractAuthority(contributorGuide);
}

function assertRequiredContributorGovernance(contributorGuide) {
  for (const fragment of requiredContentFragments) {
    assert.ok(
      contributorGuide.includes(fragment),
      `CONTRIBUTOR_GOVERNANCE_CONTENT_MISSING: CONTRIBUTING.md must include ${fragment}`,
    );
  }
}

function assertStableReferenceLinks(contributorGuide) {
  for (const linkPattern of requiredReferenceLinks) {
    assert.ok(
      linkPattern.test(contributorGuide),
      `CONTRIBUTOR_GOVERNANCE_REFERENCE_MISSING: CONTRIBUTING.md must link ${linkPattern}`,
    );
  }
}

function assertNoDeepSpecDuplication(contributorGuide) {
  const inlineDetails = prohibitedInlineDeepSpecFragments.filter((fragment) => contributorGuide.includes(fragment));
  assert.deepStrictEqual(
    inlineDetails,
    [],
    `CONTRIBUTOR_GOVERNANCE_INLINE_DEEP_SPEC: route these details to design references instead of duplicating them in CONTRIBUTING.md: ${inlineDetails.join(', ')}`,
  );
}

function assertNoRootContractAuthority(contributorGuide) {
  const rootContractMentions = prohibitedRootContractAuthorityFragments.filter((fragment) =>
    contributorGuide.includes(fragment),
  );
  assert.deepStrictEqual(
    rootContractMentions,
    [],
    `CONTRIBUTOR_GOVERNANCE_ROOT_CONTRACT_AUTHORITY: WP3 CONTRIBUTING.md must not reintroduce root OVERALL_ARCHITECTURE.md as an active authority, dependency, or required reference: ${rootContractMentions.join(', ')}`,
  );
}

main();

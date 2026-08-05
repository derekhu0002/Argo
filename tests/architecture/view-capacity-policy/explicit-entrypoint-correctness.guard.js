const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const graph = JSON.parse(read('design/KG/SystemArchitecture.json'));

const expectedEntrypoints = new Map([
  ['ExplicitAcceptanceTestcase-VIEW15-GLOBAL-SCOPE', 'tests/explicit/entries/runView15GlobalScope.js'],
  ['ExplicitAcceptanceTestcase-VIEW15-RELATIONSHIPS', 'tests/explicit/entries/runView15Relationships.js'],
  ['ExplicitAcceptanceTestcase-VIEW15-NO-MIGRATION', 'tests/explicit/entries/runView15NoMigration.js'],
  ['ExplicitAcceptanceTestcase-VIEW15-CONSISTENCY', 'tests/explicit/entries/runView15Consistency.js'],
  ['ExplicitAcceptanceTestcase-VIEW15-BOUNDARY', 'tests/explicit/entries/runView15GlobalScope.js'],
  ['ExplicitAcceptanceTestcase-VIEW15-OVERFLOW', 'tests/explicit/entries/runView15GlobalScope.js'],
  ['ExplicitAcceptanceTestcase-VIEW15-INDIRECT-GROWTH', 'tests/explicit/entries/runView15IndirectGrowth.js'],
]);

for (const [testcaseName, entryPath] of expectedEntrypoints) {
  const testcase = findTestcase(testcaseName);
  assert(testcase, `VIEW15_ENTRYPOINT_TESTCASE_NOT_MOUNTED:${testcaseName}`);
  assert.strictEqual(
    testcase.acceptanceCriteria,
    entryPath,
    `VIEW15_ENTRYPOINT_ACCEPTANCE_CRITERIA_MISMATCH:${testcaseName}`,
  );
  const source = read(entryPath);
  assert(source.includes('// GIVEN'), `VIEW15_ENTRYPOINT_GIVEN_MISSING:${entryPath}`);
  assert(source.includes('// WHEN'), `VIEW15_ENTRYPOINT_WHEN_MISSING:${entryPath}`);
  assert(source.includes('// THEN'), `VIEW15_ENTRYPOINT_THEN_MISSING:${entryPath}`);
  assert(
    source.includes('viewCapacityPolicyHarness.js'),
    `VIEW15_ENTRYPOINT_HARNESS_NOT_USED:${entryPath}`,
  );
}

const harness = read('tests/harness/viewCapacityPolicyHarness.js');
for (const methodName of [
  'observeGlobalViewCapacityBoundary',
  'observeRelationshipCountingBoundary',
  'observeProspectiveCapacityStability',
  'observeActiveAuthorityConsistency',
  'observeDirectMembershipGrowth',
  'observeIndirectEndpointMembershipGrowth',
  'globalViewpointScenarios',
  'writeTemporaryCanonicalGraph',
  'historicalSevenEvidence',
  'focusedAddRelationshipIntroducingEndpoint',
  'focusedUpdateRelationshipIntroducingEndpoint',
  'focusedAddElementIntroducingMembership',
  'focusedUpdateViewIntroducingMembership',
  'applyAddElementIntroducingMembership',
  'applyUpdateViewIntroducingMembership',
]) {
  assert(
    harness.includes(methodName),
    `VIEW15_ENTRYPOINT_HARNESS_METHOD_MISSING:${methodName}`,
  );
}
for (const failureCategory of [
  'VIEW15_GLOBAL_SCOPE_8_REJECTED',
  'VIEW15_RELATIONSHIP_COUNTED_AGAINST_CAPACITY',
  'VIEW15_NO_MIGRATION_ACTIVATION_FAILED',
  'VIEW15_CONSISTENCY_ACTIVE_SEVEN_AUTHORITY',
  'VIEW15_CONSISTENCY_ACTIVE_FIFTEEN_AUTHORITY_MISSING',
  'VIEW15_CONSISTENCY_GRAPH_AUTHORITY_MISMATCH',
  'VIEW15_CONSISTENCY_HISTORICAL_EVIDENCE_REWRITTEN',
  'VIEW15_GLOBAL_SCOPE_16_WRITE',
  'VIEW15_DIRECT_GROWTH_FOCUSED_ADD_ELEMENT',
  'VIEW15_DIRECT_GROWTH_BATCH_ADD_ELEMENT',
  'VIEW15_DIRECT_GROWTH_FOCUSED_UPDATE_VIEW',
  'VIEW15_DIRECT_GROWTH_BATCH_UPDATE_VIEW',
  'VIEW15_INDIRECT_GROWTH_FOCUSED_ADD_RELATIONSHIP',
  'VIEW15_INDIRECT_GROWTH_FOCUSED_UPDATE_RELATIONSHIP',
  'VIEW15_INDIRECT_GROWTH_BATCH_ADD_RELATIONSHIP',
  'VIEW15_INDIRECT_GROWTH_BATCH_UPDATE_RELATIONSHIP',
  'OBSERVED_COUNT_NOT_REPORTED',
  'WROTE_REJECTED_MUTATION',
  'PERSISTED',
]) {
  assert(
    harness.includes(failureCategory),
    `VIEW15_ENTRYPOINT_BUSINESS_FAILURE_CATEGORY_MISSING:${failureCategory}`,
  );
}

for (const coverageMarker of [
  'stakeholder-motivation',
  'business-behavior',
  'application-realization',
  'Viewpoint:',
  'Concern:',
  'Purpose:',
  'Scope:',
  'Rationale:',
  'design/KG/SystemArchitecture.json',
  '20260804-195600-view-element-limit-15-current-session.md',
  'OVERALL_ARCHITECTURE.md',
  '.argo/scripts/ARCHITECTURE.md',
  'tests/ARCHITECTURE.md',
  'design/validator/intent-architecture-mcp-validation.md',
  'design/mcp/意图架构 MCP 功能列表.md',
  'addArchitectureRelationship',
  'updateArchitectureRelationship',
  'addArchitectureElement',
  'updateArchitectureView',
  'applySystemArchitectureMutation',
  'assertMembershipsUnchanged',
  'assertViewNotPersisted',
  'found 16',
]) {
  assert(
    harness.includes(coverageMarker),
    `VIEW15_ENTRYPOINT_SEMANTIC_COVERAGE_MARKER_MISSING:${coverageMarker}`,
  );
}

function findTestcase(testcaseName) {
  for (const element of graph.elements || []) {
    const testcase = (element.testcases || []).find(candidate => candidate.name === testcaseName);
    if (testcase) return testcase;
  }
  return undefined;
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const entryPaths = [
  'tests/explicit/entries/runGraphQueryCompatibility.js',
  'tests/explicit/entries/runCanonicalGraphFullSnapshot.js',
  'tests/explicit/entries/runQueryPurposeValidation.js',
  'tests/explicit/entries/runGraphTidyFullSnapshot.js',
  'tests/explicit/entries/runPurposePolicyClosure.js',
  'tests/explicit/entries/runIntentDecisionClosure.js',
  'tests/explicit/entries/runImplementationDesignClosure.js',
  'tests/explicit/entries/runCodingRepairClosure.js',
  'tests/explicit/entries/runAuditProofClosure.js',
  'tests/explicit/entries/runCoherentIntentReading.js',
  'tests/explicit/entries/runRelationshipEndpointClosure.js',
  'tests/explicit/entries/runCompleteViewClosure.js',
  'tests/explicit/entries/runFirstInclusionProvenance.js',
];
const requiredObservations = new Map([
  ['tests/explicit/entries/runGraphQueryCompatibility.js', [
    'assertLegacyEnvelopeExternallyEquivalent',
    'assertNoQueryModeMetadata',
  ]],
  ['tests/explicit/entries/runQueryPurposeValidation.js', [
    'createSemanticRetrievalProbe',
    'validQueries',
    'invalidQueries',
    "purpose: 'intent-decision'",
    "purpose: 'implementation-design'",
    "purpose: 'coding-repair'",
    "purpose: 'audit'",
    "purpose: 'graph-tidy'",
    'QUERY_PURPOSE_REQUIRED',
    'QUERY_PURPOSE_INVALID',
    'QUERY_INTENT_REQUIRED',
    'AUDIT_SUBJECT_REQUIRED',
    'DT03_VALIDATION_AFTER_RETRIEVAL',
  ]],
  ['tests/explicit/entries/runGraphTidyFullSnapshot.js', [
    'createSemanticRetrievalProbe',
    'DT12_SEMANTIC_PROBE_NOT_WIRED',
    'DT12_SEMANTIC_PATH_INVOKED',
  ]],
  ['tests/explicit/entries/runPurposePolicyClosure.js', [
    'readForPurposeClosure',
    'assertParameterizedClosurePolicy',
    'DT06_FREE_GENERATED_CYPHER_DECIDED_MANDATORY_CLOSURE',
    'DT07_CALLER_IDENTITY_POLICY_FORBIDDEN',
    'DT07_PURPOSE_CATEGORIES_NOT_INDEPENDENT',
  ]],
  ['tests/explicit/entries/runIntentDecisionClosure.js', [
    'assertIntentDecisionClosure',
    'DT08_IMPLEMENTATION_SCOPE_IMPORTED',
  ]],
  ['tests/explicit/entries/runImplementationDesignClosure.js', [
    'assertImplementationDesignClosure',
    'DT09_REPAIR_SCOPE_IMPORTED',
  ]],
  ['tests/explicit/entries/runCodingRepairClosure.js', [
    'assertCodingRepairClosure',
  ]],
  ['tests/explicit/entries/runAuditProofClosure.js', [
    'assertAuditProofClosure',
    'DT11_MISSING_SUBJECT_NOT_REJECTED',
  ]],
  ['tests/explicit/entries/runCoherentIntentReading.js', [
    'assertCoherentW6VersionEvidence',
  ]],
  ['tests/explicit/entries/runRelationshipEndpointClosure.js', [
    'assertRelationshipEndpointClosure',
    'governingCanonicalVersionFromLegacyResult',
    'endpointClosureFixture',
  ]],
  ['tests/explicit/entries/runCompleteViewClosure.js', [
    'assertCompleteViewClosure',
    'viewClosureFixture',
    'targetViewId',
    'overlappingViewIds',
  ]],
  ['tests/explicit/entries/runFirstInclusionProvenance.js', [
    'assertFirstInclusionProvenance',
    'duplicatePathFixtures',
    'expectedFirstInclusionReason',
  ]],
]);

// GIVEN the handoff-scoped explicit testcase entrypoints
for (const entryPath of entryPaths) {
  const source = fs.readFileSync(path.join(repoRoot, ...entryPath.split('/')), 'utf8');

  // WHEN each frozen entrypoint is inspected
  // THEN it keeps business-readable phases and uses the Harness abstraction
  for (const phase of ['GIVEN', 'WHEN', 'THEN']) {
    assert(source.includes(phase), `EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: ${entryPath} is missing ${phase}`);
  }
  assert(
    source.includes("harness/intentArchitectureQueryHarness.js"),
    `EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: ${entryPath} must use the intent-query Harness`,
  );
  assert(
    !source.includes("require('../../.argo/") && !source.includes('child_process'),
    `EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: ${entryPath} exposes low-level runtime plumbing`,
  );
  for (const observation of requiredObservations.get(entryPath) || []) {
    assert(
      source.includes(observation),
      `EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: ${entryPath} is missing ${observation}`,
    );
  }
}

const harnessPath = path.join(repoRoot, 'tests', 'harness', 'intentArchitectureQueryHarness.js');
const harnessSource = fs.readFileSync(harnessPath, 'utf8');
const {
  assertNoProbeCompatibilityUsesInjectedBoundary,
} = require(harnessPath);
const wrapperSource = fs.readFileSync(path.join(repoRoot, '.argo', 'scripts', 'argo-mcp-server.js'), 'utf8');
const innerSource = fs.readFileSync(path.join(repoRoot, '.argo', 'scripts', 'systemarchitecture-mcp-server.js'), 'utf8');
assert(
  harnessSource.includes("require('../../.argo/scripts/argo-mcp-server.js')"),
  'EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: compatibility Harness must traverse the public MCP wrapper',
);
assert(
  wrapperSource.includes('async function callTool(name, args = {}, progressToken = null, dependencies = undefined)')
    && wrapperSource.includes('systemArchitectureMcp.callTool(name, args, dependencies)'),
  'EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: wrapper must accept dependencies at argument four and forward them to the inner argument three',
);
assert(
  innerSource.includes('async function callTool(name, args = {}, dependencies = undefined)'),
  'EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: inner System Architecture boundary must accept dependencies at argument three',
);
const probeStart = harnessSource.indexOf('function createSemanticRetrievalProbe()');
const probeEnd = harnessSource.indexOf('function assertSemanticRetrievalCalls', probeStart);
assert(
  probeStart >= 0 && probeEnd > probeStart,
  'EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: Harness must own a semantic retrieval probe',
);
const probeSource = harnessSource.slice(probeStart, probeEnd);
for (const requiredProbeBehavior of [
  'const invocations = []',
  'async retrieve(request)',
  'invocations.push(request)',
  'return invocations.length',
]) {
  assert(
    probeSource.includes(requiredProbeBehavior),
    `EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: probe is missing ${requiredProbeBehavior}`,
  );
}
assert(
  !probeSource.includes('response') && !probeSource.includes('result'),
  'EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: probe count must not derive from the tested response',
);
assert(
  harnessSource.includes('? probe.semanticRetrievalBoundary')
    && harnessSource.includes('? { semanticRetrievalBoundary }'),
  'EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: Harness must inject the supplied probe or Harness-owned boundary',
);
assert(
  harnessSource.includes("callTool('getSystemArchitecture', args, null, testDependencies)"),
  'EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: compatibility Harness must pass its probe through wrapper argument four',
);
assert(
  !harnessSource.includes("callTool('getSystemArchitecture', args, testDependencies)")
    && !harnessSource.includes("require('../../.argo/scripts/systemarchitecture-mcp-server.js')"),
  'EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: compatibility Harness must not confuse wrapper argument three with inner dependencies',
);
assert(
  !harnessSource.includes('semanticRetrievalInvocationCount')
    && !harnessSource.includes('observeSemanticRetrievalActivity'),
  'EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: response telemetry cannot substitute for the test-owned probe',
);
for (const requiredDefaultBoundaryBehavior of [
  'defaultDeterministicSemanticRetrievalBoundary',
  'args && args.query ? defaultDeterministicSemanticRetrievalBoundary : undefined',
  'NO_PROBE_COMPATIBILITY_BOUNDARY_NOT_INVOKED',
]) {
  assert(
    harnessSource.includes(requiredDefaultBoundaryBehavior),
    `EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: no-probe compatibility boundary omits ${requiredDefaultBoundaryBehavior}`,
  );
}

const handoff = JSON.parse(fs.readFileSync(path.join(repoRoot, '.argo', 'temp', 'ImplementationToCodingHandoff.json'), 'utf8'));
assert(
  handoff.frozenFiles.includes('tests/harness/intentArchitectureQueryHarness.js'),
  'EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: the intent-query Harness must be frozen for Coding/Repair',
);
for (const harnessOwnedAssertion of [
  'DT08_INTENT_CONCERN_UNACCOUNTED',
  'DT09_DEPENDENCY_CHAINS_MISSING',
  'DT10_INTENT_AUTHORITY_MISSING',
  'DT10_UNRELATED_CAPABILITY_INCLUDED',
  'DT11_AUDIT_VIOLATIONS_MISSING',
  'DT00_CANONICAL_VERSION_MISSING',
  'DT00_CANONICAL_VERSION_MISMATCH',
  'DT13_ENDPOINT_CLOSURE_MISSING',
  'DT13_RELATIONSHIPS_EMPTY',
  'DT13_SOURCE_ID_MISMATCH',
  'DT14_VIEW_CLOSURE_MISSING',
  'DT14_TARGET_VIEW_ID_MISSING',
  'DT14_TARGET_VIEW_NOT_RETURNED',
  'DT14_OVERLAPPING_VIEW_RETURNED',
  'DT14_MEMBER_OBJECT_SET_INCOMPLETE',
  'DT14_PARENT_VIEWPOINT_MISSING',
  'DT15_PROVENANCE_EVIDENCE_MISSING',
  'DT15_ORDERED_FIRST_REASON_MISMATCH',
  'DT15_POLICY_PARAMETERS_MISSING',
  'DT15_POLICY_ANCHORS_MISSING',
]) {
  assert(
    harnessSource.includes(harnessOwnedAssertion),
    `EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: Harness omits ${harnessOwnedAssertion}`,
  );
}
for (const entryPath of entryPaths) {
  assert(
    handoff.frozenFiles.includes(entryPath),
    `EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: ${entryPath} must be frozen for Coding/Repair`,
  );
}

assertNoProbeCompatibilityUsesInjectedBoundary()
  .then(evidence => {
    assert.deepStrictEqual(evidence, {
      wrapperDependencyArgument: 4,
      innerDependencyArgument: 3,
      invocationCount: 1,
    });
  })
  .catch(error => {
    console.error(error && error.stack ? error.stack : error);
    process.exitCode = 1;
  });

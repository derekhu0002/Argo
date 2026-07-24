const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const entryPaths = [
  'tests/explicit/entries/runGraphQueryCompatibility.js',
  'tests/explicit/entries/runCanonicalGraphFullSnapshot.js',
  'tests/explicit/entries/runQueryPurposeValidation.js',
  'tests/explicit/entries/runGraphTidyFullSnapshot.js',
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
  harnessSource.includes('semanticRetrievalBoundary: probe.semanticRetrievalBoundary'),
  'EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: Harness must inject the test-owned probe boundary',
);
assert(
  !harnessSource.includes('semanticRetrievalInvocationCount')
    && !harnessSource.includes('observeSemanticRetrievalActivity'),
  'EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: response telemetry cannot substitute for the test-owned probe',
);

const handoff = JSON.parse(fs.readFileSync(path.join(repoRoot, '.argo', 'temp', 'ImplementationToCodingHandoff.json'), 'utf8'));
assert(
  handoff.frozenFiles.includes('tests/harness/intentArchitectureQueryHarness.js'),
  'EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: the intent-query Harness must be frozen for Coding/Repair',
);

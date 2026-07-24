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
    'readWithoutPurpose',
    'QUERY_PURPOSE_REQUIRED',
    'AUDIT_SUBJECT_REQUIRED',
  ]],
  ['tests/explicit/entries/runGraphTidyFullSnapshot.js', [
    'observeSemanticRetrievalActivity',
    'semanticActivity.invocationCount',
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

const handoff = JSON.parse(fs.readFileSync(path.join(repoRoot, '.argo', 'temp', 'ImplementationToCodingHandoff.json'), 'utf8'));
assert(
  handoff.frozenFiles.includes('tests/harness/intentArchitectureQueryHarness.js'),
  'EXPLICIT_ENTRYPOINT_CORRECTNESS_GUARD: the intent-query Harness must be frozen for Coding/Repair',
);

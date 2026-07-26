const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const entryPath = 'tests/explicit/entries/runNewProjectSemanticOperatorJourney.js';
const harnessPath = 'tests/harness/productionSemanticOperatorJourneyHarness.js';
const adapterHarnessPath = 'tests/harness/productionSemanticOperatorAdapterLifecycleHarness.js';
const processFixturePath = 'tests/fixtures/productionSemanticOperatorCliProcess.js';
const entry = read(entryPath);
const harness = read(harnessPath);
const adapterHarness = read(adapterHarnessPath);
const handoff = JSON.parse(read('.argo/temp/ImplementationToCodingHandoff.json'));

// GIVEN the one approved SP-05 physical entrypoint and its business-readable Harness
// WHEN phases, public wishes, assertions, and frozen ownership are inspected
// THEN the RED boundary cannot be reduced to shape-only or self-reported evidence
for (const required of [
  'GIVEN',
  'WHEN',
  'THEN',
  'productionSemanticOperatorJourneyHarness.js',
  'runNewProjectSemanticOperatorJourney',
  'assertNewProjectSemanticOperatorJourney',
  'assertRejectedAutomaticBackfillControls',
  'runProductionSemanticOperatorAdapterLifecycle',
  'assertProductionSemanticOperatorAdapterLifecycle',
]) {
  assert(entry.includes(required), `WP_P3_ENTRYPOINT_GUARD: entry omits ${required}`);
}

for (const required of [
  'spawnSync',
  'SP05_CLI_CROSS_PROCESS_QUERY_NOT_AUTHORIZED',
  'SP05_PACKAGE_BACKFILL_FORGES_EXPLICIT_CONSENT',
  'SEMANTIC_QUERY_BYPASSES_OPERATOR',
  'WIRE_HANDLER_NOT_EXPOSED',
  'SP05_CLI_STALE_ATTESTATION',
  'presenceOnly',
  'SP05_ATTESTATION_SYMLINK',
  'SP05_ATTESTATION_REPARSE',
  'untrustedAcl',
  'untrustedParentAcl',
  'SP05_ATTESTATION_PERMISSIVE_PARENT_ACL',
  'SP05_ATTESTATION_FOREIGN_IDENTITY_OWNER',
  'SP05_ATTESTATION_INTERRUPTED_TEMP_ONLY',
  'SP05_ATTESTATION_CANONICAL_BYTES_DRIFT',
  'SP05_QUERY_AFTER_CANONICAL_MUTATION',
  'ERROR_ENVELOPE_KEYS',
  'authorizationOperation',
  'semantic-readiness-attestation.json',
]) {
  assert(
    adapterHarness.includes(required),
    `WP_P3_ENTRYPOINT_GUARD: adapter Harness omits ${required}`,
  );
}
for (const prohibited of ['child_process', 'neo4j-driver', 'process.env', 'Cypher']) {
  assert(!entry.includes(prohibited), `WP_P3_ENTRYPOINT_GUARD: entry exposes ${prohibited} plumbing`);
}

for (const required of [
  'createProductionSemanticOperatorJourney',
  'runSemanticOperatorCommand',
  "command: 'init'",
  "command: 'backfill'",
  "command: 'readiness'",
  "command: 'query'",
  "command: 'snapshot'",
  'SP05_OPERATOR_JOURNEY_BOUNDARY_MISSING',
  'SP05_SUCCESS_CONFIGURATION_PARITY_REQUIRED',
  'SP05_SUCCESS_PATHS_MUST_DIFFER_ONLY_BY_OPT_IN',
  'SP05_SUCCESS_FIXTURES_DIFFER_BEYOND_OPT_IN',
  'SP05_NO_OPT_IN_PENDING_STATE_MISSING',
  'SP05_NO_OPT_IN_AUTOMATIC_START_PROHIBITED',
  'SP05_CONFIGURATION_MUST_PRECEDE_AUTO_START',
  'assertConfigurationBeforeSemanticEffects',
  'configuration-validation',
  'SP05_BACKFILL_PROGRESS_MISSING',
  'SP05_BACKFILL_CHECKPOINT_MISSING',
  'SP05_BACKFILL_FAILURE_RECORD_MISSING',
  'SP05_BACKFILL_RESUME_GUIDANCE_MISSING',
  'runRecoveryJourney',
  'SP05_READINESS_MUST_PRECEDE_QUERY',
  'ALIGNED_BUT_UNVERIFIED_READINESS',
  'NON_ALIGNED_BUT_VERIFIED_READINESS',
  'assertVerifiedSoleAuthorization',
  'SP05_WP2_VERIFIED_TRUE_NOT_AUTHORIZED',
  'SP05_READINESS_DIAGNOSTIC_',
  '_SILENT_SNAPSHOT_FALLBACK',
  'SP05_CANONICAL_JSON_AUTHORITY_CHANGED',
  'SP05_OPTED_IN_CONFIGURATION_CONTROL_MATRIX_INCOMPLETE',
  'preRejectionSnapshot',
  'postRejectionSnapshot',
  'POST_REJECTION_ENVELOPE_CHANGED',
  'assertExactFullSnapshotEnvelope',
  'observableError',
  'serializeObservableError',
  'serializeObservableValue',
  'Object.getOwnPropertyNames',
  'CANONICAL_MUTATION_SIDE_EFFECT',
  'automatic-backfill-start',
  'explicit-backfill-start',
  'provider-call',
  'database-write',
  'SECRET_CANARY',
  'UNSAFE_SOURCE_CANARY',
]) {
  assert(harness.includes(required), `WP_P3_ENTRYPOINT_GUARD: Harness omits ${required}`);
}

for (const frozen of [
  entryPath,
  harnessPath,
  adapterHarnessPath,
  processFixturePath,
  __filenameRelative(),
]) {
  assert(
    handoff.frozenFiles.includes(frozen),
    `WP_P3_ENTRYPOINT_GUARD: Coding handoff does not freeze ${frozen}`,
  );
}

function __filenameRelative() {
  return 'tests/architecture/production-semantic-operator/explicit-entrypoint-correctness.guard.js';
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

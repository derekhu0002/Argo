const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const entryPath = 'tests/explicit/entries/runNewProjectSemanticOperatorJourney.js';
const harnessPath = 'tests/harness/productionSemanticOperatorJourneyHarness.js';
const adapterHarnessPath = 'tests/harness/productionSemanticOperatorAdapterLifecycleHarness.js';
const processFixturePath = 'tests/fixtures/productionSemanticOperatorCliProcess.js';
const entry = read(entryPath);
const harness = read(harnessPath);
const adapterHarness = read(adapterHarnessPath);
const handoff = JSON.parse(read('.argo/temp/ImplementationToCodingHandoff.json'));

assert.doesNotThrow(
  () => assertPrimaryHarnessDurableComposition(harness, harnessPath),
  'WP_P3_ENTRYPOINT_GUARD: primary Harness durable store composition rejected',
);
assert.throws(
  () => assertPrimaryHarnessDurableComposition(
    harness.replace(/^\s*readinessAttestationStore,\r?$/m, ''),
    'missing-primary-store.fixture.js',
  ),
  /WP_P3_ENTRYPOINT_GUARD/,
  'WP_P3_ENTRYPOINT_GUARD: primary Harness missing-store fixture passed',
);

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
  'SP05_SAME_PROCESS_READINESS_DRIFT',
  'SP05_DURABLE_ATTESTATION_STORE_NOT_MANDATORY',
  'captureMissingDurableStoreRequirement',
  'SP05_PACKAGE_BACKFILL_FORGES_EXPLICIT_CONSENT',
  'SEMANTIC_QUERY_BYPASSES_OPERATOR',
  'captureAdapterQueryWithoutJourney',
  'CALLTOOL_RAW_RETRIEVAL_FALLBACK',
  'WIRE_HANDLER_NOT_EXPOSED',
  'SP05_CLI_STALE_ATTESTATION',
  'presenceOnly',
  'SP05_ATTESTATION_SYMLINK',
  'SP05_ATTESTATION_REPARSE',
  'untrustedAcl',
  'untrustedParentAcl',
  'SP05_ATTESTATION_PERMISSIVE_PARENT_ACL',
  'SP05_ATTESTATION_FOREIGN_IDENTITY_OWNER',
  'groupOwner',
  'builtinUsersFile',
  'builtinAdministratorsFile',
  'builtinAdministratorsParent',
  'authenticatedUsersFile',
  'authenticatedUsersParent',
  'foreignPrincipalFile',
  'missingCurrentIdentityFile',
  'currentIdentityDeniedFile',
  'builtinUsersParent',
  'currentHostParent',
  'SP05_CURRENT_HOST_BUILTIN_USERS_ACL_PRECONDITION_MISSING',
  'createRestrictedAttestationDirectory',
  'SP05_SAFE_FIXTURE_ACL_REMAINS_BROAD',
  'ACL_REMEDIATION',
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
for (const required of [
  'same-process-drift',
  'SP05_CURRENT_READINESS_OVERRIDE',
  'SP05_ATTESTATION_DIRECTORY_ACL_OVERRIDE',
  'SP05_ATTESTATION_FILE_ACL_OVERRIDE',
  'SP05_ATTESTATION_OWNER_OVERRIDE',
  '%CURRENT_IDENTITY%',
  'semanticOperatorErrorPayload',
]) {
  assert(
    read(processFixturePath).includes(required),
    `WP_P3_ENTRYPOINT_GUARD: process fixture omits ${required}`,
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
  'createControlledReadinessAttestationStore',
  'assertControlledReadinessAttestationStoreContract',
  'SP05_CONTROLLED_STORE_ACCEPTED_READINESS_DRIFT',
  'SP05_EXPLICIT_READINESS_ATTESTATION_NOT_RECORDED',
  'ATTESTATION_CREATED_AFTER_REJECTION',
]) {
  assert(harness.includes(required), `WP_P3_ENTRYPOINT_GUARD: Harness omits ${required}`);
}

function assertPrimaryHarnessDurableComposition(source, label) {
  const ast = ts.createSourceFile(label, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  assert.strictEqual(
    ast.parseDiagnostics.length,
    0,
    `WP_P3_ENTRYPOINT_GUARD: ${label} is not parseable JavaScript`,
  );
  const composition = ast.statements.find(statement => (
    ts.isFunctionDeclaration(statement)
    && statement.name
    && statement.name.text === 'createRecordingComposition'
  ));
  assert(composition && composition.body, `WP_P3_ENTRYPOINT_GUARD: ${label} composition missing`);
  const declarations = [];
  walk(composition.body, node => {
    if (ts.isVariableDeclaration(node)) declarations.push(node);
  });
  const store = declarations.find(declaration => (
    ts.isIdentifier(declaration.name)
    && declaration.name.text === 'readinessAttestationStore'
  ));
  assert(
    store
      && store.initializer
      && ts.isCallExpression(store.initializer)
      && ts.isIdentifier(store.initializer.expression)
      && store.initializer.expression.text === 'createControlledReadinessAttestationStore'
      && store.initializer.arguments.length === 0,
    `WP_P3_ENTRYPOINT_GUARD: ${label} controlled store binding missing`,
  );
  const dependencies = declarations.find(declaration => (
    ts.isIdentifier(declaration.name)
    && declaration.name.text === 'dependencies'
  ));
  assert(
    dependencies && dependencies.initializer && ts.isCallExpression(dependencies.initializer),
    `WP_P3_ENTRYPOINT_GUARD: ${label} dependency object missing`,
  );
  const dependencyObject = dependencies.initializer.arguments[0];
  assert(
    dependencyObject
      && ts.isObjectLiteralExpression(dependencyObject)
      && dependencyObject.properties.some(property => (
        ts.isShorthandPropertyAssignment(property)
        && property.name.text === 'readinessAttestationStore'
      )),
    `WP_P3_ENTRYPOINT_GUARD: ${label} omits mandatory controlled store`,
  );
  const journeyCalls = [];
  walk(ast, node => {
    if (
      ts.isCallExpression(node)
      && ts.isIdentifier(node.expression)
      && node.expression.text === 'createJourney'
    ) journeyCalls.push(node);
  });
  assert(journeyCalls.length > 0, `WP_P3_ENTRYPOINT_GUARD: ${label} journey compositions missing`);
  assert(
    journeyCalls.every(call => (
      call.arguments.length === 1
      && ts.isPropertyAccessExpression(call.arguments[0])
      && call.arguments[0].name.text === 'dependencies'
    )),
    `WP_P3_ENTRYPOINT_GUARD: ${label} bypasses controlled fixture dependencies`,
  );
}

function walk(node, visit) {
  visit(node);
  ts.forEachChild(node, child => walk(child, visit));
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

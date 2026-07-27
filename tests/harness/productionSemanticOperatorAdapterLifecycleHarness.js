const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const fixturePath = path.join(
  repoRoot,
  'tests',
  'fixtures',
  'productionSemanticOperatorCliProcess.js',
);
const cliPath = path.join(repoRoot, '.argo', 'scripts', 'semanticOperatorJourneyCli.js');
const attestationRelativePath = path.join(
  '.argo',
  'temp',
  'semantic-readiness-attestation.json',
);
const SECRET_CANARY = 'SP05-ADAPTER-SECRET-MUST-NOT-LEAK';
const UNSAFE_SOURCE_CANARY = 'SP05-ADAPTER-UNSAFE-SOURCE-MUST-NOT-LEAK';
const ACL_REMEDIATION = 'Restrict .argo/temp and semantic-readiness-attestation.json ownership and ACLs to the current OS identity and SYSTEM, then run semantic readiness again';
const SAFE_WINDOWS_ACL = [
  '%CURRENT_IDENTITY%:(F)',
  'NT AUTHORITY\\SYSTEM:(F)',
].join('\r\n');
const WINDOWS_PROTECTED_RIGHTS = Object.freeze([
  'F', 'M', 'RX', 'R', 'W', 'D',
  'DE', 'RC', 'WDAC', 'WO', 'S', 'AS', 'MA',
  'GR', 'GW', 'GE', 'GA',
  'RD', 'WD', 'AD', 'REA', 'WEA', 'X', 'DC', 'RA', 'WA',
]);
const WINDOWS_RUNTIME_RIGHTS = Object.freeze([
  'WD', 'AD', 'GW', 'GA', 'WEA', 'GR', 'RD',
]);
const ERROR_ENVELOPE_KEYS = Object.freeze([
  'action',
  'canonicalVersion',
  'category',
  'completedChannels',
  'contentVersion',
  'fullSnapshotFallback',
  'indexVersion',
  'mismatchedChannels',
  'missingChannels',
  'state',
  'verified',
].sort());

const VERSION_ONE_READINESS = Object.freeze({
  state: 'Aligned',
  verified: true,
  canonicalVersion: 'canonical:adapter-v1',
  contentVersion: 'content:adapter-v1',
  indexVersion: 'index:adapter-v1',
  completedChannels: ['Element', 'ArchitectureRelationship', 'View'],
  missingChannels: [],
  mismatchedChannels: [],
  fullSnapshotFallback: false,
});
const VERSION_TWO_READINESS = Object.freeze({
  state: 'Aligned',
  verified: true,
  canonicalVersion: 'canonical:adapter-v2',
  contentVersion: 'content:adapter-v2',
  indexVersion: 'index:adapter-v2',
  completedChannels: ['Element', 'ArchitectureRelationship', 'View'],
  missingChannels: [],
  mismatchedChannels: [],
  fullSnapshotFallback: false,
});

async function runProductionSemanticOperatorAdapterLifecycle() {
  const roots = [];
  try {
    const successful = createProcessWorkspace(roots, VERSION_ONE_READINESS);
    const readiness = spawnFixture(successful, ['readiness']);
    const attestationAfterReadiness = readAttestation(successful);
    const query = spawnFixture(successful, [
      'query',
      '--request-json',
      JSON.stringify(semanticQuery()),
    ]);

    const missing = createProcessWorkspace(roots, VERSION_ONE_READINESS);
    const queryWithoutReadiness = spawnFixture(missing, [
      'query',
      '--request-json',
      JSON.stringify(semanticQuery()),
    ]);

    const initialized = createProcessWorkspace(roots, VERSION_ONE_READINESS);
    const readinessBeforeInit = spawnFixture(initialized, ['readiness']);
    const init = spawnFixture(initialized, ['init']);
    const queryAfterInit = spawnFixture(initialized, [
      'query',
      '--request-json',
      JSON.stringify(semanticQuery()),
    ]);

    const backfilled = createProcessWorkspace(roots, VERSION_ONE_READINESS);
    const readinessBeforeBackfill = spawnFixture(backfilled, ['readiness']);
    const backfill = spawnFixture(backfilled, ['backfill', '--explicit-opt-in']);
    const queryAfterBackfill = spawnFixture(backfilled, [
      'query',
      '--request-json',
      JSON.stringify(semanticQuery()),
    ]);

    const stale = createProcessWorkspace(roots, VERSION_ONE_READINESS);
    const readinessBeforeVersionChange = spawnFixture(stale, ['readiness']);
    writeReadiness(stale, VERSION_TWO_READINESS);
    const queryAfterVersionChange = spawnFixture(stale, [
      'query',
      '--request-json',
      JSON.stringify(semanticQuery()),
    ]);

    const sameProcessDrift = createProcessWorkspace(roots, VERSION_ONE_READINESS);
    const sameProcessDriftQuery = spawnFixture(sameProcessDrift, ['same-process-drift'], {
      SP05_CURRENT_READINESS_OVERRIDE: JSON.stringify(VERSION_TWO_READINESS),
    });
    const missingDurableStore = captureMissingDurableStoreRequirement();
    const trust = runAttestationTrustScenarios(roots);
    const packageBackfill = spawnPackageBackfillWithoutConsent();
    const mcp = await exerciseMcpAdapterPaths();

    return freeze({
      cli: {
        successful: {
          readiness,
          query,
          attestationAfterReadiness,
          aclSetup: successful.aclSetup,
          state: readFixtureState(successful),
        },
        missing: {
          query: queryWithoutReadiness,
          state: readFixtureState(missing),
        },
        initialized: {
          readiness: readinessBeforeInit,
          init,
          query: queryAfterInit,
          state: readFixtureState(initialized),
        },
        backfilled: {
          readiness: readinessBeforeBackfill,
          backfill,
          query: queryAfterBackfill,
          state: readFixtureState(backfilled),
        },
        stale: {
          readiness: readinessBeforeVersionChange,
          query: queryAfterVersionChange,
          expectedCurrentReadiness: VERSION_TWO_READINESS,
          state: readFixtureState(stale),
        },
        sameProcessDrift: {
          query: sameProcessDriftQuery,
          expectedCurrentReadiness: VERSION_TWO_READINESS,
          state: readFixtureState(sameProcessDrift),
        },
        missingDurableStore,
        trust,
      },
      packageBackfill,
      mcp,
    });
  } finally {
    for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
  }
}

function runAttestationTrustScenarios(roots) {
  const presenceOnly = createProcessWorkspace(roots, VERSION_ONE_READINESS);
  writeRawAttestation(presenceOnly, '{}');
  const presenceOnlyQuery = spawnSemanticQuery(presenceOnly);

  const malformed = createProcessWorkspace(roots, VERSION_ONE_READINESS);
  writeRawAttestation(malformed, '{"schemaVersion":');
  const malformedQuery = spawnSemanticQuery(malformed);

  const extraField = createRecordedWorkspace(roots);
  mutateAttestation(extraField, record => ({ ...record, forgedExtra: true }));
  const extraFieldQuery = spawnSemanticQuery(extraField);

  const tampered = createRecordedWorkspace(roots);
  mutateAttestation(tampered, record => ({
    ...record,
    indexVersion: 'index:tampered-without-integrity-update',
  }));
  const tamperedQuery = spawnSemanticQuery(tampered);

  const foreignSource = createRecordedWorkspace(roots);
  const foreign = readAttestation(foreignSource) || { schemaVersion: 'foreign-placeholder' };
  const forgedForeign = createProcessWorkspace(roots, VERSION_ONE_READINESS);
  fs.appendFileSync(canonicalPath(forgedForeign), '\n');
  writeRawAttestation(forgedForeign, JSON.stringify(foreign));
  const forgedForeignQuery = spawnSemanticQuery(forgedForeign);

  const symbolicLink = createProcessWorkspace(roots, VERSION_ONE_READINESS);
  const symbolicTarget = path.join(symbolicLink.root, 'outside-attestation.json');
  fs.writeFileSync(symbolicTarget, JSON.stringify(foreign));
  ensureAttestationDirectory(symbolicLink);
  const symbolicPath = attestationPath(symbolicLink);
  let symbolicLinkSetupError = null;
  try {
    fs.symlinkSync(symbolicTarget, symbolicPath, 'file');
  } catch (error) {
    symbolicLinkSetupError = observableError(error);
  }
  const symbolicLinkQuery = spawnSemanticQuery(symbolicLink);

  const reparsePoint = createProcessWorkspace(roots, VERSION_ONE_READINESS);
  const reparseTarget = fs.mkdtempSync(path.join(os.tmpdir(), 'argo-sp05-reparse-target-'));
  roots.push(reparseTarget);
  fs.writeFileSync(path.join(reparseTarget, 'semantic-readiness-attestation.json'), JSON.stringify(foreign));
  const argoDirectory = path.join(reparsePoint.root, '.argo');
  const tempDirectory = path.join(argoDirectory, 'temp');
  fs.mkdirSync(argoDirectory, { recursive: true });
  fs.rmSync(tempDirectory, { recursive: true, force: true });
  let reparseSetupError = null;
  try {
    fs.symlinkSync(reparseTarget, tempDirectory, process.platform === 'win32' ? 'junction' : 'dir');
  } catch (error) {
    reparseSetupError = observableError(error);
  }
  const reparsePointQuery = spawnSemanticQuery(reparsePoint);

  const interruptedWithTarget = createRecordedWorkspace(roots);
  writeInterruptedTemporary(interruptedWithTarget, '{"partial":');
  const interruptedWithTargetQuery = spawnSemanticQuery(interruptedWithTarget);

  const interruptedWithoutTarget = createProcessWorkspace(roots, VERSION_ONE_READINESS);
  writeInterruptedTemporary(interruptedWithoutTarget, JSON.stringify(foreign));
  const interruptedWithoutTargetQuery = spawnSemanticQuery(interruptedWithoutTarget);

  const canonicalBytes = createRecordedWorkspace(roots);
  fs.appendFileSync(canonicalPath(canonicalBytes), '\n');
  const canonicalBytesQuery = spawnSemanticQuery(canonicalBytes);

  const untrustedAcl = createRecordedWorkspace(roots);
  const aclMutation = makeAttestationAclUntrusted(untrustedAcl);
  const untrustedAclQuery = spawnSemanticQuery(untrustedAcl, {
    SP05_ATTESTATION_FILE_ACL_OVERRIDE: [
      SAFE_WINDOWS_ACL,
      'Everyone:(R)',
    ].join('\r\n'),
  });

  const untrustedParentAcl = createRecordedWorkspace(roots);
  const parentAclMutation = makeAttestationDirectoryAclUntrusted(untrustedParentAcl);
  const untrustedParentAclQuery = spawnSemanticQuery(untrustedParentAcl, {
    SP05_ATTESTATION_DIRECTORY_ACL_OVERRIDE: [
      SAFE_WINDOWS_ACL,
      'Everyone:(M)',
    ].join('\r\n'),
  });

  const foreignIdentityOwner = createRecordedWorkspace(roots);
  const foreignIdentityOwnerQuery = spawnSemanticQuery(foreignIdentityOwner, {
    SP05_ATTESTATION_OWNER_OVERRIDE: 'FOREIGN-DOMAIN\\ForeignIdentity',
  });

  const windowsPolicy = process.platform === 'win32'
    ? runWindowsTrustPolicyScenarios(roots)
    : { applicable: false };

  const mutation = createProcessWorkspace(
    roots,
    VERSION_ONE_READINESS,
    JSON.parse(fs.readFileSync(path.join(repoRoot, 'design', 'KG', 'SystemArchitecture.json'), 'utf8')),
  );
  const readinessBeforeMutation = spawnFixture(mutation, ['readiness']);
  const mutationResult = spawnFixture(mutation, ['mcp-mutation']);
  const queryAfterMutation = spawnSemanticQuery(mutation);

  const drift = {};
  for (const [name, readiness] of Object.entries({
    canonical: { ...VERSION_ONE_READINESS, canonicalVersion: 'canonical:independent-drift' },
    content: { ...VERSION_ONE_READINESS, contentVersion: 'content:independent-drift' },
    index: { ...VERSION_ONE_READINESS, indexVersion: 'index:independent-drift' },
    channels: {
      ...VERSION_ONE_READINESS,
      completedChannels: ['Element', 'ArchitectureRelationship'],
      missingChannels: ['View'],
      mismatchedChannels: ['View'],
    },
  })) {
    const workspace = createRecordedWorkspace(roots);
    writeReadiness(workspace, readiness);
    drift[name] = {
      query: spawnSemanticQuery(workspace),
      expectedCurrentReadiness: readiness,
      state: readFixtureState(workspace),
    };
  }

  return {
    presenceOnly: scenarioResult(presenceOnly, presenceOnlyQuery),
    malformed: scenarioResult(malformed, malformedQuery),
    extraField: scenarioResult(extraField, extraFieldQuery),
    tampered: scenarioResult(tampered, tamperedQuery),
    forgedForeign: scenarioResult(forgedForeign, forgedForeignQuery),
    symbolicLink: {
      ...scenarioResult(symbolicLink, symbolicLinkQuery),
      setupError: symbolicLinkSetupError,
    },
    reparsePoint: {
      ...scenarioResult(reparsePoint, reparsePointQuery),
      setupError: reparseSetupError,
    },
    interruptedWithTarget: scenarioResult(interruptedWithTarget, interruptedWithTargetQuery),
    interruptedWithoutTarget: scenarioResult(interruptedWithoutTarget, interruptedWithoutTargetQuery),
    canonicalBytes: scenarioResult(canonicalBytes, canonicalBytesQuery),
    untrustedAcl: {
      ...scenarioResult(untrustedAcl, untrustedAclQuery),
      aclMutation,
    },
    untrustedParentAcl: {
      ...scenarioResult(untrustedParentAcl, untrustedParentAclQuery),
      aclMutation: parentAclMutation,
    },
    foreignIdentityOwner: scenarioResult(foreignIdentityOwner, foreignIdentityOwnerQuery),
    windowsPolicy,
    mutation: {
      readiness: readinessBeforeMutation,
      mutation: mutationResult,
      query: queryAfterMutation,
      state: readFixtureState(mutation),
    },
    drift,
  };
}

function assertProductionSemanticOperatorAdapterLifecycle(result) {
  const failures = [];
  for (const [scope, assertion] of [
    ['cli-process-lifecycle', () => assertCliProcessLifecycle(result.cli)],
    ['attestation-trust', () => assertAttestationTrustControls(result.cli.trust)],
    ['package-consent', () => assertPackageConsent(result.packageBackfill)],
    ['mcp-semantic-dispatch', () => assertMcpSemanticDispatch(result.mcp)],
    ['mcp-snapshot-bypasses', () => assertMcpSnapshotBypasses(result.mcp)],
    ['mcp-wire-errors', () => assertMcpWireErrors(result.mcp)],
  ]) {
    try {
      assertion();
    } catch (error) {
      failures.push(`${scope}: ${error.message}`);
    }
  }
  assert.deepStrictEqual(
    failures,
    [],
    `SP05_ADAPTER_LIFECYCLE_CONTROLS_FAILED\n${failures.join('\n')}`,
  );
}

function assertCliProcessLifecycle(cli) {
  assert.strictEqual(
    cli.successful.aclSetup.status,
    0,
    `SP05_SAFE_FIXTURE_ACL_SETUP_FAILED: ${cli.successful.aclSetup.stderr}`,
  );
  assert(
    !/(?:BUILTIN\\Users|BUILTIN\\Administrators|Authenticated Users|Everyone|S-1-1-0)/i
      .test(cli.successful.aclSetup.acl),
    `SP05_SAFE_FIXTURE_ACL_REMAINS_BROAD: ${cli.successful.aclSetup.acl}`,
  );
  assertProcessPassed(cli.successful.readiness, 'SP05_CLI_READINESS_PROCESS_FAILED');
  assertProcessPassed(cli.successful.query, 'SP05_CLI_QUERY_PROCESS_FAILED');
  assert.strictEqual(
    cli.successful.query.output.status,
    'passed',
    'SP05_CLI_CROSS_PROCESS_QUERY_NOT_AUTHORIZED',
  );
  assertEventCounts(cli.successful.state.events, {
    'readiness-read': 2,
    'semantic-query': 1,
  }, 'SP05_CLI_CROSS_PROCESS');
  const attestation = cli.successful.attestationAfterReadiness;
  assert(attestation, 'SP05_CLI_READINESS_ATTESTATION_MISSING');
  assert.deepStrictEqual(
    Object.keys(attestation).sort(),
    [
      'authorizationOperation',
      'canonicalDigest',
      'canonicalVersion',
      'completedChannels',
      'contentVersion',
      'fullSnapshotFallback',
      'graphPath',
      'indexVersion',
      'integrityDigest',
      'mismatchedChannels',
      'missingChannels',
      'schemaVersion',
      'verified',
    ].sort(),
    'SP05_CLI_ATTESTATION_ENVELOPE_CHANGED',
  );
  assert.strictEqual(attestation.verified, true, 'SP05_CLI_ATTESTATION_NOT_VERIFIED');
  assert.strictEqual(
    attestation.authorizationOperation,
    'verifyReadiness',
    'SP05_CLI_ATTESTATION_PROVENANCE_OPERATION_CHANGED',
  );
  const serializedAttestation = JSON.stringify(attestation);
  assert(!serializedAttestation.includes(SECRET_CANARY), 'SP05_CLI_ATTESTATION_SECRET_LEAK');
  assert(
    !serializedAttestation.includes(UNSAFE_SOURCE_CANARY),
    'SP05_CLI_ATTESTATION_UNSAFE_SOURCE_LEAK',
  );
  assert(
    !/password|credential|token|secret|api[_-]?key/i.test(serializedAttestation),
    'SP05_CLI_ATTESTATION_CONTAINS_SECRET_FIELD',
  );

  assertStructuredProcessError(
    cli.missing.query,
    'SEMANTIC_READINESS_VERIFICATION_REQUIRED',
    'SP05_CLI_QUERY_WITHOUT_READINESS',
  );
  assertNoEvents(
    cli.missing.state.events,
    ['readiness-read', 'semantic-query'],
    'SP05_CLI_QUERY_WITHOUT_READINESS',
  );

  assertProcessPassed(cli.initialized.readiness, 'SP05_CLI_PRE_INIT_READINESS_FAILED');
  assertProcessPassed(cli.initialized.init, 'SP05_CLI_INIT_PROCESS_FAILED');
  assertStructuredProcessError(
    cli.initialized.query,
    'SEMANTIC_READINESS_VERIFICATION_REQUIRED',
    'SP05_CLI_QUERY_AFTER_INIT',
  );
  assertEventCounts(cli.initialized.state.events, {
    'readiness-read': 1,
    'semantic-query': 0,
  }, 'SP05_CLI_QUERY_AFTER_INIT');

  assertProcessPassed(cli.backfilled.readiness, 'SP05_CLI_PRE_BACKFILL_READINESS_FAILED');
  assertProcessPassed(cli.backfilled.backfill, 'SP05_CLI_BACKFILL_PROCESS_FAILED');
  assertStructuredProcessError(
    cli.backfilled.query,
    'SEMANTIC_READINESS_VERIFICATION_REQUIRED',
    'SP05_CLI_QUERY_AFTER_BACKFILL',
  );
  assertEventCounts(cli.backfilled.state.events, {
    'readiness-read': 1,
    'semantic-query': 0,
  }, 'SP05_CLI_QUERY_AFTER_BACKFILL');

  assertProcessPassed(cli.stale.readiness, 'SP05_CLI_PRE_VERSION_CHANGE_READINESS_FAILED');
  assertStructuredProcessError(
    cli.stale.query,
    'SEMANTIC_READINESS_ATTESTATION_STALE',
    'SP05_CLI_STALE_ATTESTATION',
  );
  for (const field of [
    'canonicalVersion',
    'contentVersion',
    'indexVersion',
    'completedChannels',
    'missingChannels',
    'mismatchedChannels',
    'fullSnapshotFallback',
  ]) {
    assert.deepStrictEqual(
      cli.stale.query.output.error[field],
      cli.stale.expectedCurrentReadiness[field],
      `SP05_CLI_STALE_DIAGNOSTIC_${field.toUpperCase()}_CHANGED`,
    );
  }
  assertEventCounts(cli.stale.state.events, {
    'readiness-read': 2,
    'semantic-query': 0,
  }, 'SP05_CLI_STALE_ATTESTATION');

  assertStructuredProcessError(
    cli.sameProcessDrift.query,
    'SEMANTIC_READINESS_ATTESTATION_STALE',
    'SP05_SAME_PROCESS_READINESS_DRIFT',
  );
  for (const field of [
    'canonicalVersion',
    'contentVersion',
    'indexVersion',
    'completedChannels',
    'missingChannels',
    'mismatchedChannels',
  ]) {
    assert.deepStrictEqual(
      cli.sameProcessDrift.query.output.error[field],
      cli.sameProcessDrift.expectedCurrentReadiness[field],
      `SP05_SAME_PROCESS_DRIFT_${field.toUpperCase()}_DIAGNOSTIC_CHANGED`,
    );
  }
  assertEventCounts(cli.sameProcessDrift.state.events, {
    'readiness-read': 2,
    'semantic-query': 0,
  }, 'SP05_SAME_PROCESS_READINESS_DRIFT');
  assert.strictEqual(
    cli.missingDurableStore.accepted,
    false,
    'SP05_DURABLE_ATTESTATION_STORE_NOT_MANDATORY',
  );
  assert.match(
    cli.missingDurableStore.error.message,
    /readinessAttestationStore/i,
    'SP05_MISSING_STORE_ERROR_NOT_ACTIONABLE',
  );
}

function assertAttestationTrustControls(trust) {
  for (const [name, scenario] of Object.entries({
    presenceOnly: trust.presenceOnly,
    malformed: trust.malformed,
    extraField: trust.extraField,
    tampered: trust.tampered,
    forgedForeign: trust.forgedForeign,
  })) {
    assertStructuredProcessError(
      scenario.query,
      'SEMANTIC_READINESS_ATTESTATION_INVALID',
      `SP05_ATTESTATION_${name.toUpperCase()}`,
    );
    assertEventCounts(scenario.state.events, {
      'semantic-query': 0,
    }, `SP05_ATTESTATION_${name.toUpperCase()}`);
  }

  assert.strictEqual(
    trust.symbolicLink.setupError,
    null,
    `SP05_ATTESTATION_SYMLINK_FIXTURE_UNAVAILABLE: ${JSON.stringify(trust.symbolicLink.setupError)}`,
  );
  assertStructuredProcessError(
    trust.symbolicLink.query,
    'SEMANTIC_READINESS_ATTESTATION_UNTRUSTED',
    'SP05_ATTESTATION_SYMLINK',
  );
  assert.strictEqual(
    trust.reparsePoint.setupError,
    null,
    `SP05_ATTESTATION_REPARSE_FIXTURE_UNAVAILABLE: ${JSON.stringify(trust.reparsePoint.setupError)}`,
  );
  assertStructuredProcessError(
    trust.reparsePoint.query,
    'SEMANTIC_READINESS_ATTESTATION_UNTRUSTED',
    'SP05_ATTESTATION_REPARSE',
  );

  assertProcessPassed(
    trust.interruptedWithTarget.query,
    'SP05_ATTESTATION_INTERRUPTED_REPLACEMENT_LOST_COMMITTED_TARGET',
  );
  assertStructuredProcessError(
    trust.interruptedWithoutTarget.query,
    'SEMANTIC_READINESS_VERIFICATION_REQUIRED',
    'SP05_ATTESTATION_INTERRUPTED_TEMP_ONLY',
  );

  assertStructuredProcessError(
    trust.canonicalBytes.query,
    'SEMANTIC_READINESS_ATTESTATION_STALE',
    'SP05_ATTESTATION_CANONICAL_BYTES_DRIFT',
  );
  assertEventCounts(trust.canonicalBytes.state.events, {
    'readiness-read': 1,
    'semantic-query': 0,
  }, 'SP05_ATTESTATION_CANONICAL_BYTES_DRIFT');

  assert.strictEqual(
    trust.untrustedAcl.aclMutation.status,
    0,
    `SP05_ATTESTATION_ACL_FIXTURE_FAILED: ${trust.untrustedAcl.aclMutation.stderr}`,
  );
  assertAclRejection(trust.untrustedAcl, 'SP05_ATTESTATION_PERMISSIVE_ACL');
  assert.strictEqual(
    trust.untrustedParentAcl.aclMutation.status,
    0,
    `SP05_ATTESTATION_PARENT_ACL_FIXTURE_FAILED: ${trust.untrustedParentAcl.aclMutation.stderr}`,
  );
  assertAclRejection(
    trust.untrustedParentAcl,
    'SP05_ATTESTATION_PERMISSIVE_PARENT_ACL',
  );
  assertAclRejection(
    trust.foreignIdentityOwner,
    'SP05_ATTESTATION_FOREIGN_IDENTITY_OWNER',
  );

  assertWindowsTrustPolicy(trust.windowsPolicy);

  assertProcessPassed(trust.mutation.readiness, 'SP05_PRE_MUTATION_READINESS_FAILED');
  assertProcessPassed(trust.mutation.mutation, 'SP05_CANONICAL_MUTATION_PROCESS_FAILED');
  assertStructuredProcessError(
    trust.mutation.query,
    'SEMANTIC_READINESS_VERIFICATION_REQUIRED',
    'SP05_QUERY_AFTER_CANONICAL_MUTATION',
  );
  assertEventCounts(trust.mutation.state.events, {
    'readiness-read': 1,
    'semantic-query': 0,
  }, 'SP05_QUERY_AFTER_CANONICAL_MUTATION');

  for (const [name, scenario] of Object.entries(trust.drift)) {
    assertStructuredProcessError(
      scenario.query,
      'SEMANTIC_READINESS_ATTESTATION_STALE',
      `SP05_ATTESTATION_${name.toUpperCase()}_DRIFT`,
    );
    for (const field of [
      'canonicalVersion',
      'contentVersion',
      'indexVersion',
      'completedChannels',
      'missingChannels',
      'mismatchedChannels',
    ]) {
      assert.deepStrictEqual(
        scenario.query.output.error[field],
        scenario.expectedCurrentReadiness[field],
        `SP05_ATTESTATION_${name.toUpperCase()}_${field.toUpperCase()}_DIAGNOSTIC_CHANGED`,
      );
    }
    assertEventCounts(scenario.state.events, {
      'readiness-read': 2,
      'semantic-query': 0,
    }, `SP05_ATTESTATION_${name.toUpperCase()}_DRIFT`);
  }
}

function assertPackageConsent(outcome) {
  assert(
    outcome.commandLine.includes('semanticOperatorJourneyCli.js backfill'),
    'SP05_PACKAGE_BACKFILL_COMMAND_NOT_EXECUTED',
  );
  assert(
    !outcome.commandLine.includes('--explicit-opt-in'),
    'SP05_PACKAGE_BACKFILL_FORGES_EXPLICIT_CONSENT',
  );
}

function assertMcpSemanticDispatch(mcp) {
  for (const [label, outcome] of [
    ['SYSTEM', mcp.system],
    ['UNIFIED', mcp.unified],
  ]) {
    assert.deepStrictEqual(
      outcome.events,
      ['operator-query'],
      `SP05_${label}_SEMANTIC_QUERY_BYPASSES_OPERATOR`,
    );
    assert.strictEqual(
      outcome.error && outcome.error.category,
      'SEMANTIC_READINESS_VERIFICATION_REQUIRED',
      `SP05_${label}_SEMANTIC_QUERY_NOT_FAIL_CLOSED`,
    );
  }
  for (const [label, outcome] of [
    ['SYSTEM_EXPORTED', mcp.systemWithoutJourney],
    ['UNIFIED_EXPORTED', mcp.unifiedWithoutJourney],
  ]) {
    assert(
      !outcome.events.includes('direct-retrieval'),
      `SP05_${label}_CALLTOOL_RAW_RETRIEVAL_FALLBACK`,
    );
    assert(
      outcome.error && [
        'SEMANTIC_READINESS_VERIFICATION_REQUIRED',
        'SEMANTIC_READINESS_ATTESTATION_UNTRUSTED',
      ].includes(outcome.error.category),
      `SP05_${label}_CALLTOOL_WITHOUT_JOURNEY_NOT_FAIL_CLOSED`,
    );
  }
}

function assertMcpSnapshotBypasses(mcp) {
  const canonicalDocument = JSON.parse(fs.readFileSync(
    path.join(repoRoot, 'design', 'KG', 'SystemArchitecture.json'),
    'utf8',
  ));
  assert.deepStrictEqual(mcp.systemSnapshot.events, [], 'SP05_SYSTEM_SNAPSHOT_USED_OPERATOR');
  assert.deepStrictEqual(mcp.unifiedSnapshot.events, [], 'SP05_UNIFIED_SNAPSHOT_USED_OPERATOR');
  assert.deepStrictEqual(mcp.systemGraphTidy.events, [], 'SP05_SYSTEM_GRAPH_TIDY_USED_OPERATOR');
  assert.deepStrictEqual(mcp.unifiedGraphTidy.events, [], 'SP05_UNIFIED_GRAPH_TIDY_USED_OPERATOR');
  for (const [label, outcome] of [
    ['SYSTEM_SNAPSHOT', mcp.systemSnapshot],
    ['UNIFIED_SNAPSHOT', mcp.unifiedSnapshot],
    ['SYSTEM_GRAPH_TIDY', mcp.systemGraphTidy],
    ['UNIFIED_GRAPH_TIDY', mcp.unifiedGraphTidy],
  ]) {
    assert.deepStrictEqual(
      outcome.result.document,
      canonicalDocument,
      `SP05_${label}_CANONICAL_SNAPSHOT_CHANGED`,
    );
  }
}

function assertMcpWireErrors(mcp) {
  for (const [label, wire] of [
    ['SYSTEM', mcp.systemWire],
    ['UNIFIED', mcp.unifiedWire],
  ]) {
    assert.strictEqual(wire.available, true, `SP05_${label}_WIRE_HANDLER_NOT_EXPOSED`);
    assert.strictEqual(wire.result.isError, true, `SP05_${label}_WIRE_ERROR_FLAG_MISSING`);
    const errorPayload = JSON.parse(wire.result.content[0].text);
    assert.deepStrictEqual(
      Object.keys(errorPayload.error).sort(),
      ERROR_ENVELOPE_KEYS,
      `SP05_${label}_WIRE_ERROR_ENVELOPE_CHANGED`,
    );
    assert.deepStrictEqual(
      errorPayload.error,
      {
        category: 'SEMANTIC_INDEX_NOT_ALIGNED',
        state: 'SemanticIndexPending',
        verified: false,
        canonicalVersion: 'canonical:wire-v1',
        contentVersion: 'content:wire-v1',
        indexVersion: 'index:wire-v1',
        completedChannels: ['Element', 'ArchitectureRelationship'],
        missingChannels: ['View'],
        mismatchedChannels: [],
        fullSnapshotFallback: false,
        action: 'Run semantic readiness after completing the missing View channel',
      },
      `SP05_${label}_WIRE_ERROR_DIAGNOSTIC_MAPPING_CHANGED`,
    );
    assert.strictEqual(
      errorPayload.error.category,
      'SEMANTIC_INDEX_NOT_ALIGNED',
      `SP05_${label}_WIRE_ERROR_CATEGORY_CHANGED`,
    );
    assert.deepStrictEqual(
      errorPayload.error.canonicalVersion,
      'canonical:wire-v1',
      `SP05_${label}_WIRE_CANONICAL_VERSION_DROPPED`,
    );
    assert.deepStrictEqual(
      errorPayload.error.missingChannels,
      ['View'],
      `SP05_${label}_WIRE_CHANNEL_DIAGNOSTICS_DROPPED`,
    );
    assert.strictEqual(errorPayload.error.verified, false, `SP05_${label}_WIRE_VERDICT_DROPPED`);
    assert.strictEqual(
      errorPayload.error.action,
      'Run semantic readiness after completing the missing View channel',
      `SP05_${label}_WIRE_ACTION_DROPPED`,
    );
    const serialized = JSON.stringify(wire.result);
    assert(!serialized.includes(SECRET_CANARY), `SP05_${label}_WIRE_SECRET_LEAK`);
    assert(!serialized.includes(UNSAFE_SOURCE_CANARY), `SP05_${label}_WIRE_UNSAFE_SOURCE_LEAK`);
    assert(!serialized.includes('\n    at '), `SP05_${label}_WIRE_STACK_LEAK`);
  }
}

async function exerciseMcpAdapterPaths() {
  const system = require('../../.argo/scripts/systemarchitecture-mcp-server.js');
  const unified = require('../../.argo/scripts/argo-mcp-server.js');
  const systemOutcome = await captureAdapterQuery(system.callTool, false);
  const unifiedOutcome = await captureAdapterQuery(unified.callTool, true);
  const systemWithoutJourney = await captureAdapterQueryWithoutJourney(system.callTool, false);
  const unifiedWithoutJourney = await captureAdapterQueryWithoutJourney(unified.callTool, true);
  const systemSnapshot = await captureBypass(system.callTool, false, {});
  const unifiedSnapshot = await captureBypass(unified.callTool, true, {});
  const graphTidyArgs = { query: { purpose: 'graph-tidy', intent: 'preserve full snapshot' } };
  const systemGraphTidy = await captureBypass(system.callTool, false, graphTidyArgs);
  const unifiedGraphTidy = await captureBypass(unified.callTool, true, graphTidyArgs);
  const systemWire = await captureWire(system.handleRequest);
  const unifiedWire = await captureWire(unified.handleRequest);
  return {
    system: systemOutcome,
    unified: unifiedOutcome,
    systemWithoutJourney,
    unifiedWithoutJourney,
    systemSnapshot,
    unifiedSnapshot,
    systemGraphTidy,
    unifiedGraphTidy,
    systemWire,
    unifiedWire,
  };
}

async function captureAdapterQueryWithoutJourney(callTool, unified) {
  const events = [];
  const dependencies = {
    semanticRetrievalBoundary: {
      async retrieve() {
        events.push('direct-retrieval');
        return { elements: [], relationships: [], views: [] };
      },
    },
  };
  try {
    const result = unified
      ? await callTool('getSystemArchitecture', { query: semanticQuery() }, null, dependencies)
      : await callTool('getSystemArchitecture', { query: semanticQuery() }, dependencies);
    return { events, result };
  } catch (error) {
    return { events, error: observableError(error) };
  }
}

async function captureAdapterQuery(callTool, unified) {
  const events = [];
  const dependencies = adapterDependencies(events);
  try {
    if (unified) {
      await callTool('getSystemArchitecture', { query: semanticQuery() }, null, dependencies);
    } else {
      await callTool('getSystemArchitecture', { query: semanticQuery() }, dependencies);
    }
    return { events };
  } catch (error) {
    return { events, error: observableError(error) };
  }
}

async function captureBypass(callTool, unified, args) {
  const events = [];
  const dependencies = adapterDependencies(events);
  const result = unified
    ? await callTool('getSystemArchitecture', args, null, dependencies)
    : await callTool('getSystemArchitecture', args, dependencies);
  return { events, result };
}

async function captureWire(handleRequest) {
  if (typeof handleRequest !== 'function') return { available: false };
  const events = [];
  const response = await handleRequest({
    jsonrpc: '2.0',
    id: 7,
    method: 'tools/call',
    params: {
      name: 'getSystemArchitecture',
      arguments: { query: semanticQuery() },
    },
  }, adapterDependencies(events, true));
  return { available: true, events, result: response.result };
}

function adapterDependencies(events, wire = false) {
  return {
    semanticOperatorJourney: {
      async query() {
        events.push('operator-query');
        const error = new Error('safe readiness rejection');
        error.category = wire
          ? 'SEMANTIC_INDEX_NOT_ALIGNED'
          : 'SEMANTIC_READINESS_VERIFICATION_REQUIRED';
        error.state = wire ? 'SemanticIndexPending' : undefined;
        error.verified = false;
        error.canonicalVersion = wire ? 'canonical:wire-v1' : undefined;
        error.contentVersion = wire ? 'content:wire-v1' : undefined;
        error.indexVersion = wire ? 'index:wire-v1' : undefined;
        error.completedChannels = wire ? ['Element', 'ArchitectureRelationship'] : undefined;
        error.missingChannels = wire ? ['View'] : undefined;
        error.mismatchedChannels = [];
        error.fullSnapshotFallback = false;
        error.action = wire
          ? 'Run semantic readiness after completing the missing View channel'
          : 'Run semantic readiness before semantic query';
        error.secret = SECRET_CANARY;
        error.unsafeSource = UNSAFE_SOURCE_CANARY;
        throw error;
      },
    },
    semanticRetrievalBoundary: {
      async retrieve() {
        events.push('direct-retrieval');
        return { elements: [], relationships: [], views: [] };
      },
    },
  };
}

function captureMissingDurableStoreRequirement() {
  const {
    createProductionSemanticOperatorJourney,
  } = require('../../.argo/scripts/graph-rag/semanticOperatorJourney.js');
  const dependencies = Object.fromEntries([
    'initializeWorkspace',
    'syncCanonicalStructuralProjection',
    'resolveApprovedConfiguration',
    'runSemanticBackfill',
    'readSemanticReadiness',
    'querySystemArchitecture',
  ].map(name => [name, async () => ({ name })]));
  try {
    createProductionSemanticOperatorJourney(dependencies);
    return { accepted: true, error: null };
  } catch (error) {
    return { accepted: false, error: observableError(error) };
  }
}

function runWindowsTrustPolicyScenarios(roots) {
  const scenarios = {};
  const scenarioEnvironments = {
    groupOwner: {
      SP05_ATTESTATION_OWNER_OVERRIDE: 'BUILTIN\\Administrators',
    },
    builtinUsersFile: {
      SP05_ATTESTATION_FILE_ACL_OVERRIDE: `${SAFE_WINDOWS_ACL}\r\nBUILTIN\\Users:(R)`,
    },
    builtinAdministratorsFile: {
      SP05_ATTESTATION_FILE_ACL_OVERRIDE: `${SAFE_WINDOWS_ACL}\r\nBUILTIN\\Administrators:(R)`,
    },
    authenticatedUsersFile: {
      SP05_ATTESTATION_FILE_ACL_OVERRIDE: `${SAFE_WINDOWS_ACL}\r\nAuthenticated Users:(R)`,
    },
    foreignPrincipalFile: {
      SP05_ATTESTATION_FILE_ACL_OVERRIDE: `${SAFE_WINDOWS_ACL}\r\nFOREIGN-DOMAIN\\ForeignIdentity:(M)`,
    },
    missingCurrentIdentityFile: {
      SP05_ATTESTATION_FILE_ACL_OVERRIDE: 'NT AUTHORITY\\SYSTEM:(F)',
    },
    currentIdentityDeniedFile: {
      SP05_ATTESTATION_FILE_ACL_OVERRIDE: [
        '%CURRENT_IDENTITY%:(DENY)(R,W)',
        SAFE_WINDOWS_ACL,
      ].join('\r\n'),
    },
    builtinUsersParent: {
      SP05_ATTESTATION_DIRECTORY_ACL_OVERRIDE: `${SAFE_WINDOWS_ACL}\r\nBUILTIN\\Users:(RX)`,
    },
    builtinAdministratorsParent: {
      SP05_ATTESTATION_DIRECTORY_ACL_OVERRIDE: `${SAFE_WINDOWS_ACL}\r\nBUILTIN\\Administrators:(M)`,
    },
    authenticatedUsersParent: {
      SP05_ATTESTATION_DIRECTORY_ACL_OVERRIDE: `${SAFE_WINDOWS_ACL}\r\nAuthenticated Users:(RX)`,
    },
  };
  assert(
    WINDOWS_RUNTIME_RIGHTS.every(right => WINDOWS_PROTECTED_RIGHTS.includes(right)),
    'SP05_WINDOWS_RUNTIME_RIGHT_MATRIX_INVALID',
  );
  scenarioEnvironments.foreignAllowFileAdvancedRights = {
    SP05_ATTESTATION_FILE_ACL_OVERRIDE: [
      SAFE_WINDOWS_ACL,
      `FOREIGN-DOMAIN\\ForeignIdentity:(${WINDOWS_RUNTIME_RIGHTS.join(',')})`,
    ].join('\r\n'),
  };
  scenarioEnvironments.currentDenyParentAdvancedRights = {
    SP05_ATTESTATION_DIRECTORY_ACL_OVERRIDE: [
      `%CURRENT_IDENTITY%:(DENY)(${WINDOWS_RUNTIME_RIGHTS.join(',')})`,
      SAFE_WINDOWS_ACL,
    ].join('\r\n'),
  };
  for (const [name, environment] of Object.entries(scenarioEnvironments)) {
    const workspace = createRecordedWorkspace(roots);
    scenarios[name] = scenarioResult(
      workspace,
      spawnSemanticQuery(workspace, environment),
    );
  }

  const hostAcl = readCurrentHostTempAcl();
  const hostWorkspace = createRecordedWorkspace(roots);
  scenarios.currentHostParent = {
    ...scenarioResult(hostWorkspace, spawnSemanticQuery(hostWorkspace, {
      SP05_ATTESTATION_DIRECTORY_ACL_OVERRIDE: hostAcl.stdout,
    })),
    acl: hostAcl,
  };
  return { applicable: true, scenarios };
}

function assertWindowsTrustPolicy(windowsPolicy) {
  if (!windowsPolicy.applicable) return;
  for (const [name, scenario] of Object.entries(windowsPolicy.scenarios)) {
    if (name === 'currentHostParent') {
      assert.strictEqual(
        scenario.acl.status,
        0,
        `SP05_CURRENT_HOST_ATTESTATION_ACL_UNREADABLE: ${scenario.acl.stderr}`,
      );
      assert(
        /BUILTIN\\Users/i.test(scenario.acl.stdout),
        'SP05_CURRENT_HOST_BUILTIN_USERS_ACL_PRECONDITION_MISSING',
      );
    }
    assertAclRejection(scenario, `SP05_WINDOWS_ACL_${name.toUpperCase()}`);
  }
}

function assertAclRejection(scenario, label) {
  assertStructuredProcessError(
    scenario.query,
    'SEMANTIC_READINESS_ATTESTATION_UNTRUSTED',
    label,
  );
  assert.strictEqual(
    scenario.query.output.error.action,
    ACL_REMEDIATION,
    `${label}_REMEDIATION_CHANGED`,
  );
  assertEventCounts(scenario.state.events, {
    'readiness-read': 1,
    'semantic-query': 0,
  }, label);
}

function readCurrentHostTempAcl() {
  const directoryPath = path.join(repoRoot, '.argo', 'temp');
  const result = spawnSync('icacls', [directoryPath], {
    cwd: repoRoot,
    encoding: 'utf8',
    shell: false,
    windowsHide: true,
  });
  return {
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

function createProcessWorkspace(
  roots,
  readiness,
  canonicalDocument = { elements: [], relationships: [], views: [] },
) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'argo-sp05-adapter-'));
  roots.push(root);
  const graphDirectory = path.join(root, 'design', 'KG');
  fs.mkdirSync(graphDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(graphDirectory, 'SystemArchitecture.json'),
    JSON.stringify(canonicalDocument),
  );
  const statePath = path.join(root, 'fixture-state.json');
  fs.writeFileSync(statePath, JSON.stringify({ readiness, events: [] }, null, 2));
  const aclSetup = createRestrictedAttestationDirectory(root);
  return { root, statePath, aclSetup };
}

function createRestrictedAttestationDirectory(root) {
  const directoryPath = path.join(root, '.argo', 'temp');
  fs.mkdirSync(directoryPath, { recursive: true });
  if (process.platform !== 'win32') {
    fs.chmodSync(directoryPath, 0o700);
    return { status: 0, acl: 'mode:0700', stderr: '' };
  }
  const identityResult = spawnSync('whoami', [], {
    cwd: root,
    encoding: 'utf8',
    shell: false,
    windowsHide: true,
  });
  const identity = String(identityResult.stdout || '').trim();
  if (identityResult.status !== 0 || !identity) {
    return {
      status: identityResult.status,
      acl: '',
      stderr: identityResult.stderr || 'whoami returned no identity',
    };
  }
  const commands = [
    ['/inheritance:r'],
    ['/grant:r', `${identity}:(OI)(CI)(F)`, '*S-1-5-18:(OI)(CI)(F)'],
    ['/setowner', identity],
  ];
  for (const args of commands) {
    const result = spawnSync('icacls', [directoryPath, ...args], {
      cwd: root,
      encoding: 'utf8',
      shell: false,
      windowsHide: true,
    });
    if (result.status !== 0) {
      return {
        status: result.status,
        acl: result.stdout || '',
        stderr: result.stderr || '',
      };
    }
  }
  const observed = spawnSync('icacls', [directoryPath], {
    cwd: root,
    encoding: 'utf8',
    shell: false,
    windowsHide: true,
  });
  return {
    status: observed.status,
    acl: observed.stdout || '',
    stderr: observed.stderr || '',
  };
}

function createRecordedWorkspace(roots) {
  const workspace = createProcessWorkspace(roots, VERSION_ONE_READINESS);
  workspace.readiness = spawnFixture(workspace, ['readiness']);
  return workspace;
}

function spawnSemanticQuery(workspace, environment = {}) {
  return spawnFixture(workspace, [
    'query',
    '--request-json',
    JSON.stringify(semanticQuery()),
  ], environment);
}

function ensureAttestationDirectory(workspace) {
  fs.mkdirSync(path.dirname(attestationPath(workspace)), { recursive: true });
}

function attestationPath(workspace) {
  return path.join(workspace.root, attestationRelativePath);
}

function canonicalPath(workspace) {
  return path.join(workspace.root, 'design', 'KG', 'SystemArchitecture.json');
}

function writeRawAttestation(workspace, contents) {
  ensureAttestationDirectory(workspace);
  fs.writeFileSync(attestationPath(workspace), contents);
}

function mutateAttestation(workspace, mutate) {
  const existing = readAttestation(workspace) || {
    schemaVersion: '1.0',
    verified: true,
  };
  writeRawAttestation(workspace, JSON.stringify(mutate(existing)));
}

function writeInterruptedTemporary(workspace, contents) {
  ensureAttestationDirectory(workspace);
  fs.writeFileSync(
    `${attestationPath(workspace)}.interrupted.tmp`,
    contents,
  );
}

function makeAttestationAclUntrusted(workspace) {
  if (process.platform === 'win32') {
    const result = spawnSync(
      'icacls',
      [attestationPath(workspace), '/grant', '*S-1-1-0:(R)'],
      {
        cwd: workspace.root,
        encoding: 'utf8',
        shell: false,
        windowsHide: true,
      },
    );
    return {
      status: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  }
  fs.chmodSync(attestationPath(workspace), 0o644);
  return { status: 0, stdout: '', stderr: '' };
}

function makeAttestationDirectoryAclUntrusted(workspace) {
  ensureAttestationDirectory(workspace);
  const directoryPath = path.dirname(attestationPath(workspace));
  if (process.platform === 'win32') {
    const result = spawnSync(
      'icacls',
      [directoryPath, '/grant', '*S-1-1-0:(RX)'],
      {
        cwd: workspace.root,
        encoding: 'utf8',
        shell: false,
        windowsHide: true,
      },
    );
    return {
      status: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  }
  fs.chmodSync(directoryPath, 0o755);
  return { status: 0, stdout: '', stderr: '' };
}

function scenarioResult(workspace, query) {
  return {
    query,
    state: readFixtureState(workspace),
  };
}

function spawnFixture(workspace, args, environment = {}) {
  const execution = spawnSync(
    process.execPath,
    [fixturePath, ...args],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        ARGO_REPO_ROOT: workspace.root,
        SP05_OPERATOR_WORKSPACE_ROOT: workspace.root,
        SP05_OPERATOR_STATE_PATH: workspace.statePath,
        ...(process.platform === 'win32' ? {
          SP05_ATTESTATION_OWNER_OVERRIDE: '%CURRENT_IDENTITY%',
        } : {}),
        ...environment,
      },
      windowsHide: true,
    },
  );
  return freeze({
    status: execution.status,
    stdout: execution.stdout,
    stderr: execution.stderr,
    output: parseWireOutput(execution.stdout, execution.stderr),
  });
}

function spawnPackageBackfillWithoutConsent() {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const execution = spawnSync(
    npmCommand,
    ['run', 'semantic:backfill', '--', '--request-json', '{}'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: safePackageEnvironment(),
      shell: process.platform === 'win32',
      windowsHide: true,
    },
  );
  const combined = `${execution.stdout}\n${execution.stderr}`;
  const commandLine = combined.split(/\r?\n/).find(line => (
    line.includes('semanticOperatorJourneyCli.js backfill')
  )) || '';
  return freeze({
    status: execution.status,
    commandLine,
    stdout: execution.stdout,
    stderr: execution.stderr,
  });
}

function safePackageEnvironment() {
  const environment = {};
  for (const key of ['PATH', 'Path', 'PATHEXT', 'SystemRoot', 'WINDIR']) {
    if (process.env[key] !== undefined) environment[key] = process.env[key];
  }
  environment.ARGO_REPO_ROOT = repoRoot;
  return environment;
}

function writeReadiness(workspace, readiness) {
  const state = readFixtureState(workspace);
  state.readiness = readiness;
  fs.writeFileSync(workspace.statePath, JSON.stringify(state, null, 2));
}

function readFixtureState(workspace) {
  return JSON.parse(fs.readFileSync(workspace.statePath, 'utf8'));
}

function readAttestation(workspace) {
  const filePath = attestationPath(workspace);
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : null;
}

function parseWireOutput(stdout, stderr) {
  for (const source of [stdout, stderr]) {
    const lines = String(source || '').trim().split(/\r?\n/).reverse();
    for (const line of lines) {
      try {
        return JSON.parse(line);
      } catch {
        // Continue to the next line.
      }
    }
  }
  return null;
}

function assertProcessPassed(result, category) {
  assert.strictEqual(result.status, 0, `${category}: ${result.stderr || result.stdout}`);
  assert(result.output, `${category}_OUTPUT_MISSING`);
}

function assertStructuredProcessError(result, category, label) {
  assert.notStrictEqual(result.status, 0, `${label}_UNEXPECTED_SUCCESS`);
  assert(result.output && result.output.error, `${label}_STRUCTURED_ERROR_MISSING`);
  assert.deepStrictEqual(
    Object.keys(result.output.error).sort(),
    ERROR_ENVELOPE_KEYS,
    `${label}_ERROR_ENVELOPE_CHANGED`,
  );
  assert.strictEqual(result.output.error.category, category, `${label}_CATEGORY_CHANGED`);
  assert.strictEqual(
    typeof result.output.error.verified,
    'boolean',
    `${label}_VERIFIED_DIAGNOSTIC_MISSING`,
  );
  assert.strictEqual(
    result.output.error.fullSnapshotFallback,
    false,
    `${label}_FULL_SNAPSHOT_FALLBACK_CHANGED`,
  );
  assert(
    typeof result.output.error.action === 'string' && result.output.error.action.trim() !== '',
    `${label}_ACTION_MISSING`,
  );
  for (const channelField of ['completedChannels', 'missingChannels', 'mismatchedChannels']) {
    assert(Array.isArray(result.output.error[channelField]), `${label}_${channelField.toUpperCase()}_MISSING`);
  }
  const serialized = JSON.stringify(result.output);
  assert(!serialized.includes(SECRET_CANARY), `${label}_SECRET_LEAK`);
  assert(!serialized.includes(UNSAFE_SOURCE_CANARY), `${label}_UNSAFE_SOURCE_LEAK`);
  assert(!serialized.includes('\n    at '), `${label}_STACK_LEAK`);
  assert(!Object.prototype.hasOwnProperty.call(result.output.error, 'message'), `${label}_RAW_MESSAGE_LEAK`);
}

function assertNoEvents(events, forbidden, label) {
  for (const kind of forbidden) {
    assert.strictEqual(
      events.filter(event => event.kind === kind).length,
      0,
      `${label}_${kind.toUpperCase()}_EFFECT`,
    );
  }
}

function assertEventCounts(events, expectedCounts, label) {
  for (const [kind, count] of Object.entries(expectedCounts)) {
    assert.strictEqual(
      events.filter(event => event.kind === kind).length,
      count,
      `${label}_${kind.toUpperCase()}_COUNT_CHANGED`,
    );
  }
}

function semanticQuery() {
  return {
    purpose: 'implementation-design',
    intent: 'Verify adapter readiness lifecycle',
  };
}

function observableError(error) {
  const observed = {};
  for (const key of Object.getOwnPropertyNames(error || {})) observed[key] = error[key];
  return observed;
}

function freeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) freeze(nested);
  return Object.freeze(value);
}

module.exports = {
  assertProductionSemanticOperatorAdapterLifecycle,
  runProductionSemanticOperatorAdapterLifecycle,
};

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const runtimeDirectory = path.join(repoRoot, '.argo', 'scripts', 'graph-rag');
const authorizedCommandAdapter = 'systemMetadataCommandAdapter.js';

// GIVEN every present production Graph RAG JavaScript module
const runtimeFiles = fs.readdirSync(runtimeDirectory)
  .filter(file => file.endsWith('.js'));

// WHEN production dependency declarations are inspected
for (const runtimeFile of runtimeFiles) {
  const source = fs.readFileSync(path.join(runtimeDirectory, runtimeFile), 'utf8');

  // THEN dependencies point inward and never couple production to tests, Python, or Neo4j plugin procedures
  assert(
    !/require\(['"][^'"]*tests[\\/]/.test(source) && !/from\s+['"][^'"]*tests[\\/]/.test(source),
    `PRODUCTION_GRAPH_RAG_DEPENDENCY_DIRECTION_GUARD: ${runtimeFile} must not depend on tests`,
  );
  assert(
    !/(?:require\(['"](?:node:)?child_process['"]\)|from\s+['"](?:node:)?child_process['"])/.test(source)
      || runtimeFile === authorizedCommandAdapter,
    `PRODUCTION_GRAPH_RAG_DEPENDENCY_DIRECTION_GUARD: ${runtimeFile} must not own system commands`,
  );
  assert(
    !/(?:require\(['"][^'"]*python[^'"]*['"]\)|\bpython(?:3)?\s*(?:,|\)|\]))/i.test(source),
    `PRODUCTION_GRAPH_RAG_DEPENDENCY_DIRECTION_GUARD: ${runtimeFile} must not require Python`,
  );
  assert(
    !/ai\.text\.embed|genai\.vector\.encode/i.test(source),
    `PRODUCTION_GRAPH_RAG_DEPENDENCY_DIRECTION_GUARD: ${runtimeFile} must not call Neo4j embedding plugins`,
  );
}

const authorizedAdapterPath = path.join(runtimeDirectory, authorizedCommandAdapter);
(async () => {
if (fs.existsSync(authorizedAdapterPath)) {
  const adapterSource = fs.readFileSync(authorizedAdapterPath, 'utf8');
  assert(!/\bexec(?:File|FileSync|Sync)?\s*\(|\bspawn\s*\(/.test(adapterSource), 'SYSTEM_METADATA_COMMAND_GUARD: only spawnSync is allowed');
  assert(!/shell\s*:\s*true/.test(adapterSource), 'SYSTEM_METADATA_COMMAND_GUARD: shell execution is prohibited');
  assert(!/(?:node:)?(?:http|https|net|tls)|\bfetch\s*\(/.test(adapterSource), 'SYSTEM_METADATA_COMMAND_GUARD: network commands are prohibited');
  assert(!/QWEN_KEY|ARGO_NEO4J_DATABASE_PASSWORD/.test(adapterSource), 'SYSTEM_METADATA_COMMAND_GUARD: adapter must not know secret fields');
  const {
    createSystemMetadataCommandAdapter,
    withSystemMetadataCommandTestComposition,
  } = require(authorizedAdapterPath);
  assert.strictEqual(typeof createSystemMetadataCommandAdapter, 'function', 'SYSTEM_METADATA_COMMAND_GUARD: adapter factory missing');
  assert.strictEqual(typeof withSystemMetadataCommandTestComposition, 'function', 'SYSTEM_METADATA_COMMAND_GUARD: private test composition missing');

  let directExecutorCalls = 0;
  assert.throws(
    () => createSystemMetadataCommandAdapter({
      repositoryRoot: repoRoot,
      executeMetadataCommand() {
        directExecutorCalls += 1;
      },
    }),
    exactProhibitedCategory,
    'SYSTEM_METADATA_COMMAND_GUARD: production factory accepted executor injection',
  );
  assert.strictEqual(directExecutorCalls, 0, 'SYSTEM_METADATA_COMMAND_GUARD: rejected production injection executed');

  const safeInvocations = [];
  let escapedSafeAdapter;
  const compositionResult = await withSystemMetadataCommandTestComposition({
    repositoryRoot: repoRoot,
    executeMetadataCommand(executable, args, options) {
      safeInvocations.push({ executable, args, options });
      return { status: 0, stdout: executable === 'whoami' ? 'DOMAIN\\User\r\n' : 'metadata-only\r\n', stderr: '' };
    },
  }, adapter => {
    escapedSafeAdapter = adapter;
    assertAdapterReflectionSurface(adapter);
    adapter.isSecretFileIgnored();
    adapter.isSecretFileTracked();
    adapter.readCurrentIdentity();
    adapter.readSecretFileAcl();
    return {
      adapter,
      executor: () => safeInvocations,
      capability: adapter.isSecretFileIgnored,
    };
  });
  assert.strictEqual(compositionResult, undefined, 'SYSTEM_METADATA_COMMAND_GUARD: test composition leaked callback return');
  assert.deepStrictEqual(
    safeInvocations.map(({ executable, args }) => ({ executable, args })),
    [
      { executable: 'git', args: ['check-ignore', '--quiet', '--', '.argo/.env'] },
      { executable: 'git', args: ['ls-files', '--error-unmatch', '--', '.argo/.env'] },
      { executable: 'whoami', args: [] },
      { executable: 'icacls', args: [path.join(repoRoot, '.argo', '.env')] },
    ],
    'SYSTEM_METADATA_COMMAND_GUARD: safe templates changed',
  );
  for (const invocation of safeInvocations) {
    assert.deepStrictEqual(Object.keys(invocation.options).sort(), ['cwd', 'encoding', 'env', 'shell', 'windowsHide']);
    assert.strictEqual(invocation.options.cwd, repoRoot);
    assert.strictEqual(invocation.options.encoding, 'utf8');
    assert.strictEqual(invocation.options.shell, false);
    assert.strictEqual(invocation.options.windowsHide, true);
    assert.deepStrictEqual(
      Object.keys(invocation.options.env).sort(),
      Object.keys(invocation.options.env).sort().filter(key => ['PATH', 'PATHEXT', 'SystemRoot', 'WINDIR'].includes(key)),
    );
  }
  const safeCallsAtRevocation = safeInvocations.length;
  assertAdapterRevoked(escapedSafeAdapter, safeCallsAtRevocation, () => safeInvocations.length);

  let thrownAdapter;
  let thrownExecutorCalls = 0;
  const callbackFailure = new Error('synthetic-callback-failure');
  await assert.rejects(
    Promise.resolve().then(() => withSystemMetadataCommandTestComposition({
      repositoryRoot: repoRoot,
      executeMetadataCommand() {
        thrownExecutorCalls += 1;
        return { status: 0, stdout: '', stderr: '' };
      },
    }, adapter => {
      thrownAdapter = adapter;
      throw callbackFailure;
    })),
    error => error === callbackFailure,
    'SYSTEM_METADATA_COMMAND_GUARD: callback failure was replaced',
  );
  assertAdapterRevoked(thrownAdapter, 0, () => thrownExecutorCalls);

  let rejectedAdapter;
  let rejectedExecutorCalls = 0;
  const asyncFailure = new Error('synthetic-async-callback-failure');
  await assert.rejects(
    withSystemMetadataCommandTestComposition({
      repositoryRoot: repoRoot,
      executeMetadataCommand() {
        rejectedExecutorCalls += 1;
        return { status: 0, stdout: '', stderr: '' };
      },
    }, async adapter => {
      rejectedAdapter = adapter;
      await Promise.resolve();
      throw asyncFailure;
    }),
    error => error === asyncFailure,
    'SYSTEM_METADATA_COMMAND_GUARD: async callback rejection was replaced',
  );
  assertAdapterRevoked(rejectedAdapter, 0, () => rejectedExecutorCalls);

  let outerAdapter;
  let innerAdapter;
  let nestedExecutorCalls = 0;
  await withSystemMetadataCommandTestComposition({
    repositoryRoot: repoRoot,
    executeMetadataCommand() {
      nestedExecutorCalls += 1;
      return { status: 0, stdout: 'metadata-only\r\n', stderr: '' };
    },
  }, async adapter => {
    outerAdapter = adapter;
    assertAdapterReflectionSurface(outerAdapter);
    await withSystemMetadataCommandTestComposition({
      repositoryRoot: repoRoot,
      executeMetadataCommand() {
        nestedExecutorCalls += 1;
        return { status: 0, stdout: 'metadata-only\r\n', stderr: '' };
      },
    }, nested => {
      innerAdapter = nested;
      assertAdapterReflectionSurface(innerAdapter);
      assertAdaptersDoNotShareCapability(outerAdapter, innerAdapter);
      outerAdapter.isSecretFileIgnored();
      innerAdapter.isSecretFileIgnored();
    });
    assertAdapterRevoked(innerAdapter, nestedExecutorCalls, () => nestedExecutorCalls);
    outerAdapter.isSecretFileTracked();
  });
  assertAdapterRevoked(outerAdapter, nestedExecutorCalls, () => nestedExecutorCalls);

  let firstRepeatedAdapter;
  let secondRepeatedAdapter;
  let repeatedExecutorCalls = 0;
  await withSystemMetadataCommandTestComposition({
    repositoryRoot: repoRoot,
    executeMetadataCommand() {
      repeatedExecutorCalls += 1;
      return { status: 0, stdout: 'metadata-only\r\n', stderr: '' };
    },
  }, adapter => {
    firstRepeatedAdapter = adapter;
  });
  await withSystemMetadataCommandTestComposition({
    repositoryRoot: repoRoot,
    executeMetadataCommand() {
      repeatedExecutorCalls += 1;
      return { status: 0, stdout: 'metadata-only\r\n', stderr: '' };
    },
  }, adapter => {
    secondRepeatedAdapter = adapter;
    assertAdaptersDoNotShareCapability(firstRepeatedAdapter, secondRepeatedAdapter);
    assertAdapterRevoked(firstRepeatedAdapter, repeatedExecutorCalls, () => repeatedExecutorCalls);
    secondRepeatedAdapter.isSecretFileIgnored();
  });
  assertAdapterRevoked(secondRepeatedAdapter, repeatedExecutorCalls, () => repeatedExecutorCalls);

  const secretCanary = 'synthetic-command-secret';
  const bypassFixtures = [
    { name: 'capability-path-argument', capability: 'readSecretFileAcl', capabilityArgs: ['C:\\alternate\\.env'] },
    { name: 'capability-flags-argument', capability: 'isSecretFileIgnored', capabilityArgs: ['--verbose'] },
    { name: 'capability-executable-argument', capability: 'readCurrentIdentity', capabilityArgs: ['python'] },
    { name: 'capability-shell-argument', capability: 'isSecretFileTracked', capabilityArgs: [{ shell: true }] },
    { name: 'capability-stdin-argument', capability: 'readSecretFileAcl', capabilityArgs: [{ input: secretCanary }] },
    { name: 'capability-env-argument', capability: 'isSecretFileIgnored', capabilityArgs: [{ env: { QWEN_KEY: secretCanary } }] },
    { name: 'capability-secret-argument', capability: 'readCurrentIdentity', capabilityArgs: [secretCanary] },
    { name: 'path-injection', mutate: request => ({ ...request, args: [...request.args.slice(0, -1), '.argo/.env;whoami'] }) },
    { name: 'extra-flags', mutate: request => ({ ...request, args: [...request.args.slice(0, 2), '--verbose', ...request.args.slice(2)] }) },
    { name: 'dynamic-argv', mutate: request => ({ ...request, args: [...request.args, `${Date.now()}`] }) },
    { name: 'concatenated-command', mutate: request => ({ ...request, executable: `${request.executable} whoami` }) },
    { name: 'python-sidecar', mutate: request => ({ ...request, executable: 'python', args: ['-c', 'print(1)'] }) },
    { name: 'pwsh-sidecar', mutate: request => ({ ...request, executable: 'pwsh', args: ['-Command', 'whoami'] }) },
    { name: 'powershell-sidecar', mutate: request => ({ ...request, executable: 'powershell', args: ['-Command', 'whoami'] }) },
    { name: 'cmd-sidecar', mutate: request => ({ ...request, executable: 'cmd', args: ['/c', 'whoami'] }) },
    { name: 'node-sidecar', mutate: request => ({ ...request, executable: 'node', args: ['metadata-sidecar.js'] }) },
    { name: 'network-command', mutate: request => ({ ...request, executable: 'curl', args: ['https://example.invalid'] }) },
    { name: 'arbitrary-executable', mutate: request => ({ ...request, executable: 'arbitrary.exe' }) },
    { name: 'secret-argv', mutate: request => ({ ...request, args: [...request.args, secretCanary] }) },
    { name: 'secret-env-key', mutate: request => ({ ...request, options: { ...request.options, env: { ...request.options.env, QWEN_KEY: secretCanary } } }) },
    { name: 'secret-env-value', mutate: request => ({ ...request, options: { ...request.options, env: { ...request.options.env, PATH: secretCanary } } }) },
    { name: 'shell-true', mutate: request => ({ ...request, options: { ...request.options, shell: true } }) },
    { name: 'stdin-secret', mutate: request => ({ ...request, options: { ...request.options, input: secretCanary } }) },
  ];
  for (const fixture of bypassFixtures) {
    let executorCalls = 0;
    assert.throws(
      () => withSystemMetadataCommandTestComposition({
        repositoryRoot: repoRoot,
        forbiddenValues: [secretCanary],
        mutateInvocation: fixture.mutate,
        executeMetadataCommand() {
          executorCalls += 1;
          return { status: 0, stdout: '', stderr: '' };
        },
      }, adapter => adapter[fixture.capability || 'isSecretFileIgnored'](...(fixture.capabilityArgs || []))),
      exactProhibitedCategory,
      `SYSTEM_METADATA_COMMAND_GUARD: production adapter allowed ${fixture.name}`,
    );
    assert.strictEqual(executorCalls, 0, `SYSTEM_METADATA_COMMAND_GUARD: rejected ${fixture.name} reached executor`);
  }
}
})().catch(error => {
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
});

function exactProhibitedCategory(error) {
  return error && error.category === 'SYSTEM_METADATA_COMMAND_PROHIBITED';
}

function exactRevokedCategory(error) {
  return error && error.category === 'TEST_SYSTEM_METADATA_ADAPTER_REVOKED';
}

function assertAdapterReflectionSurface(adapter) {
  const capabilityNames = [
    'isSecretFileIgnored',
    'isSecretFileTracked',
    'readCurrentIdentity',
    'readSecretFileAcl',
  ].sort();
  assert.strictEqual(Object.getPrototypeOf(adapter), null, 'SYSTEM_METADATA_COMMAND_GUARD: adapter prototype must be null');
  assert.strictEqual(Object.isFrozen(adapter), true, 'SYSTEM_METADATA_COMMAND_GUARD: adapter must be frozen');
  assert.deepStrictEqual(Object.getOwnPropertyNames(adapter).sort(), capabilityNames);
  assert.deepStrictEqual(Object.getOwnPropertySymbols(adapter), []);
  const descriptors = Object.getOwnPropertyDescriptors(adapter);
  for (const name of capabilityNames) {
    const descriptor = descriptors[name];
    assert.strictEqual(typeof descriptor.value, 'function', `SYSTEM_METADATA_COMMAND_GUARD: ${name} is not callable`);
    assert.strictEqual(descriptor.writable, false, `SYSTEM_METADATA_COMMAND_GUARD: ${name} is writable`);
    assert.strictEqual(descriptor.configurable, false, `SYSTEM_METADATA_COMMAND_GUARD: ${name} is configurable`);
    assert.strictEqual(descriptor.enumerable, true, `SYSTEM_METADATA_COMMAND_GUARD: ${name} is hidden from enumeration`);
    assert.strictEqual(Object.isFrozen(descriptor.value), true, `SYSTEM_METADATA_COMMAND_GUARD: ${name} function is mutable`);
    assert.strictEqual(Object.getPrototypeOf(descriptor.value), Function.prototype);
    assert.deepStrictEqual(Object.getOwnPropertySymbols(descriptor.value), []);
    assert.deepStrictEqual(Object.getOwnPropertyNames(descriptor.value).sort(), ['length', 'name']);
  }
}

function assertAdaptersDoNotShareCapability(left, right) {
  assert.notStrictEqual(left, right, 'SYSTEM_METADATA_COMMAND_GUARD: compositions shared adapter identity');
  for (const name of Object.getOwnPropertyNames(left)) {
    assert.notStrictEqual(left[name], right[name], `SYSTEM_METADATA_COMMAND_GUARD: compositions shared ${name}`);
  }
}

function assertAdapterRevoked(adapter, expectedCalls, readExecutorCalls) {
  for (const name of Object.getOwnPropertyNames(adapter)) {
    assert.throws(
      () => adapter[name](),
      exactRevokedCategory,
      `SYSTEM_METADATA_COMMAND_GUARD: escaped ${name} remained callable`,
    );
    assert.strictEqual(readExecutorCalls(), expectedCalls, `SYSTEM_METADATA_COMMAND_GUARD: revoked ${name} reached executor`);
  }
}

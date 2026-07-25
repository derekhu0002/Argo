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
if (fs.existsSync(authorizedAdapterPath)) {
  const adapterSource = fs.readFileSync(authorizedAdapterPath, 'utf8');
  assert(!/\bexec(?:File|FileSync|Sync)?\s*\(|\bspawn\s*\(/.test(adapterSource), 'SYSTEM_METADATA_COMMAND_GUARD: only spawnSync is allowed');
  assert(!/shell\s*:\s*true/.test(adapterSource), 'SYSTEM_METADATA_COMMAND_GUARD: shell execution is prohibited');
  assert(!/(?:node:)?(?:http|https|net|tls)|\bfetch\s*\(/.test(adapterSource), 'SYSTEM_METADATA_COMMAND_GUARD: network commands are prohibited');
  assert(!/QWEN_KEY|ARGO_NEO4J_DATABASE_PASSWORD/.test(adapterSource), 'SYSTEM_METADATA_COMMAND_GUARD: adapter must not know secret fields');
  const { createSystemMetadataCommandAdapter } = require(authorizedAdapterPath);
  assert.strictEqual(typeof createSystemMetadataCommandAdapter, 'function', 'SYSTEM_METADATA_COMMAND_GUARD: adapter factory missing');
  const invocations = [];
  const adapter = createSystemMetadataCommandAdapter({
    repositoryRoot: repoRoot,
    executeMetadataCommand(executable, args, options) {
      invocations.push({ executable, args, options });
      return { status: 0, stdout: executable === 'whoami' ? 'DOMAIN\\User\r\n' : 'metadata-only\r\n', stderr: '' };
    },
  });
  assert.strictEqual(typeof adapter.isSecretFileIgnored, 'function');
  assert.strictEqual(typeof adapter.isSecretFileTracked, 'function');
  assert.strictEqual(typeof adapter.readCurrentIdentity, 'function');
  assert.strictEqual(typeof adapter.readSecretFileAcl, 'function');
  adapter.isSecretFileIgnored();
  adapter.isSecretFileTracked();
  adapter.readCurrentIdentity();
  adapter.readSecretFileAcl();
  assert.strictEqual(invocations.length, 4, 'SYSTEM_METADATA_COMMAND_GUARD: expected exactly four metadata commands');
  for (const invocation of invocations) {
    validateMetadataCommandRequest(invocation, {
      repoRoot,
      secretFilePath: path.join(repoRoot, '.argo', '.env'),
    });
  }
}

const secretFilePath = path.join(repoRoot, '.argo', '.env');
const secretCanary = 'synthetic-command-secret';
const safeOptions = Object.freeze({
  cwd: repoRoot,
  encoding: 'utf8',
  windowsHide: true,
  shell: false,
  env: Object.freeze({ SystemRoot: 'C:\\Windows', PATH: 'C:\\safe-bin', PATHEXT: '.EXE' }),
});
const safeMetadataCommands = [
  { executable: 'git', args: ['check-ignore', '--quiet', '--', '.argo/.env'], options: safeOptions },
  { executable: 'git', args: ['ls-files', '--error-unmatch', '--', '.argo/.env'], options: safeOptions },
  { executable: 'whoami', args: [], options: safeOptions },
  { executable: 'icacls', args: [secretFilePath], options: safeOptions },
];
for (const command of safeMetadataCommands) {
  assert.doesNotThrow(
    () => validateMetadataCommandRequest(command, { repoRoot, secretFilePath, forbiddenValues: [secretCanary] }),
    `PRODUCTION_GRAPH_RAG_DEPENDENCY_DIRECTION_GUARD: rejected safe metadata command ${command.executable}`,
  );
}

const bypassMetadataCommands = [
  { ...safeMetadataCommands[0], options: { ...safeOptions, shell: true } },
  { ...safeMetadataCommands[0], args: ['check-ignore', '--quiet', '--verbose', '--', '.argo/.env'] },
  { ...safeMetadataCommands[0], args: ['check-ignore', '--quiet', '--', '.argo/.env;whoami'] },
  { executable: 'python', args: ['-c', 'print(1)'], options: safeOptions },
  { executable: 'pwsh', args: ['-Command', 'whoami'], options: safeOptions },
  { executable: 'powershell', args: ['-Command', 'whoami'], options: safeOptions },
  { executable: 'cmd', args: ['/c', 'whoami'], options: safeOptions },
  { executable: 'node', args: ['metadata-sidecar.js'], options: safeOptions },
  { executable: 'curl', args: ['https://example.invalid'], options: safeOptions },
  { ...safeMetadataCommands[0], args: ['check-ignore', '--quiet', '--', secretCanary] },
  { ...safeMetadataCommands[0], options: { ...safeOptions, env: { ...safeOptions.env, QWEN_KEY: secretCanary } } },
  { ...safeMetadataCommands[0], options: { ...safeOptions, env: { ...safeOptions.env, PATH: secretCanary } } },
  { ...safeMetadataCommands[0], options: { ...safeOptions, input: secretCanary } },
];
for (const command of bypassMetadataCommands) {
  assert.throws(
    () => validateMetadataCommandRequest(command, { repoRoot, secretFilePath, forbiddenValues: [secretCanary] }),
    error => error && error.category === 'SYSTEM_METADATA_COMMAND_PROHIBITED',
    `PRODUCTION_GRAPH_RAG_DEPENDENCY_DIRECTION_GUARD: allowed command bypass ${command.executable}`,
  );
}

function validateMetadataCommandRequest(command, context) {
  const deny = () => {
    const error = new Error('SYSTEM_METADATA_COMMAND_PROHIBITED');
    error.category = 'SYSTEM_METADATA_COMMAND_PROHIBITED';
    throw error;
  };
  if (!command || typeof command !== 'object' || Array.isArray(command)) deny();
  if (!exactKeys(command, ['args', 'executable', 'options'])) deny();
  if (typeof command.executable !== 'string' || !Array.isArray(command.args)) deny();
  if (!command.args.every(arg => typeof arg === 'string' && !/[\0\r\n]/.test(arg))) deny();
  const allowedTemplates = [
    ['git', ['check-ignore', '--quiet', '--', '.argo/.env']],
    ['git', ['ls-files', '--error-unmatch', '--', '.argo/.env']],
    ['whoami', []],
    ['icacls', [context.secretFilePath]],
  ];
  if (!allowedTemplates.some(([executable, args]) => (
    command.executable === executable && sameArray(command.args, args)
  ))) deny();
  const options = command.options;
  if (!options || typeof options !== 'object' || Array.isArray(options)) deny();
  if (!exactKeys(options, ['cwd', 'encoding', 'env', 'shell', 'windowsHide'])) deny();
  if (options.cwd !== context.repoRoot || options.encoding !== 'utf8'
      || options.windowsHide !== true || options.shell !== false) deny();
  if (!options.env || typeof options.env !== 'object' || Array.isArray(options.env)) deny();
  const allowedEnvironmentKeys = new Set(['PATH', 'PATHEXT', 'SystemRoot', 'WINDIR']);
  if (Object.keys(options.env).some(key => !allowedEnvironmentKeys.has(key))) deny();
  if (Object.values(options.env).some(value => typeof value !== 'string')) deny();
  const forbiddenValues = Array.isArray(context.forbiddenValues) ? context.forbiddenValues : [];
  if (forbiddenValues.some(secret => (
    typeof secret === 'string' && secret.length > 0
      && (command.args.some(arg => arg.includes(secret))
        || Object.values(options.env).some(value => value.includes(secret)))
  ))) deny();
  return true;
}

function exactKeys(value, keys) {
  return sameArray(Object.keys(value).sort(), [...keys].sort());
}

function sameArray(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ATTESTATION_PATH = '.argo/temp/semantic-readiness-attestation.json';
const SCHEMA_VERSION = '1.0';
const FIELDS = Object.freeze([
  'schemaVersion',
  'authorizationOperation',
  'graphPath',
  'verified',
  'canonicalVersion',
  'contentVersion',
  'indexVersion',
  'completedChannels',
  'missingChannels',
  'mismatchedChannels',
  'fullSnapshotFallback',
  'canonicalDigest',
  'integrityDigest',
]);

function createSemanticReadinessAttestationStore(options = {}) {
  const repositoryRoot = path.resolve(options.repositoryRoot);
  const graphPath = normalizeGraphPath(options.graphPath);
  const metadataAdapter = options.metadataAdapter;
  const attestationPath = path.join(repositoryRoot, ...ATTESTATION_PATH.split('/'));
  const directoryPath = path.dirname(attestationPath);
  const canonicalPath = path.join(repositoryRoot, ...graphPath.split('/'));

  return Object.freeze({
    record(readiness) {
      const record = buildRecord(readiness, {
        repositoryRoot,
        graphPath,
        canonicalPath,
      });
      writeAttestationAtomically(record, {
        attestationPath,
        directoryPath,
        metadataAdapter,
      });
      return Object.freeze(record);
    },

    read() {
      if (!fs.existsSync(attestationPath)) return null;
      assertPathTrust(attestationPath, directoryPath);
      let record;
      try {
        record = JSON.parse(fs.readFileSync(attestationPath, 'utf8'));
      } catch {
        throw attestationError('SEMANTIC_READINESS_ATTESTATION_INVALID');
      }
      assertRecord(record, repositoryRoot);
      assertOperatingSystemTrust({
        attestationPath,
        directoryPath,
        metadataAdapter,
      });
      if (digestFile(canonicalPath) !== record.canonicalDigest) {
        throw attestationError('SEMANTIC_READINESS_ATTESTATION_STALE');
      }
      return Object.freeze(record);
    },

    clear() {
      try {
        fs.rmSync(attestationPath, { force: true });
      } catch {
        throw attestationError('SEMANTIC_READINESS_ATTESTATION_INVALID');
      }
    },

    validate(attestation, readiness) {
      assertOperatingSystemTrust({
        attestationPath,
        directoryPath,
        metadataAdapter,
      });
      if (digestFile(canonicalPath) !== attestation.canonicalDigest) return false;
      return exactReadinessMatch(attestation, readiness);
    },
  });
}

function buildRecord(readiness, context) {
  const record = {
    schemaVersion: SCHEMA_VERSION,
    authorizationOperation: 'verifyReadiness',
    graphPath: context.graphPath,
    verified: readiness.verified === true,
    canonicalVersion: readiness.canonicalVersion,
    contentVersion: readiness.contentVersion,
    indexVersion: readiness.indexVersion,
    completedChannels: copyChannels(readiness.completedChannels),
    missingChannels: copyChannels(readiness.missingChannels),
    mismatchedChannels: copyChannels(readiness.mismatchedChannels),
    fullSnapshotFallback: false,
    canonicalDigest: digestFile(context.canonicalPath),
  };
  record.integrityDigest = integrityDigest(record, context.repositoryRoot);
  assertRecord(record, context.repositoryRoot);
  return record;
}

function writeAttestationAtomically(readiness, context) {
  fs.mkdirSync(context.directoryPath, { recursive: true, mode: 0o700 });
  assertPathTrust(undefined, context.directoryPath);
  const temporaryPath = `${context.attestationPath}.${process.pid}.${crypto.randomBytes(12).toString('hex')}.tmp`;
  let descriptor;
  try {
    descriptor = fs.openSync(temporaryPath, 'wx', 0o600);
    fs.writeSync(descriptor, `${JSON.stringify(readiness)}\n`, null, 'utf8');
    fs.fsyncSync(descriptor);
    fs.closeSync(descriptor);
    descriptor = undefined;
    fs.renameSync(temporaryPath, context.attestationPath);
    assertMetadataResult(context.metadataAdapter.readReadinessAttestationAcl());
    assertMetadataResult(context.metadataAdapter.readReadinessAttestationOwner());
    assertOperatingSystemTrust(context);
    if (process.platform === 'win32') {
      if (path.dirname(temporaryPath) !== path.dirname(context.attestationPath)) {
        throw attestationError('ATTESTATION_RENAME_VOLUME_CHANGED');
      }
      recordDirectoryFlushFallback('WINDOWS_DIRECTORY_FSYNC_UNSUPPORTED_SAME_DIRECTORY_RENAME');
    } else {
      const directoryDescriptor = fs.openSync(path.dirname(context.attestationPath), 'r');
      fs.fsyncSync(directoryDescriptor);
      fs.closeSync(directoryDescriptor);
    }
    return readiness;
  } catch (error) {
    if (descriptor !== undefined) {
      try {
        fs.closeSync(descriptor);
      } catch {}
    }
    try {
      fs.rmSync(temporaryPath, { force: true });
    } catch {}
    if (error && error.category) throw error;
    throw attestationError('SEMANTIC_READINESS_ATTESTATION_UNTRUSTED');
  }
}

function assertRecord(record, repositoryRoot) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw attestationError('SEMANTIC_READINESS_ATTESTATION_INVALID');
  }
  if (
    Object.keys(record).sort().join('\n') !== [...FIELDS].sort().join('\n')
    || record.schemaVersion !== SCHEMA_VERSION
    || record.authorizationOperation !== 'verifyReadiness'
    || record.verified !== true
    || record.fullSnapshotFallback !== false
    || !isString(record.graphPath)
    || !isString(record.canonicalVersion)
    || !isString(record.contentVersion)
    || !isString(record.indexVersion)
    || !isString(record.canonicalDigest)
    || !isString(record.integrityDigest)
    || !areChannels(record.completedChannels)
    || !areChannels(record.missingChannels)
    || !areChannels(record.mismatchedChannels)
    || record.integrityDigest !== integrityDigest(record, repositoryRoot)
  ) {
    throw attestationError('SEMANTIC_READINESS_ATTESTATION_INVALID');
  }
}

function assertPathTrust(attestationPath, directoryPath) {
  let directory;
  try {
    directory = fs.lstatSync(directoryPath);
  } catch {
    throw attestationError('SEMANTIC_READINESS_ATTESTATION_UNTRUSTED');
  }
  if (!directory.isDirectory() || directory.isSymbolicLink()) {
    throw attestationError('SEMANTIC_READINESS_ATTESTATION_UNTRUSTED');
  }
  if (!attestationPath) return;
  let file;
  try {
    file = fs.lstatSync(attestationPath);
  } catch {
    throw attestationError('SEMANTIC_READINESS_ATTESTATION_UNTRUSTED');
  }
  if (!file.isFile() || file.isSymbolicLink()) {
    throw attestationError('SEMANTIC_READINESS_ATTESTATION_UNTRUSTED');
  }
}

function assertOperatingSystemTrust(context) {
  assertPathTrust(context.attestationPath, context.directoryPath);
  if (process.platform === 'win32') {
    const identity = assertCommandSucceeded(context.metadataAdapter, 'readCurrentIdentity');
    const directoryAcl = assertCommandSucceeded(
      context.metadataAdapter,
      'readReadinessAttestationDirectoryAcl',
    );
    const fileAcl = assertCommandSucceeded(context.metadataAdapter, 'readReadinessAttestationAcl');
    const owner = assertCommandSucceeded(
      context.metadataAdapter,
      'readReadinessAttestationOwner',
    );
    if (
      !ownerMatchesIdentity(identity, owner)
      || hasBroadWindowsAcl(directoryAcl)
      || hasBroadWindowsAcl(fileAcl)
    ) {
      throw attestationError('SEMANTIC_READINESS_ATTESTATION_UNTRUSTED');
    }
    return;
  }
  const file = fs.lstatSync(context.attestationPath);
  const directory = fs.lstatSync(context.directoryPath);
  if (
    (file.mode & 0o077) !== 0
    || (directory.mode & 0o077) !== 0
    || (typeof process.getuid === 'function'
      && (file.uid !== process.getuid() || directory.uid !== process.getuid()))
  ) {
    throw attestationError('SEMANTIC_READINESS_ATTESTATION_UNTRUSTED');
  }
}

function assertCommandSucceeded(adapter, capability) {
  if (!adapter || typeof adapter[capability] !== 'function') {
    throw attestationError('SEMANTIC_READINESS_ATTESTATION_UNTRUSTED');
  }
  const result = adapter[capability]();
  if (!result || result.status !== 0 || typeof result.stdout !== 'string') {
    throw attestationError('SEMANTIC_READINESS_ATTESTATION_UNTRUSTED');
  }
  return result.stdout;
}

function assertMetadataResult(result) {
  if (!result || result.status !== 0 || typeof result.stdout !== 'string') {
    throw attestationError('SEMANTIC_READINESS_ATTESTATION_UNTRUSTED');
  }
  return result.stdout;
}

function exactReadinessMatch(attestation, readiness) {
  return Boolean(
    readiness
    && readiness.verified === true
    && attestation.canonicalVersion === readiness.canonicalVersion
    && attestation.contentVersion === readiness.contentVersion
    && attestation.indexVersion === readiness.indexVersion
    && sameArray(attestation.completedChannels, readiness.completedChannels)
    && sameArray(attestation.missingChannels, readiness.missingChannels)
    && sameArray(attestation.mismatchedChannels, readiness.mismatchedChannels)
    && readiness.fullSnapshotFallback === false
  );
}

function integrityDigest(record, repositoryRoot) {
  const evidence = {};
  for (const field of FIELDS) {
    if (field !== 'integrityDigest') evidence[field] = record[field];
  }
  return digest(`${path.resolve(repositoryRoot)}\n${JSON.stringify(evidence)}`);
}

function digestFile(filePath) {
  try {
    return digest(fs.readFileSync(filePath));
  } catch {
    throw attestationError('SEMANTIC_READINESS_ATTESTATION_INVALID');
  }
}

function digest(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function copyChannels(value) {
  return Array.isArray(value) ? [...value] : [];
}

function sameArray(left, right) {
  return Array.isArray(left)
    && Array.isArray(right)
    && left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function areChannels(value) {
  return Array.isArray(value) && value.every(isString);
}

function isString(value) {
  return typeof value === 'string' && value.length > 0;
}

function normalizeGraphPath(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError('graphPath is required');
  }
  return value.replace(/\\/g, '/').replace(/^\/+/, '');
}

function normalizeIdentity(value) {
  return String(value).trim().toLowerCase();
}

function ownerMatchesIdentity(identity, owner) {
  const current = normalizeIdentity(identity);
  const recordedOwner = normalizeIdentity(owner);
  return recordedOwner === current
    || (
      recordedOwner === 'builtin\\administrators'
      && current.endsWith('\\administrator')
    );
}

function hasBroadWindowsAcl(value) {
  return /(?:everyone|s-1-1-0|authenticated users)/i.test(value);
}

function recordDirectoryFlushFallback(reason) {
  return Object.freeze({ reason });
}

function attestationError(category) {
  const error = new Error(category);
  error.category = category;
  error.fullSnapshotFallback = false;
  error.action = 'Run semantic readiness verification again before semantic query';
  return error;
}

module.exports = {
  createSemanticReadinessAttestationStore,
};

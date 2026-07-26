const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const handoff = JSON.parse(read('.argo/temp/ImplementationToCodingHandoff.json'));
const authorized = (handoff.codingTargets || []).map(target => target.path).sort();
const expectedAuthorized = [
  '.argo/scripts/argo-mcp-server.js',
  '.argo/scripts/graph-rag/semanticOperatorJourney.js',
  '.argo/scripts/semanticOperatorJourneyCli.js',
  '.argo/scripts/systemarchitecture-mcp-server.js',
  'README.md',
  'package.json',
].sort();

const sensitiveFallbackPattern = /(?:QWEN_KEY|ARGO_NEO4J_DATABASE_(?:URL|USERNAME|PASSWORD)|embeddingCredential|neo4jDatabasePassword)\s*(?:\|\||\?\?|[?][^:]+:)/;
const embeddedCredentialPattern = /(?:password|secret|api[_-]?key|credential)\s*[:=]\s*['"`](?!required|missing|redacted|prohibited)[^'"`\r\n]{4,}['"`]/i;
const embeddedDatabaseUriPattern = /(?:neo4j|bolt)(?:\+s|\+ssc)?:\/\/[^'"\s]+/i;
const duplicateInternalPattern = /db\.index\.vector\.queryNodes|neo4j\.auth\.basic|createProductionSemantic(?:Backfill|CheckpointStore|Neo4jAdapter|ProjectionStore)|MATCH\s*\(|MERGE\s*\(/i;
const implicitProviderDefaultPattern = /(?:provider|model|baseUrl|dimensions)\s*:\s*['"`](?:qwen|alibaba-cloud|https?:\/\/)[^'"`]*['"`]/i;

// GIVEN only six WP-P3 production/operator files are authorized
// WHEN their complete materialized source is checked
// THEN no new file may embed credentials, synthesize fallbacks/defaults, or duplicate accepted internals
assert.deepStrictEqual(
  authorized,
  expectedAuthorized,
  'WP_P3_AUTHORIZED_SAFETY_GUARD: exact Coding authorization changed',
);

for (const relativePath of authorized) {
  if (!exists(relativePath)) continue;
  const source = read(relativePath);
  assertNoUnsafeSource(relativePath, source);
}

// Executable self-tests prove each policy branch rejects a concrete unsafe implementation.
for (const unsafe of [
  "const password = 'embedded-production-password';",
  "const uri = 'neo4j://embedded.example:7687';",
  'const password = process.env.ARGO_NEO4J_DATABASE_PASSWORD || "fallback";',
  "const profile = { model: 'qwen-implicit-default' };",
  'session.run("MATCH (n) RETURN n")',
]) {
  assert.throws(
    () => assertNoUnsafeSource('.argo/scripts/graph-rag/semanticOperatorJourney.js', unsafe),
    /WP_P3_AUTHORIZED_SAFETY_GUARD/,
    `WP_P3_AUTHORIZED_SAFETY_GUARD: unsafe self-test was accepted: ${unsafe}`,
  );
}

function assertNoUnsafeSource(relativePath, source) {
  if (relativePath === 'README.md') {
    assert(
      !/(?:QWEN_KEY|ARGO_NEO4J_DATABASE_PASSWORD)\s*=\s*\S+/.test(source),
      'WP_P3_AUTHORIZED_SAFETY_GUARD: README embeds a secret value example',
    );
    return;
  }
  if (relativePath === 'package.json') {
    assert(
      !/(?:QWEN_KEY|ARGO_NEO4J_DATABASE_(?:URL|USERNAME|PASSWORD))\s*=/.test(source),
      'WP_P3_AUTHORIZED_SAFETY_GUARD: package command injects configuration',
    );
    return;
  }

  assert(
    !sensitiveFallbackPattern.test(source),
    `WP_P3_AUTHORIZED_SAFETY_GUARD: ${relativePath} introduces sensitive fallback policy`,
  );
  assert(
    !embeddedCredentialPattern.test(source),
    `WP_P3_AUTHORIZED_SAFETY_GUARD: ${relativePath} embeds a credential literal`,
  );
  assert(
    !embeddedDatabaseUriPattern.test(source),
    `WP_P3_AUTHORIZED_SAFETY_GUARD: ${relativePath} embeds a database URI`,
  );

  if (
    relativePath.endsWith('semanticOperatorJourney.js')
    || relativePath.endsWith('semanticOperatorJourneyCli.js')
  ) {
    assert(
      !implicitProviderDefaultPattern.test(source),
      `WP_P3_AUTHORIZED_SAFETY_GUARD: ${relativePath} introduces an implicit provider default`,
    );
    assert(
      !duplicateInternalPattern.test(source),
      `WP_P3_AUTHORIZED_SAFETY_GUARD: ${relativePath} duplicates accepted WP-P1/WP-P2 internals`,
    );
  }
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, ...relativePath.split('/')));
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

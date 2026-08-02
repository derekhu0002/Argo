const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const entryPath = 'tests/explicit/entries/runMcpSemanticQueryContract.js';
const source = read(entryPath);

const expectedAnchors = [
  'reject-response-shape-controls',
  'preserve-full-snapshot-read-modes',
  'canonical-object-subset-only',
  'element-hit-no-neighbor-expansion',
  'relationship-endpoint-closure',
  'broken-relationship-endpoint-rejection',
  'view-membership-closure',
  'no-overlapping-view-cascade',
  'broken-view-reference-rejection',
];

// GIVEN the approved BP-MCP-SEM explicit testcase anchors
// WHEN the physical entrypoint is inspected
// THEN every anchor is executable and exposes business-readable failure signals.
for (const phase of ['GIVEN', 'WHEN', 'THEN']) {
  assert(
    source.includes(phase),
    `MCP_SEMANTIC_ENTRYPOINT_CORRECTNESS_GUARD: ${entryPath} is missing ${phase}`,
  );
}

for (const anchor of expectedAnchors) {
  assert(
    source.includes(`name: '${anchor}'`) || source.includes(`'${anchor}'`),
    `MCP_SEMANTIC_ENTRYPOINT_CORRECTNESS_GUARD: ${entryPath} omits anchor ${anchor}`,
  );
}

for (const requiredSignal of [
  'ARGO_TESTCASE_ANCHOR',
  'QUERY_RESPONSE_SHAPE_CONTROL_FORBIDDEN',
  'SEMANTIC_SUBSET_RELATIONSHIP_MISSING',
  'SEMANTIC_SUBSET_VIEW_MISSING',
  'invokeUnifiedMcpTool',
  'no-anchor direct callTool',
  'no-anchor unified MCP handler',
  'EXPECTED_CONTRACT_FAILURES',
  'MCP_SEMANTIC_QUERY_CONTRACT_OK',
  'fs.mkdirSync(path.dirname(absolutePath), { recursive: true })',
]) {
  assert(
    source.includes(requiredSignal),
    `MCP_SEMANTIC_ENTRYPOINT_CORRECTNESS_GUARD: ${entryPath} omits ${requiredSignal}`,
  );
}

for (const forbiddenDerivedField of [
  'businessObjects',
  'semanticSeeds',
  'hitReasons',
  'policySummary',
  'boundarySummary',
  'semanticIndex',
  'descriptionSummary',
  'testCoverage',
  'expandWith',
  'queryTemplate',
  'parameterContract',
  'archimateSemantics',
]) {
  assert(
    source.includes(`'${forbiddenDerivedField}'`),
    `MCP_SEMANTIC_ENTRYPOINT_CORRECTNESS_GUARD: canonical-payload assertion omits ${forbiddenDerivedField}`,
  );
}

assert(
  !source.includes('broken-relationship-reference-rejection'),
  'MCP_SEMANTIC_ENTRYPOINT_CORRECTNESS_GUARD: stale relationship-reference anchor must not remain',
);
assert(
  !source.includes('child_process'),
  'MCP_SEMANTIC_ENTRYPOINT_CORRECTNESS_GUARD: entrypoint must not expose process plumbing',
);

const rejectCaseStart = source.indexOf("name: 'reject-response-shape-controls'");
const canonicalCaseStart = source.indexOf("name: 'canonical-object-subset-only'");
const elementCaseStart = source.indexOf("name: 'element-hit-no-neighbor-expansion'");
assert(
  rejectCaseStart >= 0
    && canonicalCaseStart > rejectCaseStart
    && source.slice(rejectCaseStart, canonicalCaseStart).includes("responseProfile: 'debug'")
    && !source.slice(rejectCaseStart, canonicalCaseStart).includes("anchors: ['public-no-anchor"),
  'MCP_SEMANTIC_ENTRYPOINT_CORRECTNESS_GUARD: request-shape control must include a no-anchor public debug rejection case',
);
assert(
  canonicalCaseStart >= 0
    && elementCaseStart > canonicalCaseStart
    && source.slice(canonicalCaseStart, elementCaseStart).includes('Return canonical semantic query objects only through the public no-anchor path')
    && !source.slice(canonicalCaseStart, elementCaseStart).includes("anchors: ['public-no-anchor"),
  'MCP_SEMANTIC_ENTRYPOINT_CORRECTNESS_GUARD: canonical payload control must include a no-anchor public subset case',
);

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, ...relativePath.split('/')), 'utf8');
}

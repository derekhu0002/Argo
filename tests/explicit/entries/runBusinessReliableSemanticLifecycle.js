const assert = require('node:assert');

const {
  assertBusinessQueryAutoAlignment,
  assertBusinessQueryFailsClosed,
  runBusinessQueryAlignmentFailureFixtures,
  runBusinessQueryAutoAlignmentFixtures,
} = require('../../harness/productionDefaultRetrievalHarness.js');
const {
  assertBusinessAgentUnawareWorkflow,
  assertBusinessReliableWriteCompletion,
  observeFreshReadinessPerQuery,
  observeSolePublicSemanticSurface,
  runPersistentIncrementalMatrix,
} = require('../../harness/automaticSemanticLifecycleHarness.js');

const ANCHORS = Object.freeze({
  'write-aligned': runWriteAligned,
  'write-failure-not-complete': runWriteFailureNotComplete,
  'query-autoalign': runQueryAutoalign,
  'query-fails-closed': runQueryFailsClosed,
  'agent-unaware': runAgentUnaware,
});

async function main() {
  const selected = process.env.ARGO_TESTCASE_ANCHOR;
  if (selected) {
    assert(ANCHORS[selected], `BP_AUTOALIGN_UNKNOWN_ANCHOR:${selected}`);
    await ANCHORS[selected]();
    return;
  }
  for (const run of Object.values(ANCHORS)) {
    await run();
  }
}

async function runWriteAligned() {
  // GIVEN a legal intent-architecture write touches Element, Relationship, and View channels
  const lifecycle = await runPersistentIncrementalMatrix('BP_AUTOALIGN_WRITE_ALIGNED');

  // WHEN the governed write returns to the business acceptor
  // THEN success is complete only after embedding, durable projection,
  // touched-record queryability, global coherence, and readiness alignment.
  assertBusinessReliableWriteCompletion(lifecycle);
}

async function runWriteFailureNotComplete() {
  // GIVEN provider, persistence, queryability, or global coherence fails after a legal write
  const lifecycle = await runPersistentIncrementalMatrix('BP_AUTOALIGN_WRITE_FAILURE');

  // WHEN the governed write reports its outcome
  // THEN canonical persistence is not enough to report business completion and
  // the public diagnostic remains stable, actionable, and secret-safe.
  assertBusinessReliableWriteCompletion(lifecycle);
}

async function runQueryAutoalign() {
  // GIVEN ordinary semantic queries encounter disabled, pending, stale, failed,
  // partial, unknown, or version/channel-mismatched readiness
  const readinessOutcomes = await runBusinessQueryAutoAlignmentFixtures();

  // WHEN the query boundary owns recovery
  // THEN it aligns automatically and retries the original query once before returning.
  assertBusinessQueryAutoAlignment(readinessOutcomes);
}

async function runQueryFailsClosed() {
  // GIVEN automatic alignment cannot complete for an ordinary semantic query
  const readinessOutcomes = await runBusinessQueryAlignmentFailureFixtures();

  // WHEN recovery fails
  // THEN the query fails closed with a stable business diagnostic and never
  // silently falls back to a full canonical snapshot.
  assertBusinessQueryFailsClosed(readinessOutcomes);
}

async function runAgentUnaware() {
  // GIVEN an Agent uses only normal public read/write MCP surfaces
  const publicSurface = await observeSolePublicSemanticSurface();
  const semanticQueries = await observeFreshReadinessPerQuery();

  // WHEN lifecycle work is needed
  // THEN MCP/script boundaries own alignment; the Agent never has to call
  // init, backfill, or readiness manually for ordinary operation.
  assertBusinessAgentUnawareWorkflow(publicSurface, semanticQueries);
}

main().catch(error => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});

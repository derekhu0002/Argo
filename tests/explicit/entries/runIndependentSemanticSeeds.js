const assert = require('node:assert');
const { readForPurpose } = require('../../harness/intentArchitectureQueryHarness.js');

async function main() {
  // GIVEN approved W4 queries for independent Element, Relationship, View, many-peer, unrelated, and ANN comparison cases
  const result = await readForPurpose({
    purpose: 'implementation-design',
    intent: 'Prove W4 independent Element Relationship View semantic seed gates before any graph closure',
  });

  // WHEN semantic seed channels and threshold-all evidence are observed before closure
  const semanticEvidence = result.result || {};
  const seedsByType = semanticEvidence.seedsByType;
  const thresholdAll = semanticEvidence.thresholdAll;

  // THEN each object category is independently observable and no fixed count is forced
  assert(Array.isArray(seedsByType && seedsByType.elements), 'DT04_ELEMENT_SEED_CHANNEL_MISSING; DT05_THRESHOLD_ALL_EVIDENCE_MISSING');
  assert(Array.isArray(seedsByType && seedsByType.relationships), 'DT04_RELATIONSHIP_SEED_CHANNEL_MISSING; DT05_THRESHOLD_ALL_EVIDENCE_MISSING');
  assert(Array.isArray(seedsByType && seedsByType.views), 'DT04_VIEW_SEED_CHANNEL_MISSING; DT05_THRESHOLD_ALL_EVIDENCE_MISSING');
  assert.strictEqual(semanticEvidence.fixedResultLimit, undefined, 'DT05_FIXED_RESULT_LIMIT_FORBIDDEN');
  assert.strictEqual(semanticEvidence.closure, undefined, 'DT04_GRAPH_CLOSURE_OUTPUT_FORBIDDEN');
  assert.strictEqual(semanticEvidence.traversalExpansion, undefined, 'DT04_TRAVERSAL_EXPANSION_OUTPUT_FORBIDDEN');
  assert.strictEqual(semanticEvidence.neighborhoodClosure, undefined, 'DT04_NEIGHBORHOOD_CLOSURE_OUTPUT_FORBIDDEN');

  // THEN W4 correctness is threshold-all per channel, while ANN is only a performance comparison
  assert(thresholdAll && typeof thresholdAll === 'object', 'DT05_THRESHOLD_ALL_EVIDENCE_MISSING');
  for (const channel of ['elements', 'relationships', 'views']) {
    const channelEvidence = thresholdAll[channel];
    assert(channelEvidence, `DT05_THRESHOLD_ALL_CHANNEL_MISSING:${channel}`);
    assert.strictEqual(typeof channelEvidence.threshold, 'number', `DT05_INDEPENDENT_THRESHOLD_MISSING:${channel}`);
    assert(Array.isArray(channelEvidence.qualifyingPeerIds), `DT05_QUALIFYING_PEERS_MISSING:${channel}`);
    assert(Array.isArray(channelEvidence.returnedSeedIds), `DT05_RETURNED_SEEDS_MISSING:${channel}`);
    assert.deepStrictEqual(
      channelEvidence.returnedSeedIds,
      channelEvidence.qualifyingPeerIds,
      `DT05_CHANNEL_GATE_DID_NOT_RETURN_EVERY_QUALIFYING_PEER:${channel}`,
    );
    for (const peerId of channelEvidence.qualifyingPeerIds) {
      assert(channelEvidence.returnedSeedIds.includes(peerId), `DT05_ABOVE_THRESHOLD_PEER_OMITTED:${channel}:${peerId}`);
    }
    assert.strictEqual(channelEvidence.unrelatedForcedHitCount, 0, `DT05_UNRELATED_QUERY_FORCED_HIT:${channel}`);
  }
  assert.notStrictEqual(thresholdAll.elements.threshold, thresholdAll.relationships.threshold, 'DT05_ELEMENT_RELATIONSHIP_THRESHOLD_NOT_INDEPENDENT');
  assert.notStrictEqual(thresholdAll.relationships.threshold, thresholdAll.views.threshold, 'DT05_RELATIONSHIP_VIEW_THRESHOLD_NOT_INDEPENDENT');
  assert.strictEqual(
    thresholdAll.annComparison && thresholdAll.annComparison.correctnessRole,
    'performance-only',
    'DT05_ANN_TOPK_USED_AS_CORRECTNESS_BASELINE',
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

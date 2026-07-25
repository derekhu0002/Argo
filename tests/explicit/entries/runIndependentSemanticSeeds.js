const assert = require('node:assert');
const { readForPurpose } = require('../../harness/intentArchitectureQueryHarness.js');

async function main() {
  // GIVEN approved queries for Element, Relationship, View, many-peer, unrelated, and ANN comparison cases
  const result = await readForPurpose({
    purpose: 'implementation-design',
    intent: 'Prove threshold-all semantic seed correctness before ANN comparison',
  });

  // WHEN semantic seed channels and threshold-all evidence are observed
  const semanticEvidence = result.result || {};
  const seedsByType = semanticEvidence.seedsByType;
  const thresholdAll = semanticEvidence.thresholdAll;

  // THEN each object category is independent and no fixed count is forced
  assert(Array.isArray(seedsByType && seedsByType.elements), 'DT04_ELEMENT_SEED_CHANNEL_MISSING; DT05_THRESHOLD_ALL_EVIDENCE_MISSING');
  assert(Array.isArray(seedsByType && seedsByType.relationships), 'DT04_RELATIONSHIP_SEED_CHANNEL_MISSING; DT05_THRESHOLD_ALL_EVIDENCE_MISSING');
  assert(Array.isArray(seedsByType && seedsByType.views), 'DT04_VIEW_SEED_CHANNEL_MISSING; DT05_THRESHOLD_ALL_EVIDENCE_MISSING');
  assert.strictEqual(semanticEvidence.fixedResultLimit, undefined, 'DT05_FIXED_RESULT_LIMIT_FORBIDDEN');

  // THEN Phase 1 correctness is threshold-all, while ANN is only a performance comparison
  assert(thresholdAll && typeof thresholdAll === 'object', 'DT05_THRESHOLD_ALL_EVIDENCE_MISSING');
  for (const channel of ['elements', 'relationships', 'views']) {
    const channelEvidence = thresholdAll[channel];
    assert(channelEvidence, `DT05_THRESHOLD_ALL_CHANNEL_MISSING:${channel}`);
    assert(Array.isArray(channelEvidence.qualifyingPeerIds), `DT05_QUALIFYING_PEERS_MISSING:${channel}`);
    assert(Array.isArray(channelEvidence.returnedSeedIds), `DT05_RETURNED_SEEDS_MISSING:${channel}`);
    for (const peerId of channelEvidence.qualifyingPeerIds) {
      assert(channelEvidence.returnedSeedIds.includes(peerId), `DT05_ABOVE_THRESHOLD_PEER_OMITTED:${channel}:${peerId}`);
    }
    assert.strictEqual(channelEvidence.unrelatedForcedHitCount, 0, `DT05_UNRELATED_QUERY_FORCED_HIT:${channel}`);
  }
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

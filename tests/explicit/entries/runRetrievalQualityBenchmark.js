const assert = require('node:assert');
const {
  evaluatePhase1QualityBenchmark,
  phase1BusinessBenchmarkFixture,
} = require('../../harness/productionGraphRagHarness.js');

async function main() {
  // GIVEN the human-approved five-purpose benchmark
  const benchmark = phase1BusinessBenchmarkFixture();
  const missingBoundarySignal = 'DT18_PHASE1_QUALITY_BENCHMARK_BOUNDARY_MISSING';

  // WHEN W7 business quality evidence is evaluated
  const outcome = await evaluatePhase1QualityBenchmark({ benchmark });

  // THEN recall and closure are complete, unrelated queries are safe, and precision is recorded
  assert.strictEqual(
    outcome.status,
    'passed',
    (outcome.error && outcome.error.category) || missingBoundarySignal,
  );
  const evidence = outcome.qualityEvidence;
  assert(evidence && typeof evidence === 'object', 'DT18_QUALITY_EVIDENCE_MISSING');
  assert.strictEqual(evidence.benchmarkId, benchmark.benchmarkId, 'DT18_BENCHMARK_ID_MISMATCH');
  assert.deepStrictEqual(
    evidence.purposes,
    benchmark.purposes.map(entry => entry.purpose),
    'DT18_FIVE_PURPOSE_BENCHMARK_INCOMPLETE',
  );
  assert.strictEqual(evidence.keySeedRecall, 1, 'DT18_KEY_SEED_RECALL_NOT_100_PERCENT');
  assert.strictEqual(evidence.closureCorrectness, 1, 'DT18_CLOSURE_CORRECTNESS_NOT_100_PERCENT');
  assert.strictEqual(evidence.unrelatedForcedHits, 0, 'DT18_UNRELATED_FORCED_HITS');
  assert.strictEqual(evidence.releasePrecisionThreshold, undefined, 'DT18_INVENTED_PRECISION_THRESHOLD');
  assertRecordedPrecision(evidence.aggregatePrecision, 'DT18_AGGREGATE_PRECISION_NOT_RECORDED');
  assert(Array.isArray(evidence.perPurpose), 'DT18_PER_PURPOSE_EVIDENCE_MISSING');
  assert.strictEqual(evidence.perPurpose.length, benchmark.purposes.length, 'DT18_PER_PURPOSE_EVIDENCE_INCOMPLETE');
  for (const expectation of benchmark.purposes) {
    const observed = evidence.perPurpose.find(entry => entry.purpose === expectation.purpose);
    assert(observed, `DT18_PURPOSE_EVIDENCE_MISSING: ${expectation.purpose}`);
    assert.deepStrictEqual(
      observed.mandatoryKeySeedIds,
      expectation.mandatoryKeySeedIds,
      `DT18_MANDATORY_KEY_SEEDS_MISMATCH: ${expectation.purpose}`,
    );
    assert.deepStrictEqual(
      observed.recalledKeySeedIds,
      expectation.mandatoryKeySeedIds,
      `DT18_KEY_SEED_RECALL_INCOMPLETE: ${expectation.purpose}`,
    );
    assert.deepStrictEqual(observed.missingKeySeedIds, [], `DT18_MISSING_KEY_SEEDS: ${expectation.purpose}`);
    assert.strictEqual(observed.closureCorrect, true, `DT18_EXPECTED_CLOSURE_FAILURE: ${expectation.purpose}`);
    assert.strictEqual(observed.unrelatedForcedHits, 0, `DT18_UNRELATED_FORCED_HITS: ${expectation.purpose}`);
    assertRecordedPrecision(observed.precision, `DT18_PRECISION_NOT_RECORDED: ${expectation.purpose}`);
  }

  // GIVEN benchmark records missing actual recall observations
  // WHEN W7 business quality evidence is evaluated
  // THEN expected seed ids cannot be reused as fabricated recall evidence
  await assertQualityBenchmarkBlocked(
    mutatePurpose(benchmark, 0, { recalledKeySeedIds: [] }),
    'DT18_ACTUAL_RECALL_EVIDENCE_MISSING',
  );

  // GIVEN benchmark records missing actual closure observations
  // WHEN W7 business quality evidence is evaluated
  // THEN expected closure ids cannot be reused as fabricated closure evidence
  await assertQualityBenchmarkBlocked(
    mutatePurpose(benchmark, 1, { observedClosureIds: [] }),
    'DT18_ACTUAL_CLOSURE_EVIDENCE_MISSING',
  );

  // GIVEN an empty or incomplete business benchmark
  // WHEN W7 business quality evidence is evaluated
  // THEN perfect scores cannot be synthesized from missing benchmark content
  await assertQualityBenchmarkBlocked(
    { benchmarkId: benchmark.benchmarkId, purposes: [] },
    'DT18_BENCHMARK_EMPTY',
  );
  await assertQualityBenchmarkBlocked(
    { ...benchmark, purposes: benchmark.purposes.slice(0, -1) },
    'DT18_BENCHMARK_INCOMPLETE',
  );

  // GIVEN precision evidence outside the business range
  // WHEN W7 business quality evidence is evaluated
  // THEN invalid precision cannot be normalized into a passing benchmark
  await assertQualityBenchmarkBlocked(
    mutatePurpose(benchmark, 2, { precision: -0.01 }),
    'DT18_PRECISION_OUT_OF_RANGE',
  );
}

function assertRecordedPrecision(value, failureCategory) {
  assert(
    typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1,
    failureCategory,
  );
}

async function assertQualityBenchmarkBlocked(benchmark, expectedCategory) {
  const outcome = await evaluatePhase1QualityBenchmark({ benchmark });
  assert.strictEqual(outcome.status, 'blocked', expectedCategory);
  assert.strictEqual(
    outcome.error && outcome.error.category,
    expectedCategory,
    (outcome.error && outcome.error.category) || expectedCategory,
  );
}

function mutatePurpose(benchmark, purposeIndex, patch) {
  return {
    ...benchmark,
    purposes: benchmark.purposes.map((purpose, index) => (
      index === purposeIndex ? { ...purpose, ...patch } : { ...purpose }
    )),
  };
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

const assert = require('node:assert');
const {
  assertAuditProofClosure,
  readForPurposeClosure,
} = require('../../harness/intentArchitectureQueryHarness.js');

async function main() {
  // GIVEN an explicit audit subject containing a low-similarity violation
  const result = await readForPurposeClosure({
    purpose: 'audit',
    intent: 'Audit the declared subject for violations',
    subject: 'grag-audit-policy',
    anchors: ['grag-audit-policy'],
    lowSimilarityViolationInsideSubject: true,
    highSimilarityCandidateOutsideSubject: 'grag-intent-decision-policy',
  });

  // WHEN proof-scope closure is observed
  const audit = result.result && result.result.auditProof;
  const missingSubject = await readForPurposeClosure({
    purpose: 'audit',
    intent: 'Audit without an explicit subject must not infer mandatory scope',
  });

  // THEN in-subject violations and missing-evidence exceptions are explicit
  assertAuditProofClosure(result);
  assert(audit.violations.some(violation => violation.similarityClass === 'low'), 'DT11_LOW_SIMILARITY_VIOLATION_MISSING');
  assert.strictEqual(audit.includesOutsideHighSimilarityCandidate, false, 'DT11_OUT_OF_SUBJECT_CANDIDATE_INCLUDED');
  assert.strictEqual(missingSubject.status, 'failed', 'DT11_MISSING_SUBJECT_NOT_REJECTED');
  assert.strictEqual(missingSubject.error && missingSubject.error.category, 'AUDIT_SUBJECT_REQUIRED', 'DT11_MISSING_SUBJECT_CATEGORY_CHANGED');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

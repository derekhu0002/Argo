const assert = require('node:assert');
const {
  readForPurpose,
  readWithoutPurpose,
} = require('../../harness/intentArchitectureQueryHarness.js');

async function main() {
  // GIVEN equal intent text with missing, implementation-design, and audit purposes,
  // while the audit request also omits its subject
  const sharedIntent = 'Inspect the compatible intent-query boundary';

  // WHEN all requests cross mode and purpose validation
  const missingPurposeResult = await readWithoutPurpose({
    intent: sharedIntent,
  });
  const implementationDesignResult = await readForPurpose({
    purpose: 'implementation-design',
    intent: sharedIntent,
  });
  const auditWithoutSubjectResult = await readForPurpose({
    purpose: 'audit',
    intent: sharedIntent,
  });

  // THEN missing purpose is rejected, explicit purpose is preserved,
  // and audit without subject is independently rejected
  assert.strictEqual(
    missingPurposeResult.status,
    'failed',
    'DT03_MISSING_PURPOSE_NOT_REJECTED: explicit query purpose must never default or be inferred',
  );
  assert.strictEqual(
    missingPurposeResult.error && missingPurposeResult.error.category,
    'QUERY_PURPOSE_REQUIRED',
    'DT03_MISSING_PURPOSE_CATEGORY_UNSTABLE: rejection must expose QUERY_PURPOSE_REQUIRED',
  );
  assert.strictEqual(
    implementationDesignResult.query && implementationDesignResult.query.purpose,
    'implementation-design',
    'DT03_PURPOSE_NOT_PRESERVED: implementation-design purpose must remain explicit request data',
  );
  assert.strictEqual(
    auditWithoutSubjectResult.status,
    'failed',
    'DT03_AUDIT_SUBJECT_REQUIRED: audit without an explicit subject must be rejected',
  );
  assert.strictEqual(
    auditWithoutSubjectResult.error && auditWithoutSubjectResult.error.category,
    'AUDIT_SUBJECT_REQUIRED',
    'DT03_AUDIT_REJECTION_CATEGORY_MISSING: rejection must expose the business failure category',
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

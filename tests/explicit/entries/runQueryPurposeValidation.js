const assert = require('node:assert');
const {
  readForPurpose,
} = require('../../harness/intentArchitectureQueryHarness.js');

async function main() {
  // GIVEN equal intent text with explicit implementation-design and audit purposes,
  // and the audit request omits its subject
  const sharedIntent = 'Inspect the compatible intent-query boundary';

  // WHEN both requests cross mode and purpose validation
  const implementationDesignResult = await readForPurpose({
    purpose: 'implementation-design',
    intent: sharedIntent,
  });
  const auditWithoutSubjectResult = await readForPurpose({
    purpose: 'audit',
    intent: sharedIntent,
  });

  // THEN purpose remains explicit and audit without subject is rejected
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

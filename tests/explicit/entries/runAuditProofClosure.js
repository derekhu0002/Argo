const assert = require('node:assert');
const { readForPurpose } = require('../../harness/intentArchitectureQueryHarness.js');

async function main() {
  // GIVEN an explicit audit subject containing a low-similarity violation
  const result = await readForPurpose({
    purpose: 'audit',
    intent: 'Audit the declared subject for violations',
    subject: 'grag-audit-policy',
  });

  // WHEN proof-scope closure is observed
  const audit = result.result && result.result.auditProof;

  // THEN in-subject violations and missing-evidence exceptions are explicit
  assert(Array.isArray(audit && audit.violations), 'DT11_AUDIT_VIOLATIONS_MISSING');
  assert(Array.isArray(audit && audit.evidenceExceptions), 'DT11_EVIDENCE_EXCEPTIONS_MISSING');
  assert.strictEqual(audit && audit.missingEvidenceTreatedAsPass, false, 'DT11_MISSING_EVIDENCE_FALSE_PASS');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

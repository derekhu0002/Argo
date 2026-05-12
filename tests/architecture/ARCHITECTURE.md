---
contract_type: implementation-architecture-element
contract_version: 1
scope: stable-element
element_name: critical-architecture-guardrails
element_kind: FrozenGuardrailZone
element_path: tests/architecture
---

## Implementation Architecture Contract

### Responsibility
- Freeze the critical non-explicit tests that directly guard architecture boundary, dependency direction, explicit entry correctness, and implementation traceability.
- Keep these tests callable as standalone read-only scripts during coding stage.
- Protect the fixtures and baselines that define the contract-level assertion surface.

### Out Of Scope
- Acting as the home for ordinary support tests.
- Replacing explicit testcase entries from the intent architecture.
- Freezing volatile implementation-detail assertions.

### Children
- path: commands-entry-boundary.test.js
  kind: critical-test-entry
  role: architecture boundary guard for src/commands
- path: fixtures/
  kind: protected-fixtures
  role: frozen expected command surface data

### Test Guardrails
#### critical_non_explicit_tests
- test_id: commands-entry-boundary
  critical_kind: architecture-boundary
  test_path: commands-entry-boundary.test.js
  execution_entry: commands-entry-boundary.test.js
  guards_elements:
    - src/commands
  protected_fixtures:
    - fixtures/commands-entry-boundary.expected.json
  protected_baselines:
    - ../../src/commands/ARCHITECTURE.md
  rationale: prevent command boundary drift before coding begins
  frozen_by_stage: implementationdesign

#### supporting_non_explicit_tests
- none

### Open Gaps
- dependency-direction and implementation-traceability guardrails still need to be materialized in this zone.

### Notes
- The scripts in this directory are intentionally plain Node entrypoints so later `/work` execution can call them directly when needed.
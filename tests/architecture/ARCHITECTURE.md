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
- path: argo-init-explicit-entry-correctness.test.js
  kind: critical-test-entry
  role: explicit entry correctness guard for the /argo-init acceptance entry
- path: validator-bootstrap-traceability.test.js
  kind: critical-test-entry
  role: implementation traceability guard for validator bootstrap assets and manifest wiring
- path: workspace-bootstrap-dependency-direction.test.js
  kind: critical-test-entry
  role: dependency direction guard for workspace bootstrap support code
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

- test_id: argo-init-explicit-entry-correctness
  critical_kind: explicit-entry-correctness
  test_path: argo-init-explicit-entry-correctness.test.js
  execution_entry: argo-init-explicit-entry-correctness.test.js
  guards_elements:
    - ../../tests/explicit/entries/runArgoInitValidatorBootstrap.js
    - ../../tests/explicit/ARCHITECTURE.md
  protected_baselines:
    - ../../src/commands/ARCHITECTURE.md
    - ../../tests/explicit/ARCHITECTURE.md
  rationale: keep the explicit acceptance entry single, callable, and contract-described
  frozen_by_stage: implementationdesign

- test_id: validator-bootstrap-traceability
  critical_kind: implementation-traceability
  test_path: validator-bootstrap-traceability.test.js
  execution_entry: validator-bootstrap-traceability.test.js
  guards_elements:
    - ../../.github/validator/script/validateStageHandoff.js
    - ../../scripts/validateStageHandoff.js
    - ../../package.json
  protected_baselines:
    - ../../OVERALL_ARCHITECTURE.md
    - ../../.github/validator/ARCHITECTURE.md
  rationale: keep validator assets and manifest wiring traceable to the bootstrap contract
  frozen_by_stage: implementationdesign

- test_id: workspace-bootstrap-dependency-direction
  critical_kind: dependency-direction
  test_path: workspace-bootstrap-dependency-direction.test.js
  execution_entry: workspace-bootstrap-dependency-direction.test.js
  guards_elements:
    - ../../src/utils/workspaceBootstrap.ts
  protected_baselines:
    - ../../src/utils/ARCHITECTURE.md
  rationale: prevent bootstrap support from depending upward on commands, engine, or model adapters
  frozen_by_stage: implementationdesign

#### supporting_non_explicit_tests
- none

### Open Gaps
- none for the /argo-init validator-bootstrap slice; additional guardrails outside this slice may still be added later.

### Notes
- The scripts in this directory are intentionally plain Node entrypoints so later `/work` execution can call them directly when needed.
---
contract_type: implementation-architecture-element
contract_version: 1
scope: stable-element
element_name: explicit-testcase-entries
element_kind: AcceptanceEntrypointZone
element_path: tests/explicit
---

## Implementation Architecture Contract

### Responsibility
- Hold the read-only single-entry acceptance scripts that Coding/Repair must call rather than rewrite.
- Make each explicit testcase executable with concrete control and observation boundaries.

### Out Of Scope
- Replacing critical non-explicit tests in tests/architecture.
- Hosting mutable support tests.

### Children
- path: entries/runArgoInitValidatorBootstrap.js
  kind: explicit-test-entry
  role: single executable acceptance entry for the /argo-init validator bootstrap contract
- path: suite/argoInitValidatorBootstrapExtensionHost.js
  kind: explicit-test-support-file
  role: extension-host assertions for the /argo-init validator bootstrap acceptance entry

### Entrypoint Rules
- mutation_policy: read-only-during-work
- entry_shape: one testcase to one callable script entry
- current_explicit_entries:
  - testcase: ARGO-INIT-VALIDATOR-BOOTSTRAP-CONTRACT
    entry_path: entries/runArgoInitValidatorBootstrap.js
    control_point: invoke the exported /argo-init command handler in an extension host opened on a temporary workspace
    observation_point: the temporary workspace shows copied validator assets, copied schema assets, and package.json bootstrap results
    current_expected_status: failed-until-package-json-seeding-is-implemented

### Test Guardrails
#### critical_non_explicit_tests
- test_id: argo-init-explicit-entry-correctness
  critical_kind: explicit-entry-correctness
  test_path: ../architecture/argo-init-explicit-entry-correctness.test.js
  execution_entry: ../architecture/argo-init-explicit-entry-correctness.test.js
  guards_elements:
    - entries/runArgoInitValidatorBootstrap.js
  protected_baselines:
    - ARCHITECTURE.md
  rationale: freeze the explicit entry shape once published for Coding/Repair
  frozen_by_stage: implementationdesign

### Notes
- This zone exists even though the current intent graph still lacks embedded explicit testcase objects because the handoff schema and stage rules require a concrete executable entry.
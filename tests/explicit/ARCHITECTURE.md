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
- path: entries/runIntentGraphTopLevelDrilldown.js
  kind: explicit-test-entry
  role: single executable acceptance entry for the top-level disclosure and drilldown contract of the read-only intent graph explorer
- path: entries/runIntentGraphSearchExpansion.js
  kind: explicit-test-entry
  role: single executable acceptance entry for the search expansion contract of the read-only intent graph explorer
- path: suite/argoInitValidatorBootstrapExtensionHost.js
  kind: explicit-test-support-file
  role: extension-host assertions for the /argo-init validator bootstrap acceptance entry
- path: suite/intentGraphTopLevelDrilldownExtensionHost.js
  kind: explicit-test-support-file
  role: extension-host assertions for the top-level disclosure and drilldown explorer acceptance entry
- path: suite/intentGraphSearchExpansionExtensionHost.js
  kind: explicit-test-support-file
  role: extension-host assertions for the search expansion explorer acceptance entry

### Entrypoint Rules
- mutation_policy: read-only-during-work
- entry_shape: one testcase to one callable script entry
- current_explicit_entries:
  - testcase: ARGO-INIT-VALIDATOR-BOOTSTRAP-CONTRACT
    entry_path: entries/runArgoInitValidatorBootstrap.js
    control_point: invoke the exported /argo-init command handler in an extension host opened on a temporary workspace
    observation_point: the temporary workspace shows copied validator assets, copied schema assets, and package.json bootstrap results
    current_expected_status: failed-until-package-json-seeding-is-implemented
  - testcase: INTENT-GRAPH-TOP-LEVEL-DRILLDOWN
    entry_path: entries/runIntentGraphTopLevelDrilldown.js
    control_point: invoke the future VS Code command id `argo.openIntentGraphExplorer` in test mode and request the initial snapshot plus a targeted drilldown expansion
    observation_point: the returned snapshot initially exposes only the first-layer child views of the structural root view and then reveals the selected child path after expansion
    current_expected_status: failed-until-command-registration-and-explorer-runtime-are-implemented
  - testcase: INTENT-GRAPH-SEARCH-EXPANSION
    entry_path: entries/runIntentGraphSearchExpansion.js
    control_point: invoke the future VS Code command id `argo.openIntentGraphExplorer` in test mode and issue search queries by view name and included element name
    observation_point: the returned snapshot exposes the matched target view and its visible ancestor path without mutating the graph file
    current_expected_status: failed-until-command-registration-and-explorer-runtime-are-implemented

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

- test_id: intent-graph-explicit-entry-correctness
  critical_kind: explicit-entry-correctness
  test_path: ../architecture/intent-graph-explicit-entry-correctness.test.js
  execution_entry: ../architecture/intent-graph-explicit-entry-correctness.test.js
  guards_elements:
    - entries/runIntentGraphTopLevelDrilldown.js
    - entries/runIntentGraphSearchExpansion.js
  protected_baselines:
    - ARCHITECTURE.md
    - ../../src/commands/ARCHITECTURE.md
  rationale: freeze the new explorer explicit entry shapes once published for Coding/Repair
  frozen_by_stage: implementationdesign

### Notes
- This zone now contains both the older /argo-init explicit testcase entry and the new explorer explicit testcase entries backed by graph-embedded testcase objects in design/KG/SystemArchitecture.json.
---
contract_type: implementation-architecture-element
contract_version: 1
scope: stable-element
element_name: commands
element_kind: CommandOrchestration
element_path: src/commands
---

## Implementation Architecture Contract

### Responsibility
- Expose stable chat command entrypoints for `/argo-init`, `/intentinarchitecturedesign`, `/implementationdesign`, `/test`, `/work`, and `/idle`.
- Expose the future stable VS Code command entrypoint that opens the read-only Intent Graph Visual Explorer without absorbing graph traversal semantics into the command layer.
- Translate user intent into handoff generation or bounded execution flows.
- Keep command semantics stable without absorbing engine internals or unrelated helper responsibilities.

### Out Of Scope
- Running semantic extraction or stitch judgement logic directly.
- Owning test execution internals beyond dispatching to stable support surfaces.
- Becoming a catch-all location for shared utilities.

### Children
- path: argoInit.ts
  kind: entrypoint-file
  role: manual workspace bootstrap orchestrator for validator assets, schema assets, and package.json seeding policy
- path: intentinarchitecturedesign.ts
  kind: entrypoint-file
  role: intent architecture design handoff
- path: implementationdesign.ts
  kind: entrypoint-file
  role: implementation architecture design handoff
- path: intentGraphExplorer.ts
  kind: entrypoint-file
  role: future VS Code command adapter that opens the read-only intent graph explorer in normal mode and returns a frozen snapshot shape in test mode
- path: test.ts
  kind: entrypoint-file
  role: explicit testcase execution and failure-record refresh
- path: work.ts
  kind: entrypoint-file
  role: coding-stage handoff based on persisted failure records
- path: idle.ts
  kind: entrypoint-file
  role: guard stage reset
- path: index.ts
  kind: barrel-file
  role: command surface export

### Dependencies
#### allowed
- path: ../utils
  reason: handoff assembly, guard stage transitions, and workspace helpers belong to support layer
- path: ../tools
  reason: work command may depend on stable architecture test execution surface
- path: ../visualIntentGraphEditor
  reason: command entrypoints may delegate explorer behavior into the dedicated deep module

#### forbidden
- path: ../engine
  reason: command layer must not absorb engine internals directly
- path: ../lm
  reason: command layer should not depend on model adapters directly

### Implements / Traceability
#### implements_intent
- element: Argo VS Extension
- element: intentinarchitecturedesign
- element: implementationdesign
- element: 显性测试用例
- element: work

#### implements_elements
- element: src/ARCHITECTURE.md#runtime-host

### Test Guardrails
#### critical_non_explicit_tests
- test_id: commands-entry-boundary
  critical_kind: architecture-boundary
  test_path: ../../tests/architecture/commands-entry-boundary.test.js
  execution_entry: ../../tests/architecture/commands-entry-boundary.test.js
  guards_elements:
    - src/commands
  supports_explicit_testcases:
    - argo-init
    - test
    - work
    - implementationdesign
  protected_fixtures:
    - ../../tests/architecture/fixtures/commands-entry-boundary.expected.json
  protected_baselines:
    - ARCHITECTURE.md
  assertion_scope: command entry files and their frozen role map remain stable
  mutation_policy: read-only-during-work
  failure_classification_rule: implementation-test-contract
  rationale: keep the command surface stable while later coding work changes underlying implementation
  frozen_by_stage: implementationdesign

- test_id: intent-graph-explicit-entry-correctness
  critical_kind: explicit-entry-correctness
  test_path: ../../tests/architecture/intent-graph-explicit-entry-correctness.test.js
  execution_entry: ../../tests/architecture/intent-graph-explicit-entry-correctness.test.js
  guards_elements:
    - src/commands/intentGraphExplorer.ts
    - ../../tests/explicit/entries/runIntentGraphTopLevelDrilldown.js
    - ../../tests/explicit/entries/runIntentGraphSearchExpansion.js
  protected_baselines:
    - ARCHITECTURE.md
    - ../../tests/explicit/ARCHITECTURE.md
  assertion_scope: the explorer command adapter and both explicit acceptance entries stay single, callable, and contract-linked
  mutation_policy: read-only-during-work
  failure_classification_rule: implementation-test-contract
  rationale: freeze the new explorer testcase entrypoints once this stage publishes them
  frozen_by_stage: implementationdesign

- test_id: argo-init-explicit-entry-correctness
  critical_kind: explicit-entry-correctness
  test_path: ../../tests/architecture/argo-init-explicit-entry-correctness.test.js
  execution_entry: ../../tests/architecture/argo-init-explicit-entry-correctness.test.js
  guards_elements:
    - src/commands/argoInit.ts
    - ../../tests/explicit/entries/runArgoInitValidatorBootstrap.js
  protected_baselines:
    - ARCHITECTURE.md
    - ../../tests/explicit/ARCHITECTURE.md
  assertion_scope: the /argo-init explicit acceptance entry stays single, callable, and contract-linked
  mutation_policy: read-only-during-work
  failure_classification_rule: implementation-test-contract
  rationale: keep the explicit acceptance entry frozen once this stage publishes it
  frozen_by_stage: implementationdesign

#### supporting_non_explicit_tests
- path: ../../tests/support/agentHandoff-support.test.js
  scope: prompt assembly support guard for later coding-stage changes

### Explicit Testcase Entrypoints
- testcase: INTENT-GRAPH-TOP-LEVEL-DRILLDOWN
  command_entry: intentGraphExplorer.ts
  physical_test_entry: ../../tests/explicit/entries/runIntentGraphTopLevelDrilldown.js
  control_point: the explicit entry launches the extension host, requires the VS Code command id `argo.openIntentGraphExplorer`, and requests an initial snapshot followed by a drilldown expansion in test mode
  observation_point: the command returns a snapshot whose visible views match the structural first layer, and later reveal the selected child path after expansion
- testcase: INTENT-GRAPH-SEARCH-EXPANSION
  command_entry: intentGraphExplorer.ts
  physical_test_entry: ../../tests/explicit/entries/runIntentGraphSearchExpansion.js
  control_point: the explicit entry launches the extension host, requires the VS Code command id `argo.openIntentGraphExplorer`, and issues search requests in test mode by view name and included element name
  observation_point: the command returns a snapshot that exposes the matched target view and the visible ancestor path for each search
- testcase: ARGO-INIT-VALIDATOR-BOOTSTRAP-CONTRACT
  command_entry: argoInit.ts
  physical_test_entry: ../../tests/explicit/entries/runArgoInitValidatorBootstrap.js
  control_point: the explicit entry invokes the exported /argo-init command handler inside the extension host
  observation_point: the temporary workspace shows copied validator assets, copied schema assets, and package.json bootstrap results

### Open Gaps
- /argo-init still lacks package.json seeding behavior, so the explicit testcase entry is expected to fail until coding fills that gap.
- package.json and extension activation do not yet contribute the explorer command id `argo.openIntentGraphExplorer`, so both explorer explicit testcase entries are expected to fail until Coding/Repair wires that runtime path.

### Notes
- `/argo-init`, `/test`, `/work`, and `/implementationdesign` are the main user-facing orchestration entrypoints in this element; support directories usually implement the same intent only indirectly.
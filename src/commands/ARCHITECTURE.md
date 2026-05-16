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
- Expose stable chat command entrypoints for `/intentinarchitecturedesign`, `/implementationdesign`, `/work`, and `/idle`.
- Translate user intent into handoff generation or bounded execution flows.
- Keep command semantics stable without absorbing engine internals or unrelated helper responsibilities.

### Out Of Scope
- Running semantic extraction or stitch judgement logic directly.
- Owning test execution internals beyond dispatching to stable support surfaces.
- Becoming a catch-all location for shared utilities.

### Children
- path: intentinarchitecturedesign.ts
  kind: entrypoint-file
  role: intent architecture design handoff
- path: implementationdesign.ts
  kind: entrypoint-file
  role: implementation architecture design handoff
- path: work.ts
  kind: entrypoint-file
  role: coding-stage orchestration and explicit test execution handoff
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

#### forbidden
- path: ../engine
  reason: command layer must not absorb engine internals directly
- path: ../lm
  reason: command layer should not depend on model adapters directly

### Implements / Traceability
#### implements_intent
- element: intentinarchitecturedesign
- element: implementationdesign
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

#### supporting_non_explicit_tests
- path: ../../tests/support/agentHandoff-support.test.js
  scope: prompt assembly support guard for later coding-stage changes

### Explicit Testcase Entrypoints
- none directly owned here; commands orchestrate explicit entries but do not store them.

### Open Gaps
- The graph currently lacks formal explicit testcase objects, so `/work` still operates over an empty explicit baseline unless the graph is updated.

### Notes
- `/work` and `/implementationdesign` are direct intent implementations; other support directories usually implement the same intent only indirectly.
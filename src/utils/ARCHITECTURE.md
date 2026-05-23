---
contract_type: implementation-architecture-element
contract_version: 1
scope: stable-element
element_name: utils
element_kind: SupportUtilities
element_path: src/utils
---

## Implementation Architecture Contract

### Responsibility
- Provide stable support utilities for guard stages, handoff assembly, workspace bootstrap, persistence helpers, and related repository-facing orchestration support.
- Keep bootstrap mechanics below command entrypoints so command files expose intent while utils own filesystem and workspace mutation details.

### Out Of Scope
- Owning chat command semantics directly.
- Reaching upward into command routing or extension host orchestration.
- Replacing frozen test entrypoints.

### Children
- path: workspaceBootstrap.ts
  kind: support-entry-file
  role: workspace bootstrap implementation for EA template copy, managed .github asset copy, schema projection, and future package.json seeding
- path: agentHandoff.ts
  kind: support-entry-file
  role: handoff prompt assembly
- path: explicitTestcaseEntryGuard.ts
  kind: support-entry-file
  role: stage-aware explicit entry protection

### Dependencies
#### allowed
- path: vscode
  reason: workspace bootstrap and guard helpers need extension host APIs

#### forbidden
- path: ../commands
  reason: support utilities must remain below command orchestration
- path: ../engine
  reason: bootstrap helpers must not depend on semantic engine internals
- path: ../lm
  reason: bootstrap helpers must not depend on model adapter internals

### Implements / Traceability
#### implements_intent
- element: Argo VS Extension

#### implements_elements
- element: src/ARCHITECTURE.md#runtime-host

### Explicit Testcase Entrypoints
- testcase: ARGO-INIT-VALIDATOR-BOOTSTRAP-CONTRACT
  supporting_entry: ../../tests/explicit/entries/runArgoInitValidatorBootstrap.js
  control_point: the explicit entry drives handleArgoInit, which delegates to workspaceBootstrap.ts
  observation_point: bootstrap-managed files and manifest state in a temporary workspace

### Test Guardrails
#### critical_non_explicit_tests
- test_id: workspace-bootstrap-dependency-direction
  critical_kind: dependency-direction
  test_path: ../../tests/architecture/workspace-bootstrap-dependency-direction.test.js
  execution_entry: ../../tests/architecture/workspace-bootstrap-dependency-direction.test.js
  guards_elements:
    - workspaceBootstrap.ts
  protected_baselines:
    - ARCHITECTURE.md
  rationale: keep bootstrap support below commands and above bundled assets only
  frozen_by_stage: implementationdesign

### Open Gaps
- package.json seeding behavior is contract-required but not yet implemented in workspaceBootstrap.ts.
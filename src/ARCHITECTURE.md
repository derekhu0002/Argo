---
contract_type: implementation-architecture-element
contract_version: 1
scope: stable-element
element_name: runtime-host
element_kind: LayeredRuntime
element_path: src
---

## Implementation Architecture Contract

### Responsibility
- Provide the VS Code extension composition root and the stable internal layering surface for Argo runtime behavior.
- Separate host orchestration from command entrypoints, semantic/governance engines, and support adapters.
- Keep layer boundaries understandable to both humans and coding agents by exposing only stable directories and critical entry files.

### Out Of Scope
- Freezing every file under src as an independent architecture element.
- Letting host orchestration leak into command, engine, or support internals.
- Treating helper-only files as stable public contracts.

### Children
- path: extension.ts
  kind: host-entry-file
  role: VS Code extension activation and composition root
- path: workParticipant.ts
  kind: host-entry-file
  role: chat participant dispatch and command routing
- path: commands/
  kind: stable-directory
  role: command orchestration layer
  local_contract: commands/ARCHITECTURE.md
- path: engine/
  kind: stable-directory
  role: semantic and governance engine layer
- path: tools/
  kind: stable-directory
  role: executable tool adapters and architecture test execution
- path: utils/
  kind: stable-directory
  role: workflow guards, handoff assembly, persistence helpers, and bootstrap support
- path: lm/
  kind: stable-directory
  role: language-model adapter support for engine internals

### Dependencies
#### allowed
- path: ./commands
  reason: host dispatches only through command entrypoints
- path: ./tools
  reason: host registers stable tool surfaces
- path: ./utils
  reason: host bootstraps workspace assets and runtime guards

#### forbidden
- path: extension.ts -> ./engine
  reason: host should not orchestrate engine internals directly
- path: workParticipant.ts -> ./engine
  reason: participant routing should remain command-oriented

### Layering
- Host: extension.ts, workParticipant.ts
- Commands: commands/
- Engine: engine/
- Support: tools/, utils/, lm/

### Implements / Traceability
#### implements_intent
- element: Argo VS Extension
- element: commands

#### implements_elements
- element: commands/
- element: engine/
- element: tools/
- element: utils/
- element: lm/

### Test Guardrails
#### critical_non_explicit_tests
- test_id: commands-entry-boundary
  critical_kind: architecture-boundary
  test_path: ../tests/architecture/commands-entry-boundary.test.js
  execution_entry: ../tests/architecture/commands-entry-boundary.test.js
  guards_elements:
    - src
    - src/commands
  protected_fixtures:
    - ../tests/architecture/fixtures/commands-entry-boundary.expected.json
  protected_baselines:
    - src/commands/ARCHITECTURE.md
  rationale: keep host and command entry boundaries stable before coding stage starts
  frozen_by_stage: implementationdesign

#### supporting_non_explicit_tests
- path: ../tests/support/
  scope: future coding-stage support tests for tool, handoff, bootstrap, and guard behavior

### Explicit Testcase Entrypoints
- none yet; explicit entries are reserved under ../tests/explicit/entries/ once formal testcase objects exist in the intent graph.

### Open Gaps
- engine/, tools/, utils/, and lm/ local contracts are still required for full downward disclosure.

### Notes
- src/ acts as the stable runtime envelope, but only the listed children are architecture elements.
---
contract_type: implementation-architecture-root
contract_version: 1
scope: repository-root
---

## Implementation Architecture Contract

### Responsibility
- Define the only root entry for implementation-architecture reading inside this repository.
- Freeze the top-level stable elements, read order, dependency policy, testcase entry ownership, and non-explicit guardrail policy.
- Keep the architecture contract at the level of stable directories, stable components, and critical entry files rather than mirroring source files.

### Out Of Scope
- Re-describing intent architecture semantics already owned by design/KG/SystemArchitecture.json.
- Freezing private helpers, local workflows, or low-level utilities as stable public architecture elements.
- Introducing or modifying business behavior in order to make the contract look complete.

### Root Scope
- root_path: .
- meaning: implementation-architecture-read-boundary

### Included Paths
- path: src/
  reason: primary implementation runtime and stable component boundaries
- path: tests/explicit/
  reason: read-only physical landing zone for explicit testcase single-entry files
- path: tests/architecture/
  reason: frozen critical non-explicit architecture guardrails

### Excluded Paths
- path: design/
  reason: governance and intent assets, not implementation architecture elements
- path: build/
  reason: generated outputs
- path: eatool/
  reason: bundled external tooling assets, outside current stable implementation boundary

### Top-Level Elements
- path: src/
  name: runtime-host
  kind: LayeredRuntime
  responsibility: host composition root plus internal runtime layers
  local_contract: src/ARCHITECTURE.md
- path: tests/explicit/
  name: explicit-testcase-entries
  kind: AcceptanceEntrypointZone
  responsibility: single-entry read-only landing zone for explicit testcase scripts
  local_contract: tests/explicit/ARCHITECTURE.md
- path: tests/architecture/
  name: critical-architecture-guardrails
  kind: FrozenGuardrailZone
  responsibility: frozen critical non-explicit tests for boundary, dependency, entry correctness, and traceability
  local_contract: tests/architecture/ARCHITECTURE.md

### Architecture Contract Convention
- root_file: OVERALL_ARCHITECTURE.md
- local_file: ARCHITECTURE.md
- contract_style: shared-skeleton
- gradual_disclosure_rule: read root contract before any local contract, then descend only into affected stable elements

### Layering And Dependency Rules
- conceptual_layers:
  - Host
  - Commands
  - Engine
  - Support
- stable_dependency_direction:
  - Host -> Commands
  - Host -> Support
  - Commands -> Support
  - Engine -> Support
- forbidden_shortcuts:
  - Commands -> Engine implementation internals
  - Engine -> Commands
  - Support -> Commands
  - any module -> extension host orchestration except src/extension.ts and src/workParticipant.ts

### Implements / Traceability Rules
- directory_hierarchy_means: containment-only
- implements_declared_in: root-or-local-contract-only
- direct_intent_mapping_preference: command entrypoints and architecture test tool map directly when semantics are explicit
- indirect_chain_policy: support and engine elements may implement intent indirectly through stable runtime elements

### Explicit Testcase Entrypoint Rules
- ownership_stage: implementationdesign
- physical_root: tests/explicit/entries/
- entry_shape: one testcase to one callable script entry
- mutation_policy: read-only-during-work
- current_repository_fact: no formal explicit testcase objects exist yet in design/KG/SystemArchitecture.json
- current_action: reserve the physical landing zone without inventing new explicit acceptance baselines

### Non-Explicit Test Rules
- critical_tests_root: tests/architecture/
- supporting_tests_default_root: tests/support/
- critical_tests_mutation_policy: read-only-during-work
- supporting_tests_mutation_policy: editable-during-work
- critical_test_kinds:
  - architecture-boundary
  - dependency-direction
  - explicit-entry-correctness
  - implementation-traceability

### Read Order
1. design/KG/SystemArchitecture.json
2. OVERALL_ARCHITECTURE.md
3. affected local ARCHITECTURE.md files
4. relevant code, tests, scripts, and configuration

### Stage Boundaries
- implementationdesign: may update contracts, reserve explicit entry landing zones, and freeze critical non-explicit tests
- work: must treat explicit testcase entries and critical non-explicit tests as read-only acceptance/support baselines

### Open Gaps
- Formal explicit testcase objects are still absent from design/KG/SystemArchitecture.json, so no explicit testcase script can be promoted to read-only acceptance baseline yet.
- Existing tests/e2e/runWorkspaceBootstrapE2E.js remains a repository test asset, not a promoted explicit testcase entry.
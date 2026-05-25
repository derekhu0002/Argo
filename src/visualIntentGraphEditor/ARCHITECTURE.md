---
contract_type: implementation-architecture-element
contract_version: 1
scope: stable-element
element_name: visual-intent-graph-explorer
element_kind: ReadOnlyPresentationModule
element_path: src/visualIntentGraphEditor
---

## Implementation Architecture Contract

### Responsibility
- Own the read-only Intent Graph Visual Explorer as a deep module rather than leaking graph traversal and search semantics into command adapters.
- Resolve explorer state generically from any schema-compliant design/KG/SystemArchitecture.json instead of depending on repository-specific view ids.
- Freeze the test-mode snapshot boundary that explicit testcase entries call during implementation and coding validation.

### Out Of Scope
- Owning VS Code chat command routing.
- Editing or writing back the intent graph JSON.
- Depending on engine, lm, or command internals to compute graph structure.

### Children
- path: index.ts
  kind: module-barrel
  role: stable export surface for the explorer module
- path: openIntentGraphExplorer.ts
  kind: module-entry-file
  role: future explorer facade that accepts graph path plus action requests and returns a frozen snapshot shape in test mode

### Interface Boundary
- input_contract:
  - graph_path: workspace path to a schema-compliant SystemArchitecture graph JSON file
  - action: open | expand-path | search
  - mode: interactive | test
- output_contract:
  - test_mode_snapshot: rootViewId plus visibleViews and optional matchedViewIds
  - failure_mode: readable error when structural root view resolution is ambiguous or when runtime wiring is incomplete

### Structural Resolution Rules
- root_view_resolution: choose the unique view with no parent_element_id; if zero or multiple such views exist, fail with a readable error instead of guessing
- first_layer_derivation: from the root view, inspect each included element and collect its mounted subdiagram_views as the first visible child views
- child_view_derivation: for any expanded view, inspect that view's included elements and follow mounted subdiagram_views to derive child views
- search_scope: at minimum search view_name and the names of elements included by each view
- duplicate_branch_rule: the same child view may appear under multiple expanded parent branches when multiple visible parent views include the mounting element

### Dependencies
#### allowed
- path: vscode
  reason: the explorer will eventually need a VS Code presentation surface

#### forbidden
- path: ../commands
  reason: the deep module must not depend upward on command routing
- path: ../engine
  reason: explorer graph traversal must remain separate from semantic engine internals
- path: ../lm
  reason: explorer state must not depend on model adapters

### Implements / Traceability
#### implements_intent
- element: Intent Graph Visual Explorer
- element: 渐进式披露 View
- element: View 层级由挂接元素决定

#### implements_elements
- element: src/ARCHITECTURE.md#runtime-host

### Explicit Testcase Entrypoints
- testcase: INTENT-GRAPH-TOP-LEVEL-DRILLDOWN
  command_id: argo.openIntentGraphExplorer
  physical_test_entry: ../../tests/explicit/entries/runIntentGraphTopLevelDrilldown.js
  control_point: the explicit entry asks the module, through the future command adapter, for an initial test-mode snapshot and then an expand-path snapshot
  observation_point: the initial snapshot exposes only the structural first layer, and the expand-path snapshot reveals the selected child path
- testcase: INTENT-GRAPH-SEARCH-EXPANSION
  command_id: argo.openIntentGraphExplorer
  physical_test_entry: ../../tests/explicit/entries/runIntentGraphSearchExpansion.js
  control_point: the explicit entry asks the module, through the future command adapter, for search snapshots by view name and included element name
  observation_point: the returned snapshot exposes the matched target view and ancestor visibility without graph mutation

### Test Guardrails
#### critical_non_explicit_tests
- test_id: visual-intent-graph-boundary
  critical_kind: architecture-boundary
  test_path: ../../tests/architecture/visual-intent-graph-boundary.test.js
  execution_entry: ../../tests/architecture/visual-intent-graph-boundary.test.js
  guards_elements:
    - index.ts
    - openIntentGraphExplorer.ts
  protected_baselines:
    - ARCHITECTURE.md
  rationale: freeze the deep module boundary and stable file layout before coding fills in runtime behavior
  frozen_by_stage: implementationdesign

- test_id: visual-intent-graph-dependency-direction
  critical_kind: dependency-direction
  test_path: ../../tests/architecture/visual-intent-graph-dependency-direction.test.js
  execution_entry: ../../tests/architecture/visual-intent-graph-dependency-direction.test.js
  guards_elements:
    - index.ts
    - openIntentGraphExplorer.ts
  protected_baselines:
    - ARCHITECTURE.md
  rationale: keep explorer traversal and presentation below commands and away from engine internals
  frozen_by_stage: implementationdesign

#### supporting_non_explicit_tests
- path: ../../tests/support/intent-graph-structural-discovery.test.js
  scope: coding-stage support guard for generic root discovery, first-layer derivation, and search candidate selection against a schema-compliant graph

### Open Gaps
- The command contribution `argo.openIntentGraphExplorer` and the interactive presentation layer are not implemented yet.
- The module facade currently only freezes request and snapshot shapes; Coding/Repair must implement the runtime behavior that satisfies the explicit entries.

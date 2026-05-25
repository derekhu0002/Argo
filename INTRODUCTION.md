# Argo Introduction

Argo is a VS Code extension for architecture-governed engineering workflows. It separates intent design, implementation design, and coding/repair into explicit stages, then uses handoff artifacts and frozen test entrypoints to keep implementation aligned with the intended architecture.

## External Interfaces

### Chat Participant

- Participant: `@argowork`
- Purpose: expose staged workflow commands inside VS Code Chat

Supported chat commands:

- `/argo-init`: copy Argo bootstrap assets into the current workspace
- `/intentinarchitecturedesign`: prepare the intent-design handoff
- `/implementationdesign`: prepare the implementation-design handoff
- `/test`: execute architecture-linked explicit test entries and refresh failure records
- `/work`: prepare the coding/repair handoff from persisted failure records
- `/idle`: reset Argo's internal stage guard back to idle

### VS Code Command

- Command id: `argo.openIntentGraphExplorer`
- Purpose: open the read-only Intent Graph Visual Explorer runtime path

Request contract:

- `graphPath`: workspace path to a schema-compliant `design/KG/SystemArchitecture.json`
- `action`: `open`, `expand-path`, or `search`
- `mode`: `interactive` or `test`
- `targetViewId`: required for `expand-path`
- `query`: required for `search`

When the command is invoked directly from the VS Code command palette without arguments, Argo now defaults to the current workspace file `design/KG/SystemArchitecture.json`, uses `interactive` mode, and opens a read-only interactive explorer panel with click-to-expand navigation plus search and reset controls.

Behavior contract:

- The explorer is read-only and does not write back to the intent graph.
- The main explorer interactive webview is now rendered by a bundled React frontend rather than inline HTML and script strings.
- Root view resolution is structural: it uses the unique view with no `parent_element_id`.
- Initial open exposes only the structural first-layer child views.
- Expand-path reveals the selected visible branch.
- Search matches at minimum on `view_name` and included element names, then reveals the matched target view and its visible ancestor path.
- Clicking a visible view in the explorer opens a separate read-only webview that shows the clicked view's included elements and relationship graph.
- The detail webview now uses a bundled React Flow renderer with auto-layout for the relationship graph.
- Clicking an element in the detail webview highlights its incoming and outgoing relationships while dimming unrelated nodes and edges.

Response contract:

- `graphPath`: the graph path used for the request
- `rootViewId`: the resolved structural root view id
- `visibleViews`: the visible branch snapshot, including `viewId`, `viewName`, `depth`, and optional `parentViewId`
- `matchedViewIds`: present for search requests

## Expected Inputs

Argo expects the repository to expose the following architecture assets:

- `design/KG/SystemArchitecture.json`
- `design/KG/IntentToImplementationHandoff.json`
- `design/KG/ImplementationToCodingHandoff.json`
- `OVERALL_ARCHITECTURE.md`

## Validation Entrypoints

The current repository exposes these relevant executable validation entries:

- `npm run test:explicit:intent-graph-top-level-drilldown`
- `npm run test:explicit:intent-graph-search-expansion`
- `npm run validate:handoff:implementation`
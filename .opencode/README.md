# Argo HARNESS for OpenCode

Argo HARNESS is a multi-agent delivery workflow for OpenCode. It separates work into intent design, implementation design, coding/repair, and two-layer acceptance review, with deterministic guardrails from the architecture graph, handoff files, test entrypoints, schemas, and MCP tools.

## Directory Layout

```text
.opencode/agents/       Agent role definitions and authority boundaries
.opencode/skills/       Workflow skills
.opencode/commands/     /argoinit and /argotest command entrypoints
.opencode/mcp.json      MCP configuration; registers only the root-level `argo` server
scripts/                Canonical MCP servers and deterministic execution scripts
schema/                 Canonical JSON Schema assets
```

## Unified MCP Server

All three platform bundles, `.cursor`, `.github`, and `.opencode`, register one MCP server named `argo`.

The only MCP server entrypoint is:

```text
scripts/argo-mcp-server.js
```

Primary tools exposed by the unified server:

- `initializeWorkspace`
- `validateSystemArchitecture`
- `validateStageHandoff`
- `runArchitectureTests`
- `getSystemArchitecture`
- `previewSystemArchitectureMutation`
- `applySystemArchitectureMutation`
- `addArchitectureElement`
- `updateArchitectureElement`
- `addArchitectureRelationship`
- `updateArchitectureRelationship`
- `addViewMembership`

Agents must not call legacy OpenCode custom tools for these operations. Deterministic operations go through the unified MCP server.

## Canonical Scripts

MCP-related executable code is centralized under root-level `scripts/`:

```text
scripts/argo-mcp-server.js
scripts/systemarchitecture-mcp-server.js
scripts/validator-mcp-server.js
scripts/validateSystemArchitecture.js
scripts/validateStageHandoff.js
scripts/runArchitectureTests.js
```

The `.cursor`, `.github`, and `.opencode` bundles do not keep validator script or MCP wrapper copies.

## Canonical Schemas

Schemas are centralized under root-level `schema/`:

```text
schema/SystemArchitecture.schema.json
schema/IntentToImplementationHandoff.schema.json
schema/ImplementationToCodingHandoff.schema.json
```

Agents, skills, MCP servers, validators, and viewers must read schema files from root-level `schema/`.

## Agent Summary

| Agent | Role | Core responsibility | Boundary |
| --- | --- | --- | --- |
| `Orchestrator` | Dispatcher | Route user work to the correct stage agent and enforce rework loops. | Must not directly implement requirements or edit implementation artifacts. |
| `IntentionDesign` | Intent architect | Maintain `design/KG/SystemArchitecture.json`, intent elements, relationships, views, principles, constraints, and explicit acceptance testcases. | Graph mutations must use unified `argo` MCP preview/apply and then `validateSystemArchitecture`. |
| `ImplementationDesign` | Implementation architect | Produce implementation contracts, test entrypoints, guardrails, and implementation handoff files. | Must not directly modify `SystemArchitecture.json`. |
| `CodingAndReparing` | Coding/repair executor | Fix real implementation issues from handoff and failure records, then run explicit architecture tests. | Must not modify frozen tests, frozen contracts, or the intent graph. |
| `ArchimateLanguagistAudit` | ArchiMate auditor | Review schema compliance, ArchiMate semantics, wording precision, view consistency, and traceability. | Read-only by default. |
| `BusinessPartner` | Business challenger | Pressure-test business options with MECE decision trees and SMART acceptance criteria. | Does not enter software architecture or coding implementation. |
| `Init` | Init command agent | Handles `/argoinit` by calling `initializeWorkspace`. | Startup preparation only. |
| `Test` | Test command agent | Handles `/argotest` by calling `runArchitectureTests`. | Acceptance test execution only. |

## Recommended Usage

- Initialize the workspace with `/argoinit`, which calls unified `argo` MCP tool `initializeWorkspace`.
- Browse architecture with the `arch-viewer` skill.
- Send new requirements or defects to `Orchestrator`, which starts from `IntentionDesign`.
- Validate stage handoff files with unified `argo` MCP tool `validateStageHandoff`.
- Run coding acceptance with unified `argo` MCP tool `runArchitectureTests`, using `design/KG/test-failure-records.json` as the repair queue.
- Restart OpenCode after changing MCP configuration, agents, skills, or command definitions.

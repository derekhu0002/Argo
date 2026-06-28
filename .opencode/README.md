# Argo HARNESS for OpenCode

Argo HARNESS is a multi-agent delivery workflow for OpenCode. It separates work into intent design, implementation design, coding/repair, and two-layer acceptance review, with deterministic guardrails from the architecture graph, handoff files, test entrypoints, schemas, and MCP tools.

## Directory Layout

```text
.opencode/agents/       Agent role definitions and authority boundaries
.opencode/skills/       Workflow skills
.opencode/commands/     /argoinit and /argotest command entrypoints
.opencode/mcp.json      MCP configuration; registers only the root-level `argo` server
.argo/scripts/          Canonical MCP servers and deterministic execution scripts
.argo/schema/           Canonical JSON Schema assets
```

## Unified MCP Server

All three platform bundles, `.cursor`, `.github`, and `.opencode`, register one MCP server named `argo`.

The only MCP server entrypoint is:

```text
.argo/scripts/argo-mcp-server.js
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
- `addArchitectureView`
- `updateArchitectureView`
- `removeArchitectureView`

Agents must not call legacy OpenCode custom tools for these operations. Deterministic operations go through the unified MCP server.

## Canonical Scripts

MCP-related executable code is centralized under `.argo/scripts/`:

```text
.argo/scripts/argo-mcp-server.js
.argo/scripts/systemarchitecture-mcp-server.js
.argo/scripts/validator-mcp-server.js
.argo/scripts/validateSystemArchitecture.js
.argo/scripts/validateStageHandoff.js
.argo/scripts/runArchitectureTests.js
```

The `.cursor`, `.github`, and `.opencode` bundles do not keep validator script or MCP wrapper copies.

## Canonical Schemas

Schemas are centralized under `.argo/schema/`:

```text
.argo/schema/SystemArchitecture.schema.json
.argo/schema/IntentToImplementationHandoff.schema.json
.argo/schema/ImplementationToCodingHandoff.schema.json
```

Agents, skills, MCP servers, validators, and viewers must read schema files from `.argo/schema/`.

## Agent Summary

| Agent | Role | Core responsibility | Boundary |
| --- | --- | --- | --- |
| `Orchestrator` | Dispatcher | Route user work to the correct stage agent and enforce rework loops. | Must not directly implement requirements or edit implementation artifacts. |
| `IntentionDesign` | Intent architect | Maintain `design/KG/SystemArchitecture.json`, intent elements, relationships, views, principles, constraints, and explicit acceptance testcases. | Graph mutations must use unified `argo` MCP preview/apply and then `validateSystemArchitecture`. |
| `ImplementationDesign` | Implementation architect | Produce implementation contracts, test entrypoints, guardrails, and implementation handoff files. | Must not directly modify `SystemArchitecture.json`. |
| `CodingAndReparing` | Coding/repair executor | Fix real implementation issues from handoff and failure records, then run explicit architecture tests. | Must not modify frozen tests, frozen contracts, or the intent graph. |
| `ArchimateLanguagistAudit` | ArchiMate auditor | Review schema compliance, ArchiMate semantics, wording precision, view consistency, and traceability. | Read-only by default. |
| `BusinessPartner` | Business challenger | Pressure-test business options with MECE decision trees, SMART acceptance criteria, and structured `DecisionTreeRecord` output. | Stays in business decisions and acceptance semantics; does not enter implementation design or coding. |
| `TaskTidyGraphIntegrator` | Intent graph integrator | Integrate the decision-tree table written by `task-tidy` into `SystemArchitecture.json` and return coverage evidence for host validation. | Does not re-litigate the business decision tree; final acceptance stays with the `task-tidy` host agent. |
| `Init` | Init command agent | Handles `/argoinit` by calling `initializeWorkspace`. | Startup preparation only. |
| `Test` | Test command agent | Handles `/argotest` by calling `runArchitectureTests`. | Acceptance test execution only. |

## Recommended Usage

- Initialize the workspace with `/argoinit`, which calls unified `argo` MCP tool `initializeWorkspace`.
- Browse architecture with the `arch-viewer` skill.
- Send new requirements or defects to `Orchestrator`, which starts from `IntentionDesign`.
- Validate stage handoff files with unified `argo` MCP tool `validateStageHandoff`.
- Run coding acceptance with unified `argo` MCP tool `runArchitectureTests`, using `design/KG/test-failure-records.json` as the repair queue.
- Restart OpenCode after changing MCP configuration, agents, skills, or command definitions.

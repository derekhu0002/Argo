# ARGO Implementation Architecture Contract

## Root rules

1. Production dependencies point from the unified MCP gateway to the intent-query boundary and from that boundary to canonical graph persistence; production code never depends on `tests/`.
2. `getSystemArchitecture` remains the single public reading interface. An omitted `query` preserves the legacy complete canonical response; an explicit `query` selects purpose-aware behavior.
3. Canonical JSON is authoritative. Semantic retrieval may derive context but cannot replace, mutate, or silently truncate a required full snapshot.
4. Test Harness code may invoke public production boundaries and read approved fixtures; explicit entrypoints use Harness methods and do not expose MCP, filesystem, or process plumbing.
5. Explicit entrypoints and critical guardrails listed in the implementation handoff are frozen during Coding/Repair.

## Stable architecture elements

| Stable element | Path | Responsibility | Public boundary |
| --- | --- | --- | --- |
| Unified MCP Gateway | `.argo/scripts/argo-mcp-server.js` | Expose one governed tool surface and delegate intent-query work inward. | `callTool(name, args)` and MCP stdio tools |
| Intent Architecture Query Boundary | `.argo/scripts/systemarchitecture-mcp-server.js` | Preserve no-argument reads, validate explicit query purpose, and dispatch full-snapshot or semantic-query behavior. | `getSystemArchitecture` |
| Canonical Intent Graph | `design/KG/SystemArchitecture.json` | Remain the authoritative source for Elements, Relationships, Views, and memberships. | Workspace-relative canonical graph path |
| Query Acceptance Boundary | `tests/` | Own business-readable Harness, explicit entrypoints, and implementation guardrails. | Frozen Node.js entry scripts |

## Implements mappings

| Implementation element | Intent element ID | Mapping |
| --- | --- | --- |
| Query Acceptance Boundary / compatibility entrypoint | `grag-consumer-role` | direct |
| Query Acceptance Boundary / compatibility entrypoint | `grag-consumption-process` | direct |
| Intent Architecture Query Boundary | `grag-query-service` | direct |
| Canonical Intent Graph | `grag-canonical-graph` | direct |
| Intent Architecture Query Boundary / query DTO | `grag-query-request` | direct |
| Intent Architecture Query Boundary / validation | `grag-mode-validation` | direct |
| Intent Architecture Query Boundary / graph-tidy dispatch | `grag-graph-tidy-policy` | direct |

Module responsibilities, allowed local dependencies, interface details, and test ownership are defined only by the local `ARCHITECTURE.md` contracts.

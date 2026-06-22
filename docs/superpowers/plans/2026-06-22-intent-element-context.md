# Intent Element Context Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only MCP query tool that returns an agent-ready intent subgraph context for a target architecture element.

**Architecture:** Implement `getIntentElementContext` in the existing SystemArchitecture MCP server and expose it through the unified `argo` MCP server. The returned `subgraph` keeps the source intent graph object shape for `elements`, `relationships`, and `views`, while traversal metadata, boundary diagnostics, and work context remain outside the subgraph.

**Tech Stack:** Node.js CommonJS scripts, repository-native MCP JSON-RPC server, `node:assert` tests in `tests/mcp/systemarchitecture-mcp.test.js`.

---

### Task 1: Lock MCP Tool Contract With Failing Tests

**Files:**
- Modify: `tests/mcp/systemarchitecture-mcp.test.js`
- Test: `npm run test:mcp:systemarchitecture`

- [ ] **Step 1: Add tests for listing and querying `getIntentElementContext`**

Add assertions that the tool is listed, accepts `elementId`, `dependencyDepth`, `dependentDepth`, `associationDepth`, and `associationNeighborDependencyDepth`, and returns `subgraph.elements`, `subgraph.relationships`, and `subgraph.views` without document-level `name` or `description`.

- [ ] **Step 2: Add semantic traversal fixture**

Create a temporary graph inside the test with:
- `Provider --(Serving)--> Focus`, where `Provider` is a dependency of `Focus`.
- `Whole --(Composition)--> Focus` and `Aggregate --(Aggregation)--> Focus`, where both structural sources are dependencies.
- `Focus --(Association)--> Associated`, where `Associated` is included one layer but its own dependency is not included by default.
- `Dependent --(Access)--> Focus`, where `Dependent` is included only through `dependentDepth`.

- [ ] **Step 3: Run the test and confirm RED**

Run: `npm run test:mcp:systemarchitecture`

Expected: FAIL because `getIntentElementContext` is not listed and `callTool` does not recognize it.

### Task 2: Implement Read-Only Context Query

**Files:**
- Modify: `scripts/systemarchitecture-mcp-server.js`
- Modify: `scripts/argo-mcp-server.js`
- Test: `npm run test:mcp:systemarchitecture`

- [ ] **Step 1: Add tool schema**

Expose `getIntentElementContext` with inputs:
- `elementId` or `elementName`
- `profile`
- `dependencyDepth`
- `dependentDepth`
- `associationDepth`
- `associationNeighborDependencyDepth`
- `architecturePath`

- [ ] **Step 2: Resolve the focus element**

Resolve by id first. If only `elementName` is provided, match by exact name. Return `status: "ambiguous"` with candidates for multiple matches and `status: "failed"` for no matches.

- [ ] **Step 3: Build semantic traversal**

Use ArchiMate relationship semantics, not raw incoming/outgoing direction:
- `Serving`: target depends on source.
- `Access`, `Assignment`: source depends on target.
- `Realization`, `Flow`, `Triggering`: target depends on source.
- `Composition`, `Aggregation`: source and target are both dependency-context neighbors.
- `Association`: symmetric associated-context neighbor, at least one layer.
- `Influence`: target weakly depends on source.

- [ ] **Step 4: Build native subgraph slice**

Return only:

```json
{
  "elements": [],
  "relationships": [],
  "views": []
}
```

Elements, relationships, and views must be cloned from the source graph without reshaping their internal fields.

- [ ] **Step 5: Add boundary and exploration hints**

When depth limits stop further traversal, report truncated dependency/dependent/association boundary nodes and suggested `getIntentElementContext` arguments.

- [ ] **Step 6: Expose through unified argo server**

Add `getIntentElementContext` to `SYSTEM_ARCHITECTURE_TOOL_NAMES` and the unified tool list in `scripts/argo-mcp-server.js`.

- [ ] **Step 7: Run GREEN**

Run: `npm run test:mcp:systemarchitecture`

Expected: PASS.

### Task 3: Verification

**Files:**
- Validate: `scripts/systemarchitecture-mcp-server.js`
- Validate: `scripts/argo-mcp-server.js`
- Validate: `tests/mcp/systemarchitecture-mcp.test.js`

- [ ] **Step 1: Run focused MCP tests**

Run: `npm run test:mcp:systemarchitecture`

Expected: PASS.

- [ ] **Step 2: Check edited-file lints**

Run editor diagnostics for the edited files and fix introduced issues.

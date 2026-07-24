# Typed MCP Query Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `getSystemArchitecture` expose a discriminated typed MCP contract while preserving its legacy text response.

**Architecture:** Define one reusable JSON Schema object in the system-architecture MCP module and attach it to both exported tool declarations. Wrap every `getSystemArchitecture` payload with matching `structuredContent` while keeping the existing JSON text content byte-semantically equivalent. Prove the contract through the TS-00 explicit entrypoint and existing compatibility regressions.

**Tech Stack:** Node.js CommonJS, MCP JSON-RPC 2024-11-05, JSON Schema, `node:assert`.

## Global Constraints

- No-argument calls return the complete canonical graph.
- Typed query responses and typed errors are discriminated without parsing free text.
- Existing consumers continue to receive `content[0].text`.
- Legal purposes remain `intent-decision`, `implementation-design`, `coding-repair`, `audit`, and `graph-tidy`.
- Audit requests require a non-blank subject.

---

### Task 1: Physicalize TS-00 acceptance

**Files:**
- Create: `tests/explicit/entries/runTypedMcpQueryContract.js`

**Interfaces:**
- Consumes: gateway MCP stdio `tools/list` and `callTool('getSystemArchitecture', args, ..., dependencies)`.
- Produces: executable acceptance entry covering schema declaration, snapshot, semantic query, typed errors, and text compatibility.

- [ ] Write assertions for the required input/output schemas and all response variants.
- [ ] Run `node tests/explicit/entries/runTypedMcpQueryContract.js`.
- [ ] Confirm RED because `outputSchema` and `structuredContent` do not exist.

### Task 2: Define and return the typed contract

**Files:**
- Modify: `.argo/scripts/systemarchitecture-mcp-server.js`
- Modify: `.argo/scripts/argo-mcp-server.js`

**Interfaces:**
- Produces: `GET_SYSTEM_ARCHITECTURE_OUTPUT_SCHEMA`.
- Produces: response variants discriminated by `mode` and versioned by `version`.
- Preserves: legacy payload in `content[0].text`.

- [ ] Add the minimal discriminated output schema for `full-snapshot`, `semantic-query`, and `error`.
- [ ] Require `document` for successful variants, `query` for semantic-query, and typed `error` fields for failures.
- [ ] Return each payload as both `structuredContent` and legacy JSON text.
- [ ] Run TS-00 until GREEN.

### Task 3: Regress compatibility and MCP behavior

**Files:**
- Modify only if a regression exposes a contract defect.

**Interfaces:**
- Consumes: existing explicit acceptance entries and MCP suite.

- [ ] Run `runGraphQueryCompatibility.js`.
- [ ] Run `runCanonicalGraphFullSnapshot.js`.
- [ ] Run `runQueryPurposeValidation.js`.
- [ ] Run `runGraphTidyFullSnapshot.js`.
- [ ] Run `npm run test:mcp:systemarchitecture`.

### Task 4: Synchronize architecture delivery state

**Files:**
- Update through repository runner: `design/KG/SystemArchitecture.json`
- Update through repository runner: `design/KG/test-failure-records.json`

**Viewpoint frame:**
- Viewpoint: Implementation and Migration Viewpoint.
- Concern: delivery owners need W1 implementation and acceptance status traceable to the typed MCP interface.
- Purpose: handoff preparation and delivery-status synchronization.
- Scope: existing W1 elements and existing W1 views only; no new view is introduced.

- [ ] Run `npm run test:argo` to refresh mounted testcase status.
- [ ] Run `npm run validate:system-architecture`.
- [ ] Inspect the resulting diff and ensure only W1-relevant generated status changed.

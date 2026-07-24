# Intent Query Runtime Contract

This local contract refines `OVERALL_ARCHITECTURE.md`.

## Responsibilities

- `.argo/scripts/argo-mcp-server.js` owns transport-neutral tool registration and delegates `getSystemArchitecture` without interpreting query policy.
- `.argo/scripts/systemarchitecture-mcp-server.js` owns the deep query module: request validation, mode selection, canonical full reads, and later semantic-query dispatch.
- `design/KG/SystemArchitecture.json` remains the canonical read source; no query mode may rewrite it.

## Interface boundary

`getSystemArchitecture` accepts:

- no `query`: return the existing payload shape with the complete canonical `document`;
- `query.purpose`: one of `intent-decision`, `implementation-design`, `coding-repair`, `audit`, or `graph-tidy`;
- `query.intent`: required non-empty natural-language intent for an explicit query;
- `query.subject`: required non-empty audit subject when `purpose` is `audit`;
- optional deterministic anchors may be added without changing no-argument behavior.

Successful explicit requests expose normalized `query` metadata. `graph-tidy` reports `mode: "full-snapshot"` and `semanticRetrieval: "bypassed"`. Audit without subject returns `status: "failed"` with `error.category: "AUDIT_SUBJECT_REQUIRED"`.

## Local dependencies

- The unified gateway may depend on `systemarchitecture-mcp-server.js` through `callTool`.
- The query boundary may depend on graph/schema validation, canonical filesystem loading, and Neo4j synchronization support.
- Neither runtime module may depend on `tests/`, explicit entrypoints, or test-only fixtures.

## Owned tests

Runtime behavior is accepted through the test-owned paths declared in `tests/ARCHITECTURE.md`. This module owns no mutable test expectations.

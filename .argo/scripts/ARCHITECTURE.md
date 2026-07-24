# Intent Query Runtime Contract

This local contract refines `OVERALL_ARCHITECTURE.md`.

## Responsibilities

- `.argo/scripts/argo-mcp-server.js` owns transport-neutral tool registration and delegates `getSystemArchitecture` without interpreting query policy.
- `.argo/scripts/systemarchitecture-mcp-server.js` owns the deep query module: request validation, mode selection, canonical full reads, and later semantic-query dispatch.
- `design/KG/SystemArchitecture.json` remains the canonical read source; no query mode may rewrite it.

## Interface boundary

`getSystemArchitecture` accepts:

- no `query`: return exactly the legacy public envelope `{ status, graphPath, document }` with the complete canonical `document` and no query-mode metadata;
- `query.purpose`: one of `intent-decision`, `implementation-design`, `coding-repair`, `audit`, or `graph-tidy`;
- `query.intent`: required non-empty natural-language intent for an explicit query;
- `query.subject`: required non-empty audit subject when `purpose` is `audit`;
- optional deterministic anchors may be added without changing no-argument behavior.

All five purpose values remain legal contract inputs. `intent-decision`, `implementation-design`, `coding-repair`, and valid `audit` requests invoke the semantic retrieval boundary; `graph-tidy` never invokes it and reports `mode: "full-snapshot"` plus `semanticRetrieval: "bypassed"`.

Validation occurs before retrieval and returns these stable categories:

- missing purpose: `QUERY_PURPOSE_REQUIRED`;
- purpose outside the legal enum: `QUERY_PURPOSE_INVALID`;
- missing or blank intent: `QUERY_INTENT_REQUIRED`;
- missing or blank audit subject: `AUDIT_SUBJECT_REQUIRED`.

The in-process `callTool` boundary accepts an internal dependency override containing `semanticRetrievalBoundary.retrieve(request)` and forwards it unchanged to the deep query module. This is not part of the public MCP schema. Production supplies the real adapter; the frozen Harness supplies a test-owned spy, so acceptance tests observe boundary calls independently of response fields without creating a production dependency on `tests/`.

## Local dependencies

- The unified gateway may depend on `systemarchitecture-mcp-server.js` through `callTool`.
- The deep query module depends inward on the injected semantic retrieval boundary rather than constructing retrieval inside validation or mode selection.
- The query boundary may depend on graph/schema validation, canonical filesystem loading, and Neo4j synchronization support.
- Neither runtime module may depend on `tests/`, explicit entrypoints, or test-only fixtures.

## Owned tests

Runtime behavior is accepted through the test-owned paths declared in `tests/ARCHITECTURE.md`. This module owns no mutable test expectations.

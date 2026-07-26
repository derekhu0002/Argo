# Intent Query Runtime Contract

This local contract refines `OVERALL_ARCHITECTURE.md`.

## Responsibilities

- `.argo/scripts/argo-mcp-server.js` owns transport-neutral tool registration and delegates `getSystemArchitecture` without interpreting query policy.
- `.argo/scripts/systemarchitecture-mcp-server.js` owns the deep query module: request validation, mode selection, canonical full reads, and later semantic-query dispatch.
- `design/KG/SystemArchitecture.json` remains the canonical read source; no query mode may rewrite it.
- W6 semantic-query responses must expose the governing canonical graph version in query/result evidence and it must equal the canonical version or Harness-defined fingerprint of the same legacy graph read; missing or mismatched canonical-version evidence blocks coherent-result delivery even when the no-argument canonical read still succeeds.

## Interface boundary

`getSystemArchitecture` accepts:

- no `query`: return exactly the legacy public envelope `{ status, graphPath, document }` with the complete canonical `document` and no query-mode metadata;
- `query.purpose`: one of `intent-decision`, `implementation-design`, `coding-repair`, `audit`, or `graph-tidy`;
- `query.intent`: required non-empty natural-language intent for an explicit query;
- `query.subject`: required non-empty audit subject when `purpose` is `audit`;
- optional deterministic anchors may be added without changing no-argument behavior.

All five purpose values remain legal contract inputs. `intent-decision`, `implementation-design`, `coding-repair`, and valid `audit` requests invoke the semantic retrieval boundary; `graph-tidy` never invokes it and reports `mode: "full-snapshot"` plus `semanticRetrieval: "bypassed"`.

For W6, semantic query results must remain traceable to the canonical graph version used by the same no-argument legacy read. Endpoint, View, and provenance completion are delegated inward to the Graph RAG boundary, but the query service must surface their evidence without silently dropping or rewriting `canonicalVersion`, policy, index, or alignment fields.

Validation occurs before retrieval and returns these stable categories:

- missing purpose: `QUERY_PURPOSE_REQUIRED`;
- purpose outside the legal enum: `QUERY_PURPOSE_INVALID`;
- missing or blank intent: `QUERY_INTENT_REQUIRED`;
- missing or blank audit subject: `AUDIT_SUBJECT_REQUIRED`.

Public semantic `getSystemArchitecture` dispatch routes through the Production Semantic Operator Journey and its trusted recorded readiness authorization. Only the private raw semantic-query delegate accepts `semanticRetrievalBoundary.retrieve(request)` for the operator's final inward query port; it is not a public tool path. No-argument and graph-tidy reads continue to bypass semantic work. System and unified JSON-RPC handlers preserve one exact readiness error object containing only `category`, `state`, `verified`, canonical/content/index versions, completed/missing/mismatched channels, `fullSnapshotFallback`, and `action`. Every value derives from its identically named approved error diagnostic under the frozen normalization, except literal-false `fullSnapshotFallback`; constants, cross-field substitutions, message, stack, secrets, unsafe source, and extras are prohibited.

## Local dependencies

- The unified gateway may depend on `systemarchitecture-mcp-server.js` through `callTool`.
- The deep query module depends inward on the injected semantic retrieval boundary rather than constructing retrieval inside validation or mode selection.
- The query boundary may depend on graph/schema validation, canonical filesystem loading, and Neo4j synchronization support.
- Neither runtime module may depend on `tests/`, explicit entrypoints, or test-only fixtures.

## Owned tests

Runtime behavior is accepted through the test-owned paths declared in `tests/ARCHITECTURE.md`. This module owns no mutable test expectations.

# Intent Query Runtime Contract

This local contract refines `OVERALL_ARCHITECTURE.md`.

## Responsibilities

- `.argo/scripts/argo-mcp-server.js` owns transport-neutral tool registration, keeps canonical `initializeWorkspace`/argo init semantics explicit, privately invokes the canonical semantic lifecycle after initialization, and delegates `getSystemArchitecture` without interpreting query policy.
- `.argo/scripts/systemarchitecture-mcp-server.js` owns the deep query and canonical-write orchestration module: request validation, mode selection, canonical full reads, per-call persistent semantic readiness, exact touched-ID mutation dispatch, and durable lifecycle outcome attachment.
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

Public semantic `getSystemArchitecture` dispatch privately composes accepted WP-P2 readiness and retrieval on every ordinary query. No prior explicit readiness command or durable WP-P3 authorization record is required or publicly routable. This applies to exported System/unified `callTool` invocations and JSON-RPC handlers alike. Only the private raw semantic-query delegate accepts `semanticRetrievalBoundary.retrieve(request)` after the same invocation has freshly verified persistent readiness; it is not a public tool path or a missing-dependency fallback. No-argument and graph-tidy reads continue to bypass semantic work. System and unified JSON-RPC handlers preserve one exact readiness error object containing only `category`, `state`, `verified`, canonical/content/index versions, completed/missing/mismatched channels, `fullSnapshotFallback`, and `action`. Every value derives from its identically named approved error diagnostic under the frozen normalization, except literal-false `fullSnapshotFallback`; constants, cross-field substitutions, message, stack, secrets, unsafe source, and extras are prohibited.

`startNewProjectSemanticJourney`, `backfillSystemArchitectureSemanticProjection`, and `verifySystemArchitectureSemanticReadiness` are retired public names. They are absent from both `TOOLS` registries, both `tools/list` responses, `SYSTEM_ARCHITECTURE_TOOL_NAMES`, and all public `callTool` branches. Their WP-P1/WP-P2 operations remain private ports under canonical argo init and ordinary `getSystemArchitecture(query)`.

Every successful batch or focused canonical write clears readiness before semantic side effects and passes exact `touchedElementIds`, `touchedRelationshipIds`, and `touchedViewIds` to the durable incremental lifecycle. Preview/dry-run never enters that lifecycle. Canonical JSON remains written and authoritative when semantic work is disabled or fails; the response records Pending, Stale, or Failed with `fullSnapshotFallback: false`.

The cumulative canonical lifecycle target set remains `argo-mcp-server.js`, `systemarchitecture-mcp-server.js`, `graph-rag/semanticOperatorJourney.js`, `graph-rag/mutationEmbeddingVectorLifecycle.js`, and `graph-rag/defaultSemanticRetrieval.js`. The current SP-05 correction authorizes only `systemarchitecture-mcp-server.js` and `graph-rag/semanticOperatorJourney.js`: canonical init must expose and invoke the existing readiness store's invalidate/failure ports so every disabled, invalid, configuration-failed, reconciliation-failed, resumed, and rerun outcome transforms one stable identity/recordId/canonical-version record with increasing revision. Gateway routing, mutation behavior, WP-P2 algorithms, configuration, WP-P1 persistence/backfill/checkpoint/Neo4j adapters, runtime, provider, and every other module remain frozen inward dependencies.

## Local dependencies

- The unified gateway may depend on `systemarchitecture-mcp-server.js` through `callTool` and one private post-initialize lifecycle port.
- The deep query module depends inward on the injected semantic retrieval boundary rather than constructing retrieval inside validation or mode selection.
- The query boundary may depend on graph/schema validation, canonical filesystem loading, and Neo4j synchronization support.
- Neither runtime module may depend on `tests/`, explicit entrypoints, or test-only fixtures.

## Owned tests

Runtime behavior is accepted through the test-owned paths declared in `tests/ARCHITECTURE.md`. This module owns no mutable test expectations.

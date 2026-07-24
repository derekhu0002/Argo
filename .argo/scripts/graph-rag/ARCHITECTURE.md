# Production Graph RAG Contract

This local contract refines `OVERALL_ARCHITECTURE.md`.

## Responsibilities

- `productionGraphRagRuntime.js` is the single composition boundary for production semantic queries and index-delivery qualification.
- `externalProductionConfig.js` reads Neo4j and embedding-provider credentials from injected or external secure configuration and returns typed blocking failures when required values are absent.
- `embeddingQualificationGate.js` accepts only explicit human-approved provider, model identity, model version, and dimensions. It must reject missing approval, missing fields, and any inferred provider/model/version/dimensions.
- `neo4jNativeRetrieval.js` owns Neo4j JavaScript-driver retrieval and returns projection identity/version evidence; it never becomes canonical authority.
- `canonicalProjectionAuthority.js` compares projection evidence with the canonical graph and either selects canonical state or rejects stale/conflicting projection state.

## Public interface

The four inward boundaries are independently callable and independently testable before runtime composition:

- `resolveExternalProductionConfig(configuration, context)` identifies each missing Neo4j URI, username, password, or embedding credential and blocks both startup and semantic-query operations. No direct literal or logical/nullish/ternary fallback may synthesize these values.
- `evaluateEmbeddingQualification(qualification)` accepts only `approvedByHuman === true`, trimmed non-empty provider/model identity/version, and `Number.isInteger(dimensions) && dimensions > 0`; it rejects coercion and implicit defaults.
- `enforceCanonicalProjectionAuthority(input)` rejects or replaces stale/conflicting projection evidence without requiring runtime composition.
- `createNeo4jNativeRetrieval(dependencies)` returns a `retrieve(request)` boundary that forwards each request exactly once and returns the injected query boundary's complete dynamic result unchanged.

`createProductionGraphRagRuntime(dependencies)` returns:

- `querySemantic(request)` for production semantic queries.
- `evaluateIndexDelivery(request)` for the embedding qualification and credential release gate.

Dependencies are explicit: `configuration`, `canonicalGraph`, `neo4jRetrievalBoundary`, and `embeddingQualification`. Tests may inject fakes at these interfaces; production code must not import tests.

Successful query evidence identifies `nodejs` as runtime, `neo4j-native` as retrieval platform, and reports that neither Python nor Neo4j GenAI Plugin is required. Blocking failures use stable categories:

- `EXTERNAL_CREDENTIALS_REQUIRED`
- `EMBEDDING_QUALIFICATION_REQUIRED`
- `EMBEDDING_CONFIGURATION_REQUIRED`
- `IMPLICIT_EMBEDDING_DEFAULT_PROHIBITED`
- `CANONICAL_PROJECTION_CONFLICT`

## Local dependencies

- Runtime composition may depend inward on the configuration, qualification, retrieval, and authority modules in this directory; those modules never depend outward on runtime composition.
- Neo4j retrieval may depend on `neo4j-driver`; no module here may depend on Python, an external Graph RAG framework, the Neo4j GenAI Plugin, or `tests/`.
- Authority policy reads `design/KG/SystemArchitecture.json` through an injected canonical graph boundary and treats Neo4j as a projection only.
- Credentials are values, never module-level defaults; provider credentials must never be interpolated into or transported through Cypher.
- Cypher credential protection follows query and parameter variables structurally into execution calls; keyword-distance windows are not acceptable enforcement.

## Owned tests

Explicit entrypoints are owned by `tests/ARCHITECTURE.md`. This module is protected by the frozen guards in `tests/architecture/production-graph-rag/`, including the coding-scope authorization guard that excludes TS-08/TS-09 adapter/lifecycle work from this handoff.

## Completion attribution

- This slice is complete when its six approved explicit entrypoints and six frozen critical guards pass with no baseline delivered regression.
- Passing TS-07 is sufficient evidence that this slice realizes the external credential boundary.
- Global `grag-credential-boundary.deliveryStatus` remains runner-owned and may remain `not_delivered` while the separately tested adapter realizer is not delivered.
- A deferred global status does not authorize TS-09 work, relationship changes, frozen-test edits, or manual delivery-status changes.

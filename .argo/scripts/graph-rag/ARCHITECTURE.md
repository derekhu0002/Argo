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

- `resolveExternalProductionConfig(configuration, context)` identifies each missing Neo4j URI, username, password, or embedding credential and blocks both startup and semantic-query operations.
- `evaluateEmbeddingQualification(qualification)` identifies absent approval and each missing provider, model identity, version, or dimensions field; it rejects implicit defaults.
- `enforceCanonicalProjectionAuthority(input)` rejects or replaces stale/conflicting projection evidence without requiring runtime composition.
- `createNeo4jNativeRetrieval(dependencies)` returns a `retrieve(request)` boundary that forwards each request exactly once to its injected Neo4j query boundary.

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

## Owned tests

Explicit entrypoints are owned by `tests/ARCHITECTURE.md`. This module is protected by the frozen guards in `tests/architecture/production-graph-rag/`, including the coding-scope authorization guard that excludes TS-08/TS-09 adapter/lifecycle work from this handoff.

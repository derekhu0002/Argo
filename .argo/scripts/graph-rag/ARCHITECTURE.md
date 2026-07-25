# Production Graph RAG Contract

This local contract refines `OVERALL_ARCHITECTURE.md`.

## Responsibilities

- `productionGraphRagRuntime.js` is the single composition boundary for production semantic queries and index-delivery qualification.
- `externalProductionConfig.js` reads Neo4j and embedding-provider credentials from injected or external secure configuration and returns typed blocking failures when required values are absent.
- `embeddingQualificationGate.js` accepts only explicit human-approved provider, model identity, model version, and dimensions. It must reject missing approval, missing fields, and any inferred provider/model/version/dimensions.
- `neo4jNativeRetrieval.js` owns Neo4j JavaScript-driver retrieval and returns projection identity/version evidence; it never becomes canonical authority.
- `canonicalProjectionAuthority.js` compares projection evidence with the canonical graph and either selects canonical state or rejects stale/conflicting projection state.
- `liveEmbeddingProviderConfig.js` preflights the unique `.argo/.env`, resolves the approved process/file source policy for both secrets, and returns only sanitized configuration evidence.
- `liveEmbeddingProviderClient.js` performs one explicitly opted-in HTTPS embedding request against the approved Beijing OpenAI-compatible endpoint; it is not a general generation or lifecycle component.
- `liveEmbeddingIndexGate.js` sequences exact qualification, real-provider vector validation, and one controlled Neo4j evidence write. Invalid or failed paths never invoke the write boundary.

## Public interface

The four inward boundaries are independently callable and independently testable before runtime composition:

- `resolveExternalProductionConfig(configuration, context)` identifies each missing Neo4j URI, username, password, or embedding credential and blocks both startup and semantic-query operations. No direct literal or logical/nullish/ternary fallback may synthesize these values.
- `evaluateEmbeddingQualification(qualification)` accepts only `approvedByHuman === true`, trimmed non-empty provider/model identity/version, and `Number.isInteger(dimensions) && dimensions > 0`; it rejects coercion and implicit defaults.
- `enforceCanonicalProjectionAuthority(input)` rejects or replaces stale/conflicting projection evidence without requiring runtime composition.
- `createNeo4jNativeRetrieval(dependencies)` returns a `retrieve(request)` boundary that forwards each request exactly once and returns the injected query boundary's complete dynamic result unchanged.

`createProductionGraphRagRuntime(dependencies)` returns:

- `querySemantic(request)` for production semantic queries.
- `evaluateIndexDelivery(request)` for the embedding qualification and credential release gate.

`createLiveEmbeddingIndexGate(dependencies)` returns one public gate:

- `executeApprovedEmbedding(input)` for both the real opt-in path and all injected invalid/error cases. There is no production scenario-label shortcut.
- Every rejected live-provider scenario produces zero index writes.
- Only a finite numeric vector with exactly 1024 values can reach the write boundary.
- A frozen Harness-owned transport wrapper independently observes request count, origin/path, method, dynamic input, explicit model/dimensions, protected-header presence, and the raw response vector. Production output and persisted vector evidence must match that observed response exactly.
- Persisted evidence includes provider/model/qualification identity, dimensions, complete vector, canonical identity/version, content identity/version, and index identity/version. Cleanup is complete only when the Harness observes zero remaining test records.
- Secret/file/path/git/reparse/ACL/conflict preflight completes before transport construction, Neo4j connection, or gate execution.

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
- The only file source is repository-relative `.argo/.env`; it may provide the five approved non-sensitive `ARGO_EMBEDDING_*` fields, `ARGO_NEO4J_DATABASE_URL`, `ARGO_NEO4J_DATABASE_USERNAME`, `ARGO_NEO4J_DATABASE_PASSWORD`, and `QWEN_KEY`.
- The only secret keys are `QWEN_KEY` and `ARGO_NEO4J_DATABASE_PASSWORD`. Direct process values take precedence; matching process/file duplicates are accepted from process, differing duplicates fail closed, and missing/blank/duplicate/unknown-secret values are rejected.
- Preflight requires exact canonical path, ignored/untracked evidence, regular non-reparse file state, and a Windows ACL result proving current-identity read access without `Everyone`, `BUILTIN\Users`, or `Authenticated Users` read access. Unverifiable ACL state blocks.
- Loader provenance rejects root/alternate/tracked files, CLI, literal/default/fallback, alias, destructured, generated, or indirect secret sources.
- The approved live profile is provider `alibaba-cloud-model-studio-openai-compatible-cn-beijing`, endpoint `https://llm-clids9mqc5o1mbvb.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`, model `qwen3.7-text-embedding`, qualification `qualification-2026-07-25`, dimensions `1024`.
- Live network access requires explicit opt-in through `ARGO_LIVE_PROVIDER_E2E=1` and is restricted to controlled local or protected CI execution. Default/offline CI remains deterministic but never substitutes fake evidence for a live pass.
- Redaction verification includes a synthetic-success recording boundary that captures full Cypher text/parameter and graph-evidence values, detects canaries in neutral fields, and clears all in-memory persistence before inspecting generated artifacts.
- The controlled Neo4j test boundary uses `ARGO_NEO4J_DATABASE_URL`, `ARGO_NEO4J_DATABASE_USERNAME`, and `ARGO_NEO4J_DATABASE_PASSWORD`; the password flows only to `neo4j.auth.basic`, never to Cypher or evidence.
- `.argo/.env.example` is the only committed example and contains empty placeholders/instructions; `.argo/.env` remains ignored and untracked.

## Owned tests

Explicit entrypoints are owned by `tests/ARCHITECTURE.md`. This module is protected by the frozen guards in `tests/architecture/production-graph-rag/`, including the coding-scope authorization guard that excludes TS-08/TS-09 adapter/lifecycle work from this handoff.

## Completion attribution

- This slice is complete when its six approved explicit entrypoints and seven frozen critical guards pass with no baseline delivered regression.
- Passing TS-07 is sufficient evidence that this slice realizes the external credential boundary.
- Global `grag-credential-boundary.deliveryStatus` remains runner-owned and may remain `not_delivered`; scoped attribution uses committed mounted TS-07 evidence, runner failure records, and the handoff scope rather than uncommitted intent relationships.
- A deferred global status does not authorize TS-09 work, relationship changes, frozen-test edits, or manual delivery-status changes.
- C1-C6 remain a protected checkpoint. The expanded live-provider slice completes only when all eight scoped explicit entrypoints and ten frozen critical guards pass, the live result proves a real HTTP call and controlled Neo4j evidence, and failure/redaction matrices pass with zero baseline delivered regression.

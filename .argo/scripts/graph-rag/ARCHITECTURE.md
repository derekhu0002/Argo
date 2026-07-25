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

`resolveApprovedLiveConfiguration({ repositoryRoot })` is the single production configuration/preflight boundary and creates its sole production source adapter internally. It rejects caller-supplied `adapters.source`, cloned adapters, and self-issued `isIssuedTrace` claims with `SOURCE_ADAPTER_UNTRUSTED`. Frozen fixtures use `withApprovedLiveConfigurationTestComposition({ sourceBehavior, adapters, observeTrace }, callback)`: this module-owned composition root wraps raw behavior, creates and registers the trusted adapter/capability in private identity sets, and invokes the callback with a resolver closure; neither adapter nor capability is returned. Internally issued process reads are frozen `{ value, trace }`; file reads are frozen `{ key, value, trace }[]`. Each trace is generated during the actual wrapped operation and has the exact five-field schema `sourceKind/path/key/operation/aliasChain`. Accepted results expose complete normalized configuration plus per-key attribution; rejected results expose only stable categories.

`createSystemMetadataCommandAdapter({ repositoryRoot })` in `systemMetadataCommandAdapter.js` is the only production boundary allowed to import Node `child_process`. It closes over the canonical `.argo/.env` path and an internal approved executor, then injects four zero-argument capability methods into the resolver: `isSecretFileIgnored()`, `isSecretFileTracked()`, `readCurrentIdentity()`, and `readSecretFileAcl()`. Any extra factory property or capability argument fails `SYSTEM_METADATA_COMMAND_PROHIBITED` before execution. Frozen tests use `withSystemMetadataCommandTestComposition({ repositoryRoot, executeMetadataCommand, mutateInvocation, forbiddenValues }, callback)`, which keeps executor injection and invocation mutation inside a module-owned callback root and drives the same private production validator/adapter. The composition always returns `undefined`, never callback output; it revokes its unique adapter in `finally` after synchronous return/throw or asynchronous fulfillment/rejection. Escaped calls then fail `TEST_SYSTEM_METADATA_ADAPTER_REVOKED` before the executor, and nested/repeated compositions never share adapter or capability identity.

`createApprovedNeo4jBoundary({ configuration, neo4j, logger })` is the production connection/composition boundary. It alone passes username/password to `neo4j.auth.basic`, opens the driver, verifies connectivity before queries, and returns the controlled count/write/read/cleanup boundary used by the live index gate.

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
- `systemMetadataCommandAdapter.js` is the sole system-process exception and owns the one private validator through which every invocation passes immediately before its private executor. It uses `spawnSync` with `shell: false`, an exact repository cwd, UTF-8 output, Windows-hidden execution, and a sanitized environment limited to PATH/PATHEXT/SystemRoot/WINDIR. Its complete command allowlist is `git check-ignore --quiet -- .argo/.env`, `git ls-files --error-unmatch -- .argo/.env`, `whoami`, and `icacls <closure-bound exact canonical repository .argo/.env path>`.
- Command templates are structural constants, not strings: no command concatenation, extra flags, shell, stdin, caller-controlled executable/argv/path, Python/PowerShell/cmd/Node sidecar, arbitrary executable, network command, or secret-bearing argv/environment is permitted. Git results become booleans; `whoami` and `icacls` stdout are parsed only as identity/ACL metadata. stderr, command records, and raw outputs never enter configuration evidence or logs.
- A test-composed adapter is a frozen null-prototype object whose complete own reflection surface is exactly the four non-writable/non-configurable frozen capability functions, with no symbols, executor fields, hidden adapter/capability references, function prototype properties, or callable backdoor. Executor and mutation hooks remain private lexical state and are erased by revocation.
- Authority policy reads `design/KG/SystemArchitecture.json` through an injected canonical graph boundary and treats Neo4j as a projection only.
- Credentials are values, never module-level defaults; provider credentials must never be interpolated into or transported through Cypher.
- Cypher credential protection follows query and parameter variables structurally into execution calls; keyword-distance windows are not acceptable enforcement.
- The only file source is repository-relative `.argo/.env`; it may provide the five approved non-sensitive `ARGO_EMBEDDING_*` fields, `ARGO_NEO4J_DATABASE_URL`, `ARGO_NEO4J_DATABASE_USERNAME`, `ARGO_NEO4J_DATABASE_PASSWORD`, and `QWEN_KEY`.
- The only secret keys are `QWEN_KEY` and `ARGO_NEO4J_DATABASE_PASSWORD`. Direct process values take precedence; matching process/file duplicates are accepted from process, differing duplicates fail closed, and missing/blank/duplicate/unknown-secret values are rejected.
- Preflight requires exact canonical path, ignored/untracked evidence, regular non-reparse file state, and a Windows ACL result proving current-identity read access without `Everyone`, `BUILTIN\Users`, or `Authenticated Users` read access. Unverifiable ACL state blocks.
- ACL evaluation parses individual `icacls` ACE lines, binds allow/deny and inherited flags to their principals, applies deny precedence, and requires an effective read grant for the actual execution identity. Broad-principal deny-only ACEs do not create access; broad allow ACEs are unsafe.
- Frozen accepted source fixtures supply all five `ARGO_EMBEDDING_*` keys, `ARGO_NEO4J_DATABASE_URL`, `ARGO_NEO4J_DATABASE_USERNAME`, and both secret keys from process-only, file-only, or matching dual sources. Every rejected fixture starts from that complete profile and mutates only its named rejection dimension; no implicit default may satisfy normalization.
- Loader provenance rejects root/alternate/tracked files, CLI, literal/default/fallback, alias, destructured, generated, or indirect secret sources.
- The resolver validates every trace before consuming its value using its private composition capability: trace/alias-chain immutability, exact field set with no extras, field types, issued-object identity, requested-key equality, exact requested file path, source-kind/path/operation correlation, and a one-element alias chain equal to the requested key for approved direct reads. Trusted test composition can deliberately issue key/path mismatch, missing/extra-field, or wrong-type traces; each must fail exactly `SOURCE_TRACE_INVALID`. The same value with CLI/literal operation methods, fallback/indirect operation methods, or alias methods remains prohibited.
- The approved live profile is provider `alibaba-cloud-model-studio-openai-compatible-cn-beijing`, endpoint `https://llm-clids9mqc5o1mbvb.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`, model `qwen3.7-text-embedding`, qualification `qualification-2026-07-25`, dimensions `1024`.
- Live network access requires explicit opt-in through `ARGO_LIVE_PROVIDER_E2E=1` and is restricted to controlled local or protected CI execution. Default/offline CI remains deterministic but never substitutes fake evidence for a live pass.
- Redaction verification includes a synthetic-success recording boundary that captures full Cypher text/parameter and graph-evidence values, detects canaries in neutral fields, and clears all in-memory persistence before inspecting generated artifacts.
- The controlled Neo4j test boundary uses `ARGO_NEO4J_DATABASE_URL`, `ARGO_NEO4J_DATABASE_USERNAME`, and `ARGO_NEO4J_DATABASE_PASSWORD`; the password flows only to `neo4j.auth.basic`, never to Cypher or evidence.
- A recording Neo4j adapter verifies the password is passed once to `neo4j.auth.basic`, authentication failure reaches no query, and recorded Cypher text/parameters contain no password canary.
- Authentication redaction captures the raw exception—including message, stack, nested causes, and aggregate errors—before safe classification, then scans it together with the sanitized error, every injected logger event, stdout/stderr, auth/driver/query recordings, graph and persistence observations, and recursive artifacts. The probe leaves zero records and never persists its canary.
- `.argo/.env.example` is the only committed example and contains empty placeholders/instructions; `.argo/.env` remains ignored and untracked.

## Owned tests

Explicit entrypoints are owned by `tests/ARCHITECTURE.md`. This module is protected by the frozen guards in `tests/architecture/production-graph-rag/`, including the coding-scope authorization guard that excludes TS-08/TS-09 adapter/lifecycle work from this handoff.

## Completion attribution

- This slice is complete when its six approved explicit entrypoints and seven frozen critical guards pass with no baseline delivered regression.
- Passing TS-07 is sufficient evidence that this slice realizes the external credential boundary.
- Global `grag-credential-boundary.deliveryStatus` remains runner-owned and may remain `not_delivered`; scoped attribution uses committed mounted TS-07 evidence, runner failure records, and the handoff scope rather than uncommitted intent relationships.
- A deferred global status does not authorize TS-09 work, relationship changes, frozen-test edits, or manual delivery-status changes.
- C1-C6 remain a protected checkpoint. The expanded live-provider slice completes only when all eight scoped explicit entrypoints and ten frozen critical guards pass, the live result proves a real HTTP call and controlled Neo4j evidence, and failure/redaction matrices pass with zero baseline delivered regression.

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
- W4 seed retrieval owns only relevance-discovery output: Element, ArchitectureRelationship, and View seed channels must be separately observable, directly attributed, independently thresholded, and complete for every candidate meeting that channel gate. Zero-result channel outcomes are valid.
- W3 seed selection proves exact threshold-all correctness before ANN comparison: every qualifying Element, ArchitectureRelationship, and View peer at or above its channel threshold is returned, unrelated queries have zero forced hits, and ANN top-k is recorded only as performance evidence.
- W3 index lifecycle extracts only records affected by successful canonical mutations, advances canonical/content/index version evidence for Element, ArchitectureRelationship, and View records, and leaves partial or failed persistence non-Aligned.
- W3 alignment gating rejects pure semantic queries for Updating, Stale, Failed, partial, or unknown index state while preserving no-argument full snapshots and explicit canonical-anchor reads.
- W3 TS-09 is a blocking gate: `productionGraphRagRuntime.generateAffectedEmbeddings()` must expose `runtime: "nodejs"`, `neo4jGenAiPluginRequired: false`, provider-adapter invocation, parameterized persistence evidence, complete Element/ArchitectureRelationship/View metadata, and non-Aligned partial failure behavior before W3 can be accepted.
- W3.1 mutation-vector integration is an automatic effect of the `applySystemArchitectureMutation` write success path. The mutation tool must pass its actual `touchedElementIds`, `touchedRelationshipIds`, and `touchedViewIds` to the lifecycle, invoke the real approved Qwen adapter under explicit live opt-in, persist complete vector/version/provider evidence into Neo4j, verify vector-query retrieval of the changed records, then return `embeddingLifecycle` and `alignment` in the MCP mutation response. Harness-created lifecycle execution, preset `expectedTouchedRecords`, or equivalent manual post-mutation evidence cannot satisfy W3.1.
- W5 purpose-policy closure begins only after W4 seed retrieval. It must convert semantic seeds into mandatory graph ranges through named parameterized Cypher policies, bound parameters, explicit ArchiMate relationship direction semantics, category-specific stop conditions, and explicit exclusions. Free-generated Cypher, Agent identity, text similarity, arbitrary depth, and connected-component expansion are forbidden for mandatory closure decisions.

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
- `selectThresholdAllSeeds(request)` for W4 exact per-channel threshold-all correctness. It must not collapse channels into one global rank, infer Relationship or View seeds from Element-only retrieval, perform graph closure, perform traversal or neighborhood expansion, force unrelated hits, or use ANN top-k as the correctness source.
- `generateAffectedEmbeddings(input)` for all-mutation affected-record extraction, provider generation, vector/evidence persistence, lifecycle state transitions, and non-Aligned partial failure reporting.
- `evaluateSemanticAlignment(request)` for pure semantic query availability; unaligned states return a stable rejection before seed retrieval.
- `closePurposePolicyScope(request)` for W5 deterministic purpose closure. It must return closure policy evidence, bound parameters, ArchiMate relationship semantics, included range, excluded category scope, first-inclusion reasons, and proof that free-generated Cypher did not decide mandatory inclusion.

`createLiveEmbeddingIndexGate(dependencies)` returns one public gate:

- `executeApprovedEmbedding(input)` for both the real opt-in path and all injected invalid/error cases. There is no production scenario-label shortcut.
- Every rejected live-provider scenario produces zero index writes.
- Only a finite numeric vector with exactly 1024 values can reach the write boundary.
- A frozen Harness-owned transport wrapper independently observes request count, origin/path, method, dynamic input, explicit model/dimensions, protected-header presence, and the raw response vector. Production output and persisted vector evidence must match that observed response exactly.
- Persisted evidence includes provider/model/qualification identity, dimensions, complete vector, canonical identity/version, content identity/version, and index identity/version. Cleanup is complete only when the Harness observes zero remaining test records.
- Secret/file/path/git/reparse/ACL/conflict preflight completes before transport construction, Neo4j connection, or gate execution.

`createMutationEmbeddingVectorLifecycle(dependencies)` in `mutationEmbeddingVectorLifecycle.js` is the W3.1 production lifecycle boundary. It returns `execute(input)` and must:

- Accept the applied mutation observation from `applySystemArchitectureMutation`, not an independently fabricated record list.
- Preserve `design/KG/SystemArchitecture.json` or the supplied `architecturePath` as canonical authority; Neo4j remains a vector projection and cannot overwrite canonical JSON semantics.
- Extract exactly touched Element, ArchitectureRelationship, and View records from the mutation response's actual touched id arrays, including object identity, channel, canonical version, content version, and next index version.
- Reuse the approved live configuration, Qwen profile, provider client, and Neo4j boundary; it must not introduce alternate secret sources, offline substitutes, Python sidecars, external Graph RAG frameworks, or Neo4j GenAI Plugin requirements.
- Query Neo4j vector evidence after persistence and return the changed record ids from that query before reporting `alignmentState: "Aligned"`.
- Return Stale or Failed and keep pure semantic queries rejected when provider generation, vector persistence, vector-query verification, or partial-record completion fails.
- Be invoked by the MCP mutation write path and surface its result through response fields `embeddingLifecycle` and `alignment`; downstream tests must not create or execute this lifecycle themselves.

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
- Live network access requires explicit opt-in through the approved configuration source, normally the ignored/untracked `.argo/.env` containing `ARGO_LIVE_PROVIDER_E2E=1` and, for W3.1, `ARGO_W31_LIVE_MUTATION_VECTOR_E2E=1`; controlled process injection is allowed only through the same provenance-checked resolver. Default/offline CI remains deterministic but never substitutes fake evidence for a live pass.
- Redaction verification includes a synthetic-success recording boundary that captures full Cypher text/parameter and graph-evidence values, detects canaries in neutral fields, and clears all in-memory persistence before inspecting generated artifacts.
- The controlled Neo4j test boundary uses `ARGO_NEO4J_DATABASE_URL`, `ARGO_NEO4J_DATABASE_USERNAME`, and `ARGO_NEO4J_DATABASE_PASSWORD`; the password flows only to `neo4j.auth.basic`, never to Cypher or evidence.
- A recording Neo4j adapter verifies the password is passed once to `neo4j.auth.basic`, authentication failure reaches no query, and recorded Cypher text/parameters contain no password canary.
- Authentication redaction captures the raw exception—including message, stack, nested causes, and aggregate errors—before safe classification, then scans it together with the sanitized error, every injected logger event, stdout/stderr, auth/driver/query recordings, graph and persistence observations, and recursive artifacts. The probe leaves zero records and never persists its canary.
- `.argo/.env.example` is the only committed example and contains empty placeholders/instructions; `.argo/.env` remains ignored and untracked.
- Threshold-all seed selection depends on aligned semantic-index records and channel thresholds; ANN calls, if present, are benchmark-only and cannot remove above-threshold peers or force unrelated hits.
- Closure begins after W4 seed retrieval. Purpose-policy graph closure, endpoint closure, View completeness expansion, traversal expansion, neighborhood closure, and downstream graph-completion behavior are not authorized by a DT-04/DT-05 seed-retrieval handoff.
- W5 purpose closure depends on W4 seeds and canonical ArchiMate graph semantics. `intent-decision`, `implementation-design`, `coding-repair`, and `audit` may consume the same seed anchors, but each category must select a different policy id, parameter contract, included range, exclusions, and rationale. `graph-tidy` remains a full-snapshot bypass and must not inherit semantic closure filtering.
- Index lifecycle depends on canonical mutation evidence, qualified embedding generation, and vector persistence. It must not mark Aligned until every affected record has complete identity, channel, canonical/content/index version, provider, model, model version, and dimensions evidence. Outcome-level TS-09 evidence must identify the Node adapter path and cannot be inferred from DT-05/DT-16/DT-17 scoped passes alone.
- Alignment gating depends inward on lifecycle state and canonical version evidence before invoking semantic retrieval. Complete canonical reads remain available without semantic fallback.
- W3.1 depends on the MCP mutation boundary and the existing live provider/Neo4j boundaries through explicit interfaces. The mutation-vector lifecycle may consume mutation observations and approved live configuration, but it must not import MCP server internals from query/runtime code or mutate canonical JSON outside `applySystemArchitectureMutation`; the automatic mutation write path is the only accepted production trigger for live W3.1 delivery evidence.

## Owned tests

Explicit entrypoints are owned by `tests/ARCHITECTURE.md`. This module is protected by the frozen guards in `tests/architecture/production-graph-rag/`, including the coding-scope authorization guard that excludes TS-08 while permitting corrected W3 handoffs to authorize TS-09 adapter/generation work and W3.1 handoffs to authorize mutation-vector lifecycle work.

## Completion attribution

- This slice is complete when its six approved explicit entrypoints and seven frozen critical guards pass with no baseline delivered regression.
- Passing TS-07 is sufficient evidence that this slice realizes the external credential boundary.
- Global `grag-credential-boundary.deliveryStatus` remains runner-owned and may remain `not_delivered`; scoped attribution uses committed mounted TS-07 evidence, runner failure records, and the handoff scope rather than uncommitted intent relationships.
- A deferred global status does not authorize TS-09 work, relationship changes, frozen-test edits, or manual delivery-status changes.
- C1-C6 remain a protected checkpoint. The expanded live-provider slice completes only when all eight scoped explicit entrypoints and ten frozen critical guards pass, the live result proves a real HTTP call and controlled Neo4j evidence, and failure/redaction matrices pass with zero baseline delivered regression.
- W3 index lifecycle and exact-threshold baseline completion requires DT-05, DT-16, DT-16-SemanticIndex, DT-17, TS-09-EmbeddingProviderAdapter, and TS-09-EmbeddingGeneration to pass together with the W3 critical guards. DT scoped passes are necessary evidence but not sufficient for W3 acceptance while TS-09 fails.
- W3.1 completion requires `runApplyMutationEmbeddingVectorE2E.js` to pass under both `ARGO_LIVE_PROVIDER_E2E=1` and `ARGO_W31_LIVE_MUTATION_VECTOR_E2E=1` with exactly one `applySystemArchitectureMutation` call, automatic `embeddingLifecycle`/`alignment` response evidence, approved Qwen/Neo4j secret sources, and controlled Neo4j vector cleanup evidence. Default/offline failure with `W31_MUTATION_VECTOR_E2E_OPT_IN_REQUIRED` is expected pre-coding evidence, not live acceptance.
- W4 seed retrieval completion requires `runIndependentSemanticSeeds.js` to pass for both `ExplicitAcceptanceTestcase-DT-04` and `ExplicitAcceptanceTestcase-DT-05`: observable Element/Relationship/View seed channels, independent channel thresholds, every qualifying candidate returned, zero forced unrelated hits, no fixed result limit, ANN performance-only evidence, and no closure-shaped output.
- W5 purpose closure completion requires `runPurposePolicyClosure.js`, `runIntentDecisionClosure.js`, `runImplementationDesignClosure.js`, `runCodingRepairClosure.js`, `runAuditProofClosure.js`, and `runGraphTidyFullSnapshot.js` to pass together with the W5 critical guards. This proves DT-06 through DT-12: parameterized mandatory closure, caller-identity-independent dispatch, independent intent/implementation/repair/audit boundaries, and graph-tidy complete-snapshot bypass.

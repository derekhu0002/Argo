# Intent Query Test Contract

This local contract refines `OVERALL_ARCHITECTURE.md`.

## Responsibilities

- `tests/harness/intentArchitectureQueryHarness.js` hides MCP response parsing, canonical-file access, and invocation plumbing behind business-readable methods.
- `tests/explicit/entries/` owns the four frozen DT-01/02/03/12 entrypoints.
- `tests/architecture/intent-query/` owns frozen critical non-explicit guardrails for boundaries, dependency direction, entry correctness, and traceability.
- Explicit entrypoints preserve GIVEN / WHEN / THEN, semantic data names, control points, observation points, and readable business failure categories.
- `tests/harness/productionGraphRagHarness.js` hides runtime composition, external configuration, injected Neo4j projection behavior, and canonical fixture plumbing for the W2 production boundary.
- C1-C4 use independently callable configuration, qualification, canonical-authority, and native-retrieval public boundaries so missing runtime composition cannot mask their completion signals.
- TS-06 requires `approvedByHuman === true`, rejects non-boolean truthy values, trims provider/model/version, requires positive-integer dimensions without coercion, and separately prohibits implicit defaults.
- TS-07 isolates every missing external credential field, blocks credential-free startup and semantic query, structurally detects direct literals and logical/nullish/ternary fallbacks, and follows credential-tainted query/parameter variables into Cypher execution calls.
- `credential-source-policy.guard.js` self-tests the TS-07 source policy with prohibited bypass fixtures and one safe fixture so scanner regressions cannot silently weaken the boundary.
- `dependency-direction.guard.js` owns no command validator. It calls the production module's callback-scoped test composition so all safe/bypass fixtures traverse the same private validator. It inspects the adapter's complete own names/descriptors/symbols/prototype chain and each capability function, rejects any executor or callable-backdoor surface, and requires the composition return to be `undefined`. Captured adapters revoke on normal completion, callback throw, and async rejection; post-scope calls fail `TEST_SYSTEM_METADATA_ADAPTER_REVOKED` without executor increments, while nested/repeated compositions prove unique adapter and capability identities. Existing command bypasses still fail `SYSTEM_METADATA_COMMAND_PROHIBITED` with zero executor calls.
- TS-01-Native uses a Harness-owned query probe to prove exact request propagation, exactly one native-boundary call, and unchanged propagation of an unpredictable runtime-generated full result.
- `tests/harness/liveEmbeddingProviderHarness.js` hides live-network opt-in, approved process/`.argo/.env` secret preflight, controlled Neo4j setup/cleanup, write counting, safe error categories, and artifact scanning.
- TS-06-Provider-E2E uses a Harness-owned transport wrapper to observe one real HTTPS request, exact target/body, dynamic input, and raw response. The same public gate receives all invalid/error injections; no production scenario branch or self-reported live boolean is accepted.
- Controlled Neo4j evidence must match the transport vector and approved provider/model/qualification/dimensions plus dynamic canonical/content/index identities and versions; cleanup must leave zero records.
- TS-07-Provider-Secret-Isolation uses a generated canary—not the real provider credential—to scan captured error messages, stdout, stderr, logs, complete Cypher text/parameter values, complete graph evidence values, latest failure records, snapshots, and recursively generated test artifacts.
- Its synthetic-success probe records in-memory Cypher/parameter and graph-evidence channels, proves a canary in neutral values is detected in both channels, then verifies zero persisted records and zero generated artifacts after cleanup.
- Every frozen source fixture calls production `resolveApprovedLiveConfiguration()` with temporary files and injected filesystem/git/ACL adapters; no guard contains an alternative resolver. Fixtures assert selected source attribution, process precedence, exact rejection category, and zero fetch/driver/create/write effects.
- Accepted fixtures inject the complete approved nine-key configuration without defaults and compare the complete normalized result plus per-key attribution. Rejected fixtures derive from that complete configuration and mutate one named dimension only.
- Production provenance uses only the configuration module's internally created source adapter. Frozen fixtures provide raw operation behaviors to `withApprovedLiveConfigurationTestComposition`; that module-owned composition root creates a private registered adapter/capability and exposes only a resolver closure. Direct resolver calls with untrusted, cloned, or self-issued-true adapters fail closed.
- Source reads are frozen `{ value, trace }` process envelopes and `{ key, value, trace }` file records. The resolver enforces an exact five-field trace schema, frozen alias chain, field types, issued identity, requested-key/path equality, source/path/operation correlation, and direct one-hop aliases. Trusted mismatch fixtures cover key, path, missing field, extra field, and wrong type; each expects `SOURCE_TRACE_INVALID`.
- A frozen behavior self-test proves direct process and five prohibited operation methods return the identical value without exposing `isIssuedTrace`. Accepted fixtures require every module-issued trace to be consumed and privately validated; forged, mutable, malformed, unvalidated, or untrusted-adapter traces cannot authorize configuration.
- ACL fixtures cover same-principal explicit allow+deny, inherited allow/deny, explicit/inherited combinations, broad explicit/inherited allow, broad deny-only, broad allow+deny, and unverifiable output using principal-bound `icacls` ACE lines.
- Preflight resolves both `QWEN_KEY` and `ARGO_NEO4J_DATABASE_PASSWORD` before transport or Neo4j construction. Redaction fixtures cover process/file sources, conflicts, ACL errors, and connection-authentication errors for both canaries.
- A recording Neo4j adapter is injected through production `createApprovedNeo4jBoundary()`—never a Harness-private index boundary—to prove the database password reaches only `neo4j.auth.basic`; authentication failure produces no query and all recorded Cypher text/parameters remain canary-free.
- The auth probe preserves raw exceptions before classification and recursively scans message/stack/causes plus sanitized errors, all injected logger events, stdout/stderr, auth/driver/query calls, graph/persistence state, and recursive artifacts. Artifact serialization always returns a string for undefined, null, primitives, Error, AggregateError, objects, buffers, and cycles; undefined/null are empty while canaries in every value-bearing form remain detectable. A frozen accepted-fixture regression proves `rawError: undefined` cannot interrupt the source matrix. The 11-channel auth self-test remains mandatory, and the real probe must report zero leaks and zero persistence.
- Default/offline CI must fail both live entrypoints with explicit opt-in categories. Deterministic fakes protect negative paths but never substitutes for live provider evidence.
- DT-05 uses the shared seed entrypoint but includes explicit threshold-all assertions: all above-threshold peers are returned per channel, unrelated queries force no hits, fixed result limits are prohibited, and ANN top-k is performance-only evidence.
- DT-16 and DT-16-SemanticIndex share the mutation lifecycle entrypoint. The entrypoint freezes the nine mutation classes, version advancement, deleted-object absence, non-Aligned partial persistence, and complete semantic-index evidence fields for Element, ArchitectureRelationship, and View records.
- DT-17 freezes the unaligned-query boundary by requiring full canonical reads to remain available, pure semantic requests to fail with `SEMANTIC_INDEX_NOT_ALIGNED`, automatic full-snapshot fallback to be false, and explicit canonical-anchor reads to remain available.
- TS-09 is a corrected W3 blocking gate. `runEmbeddingProviderAdapterLifecycle.js` freezes `generateAffectedEmbeddings()` outcome evidence for `runtime: "nodejs"`, no required Neo4j GenAI Plugin, affected Element/ArchitectureRelationship/View persistence, complete model/version evidence, no credential exposure, and non-Aligned partial persistence.
- W3.1 uses `runApplyMutationEmbeddingVectorE2E.js` as the explicit live integration entrypoint. The entrypoint delegates all MCP mutation, live-provider, Neo4j vector, and semantic-query plumbing to `liveEmbeddingProviderHarness.js`; default/offline execution fails before side effects with `W31_MUTATION_VECTOR_E2E_OPT_IN_REQUIRED`.
- DT-01 observes the complete legacy public envelope and absence of query metadata.
- DT-03 preserves all five legal purposes and covers missing/invalid purpose, missing/blank intent, and missing/blank audit subject with stable categories.
- DT-03 proves missing-purpose and audit-without-subject validation precedes retrieval by sharing one test-owned rejection probe whose invocation count remains zero.
- DT-12 first invokes a semantic positive control, then proves graph-tidy does not increment the same probe before checking bypass metadata and canonical equality.

## Local dependencies

- Harness code may depend on the public `argo-mcp-server.js` boundary and canonical graph fixture.
- The frozen Harness owns the semantic retrieval spy and injects it through the in-process dependency override; its count changes only inside the spy's `retrieve()` method and never reads response telemetry.
- Explicit entrypoints depend only on Node assertions and Harness methods.
- Guardrails may inspect implementation contracts, graph metadata, and dependency declarations, but must not implement production behavior.
- The production Graph RAG Harness depends only on the public `createProductionGraphRagRuntime(dependencies)` boundary and injected business fakes; explicit entrypoints never open Neo4j connections or read environment variables directly.

## Owned tests

### Explicit entrypoints

- `tests/explicit/entries/runGraphQueryCompatibility.js`
- `tests/explicit/entries/runCanonicalGraphFullSnapshot.js`
- `tests/explicit/entries/runQueryPurposeValidation.js`
- `tests/explicit/entries/runGraphTidyFullSnapshot.js`
- `tests/explicit/entries/runProductionGraphRagRuntime.js`
- `tests/explicit/entries/runNeo4jNativeRetrievalPlatform.js`
- `tests/explicit/entries/runEmbeddingQualificationGate.js`
- `tests/explicit/entries/runExternalCredentialBoundary.js`
- `tests/explicit/entries/runCanonicalProjectionAuthority.js`
- `tests/explicit/entries/runSevenWaveDeliveryGates.js`
- `tests/explicit/entries/runLiveEmbeddingProviderE2E.js`
- `tests/explicit/entries/runLiveEmbeddingProviderSecretIsolation.js`
- `tests/explicit/entries/runApplyMutationEmbeddingVectorE2E.js`

The frozen `tests/explicit/entries/runEmbeddingProviderAdapterLifecycle.js` path is retained as the TS-09 explicit entrypoint. In corrected W3 handoffs it is in-scope acceptance evidence and a Coding target while remaining read-only during Coding/Repair.

The following globally mounted entrypoints are physicalized for the runner and
remain outside the compatible-query Coding targets:

- `tests/explicit/entries/runCoherentIntentReading.js`
- `tests/explicit/entries/runIndependentSemanticSeeds.js`
- `tests/explicit/entries/runPurposePolicyClosure.js`
- `tests/explicit/entries/runIntentDecisionClosure.js`
- `tests/explicit/entries/runImplementationDesignClosure.js`
- `tests/explicit/entries/runCodingRepairClosure.js`
- `tests/explicit/entries/runAuditProofClosure.js`
- `tests/explicit/entries/runRelationshipEndpointClosure.js`
- `tests/explicit/entries/runCompleteViewClosure.js`
- `tests/explicit/entries/runFirstInclusionProvenance.js`
- `tests/explicit/entries/runMutationIndexLifecycle.js`
- `tests/explicit/entries/runStaleSemanticQueryRejection.js`
- `tests/explicit/entries/runRetrievalQualityBenchmark.js`
- `tests/explicit/entries/runCapacityEvidence.js`

The W3 Index Lifecycle and Exact-Threshold Baseline handoff owns these mounted explicit entrypoints as Coding/Repair read-only files:

- `tests/explicit/entries/runIndependentSemanticSeeds.js` — `ExplicitAcceptanceTestcase-DT-05` threshold-all correctness before ANN comparison; the same physical script continues to protect DT-04 channel independence.
- `tests/explicit/entries/runMutationIndexLifecycle.js` — `ExplicitAcceptanceTestcase-DT-16` and `ExplicitAcceptanceTestcase-DT-16-SemanticIndex` all-mutation lifecycle plus complete semantic-index evidence.
- `tests/explicit/entries/runStaleSemanticQueryRejection.js` — `ExplicitAcceptanceTestcase-DT-17` unaligned pure semantic rejection with canonical-read continuity.
- `tests/explicit/entries/runEmbeddingProviderAdapterLifecycle.js` — `ExplicitAcceptanceTestcase-TS-09-EmbeddingProviderAdapter` and `ExplicitAcceptanceTestcase-TS-09-EmbeddingGeneration` Node adapter generation/persistence proof. DT scoped passes do not complete W3 without this entrypoint passing.

The W3.1 Mutation-Driven Live Vector Integration handoff owns this mounted explicit entrypoint as a Coding/Repair read-only file:

- `tests/explicit/entries/runApplyMutationEmbeddingVectorE2E.js` — `ExplicitAcceptanceTestcase-W3-1-MutationEmbeddingVectorE2E` applySystemArchitectureMutation-to-real-Qwen-to-Neo4j-vector-query proof. Passing W3 and TS-09 evidence is prerequisite context but cannot satisfy this W3.1 live integration acceptance without the opt-in entrypoint passing.

### Critical non-explicit guardrails

- `tests/architecture/intent-query/architecture-boundary.guard.js` — `ArchitectureBoundaryGuard`
- `tests/architecture/intent-query/dependency-direction.guard.js` — `DependencyDirectionGuard`
- `tests/architecture/intent-query/explicit-entrypoint-correctness.guard.js` — `ExplicitEntrypointCorrectnessGuard`
- `tests/architecture/intent-query/implementation-traceability.guard.js` — `KeyImplementationTraceabilityGuard`
- `tests/architecture/production-graph-rag/architecture-boundary.guard.js` — `ArchitectureBoundaryGuard`
- `tests/architecture/production-graph-rag/dependency-direction.guard.js` — `DependencyDirectionGuard`
- `tests/architecture/production-graph-rag/explicit-entrypoint-correctness.guard.js` — `ExplicitEntrypointCorrectnessGuard`
- `tests/architecture/production-graph-rag/implementation-traceability.guard.js` — `KeyImplementationTraceabilityGuard`
- `tests/architecture/production-graph-rag/coding-scope-authorization.guard.js` — `ArchitectureBoundaryGuard`
- `tests/architecture/production-graph-rag/credential-source-policy.guard.js` — `ExplicitEntrypointCorrectnessGuard`
- `tests/architecture/production-graph-rag/scoped-delivery-attribution.guard.js` — `KeyImplementationTraceabilityGuard`
- `tests/architecture/production-graph-rag/live-provider-contract.guard.js` — `ArchitectureBoundaryGuard`
- `tests/architecture/production-graph-rag/live-provider-opt-in.guard.js` — `ExplicitEntrypointCorrectnessGuard`
- `tests/architecture/production-graph-rag/live-provider-secret-isolation.guard.js` — `ExplicitEntrypointCorrectnessGuard`

The coding-scope authorization guard freezes mounted TS-08 evidence while prohibiting seven-wave delivery targets from the handoff's authorized Coding scope. Corrected W3 handoffs may authorize TS-09 adapter/generation work through `codingTargets` and `taskExecutionPlan`.

For the W3 handoff, `architecture-boundary.guard.js`, `dependency-direction.guard.js`, `explicit-entrypoint-correctness.guard.js`, and `implementation-traceability.guard.js` are the critical non-explicit guards. They protect the W3 stable boundary, dependency direction, frozen entrypoint assertions, and mappings to `grag-seed-retrieval`, `grag-semantic-index`, `grag-index-lifecycle`, `grag-alignment-constraint`, `grag-embedding-provider-adapter`, and `grag-embedding-generation`.

For the W3.1 handoff, `architecture-boundary.guard.js`, `dependency-direction.guard.js`, `explicit-entrypoint-correctness.guard.js`, `implementation-traceability.guard.js`, `live-provider-contract.guard.js`, `live-provider-opt-in.guard.js`, and `live-provider-secret-isolation.guard.js` are critical non-explicit guards. They protect the W3.1 mutation-vector lifecycle boundary, dependency direction, explicit live opt-in, approved provider/secret contract, no-fake evidence rule, and mappings to `grag-wp-3-1`, `grag-index-lifecycle`, `grag-embedding-generation`, `grag-embedding-provider-adapter`, `grag-semantic-index`, `grag-alignment-constraint`, `grag-native-retrieval-service`, `grag-embedding-qualification`, and `grag-credential-boundary`.

All explicit and critical paths listed here, plus `tests/harness/intentArchitectureQueryHarness.js`, `tests/harness/productionGraphRagHarness.js`, `tests/harness/liveEmbeddingProviderHarness.js`, `.argo/.env.example`, and `.gitignore`, are frozen during Coding/Repair unless the current handoff explicitly excludes them from `frozenFiles`.

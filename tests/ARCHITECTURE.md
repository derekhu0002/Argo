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
- DT-05 uses the shared seed entrypoint, and DT-04 shares that W4 entrypoint for channel independence. It freezes directly observable Element, Relationship, and View seed channels, independent per-channel thresholds, every above-threshold peer returned, valid zero-result behavior, no fixed result limits, ANN top-k as performance-only evidence, and no graph-closure, traversal-expansion, or neighborhood-closure output in this stage.
- DT-16 and DT-16-SemanticIndex share the mutation lifecycle entrypoint. The entrypoint freezes the nine mutation classes, version advancement, deleted-object absence, non-Aligned partial persistence, and complete semantic-index evidence fields for Element, ArchitectureRelationship, and View records.
- DT-17 freezes the unaligned-query boundary by requiring full canonical reads to remain available, pure semantic requests to fail with `SEMANTIC_INDEX_NOT_ALIGNED`, automatic full-snapshot fallback to be false, and explicit canonical-anchor reads to remain available.
- TS-09 is a corrected W3 blocking gate. `runEmbeddingProviderAdapterLifecycle.js` freezes `generateAffectedEmbeddings()` outcome evidence for `runtime: "nodejs"`, no required Neo4j GenAI Plugin, affected Element/ArchitectureRelationship/View persistence, complete model/version evidence, no credential exposure, and non-Aligned partial persistence.
- W3.1 uses `runApplyMutationEmbeddingVectorE2E.js` as the explicit live integration entrypoint. The entrypoint delegates all MCP mutation, live-provider, Neo4j vector, and semantic-query plumbing to `liveEmbeddingProviderHarness.js`; default/offline execution fails before side effects with `W31_MUTATION_VECTOR_E2E_OPT_IN_REQUIRED`. The Harness must make exactly one `applySystemArchitectureMutation` call, must not create or execute `createMutationEmbeddingVectorLifecycle()` itself, must not supply `expectedTouchedRecords`, and must assert `embeddingLifecycle` plus `alignment` from the MCP mutation response based on actual touched id arrays.
- DT-01 observes the complete legacy public envelope and absence of query metadata.
- DT-03 preserves all five legal purposes and covers missing/invalid purpose, missing/blank intent, and missing/blank audit subject with stable categories.
- DT-03 proves missing-purpose and audit-without-subject validation precedes retrieval by sharing one test-owned rejection probe whose invocation count remains zero.
- DT-12 first invokes a semantic positive control, then proves graph-tidy does not increment the same probe before checking bypass metadata and canonical equality.
- W5 DT-06 through DT-11 use `intentArchitectureQueryHarness.js` to assert deterministic purpose-policy closure without exposing Cypher, MCP response parsing, or caller plumbing in the entrypoint bodies. The Harness owns assertions for named policy ids, parameterized Cypher evidence, bound parameters, ArchiMate relationship semantics, caller-identity independence, category-specific included ranges, and explicit out-of-category exclusions.
- W6 DT-00-W6, DT-13, DT-14, and DT-15 use `intentArchitectureQueryHarness.js` to assert coherent-result version equality with the governing legacy graph version, non-empty same-version endpoint closure with endpoint id checks and structural error channels, complete non-cascading View closure with exact target/overlapping View IDs, exact member/relationship object sets, and parent viewpoint evidence, and exactly one ordered first-inclusion reason over explicit duplicate-path fixtures with non-overwriting policy parameters/anchors and index/version evidence. Entrypoints preserve GIVEN / WHEN / THEN readability and do not parse low-level MCP, filesystem, or environment plumbing.
- W7 DT-18 and TS-08 use `productionGraphRagHarness.js` to assert business benchmark and delivery-gate semantics without exposing runtime composition plumbing. DT-18 freezes the approved five-purpose benchmark id, non-empty mandatory key seed ids, actual recalled key seed ids, non-empty expected closure ids, actual observed closure ids, missing-key-seed emptiness, expected closure correctness, explicitly recorded unrelated-query forced-hit evidence, zero forced hits, recorded precision per purpose and aggregate inside `[0, 1]`, and absence of an invented release precision threshold. It also freezes negative boundaries for missing mandatory key seed fixtures, missing expected closure fixtures, missing actual recall observations, wrong same-count recalled ids, non-empty missing key seed evidence, missing actual closure observations, closure correctness below 100%, missing or negative unrelated forced-hit evidence, positive unrelated forced hits, empty benchmark content, incomplete benchmark purposes, and precision outside `[0, 1]`. TS-08 freezes prerequisite blocking for W2-W6, DT-18-required blocking after prerequisites are present, rejection of invalid W7 aggregate precision including `-99`, and overall-delivery permission only after the W7 quality benchmark passes.
- DT-19 uses `productionGraphRagHarness.js` to assert capacity evidence without exposing runtime composition plumbing. It freezes `evaluateCapacityEvidence(request)` as the public production boundary, requires result cardinality and measured precision for every declared purpose, and rejects any silent cap, budget, pagination, truncation, continuation, top-k, token-budget, result-limit, or capacity-policy decision field.

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

- `tests/explicit/entries/runApplyMutationEmbeddingVectorE2E.js` — `ExplicitAcceptanceTestcase-W3-1-MutationEmbeddingVectorE2E` single-call applySystemArchitectureMutation-to-automatic-embeddingLifecycle-to-real-Qwen-to-Neo4j-vector-query proof. Passing W3 and TS-09 evidence is prerequisite context but cannot satisfy this W3.1 live integration acceptance without the opt-in entrypoint proving the mutation response contains `embeddingLifecycle` and `alignment`.

The W4 Independent Three-Channel Seeds handoff owns this mounted explicit entrypoint as a Coding/Repair read-only file:

- `tests/explicit/entries/runIndependentSemanticSeeds.js` — `ExplicitAcceptanceTestcase-DT-04` and `ExplicitAcceptanceTestcase-DT-05` independent semantic seed retrieval proof. The control point is a purpose-declared semantic query before closure. The observation point is separate Element, Relationship, and View channels, independent channel gates, every qualifying candidate released, unrelated queries allowed to return zero forced hits, ANN performance-only evidence, and absence of closure-shaped output.

The W5 Deterministic Five-Purpose Closure handoff owns these mounted explicit entrypoints as Coding/Repair read-only files:

- `tests/explicit/entries/runPurposePolicyClosure.js` — `ExplicitAcceptanceTestcase-DT-06` and `ExplicitAcceptanceTestcase-DT-07` deterministic mandatory closure plus five-category dispatch. The control point is approved W4 seed anchors under declared purposes. The observation point is named parameterized policy evidence, bound parameters, ArchiMate source/target semantics, mandatory low-similarity inclusion, generated-Cypher exclusion, caller-identity independence, and five independent category boundaries.
- `tests/explicit/entries/runIntentDecisionClosure.js` — `ExplicitAcceptanceTestcase-DT-08` intent-decision boundary. The control point is a capability-change intent decision with mandatory dissimilar lineage. The observation point is Why, What, business behavior, Acceptance, realization-state or absence evidence, and exclusion of implementation, repair, audit, and graph-tidy scope.
- `tests/explicit/entries/runImplementationDesignClosure.js` — `ExplicitAcceptanceTestcase-DT-09` implementation-design boundary. The control point is a target with upstream prerequisites and bounded downstream dependents. The observation point is dependency chains that stop at declared boundaries, acceptance semantics, guardrails, delivered-stop decisions, and exclusion of repair and graph-tidy scope.
- `tests/explicit/entries/runCodingRepairClosure.js` — `ExplicitAcceptanceTestcase-DT-10` coding-repair boundary. The control point is conflicting code evidence against approved intent. The observation point is authoritative intended behavior, guardrails, at-risk outcomes, acceptance semantics, and exclusion of unrelated similar capabilities and implementation-planning scope.
- `tests/explicit/entries/runAuditProofClosure.js` — `ExplicitAcceptanceTestcase-DT-11` audit-proof boundary. The control point is an explicit audit subject with an inside low-similarity violation and outside high-similarity candidate. The observation point is subject-scoped obligations, violations, evidence exceptions, missing-evidence false-pass prevention, out-of-subject exclusion, and missing-subject rejection.
- `tests/explicit/entries/runGraphTidyFullSnapshot.js` — `ExplicitAcceptanceTestcase-DT-12` graph-tidy full-snapshot bypass. The control point is graph-tidy mutation preparation after a semantic positive control. The observation point is unchanged probe count, full-snapshot mode, semantic bypass, and complete canonical graph equality.

The W6 Structural Closure and Explainable Results handoff owns these mounted explicit entrypoints as Coding/Repair read-only files:

- `tests/explicit/entries/runCoherentIntentReading.js` — `ExplicitAcceptanceTestcase-DT-00-W6-CoherentResultRegression` coherent result version evidence. The control point is legacy and semantic-query tasks against the same canonical graph version. The observation point is complete legacy reading plus semantic `canonicalVersion` equality with the governing legacy graph version; missing version evidence fails `DT00_CANONICAL_VERSION_MISSING` and mismatched evidence fails `DT00_CANONICAL_VERSION_MISMATCH`.
- `tests/explicit/entries/runRelationshipEndpointClosure.js` — `ExplicitAcceptanceTestcase-DT-13` same-version relationship endpoint closure. The control point is a purpose-closed relationship range with endpoint closure fixtures for returned, dangling, and cross-version endpoints. The observation point is at least one relationship object with source/target ids, source/target Element objects whose ids match the relationship endpoints, same-version evidence tied to the governing result version, and explicit dangling/cross-version structural errors.
- `tests/explicit/entries/runCompleteViewClosure.js` — `ExplicitAcceptanceTestcase-DT-14` complete non-cascading View closure. The control point names target View `grag-integrity-explainability` and overlapping Views `grag-quality-capacity` and `grag-vertical-chain-b`, while requiring in-View relationships plus a parent viewpoint. The observation point is target View presence, absence of overlapping Views unless independently matched or explicitly requested, complete metadata, viewpoint binding, parent viewpoint, exact included element ids matching member object ids, exact relationship ids matching relationship object ids, endpoint-complete in-View relationships, and no overlapping-View cascade.
- `tests/explicit/entries/runFirstInclusionProvenance.js` — `ExplicitAcceptanceTestcase-DT-15` single ordered first-inclusion provenance. The control point is duplicate discovery fixtures through semantic seed, endpoint closure, purpose policy, and complete View closure. The observation point is exactly one ordered `firstInclusionReason`, expected supplementary reasons without overwrite, policy id plus parameters/anchors, and canonical/content/index/alignment evidence.

The W7 Phase 1 Business Acceptance handoff owns these mounted explicit entrypoints as Coding/Repair read-only files:

- `tests/explicit/entries/runRetrievalQualityBenchmark.js` — `ExplicitAcceptanceTestcase-DT-18` approved five-purpose business benchmark proof. The control point is the human-approved benchmark after W2-W6 acceptance evidence plus negative benchmark counterexamples. The observation point is non-empty mandatory seed fixtures, 100% key seed recall by mandatory-seed intersection, non-empty expected closure fixtures, 100% expected closure correctness from actual closure observations, explicitly recorded zero forced hits for unrelated queries, recorded precision evidence inside `[0, 1]`, no precision threshold substituting for recall or closure, and blocking categories for fabricated/missing observations, wrong same-count recall ids, missing key seeds, closure misses, positive unrelated hits, missing fixtures, missing/negative unrelated-hit evidence, or empty/incomplete benchmark content.
- `tests/explicit/entries/runSevenWaveDeliveryGates.js` — `ExplicitAcceptanceTestcase-TS-08` whole-delivery gate. The control point is W7 or whole-delivery attempts with missing prerequisite waves, missing/failing DT-18 evidence, invalid aggregate precision such as `-99`, and a passing ordered-delivery control case. The observation point is prerequisite blocking, W7-quality blocking, precision-range blocking, and delivery allowed only after W2-W6 plus DT-18 pass.

The DT-19 Capacity Evidence handoff owns this mounted explicit entrypoint as a Coding/Repair read-only file:

- `tests/explicit/entries/runCapacityEvidence.js` — `ExplicitAcceptanceTestcase-DT-05-R2-DT-19` capacity evidence recording. The control point is the W7 phase-1 capacity evidence request after quality evidence. The observation point is one capacity evidence record for every declared purpose, integer non-negative result cardinality, measured precision inside `[0, 1]`, and absence of cap, budget, pagination, truncation, continuation, top-k, token-budget, result-limit, or capacity-policy decision fields.

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

The coding-scope authorization guard freezes mounted TS-08 and DT-19 evidence and prohibits seven-wave delivery or capacity-evidence targets unless the current approved handoff explicitly includes that testcase. The W7 quality handoff includes `ExplicitAcceptanceTestcase-TS-08`, `tests/explicit/entries/runSevenWaveDeliveryGates.js`, and `evaluateDeliverySequence(request)`, authorizing only the delivery sequence gate described there. The DT-19 capacity-evidence handoff includes `ExplicitAcceptanceTestcase-DT-05-R2-DT-19`, `tests/explicit/entries/runCapacityEvidence.js`, and `evaluateCapacityEvidence(request)`, authorizing only evidence recording without capacity-policy behavior. Corrected W3 handoffs may authorize TS-09 adapter/generation work through `codingTargets` and `taskExecutionPlan`.

For the W3 handoff, `architecture-boundary.guard.js`, `dependency-direction.guard.js`, `explicit-entrypoint-correctness.guard.js`, and `implementation-traceability.guard.js` are the critical non-explicit guards. They protect the W3 stable boundary, dependency direction, frozen entrypoint assertions, and mappings to `grag-seed-retrieval`, `grag-semantic-index`, `grag-index-lifecycle`, `grag-alignment-constraint`, `grag-embedding-provider-adapter`, and `grag-embedding-generation`.

For the W3.1 handoff, `architecture-boundary.guard.js`, `dependency-direction.guard.js`, `explicit-entrypoint-correctness.guard.js`, `implementation-traceability.guard.js`, `live-provider-contract.guard.js`, `live-provider-opt-in.guard.js`, and `live-provider-secret-isolation.guard.js` are critical non-explicit guards. They protect the W3.1 automatic mutation-triggered lifecycle boundary, dependency direction, explicit live opt-in, approved provider/secret contract, no-fake evidence rule, prohibition on Harness-side lifecycle execution or expected touched-record substitution, and mappings to `grag-wp-3-1`, `grag-index-lifecycle`, `grag-embedding-generation`, `grag-embedding-provider-adapter`, `grag-semantic-index`, `grag-alignment-constraint`, `grag-native-retrieval-service`, `grag-embedding-qualification`, and `grag-credential-boundary`.

For the W4 handoff, `architecture-boundary.guard.js`, `dependency-direction.guard.js`, `explicit-entrypoint-correctness.guard.js`, and `implementation-traceability.guard.js` are the critical non-explicit guards. They protect the production Graph RAG stable boundary, dependency direction, frozen W4 seed entrypoint assertions, and direct mapping to `grag-seed-retrieval` only. Closure, traversal expansion, neighborhood closure, and downstream graph completion remain excluded from W4 Coding targets.

For the W5 handoff, `tests/architecture/intent-query/architecture-boundary.guard.js`, `tests/architecture/intent-query/dependency-direction.guard.js`, `tests/architecture/intent-query/explicit-entrypoint-correctness.guard.js`, and `tests/architecture/intent-query/implementation-traceability.guard.js` are the critical non-explicit guards. They protect the getSystemArchitecture dispatch boundary, production-to-test dependency direction, frozen W5 entrypoint assertions, and direct mappings to `grag-purpose-closure`, `grag-intent-decision-policy`, `grag-implementation-policy`, `grag-repair-policy`, `grag-audit-policy`, and `grag-graph-tidy-policy`.

For the W6 handoff, `tests/architecture/intent-query/architecture-boundary.guard.js`, `tests/architecture/intent-query/dependency-direction.guard.js`, `tests/architecture/intent-query/explicit-entrypoint-correctness.guard.js`, and `tests/architecture/intent-query/implementation-traceability.guard.js` are the critical non-explicit guards. They protect the getSystemArchitecture version-evidence boundary, production-to-test dependency direction, frozen W6 entrypoint assertions, and direct mappings to `grag-coherent-context`, `grag-endpoint-closure`, `grag-view-closure`, and `grag-provenance`.

For the W7 handoff, `tests/architecture/production-graph-rag/architecture-boundary.guard.js`, `tests/architecture/production-graph-rag/dependency-direction.guard.js`, `tests/architecture/production-graph-rag/explicit-entrypoint-correctness.guard.js`, `tests/architecture/production-graph-rag/implementation-traceability.guard.js`, and `tests/architecture/production-graph-rag/coding-scope-authorization.guard.js` are the critical non-explicit guards. They protect the W7 quality benchmark boundary, delivery sequence gate, DT-19 capacity-evidence boundary when explicitly authorized, frozen DT-18/TS-08/DT-19 entrypoint assertions, direct mappings to `grag-quality-gate`, `grag-seven-wave-delivery`, and `grag-capacity-residual`, TS-08 and DT-19 as frozen evidence unless a current handoff explicitly targets them, and runner-owned `deliveryStatus` authority.

All explicit and critical paths listed here, plus `tests/harness/intentArchitectureQueryHarness.js`, `tests/harness/productionGraphRagHarness.js`, `tests/harness/liveEmbeddingProviderHarness.js`, `.argo/.env.example`, and `.gitignore`, are frozen during Coding/Repair unless the current handoff explicitly excludes them from `frozenFiles`.

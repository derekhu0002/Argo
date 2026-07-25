# Intent Design Session Record

## 2026-07-24 — Compatible Contract And Query Entry Boundary

- Selected viewpoint: Application Usage Viewpoint.
- Stakeholder concern: downstream intent consumers must retain the complete no-argument canonical read while query requests declare purpose explicitly and audit requests without a subject are rejected.
- Modeling purpose: designing, deciding, and intent-to-implementation handoff preparation.
- Human approval evidence: this chat explicitly approved the DT-01, DT-02, DT-03, and DT-12 same-element testcase variants and approved using the chat decision as the orchestrator gate without adding schema-unsupported `approvedByHuman` fields.
- Delivery-status guardrail: no `deliveryStatus` attribute was created, changed, removed, or inferred by Intent Design.

### View bindings

- `grag-compatibility-usage` remains an Application Usage Viewpoint instance because it shows the downstream role and process consuming the query service and its complete canonical source.
- `grag-request-purpose-usage` remains an Application Usage Viewpoint instance because it shows request data read by validation and validation realizing the query-service contract.
- `grag-tidy-canonical-usage` is a new Application Usage Viewpoint instance because it isolates graph-tidy's complete canonical read from semantic retrieval and request-validation concerns.

### Coverage matrix

- `grag-consumer-role` — functional point `functionalPoint.DT-01-consumer-continuity` → `ExplicitAcceptanceTestcase-DT-01-ConsumerRole`.
- `grag-consumption-process` — functional point `functionalPoint.DT-01-complete-context-consumption` → `ExplicitAcceptanceTestcase-DT-01-ConsumptionProcess`.
- `grag-query-service` — functional point `functionalPoint.DT-01-compatible-reading-boundary` → `ExplicitAcceptanceTestcase-DT-01`; functional point `functionalPoint.DT-02-no-argument-full-snapshot` → `ExplicitAcceptanceTestcase-DT-02`.
- `grag-canonical-graph` — functional point `functionalPoint.DT-02-authoritative-complete-snapshot` → `ExplicitAcceptanceTestcase-DT-02-CanonicalGraph`.
- `grag-query-request` — functional point `functionalPoint.DT-03-explicit-purpose-contract` → `ExplicitAcceptanceTestcase-DT-03-QueryRequest`.
- `grag-mode-validation` — functional point `functionalPoint.DT-03-purpose-and-audit-gate` → `ExplicitAcceptanceTestcase-DT-03`.
- `grag-graph-tidy-policy` — functional point `functionalPoint.DT-12-full-snapshot-bypass` → `ExplicitAcceptanceTestcase-DT-12`.

### Dependency-scope decisions

- The handoff scope is the approved compatibility-contract slice of seven architecture elements.
- Viewpoint grouping elements are navigation anchors rather than implementation targets and are excluded from testcase coverage.
- Existing semantic seed, closure, index-lifecycle, alignment, outcome, and quality elements are unchanged context. They are excluded from this handoff because no-argument reading and graph-tidy explicitly bypass semantic retrieval, while this slice changes only request meaning and the pre-retrieval validation gate.
- No element is treated as a delivered stopping boundary; no pass evidence or `deliveryStatus` was fabricated.

### Validation and open risks

- `argo.previewSystemArchitectureMutation`: passed.
- `argo.applySystemArchitectureMutation`: passed; Neo4j synchronized to 30 elements, 28 relationships, and 17 views.
- `argo.validateSystemArchitecture`: passed.
- Open business questions: none for this compatibility-contract slice.

## 2026-07-24 — Executable Acceptance Entrypoint Correction

- Source proposal: `design/KG/ImplementationToIntentTraceProposal.json`.
- Viewpoint remains Application Usage Viewpoint; no View membership, relationship, functional point, testcase name, description, Input, or approved DT-01/02/03/12 behavior changed.
- `ExplicitAcceptanceTestcase-DT-01-ConsumerRole`, `ExplicitAcceptanceTestcase-DT-01-ConsumptionProcess`, and `ExplicitAcceptanceTestcase-DT-01` now use `tests/explicit/entries/runGraphQueryCompatibility.js`.
- `ExplicitAcceptanceTestcase-DT-02` and `ExplicitAcceptanceTestcase-DT-02-CanonicalGraph` now use `tests/explicit/entries/runCanonicalGraphFullSnapshot.js`.
- `ExplicitAcceptanceTestcase-DT-03-QueryRequest` and `ExplicitAcceptanceTestcase-DT-03` now use `tests/explicit/entries/runQueryPurposeValidation.js`.
- `ExplicitAcceptanceTestcase-DT-12` now uses `tests/explicit/entries/runGraphTidyFullSnapshot.js`.
- The proposal open question was resolved by the human request and recorded as applied; no `deliveryStatus` attribute was edited.

## 2026-07-24 — Global Mounted-Testcase Entrypoint Correction

- Cause: `validateStageHandoff(implementation-to-coding)` validates every mounted testcase, including elements outside the compatible-query handoff slice.
- Accepted proposal: map the remaining 16 prose acceptance criteria to 14 executable entry paths without changing testcase names, descriptions, Inputs, control points, observation points, relationships, functional points, or View content.
- Mapping groups: DT-04/05 share `runIndependentSemanticSeeds.js`; DT-06/07 share `runPurposePolicyClosure.js`; DT-00, DT-08, DT-09, DT-10, DT-11, DT-13, DT-14, DT-15, DT-16, DT-17, DT-18, and DT-05-R2-DT-19 each use the dedicated entrypoint recorded in `design/KG/ImplementationToIntentTraceProposal.json`.
- Viewpoint remains Application Usage Viewpoint for the original handoff concern; no View mutation occurred.
- Runner evidence was preserved: the latest baseline reported 24 total, 5 passed, and 19 failed-or-invalid, and the 21 runner-owned `deliveryStatus` attributes already present in the graph were not manually changed.

## 2026-07-24 — Native Runtime And Embedding Qualification Handoff

- Selected viewpoint: Requirements Realization Viewpoint.
- Stakeholder concern: requirements managers, ICT architects, and runtime owners need production runtime, credential isolation, embedding qualification, and canonical authority to be explicit release requirements before index delivery.
- Modeling purpose: designing, deciding, and intent-to-implementation handoff preparation.
- View binding: `grag-native-embedding-release-requirements` remains a Requirements Realization Viewpoint instance because it traces the approved requirement and constraint boundaries to the runtime and native retrieval elements that realize them.
- Human approval: the user explicitly approved the TS-01, TS-01-Native, TS-06, TS-07, and Canonical Authority mounted testcase boundaries; confirmed that unapproved embedding identity/version/dimensions must block index delivery; and approved the complete handoff.

### Coverage matrix

- `grag-production-runtime` — `functionalPoint.TS-01` → `ExplicitAcceptanceTestcase-TS-01`.
- `grag-native-retrieval-service` — `functionalPoint.TS-01-native` → `ExplicitAcceptanceTestcase-TS-01-Native`.
- `grag-embedding-qualification` — `functionalPoint.TS-06` → `ExplicitAcceptanceTestcase-TS-06`.
- `grag-credential-boundary` — `functionalPoint.TS-07` → `ExplicitAcceptanceTestcase-TS-07`.
- `grag-canonical-graph` — `functionalPoint.DT-02-authoritative-complete-snapshot` → `ExplicitAcceptanceTestcase-DT-02-CanonicalGraph`; `functionalPoint.TS-02-canonical-authority` → `ExplicitAcceptanceTestcase-TS-02-CanonicalAuthority`.

### Dependency-scope decisions

- The approved handoff scope is exactly the five architecture elements named by the human.
- `grag-rel-runtime-native`, `grag-rel-native-canonical`, `grag-rel-embedding-native`, and `grag-rel-credentials-runtime` express the in-scope runtime, canonical-authority, qualification, and credential directions.
- Existing provider-adapter, semantic-index, work-package, seed, closure, grouping, and other retrieval elements remain contextual architecture outside this approved intent slice; their existing behavior was not re-approved or added to this handoff.
- No element is treated as a delivered stopping boundary. Missing TS entrypoint scripts are expected downstream delivery targets and remain explicit failure signals rather than fabricated pass evidence.
- Runner-owned `deliveryStatus` values were preserved unchanged.

### Validation and open risks

- `argo.previewSystemArchitectureMutation`: passed after excluding the new relationship from the seven-element qualification view limit.
- `argo.applySystemArchitectureMutation`: passed; Neo4j synchronized to 46 elements, 56 relationships, and 26 views.
- `argo.validateSystemArchitecture`: passed.
- Business open questions: none.

## 2026-07-25 — Live Provider E2E Qualification

- Selected viewpoint: Requirements Realization Viewpoint.
- Stakeholder concern: requirements managers, ICT architects, runtime owners, and security owners need real-provider evidence and secret isolation to be explicit, decidable release requirements rather than implementation assumptions.
- Modeling purpose: designing, deciding, and intent-to-implementation handoff preparation.
- View binding: `grag-native-embedding-release-requirements` remains a Requirements Realization Viewpoint instance because the approved Live E2E strengthens the existing embedding Requirement and credential Constraint without adding TS-09 adapter/lifecycle scope.
- Human approval: provider `alibaba-cloud-model-studio-openai-compatible-cn-beijing`; model `qwen3.7-text-embedding`; qualification label `qualification-2026-07-25` with supplier alias drift acknowledged; explicit dimensions `1024`; approved Beijing endpoint; process secret source name `QWEN_KEY`; opt-in network and controlled-Neo4j policies; both new mounted testcases; and the complete updated handoff.
- Secret handling: Intent Design did not read, record, use, or create a secret value and did not create `.env`.

### Coverage matrix

- `grag-production-runtime` — `functionalPoint.TS-01` → `ExplicitAcceptanceTestcase-TS-01`.
- `grag-native-retrieval-service` — `functionalPoint.TS-01-native` → `ExplicitAcceptanceTestcase-TS-01-Native`.
- `grag-embedding-qualification` — `functionalPoint.TS-06` → `ExplicitAcceptanceTestcase-TS-06`; `functionalPoint.TS-06-provider-e2e` → `ExplicitAcceptanceTestcase-TS-06-Provider-E2E`.
- `grag-credential-boundary` — `functionalPoint.TS-07` → `ExplicitAcceptanceTestcase-TS-07`; `functionalPoint.TS-07-provider-secret-isolation` → `ExplicitAcceptanceTestcase-TS-07-Provider-Secret-Isolation`.
- `grag-canonical-graph` — `functionalPoint.DT-02-authoritative-complete-snapshot` → `ExplicitAcceptanceTestcase-DT-02-CanonicalGraph`; `functionalPoint.TS-02-canonical-authority` → `ExplicitAcceptanceTestcase-TS-02-CanonicalAuthority`.

### Acceptance and dependency boundaries

- Live evidence path: Node runtime → real provider → qualification/index gate → controlled Neo4j test instance.
- The request must explicitly carry the approved model and dimensions; the response must be finite numeric values of length exactly 1024.
- Provider errors, unapproved identity, omitted explicit model/dimensions, non-finite vectors, and dimension mismatch must produce zero index writes.
- Live execution is explicit opt-in and restricted to controlled local or protected CI. Default/offline CI fake coverage is required but cannot substitute for Live E2E evidence.
- `QWEN_KEY` is process/secret-manager supplied only. Secret material is excluded from `.env`, logs, Cypher text/parameters, graph state, runner failure records, snapshots, and test artifacts.
- Local `.env` is approved only for non-sensitive configuration and must be gitignored; `.env.example` may be committed without secrets.
- TS-09, adapter lifecycle, and incremental index lifecycle remain outside this handoff. Existing parallel graph context does not authorize them.
- Existing runner-owned `deliveryStatus` values were preserved unchanged and were not used as evidence that the new physical entrypoints pass.

### Downstream Implementation Design requirements

- Define physical entrypoints for `runLiveEmbeddingProviderE2E.js` and `runLiveEmbeddingProviderSecretIsolation.js`.
- Define critical guardrails for explicit opt-in networking, protected-CI execution, and preventing fake results from being reported as Live E2E.
- Define the `.env` loader and non-sensitive configuration contract, with `QWEN_KEY` excluded from `.env` values.
- Define a controlled disposable Neo4j test-instance boundary and verifiable zero-write observation point.
- Define secret-redaction assertions over logs, Cypher text/parameters, graph data, failure records, snapshots, and test artifacts.

### Validation and open risks

- `argo.previewSystemArchitectureMutation`: passed for two element updates and one View description update.
- `argo.applySystemArchitectureMutation`: passed; Neo4j synchronized to 46 elements, 56 relationships, and 26 views.
- `argo.validateSystemArchitecture`: passed.
- New physical entrypoints are downstream Implementation Design/Coding targets, not fabricated current pass evidence.
- Business open questions and adequacy blockers: none.

## 2026-07-25 — Approved Local Secret File Boundary

- Selected viewpoint: Requirements Realization Viewpoint.
- Stakeholder concern: security owners, runtime owners, ICT architects, and requirements managers need the permitted secret origins, conflict behavior, local-file protections, and zero-leakage release condition to be explicit and decidable.
- Modeling purpose: designing, deciding, and intent-to-implementation handoff preparation.
- View binding: `grag-native-embedding-release-requirements` remains a Requirements Realization Viewpoint instance because the existing production runtime realizes the revised credential Constraint; membership and relationships are unchanged.
- Human approval: the user explicitly selected and approved `allow_secret_file`, approved modifying `ExplicitAcceptanceTestcase-TS-07-Provider-Secret-Isolation`, and directed emission of the revised globally approved handoff.
- Intent Design did not read, output, migrate, copy, or create any secret value or `.argo/.env`.

### Revised secret boundary

- Approved secret keys are exactly `QWEN_KEY` and `ARGO_NEO4J_DATABASE_PASSWORD`.
- Approved sources are direct process environment variables or the unique repository-relative `.argo/.env` only.
- Process environment is higher precedence. If both sources define the same key with different values, startup fails closed; if values agree, the process value is used. No implicit, literal, generated, logical, nullish, ternary, command-line, root-`.env`, alternate-file, or alias fallback is authorized.
- `.argo/.env` is only for controlled local or protected CI execution. It must remain ignored and untracked, resolve to the exact canonical path, be a regular non-reparse file, reject duplicate keys, and pass a Windows ACL preflight that denies broad-principal read access while permitting the execution identity to read.
- `QWEN_KEY` never enters Cypher. `ARGO_NEO4J_DATABASE_PASSWORD` is consumed only by the Neo4j driver authentication connection layer and never as query text or a query parameter.
- Neither secret may enter git, stdout/stderr, errors, logs, graph evidence, failure records, snapshots, or artifacts. Unsafe or unverifiable provenance fails before provider, database, or index side effects; cleanup proves zero persistence and zero secret artifacts.
- A committed `.env.example` or `.argo/.env.example` may list key names with empty placeholders and non-secret instructions, but never actual values.

### Coverage and downstream contract

- Coverage remains same-element: `grag-credential-boundary` functional point `functionalPoint.TS-07` → `ExplicitAcceptanceTestcase-TS-07`; revised `functionalPoint.TS-07-provider-secret-isolation` → revised `ExplicitAcceptanceTestcase-TS-07-Provider-Secret-Isolation`.
- TS-06 Provider E2E, its mounted path, provider/model/version/dimensions, controlled Neo4j success evidence, and zero-write failure matrix are unchanged.
- Existing relationships `grag-rel-credentials-runtime`, `grag-rel-runtime-native`, `grag-rel-embedding-native`, and `grag-rel-native-canonical` remain sufficient; no relationship mutation is required.
- Downstream Neo4j configuration names are `ARGO_NEO4J_DATABASE_URL`, `ARGO_NEO4J_DATABASE_USERNAME`, and `ARGO_NEO4J_DATABASE_PASSWORD`; legacy `ARGO_NEO4J_URI`, `ARGO_NEO4J_USERNAME`, and `ARGO_NEO4J_PASSWORD` aliases are not authorized by this handoff.
- Implementation Design must revise provenance fixtures and guards for both approved secrets and both approved sources, including agreement/conflict, missing/blank, alternate/tracked/root file, path traversal, reparse, broad ACL, CLI, literal/default/fallback, alias/indirect, duplicate-key, unknown-secret, redaction, complete value-channel, and zero-persistence cases.
- Parallel Coding files, `.argo/.env`, example-file work, and runner-owned `deliveryStatus` residuals are outside this Intent Design commit.

### Validation and open risks

- `argo.previewSystemArchitectureMutation`: passed for one Constraint update and one Requirements Realization View description update.
- `argo.applySystemArchitectureMutation`: passed; Neo4j synchronized to 46 elements, 56 relationships, and 26 views.
- `argo.validateSystemArchitecture`: passed.
- Acceptance adequacy blockers: none. Runtime verification remains downstream work and must not read real secret values in design tests.

## 2026-07-25 — W3 Index Lifecycle And Exact Threshold Baseline

- Selected viewpoints: Application Usage Viewpoint for query/index availability behavior, Implementation and Migration Viewpoint for W3 delivery sequencing, and Requirements Realization Viewpoint as the release-gate framing carried from native embedding qualification into index delivery.
- Stakeholder concern: requirements owners, ICT architects, implementation designers, and acceptors need W3 to prove all-mutation lifecycle version advancement, exact threshold-all seed correctness, unaligned semantic-query rejection, and ANN top-k as benchmark-only evidence before Phase 1 correctness is claimed.
- Modeling purpose: designing, deciding, and intent-to-implementation handoff preparation.
- View binding: `grag-index-consistency` remains an Application Usage Viewpoint instance because it shows the application/data dependency that governs whether semantic retrieval is available; its description now binds exact threshold-all correctness before ANN comparison into the same index-consistency concern.
- Human approval evidence: this chat delivery request approved DT-05, DT-16, and DT-17 acceptance mapping, including the same-element DT-16 semantic-index testcase boundary needed for coverage. Because the schema does not permit an `approvedByHuman` field on testcases or handoff JSON, approval is recorded as schema-compliant `acceptanceApproval.*` element attributes and handoff notes.
- Delivery-status guardrail: no `deliveryStatus` attribute was invented or manually changed beyond preserving existing values in MCP patches.

### Coverage matrix

- `grag-seed-retrieval` — `functionalPoint.DT-05-threshold-all-correctness` -> `ExplicitAcceptanceTestcase-DT-05`.
- `grag-semantic-index` — `functionalPoint.DT-16-versioned-vector-baseline` -> `ExplicitAcceptanceTestcase-DT-16-SemanticIndex`.
- `grag-index-lifecycle` — `functionalPoint.DT-16-all-mutation-version-advance` -> `ExplicitAcceptanceTestcase-DT-16`.
- `grag-alignment-constraint` — `functionalPoint.DT-17-unaligned-semantic-rejection` -> `ExplicitAcceptanceTestcase-DT-17`.

### Dependency-scope decisions

- Handoff scope is the four requested implementation elements: `grag-semantic-index`, `grag-index-lifecycle`, `grag-alignment-constraint`, and `grag-seed-retrieval`.
- Relationships in scope are `grag-rel-lifecycle-index`, `grag-rel-lifecycle-validation`, and the existing validation/seed and alignment service relationships needed to express that only Aligned semantic retrieval may proceed.
- `grag-wp-3` was updated as delivery-scope context, not as an implementation target in the handoff element list.
- Existing embedding adapter and generation elements remain downstream implementation context through `grag-embedding-generation-usage`, but the user-requested handoff scope stays at the four named domain elements.

### Validation and open risks

- `argo.previewSystemArchitectureMutation`: passed after correcting `updateView` mutation shape from `id` to `view_id`.
- `argo.applySystemArchitectureMutation`: passed; Neo4j synchronized to 46 elements, 56 relationships, and 26 views.
- `argo.validateSystemArchitecture`: passed.
- Open business questions: none. Runtime pass/fail evidence for the W3 entrypoints remains downstream Implementation Design/Coding work.

## 2026-07-25 — TS-09 Blocks Full W3 Acceptance

- Selected viewpoints: Implementation and Migration Viewpoint for W3 acceptance state and delivery sequencing, Technology Usage Viewpoint for adapter/generation/vector-projection dependencies, and Requirements Realization Viewpoint for TS-09 as a blocking release gate.
- Stakeholder concern: requirements owners, ICT architects, implementation designers, and acceptors need DT-05/DT-16/DT-17 scoped passes preserved without allowing full W3 acceptance while adapter-driven generation and persistence remain unproven.
- Modeling purpose: audit repair and intent-to-implementation handoff correction.
- Human feedback: TS-09 is a blocker; `productionGraphRagRuntime.generateAffectedEmbeddings()` does not prove Node adapter generation/persistence because the observable outcome lacks required `runtime`, `neo4jGenAiPluginRequired`, and adapter generation/persistence evidence.
- Corrected decision: W3 is `not_accepted` until `runEmbeddingProviderAdapterLifecycle.js` passes. DT-05, DT-16, and DT-17 may remain scoped-passed evidence only.
- Delivery-status guardrail: Intent Design did not manually set acceptance by editing runner-owned `deliveryStatus`. Existing runner-owned values remain runner-controlled.

### Corrected coverage matrix

- `grag-seed-retrieval` — `functionalPoint.DT-05-threshold-all-correctness` -> `ExplicitAcceptanceTestcase-DT-05`.
- `grag-semantic-index` — `functionalPoint.DT-16-versioned-vector-baseline` -> `ExplicitAcceptanceTestcase-DT-16-SemanticIndex`.
- `grag-index-lifecycle` — `functionalPoint.DT-16-all-mutation-version-advance` -> `ExplicitAcceptanceTestcase-DT-16`.
- `grag-alignment-constraint` — `functionalPoint.DT-17-unaligned-semantic-rejection` -> `ExplicitAcceptanceTestcase-DT-17`.
- `grag-embedding-provider-adapter` — `functionalPoint.TS-09-adapter-generation` -> `ExplicitAcceptanceTestcase-TS-09-EmbeddingProviderAdapter`.
- `grag-embedding-generation` — `functionalPoint.TS-09-affected-record-generation` -> `ExplicitAcceptanceTestcase-TS-09-EmbeddingGeneration`.

### Validation and open risks

- `argo.previewSystemArchitectureMutation`: passed for TS-09 W3 correction.
- `argo.applySystemArchitectureMutation`: passed; Neo4j synchronized to 46 elements, 56 relationships, and 26 views.
- `argo.validateSystemArchitecture`: passed.
- `argo.validateStageHandoff(stage="intent-to-implementation")`: passed for the corrected six-element W3 handoff.
- Open business questions: none. ImplementationDesign must regenerate a TS-09-inclusive implementation handoff before Coding/Repair proceeds.

## 2026-07-25 — W3.1 Mutation-Driven Live Vector Integration

- Selected viewpoint: Implementation and Migration Viewpoint.
- Stakeholder concern: requirements owners, ICT architects, implementation designers, runtime owners, and acceptors need accepted W3 lifecycle evidence integrated with the real architecture mutation lifecycle, live approved Qwen embedding, Neo4j vector persistence/queryability, and failure-state release gates before downstream semantic seed work relies on it.
- Modeling purpose: deciding and intent-to-implementation handoff preparation.
- Affected view bindings: `grag-w31-integration-acceptance` is a new Implementation and Migration Viewpoint instance because it isolates W3-to-W3.1-to-W4 sequencing, affected-record extraction, adapter generation, vector index persistence, and alignment release semantics under acceptance-delivery concerns; `grag-seven-wave-sequence` remains the seven-wave overview and points to the dedicated W3.1 view instead of exceeding the seven-element view limit; `grag-delivery-impact-foundation` remains a compact implementation/migration impact view with the new W3.1 work package and realization link.
- Human approval evidence: the 2026-07-25 user request explicitly asked to supplement W3.1, add the live `applySystemArchitectureMutation -> Embedding -> Neo4j vector queryable` acceptance scope, preserve W3/TS-09 acceptance, and produce an intent-to-implementation handoff. Runtime delivery still requires downstream live-runner evidence and must not be marked delivered by Intent Design.

### Coverage matrix

- `grag-wp-3-1` — `functionalPoint.W3-1-live-mutation-vector-e2e` -> `ExplicitAcceptanceTestcase-W3-1-MutationEmbeddingVectorE2E`.
- `grag-index-lifecycle` — `functionalPoint.DT-16-all-mutation-version-advance` -> `ExplicitAcceptanceTestcase-DT-16`.
- `grag-embedding-generation` — `functionalPoint.TS-09-affected-record-generation` -> `ExplicitAcceptanceTestcase-TS-09-EmbeddingGeneration`.
- `grag-embedding-provider-adapter` — `functionalPoint.TS-09-adapter-generation` -> `ExplicitAcceptanceTestcase-TS-09-EmbeddingProviderAdapter`.
- `grag-semantic-index` — `functionalPoint.DT-16-versioned-vector-baseline` -> `ExplicitAcceptanceTestcase-DT-16-SemanticIndex`.
- `grag-alignment-constraint` — `functionalPoint.DT-17-unaligned-semantic-rejection` -> `ExplicitAcceptanceTestcase-DT-17`.
- `grag-native-retrieval-service` — `functionalPoint.TS-01-native` -> `ExplicitAcceptanceTestcase-TS-01-Native`.
- `grag-embedding-qualification` — `functionalPoint.TS-06` -> `ExplicitAcceptanceTestcase-TS-06`; `functionalPoint.TS-06-provider-e2e` -> `ExplicitAcceptanceTestcase-TS-06-Provider-E2E`.
- `grag-credential-boundary` — `functionalPoint.TS-07` -> `ExplicitAcceptanceTestcase-TS-07`; `functionalPoint.TS-07-provider-secret-isolation` -> `ExplicitAcceptanceTestcase-TS-07-Provider-Secret-Isolation`.

### Release semantics and prerequisites

- W3.1 requires `applySystemArchitectureMutation` touched Element, ArchitectureRelationship, and View records to flow through real approved Qwen adapter generation and Neo4j vector-index persistence/query verification before the semantic index may be marked Aligned.
- Provider failure, unapproved provider/model/dimensions, partial generation, partial persistence, vector-index write failure, or vector-query verification failure marks Stale or Failed and prohibits pure semantic queries until restored to Aligned.
- Live execution is explicit opt-in only in controlled local or protected CI and may use only approved secret sources for `QWEN_KEY` and `ARGO_NEO4J_DATABASE_PASSWORD`; offline fakes may support development but never count as W3.1 live delivery evidence.

### Validation and open risks

- `argo.previewSystemArchitectureMutation`: first dry run failed on the seven-element view limit and missing view target; split-view retry passed.
- `argo.applySystemArchitectureMutation`: passed; Neo4j synchronized to 47 elements, 58 relationships, and 27 views.
- `argo.validateSystemArchitecture`: passed.
- Open business questions: none at intent level. Live Qwen/Neo4j runner credentials and controlled execution environment are downstream prerequisites, not delivery evidence in this stage.

## 2026-07-25 — W3.1 Automatic Mutation-Triggered Correction

- Selected viewpoint: Implementation and Migration Viewpoint.
- Stakeholder concern: requirements owners, ICT architects, implementation designers, runtime owners, and acceptors need W3.1 acceptance to prove the actual mutation write success path automatically invokes embedding, not merely that a test Harness can run embedding after mutation.
- Modeling purpose: audit repair, deciding, and intent-to-implementation handoff preparation.
- Corrected decision: prior live/manual evidence is insufficient and W3.1 remains not accepted until a single `applySystemArchitectureMutation` write call automatically triggers the embedding lifecycle and returns `embeddingLifecycle` plus `alignment` in the MCP response.
- Affected view binding: `grag-w31-integration-acceptance` remains an Implementation and Migration Viewpoint instance; its concern and scope now explicitly require actual touched-id extraction from the mutation response, automatic `embeddingLifecycle` invocation, response-level alignment semantics, and rejection of Harness-added lifecycle execution.

### Corrected acceptance boundary

- The E2E must call only one Mutation tool: `applySystemArchitectureMutation`.
- The mutation write success path must automatically invoke the embedding lifecycle.
- The lifecycle must use actual `touchedElementIds`, `touchedRelationshipIds`, and `touchedViewIds` from the mutation result/response.
- The MCP mutation response must expose `embeddingLifecycle` and `alignment`.
- The Harness must not manually create or execute `mutationEmbeddingVectorLifecycle` after mutation and must not supply preset `expectedTouchedRecords`.
- Historical manual post-mutation Qwen/Neo4j evidence is preserved only as insufficient historical evidence, not W3.1 acceptance.

### Coverage matrix

- `grag-wp-3-1` — corrected `functionalPoint.W3-1-live-mutation-vector-e2e` -> corrected `ExplicitAcceptanceTestcase-W3-1-MutationEmbeddingVectorE2E`.
- Existing same-element upstream coverage remains unchanged for `grag-index-lifecycle`, `grag-embedding-generation`, `grag-embedding-provider-adapter`, `grag-semantic-index`, `grag-alignment-constraint`, `grag-native-retrieval-service`, `grag-embedding-qualification`, and `grag-credential-boundary`.

### Validation and open risks

- `argo.previewSystemArchitectureMutation`: passed for `grag-wp-3-1` and `grag-w31-integration-acceptance` correction.
- `argo.applySystemArchitectureMutation`: passed; Neo4j synchronized to 47 elements, 58 relationships, and 27 views.
- `argo.validateSystemArchitecture`: passed.
- Runner-owned `deliveryStatus` was preserved as runner data and not fabricated by Intent Design.
- Open business questions: none. Downstream ImplementationDesign must regenerate the implementation-to-coding handoff before Coding/Repair proceeds.

## 2026-07-25 — W4 Three-Channel Semantic Seed Handoff

- Selected viewpoint: Application Usage Viewpoint.
- Stakeholder concern: application architects, requirements owners, implementation designers, and acceptors need `grag-seed-retrieval` to expose relevance-discovery seeds independently for Element, Relationship, and View before any closure application behavior runs.
- Modeling purpose: designing, deciding, and intent-to-implementation handoff preparation.
- Affected View rationale: no View membership changed. `grag-seed-closure-usage` remains the contextual Application Usage chain for later seed-to-closure flow; this handoff intentionally scopes only `grag-seed-retrieval`. `grag-delivery-impact-retrieval` remains delivery sequencing context and does not broaden this W4 seed handoff to W5/W6 behavior.
- Human approval evidence: the 2026-07-25 user requirement explicitly requested `grag-seed-retrieval`, DT-04 and DT-05 acceptance mapping, independent Element/Relationship/View gates, all passing candidates returned, valid zero results, and no graph closure mixed into this stage. The handoff schema does not permit an `approvedByHuman` field, so approval is recorded in handoff notes and as schema-compliant `acceptanceApproval.DT-04` and `acceptanceApproval.DT-05` attributes on `grag-seed-retrieval`.

### Coverage matrix

- `grag-seed-retrieval` — `functionalPoint.DT-04-three-channel-seed-discovery` -> `ExplicitAcceptanceTestcase-DT-04`.
- `grag-seed-retrieval` — `functionalPoint.DT-05-threshold-all-correctness` -> `ExplicitAcceptanceTestcase-DT-05`.

### Dependency-scope decisions

- Handoff scope is exactly one implementation target: `grag-seed-retrieval`.
- Context relationships are `grag-rel-w31-w4` as upstream delivery gate, `grag-rel-validation-seeds` as the validated-query trigger into seed retrieval, and `grag-rel-w4-seed-retrieval` as W4 realization of the seed retrieval function.
- `grag-rel-seeds-closure` and downstream closure elements are intentionally excluded from the handoff because closure, traversal expansion, neighborhood closure, and graph completion begin after relevance seed discovery.
- Existing runner-owned `deliveryStatus` was preserved and not fabricated by Intent Design.

### Acceptance boundaries

- DT-04 requires separate Element, Relationship, and View seed channels. Relationship and View seeds must be directly discoverable and independently attributed, not inferred from Element-only retrieval or graph closure.
- DT-05 requires independent thresholds per channel. Every candidate at or above its channel threshold is returned; candidates below threshold are not released by that gate; unrelated queries may return zero results; ANN top-k is performance comparison only.

### Validation and open risks

- `argo.getIntentElementContext`: read `grag-seed-retrieval` dependency context with implementation-design profile before handoff scoping.
- `argo.previewSystemArchitectureMutation`: passed for one `grag-seed-retrieval` element update.
- `argo.applySystemArchitectureMutation`: passed; Neo4j synchronized to 47 elements, 58 relationships, and 27 views.
- `argo.validateSystemArchitecture`: passed.
- `argo.validateStageHandoff(stage="intent-to-implementation")`: passed for `.argo/temp/IntentToImplementationHandoff.json`.
- Checklist self-audit: A1-A5 satisfied with no View mutation required; B1-B3 satisfied because no ExplicitAcceptanceTestcase was added or modified and both mounted testcase mappings are same-element; C1-C2 scoped to the single focus element with delivered upstream context and explicit exclusion of closure; D1-D8 satisfied through exact element mapping, same-element coverage, graph attributes, and schema-compliant global approval notes; E1-E3 satisfied subject to schema limitation on `approvedByHuman`; F1 recorded here and F2 requires the Intent Design stage commit.
- Open business questions and adequacy blockers: none.

## 2026-07-25 — W5 Deterministic Five-Purpose Closure

- Selected viewpoint: Application Usage Viewpoint.
- Stakeholder concern: application architects, requirements owners, implementation designers, coding repair owners, auditors, and graph-tidy operators need each lifecycle task to receive an independently reviewable deterministic closure range.
- Modeling purpose: designing, deciding, and intent-to-implementation handoff preparation.
- Affected view bindings: `grag-purpose-policies-a`, `grag-purpose-policies-b`, and `grag-seed-closure-usage` remain Application Usage Viewpoint instances because they show application behavior selecting purpose policies and separating semantic seed discovery from deterministic graph completeness.
- Human approval evidence: the orchestrating W5 request explicitly required deterministic five-purpose closure, parameterized Cypher plus ArchiMate semantics, no free-generated Cypher for mandatory closure, DT-06 through DT-12 acceptance mapping, handoff production, and an IntentDesign stage commit. The schema does not permit `approvedByHuman` fields on handoff JSON, so approval is recorded in handoff notes and schema-compliant `acceptanceApproval.*` element attributes.
- Delivery-status guardrail: existing runner-owned `deliveryStatus` values were preserved and not fabricated by Intent Design.

### Coverage matrix

- `grag-purpose-closure` — `functionalPoint.DT-06-deterministic-mandatory-closure` -> `ExplicitAcceptanceTestcase-DT-06`; `functionalPoint.DT-07-purpose-category-dispatch` -> `ExplicitAcceptanceTestcase-DT-07`.
- `grag-intent-decision-policy` — `functionalPoint.DT-08-intent-decision-boundary` -> `ExplicitAcceptanceTestcase-DT-08`.
- `grag-implementation-policy` — `functionalPoint.DT-09-implementation-design-boundary` -> `ExplicitAcceptanceTestcase-DT-09`.
- `grag-repair-policy` — `functionalPoint.DT-10-coding-repair-boundary` -> `ExplicitAcceptanceTestcase-DT-10`.
- `grag-audit-policy` — `functionalPoint.DT-11-audit-proof-boundary` -> `ExplicitAcceptanceTestcase-DT-11`.
- `grag-graph-tidy-policy` — `functionalPoint.DT-12-full-snapshot-bypass` -> `ExplicitAcceptanceTestcase-DT-12`.

### Acceptance boundaries

- DT-06 requires mandatory closure to be decided by named parameterized Cypher templates plus ArchiMate relationship type and direction semantics, not by semantic similarity, arbitrary depth, connected-component expansion, caller identity, or free-generated Cypher.
- DT-07 requires exactly five independent purpose categories: intent-decision, implementation-design, coding-repair, audit, and graph-tidy. Equivalent declared purpose and anchors must select the same category regardless of Agent identity; different declared categories must expose distinct policy ids, parameter contracts, inclusion rules, exclusions, and rationale.
- DT-08 returns Why/What, business behavior, acceptance lineage, absence declarations, and directly relevant realization-state evidence for intent decisions while excluding implementation-plan, repair, audit, and graph-tidy scopes.
- DT-09 returns the implementation target, recursive upstream prerequisites until delivered boundaries, bounded downstream impact, guardrails, and same-element acceptance semantics while excluding unrelated similar or out-of-category context.
- DT-10 returns intended behavior, causal prerequisites, at-risk outcomes, principles, constraints, and acceptance semantics for a defect subject without expanding to adjacent similar capabilities.
- DT-11 treats Graph RAG as candidate recommendation only; an explicit audit subject is required, and mandatory proof scope returns Subject, Obligation, Evidence, and Exceptions including low-similarity violations inside the subject.
- DT-12 is the fifth purpose category and bypasses Graph RAG closure entirely; graph-tidy always reads the complete canonical snapshot and cannot be narrowed by semantic retrieval, thresholds, purpose closure expansion, or generated Cypher.

### Dependency-scope decisions

- Handoff scope is the W5 closure set: `grag-purpose-closure`, `grag-intent-decision-policy`, `grag-implementation-policy`, `grag-repair-policy`, `grag-audit-policy`, and `grag-graph-tidy-policy`.
- Upstream `grag-seed-retrieval` remains a delivered W4 boundary with `deliveryEvidence.W4`; W5 consumes qualifying seeds but does not reopen W4 seed retrieval.
- W6 structural endpoint closure, complete View closure, provenance, and coherent-result behavior remain downstream integrity scope and are not implementation targets in this W5 handoff.

### Validation and open risks

- `argo.previewSystemArchitectureMutation`: passed for W5 element, relationship, and View description updates.
- `argo.applySystemArchitectureMutation`: passed; Neo4j synchronized to 47 elements, 58 relationships, and 27 views.
- `argo.validateSystemArchitecture`: passed.
- `argo.getIntentElementContext`: read `grag-purpose-closure` dependency context with implementation-design profile after mutation.
- `argo.validateStageHandoff(stage="intent-to-implementation")`: passed for `.argo/temp/IntentToImplementationHandoff.json` after removing a stale W4 JSON object that had remained after file overwrite.
- Checklist self-audit: A1-A5 satisfied by persisted/validated graph mutation and viewpoint-bound views; B1-B3 satisfied with same-element mounted DT-06 through DT-12 testcases and schema-compliant approval attributes; C1-C2 satisfied through explicit same-element coverage mappings and delivered W4 boundary evidence; D1-D8 satisfied with no open questions; E1-E3 satisfied subject to schema limitation on `approvedByHuman`; F1 recorded here and F2 requires this IntentDesign stage commit.
- Open business questions and adequacy blockers: none.

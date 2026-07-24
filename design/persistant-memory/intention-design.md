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

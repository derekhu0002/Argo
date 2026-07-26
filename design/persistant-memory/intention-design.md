# Intent Design Session Record

## 2026-07-26 — Approved WP-P1 Persistence and Backfill Handoff

- Persistent stage/session ID: `intent-semprod-wp-p1-20260726T2039+08`.
- Scope: only architecture work package `semprod-wp-persistence-backfill` (WP-P1). WP-P2 and WP-P3 remain sequencing context and were not started.
- Selected viewpoints: Requirements Realization Viewpoint and Implementation and Migration Viewpoint.
- Stakeholder concern: delivery owners, ICT architects, runtime operators, requirements owners, and acceptors need a durable production semantic projection and an explicit bounded/resumable full backfill for canonical Element, ArchitectureRelationship, and View records without weakening canonical authority or reusing test-only cleanup as production persistence.
- Modeling purpose: designing, deciding, auditing, and handoff preparation.
- Affected view bindings: `semprod-requirements-realization` remains a Requirements Realization Viewpoint instance for SP-01/SP-02 requirement-to-realization semantics; new `semprod-wp1-persistence-backfill` is an Implementation and Migration Viewpoint instance for WP-P1 scope, upstream structural projection, affected-element dependencies, and delivery sequencing. Both descriptions use the required viewpoint/concern/purpose/scope/rationale binding.
- Human approval evidence: on 2026-07-26 the human partner explicitly approved both complete mounted boundaries `ExplicitAcceptanceTestcase-SP-01-FullBackfill` and `ExplicitAcceptanceTestcase-SP-02-PersistentProjection`, and globally approved the intent-to-implementation scope limited to `semprod-backfill-control`, `semprod-persistent-projection-requirement`, `grag-semantic-index`, `grag-index-lifecycle`, and `grag-embedding-provider-adapter`.

### Intent mutation

- Added `functionalPoint.SP-01-full-backfill` under `semprod-backfill-control`, mapped to mounted `ExplicitAcceptanceTestcase-SP-01-FullBackfill`.
- Added `functionalPoint.SP-02-persistent-projection` under `semprod-persistent-projection-requirement`, mapped to mounted `ExplicitAcceptanceTestcase-SP-02-PersistentProjection`.
- Strengthened SP-01 around all-record three-channel enumeration, stable canonical identity, complete canonical/content/index/provider/model/version/dimensions/vector metadata, bounded batches, checkpoints, isolated failures, resume, idempotent rerun, external credentials, no fake mutation, and alignment only after all channels complete.
- Strengthened SP-02 around a separate durable production persistence path, restart survival, stable-identity changed-record upsert, tombstone deletion, no production runId cleanup, preservation of existing live-E2E test-only cleanup, canonical JSON authority, and Neo4j projection/index status.
- Added `semprod-rel-wp1-backfill`, `semprod-rel-backfill-lifecycle`, and `semprod-rel-adapter-backfill` to make WP-P1 realization and dependency directions graph-traversable.
- No `deliveryStatus` attribute was created, changed, removed, or inferred.

### Dependency-subgraph coverage matrix

- `semprod-backfill-control` (focus/implementation target): `functionalPoint.SP-01-full-backfill` -> `ExplicitAcceptanceTestcase-SP-01-FullBackfill`; human-approved.
- `semprod-persistent-projection-requirement` (implementation target): `functionalPoint.SP-02-persistent-projection` -> `ExplicitAcceptanceTestcase-SP-02-PersistentProjection`; human-approved.
- `grag-semantic-index` (delivered upstream boundary/context): `functionalPoint.DT-16-versioned-vector-baseline` -> `ExplicitAcceptanceTestcase-DT-16-SemanticIndex`; graph evidence records `runMutationIndexLifecycle.js`, exitCode 0, and runner-owned `deliveryStatus=delivered`.
- `grag-index-lifecycle` (delivered upstream boundary/context): `functionalPoint.DT-16-all-mutation-version-advance` -> `ExplicitAcceptanceTestcase-DT-16`; graph evidence records `runMutationIndexLifecycle.js`, exitCode 0, and runner-owned `deliveryStatus=delivered`.
- `grag-embedding-provider-adapter` (delivered upstream boundary/context): `functionalPoint.TS-09-adapter-generation` -> `ExplicitAcceptanceTestcase-TS-09-EmbeddingProviderAdapter`; graph evidence records `runEmbeddingProviderAdapterLifecycle.js`, exitCode 0, and runner-owned `deliveryStatus=delivered`.
- `semprod-structural-projection` is an evidence-backed excluded precondition rather than a WP-P1 implementation target: SP-01 starts only after ordinary structural projection, and WP-P1 neither changes structural projection nor treats it as semantic readiness.
- WP-P2 default retrieval/readiness and WP-P3 operator release are excluded downstream dependents. The new WP-P1 view explicitly excludes both packages from implementation scope.

### Validation and blockers

- First `argo.previewSystemArchitectureMutation` attempt failed without writing because relationship additions referenced the not-yet-created `semprod-wp1-persistence-backfill` view. The ordered retry created the view before adding relationships and passed.
- Successful preview evidence: 2 element updates, 1 new view, 3 new relationships, and 1 view update; counts `61 elements / 76 relationships / 30 views` -> `61 / 79 / 31`; no errors.
- `argo.applySystemArchitectureMutation` wrote the same mutation successfully and preserved the same count delta. Canonical graph persistence passed.
- Post-write Neo4j synchronization definitively failed with exact error `neo4jUri is required for start`. This is an environment/setup blocker; no synchronization evidence was fabricated.
- `argo.validateSystemArchitecture` passed with exitCode 0 and stdout `SystemArchitecture validation passed for: design/KG/SystemArchitecture.json`.
- `.argo/temp/IntentToImplementationHandoff.json` was found to contain an older unrelated TS-01/TS-07 handoff generated at `2026-07-26T17:30:00+08:00`; filesystem evidence shows creation at `2026-07-26 17:32` and last write at `2026-07-26 18:32`, before this WP-P1 session started at approximately `20:39`. The current session first inspected the file after the MCP graph apply, but the timestamps and absence of handoff-path references in the apply result prove the apply did not create it. The orchestrator's pre-dispatch empty-temp observation is therefore inconsistent with the repository filesystem observed by this session; no unsupported cause is asserted. The WP-P1 session did not overwrite or treat the stale file as WP-P1 evidence. `argo.validateStageHandoff(stage="intent-to-implementation")` passed only for that stale unrelated artifact, not for WP-P1.
- The repository handoff schema has `additionalProperties: false` and no `approvedByHuman` property. The now-granted global approval is therefore recorded in schema-compliant handoff notes and in schema-compliant element attributes `acceptanceApproval.SP-01` and `acceptanceApproval.SP-02`, matching established repository practice.
- Approval mutation preview passed for the two element updates with counts unchanged at `61 elements / 79 relationships / 31 views`; apply wrote the approval evidence successfully. Post-write Neo4j synchronization remained blocked with exact error `neo4jUri is required for start`; the canonical graph write still succeeded.
- `.argo/temp/IntentToImplementationHandoff.json` now contains the approved five-element WP-P1 scope and seven relevant relationship ids; `openQuestions` is empty. `argo.validateStageHandoff(stage="intent-to-implementation")` passed with exitCode 0 and stdout `Stage handoff validation passed for: intent-to-implementation`.
- Final `argo.validateSystemArchitecture` passed with exitCode 0 and stdout `SystemArchitecture validation passed for: design/KG/SystemArchitecture.json`.
- Checklist self-audit after writing the handoff: A1-A5 satisfied by canonical MCP persistence, complete elements/functional points/directional relationships, and viewpoint-bound views; B1-B3 satisfied by same-element SP-01/SP-02 mappings and explicit human approval attributes; C1-C2 satisfied by the five-element coverage matrix, delivered boundary evidence, and evidence-backed structural-projection exclusion; D1-D8 satisfied with no open questions and explicit per-boundary/global approval; E1-E3 satisfied by the complete validated handoff and schema-compliant approval note; F1 is this session record and F2 is completed by the IntentDesign stage commit immediately following this audit.

### Implementation-to-intent trace correction

- Source proposal: `design/KG/ImplementationToIntentTraceProposal.json`, ImplementationDesign session `implementation-semprod-wp-p1-20260726T2055+08`.
- `argo.validateTraceProposal` passed with exitCode 0 and stdout `Trace proposal validation passed for: design/KG/ImplementationToIntentTraceProposal.json`.
- Proposal verdict: accepted as semantically consistent and scope-preserving. It changes only the physical acceptance entrypoint strings; SP-01/SP-02 descriptions, Inputs, control points, observation points, functional points, approval evidence, relationships, viewpoint bindings, and the five-element WP-P1 scope remain unchanged.
- `ExplicitAcceptanceTestcase-SP-01-FullBackfill` now has exact acceptanceCriteria `tests/explicit/entries/runProductionSemanticBackfill.js`.
- `ExplicitAcceptanceTestcase-SP-02-PersistentProjection` now has exact acceptanceCriteria `tests/explicit/entries/runPersistentSemanticProjectionLifecycle.js`.
- Approval continuity: this is physical trace correction for the already-approved mounted boundaries, not a semantic boundary change. The 2026-07-26 per-testcase and global WP-P1 approvals remain valid; no additional human boundary approval is required.
- `argo.previewSystemArchitectureMutation` passed for exactly two element testcase updates with counts unchanged at `61 elements / 79 relationships / 31 views`.
- `argo.applySystemArchitectureMutation` wrote exactly those two updates with counts unchanged. Post-write Neo4j synchronization failed with exact error `neo4jUri is required for start`; no synchronization evidence is claimed.
- No runner-owned `deliveryStatus` attribute was created, changed, removed, or inferred.

### WP-P1 global validator scope blocker audit

- Source proposal: `design/KG/ImplementationToIntentTraceProposal.json`, generated `2026-07-26T21:01:00+08:00` by resumed ImplementationDesign session `implementation-semprod-wp-p1-20260726T2055+08`.
- `argo.validateTraceProposal` passed with exitCode 0, but proposal verdict is rejected/deferred because every requested mutation would remove, deactivate, or defer SP-03/SP-04/SP-05 mounts owned by unauthorized WP-P2/WP-P3 scope.
- Reproduced `argo.validateStageHandoff(stage="implementation-to-coding")` exitCode 1 findings:
  - `design/KG/SystemArchitecture.json.testcase(ExplicitAcceptanceTestcase-SP-03-DefaultVectorRetrieval).acceptanceCriteria must be a single workspace-relative testcase entrypoint, not a descriptive sentence or wrapped command`
  - `design/KG/SystemArchitecture.json.testcase(ExplicitAcceptanceTestcase-SP-04-FailClosedReadiness).acceptanceCriteria must be a single workspace-relative testcase entrypoint, not a descriptive sentence or wrapped command`
  - `design/KG/SystemArchitecture.json.testcase(ExplicitAcceptanceTestcase-SP-05-NewProjectJourney).acceptanceCriteria must be a single workspace-relative testcase entrypoint, not a descriptive sentence or wrapped command`
- Root cause: `.argo/scripts/validateStageHandoff.js` function `buildAcceptanceCriteriaByTestcase` iterates every element and every mounted testcase in `design/KG/SystemArchitecture.json` and validates each acceptanceCriteria before matching the WP-P1 handoff's explicit entrypoints. `.argo/schema/ImplementationToCodingHandoff.schema.json` has no intent-element or testcase scope selector. Therefore no canonical WP-P1-only graph attribute, relationship, view, or handoff field can exclude SP-03/SP-04/SP-05 from this global validation.
- No graph mutation was applied. Altering SP-03/SP-04/SP-05 paths, mounts, semantics, approval state, or disposition requires separate human authorization for WP-P2/WP-P3; this session does not infer it.
- `argo.validateSystemArchitecture` still passes with exitCode 0 and stdout `SystemArchitecture validation passed for: design/KG/SystemArchitecture.json`.
- The WP-P1 architecture guard mismatch was reproduced exactly as `WP_P1_ARCHITECTURE_BOUNDARY_GUARD: contracts omit delete tombstones`. The approved intent already requires tombstone deletion, and the draft contracts express equivalent phrases (`deletes tombstones`, `tombstones delete`, and `tombstone deletion`). The failure is an ImplementationDesign-owned exact-wording mismatch between its draft contract text and its draft guard, not an intent semantic gap. ImplementationDesign may align the WP-P1 contract/guard wording without new human approval and without changing `SystemArchitecture.json`.
- Routing: resume the same ImplementationDesign session to correct its WP-P1 contract/guard exact wording, preserve RED evidence, and report the global validator blocker to the orchestrator. The orchestrator must obtain separate human authorization for SP-03/SP-04/SP-05 or route a validator-scoping change to the owner of `.argo/scripts/validateStageHandoff.js`; IntentionDesign must not broaden WP-P1.
- No runner-owned `deliveryStatus` attribute was created, changed, removed, or inferred.

### Authorized sequential work-package isolation correction

- Authorization: the parent delegated-review decision explicitly authorized only the narrow intent-governance correction needed to preserve sequential WP-P1/WP-P2/WP-P3 isolation. It did not approve, deliver, physicalize, or start SP-03/SP-04/SP-05.
- Viewpoint frame: Requirements Realization Viewpoint for future acceptance-governance sequencing; Implementation and Migration Viewpoint for work-package isolation. No view was changed because existing requirement realization, work-package definitions, and view membership remain valid.
- `argo.previewSystemArchitectureMutation` passed without writing for exactly three `updateElement` mutations: `semprod-default-vector-retrieval`, `semprod-readiness-requirement`, and `semprod-operator-journey-process`. Counts remained `61 elements / 79 relationships / 31 views`; touched relationships and views were empty; errors were empty.
- `argo.applySystemArchitectureMutation` passed and wrote the same three element updates with counts unchanged at `61 / 79 / 31`.
- SP-03/SP-04/SP-05 mounted testcase objects were removed by setting only their owning elements' `testcases` arrays to empty. Their requirements, descriptions, decision traces, coding targets, functional points, relationships, views, and work-package definitions were preserved.
- Proposed future boundary semantics were preserved in `futureAcceptanceBoundary.SP-03`, `futureAcceptanceBoundary.SP-04`, and `futureAcceptanceBoundary.SP-05` attributes, including proposed control point, observation point, input, and suggested future entrypoint.
- Future ownership was preserved in `futureMountOwner.SP-03` and `futureMountOwner.SP-04` as WP-P2 IntentionDesign, and `futureMountOwner.SP-05` as WP-P3 IntentionDesign. Each attribute requires separate approval and explicitly says this correction does not approve, deliver, or physicalize the boundary.
- SP-01 and SP-02 remain mounted, executable-path anchored, and covered by their unchanged human-approval attributes. The approved five-element WP-P1 intent handoff is semantically unchanged and did not require regeneration.
- `argo.validateSystemArchitecture` passed with exitCode 0 and stdout `SystemArchitecture validation passed for: design/KG/SystemArchitecture.json`.
- `argo.validateStageHandoff(stage="intent-to-implementation")` passed with exitCode 0 and stdout `Stage handoff validation passed for: intent-to-implementation`.
- The former global blocker is removed: `argo.validateStageHandoff(stage="implementation-to-coding")` passed with exitCode 0 and stdout `Stage handoff validation passed for: implementation-to-coding`.
- Post-write Neo4j synchronization failed exactly with `neo4jUri is required for start`; no Neo4j synchronization or semantic alignment evidence is claimed.
- Checklist self-audit: A1-A5 remain satisfied for the WP-P1 scope; B1-B3, C1-C2, and D1-D8 remain satisfied for the approved mounted WP-P1 boundaries and five-element dependency scope; E1-E3 remain represented by the schema-compliant validated handoff and recorded human approval; F1 is this record and F2 requires the corrective stage commit.
- No runner-owned `deliveryStatus` attribute was created, changed, removed, or inferred.

### WP-P1 ImplementationDesign testcase audit — FAIL

- Audited ImplementationDesign commit `1c08b31528620bb18c3346d3af44b8b8592c0235` (`Materialize WP-P1 persistence and backfill design.`), session `implementation-semprod-wp-p1-20260726T2055+08`, against approved SP-01/SP-02 intent.
- Viewpoint and trace adequacy passed: Requirements Realization and Implementation and Migration framing is recorded; root/local contracts directly map the five approved WP-P1 intent elements; SP-01/SP-02 graph paths match their physical entrypoints; all four critical guards exit 0.
- Independent RED replay passed as design evidence: SP-01 exits 1 with `SP01_PRODUCTION_BACKFILL_BOUNDARY_MISSING`; SP-02 exits 1 with `SP02_PRODUCTION_PERSISTENCE_BOUNDARY_MISSING`.
- Independent full runner replay produced exactly `40 total / 38 passed / 2 failed / 0 missing acceptanceCriteria`; only SP-01 and SP-02 fail with the expected categories. `design/KG/test-failure-records.json` contains exactly those two records.
- The 21 committed delivery transitions are runner-truthful: two newly mounted owners changed from absent to `not_delivered`, and 19 previously delivered elements changed to `not_delivered`. Comparing intent commit `5ed151d9f6c21f44e92778641cb379215d74769c` with ImplementationDesign commit `1c08b31528620bb18c3346d3af44b8b8592c0235` shows the graphs are equal after removing `deliveryStatus`; element/relationship/view counts remain `61/79/31`. Every one of the 19 cascades has a declared upstream-dependency path to intentionally RED `semprod-backfill-control`, primarily through `semprod-rel-backfill-lifecycle`. No manual deliveryStatus mutation evidence exists.
- WP-P2/WP-P3 isolation passed: no SP-03/SP-04/SP-05 physical entrypoint exists, their future semantics remain unmounted metadata, and the normalized intent graph has no non-deliveryStatus semantic change in the ImplementationDesign commit.
- Independent `argo.validateStageHandoff(stage="implementation-to-coding")` passes.
- Blocking testcase-design finding 1, owned by ImplementationDesign: both explicit entries can pass without proving a production durable path. SP-01 injects projection/checkpoint test ports; SP-02 injects an in-memory Map adapter retained across two store instances. Neither entry invokes production runtime/MCP composition or freezes a concrete durable Neo4j projection/checkpoint adapter. Coding could satisfy both entries with test-facing factories while leaving the required production persistence and operator path uncomposed.
- Blocking testcase-design finding 2, owned by ImplementationDesign: SP-01 accepts implementation-reported `resumedFromCheckpoint === true` without independently proving completed canonical identities were not re-embedded or re-upserted. It has no negative explicit-opt-in case and no structural/canonical-version mismatch case, so automatic execution or wrong-version execution can false-pass.
- Blocking testcase-design finding 3, owned by ImplementationDesign: SP-02 checks that four methods exist but does not enforce that they are the only public methods, does not reject a production cleanup API or `runId`-bearing records, and does not prove missing external configuration/qualification blocks before persistence side effects. The fake test-only cleanup set does not independently prove real live-E2E cleanup isolation from production records.
- Blocking handoff finding 4, owned by ImplementationDesign: the coding handoff does not record the committed `40/38/2` baseline or its 21 delivery transitions. Coding therefore lacks an explicit handoff baseline against which its mandatory post-coding runner comparison can be audited.
- Required correction: resume the same ImplementationDesign session; strengthen frozen Harness/entrypoints and guards for independent resume replay detection, explicit opt-in and version blocking, exact no-cleanup/no-runId store surface, external configuration/qualification blocking, concrete durable adapter plus runtime/MCP composition; add missing production adapter/checkpoint coding targets; record the exact committed runner baseline and transitions; rerun RED, four guards, full runner, handoff validation, and create a replacement ImplementationDesign commit.
- Technical readiness verdict: not ready for delegated coding-gate review until those ImplementationDesign-owned corrections are complete. Coding/Repair remains unauthorized.
- Neo4j synchronization blocker remains exactly `neo4jUri is required for start`; no synchronization evidence is claimed.

### WP-P1 corrected ImplementationDesign testcase re-audit — PASS

- Re-audited correction commit `5c0cff35cd8c58ab8a16caf996fd7cca835956e9` (`Correct WP-P1 production persistence acceptance boundaries.`) in the same ImplementationDesign session.
- Prior finding 1, concrete durable production path: resolved. Contracts, coding targets, task plan, Harness, and guards now require `productionSemanticNeo4jAdapter.js` and `productionSemanticCheckpointStore.js`; SP-02 directly exercises the production adapter factory over a recording raw Neo4j driver, while SP-01 requires both factories and observes durable projection/checkpoint command effects through production runtime composition.
- Prior finding 2, runtime/MCP composition: resolved. SP-01 invokes actual `systemarchitecture-mcp-server.js` `callTool("backfillSystemArchitectureSemanticProjection", ...)` with a production Graph RAG runtime and verifies operator exposure, inward delegation evidence, no fake canonical mutation, and durable operations.
- Prior finding 3, independent no-replay evidence: resolved. Harness phases independently record provider identities and durable-upsert identities before and after interruption; the entrypoint requires both replay sets to be empty and no longer accepts an implementation-reported resume flag as proof.
- Prior finding 4, explicit gating and version sequencing: resolved. Missing opt-in, structural/canonical version mismatch, missing external credentials, and missing provider qualification each require exact categories and zero provider/store/checkpoint/index side effects.
- Prior finding 5, exact production surface and runId prohibition: resolved. SP-02 reflects the full callable store surface and requires exactly `close`, `deleteTombstones`, `readRecords`, and `upsertRecords`; runId-bearing input must fail before persistence; persisted production records must remain runId-free.
- Prior finding 6, live-E2E cleanup isolation: resolved by combined frozen evidence. The existing frozen `liveEmbeddingNeo4jBoundary.js` cleanup is actually label- and runId-scoped (`ArgoLiveEmbeddingEvidence { runId: $runId }`); production records are required to have no runId; the corrected lifecycle probe verifies production record count and identities survive unrelated test cleanup. Production targets still exclude and may not import the live boundary.
- Prior finding 7, baseline trace: resolved. The handoff records `40 total / 38 passed / 2 expected RED / 0 missing acceptanceCriteria`, both failure records, the 21 runner-owned transitions, and every transitioned element for later comparison.
- Independent direct replay: SP-01 exits 1 with `SP01_PRODUCTION_BACKFILL_BOUNDARY_MISSING`; SP-02 exits 1 with `SP02_PRODUCTION_PERSISTENCE_BOUNDARY_MISSING`; all four WP-P1 guards exit 0.
- Independent full `argo.runArchitectureTests` replay: `40 total / 38 passed / 2 failed / 0 missing acceptanceCriteria`; only SP-01/SP-02 fail with their expected categories. No `[DELIVERY]` change was reported, and commit comparison confirms zero deliveryStatus changes from `1c08b315` to `5c0cff35`.
- Runner ownership: the correction commit does not modify `design/KG/SystemArchitecture.json`; semantic graph and deliveryStatus remain unchanged at `61 elements / 79 relationships / 31 views`. Fresh runner output leaves graph and failure records equal to HEAD. No manual deliveryStatus mutation evidence exists.
- Independent `argo.validateStageHandoff(stage="implementation-to-coding")` passed with exitCode 0 and stdout `Stage handoff validation passed for: implementation-to-coding`.
- Frozen evidence, expectedFailureRecordsPath, six production coding targets, four-task execution plan, and scope exclusions are complete and mutually consistent.
- WP-P2/WP-P3 remain untouched: no SP-03/SP-04/SP-05 physical entrypoint exists, future mounts remain deferred metadata, and the correction commit contains no intent graph change.
- Technical verdict: the handoff is ready for an independent delegated coding-gate review. This audit does not approve or dispatch Coding/Repair.
- Neo4j synchronization blocker remains exactly `neo4jUri is required for start`; no synchronization evidence is claimed.

### WP-P1 final delivery audit — FAIL

- Audited CodingAndReparing session `coding-semprod-wp-p1-3ef5346`, commit `3ef53461a9e24b8984ac1a769468b9cbbe91dd0e` (`Implement WP-P1 durable semantic persistence and backfill.`), after ImplementationDesign session `implementation-semprod-wp-p1-20260726T2055+08` reported PASS without an additional audit commit.
- Positive evidence independently reproduced: both approved mounted entrypoints exit 0; all four WP-P1 critical guards exit 0; `argo.runArchitectureTests` reports `40 total / 40 passed / 0 failed / 0 missing acceptanceCriteria`; `design/KG/test-failure-records.json` is `[]`; both stage handoffs and `design/KG/SystemArchitecture.json` validate with exitCode 0.
- Coding scope is clean: the coding commit changes only the six authorized implementation targets plus runner-owned `design/KG/test-failure-records.json`; it does not change frozen tests/contracts/handoffs, `design/KG/SystemArchitecture.json`, `liveEmbeddingNeo4jBoundary.js`, or future WP-P2/WP-P3 assets. SP-03/SP-04/SP-05 remain unmounted future-wave metadata and no future entrypoint exists.
- Canonical authority and cleanup isolation are preserved in code: production records use separate `ArgoProductionSemanticRecord`/`ArgoProductionSemanticCheckpoint` labels, expose no cleanup API, reject `runId`, and cannot be selected by frozen live-E2E cleanup scoped to `ArgoLiveEmbeddingEvidence { runId }`.
- Blocking IntentionDesign defect: the 21 runner-owned `not_delivered` statuses are not stale and cannot be treated as successful delivery merely because the fresh run reports zero transitions. The tested elements `semprod-backfill-control`, `grag-index-lifecycle`, `grag-embedding-generation`, and `grag-embedding-provider-adapter` form one dependency strongly connected component through `semprod-rel-backfill-lifecycle`, `grag-rel-lifecycle-generation`, `grag-rel-adapter-generation`, and `semprod-rel-adapter-backfill`. Under the runner's documented least fixed-point rule, no member can become delivered; `semprod-persistent-projection-requirement` and downstream elements therefore remain not_delivered. No manual deliveryStatus mutation occurred.
- Required IntentionDesign correction: use canonical MCP preview/apply to remove the delivery dependency cycle without changing approved SP-01/SP-02 semantics. The narrow recommended correction is to replace `semprod-rel-backfill-lifecycle` as a dependency-bearing `Triggering` edge with a non-triggering `Association` that preserves the explicit interaction/rationale but does not imply automatic backfill or lifecycle delivery precedence. Validate the graph and handoff, rerun the full runner, and require the two WP-P1 owners and applicable approved upstream boundaries to become runner-owned `delivered`.
- Blocking production composition defect missed by the frozen acceptance design: the actual default call `callTool("backfillSystemArchitectureSemanticProjection", { explicitOptIn: true })` exits 1 with `productionGraphRagRuntime.runSemanticBackfill is required`. JSON-RPC `tools/call` invokes `callTool` without dependencies, while the passing SP-01 Harness injects `productionGraphRagRuntime`; therefore the shipped operator is advertised but cannot run through the production MCP server path.
- Required ImplementationDesign correction: in the same WP-P1 session, strengthen the frozen Harness/entrypoint/guard and coding handoff so the default non-injected JSON-RPC/callTool path must construct the production runtime composition root and reach release-gate behavior; injected runtime evidence alone is insufficient.
- Required CodingAndReparing correction after the design correction is approved: wire the MCP server's default `tools/call` path to a production Graph RAG runtime composed from canonical source, same-version structural projection evidence, qualified embedding provider, external Neo4j configuration/driver, canonical-authority policy, production projection/checkpoint stores, and bounded backfill. With absent environment configuration it must fail at the established external startup boundary, not at missing runtime injection.
- The additional legacy `tests/architecture/production-graph-rag/coding-scope-authorization.guard.js` failure is non-blocking for WP-P1: it requires the exact phrase `runner-owned deliveryStatus by hand`, is not in WP-P1 critical/supporting sets, and predates Coding. Its maintenance owner is ImplementationDesign for the legacy production-graph slice; it should accept semantically equivalent manual-edit prohibition or validate its own handoff scope.
- Final delivery verdict: FAIL. WP-P1 intent is not accepted until both blockers are corrected and independently re-audited.
- Neo4j synchronization remains unverified due the exact environment blocker `neo4jUri is required for start`; no synchronization evidence is claimed or fabricated.

### WP-P1 dependency-cycle intent correction

- Viewpoint frame remains unchanged: Requirements Realization Viewpoint preserves SP-01 requirement-to-realization trace; Implementation and Migration Viewpoint preserves WP-P1 work-package sequencing and isolation. Existing view bindings and membership remain valid; no WP-P2/WP-P3 view or semantic was changed.
- Before semantics: `semprod-rel-backfill-lifecycle`, `Triggering`, `semprod-backfill-control` -> `grag-index-lifecycle`, named `Full backfill triggers index lifecycle`; as a delivery dependency this completed the tested cycle `backfill -> adapter -> embedding generation -> index lifecycle -> backfill`.
- Direct `updateRelationship` preview failed without writing because relationship type is immutable. The canonical retry used one atomic remove/re-add under the same relationship id, endpoints, and `semprod-wp1-persistence-backfill` view membership.
- Successful preview: remove `semprod-rel-backfill-lifecycle`, then add the same id as `Association`, named `Full backfill coordinates with index lifecycle`, with non-triggering coordination semantics. `written=false`; touched relationship id exactly `semprod-rel-backfill-lifecycle`; counts remained `61 elements / 79 relationships / 31 views`; errors empty.
- Successful apply wrote the same two mutations. After semantics: a non-triggering Association preserves bounded generation/persistence coordination and final-only three-channel alignment while explicitly creating no automatic activation, fake canonical mutation, or delivery precedence. Relationship identity, endpoints, viewpoint-bound view membership, approved SP-01/SP-02 boundaries, and five-element handoff scope are unchanged.
- Post-write Neo4j synchronization failed exactly `neo4jUri is required for start`; canonical JSON was written and no synchronization evidence is claimed. Automatic embedding lifecycle separately reported `W31_TOUCHED_RECORD_EXTRACTION_INCOMPLETE`/`SEMANTIC_INDEX_NOT_ALIGNED`; it is not substituted for the explicit production backfill or Neo4j synchronization evidence.
- `argo.validateSystemArchitecture` passed. `argo.validateStageHandoff` passed independently for both `intent-to-implementation` and `implementation-to-coding`.
- Fresh `argo.runArchitectureTests`: `40 total / 40 passed / 0 failed / 0 missing acceptanceCriteria`; failure records remain `[]`. The runner made exactly 21 truthful `not_delivered -> delivered` transitions, clearing the complete prior cascade including both WP-P1 owners, lifecycle, adapter, generation, and all downstream dependents. No `not_delivered` attribute remains.
- Independent dependency recomputation finds zero tested strongly connected components. No deliveryStatus was manually edited; all 21 changes were produced and persisted by the runner.
- IntentionDesign blocker is resolved. Final acceptance remains blocked only by the default MCP composition gap: route to the same ImplementationDesign session `implementation-semprod-wp-p1-20260726T2055+08` to freeze a non-injected default JSON-RPC/callTool production-composition assertion, then route the resulting coding correction to CodingAndReparing.

### WP-P1 final corrected delivery audit — PASS

- Audited the intent-cycle correction `4e01094b56429991b32b0826968da0bea9f93b0e`, ImplementationDesign correction `82dc26503f5a2a7a2846c97402f25ff42654b05a`, and CodingAndReparing correction `4dd9e75632d4f75215cb367552062b003253ab25` in the same persistent sessions: IntentDesign `intent-semprod-wp-p1-20260726T2039+08`, ImplementationDesign `implementation-semprod-wp-p1-20260726T2055+08`, and CodingAndReparing `coding-semprod-wp-p1-3ef5346`.
- Both prior blockers are closed. `semprod-rel-backfill-lifecycle` remains a non-triggering Association, the final graph has no `not_delivered` element, and all five handoff elements plus `grag-embedding-generation` carry runner-owned `deliveryStatus=delivered`.
- The shipped non-injected process path was independently invoked as JSON-RPC `tools/call` for `backfillSystemArchitectureSemanticProjection` with all approved external credential variables removed. The process exited 0 with an MCP error result containing `EXTERNAL_CREDENTIALS_REQUIRED`, with the stack reaching `resolveDefaultSemanticConfiguration`, `createDefaultProductionSemanticRuntime`, `callTool`, and `handleRequest`; it did not report `productionGraphRagRuntime.runSemanticBackfill is required`. SP-01 also proves the canonical JSON bytes remain unchanged on this path.
- Direct SP-01 and SP-02 replays exited 0. SP-01 proves explicit opt-in, same-version structural completion, external credentials, provider qualification, bounded batches, durable checkpoints, isolated failures, no replay on resume, idempotent rerun, complete three-channel metadata, no fake canonical mutation, and final-only alignment. SP-02 proves restart survival, stable identity, changed-record upsert, tombstone deletion, exact no-cleanup API, runId rejection before persistence, live-E2E cleanup isolation, canonical JSON authority, and subordinate Neo4j projection/index.
- All four frozen `production-semantic-persistence` critical guards exited 0. The supporting typed MCP contract entrypoint exited 0. Independent `argo.runArchitectureTests` reported `40 total / 40 passed / 0 failed or missing / 0 missing acceptanceCriteria`; SP-01 and SP-02 both passed and `design/KG/test-failure-records.json` remains `[]`. This stable rerun produced no delivery transition because the prior runner-owned 21 `not_delivered -> delivered` transitions were already committed.
- `argo.validateSystemArchitecture` passed. `argo.validateStageHandoff` passed independently for both `intent-to-implementation` and `implementation-to-coding`.
- Commit-scope audit passed. Removing only `deliveryStatus` attributes makes the graphs at `4e01094`, `82dc265`, and `4dd9e75` byte-equivalent as JSON, proving the ImplementationDesign and Coding corrections did not alter approved intent semantics. Coding commit `4dd9e75` changes only `.argo/scripts/systemarchitecture-mcp-server.js` plus runner-owned graph/failure records; frozen tests, Harness, contracts, handoffs, production runtime, semantic-persistence modules, and live-E2E cleanup remain unchanged.
- WP-P2/WP-P3 remain excluded and unstarted. SP-03/SP-04/SP-05 have no mounted testcase objects or physical entrypoints; their proposed control/observation semantics remain only in `futureAcceptanceBoundary.SP-03/04/05`, with future mount ownership assigned to WP-P2 IntentionDesign for SP-03/SP-04 and WP-P3 IntentionDesign for SP-05.
- The legacy production-graph exact-wording guard remains outside the WP-P1 critical/supporting set and is non-gating maintenance scope. Live Neo4j synchronization remains environment-unverified with exact blocker `neo4jUri is required for start`; no synchronization evidence is inferred or fabricated.
- Final verdict: PASS. The approved WP-P1 intent is delivered; no WP-P1 correction remains open.

### Exact approval question

Do you approve both complete WP-P1 mounted acceptance boundaries—`ExplicitAcceptanceTestcase-SP-01-FullBackfill` and `ExplicitAcceptanceTestcase-SP-02-PersistentProjection`—and globally approve the WP-P1 intent-to-implementation handoff scope (`semprod-backfill-control`, `semprod-persistent-projection-requirement`, `grag-semantic-index`, `grag-index-lifecycle`, and `grag-embedding-provider-adapter`) so IntentDesign may record approval, replace the stale unrelated intent handoff with the WP-P1 handoff, validate it, and create the required IntentDesign stage commit? Recommended answer: approve, because the boundaries now cover the requested durable production persistence, full three-channel backfill, test-only cleanup isolation, canonical authority, external credentials, and all required failure/recovery semantics while excluding WP-P2 and WP-P3.

## 2026-07-26 — Approved Neo4jUri And EmbeddingCredential Handoff

- Selected viewpoint: Requirements Realization Viewpoint.
- Stakeholder concern: runtime owners, ICT architects, security owners, and acceptors need approved external configuration names to be the only source for internal startup fields before Neo4j connectivity, provider calls, or index side effects.
- Modeling purpose: designing, deciding, auditing, and intent-to-implementation handoff preparation.
- Affected view binding: `grag-native-embedding-release-requirements` remains a Requirements Realization Viewpoint instance because it already traces production runtime, credential constraint, embedding qualification, canonical Neo4j names, live provider evidence, and canonical authority to release requirements before index delivery.
- Human approval evidence: the human partner explicitly approved the existing-test boundary extensions and asked to fix all issues, including the reported `embeddingCredential is required for start` blocker and the MCP post-write `neo4jUri is required for start` sync setup blocker.
- Secret handling: Intent Design did not read, create, output, migrate, copy, or expose any `.argo/.env` secret value.

### Coverage matrix

- `grag-production-runtime` - `functionalPoint.TS-01` -> `ExplicitAcceptanceTestcase-TS-01`; `functionalPoint.TS-01-harness-env-loading` -> existing `ExplicitAcceptanceTestcase-TS-01`, now covering exact `.argo/.env` loading and start-time `neo4jUri` plus `embeddingCredential` validation.
- `grag-credential-boundary` - `functionalPoint.TS-07` -> `ExplicitAcceptanceTestcase-TS-07`; `functionalPoint.TS-07-provider-secret-isolation` -> existing `ExplicitAcceptanceTestcase-TS-07-Provider-Secret-Isolation`; `functionalPoint.TS-07-canonical-neo4j-env-names` -> existing `ExplicitAcceptanceTestcase-TS-07` and `ExplicitAcceptanceTestcase-TS-07-Provider-Secret-Isolation`.

### Acceptance boundaries

- Existing `ExplicitAcceptanceTestcase-TS-01` must prove harness initialization loads only the exact repository-relative `.argo/.env` when direct process values are absent, preserves direct-process precedence and credential conflict behavior, validates `neo4jUri` and `embeddingCredential` before startup proceeds, fails closed when either remains unresolved, and emits no secret-bearing diagnostics.
- Existing `ExplicitAcceptanceTestcase-TS-07` must prove absent, conflicting, unsafe, legacy-alias-only, canonical-Neo4j-plus-unresolved-`neo4jUri`, and canonical-Neo4j-plus-unresolved-`embeddingCredential` states fail closed before network or index side effects, without hardcoded, default, Cypher, runtime-field, or legacy-alias fallback.
- Existing `ExplicitAcceptanceTestcase-TS-07-Provider-Secret-Isolation` must prove `ARGO_NEO4J_DATABASE_URL` is the only approved source for in-process `neo4jUri`, `QWEN_KEY` is the only approved source for in-process `embeddingCredential`, and neither runtime field may be sourced from separate keys, literals, defaults, command-line values, graph/Cypher data, or alternate files.

### Dependency-scope decisions

- Handoff scope is exactly `grag-production-runtime` and `grag-credential-boundary` with `grag-rel-credentials-runtime`.
- No new testcase identity was added; the approved boundary changes extend TS-01, TS-07, and TS-07-Provider-Secret-Isolation.
- Canonical Neo4j environment-name behavior is preserved: `ARGO_NEO4J_DATABASE_URL`, `ARGO_NEO4J_DATABASE_USERNAME`, and `ARGO_NEO4J_DATABASE_PASSWORD` remain the only accepted Neo4j names, and legacy aliases remain unsupported.

### Validation and open risks

- `argo.previewSystemArchitectureMutation`: passed for two element updates and one Requirements Realization View update; element count 47, relationship count 59, and view count 27 unchanged.
- `argo.applySystemArchitectureMutation`: canonical graph write passed for the same two elements and one view; element count 47, relationship count 59, and view count 27 unchanged. The post-write Neo4j sync still reported `neo4jUri is required for start`, which is now represented as a downstream acceptance boundary rather than an unresolved intent adequacy blocker.
- `argo.validateSystemArchitecture`: passed with exitCode 0 and stdout `SystemArchitecture validation passed for: design/KG/SystemArchitecture.json`.
- `.argo/temp/IntentToImplementationHandoff.json` was emitted for `grag-production-runtime`, `grag-credential-boundary`, and `grag-rel-credentials-runtime`.
- `argo.validateStageHandoff(stage="intent-to-implementation")`: passed with exitCode 0 and stdout `Stage handoff validation passed for: intent-to-implementation`.
- Open business questions and intent adequacy blockers: none.

## 2026-07-26 — Embedding Credential Startup Boundary

- Selected viewpoint: Requirements Realization Viewpoint.
- Stakeholder concern: runtime owners, ICT architects, security owners, and acceptors need startup configuration to prove that the approved provider secret source resolves the runtime `embeddingCredential` after canonical Neo4j configuration succeeds and before any database, provider, or index side effects.
- Modeling purpose: designing, deciding, auditing, and handoff preparation.
- Affected view binding: `grag-native-embedding-release-requirements` remains a Requirements Realization Viewpoint instance because it already traces production runtime, credential constraint, embedding qualification, canonical Neo4j names, live provider evidence, and canonical authority to release requirements before index delivery.
- Root-cause boundary: the prior `neo4jUri` harness blocker is treated as already repaired for the reported harness path; this follow-up boundary isolates the unresolved `embeddingCredential` field and requires evidence that it is materialized only from approved `QWEN_KEY` provenance before startup proceeds.
- Secret handling: Intent Design did not read, create, output, migrate, copy, or expose any `.argo/.env` secret value.

### Coverage matrix

- `grag-production-runtime` - `functionalPoint.TS-01` -> `ExplicitAcceptanceTestcase-TS-01`; `functionalPoint.TS-01-harness-env-loading` -> existing `ExplicitAcceptanceTestcase-TS-01`, now including start-time `embeddingCredential` validation after `.argo/.env` loading and after canonical Neo4j resolution.
- `grag-credential-boundary` - `functionalPoint.TS-07` -> `ExplicitAcceptanceTestcase-TS-07`; `functionalPoint.TS-07-provider-secret-isolation` -> existing `ExplicitAcceptanceTestcase-TS-07-Provider-Secret-Isolation`; `functionalPoint.TS-07-canonical-neo4j-env-names` -> existing `ExplicitAcceptanceTestcase-TS-07` and `ExplicitAcceptanceTestcase-TS-07-Provider-Secret-Isolation`.

### Acceptance boundaries needing approval

- Existing `ExplicitAcceptanceTestcase-TS-01` must prove `node .argo/scripts/ensureArgoHarnessEnvironment.js` loads only the exact repository-relative `.argo/.env` when direct process values are absent, preserves direct-process precedence and credential conflict behavior, resolves the provider secret needed for `embeddingCredential` before start-time validation, and fails closed with no secret-bearing diagnostics when canonical Neo4j configuration is present but `embeddingCredential` remains unresolved.
- Existing `ExplicitAcceptanceTestcase-TS-07` must prove absent, conflicting, unsafe, legacy-alias-only, and canonical-Neo4j-plus-unresolved-`embeddingCredential` states fail closed before network or index side effects, without hardcoded, default, Cypher, runtime-field, or legacy-alias secret fallback.
- Existing `ExplicitAcceptanceTestcase-TS-07-Provider-Secret-Isolation` must prove `QWEN_KEY` is the only approved source for materializing in-process `embeddingCredential`; separately supplied `embeddingCredential` keys, unresolved provider credentials, unsafe `.argo/.env` metadata, conflicts, legacy aliases, and all unapproved sources fail closed before provider, database, or index side effects and leak no secret material to observable channels.

### Dependency-scope decisions

- Handoff scope, if approved later, should remain exactly `grag-production-runtime` and `grag-credential-boundary` with `grag-rel-credentials-runtime`.
- No new testcase identity was added; the new acceptance expectations extend existing TS-01, TS-07, and TS-07-Provider-Secret-Isolation boundaries as requested.
- The accepted canonical Neo4j environment-name behavior is preserved: `ARGO_NEO4J_DATABASE_URL`, `ARGO_NEO4J_DATABASE_USERNAME`, and `ARGO_NEO4J_DATABASE_PASSWORD` remain the only accepted Neo4j names, and legacy aliases remain unsupported.

### Validation and blockers

- `argo.previewSystemArchitectureMutation`: passed for two element updates and one Requirements Realization View update; element count 47, relationship count 59, and view count 27 unchanged.
- `argo.applySystemArchitectureMutation`: canonical graph write passed for the same two elements and one view; element count 47, relationship count 59, and view count 27 unchanged. The tool's post-write Neo4j sync reported `neo4jUri is required for start`, so projection sync should be treated as a separate setup blocker from the reported harness path until verified.
- `argo.validateSystemArchitecture`: passed with exitCode 0 and stdout `SystemArchitecture validation passed for: design/KG/SystemArchitecture.json`.
- Intent-to-implementation handoff was not emitted because the modified mounted testcase boundaries are explicitly marked `pendingHumanApproval` for the `embeddingCredential` extension, and the overall handoff does not yet have global human approval.

## 2026-07-26 — Harness Environment And Canonical Neo4j Names

- Selected viewpoint: Requirements Realization Viewpoint.
- Stakeholder concern: runtime owners, ICT architects, requirements managers, and acceptors need harness environment initialization and Neo4j projection configuration names to be explicit, decidable release requirements.
- Modeling purpose: designing, deciding, and intent-to-implementation handoff preparation.
- Affected view binding: `grag-native-embedding-release-requirements` remains a Requirements Realization Viewpoint instance because it traces runtime and credential constraints to the existing Node.js/Neo4j realization path, now including canonical `.argo/.env` harness loading and rejection of legacy Neo4j aliases.
- Human approval evidence: the orchestrator user requirement/defect report explicitly required `node .argo/scripts/ensureArgoHarnessEnvironment.js` to load `.argo/.env` into `process.env` and required the approved `ARGO_NEO4J_DATABASE_*` naming to replace legacy `ARGO_NEO4J_*` projection aliases. The human partner then constrained approval with: prefer extending existing testcases; do not add new testcases unless extension is impossible. The graph was repaired so the new functional points extend existing TS-01, TS-07, and TS-07-Provider-Secret-Isolation boundaries instead of adding new ExplicitAcceptanceTestcase identities.
- Secret handling: Intent Design did not read, create, output, migrate, or copy any `.argo/.env` secret value.

### Coverage matrix

- `grag-production-runtime` — `functionalPoint.TS-01` -> `ExplicitAcceptanceTestcase-TS-01`; `functionalPoint.TS-01-harness-env-loading` -> existing `ExplicitAcceptanceTestcase-TS-01`.
- `grag-credential-boundary` — `functionalPoint.TS-07` -> `ExplicitAcceptanceTestcase-TS-07`; `functionalPoint.TS-07-provider-secret-isolation` -> `ExplicitAcceptanceTestcase-TS-07-Provider-Secret-Isolation`; `functionalPoint.TS-07-canonical-neo4j-env-names` -> existing `ExplicitAcceptanceTestcase-TS-07` and existing `ExplicitAcceptanceTestcase-TS-07-Provider-Secret-Isolation`.

### Acceptance boundaries

- Existing `ExplicitAcceptanceTestcase-TS-01` now also requires `node .argo/scripts/ensureArgoHarnessEnvironment.js` to initialize `process.env` from the exact repository-relative `.argo/.env` before projection/runtime checks when direct process values are absent, ignore root/alternate `.env` files, preserve process precedence and conflict behavior delegated to the credential boundary, and avoid secret-bearing diagnostics.
- Existing `ExplicitAcceptanceTestcase-TS-07` and `ExplicitAcceptanceTestcase-TS-07-Provider-Secret-Isolation` now also require `ARGO_NEO4J_DATABASE_URL`, `ARGO_NEO4J_DATABASE_USERNAME`, and `ARGO_NEO4J_DATABASE_PASSWORD` to be the accepted Neo4j configuration names from approved process or exact `.argo/.env` sources; legacy `ARGO_NEO4J_URI`, `ARGO_NEO4J_USERNAME`, and `ARGO_NEO4J_PASSWORD` must not satisfy missing canonical configuration, override canonical values, or reach connection/projection/write side effects.

### Dependency-scope decisions

- Handoff scope is exactly `grag-production-runtime` and `grag-credential-boundary`.
- `grag-rel-credentials-runtime` remains the in-scope realization relationship. Existing native retrieval, canonical authority, embedding qualification, provider adapter, index lifecycle, W3.1 mutation-vector lifecycle, and downstream seed/closure/quality elements remain contextual and outside this handoff.
- Existing runner-owned `deliveryStatus` attributes were preserved as runner data and not fabricated or manually reinterpreted as new pass evidence.

### Validation and open risks

- `argo.previewSystemArchitectureMutation`: passed for two element updates and one Requirements Realization View update; element count 47, relationship count 59, and view count 27 unchanged.
- `argo.applySystemArchitectureMutation`: passed; Neo4j synchronized to 47 elements, 59 relationships, and 27 views.
- `argo.validateSystemArchitecture`: passed.
- Approval-constraint repair: a second `argo.previewSystemArchitectureMutation` and `argo.applySystemArchitectureMutation` passed for two element updates, removing the two new ExplicitAcceptanceTestcase identities from this scope while preserving same-element coverage through existing mounted testcases.
- Downstream ImplementationDesign should extend existing physical entrypoints where feasible: `tests/explicit/entries/runProductionGraphRagRuntime.js`, `tests/explicit/entries/runExternalCredentialBoundary.js`, and `tests/explicit/entries/runLiveEmbeddingProviderSecretIsolation.js`.
- Open business questions and adequacy blockers: none.

## 2026-07-26 — WP-P2 Default Vector Retrieval and Readiness Handoff

- Persistent stage/session ID: `intent-semprod-wp-p2-20260726T2330+08`.
- Scope: only `semprod-wp-default-retrieval` (WP-P2). WP-P1 is an accepted delivered prerequisite. WP-P3, its operator CLI/documentation/release journey, and SP-05 remain unstarted and excluded.
- Selected viewpoints: Requirements Realization Viewpoint and Implementation and Migration Viewpoint.
- Stakeholder concern: requirements owners, delivery owners, ICT architects, runtime operators, and acceptors need the shipped default MCP semantic path to use qualified external-credential embedding and persistent Neo4j Vector Index retrieval, and to fail closed unless all three semantic channels are canonically aligned, without weakening full-snapshot compatibility.
- Primary modeling purposes: `semprod-requirements-realization` uses only `designing`; `semprod-wp2-default-retrieval-readiness` and `semprod-wp2-vector-seed-closure` each use only `deciding`.
- View binding: `semprod-requirements-realization` is a Requirements Realization Viewpoint instance for SP-03/SP-04 requirement-to-realization design. The layered views `semprod-wp2-default-retrieval-readiness` and `semprod-wp2-vector-seed-closure` are Implementation and Migration Viewpoint instances for deciding the WP-P2 public-boundary and lower-pipeline dependencies; each remains at or below seven elements.
- Human approval evidence: the parent authorization explicitly required mounting and formalizing `ExplicitAcceptanceTestcase-SP-03-DefaultVectorRetrieval` and `ExplicitAcceptanceTestcase-SP-04-FailClosedReadiness`, and required the seven-element WP-P2 intent-to-implementation handoff with no unresolved adequacy blocker. Per-testcase approval is recorded in `acceptanceApproval.SP-03` and `acceptanceApproval.SP-04`; global handoff approval is recorded in the schema-compliant handoff notes because the repository handoff schema rejects an `approvedByHuman` property.

### Intent mutation and acceptance boundaries

- Added `functionalPoint.SP-03-default-vector-retrieval` and mounted `ExplicitAcceptanceTestcase-SP-03-DefaultVectorRetrieval` under `semprod-default-vector-retrieval`, anchored to `tests/explicit/entries/runDefaultMcpNeo4jVectorRetrieval.js`.
- SP-03 controls the shipped default uninjected MCP path and observes qualified query embedding, persistent Neo4j Vector Index retrieval, independent Element/ArchitectureRelationship/View threshold-all channels, valid zero results, deterministic purpose/ArchiMate closure, endpoint/View/provenance completion, canonical authority/version checks, graph-tidy bypass, external credentials, and prohibition of synthetic empty seeds or silent snapshot fallback.
- Added `functionalPoint.SP-04-fail-closed-readiness` and mounted `ExplicitAcceptanceTestcase-SP-04-FailClosedReadiness` under `semprod-readiness-requirement`, anchored to `tests/explicit/entries/runProductionSemanticReadinessGate.js`.
- SP-04 controls structural-only SemanticIndexPending, partial, stale, failed, unknown/mismatched, aligned, no-argument, and graph-tidy scenarios. Every non-aligned pure semantic request must reject before retrieval with actionable state/version/channel evidence and `fullSnapshotFallback:false`; only complete three-channel canonical/content/index alignment enables semantic retrieval.
- Added `semprod-rel-wp2-default`, `semprod-rel-default-query-service`, `semprod-rel-default-seeds`, and `semprod-rel-default-readiness` so WP-P2 realization and the default MCP-to-seed/readiness directions are graph-traversable. The audit correction adds `semprod-rel-default-credentials`, a `Realization` from `semprod-default-vector-retrieval` to existing constraint `grag-credential-boundary`, making external-credentials-only graph-traversable without adding the constraint to implementation scope. Existing `grag-rel-mcp-interface-service`, `grag-rel-native-seeds`, `grag-rel-seeds-closure`, `grag-rel-native-index`, and `semprod-rel-default-index` preserve the remaining pipeline semantics.
- `semprod-operator-journey-process.testcases` remains empty. `futureAcceptanceBoundary.SP-05` and `futureMountOwner.SP-05` remain unchanged, including the uncreated suggested `tests/explicit/entries/runNewProjectSemanticOperatorJourney.js`; WP-P3 was not started.
- No `deliveryStatus` attribute was manually created, changed, removed, or inferred.

### Dependency-subgraph coverage matrix

- `semprod-default-vector-retrieval` (focus/new implementation): `functionalPoint.SP-03-default-vector-retrieval` -> mounted and human-approved `ExplicitAcceptanceTestcase-SP-03-DefaultVectorRetrieval`.
- `semprod-readiness-requirement` (focus/new implementation): `functionalPoint.SP-04-fail-closed-readiness` -> mounted and human-approved `ExplicitAcceptanceTestcase-SP-04-FailClosedReadiness`.
- `grag-query-service` (delivered reused boundary): `functionalPoint.DT-01-compatible-reading-boundary` -> `ExplicitAcceptanceTestcase-DT-01`; `functionalPoint.DT-02-no-argument-full-snapshot` -> `ExplicitAcceptanceTestcase-DT-02`; recorded W1 pass evidence and runner-owned `deliveryStatus=delivered`.
- `grag-mcp-interface` (delivered reused boundary): `functionalPoint.TS-00` -> `ExplicitAcceptanceTestcase-TS-00`; recorded W1 pass evidence and runner-owned `deliveryStatus=delivered`.
- `grag-native-retrieval-service` (delivered reused boundary): `functionalPoint.TS-01-native` -> `ExplicitAcceptanceTestcase-TS-01-Native`; recorded W2/W3.1 pass evidence and runner-owned `deliveryStatus=delivered`.
- `grag-seed-retrieval` (delivered reused boundary): `functionalPoint.DT-04-three-channel-seed-discovery` -> `ExplicitAcceptanceTestcase-DT-04`; `functionalPoint.DT-05-threshold-all-correctness` -> `ExplicitAcceptanceTestcase-DT-05`; recorded W4 pass evidence and runner-owned `deliveryStatus=delivered`.
- `grag-purpose-closure` (delivered reused boundary): `functionalPoint.DT-06-deterministic-mandatory-closure` -> `ExplicitAcceptanceTestcase-DT-06`; `functionalPoint.DT-07-purpose-category-dispatch` -> `ExplicitAcceptanceTestcase-DT-07`; recorded W5 pass evidence and runner-owned `deliveryStatus=delivered`.
- `grag-semantic-index` is the delivered upstream data boundary: `functionalPoint.DT-16-versioned-vector-baseline` -> `ExplicitAcceptanceTestcase-DT-16-SemanticIndex`; recorded W3/W3.1 pass evidence and runner-owned `deliveryStatus=delivered`.
- Evidence-backed exclusion: `semprod-wp-persistence-backfill` is sequencing context, not a WP-P2 implementation target. Parent evidence accepts WP-P1 at 40/40 and its five owned boundaries are runner-delivered; this handoff neither reopens nor modifies WP-P1 production persistence/backfill.
- Evidence-backed exclusion: downstream endpoint/View/provenance elements are reused through the already delivered purpose/structural closure contracts and are observable inside SP-03, but no new implementation scope is assigned outside the seven authorized intent elements.
- Evidence-backed exclusion: `semprod-wp-operator-release` and `semprod-operator-journey-process` are WP-P3 downstream scope; SP-05 stays unmounted.

### Mutation, validation, and replacement rationale

- First preview failed without writing because the view patch used unsupported `element_ids`/`relationship_ids`, relationship endpoints were missing from affected views, and a proposed ten-element view exceeded the seven-element limit. The corrected layered mutation used schema-approved `included_elements`/`included_relationships`, split delivery concerns across two bounded views, and passed.
- Successful `argo.previewSystemArchitectureMutation`: 2 element updates, 2 new views, 4 new relationships, and 1 view update; counts `61 elements / 79 relationships / 31 views` -> `61 / 83 / 33`; `written=false`; errors empty.
- `argo.applySystemArchitectureMutation` passed and wrote the same mutation; counts changed to `61 / 83 / 33`; errors empty.
- Canonical graph validation passed with exitCode 0 and stdout `SystemArchitecture validation passed for: design/KG/SystemArchitecture.json`.
- Post-write structural Neo4j synchronization failed exactly `neo4jUri is required for start`. This is environment evidence, not a production composition verdict. No structural-sync success is claimed or fabricated, and fail-closed behavior was not weakened.
- The mutation response separately reported an automatic embedding lifecycle `alignmentState=Aligned` for its touched records and a failure matrix with pure semantic rejection plus `fullSnapshotFallback:false`; this does not substitute for the failed full structural Neo4j synchronization or for future SP-03/SP-04 implementation acceptance.
- Replacement rationale: `.argo/temp/IntentToImplementationHandoff.json` previously held the accepted WP-P1 five-element handoff. WP-P2 is the explicitly authorized next sequential package after WP-P1 delivery, so the temp slot is intentionally superseded with the seven-element WP-P2 handoff while preserving the WP-P1 governance record here and in its accepted commits. The replacement does not revise or invalidate WP-P1.
- `.argo/temp/IntentToImplementationHandoff.json` now contains exactly the seven authorized WP-P2 intent elements, twelve relevant relationship ids, the full coverage proof, explicit WP-P1 replacement rationale, global approval note, and `openQuestions: []`.
- `argo.validateStageHandoff(stage="intent-to-implementation")` passed with exitCode 0 and stdout `Stage handoff validation passed for: intent-to-implementation`.
- Final `argo.validateSystemArchitecture` passed with exitCode 0 and stdout `SystemArchitecture validation passed for: design/KG/SystemArchitecture.json`.
- Checklist self-audit: A1-A5 satisfied by authoritative MCP persistence, complete functional points/relationships, and three viewpoint-bound views; B1-B3 satisfied by same-element mounted SP-03/SP-04 cases and explicit approval attributes; C1-C2 satisfied by the seven-element matrix, delivered reused boundaries, delivered semantic-index prerequisite, and evidence-backed WP-P1/WP-P3 exclusions; D1-D8 satisfied with requirement sources, complete observability, per-case approval, schema-compliant global approval, and no open questions; E1-E3 satisfied by the complete validated handoff and approval note; F1 is this record and F2 is completed by the following stage commit.
- Mounted-boundary audit correction: the first correction preview failed without writing because removing `semprod-bootstrap-capability` and `semprod-rel-capability-goal` from their only view would orphan them. The corrected preview preserved both in `semprod-requirements-realization`, passed with 2 parent-element updates, 3 view updates, and 1 new relationship, and changed counts from `61/83/33` to `61/84/33`.
- Parent navigation correction: `1210.subdiagram_views` now registers `semprod-requirements-realization`; `1211.subdiagram_views` now registers `semprod-wp2-default-retrieval-readiness` and `semprod-wp2-vector-seed-closure`, matching all three view parent IDs.
- Purpose correction: each affected view now declares exactly one primary purpose in the required description binding—`designing` for the Requirements Realization view and `deciding` for both Implementation and Migration views.
- Credential correction: `semprod-rel-default-credentials` appears in all three corrected views and in the intent handoff relationship IDs. `grag-credential-boundary` remains an existing delivered-context constraint and does not broaden the seven implementation targets.
- Correction apply passed with errors empty. Structural Neo4j synchronization again failed exactly `neo4jUri is required for start`; no synchronization success is claimed. Automatic touched-record embedding lifecycle evidence remains separate and is not substituted for structural sync or SP-03/SP-04 acceptance.
- Post-correction `argo.validateSystemArchitecture` passed with exitCode 0, and `argo.validateStageHandoff(stage="intent-to-implementation")` passed with exitCode 0.
- Correction checklist self-audit: A1-A5 remain satisfied with parent navigation now consistent, one primary purpose per affected view, and credential realization traceability; B1-B3 and C1-C2 are unchanged; D1-D8 and E1-E3 remain satisfied with twelve relationship ids and no open questions; F1 is this corrected record and F2 requires the new non-amended correction commit.
- No runner-owned `deliveryStatus` attribute was manually created, changed, removed, or inferred by this correction.
- Open business questions and adequacy blockers: none.

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

## 2026-07-26 — W7 Phase 1 Business Acceptance Gate

- Selected viewpoints: Application Usage Viewpoint for business-observable retrieval acceptance context, and Implementation and Migration Viewpoint for W7 sequencing, final delivery gating, and quality/capacity acceptance.
- Stakeholder concern: acceptors, requirements owners, implementation designers, and downstream orchestrators need business benchmark evidence to prove recall and closure before whole Graph RAG delivery is allowed.
- Modeling purpose: deciding and intent-to-implementation handoff preparation.
- Affected view bindings: `grag-quality-capacity` remains an Implementation and Migration Viewpoint instance because it defines W7 business release evidence and keeps DT-19 capacity choices out of Phase 1 correctness; `grag-seven-wave-gates` remains an Implementation and Migration Viewpoint instance because it traces prerequisite waves and W7 quality acceptance to final delivery blocking semantics.
- Human approval evidence: the orchestrating W7 request explicitly approved Phase 1 business acceptance, the release gates of key seed recall 100%, closure correctness 100%, unrelated-query zero forced hits, recorded precision, acceptance mapping DT-00/DT-18/TS-08, handoff production, and an IntentDesign stage commit. The handoff schema does not permit an `approvedByHuman` field, so global approval is recorded in handoff notes and schema-compliant `acceptanceApproval.*` element attributes.
- Delivery-status guardrail: existing runner-owned `deliveryStatus` values were preserved and not fabricated by Intent Design.

### Coverage matrix

- `grag-quality-gate` — `functionalPoint.DT-18-phase1-business-quality-gate` -> `ExplicitAcceptanceTestcase-DT-18`.
- `grag-seven-wave-delivery` — `functionalPoint.TS-08` -> `ExplicitAcceptanceTestcase-TS-08`.

### Acceptance boundaries

- DT-18 requires the approved five-purpose business benchmark to prove key seed recall is exactly 100%, expected closure correctness is exactly 100%, forbidden unrelated queries produce zero forced hits, and precision is recorded as evidence for later governance rather than used as a release substitute for recall.
- TS-08 requires W7 and whole delivery to remain blocked until W2-W6 are accepted and the W7 DT-18 business benchmark passes.
- DT-00 remains the coherent canonical-reading goal context through `grag-goal` and existing coherent-result evidence. `grag-capability` remains capability context for W7, not a separate downstream implementation target in this handoff.

### Validation and open risks

- `argo.previewSystemArchitectureMutation`: passed for five element updates and two View description updates; element count 47, relationship count 59, view count 27 unchanged.
- `argo.applySystemArchitectureMutation`: passed; Neo4j synchronized to 47 elements, 59 relationships, and 27 views.
- `argo.validateSystemArchitecture`: passed.
- `argo.getIntentElementContext`: read updated `grag-quality-gate` and `grag-seven-wave-delivery` context with implementation-design profile.
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

## 2026-07-25 — W6 Structural Closure And Explainable Results

- Selected viewpoint: Application Usage Viewpoint.
- Stakeholder concern: application architects, implementation designers, coding repair owners, auditors, and consuming Agents need Graph RAG results whose relationships, Views, and object-level inclusion reasons can be understood and traced without implicit graph chasing.
- Modeling purpose: designing, deciding, and intent-to-implementation handoff preparation.
- Affected view binding: `grag-integrity-explainability` remains an Application Usage Viewpoint instance because it shows how query-service application behavior turns the W5-selected range into consumer-readable context through endpoint closure, complete non-cascading View closure, single first-inclusion provenance, and coherent outcome evidence. The view explicitly excludes W7 quality scoring and capacity decisions.
- Superseded approval note: the human partner later clarified that the W6 ExplicitAcceptanceTestcase boundaries in this section were not approved because the mounted physical boundaries were weaker than the stated intent. See the 2026-07-25 repair section below for the approved repaired DT-00/DT-13/DT-14/DT-15 boundaries.
- Delivery-status guardrail: existing runner-owned `deliveryStatus` values were preserved. Intent Design did not create, change, remove, or infer `deliveryStatus`.

### Coverage matrix

- `grag-endpoint-closure` — `functionalPoint.DT-13-endpoint-closure` -> `ExplicitAcceptanceTestcase-DT-13`.
- `grag-view-closure` — `functionalPoint.DT-14-complete-view-closure` -> `ExplicitAcceptanceTestcase-DT-14`.
- `grag-provenance` — `functionalPoint.DT-15-first-inclusion-provenance` -> `ExplicitAcceptanceTestcase-DT-15`.
- `grag-coherent-context` is the observable outcome realized by the three same-element acceptance boundaries above; it is not listed as a separate implementation target because its DT-13/14/15 evidence is mounted on the exact implementation functions.

### Acceptance boundaries

- DT-13 requires every returned ArchitectureRelationship to include both canonical endpoint Elements from the same graph version, even when endpoints are not semantic matches or purpose-policy matches. Missing, deleted, or invalid endpoint references must be reported as structural errors rather than hidden behind partial relationship output.
- DT-14 requires every matched View to return complete metadata, included element ids, included relationship ids, member Elements, member ArchitectureRelationships, and endpoints for those relationships. Shared members must not cascade to overlapping Views unless those Views independently satisfy the query selection.
- DT-15 requires exactly one stable `firstInclusionReason` for every returned object, ordered across semantic seed, relationship endpoint closure, purpose-policy closure, and complete-View closure. Later matches may be supplementary only and must not overwrite the first reason.

### Dependency-scope decisions

- Handoff scope is the three implementation functions: `grag-endpoint-closure`, `grag-view-closure`, and `grag-provenance`.
- Context relationships are `grag-rel-purpose-endpoints`, `grag-rel-endpoints-views`, `grag-rel-views-provenance`, `grag-rel-provenance-coherent`, and `grag-rel-w6-coherent-context`.
- W6 starts after delivered W5 purpose closure. `grag-purpose-closure` carries runner-owned `deliveryStatus=delivered` and `deliveryEvidence.W5`; W6 elements remain `not_delivered` until downstream implementation passes their mounted DT-13, DT-14, and DT-15 entrypoints.
- W4 seed discovery, W5 purpose-policy selection, graph-tidy full-snapshot bypass, W7 quality scoring, DT-18/DT-19 evidence, and capacity governance remain outside this handoff.

### Validation and open risks

- `argo.previewSystemArchitectureMutation`: passed for five W6 element updates, three relationship updates, one new provenance-to-coherent association, and one Application Usage View update.
- `argo.applySystemArchitectureMutation`: passed; Neo4j synchronized to 47 elements, 59 relationships, and 27 views.
- `argo.validateSystemArchitecture`: passed.
- `argo.getIntentElementContext`: read `grag-endpoint-closure` dependency context with implementation-design profile after mutation.
- `argo.validateStageHandoff(stage="intent-to-implementation")`: passed for `.argo/temp/IntentToImplementationHandoff.json`.
- Checklist self-audit: A1-A5 satisfied by persisted/validated graph mutation and viewpoint-bound view; B1-B3 satisfied with same-element mounted DT-13 through DT-15 testcases and schema-compliant approval attributes; C1-C2 satisfied through explicit same-element coverage mappings and delivered W5 boundary evidence; D1-D8 satisfied with no open questions; E1-E3 satisfied subject to schema limitation on `approvedByHuman`; F1 recorded here and F2 requires this IntentDesign stage commit.
- Open business questions and adequacy blockers: none.

## 2026-07-25 — W6 Acceptance Boundary Repair

- Selected viewpoint: Application Usage Viewpoint.
- Stakeholder concern: consuming Agents and acceptors need W6 physical acceptance entrypoints to prove the same boundaries stated in intent: same-version relationship endpoints, complete non-cascading Views, exactly one ordered first-inclusion reason, complete policy/index/version evidence, and no coherent-result delivery while canonical-version evidence is missing.
- Modeling purpose: audit repair, deciding, and intent-to-implementation handoff preparation.
- Affected view binding: `grag-integrity-explainability` remains an Application Usage Viewpoint instance because it shows how query-service application behavior turns W5 selected ranges into consumer-readable context with structural integrity, provenance, and traceable version evidence. The repaired view explicitly includes the DT-00 coherent-version regression gate and still excludes W7 quality scoring and capacity decisions.
- Human feedback: prior W6 testcase boundaries were not approved. DT-13 lacked same canonical version and dangling-endpoint error checks; DT-14 lacked complete metadata/member checks and overlapping-View non-cascade proof; DT-15 lacked exactly-one first reason, supplementary non-overwrite, and full policy/index version evidence; W6 coherent-result delivery needed DT-00 or equivalent canonical-version regression coverage.
- Delivery-status guardrail: existing runner-owned `deliveryStatus` values were preserved. Intent Design did not create, change, remove, or infer `deliveryStatus`.

### Repaired coverage matrix

- `grag-coherent-context` — `functionalPoint.DT-00-coherent-result-version-regression` -> `ExplicitAcceptanceTestcase-DT-00-W6-CoherentResultRegression`.
- `grag-endpoint-closure` — repaired `functionalPoint.DT-13-endpoint-closure` -> repaired `ExplicitAcceptanceTestcase-DT-13`.
- `grag-view-closure` — repaired `functionalPoint.DT-14-complete-view-closure` -> repaired `ExplicitAcceptanceTestcase-DT-14`.
- `grag-provenance` — repaired `functionalPoint.DT-15-first-inclusion-provenance` -> repaired `ExplicitAcceptanceTestcase-DT-15`.

### Repaired acceptance boundaries

- DT-00-W6 requires semantic evidence to identify the governing canonical graph version. The known `DT00_CANONICAL_VERSION_MISSING` failure blocks W6 coherent-result delivery until resolved.
- DT-13 requires every returned ArchitectureRelationship to include both source and target Element objects from the same canonical graph version. Missing, deleted, invalid, or cross-version endpoints must produce explicit structural errors rather than partial relationship output.
- DT-14 requires every matched View to include complete metadata, viewpoint binding, parent viewpoint when present, included element ids, included relationship ids, member Elements, member ArchitectureRelationships, and both endpoints for each relationship. Overlapping Views sharing members must not be returned unless independently matched or explicitly requested.
- DT-15 requires every returned object to have exactly one ordered `firstInclusionReason`; later matching paths are supplementary only and cannot overwrite it. Declared purpose, selected policy id, policy parameters/anchors, canonical graph version, semantic index/content version, and alignment/index-state evidence must be present.

### Dependency-scope decisions

- Repaired handoff scope is now four target elements: `grag-coherent-context`, `grag-endpoint-closure`, `grag-view-closure`, and `grag-provenance`.
- Context relationships remain `grag-rel-purpose-endpoints`, `grag-rel-endpoints-views`, `grag-rel-views-provenance`, `grag-rel-provenance-coherent`, and `grag-rel-w6-coherent-context`.
- W6 remains downstream of delivered W5 purpose closure; W6 elements remain `not_delivered` until downstream implementation passes the repaired DT-00-W6, DT-13, DT-14, and DT-15 entrypoints.

### Validation and open risks

- `argo.previewSystemArchitectureMutation`: passed for repaired W6 testcase/functional point updates, coherent-context DT-00 regression gate, W6 work-package repair, provenance-to-coherent relationship update, and Application Usage View repair.
- `argo.applySystemArchitectureMutation`: passed; Neo4j synchronized to 47 elements, 59 relationships, and 27 views.
- `argo.validateSystemArchitecture`: passed.
- `argo.getIntentElementContext`: read repaired `grag-coherent-context` dependency context with implementation-design profile after mutation.
- `argo.validateStageHandoff(stage="intent-to-implementation")`: passed for `.argo/temp/IntentToImplementationHandoff.json`.
- Checklist self-audit: A1-A5 satisfied by persisted/validated graph mutation and viewpoint-bound view; B1-B3 satisfied with same-element mounted DT-00-W6, DT-13, DT-14, and DT-15 testcases and schema-compliant repair approval attributes; C1-C2 satisfied through explicit same-element coverage mappings and delivered W5 boundary evidence; D1-D8 satisfied with no open questions; E1-E3 satisfied subject to schema limitation on `approvedByHuman`; F1 recorded here and F2 requires this IntentDesign stage repair commit.
- Open business questions and adequacy blockers: none.

## 2026-07-26 — DT-19 W7 Capacity Evidence Handoff

- Selected viewpoint: Implementation and Migration Viewpoint.
- Stakeholder concern: acceptors, requirements owners, implementation designers, and downstream repair owners need W7 to record phase-1 result cardinality and precision evidence for DT-19 without turning that evidence into a silent capacity policy decision.
- Modeling purpose: handoff preparation for an ImplementationDesign RED boundary and Coding/Repair round.
- Affected view binding: `grag-quality-capacity` remains an Implementation and Migration Viewpoint instance because it already frames W7 quality/capacity acceptance and explicitly keeps DT-19 capacity choices out of Phase 1 correctness.
- Human approval evidence: the orchestrating request explicitly asked to open a DT-19/W7 capacity evidence ImplementationDesign RED boundary and Coding/Repair round. The schema does not permit an `approvedByHuman` field on the handoff JSON, so approval is recorded in handoff notes and as schema-compliant `acceptanceApproval.DT-05-R2-DT-19` on `grag-capacity-residual`.
- Delivery-status guardrail: existing runner-owned `deliveryStatus` values were preserved and not fabricated by Intent Design.

### Coverage matrix

- `grag-capacity-residual` — `functionalPoint.DT-05-R2-DT-19-capacity-evidence` -> `ExplicitAcceptanceTestcase-DT-05-R2-DT-19`.

### Acceptance and dependency boundaries

- DT-19 capacity evidence records phase-1 result cardinality and measured precision by declared purpose.
- DT-19 remains a deferred residual assessment. This handoff does not authorize token budgets, pagination, caps, top-k, truncation, or continuation semantics.
- `grag-quality-gate` is the delivered upstream context that influences DT-19 through `grag-rel-quality-capacity`; W7 sequencing remains represented by `grag-rel-w6-w7` and `grag-rel-w7-quality`.

### Validation and open risks

- `argo.previewSystemArchitectureMutation`: passed for one `grag-capacity-residual` element update.
- `argo.applySystemArchitectureMutation`: passed; Neo4j synchronized to 47 elements, 59 relationships, and 27 views.
- `argo.validateSystemArchitecture`: passed.
- `argo.getIntentElementContext`: read updated `grag-capacity-residual` context with implementation-design profile.
- `argo.validateStageHandoff(stage="intent-to-implementation")`: passed for `.argo/temp/IntentToImplementationHandoff.json`.
- Checklist self-audit: A1-A5 satisfied by persisted/validated graph mutation and existing viewpoint-bound view; B1-B3 satisfied with same-element mounted DT-19 testcase and schema-compliant approval attribute; C1-C2 satisfied through explicit same-element coverage mapping and delivered W7 quality context; D1-D8 satisfied with no open questions and schema-compliant global approval note; E1-E3 satisfied subject to schema limitation on `approvedByHuman`; F1 recorded here and F2 requires this IntentDesign stage commit.
- Open business questions and adequacy blockers: none.

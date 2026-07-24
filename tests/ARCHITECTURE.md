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
- TS-01-Native uses a Harness-owned query probe to prove exact request propagation, exactly one native-boundary call, and unchanged propagation of an unpredictable runtime-generated full result.
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
- `tests/explicit/entries/runEmbeddingProviderAdapterLifecycle.js`

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

The coding-scope authorization guard freezes TS-08/TS-09 as mounted evidence while prohibiting their testcase names, adapter/lifecycle targets, steps, and completion conditions from the handoff's authorized Coding scope.

All explicit and critical paths listed here, plus `tests/harness/intentArchitectureQueryHarness.js` and `tests/harness/productionGraphRagHarness.js`, are frozen during Coding/Repair.

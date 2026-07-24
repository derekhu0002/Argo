# Intent Query Test Contract

This local contract refines `OVERALL_ARCHITECTURE.md`.

## Responsibilities

- `tests/harness/intentArchitectureQueryHarness.js` hides MCP response parsing, canonical-file access, and invocation plumbing behind business-readable methods.
- `tests/explicit/entries/` owns the four frozen DT-01/02/03/12 entrypoints.
- `tests/architecture/intent-query/` owns frozen critical non-explicit guardrails for boundaries, dependency direction, entry correctness, and traceability.
- Explicit entrypoints preserve GIVEN / WHEN / THEN, semantic data names, control points, observation points, and readable business failure categories.
- DT-01 observes the complete legacy public envelope and absence of query metadata; DT-03 observes stable rejection categories for missing purpose and missing audit subject; DT-12 observes both bypass metadata and zero semantic-path invocations.

## Local dependencies

- Harness code may depend on the public `argo-mcp-server.js` boundary and canonical graph fixture.
- Explicit entrypoints depend only on Node assertions and Harness methods.
- Guardrails may inspect implementation contracts, graph metadata, and dependency declarations, but must not implement production behavior.

## Owned tests

### Explicit entrypoints

- `tests/explicit/entries/runGraphQueryCompatibility.js`
- `tests/explicit/entries/runCanonicalGraphFullSnapshot.js`
- `tests/explicit/entries/runQueryPurposeValidation.js`
- `tests/explicit/entries/runGraphTidyFullSnapshot.js`

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

All explicit and critical paths listed here, plus `tests/harness/intentArchitectureQueryHarness.js`, are frozen during Coding/Repair.

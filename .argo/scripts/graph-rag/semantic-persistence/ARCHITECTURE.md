# Production Semantic Persistence Contract

This local contract refines `OVERALL_ARCHITECTURE.md` and the parent `.argo/scripts/graph-rag/ARCHITECTURE.md`.

## Responsibilities

- `productionSemanticBackfill.js` owns the explicit WP-P1 backfill use case through `createProductionSemanticBackfill(dependencies).execute({ explicitOptIn })`.
- Backfill begins only after the injected structural-projection boundary proves the same canonical version complete. Structural projection is a prerequisite, not semantic readiness.
- Backfill reads one immutable canonical snapshot and independently enumerates every Element, ArchitectureRelationship, and View. It never fabricates a canonical mutation to trigger embedding generation.
- Work is bounded by an explicit positive batch size. Every channel has durable totals, completed counts, cursor, canonical version, retry, and isolated-failure checkpoints.
- Resume starts from durable channel checkpoints and does not repeat completed work. Rerun performs stable-identity upserts and is idempotent for unchanged canonical/content/index/provider/model/version/dimensions/vector evidence.
- A record failure is observable and isolated from other records. Partial or failed channels remain non-Aligned. Alignment may become `Aligned` only after Element, ArchitectureRelationship, and View channels all report complete for the same canonical version.
- `productionSemanticProjectionStore.js` owns `createProductionSemanticProjectionStore(dependencies)` and exposes only `upsertRecords(records)`, `deleteTombstones(tombstones)`, `readRecords()`, and `close()`.
- The production store validates stable canonical identity and complete channel, canonical/content/index, provider/model/model-version/dimensions, and vector metadata before persistence.
- The production store depends inward on a durable Neo4j persistence adapter. It must MERGE/upsert changed records by stable canonical identity and delete tombstones by that identity.
- Production records have no `runId`, production exposes no cleanup operation, and production never imports or delegates to `liveEmbeddingNeo4jBoundary.js`.
- Existing live E2E runId cleanup remains test-only and unchanged. It cannot select or delete production semantic projection labels or identities.
- External Neo4j and provider credentials use the existing approved external configuration and qualification boundaries. Missing `neo4jUri` blocks startup; tests never invent synchronization evidence.
- Canonical JSON remains authority at `design/KG/SystemArchitecture.json`. The durable Neo4j records are subordinate projection/index state and have no API that writes canonical JSON.

## Public interface

- `createProductionSemanticBackfill(dependencies)` requires canonical-source, structural-projection, qualified-provider, durable projection-store, checkpoint-store, external configuration, qualification, and bounded-batch dependencies; it returns `execute({ explicitOptIn })`.
- `createProductionSemanticProjectionStore(dependencies)` requires a durable persistence adapter, canonical-authority policy, and external configuration; it returns the four store methods listed above.
- The parent runtime may expose `runSemanticBackfill(request)` by delegating inward to this module.
- The MCP gateway may expose `backfillSystemArchitectureSemanticProjection` as the explicit operator control point. It must not turn structural mutation or structural sync into an implicit semantic-ready signal.

## Local dependencies

- MCP gateway → production Graph RAG composition → semantic backfill → canonical/structural/provider/store/checkpoint ports.
- Semantic backfill may depend on provider and projection interfaces; provider and store adapters must not depend outward on backfill orchestration.
- Production semantic persistence may depend on the approved Neo4j JavaScript driver adapter and existing external configuration/qualification modules.
- No file in this directory may depend on `tests/`, Python, Neo4j GenAI procedures, the live-E2E evidence boundary, or mutable canonical-write internals.
- Checkpoint persistence and semantic projection persistence are durable production state. Neither is a process-local map in production composition.

## Owned tests

- `tests/harness/productionSemanticPersistenceHarness.js`
- `tests/explicit/entries/runProductionSemanticBackfill.js` — SP-01 control point: explicit backfill after structural projection. Observation: independent complete channels, bounded checkpoints, interruption/resume, isolated failure, idempotent rerun, complete metadata, no fake mutation, and alignment only after all channels complete.
- `tests/explicit/entries/runPersistentSemanticProjectionLifecycle.js` — SP-02 control point: durable projection across restart, changed-record upsert, tombstone deletion, and unrelated live-E2E cleanup. Observation: stable identity and metadata survive, production has no runId cleanup, canonical authority remains intact, and Neo4j remains subordinate.
- `tests/architecture/production-semantic-persistence/architecture-boundary.guard.js` — `ArchitectureBoundaryGuard`.
- `tests/architecture/production-semantic-persistence/dependency-direction.guard.js` — `DependencyDirectionGuard`.
- `tests/architecture/production-semantic-persistence/explicit-entrypoint-correctness.guard.js` — `ExplicitEntrypointCorrectnessGuard`.
- `tests/architecture/production-semantic-persistence/implementation-traceability.guard.js` — `KeyImplementationTraceabilityGuard`.

All owned Harness, explicit entrypoints, guards, this contract, the root and parent contracts, incoming intent handoff, runner failure records, and canonical graph are frozen during Coding/Repair. The protected fixture is `canonicalThreeChannelFixture`; the protected baseline is the committed WP-P1 pre-coding full-run result in `design/KG/test-failure-records.json`.

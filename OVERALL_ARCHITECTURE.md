# ARGO Implementation Architecture Contract

## Root rules

1. Production dependencies point from the unified MCP gateway to the intent-query boundary and from that boundary to canonical graph persistence; production code never depends on `tests/`.
2. `getSystemArchitecture` remains the single public reading interface. An omitted `query` preserves the legacy complete canonical response; an explicit `query` selects purpose-aware behavior.
3. Canonical JSON is authoritative. Semantic retrieval may derive context but cannot replace, mutate, or silently truncate a required full snapshot.
4. Test Harness code may invoke public production boundaries and read approved fixtures; explicit entrypoints use Harness methods and do not expose MCP, filesystem, or process plumbing.
5. Explicit entrypoints and critical guardrails listed in the implementation handoff are frozen during Coding/Repair.
6. The production Graph RAG path is Node.js plus the Neo4j JavaScript driver. Python runtimes, external Graph RAG frameworks, and the Neo4j GenAI Plugin are not required production dependencies.
7. Neo4j and embedding-provider credentials enter only through external secure configuration. Missing credentials block production startup or query delivery; direct literals, logical/nullish/ternary fallbacks, and credential-tainted Cypher query/parameter transport are prohibited.
8. Index delivery is denied until an explicit qualification names the embedding provider, model identity, model version, and dimensions. Missing fields and implicit model defaults are blocking errors.
9. Mounted acceptance evidence does not itself authorize Coding scope. Only `codingTargets` and `taskExecutionPlan` in the approved handoff authorize implementation; TS-08 remains out of scope unless a later handoff explicitly includes it.
10. Slice completion and global intent delivery are distinct. A handoff may accept its approved explicit entrypoints and guardrails while the full runner keeps a global intent element `not_delivered`; only committed mounted evidence, runner records, and runner-owned `deliveryStatus` may support that attribution.
11. Live embedding delivery uses explicit opt-in Node.js HTTPS from `alibaba-cloud-model-studio-openai-compatible-cn-beijing` at `https://llm-clids9mqc5o1mbvb.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`, model `qwen3.7-text-embedding`, qualification version `qualification-2026-07-25`, and explicitly supplied dimensions `1024`. Offline fakes cannot count as live evidence.
12. The only secret keys are `QWEN_KEY` and `ARGO_NEO4J_DATABASE_PASSWORD`. Each may come only from its direct process environment variable or the unique repository-relative `.argo/.env`, with process precedence; differing dual sources fail closed and matching duplicates may use process.
13. Live provider evidence becomes index-write eligible only after exact qualification and a finite 1024-value response. Provider errors, unapproved identity, omitted model or dimensions, non-finite values, and dimension mismatch produce zero writes to the controlled Neo4j test instance.
14. Live HTTP proof is owned by the frozen test transport, not by a production boolean or evidence label. The Harness observes the actual request target/body/count and raw response, then correlates them with gate output and persisted evidence.
15. Before reading `.argo/.env`, configuration must prove the exact path is ignored, untracked, regular, non-reparse, and protected by verifiable Windows ACLs without broad-principal read access. Root/alternate/tracked files, CLI/literal/default/fallback sources, duplicate keys, unknown secret keys, and unsafe or unverifiable state block before fetch, Neo4j connection, or writes.
16. Neither approved secret may enter logs, errors, Cypher, graph state, failure records, snapshots, or artifacts. `QWEN_KEY` never enters Neo4j; `ARGO_NEO4J_DATABASE_PASSWORD` is consumed only by the driver authentication layer.
17. W3 index delivery is not complete until threshold-all seed correctness passes before ANN comparison, every successful canonical mutation advances affected-record index evidence or leaves the index non-Aligned, unaligned pure semantic queries are rejected while canonical reads remain available, and TS-09 proves the Node adapter generation/persistence path through `generateAffectedEmbeddings()`.
18. W3.1 live mutation-vector delivery is not complete until `applySystemArchitectureMutation` is the canonical mutation control point, touched Element, ArchitectureRelationship, and View records are extracted from the committed mutation, the real approved Qwen adapter generates finite 1024-dimensional vectors, Neo4j vector-index evidence is queryable for those touched records, and Aligned is set only after that queryability check passes. Offline/fake evidence is never accepted as live W3.1 delivery evidence.

## Stable architecture elements

| Stable element | Path | Responsibility | Public boundary |
| --- | --- | --- | --- |
| Unified MCP Gateway | `.argo/scripts/argo-mcp-server.js` | Expose one governed tool surface and delegate intent-query work inward. | `callTool(name, args)` and MCP stdio tools |
| Intent Architecture Query Boundary | `.argo/scripts/systemarchitecture-mcp-server.js` | Preserve no-argument reads, validate explicit query purpose, and dispatch full-snapshot or semantic-query behavior. | `getSystemArchitecture` |
| Production Graph RAG Boundary | `.argo/scripts/graph-rag/` | Compose external configuration, embedding qualification, Neo4j-native retrieval, canonical-authority enforcement, exact threshold-all seed selection, all-mutation index lifecycle evidence, alignment gating, the explicitly opted-in approved-provider evidence gate, and the W3.1 mutation-to-live-vector lifecycle without optional runtime coupling. | `createProductionGraphRagRuntime(dependencies)`, `generateAffectedEmbeddings(input)`, `executeApprovedEmbedding(input)`, and `createMutationEmbeddingVectorLifecycle(dependencies)` |
| Canonical Intent Graph | `design/KG/SystemArchitecture.json` | Remain the authoritative source for Elements, Relationships, Views, and memberships. | Workspace-relative canonical graph path |
| Query Acceptance Boundary | `tests/` | Own business-readable Harness, explicit entrypoints, and implementation guardrails. | Frozen Node.js entry scripts |

## Implements mappings

| Implementation element | Intent element ID | Mapping |
| --- | --- | --- |
| Query Acceptance Boundary / compatibility entrypoint | `grag-consumer-role` | direct |
| Query Acceptance Boundary / compatibility entrypoint | `grag-consumption-process` | direct |
| Intent Architecture Query Boundary | `grag-query-service` | direct |
| Canonical Intent Graph | `grag-canonical-graph` | direct |
| Intent Architecture Query Boundary / query DTO | `grag-query-request` | direct |
| Intent Architecture Query Boundary / validation | `grag-mode-validation` | direct |
| Intent Architecture Query Boundary / graph-tidy dispatch | `grag-graph-tidy-policy` | direct |
| Production Graph RAG Boundary / runtime composition | `grag-production-runtime` | direct |
| Production Graph RAG Boundary / Neo4j retrieval adapter | `grag-native-retrieval-service` | direct |
| Production Graph RAG Boundary / embedding release gate | `grag-embedding-qualification` | direct |
| Production Graph RAG Boundary / external configuration | `grag-credential-boundary` | direct |
| Production Graph RAG Boundary / projection authority policy | `grag-canonical-graph` | direct |
| Production Graph RAG Boundary / exact threshold-all seeds | `grag-seed-retrieval` | direct |
| Production Graph RAG Boundary / semantic index evidence | `grag-semantic-index` | direct |
| Production Graph RAG Boundary / all-mutation lifecycle | `grag-index-lifecycle` | direct |
| Intent Architecture Query Boundary / alignment rejection | `grag-alignment-constraint` | direct |
| Production Graph RAG Boundary / embedding provider adapter | `grag-embedding-provider-adapter` | direct |
| Production Graph RAG Boundary / affected-record generation | `grag-embedding-generation` | direct |
| Production Graph RAG Boundary / W3.1 mutation-vector lifecycle | `grag-wp-3-1` | direct |

Module responsibilities, allowed local dependencies, interface details, and test ownership are defined only by the local `ARCHITECTURE.md` contracts.

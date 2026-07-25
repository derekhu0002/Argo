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
18. W3.1 live mutation-vector delivery is not complete until one successful `applySystemArchitectureMutation` write call automatically invokes the embedding lifecycle from its actual `touchedElementIds`, `touchedRelationshipIds`, and `touchedViewIds`, returns `embeddingLifecycle` and `alignment` in the MCP mutation response, the real approved Qwen adapter generates finite 1024-dimensional vectors, Neo4j vector-index evidence is queryable for those touched records, and Aligned is set only after that queryability check passes. Harness-created lifecycle execution, expected-touched-record substitution, and offline/fake evidence are never accepted as live W3.1 delivery evidence.
19. W4 seed retrieval delivery is scoped only to relevance-discovery seeds: Element, ArchitectureRelationship, and View are separately observable channels, each channel owns an independent threshold gate, every candidate meeting that channel gate is returned, zero-result outcomes are valid, and graph closure, traversal expansion, neighborhood closure, downstream graph completion, and global cross-channel ranking remain outside Coding scope.
20. W5 deterministic purpose closure begins after W4 seeds and is complete only when mandatory closure decisions use named parameterized Cypher policies with bound parameters plus ArchiMate relationship source/target semantics. Free-generated Cypher, Agent identity, text similarity, arbitrary traversal depth, and connected-component expansion cannot decide mandatory closure. The five purpose categories are independent: intent-decision, implementation-design, coding-repair, audit, and graph-tidy.
21. W6 structural closure begins after W5 purpose-policy range selection and is complete only when semantic results expose governing canonical version evidence equal to the legacy graph version, every returned relationship has source/target ids plus both same-version endpoint Elements or explicit structural errors, the named target View is returned while named overlapping Views are absent unless independently matched or explicitly requested, matched Views return complete metadata, parent viewpoint, exact member/relationship object sets, and endpoints, and every returned object has exactly one ordered first-inclusion reason plus non-overwriting supplementary reasons, policy id, policy parameters/anchors, and index/version evidence.
22. W7 business acceptance is the final release gate before whole delivery. It is complete only when the approved five-purpose business benchmark proves 100% key seed recall from actual recall observations, 100% expected closure correctness from actual closure observations, zero forced hits for unrelated queries, and recorded precision evidence inside `[0, 1]` for every purpose. Missing actual observations, empty or incomplete benchmarks, and precision outside `[0, 1]` are blocking failures. Precision is evidence for later capacity governance, not a substitute threshold for recall or closure. Whole delivery remains blocked until W2-W6 are accepted and the W7 DT-18 benchmark passes.

## Stable architecture elements

| Stable element | Path | Responsibility | Public boundary |
| --- | --- | --- | --- |
| Unified MCP Gateway | `.argo/scripts/argo-mcp-server.js` | Expose one governed tool surface and delegate intent-query work inward. | `callTool(name, args)` and MCP stdio tools |
| Intent Architecture Query Boundary | `.argo/scripts/systemarchitecture-mcp-server.js` | Preserve no-argument reads, validate explicit query purpose, dispatch full-snapshot or semantic-query behavior, and route declared W5 purpose categories without using caller identity as scope. | `getSystemArchitecture` |
| Production Graph RAG Boundary | `.argo/scripts/graph-rag/` | Compose external configuration, embedding qualification, Neo4j-native retrieval, canonical-authority enforcement, W4 independent semantic seed release, W5 deterministic purpose-policy closure, W6 endpoint/View/provenance structural result completion, W7 business quality benchmark and delivery sequence gates, exact threshold-all seed selection, all-mutation index lifecycle evidence, alignment gating, the explicitly opted-in approved-provider evidence gate, and the W3.1 automatic mutation-triggered live-vector lifecycle without optional runtime coupling. | `createProductionGraphRagRuntime(dependencies)`, `selectThresholdAllSeeds(request)`, `closePurposePolicyScope(request)` including W6 structural evidence, `evaluatePhase1QualityBenchmark(request)`, `evaluateDeliverySequence(request)`, `generateAffectedEmbeddings(input)`, `executeApprovedEmbedding(input)`, and `createMutationEmbeddingVectorLifecycle(dependencies)` consumed by `applySystemArchitectureMutation` |
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
| Production Graph RAG Boundary / purpose-policy closure | `grag-purpose-closure` | direct |
| Production Graph RAG Boundary / intent-decision category | `grag-intent-decision-policy` | direct |
| Production Graph RAG Boundary / implementation-design category | `grag-implementation-policy` | direct |
| Production Graph RAG Boundary / coding-repair category | `grag-repair-policy` | direct |
| Production Graph RAG Boundary / audit-proof category | `grag-audit-policy` | direct |
| Intent Architecture Query Boundary / graph-tidy full-snapshot category | `grag-graph-tidy-policy` | direct |
| Intent Architecture Query Boundary / coherent-result version evidence | `grag-coherent-context` | direct |
| Production Graph RAG Boundary / same-version endpoint closure | `grag-endpoint-closure` | direct |
| Production Graph RAG Boundary / complete non-cascading View closure | `grag-view-closure` | direct |
| Production Graph RAG Boundary / first-inclusion provenance | `grag-provenance` | direct |
| Production Graph RAG Boundary / W7 business quality benchmark | `grag-quality-gate` | direct |
| Production Graph RAG Boundary / seven-wave delivery gate | `grag-seven-wave-delivery` | direct |

Module responsibilities, allowed local dependencies, interface details, and test ownership are defined only by the local `ARCHITECTURE.md` contracts.

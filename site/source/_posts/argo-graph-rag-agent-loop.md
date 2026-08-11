---
title: "ARGO 如何用 Graph RAG 辅助 Agent Loop：从全局视图到工程闭环"
date: 2026-08-11
description: "从 canonical 架构图、三通道向量检索、目的策略闭包与阶段门禁出发，分析 ARGO Graph RAG 如何为 Agent Loop 提供可核验的架构上下文及其当前证据边界。"
categories:
  - ARGO
  - Agentic Engineering
tags:
  - Graph RAG
  - Agent Loop
  - ArchiMate
  - Neo4j
  - MCP
---

![向量知识图谱驱动的 Agent Loop 全局架构](/images/argo-overall-architecture.png)

这张全局视图的**关注点**是：下游 Agent 如何获得与阶段任务一致、同时保持 canonical 保真的架构上下文；其**目的**是 informing / deciding，而不是宣称每条生产链路已经端到端就绪。图中的 Agent Loop 指 `.cursor/agents/` 治理的阶段流程，不是产品代码里名为 `AgentLoop` 的 runtime。阶段 Agent 通过统一的 `argo` MCP 调用 `getSystemArchitecture(query)`；Graph RAG 是这条读取边界的一种语义检索路径。

## 按全局视图逐个看元素

**人 / 验收者**提出需求、问题单或失败证据，并对设计、阶段 handoff 与最终业务语义作判断。人不是“提示词供应者”这么简单：是否批准 testcase、handoff 是否可下发、结果是否满足业务意图，都是不能由相似度分数替代的控制点。

**AI Agent Loop**由 `.cursor/agents/` 中的 IntentionDesign、ImplementationDesign、CodingAndReparing、审计与编排角色构成。它读取架构上下文、形成候选变更并提交审核；门禁失败则回到所属阶段。Graph RAG 辅助阶段决策，但不拥有阶段路由、审批或交付结论。

**ARGO MCP GraphRAG 知识图谱工具**是 typed MCP query interface。`query.purpose` 只允许五类目的，`intent` 必填，`audit` 还要求 `subject`。这使检索请求成为可验证协议，而不是让 Agent 自由拼接 Cypher 或自由指定 debug/full 响应形状。

**ArchiMate 3.2 Schema**提供元素类型、关系方向和 View 一致性约束。它约束 canonical 图以及闭包解释：例如 Realization 不能把实现证据偷换成目标意图，Serving 要按服务依赖方向理解。Schema 是语义护栏，不是向量模型。

**canonical `design/KG/SystemArchitecture.json`**虽未在概念图中单独画框，却是当前实现的权威事实源。稳定 ID、原始 Element、ArchitectureRelationship 与 View 都以它为准。Neo4j 只保存 projection/index；向量命中负责导航，不能反向改写 canonical 事实。

**Embedding provider / 向量和排序模型**把 `query.intent` 编码为合格向量。它解决“哪些对象可能相关”，不决定“哪些依赖必须随结果返回”。模型、维度、来源归属和 readiness 都要满足限定配置；这也意味着 provider 可用并不等于业务闭包正确。

**Neo4j 图数据库**承载 Element、ArchitectureRelationship、View 三个独立向量通道及 readiness/projection。三个通道分别检索、分别应用阈值和扩展窗口，避免把关系或 View 降格成元素文本附件。它是可重建投影，不是第二份真相。

**purpose policy closure**从声明的 purpose 选择命名、参数化的确定性策略，再按 ArchiMate 方向纳入低相似度但强制需要的对象。策略由 purpose 决定，而不是由 caller identity 或模型临时生成的 Cypher 决定。

**结构闭包**在目的闭包之后修复对象集合完整性：Relationship 命中必须带两个端点；View 命中必须带完整 membership、View 内关系及其端点，但不能因为共享成员继续级联到另一个 overlapping View。

**acceptance quality gate**观察请求契约、召回、闭包、无关强制命中、queryability、global coherence 以及阶段业务结果。它防止“能返回 JSON”被误写成“闭环已经完成”。

**CodeGraph 与产品代码**是全局图中的工程侧结构：CodeGraph reflects 产品代码，MCP 可做结构查询，Agent Loop 也可读写产品代码。但当前本文讨论的 `getSystemArchitecture(query)` Graph RAG 不应与 CodeGraph 混为同一索引，也不能据此声称代码现实已自动同步回意图图。

## 按箭头走完读链与写链

先逐条对应图上的关系：人以“提出需求/审核设计”把意图送入 Agent Loop，Loop 再以“提交审核”把候选结果交还人；Loop 对 ARGO MCP 执行读/写；ArchiMate 3.2 Schema 对 MCP 提供语义约束；MCP 向向量模型发出 Embedding 请求；MCP 对 CodeGraph 发起结构查询；MCP 向 Neo4j 写入原始结构/向量投影；CodeGraph reflects 产品代码；产品代码又处在 Loop 的读/写范围内。这些箭头表达职责与数据流，不保证每条箭头都属于同一事务。特别是产品代码—CodeGraph—MCP 这条支路不能被用来推导“代码变更会自动回写 canonical 意图图”；而 MCP—Neo4j 的写入也应解释为 projection/index 生命周期，权威写入仍以 canonical JSON 为先。

读侧完整链路是：**human intent → stage agent → MCP query → readiness/alignment → embed → 三通道独立检索 → declared-purpose deterministic closure → relationship endpoint / View membership closure → canonical subset response**。

具体而言，人把业务问题交给阶段 Agent；Agent 声明 purpose 与 intent；MCP 先校验 typed request，再读取 canonical 版本与持久 readiness。若不对齐，系统尝试自动 alignment 并只重试一次；仍不对齐就 fail closed，且 `fullSnapshotFallback:false`。通过后才调用 embedding provider，并在三个命名索引上独立拉取扩展窗口、按各自阈值收集种子。随后 purpose policy 补齐任务必需对象，结构闭包补齐关系端点和 View membership，最终从 canonical JSON 按对象集合重建响应。普通语义查询返回的是 canonical object-set subset，不是派生 summary、provenance debug 或检索器内部对象。

写侧链路是：**canonical mutation → invalidate readiness → exact touched IDs 增量 upsert/tombstone → queryability/coherence → Aligned**。canonical 写入先发生，随后以精确的 touched Element、Relationship、View ID 生成增量记录或 tombstone；验证 touched 记录可查询，再验证全局一致性，最后才能标记 Aligned。任何一步失败都应阻断纯语义查询，而不是悄悄退化为全图。无参数 full snapshot 与 `graph-tidy` full snapshot/bypass 仍保留兼容性，但它们不能被普通查询拿来绕过 readiness。

![Graph RAG 从权威图谱提取阶段上下文](/images/graphrag-precision-context-cn.png)

## 五个 purpose 如何映射阶段业务

### 1. intent-decision：BusinessPartner / IntentionDesign

- **业务问题**：需求、影响、约束和验收意图应落在哪些现有能力、目标与关系上？
- **控制点**：Agent 显式声明 `intent-decision`，人审批业务决策与图谱候选。
- **观测点**：关键意图种子、按方向补入的目标/约束、canonical ID 与 View 归属。
- **预期业务结果**：决策者获得足够但不过量的意图上下文，能判断复用、变更或拒绝。
- **可证伪边界**：若关键低相似度约束未被闭包纳入，或无关 View 被级联，结果即不可接受。

### 2. implementation-design：ImplementationDesign

- **业务问题**：哪些边界、契约、依赖与 testcase entrypoint 必须物化，才能把意图交给编码？
- **控制点**：已批准 intent handoff、`implementation-design` purpose、canonical 关系方向。
- **观测点**：目标意图、实现边界、Realization/Serving/Access 证据与验收挂载。
- **预期业务结果**：设计交付物可追溯到意图，并形成可执行而非臆测的编码边界。
- **可证伪边界**：Graph RAG 不能替代 handoff 验证；“跨阶段 handoff 直接调用 Graph RAG”目前为 **undetermined**。

### 3. coding-repair：CodingAndReparing

- **业务问题**：失败记录对应哪些合同、架构依赖和验收语义，允许修改的边界是什么？
- **控制点**：有效 implementation-to-coding handoff、失败记录、冻结文件和 `coding-repair` purpose。
- **观测点**：失败对象与上游约束的 traceability、关系端点完整性、修复后阶段测试结果。
- **预期业务结果**：修复围绕已批准边界展开，减少只追局部报错而破坏上游意图的风险。
- **可证伪边界**：检索到相关对象不等于代码修复正确；仍须运行测试并检查 delivered 回退。

### 4. audit：审计 Agent

- **业务问题**：指定 subject 是否满足 ArchiMate、canonical、依赖方向与验收证据要求？
- **控制点**：`audit` 必须提供非空 subject，审计保持只读且不接受自由生成查询。
- **观测点**：命名策略、强制闭包、缺失引用、错误类别和 canonical 原对象。
- **预期业务结果**：审计结论有明确对象与关系依据，可被复核。
- **可证伪边界**：若 subject 被相似度邻居替换，或返回派生摘要而非原对象集合，审计证据失真。

### 5. graph-tidy：TaskTidyGraphIntegrator / host

- **业务问题**：决策树与图谱候选如何整理，供唯一 canonical writer 预览、应用和验证？
- **控制点**：`graph-tidy` 明确 bypass 语义检索并保留 full snapshot；TaskTidyGraphIntegrator 本身不写 canonical 图。
- **观测点**：完整 membership、候选覆盖、host 的 preview/apply/validate 结果。
- **预期业务结果**：整理者不因语义裁剪漏掉拓扑，写权限与最终判断仍集中在宿主阶段。
- **可证伪边界**：不能把 bypass 说成第五种向量检索成功，也不能把候选整理说成图变更已生效。

组织级 drift-recovery 全流程同样是 **undetermined**。目前只能说 Graph RAG 间接提供对象 traceability，并覆盖 index stale 的检测/对齐子路径；它没有证明组织级漂移发现、决策、修复和验收的完整闭环。

![ARGO Agent Loop 的阶段门禁闭环](/images/argo-agent-loop-cn.png)

## 关键代码逻辑：只看决定语义的短片段

### `.argo/scripts/systemarchitecture-mcp-server.js`（L7–13）

```js
const LEGAL_QUERY_PURPOSES = new Set([
  'intent-decision', 'implementation-design', 'coding-repair',
  'audit', 'graph-tidy',
]);
```

### `.argo/scripts/systemarchitecture-mcp-server.js`（L1760–1807，节选）

```js
if (query.purpose === 'graph-tidy') {
  // full snapshot, semanticRetrieval: 'bypassed'
}
return applySemanticResponseProfile(await journey.query(query), query, contractOptions);
```

dispatch 先把 graph-tidy 与普通语义路径分开；遗漏 query 则保持旧的 canonical full snapshot 读取。

### `.argo/scripts/systemarchitecture-mcp-server.js`（L1917–1928，节选）

```js
const retrieved = await semanticRetrievalBoundary.retrieve(query);
const subset = buildCanonicalSemanticDocumentSubset(retrieved, context.document);
document = subset.document;
```

检索结果只是 ID/闭包依据，公开文档重新从 canonical document 构造。

### `.argo/scripts/graph-rag/defaultSemanticRetrieval.js`（L75–113，节选）

```js
if (!evidence.alignment.aligned) {
  await attemptAutomaticAlignment(...);
  if (!evidence.alignment.aligned) throw semanticAutomaticAlignmentFailed(...);
}
```

### `.argo/scripts/graph-rag/defaultSemanticRetrieval.js`（L151–178，节选）

```js
const vector = await provider.embed(request.intent);
for (const channel of CHANNELS) {
  seedsByType[channel.key] = await exhaustChannel({ channel, neo4jDriver, vector });
}
```

### `.argo/scripts/graph-rag/defaultSemanticRetrieval.js`（L612–642，节选）

```js
topK: offset + INITIAL_WINDOW_SIZE,
if (record.score >= channel.threshold) accepted.push(record);
if (window.windowExhausted === true || window.hasMore === false) break;
```

扩展窗口避免初始 top-k 截断合格同伴；阈值仍只是种子资格，不是闭包规则。

### `.argo/scripts/graph-rag/defaultSemanticRetrieval.js`（L666–729，节选）

```js
const closureResult = await runtime.closePurposePolicyScope({ ...request, anchors });
const structural = buildExactStructuralCompletion(canonicalGraph, closureResult, versions);
const provenance = buildExactProvenance({ seedsByType, closureResult, structural, versions });
```

### `.argo/scripts/graph-rag/productionGraphRagRuntime.js`（L45–59）

```js
const PURPOSE_POLICY_ANCHORS = Object.freeze({
  'intent-decision': 'grag-intent-decision-policy',
  'implementation-design': 'grag-implementation-policy',
  'coding-repair': 'grag-repair-policy',
  audit: 'grag-audit-policy',
  'graph-tidy': 'grag-graph-tidy-policy',
});
```

### `.argo/scripts/graph-rag/productionGraphRagRuntime.js`（L61–145，节选）

```js
'UNWIND $anchors AS anchorId',
'MATCH (purpose {id: "grag-purpose-closure"})-[:Triggering]->(policy {id: $policyAnchorId})',
// Triggering / Access / Serving / Realization 均有显式方向语义
```

模板是命名、参数化且有最大深度的，不把 caller 文本直接拼为 Cypher；ArchiMate 方向再约束闭包解释。

## 与常见 GraphRAG 的差异和工程取舍

Microsoft 的论文 *From Local to Global* 与 [GraphRAG 文档](https://microsoft.github.io/graphrag/)面向私有文本语料：抽取实体图、构建层级 community、预生成 community reports，并用 map-reduce global search 回答全局主题问题。ARGO 不采用这种 community-summary global search。它处理的是已建模的 ArchiMate canonical 图，检索受 canonical authority、阶段 purpose 与确定性闭包约束，目标是给工程 Agent 可核验对象，不是生成语料综述。

[Repoformer（ICML 2024）](https://proceedings.mlr.press/v235/wu24a.html)说明“总是检索”会带来无效甚至有害上下文，选择性检索可改善效率与稳健性。ARGO 的对应启示不是复制其自触发模型，而是让 typed purpose、兼容 full snapshot/bypass 和质量门禁明确“何时、为何、以什么形状读取”。

Neo4j [JavaScript Driver 文档](https://neo4j.com/docs/javascript-manual/current/query-simple/)建议使用参数化查询并显式管理数据库/会话；ARGO 的命名策略模板与绑定参数符合这一方向。但当前默认检索使用 `db.index.vector.queryNodes`。Neo4j 官方兼容性文档已标注该过程在 **Neo4j 2026.04** 弃用，替代为 Cypher [`SEARCH` subclause](https://neo4j.com/docs/cypher-manual/25/clauses/search/)。这是需要跟踪的兼容性风险，本文不提出或实现迁移方案。

另一个必须区分的接口是 `getIntentElementContext`：它直接在 canonical JSON 上按 ArchiMate 关系语义做确定性遍历，返回焦点元素的依赖/被依赖/关联子图；它不是上述 embedding → Neo4j 三通道 → purpose closure 的同一个向量 Graph RAG pipeline。

## 截止 2026-08-11 的证据状态

本次实际运行结果是：`runPurposePolicyClosure.js` 通过；`runMcpSemanticQueryContract.js` 的 10 个场景通过；`runRetrievalQualityBenchmark.js` 通过；`runDefaultMcpNeo4jVectorRetrieval.js` 失败，错误为 `SP03_APPROVED_SOURCE_DIRECT_ATTRIBUTION_MISMATCH`。

因此能成立的结论只有：**核心查询契约、策略闭包与质量基准已验证；默认生产向量检索组合当前未完全通过。** 不能声称 live E2E 已通过，也不能声称生产闭环完全就绪。失败点涉及批准来源的直接归属不匹配；在没有进一步证据前，不应把它泛化成 Neo4j、embedding 或全部检索逻辑都失效。

## 五个业务语义验收用例

1. **意图决策上下文**：验收方控制 `intent-decision` 与已批准业务问题；观察关键目标、约束及 canonical ID 是否完整且无无关 View 级联；预期业务结果是能作出复用/变更/拒绝决定。
2. **实现边界可追溯**：验收方控制已批准意图范围与 `implementation-design`；观察实现边界、契约和验收项是否通过原生关系回溯到目标；预期业务结果是 handoff 内容可解释、可复核，但 handoff 仍需独立门禁。
3. **修复不越界**：验收方控制失败记录、冻结边界与 `coding-repair`；观察返回上下文是否包含失败对象所依赖的合同与上游意图；预期业务结果是修复范围明确，最终正确性由测试和业务验收确认。
4. **关系与 View 完整性**：验收方控制一个 Relationship 命中和一个 View 命中；观察关系双端点、View 全部 membership、View 内关系端点齐全且 overlapping View 不级联；预期业务结果是收到最小但自洽的 canonical 子集。
5. **索引失配安全失败**：验收方控制 canonical/index 版本不一致；观察自动对齐后的一次重试，若仍失败则返回稳定错误且 `fullSnapshotFallback:false`；预期业务结果是 Agent 不在陈旧投影上继续作阶段决策。

Graph RAG 在这里最有价值的不是“让 Agent 知道更多”，而是让上下文的来源、目的、闭包和失败方式都能被验收。当前证据支持这套核心约束，但默认生产向量检索组合仍有明确红灯；在红灯解除前，谨慎结论比完整叙事更重要。

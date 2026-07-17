# 意图架构 MCP 功能列表

本文整理 ARGO 统一 **`argo` MCP 服务器**中与**意图架构**（`design/KG/SystemArchitecture.json`）直接相关的工具能力，供 Agent、Skill 与人工查阅。当前统一入口为 `.argo/scripts/argo-mcp-server.js`；validator 工具委托 `.argo/scripts/validator-mcp-server.js`；图谱读写、子图查询、mutation 校验、focused 单操作和 diff 可视化位于 `.argo/scripts/systemarchitecture-mcp-server.js`；总校验脚本位于 `.argo/scripts/validateSystemArchitecture.js`。

各平台（`.cursor` / `.github` / `.opencode`）通过各自 `mcp.json` 注册同名服务器 `argo`，命令为 `node ${workspaceFolder}/.argo/scripts/argo-mcp-server.js`。统一 server 当前暴露 **19 个去重后的工具**；`tools/list` 按 `local TOOLS → systemArchitectureMcp.TOOLS → validatorMcp.TOOLS` 合并，同名工具以后者为准。因此 `validateSystemArchitecture` 在统一 `argo` MCP 中采用 validator 版本：固定校验 `design/KG/SystemArchitecture.json`，不接收 `architecturePath`。

---

## 意图架构锚点

| 概念 | 路径 / 说明 |
| --- | --- |
| 意图图谱事实源 | `design/KG/SystemArchitecture.json` |
| JSON Schema | `.argo/schema/SystemArchitecture.schema.json` |
| ArchiMate 规则 | `.argo/scripts/archimate32-rules.js` |
| 校验归档文档 | `design/validator/intent-architecture-mcp-validation.md` |
| 意图 → 实现交接 | `.argo/temp/IntentToImplementationHandoff.json` |
| 实现 → 意图追溯提案 | `design/KG/ImplementationToIntentTraceProposal.json` |
| 架构测试失败记录 | `design/KG/test-failure-records.json` |
| 图谱 diff 可视化输出 | `.argo/temp/architecture_analysis/` |

意图架构承载 Motivation、Strategy、Business、Application、Technology 各层 ArchiMate 元素、关系、view、原则、约束，以及挂载在元素上的 `ExplicitAcceptanceTestcase` 等验收语义。

---

## 工具总览（按职责分类）

### 1. 只读查询

| 工具 | 写入 | 典型用途 |
| --- | ---: | --- |
| `getSystemArchitecture` | 否 | **入口工具**。读取当前 elements、relationships、views 及 id，mutation 前必须先调用 |
| `getIntentElementContext` | 否 | 以单个 focus element 为中心，按 ArchiMate 语义依赖遍历抽取子图上下文 |

#### `getSystemArchitecture`

- **参数**：`architecturePath`（可选，默认 `design/KG/SystemArchitecture.json`）
- **校验**：路径解析与 JSON 读取；不执行结构语义校验
- **说明**：规划任何图谱变更前的第一步；失败时由工具直接返回读取/解析错误

#### `getIntentElementContext`

- **参数**：

| 参数 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `elementId` / `elementName` | string | — | focus 元素定位（二选一） |
| `architecturePath` | string | `design/KG/SystemArchitecture.json` | 可选图谱路径 |
| `profile` | enum | `generic-agent` | 仅影响 `workContext`  enrichment；子图形状保持原生 |
| `dependencyDepth` | number | 2 | focus 所需的上游语义依赖深度 |
| `dependentDepth` | number | 1 | 依赖 focus 的下游语义深度 |
| `associationDepth` | number | 1 | Association 邻居扩展层数 |
| `associationNeighborDependencyDepth` | number | 0 | 从 association 邻居再向上游扩展的深度 |

- **`profile` 可选值**：`implementation-design`、`coding-repair`、`audit`、`generic-agent`
- **校验**：仅校验 focus element 可解析；不执行 mutation 校验链
- **典型调用方**：`IntentionDesign`（意图审计）、`ImplementationDesign`（实现范围解读）、`CodingAndReparing`（多元素修复队列与回归定位）

---

### 2. 校验与门禁

| 工具 | 写入 | 校验对象 | 典型用途 |
| --- | ---: | --- | --- |
| `validateSystemArchitecture` | 否 | 固定路径 `design/KG/SystemArchitecture.json` | 全量 schema + 图语义 + ArchiMate 端点矩阵 + view 规则 |
| `validateStageHandoff` | 否 | 阶段交接 JSON | 意图 → 实现 / 实现 → 编码 handoff 协议门禁 |
| `validateTraceProposal` | 否 | `ImplementationToIntentTraceProposal.json` | 实现侧发现意图缺口时的追溯提案校验 |
| `runArchitectureTests` | 是（失败记录 + 图谱交付状态） | 意图图谱中的显性 testcase | 执行全量 architecture testcase，刷新 `test-failure-records.json`，并按测试结果重算元素 `deliveryStatus` |

#### `validateSystemArchitecture`

- **参数**：无（不暴露 `architecturePath`，固定校验项目图谱）
- **校验项**：JSON Schema、元素/关系 ID 唯一、ArchiMate 元素/关系类型、端点存在与名称匹配、ArchiMate 3.2 关系矩阵、顶层 view 唯一且名为 `SystemArchitecture`、子 view 挂载、view 成员引用、关系端点共现、元素/关系至少属于一个 view、每 view 最多 7 个元素
- **失败**：`status: failed`，错误列表输出到 payload / stderr；**无** mutation 式 `guidance`

#### `validateStageHandoff`

- **参数**：`stage`（可选）— `intent-to-implementation` 或 `implementation-to-coding`；省略则校验全部支持阶段
- **意图相关**：`intent-to-implementation` 校验 `.argo/temp/IntentToImplementationHandoff.json` 与意图元素 scope 的一致性；每个 `intentElementIds` 指向的元素必须存在，并且必须在该元素下挂载 testcase
- **实现相关**：`implementation-to-coding` 校验 `.argo/temp/ImplementationToCodingHandoff.json` 中的实现契约路径、显性 entrypoint、控制点、观测点、初始执行状态、失败记录路径、编码目标和任务执行计划；显性 entrypoint 必须与 `SystemArchitecture.json` 中同名 testcase 的 `acceptanceCriteria` 对齐
- **旧字段拦截**：`IntentToImplementationHandoff.json` 不允许携带 `explicitTestcases`、`frozenBaselines`、`requiredImplementationArtifacts` 等旧字段；显性 testcase 基线必须挂载在意图图谱元素下

#### `validateTraceProposal`

- **参数**：`proposalPath`（可选，默认 `design/KG/ImplementationToIntentTraceProposal.json`）
- **意图相关**：实现阶段发现意图缺口时，由 `ImplementationDesign` 产出提案；`IntentionDesign` 消费并决定是否回写意图图谱
- **当前硬约束**：`proposalType=implementation-to-intent-trace`、`sourceAgent=ImplementationDesign`、`targetAgent=IntentionDesign`、`lifecycle=temporary-trace-proposal`；`implementationElementKind` 仅支持 `stable-directory`、`contract-file`、`explicit-test-entry`、`critical-guardrail`、`runtime-component`、`schema-contract`、`mcp-tool`、`command`；`implementsType` 仅支持 `direct` / `indirect`

#### `runArchitectureTests`

- **参数**：`architecturePath`（可选，默认 `design/KG/SystemArchitecture.json`）
- **意图相关**：testcase 定义挂载在意图元素 `testcases` 数组上；`acceptanceCriteria` 必须是单个 workspace-relative 测试入口路径，不允许写成 `node ...`、`npm ...`、带参数命令或 shell 串联命令
- **执行器**：默认执行器始终加载，`.argo/scripts/test-executors/` 下可发现额外执行器；自定义执行器优先，默认执行器兜底
- **写入副作用**：结果写入 `design/KG/test-failure-records.json`；同时按“自身 testcase 全部通过 + 已有 testcase 的上游依赖均 delivered”固定点规则重算各元素 attributes 中的 `deliveryStatus=delivered`，必要时回写 `design/KG/SystemArchitecture.json`
- **进度**：通过 `[PROGRESS]` 行向 MCP progress notification 转发执行进度；失败记录供 `CodingAndReparing` 修复队列使用

---

### 3. 图谱变更（批量 mutation）

| 工具 | 写入 | 说明 |
| --- | ---: | --- |
| `previewSystemArchitectureMutation` | 否 | 干跑：应用 mutations 后运行当前 mutation 校验链，**不**写文件 |
| `applySystemArchitectureMutation` | 是 | 原子写入：校验通过后一次性写入图谱 |

#### 共用参数

- `architecturePath`（可选，默认 `design/KG/SystemArchitecture.json`）
- `mutations`：非空数组，每项须含 `type`
- mutation 工具返回 `status`、`written`、`graphPath`、`schemaPath`、`mutations`、`touchedElementIds`、`touchedRelationshipIds`、`touchedViewIds`、`viewLimitCheckIds`、`before`、`after`、`errors`；失败时附带 `guidance`

#### 支持的 mutation `type`

| type | 说明 |
| --- | --- |
| `addElement` | 新增元素或把已有元素加入 `view_ids` |
| `updateElement` | 全局元素 metadata patch（`id` / `type` 不可变） |
| `removeElement` | 从指定 view 或全图删除元素，可级联关系 |
| `addRelationship` | 新增关系或把已有关系加入 view |
| `updateRelationship` | 关系 metadata patch（`id` / `type` 不可变） |
| `removeRelationship` | 从指定 view 或全图删除关系 |
| `addView` | 新增 view（须遵守顶层/子 view 规则） |
| `updateView` | view metadata 或成员 patch |
| `removeView` | 删除 view（剩余元素/关系仍须至少属于一个 view） |

#### 推荐流程

```
getSystemArchitecture
  → previewSystemArchitectureMutation（复杂或多步变更）
  → applySystemArchitectureMutation
  → validateSystemArchitecture
```

当前 mutation 校验链：完整 JSON Schema + 完整核心图语义校验；ArchiMate 3.2 endpoint matrix 只检查本次触达的 relationship；view 元素数上限只检查本次新增或显式替换 `included_elements` 的 view。`previewSystemArchitectureMutation` 不写文件；`applySystemArchitectureMutation` 仅在全部校验通过后通过临时文件 + rename 原子写入。失败时 mutation 类工具返回 `errors` + `guidance`（见 `design/validator/intent-architecture-mcp-validation.md` 失败引导映射）。

---

### 4. 图谱变更（Focused 单操作）

Focused 工具将单步操作转换为 mutation，复用同一套 mutation 校验链；简单增删改优先使用此类工具。当前 focused 工具均支持可选 `dryRun: true`：校验并返回结果但不写图谱；未设置或为 `false` 时，校验通过后写入。

#### 元素

| 工具 | 必填参数 | 要点 |
| --- | --- | --- |
| `addArchitectureElement` | `element`, `view_ids` | 元素不得脱离 view 存在；已有元素会被加入指定 view |
| `updateArchitectureElement` | `id`, `patch` | 不改 view membership；不改 `id` / `type`；如更新 `name`，相关 relationship 的 `source_name` / `target_name` / `statement` 需同步处理 |
| `removeArchitectureElement` | `id` | 可选 `view_ids`：仅从这些 view 移除并级联关系；无则全图删除 |

#### 关系

| 工具 | 必填参数 | 要点 |
| --- | --- | --- |
| `addArchitectureRelationship` | `relationship`, `view_ids` | `relationship.type` 为 ArchiMate 3.2 关系类型，校验端点元素类型；不会自动把端点元素加入 view，端点共现缺失会校验失败 |
| `updateArchitectureRelationship` | `id`, `patch` | 可 patch `name`, `statement`, `source_name`, `target_name` 等 |
| `removeArchitectureRelationship` | `id` | 可选 `view_ids` 限定移除范围 |

#### View

| 工具 | 必填参数 | 要点 |
| --- | --- | --- |
| `addArchitectureView` | `view` | 全图仅一个顶层 view 名为 `SystemArchitecture`；子 view 须 `parent_element_id` |
| `updateArchitectureView` | `view_id`, `patch` | 更新成员时仍须满足引用存在、端点共现、元素数上限 |
| `removeArchitectureView` | `view_id` | 删除后每个元素/关系仍须至少属于一个 view |

以上 focused 工具均支持可选 `architecturePath`（主要用于测试或临时图谱）和 `dryRun`（预演但不写入）。

---

### 5. 可视化与分析

| 工具 | 写入 | 说明 |
| --- | ---: | --- |
| `generateArchitectureDiffPlantuml` | 是 | 对比 `SystemArchitecture.json` 的 git HEAD 与工作区 diff，生成带时间戳的 PlantUML Markdown 树 |

- **参数**：`architecturePath`（可选）、`outputDir`（可选，默认 `.argo/temp/architecture_analysis`）
- **典型调用方**：`/task-tidy` 流程末尾、Skill `/architecture-diff-plantuml`
- **输出内容**：变更元素/关系、依赖树、Sequential Gravity Chain、G 估算相关可视化

---

### 6. 工作区初始化（间接相关）

| 工具 | 说明 |
| --- | --- |
| `initializeWorkspace` | 复制 EA 模板（`.feap`）、重置 `.argo/temp/IntentToImplementationHandoff.json` 与 `ImplementationToCodingHandoff.json` |

意图架构图谱本身不由该工具生成，但会清理意图侧阶段交接 artifact，属于新工作区 bootstrap 步骤。

---

## 阶段与 Skill 绑定

| 阶段 / 角色 | 主要 MCP 工具 | 对意图架构的操作 |
| --- | --- | --- |
| `BusinessPartner` | （间接）读取图谱 | 分析时考察意图架构，不直接 mutation |
| `TaskTidyGraphIntegrator` | `preview*` / `apply*` / focused mutation 系列 | 将决策树内化进 `SystemArchitecture.json` |
| `/task-tidy` | 同上 + `generateArchitectureDiffPlantuml` | 验收整合后 apply 图谱，输出 diff 可视化 |
| `IntentionDesign` | `preview*` → `apply*` → `validateSystemArchitecture` → `validateStageHandoff`；`getIntentElementContext` | **唯一**常规写入意图图谱的阶段 Agent |
| `ImplementationDesign` | `getIntentElementContext`、`validateStageHandoff`、`validateTraceProposal` | 只读意图上下文；发现缺口写 trace proposal，不直接改图谱 |
| `CodingAndReparing` | `getIntentElementContext`、`runArchitectureTests` | 只读意图子图；执行挂载在意图上的显性 testcase |
| `ReverseArchitectureExtraction` | 候选报告 → `IntentionDesign` | 候选意图架构经语义门禁后由 `IntentionDesign` 通过 MCP 写入 |
| `Orchestrator` | 调度上述阶段 | 图谱 proposal 未 apply 时路由回 `IntentionDesign` |

---

## 典型工作流

### 新需求内化（`/business-partner` → `/task-tidy`）

```
BusinessPartner 产出 DecisionTreeRecord
  → task-tidy 写入 .argo/temp/decision-tree/*.md
  → TaskTidyGraphIntegrator：
       getSystemArchitecture
       → previewSystemArchitectureMutation / focused tools
       → applySystemArchitectureMutation
       → validateSystemArchitecture
  → generateArchitectureDiffPlantuml
```

### 意图设计闭环（`IntentionDesign`）

```
识别 EVENT（新需求 / 意图审计 / handoff 阻塞 / 候选意图架构）
  → getSystemArchitecture / getIntentElementContext
  → previewSystemArchitectureMutation
  → applySystemArchitectureMutation
  → validateSystemArchitecture
  → validateStageHandoff（intent-to-implementation）
```

### 实现阶段读意图（`ImplementationDesign`）

```
收到 IntentToImplementationHandoff
  → validateStageHandoff
  → getIntentElementContext（profile: implementation-design）
  → 若发现意图缺口：validateTraceProposal（提案侧）→ 上报 IntentionDesign
```

### 编码阶段验收（`CodingAndReparing`）

```
getIntentElementContext（多元素修复或回归定位）
  → runArchitectureTests
  → 刷新 test-failure-records 与元素 deliveryStatus
  → 按 test-failure-records 修复（不得改冻结显性 testcase 入口）
```

---

## 校验与失败引导速查

完整校验矩阵见 `design/validator/intent-architecture-mcp-validation.md`。高频约束摘要：

| 约束 | 说明 |
| --- | --- |
| 元素/关系必须属于 ≥1 个 view | add 时必传 `view_ids` |
| 顶层 view 唯一 | 名称必须为 `SystemArchitecture` |
| 子 view | 必须声明有效 `parent_element_id` |
| 每 view ≤ 7 个元素 | 超出须拆分为分层子 view |
| 关系端点共现 | view 含关系则必须同时含 source 与 target 元素 |
| ArchiMate 3.2 矩阵 | 关系类型须与端点元素类型合法配对 |
| 不可变字段 | element/relationship 的 `id`、`type` 不可 patch，须 remove + add |

mutation 失败时的 `guidance` 关键字映射（如 `violates ArchiMate 3.2 relationship matrix`、`must contain at most 7 elements`）见校验归档文档「失败引导映射」一节。

---

## 完整工具名清单（19 个）

按当前统一 `argo` MCP `tools/list` 去重后返回顺序：

1. `initializeWorkspace`
2. `validateStageHandoff`
3. `validateTraceProposal`
4. `runArchitectureTests`
5. `generateArchitectureDiffPlantuml`
6. `getSystemArchitecture`
7. `getIntentElementContext`
8. `previewSystemArchitectureMutation`
9. `applySystemArchitectureMutation`
10. `addArchitectureElement`
11. `updateArchitectureElement`
12. `removeArchitectureElement`
13. `addArchitectureRelationship`
14. `updateArchitectureRelationship`
15. `removeArchitectureRelationship`
16. `addArchitectureView`
17. `updateArchitectureView`
18. `removeArchitectureView`
19. `validateSystemArchitecture`

其中 **1** 为工作区 bootstrap；**2–5、19** 为校验、测试与可视化；**6–7** 为只读查询；**8–18** 为图谱 mutation（**8–9** 批量，**10–18** focused）。`validateSystemArchitecture` 排在末尾是 `tools/list` 去重覆盖后的实际顺序，不影响调用语义。

---

## 相关文档

- [ARGO 领域本体与 Agent 行为：认知规格与事件驱动交付](ARGO%20领域本体与%20Agent%20行为：认知规格与事件驱动交付.md) — MCP 与 Behavior 绑定表
- [ARGO HARNESS 的 ArchiMate 建模理念](ARGO%20HARNESS%20的%20ArchiMate%20建模理念.md) — 意图分层与 view 建模约定
- [ARGO 工程哲学：确定性交付公式的工程化](ARGO%20工程哲学：确定性交付公式的工程化.md) — 意图架构在交付闭环中的位置
- `design/validator/intent-architecture-mcp-validation.md` — 校验触发环节与失败引导明细
- `README.md` — 平台部署与 MCP 注册说明

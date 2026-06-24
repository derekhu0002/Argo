# ARGO 领域本体与 Agent 行为：认知规格与事件驱动交付

ARGO 的三阶段 Agent——`IntentionDesign`、`ImplementationDesign`、`CodingAndReparing`——不只靠自然语言提示约束行为。每个 Agent 规格内嵌两套互补结构：

- **Domain Ontology（领域本体）**：定义 Agent 如何理解交付世界——有哪些概念、它们如何关联、哪些逻辑规则优先。
- **Behavior（事件驱动行为流）**：定义 Agent 如何行动——收到什么事件、允许改哪些对象、必须走哪些校验与交接。

本体回答“世界是什么”；行为回答“在此世界下能做什么”。二者共同构成 ARGO 的 **认知规格（cognitive specification）**，与仓库中的事实源、validator 和 MCP 工具链对齐，而不是游离于代码与图谱之外的口头约定。

本文与《[ARGO 工程哲学：确定性交付公式的工程化](ARGO%20工程哲学：确定性交付公式的工程化.md)》互补：工程哲学解释 **为什么** 需要确定性交付系统；本文解释 **如何** 把该思想落到 Agent 可执行的认知与行为层。

---

## 为什么需要本体，而不只是更好的 Prompt

传统 AI Coding 常把阶段边界写进 system prompt：“你是架构师，不要改代码”。这类约束有三个结构性弱点：

1. **概念不共享**：同一词（如“验收测试”“架构元素”）在不同会话中语义漂移，Agent 与 human partner 对“完成”的理解不一致。
2. **优先级不明**：当意图图谱、实现契约与当前代码冲突时，prompt 很少能稳定声明“谁覆盖谁”。
3. **偏航难审计**：Agent 越权修改冻结测试、跳过 human approval、用文档代替 testcase 覆盖时，缺少可映射的违规类型。

ARGO 的做法是把交付链路中的 **事实源** 抽象为分层本体，并在 PlantUML 类图与 note 中写入 **Logic rules**。这些规则是硬约束，不是风格建议。Agent 读取、变更、校验的对象都必须能指回本体内的实体类型。

这与 DDD 的意图一致：领域概念、业务能力、约束、关系和边界应成为 **稳定上下文**，而不是散落在一次性对话里。区别是 ARGO 把该上下文 **操作化**——每个阶段知道读写哪一层本体、哪一层只读、哪一层禁止触碰。

---

## 分层本体：从意图到修复队列

各阶段 Agent **共享** 同一套分层本体，但 **变更职责** 随阶段收紧。下表概括各层核心概念、主要事实源与设计要点。

| 本体层 | 核心概念 | 主要事实源 | 设计要点 |
| --- | --- | --- | --- |
| **Intent Ontology** | `IntentArchitecture`、`ArchitectureEntityElement`、`FunctionalPoint`、`ExplicitAcceptanceTestcase`、ArchiMate 关系与 view | `design/KG/SystemArchitecture.json` | 意图原则、约束、显性语义与验收 testcase **优先于** 当前代码现实；元素语义来自图谱结构、方向与 view，而非名称猜测 |
| **Implementation Ontology** | `StableArchitectureElement`、`ImplementationContract`、`ImplementsMapping`、`ImplementationGuardrail` | `OVERALL_ARCHITECTURE.md`、局部 `ARCHITECTURE.md` | 稳定元素是高层边界而非文件镜像；目录层级默认表示包含关系，间接实现链须由契约显式声明 |
| **Code Ontology** | `CodeReality`、`RepositoryArtifact`、`ProductionBehavior` | 业务代码、脚本、配置、文档 | 代码现实可证明实现状态，也可与契约/意图发生 **ArchitectureDrift** |
| **Coverage Ontology** | `DependencySubgraph`、`CoverageMatrix` | 意图元素依赖子图 + 挂载 testcase | 覆盖须逐元素证明：每个 `functionalPoint` 映射到**同元素下**已挂载的显性 testcase；文档、校验通过结果不能替代覆盖证据 |
| **Test Ontology** | `ExplicitTestcaseEntrypoint`、`CriticalNonExplicitTest`、`BusinessReadableAssertion` | 实现设计阶段物理化的测试入口 | 显性 testcase 一人一入口、GIVEN/WHEN/THEN、Harness 抽象；关键非显性测试在编码阶段只读冻结 |
| **Handoff Ontology** | `IntentToImplementationHandoff`、`ImplementationToCodingHandoff` | `design/KG/*Handoff.json` | 阶段交接是协议对象，须经 `validateStageHandoff` 校验后才能驱动下游 |
| **Repair / Forbidden Shortcut Ontology** | `RepairTask`、`TestFailureRecord`、`TestOnlyBusinessCodeShortcut` | `test-failure-records.json`、失败记录 | 修复队列来自 handoff 与失败记录；禁止用测试桩、后门或 mock 假通过污染 `ProductionBehavior` |

### 意图层：图谱即规格，而非注释

Intent Ontology 的锚点是 `SystemArchitecture.json`。其中：

- **ArchitectureEntityElement** 承载业务能力与可观察边界（`FunctionalPoint`）。
- **ExplicitAcceptanceTestcase** 必须挂载在 **拥有该验收边界的元素** 下；上游元素的 testcase 不能挂在 focus 元素下冒充覆盖。
- **TraceabilityPointer** 把需求来源、文件引用、browser path 与 acceptance criteria 绑回图谱，避免“文档写了、图谱没写”的双源事实。

关键 Logic rule：**意图原则、约束、显性语义与显性 testcase 优先于当前代码现实。** 代码可以证明“已经实现”，但不能无声覆盖尚未批准的意图变更。

### 实现层：契约定义合法结构

Implementation Ontology 把意图落盘为可导航的仓库结构：

- `OVERALL_ARCHITECTURE.md` 是唯一的根契约（`RootImplementationContract`）。
- 局部 `ARCHITECTURE.md` 声明目录级稳定元素、依赖方向与测试归属，但不重复根级规则。
- `ImplementsMapping` 显式连接 `StableArchitectureElement` 与 intent element，允许间接实现链，但每一跳须在契约中可见。

稳定元素刻意 **不是** “每个源文件一个元素”。ARGO 用 Deep Module 思想：Agent 应在少量清晰边界内工作，而不是在文件海洋中盲目搜索。

### 覆盖层：证明，而非叙述

Coverage Ontology 是意图设计阶段最容易被“口头完成”的一层。ARGO 要求：

1. 对需下游实现的 focus 元素，递归探索 **DependencySubgraph**，直到已实现的边界节点。
2. 对子图中 **每一个** `ArchitectureEntityElement`，列出其全部 `functionalPoint` 与同元素下挂载的 `ExplicitAcceptanceTestcase` id，并建立逐点映射。
3. 需求文档、方案文档、`validateSystemArchitecture` 通过、linter 清洁 **均不能** 替代同元素挂载 testcase 的覆盖证据。
4. 排除覆盖须有 evidence-backed 理由。

这使“意图设计完成”从主观判断变为 **CoverageMatrix 可检验命题**。

### 测试层：入口冻结与业务可读断言

Test Ontology 连接意图验收与编码修复：

- 每个显性 acceptance testcase 物理化为 **单一** `ExplicitTestcaseEntrypoint`，编码阶段只读调用。
- 断言体使用 GIVEN/WHEN/THEN 与 Harness 抽象，失败类别须表达业务含义。
- `CriticalNonExplicitTest`（架构边界、依赖方向、入口正确性、关键追踪性等护栏）在编码阶段冻结；`SupportingNonExplicitTest` 可在契约允许范围内演进。

实现设计阶段运行物理化入口，区分 pass、expected failure 与 design blocker；expected failure 写入 `test-failure-records.json`，成为编码阶段的 **RepairTask** 输入。

### 编码层：真实行为与禁止捷径

Coding/Repair 阶段的本体扩展强调 **ProductionBehavior** 与 **Forbidden Shortcut**：

- 修复须改变真实生产行为，而不是在测试里加 stub、分支、后门或 mock 假通过。
- `ArchitectureDrift` 必须被追踪到 violated contract 或 conflicting code reality，再决定最小修复范围。
- 外部接口变更时，须同步 `INTRODUCTION.md`，保持对外契约与实现一致。

---

## 行为：事件驱动、本体锚定的动作流

若本体是静态认知图，**Behavior** 则是 Agent 在该认知图上的 **状态机**。三阶段 Agent 的 Behavior 段用 PlantUML activity 图描述，结构一致：

```mermaid
flowchart LR
    E[EVENT 识别] --> G[阶段守卫 / guardrails]
    G --> A[acts on 本体实体]
    A --> V[MCP 校验 / validate]
    V --> H[Handoff 或持久化记忆]
    classDef event fill:#fef3c7,stroke:#d97706,color:#78350f
    classDef guard fill:#fce7f3,stroke:#db2777,color:#831843
    classDef act fill:#eff6ff,stroke:#2563eb,color:#1e3a8a
    class E event
    class G guard
    class A,V,H act
```

### `[acts on: …]`：把动作绑回本体

Behavior 流中 **每一步** 都标注 `[acts on: EntityA, EntityB, …]`，声明该动作读取、变更或校验哪些本体实体。意义在于：

- **越权可定位**：若 Agent 修改了 `CodeReality` 却未读取 `ImplementationToCodingHandoff`，行为规格已声明违规类型。
- **交接可审计**：写 handoff 前必须满足本体 Logic rules（如 coverage proof、human approval），而不是“感觉可以交了”。
- **复盘可沉淀**：重复出现的 guardrail 违反可映射到具体 `[acts on]` 步骤，经 `/distill-agent-rules` 固化为 SKILL/RULE/hook。

### 典型 EVENT 与阶段边界

| 阶段 Agent | 典型 EVENT | 可变更本体 | 禁止越权 |
| --- | --- | --- | --- |
| `IntentionDesign` | 新任务/需求、意图审计、handoff 阻塞修复 | `SystemArchitecture.json`、意图侧 handoff | 不得修改业务代码、测试代码、实现契约（除非用户显式要求） |
| `ImplementationDesign` | 收到 intent handoff、实现架构审计、测试入口缺口 | 实现契约、物理化 testcase 入口、实现 handoff | 不得直接改意图图谱；发现意图缺口应上报或写 `ImplementationToIntentTraceProposal` |
| `CodingAndReparing` | 修复队列、架构测试回归、测试环境阻塞 | `ProductionBehavior`、契约允许的源码与支持性测试 | 不得改冻结显性入口与关键非显性测试；不得跳过 handoff 直接补丁 |

各阶段还有共同的 **stage guardrails**，例如：证据耗尽后再问用户；每个问题须带推荐答案与理由；测试环境阻塞时停止并求助 human partner，而不是跳过测试。

### 与 MCP 工具链的绑定

Behavior 不是纸面流程，与 **argo MCP** 工具一一对应：

| 工具 | 行为阶段 | 作用 |
| --- | --- | --- |
| `getIntentElementContext` | 意图 / 实现 / 编码 | 读取 focus 元素的依赖子图，支撑覆盖与修复顺序 |
| `previewSystemArchitectureMutation` / `applySystemArchitectureMutation` | 意图 | 预览并应用意图本体变更 |
| `validateSystemArchitecture` | 意图 | schema 与 ArchiMate 语义校验 |
| `validateStageHandoff` | 意图 → 实现、实现 → 编码 | 交接协议门禁 |
| `runArchitectureTests` | 编码 | 全量显性 architecture testcase，刷新失败记录 |

会话级未闭合决策与风险写入 `design/persistant-memory/` 下各阶段文件（`intention-design.md`、`implementation-design.md`、`coding-and-repairing.md`），供后续迭代读取，并作为 `/distill-agent-rules` 的复盘输入。

---

## 本体 × 行为 × 工程哲学：如何共同提高确定性

把本体与行为写进 Agent 规格，是对 ARGO 确定性公式中 **P（协议规范）** 与 **B（边界约束力）** 的具体化：

| 公式因子 | 本体与行为的贡献 |
| --- | --- |
| **P** | 分层本体把意图图谱、实现契约、handoff、测试入口定义为 **可校验协议对象** |
| **B** | Behavior 的 EVENT、guardrails 与 `[acts on]` 把阶段边界从提示变成 **可阻断的状态机** |
| **C** | 意图层 FunctionalPoint 与 ExplicitAcceptanceTestcase 把业务目标绑到可观察边界 |
| **G** | Handoff 按 architecture-element 粒度切分交付范围，Behavior 按依赖子图排序修复 |
| **E** | 稳定本体减少 Agent 在文件级盲目搜索；Deep Module 式契约提高有效上下文密度 |

四者形成闭环：

1. **降低语义漂移** — Agent 共享概念与优先级，减少双源事实。
2. **让偏航可定位** — 违规映射到 Logic rule 或 `[acts on]` 步骤。
3. **支撑可回归交付** — validator + testcase + 失败记录构成客观完成标准。
4. **连接复盘自进化** — 稳定复现的守卫经 `/distill-agent-rules` 固化，并从 persistent memory 清理，避免与内嵌 Behavior **双重生效**。

---

## 与事实源、Skill、SubAgent 的关系

本体与行为规格 **不替代** 仓库事实源，而是规定 Agent 如何读写它们：

```
BusinessPartner / task-tidy
        ↓ 内化
Intent Ontology (SystemArchitecture.json)
        ↓ IntentToImplementationHandoff
Implementation Ontology + Test Ontology (contracts, entrypoints)
        ↓ ImplementationToCodingHandoff
Code Ontology + Repair Ontology (ProductionBehavior, failure records)
        ↓ runArchitectureTests
双层验收 (意图侧 / 实现侧)
```

- **Skill**（如 `/task-tidy`、`/distill-agent-rules`）处理横切流程：意图内化、行为复盘固化。
- **SubAgent** 内嵌完整 Domain Ontology + Behavior，承担阶段内闭环。
- **Orchestrator** 负责阶段调度与双向审计，但不直接替代三阶段本体的变更规则。

`/improve-codebase-architecture` 等辅助 Skill 使用的 shallow/deep module、seam 等术语，是 **分析语言**，不能覆盖 ARGO 本体语义；涉及 intent、handoff、explicit testcase 时，仍以本文与 Agent 规格为准。

---

## 如何阅读完整规格

各阶段 Agent 定义中包含完整 PlantUML **Domain Ontology** 类图（含 Logic rules note）与 **Behavior** activity 图：

- `.cursor/agents/IntentionDesign.md`
- `.cursor/agents/ImplementationDesign.md`
- `.cursor/agents/CodingAndReparing.md`

Copilot 与 OpenCode 版路径相同（`.github/agents/`、`.opencode/agents/`）。

修改 Agent 认知或行为时，应 **同步更新** 本体图、Behavior 流、相关 validator 与 MCP 工具期望，并视需要刷新本文与 README 引用，避免“Agent 规格、工具链、对外文档”三者漂移。

---

## 结语

ARGO 不把 Agent 当作“会写代码的聊天对象”，而把它当作在 **共享本体** 上执行 **事件驱动行为** 的交付角色。

本体让 AI 知道世界如何组织、什么证据算数；行为让 AI 知道当前事件下能改什么、必须验什么、何时必须停下来问人。二者与图谱、契约、测试和 validator 一起，构成 ARGO 区别于“更强 prompt”的 **认知工程层**——也是意图设计、实现设计、编码修复三阶段能够分工、交接、审计与回归的根基。

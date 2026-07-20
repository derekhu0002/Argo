# oh-my-openagent 确定性交付公式评估与 ARGO 差异对比

> 评估基准：《ARGO 工程哲学：确定性交付公式的工程化》  
> 被评估项目：`D:\Projects\oh-my-openagent`  
> 评估日期：2026-07-20  
> 评估方式：静态架构与流程取证，未运行被评估项目测试或真实 harness QA。

## 1. 结论摘要

`oh-my-openagent`（下文简称 OMO）是一套偏执行增强型的 AI Agent Harness。它的核心目标不是像 ARGO 一样把业务意图、架构契约、阶段 handoff、冻结测试和人类门禁组织成强治理闭环，而是尽可能降低人类参与成本，让 Agent 通过多模型调度、hook、技能、MCP、LSP、Hashline、Team Mode、Todo/Goal continuation、QA evidence gate 和跨平台 CI 自主完成更大范围任务。

用 ARGO 的确定性交付公式看：

$$Total Certainty = C \times \frac{(P \cdot \mathbf{B}) \times E}{G}$$

OMO 的优势集中在 **E（模型能效）** 与部分 **B（工具级/测试级边界约束）**：它通过多模型路由、专用 agent、LSP/AST/Hashline、hook、runtime fallback、QA evidence 和 CI 提升 Agent 执行质量。它对 **C（目标清晰度）** 有 Prometheus interview、IntentGate、Metis/Momus/Oracle plan review 等机制，但这些机制主要沉淀在 `.omo/plans`、notepads、AGENTS.md 和 markdown 文档中，缺少 ARGO 式长期结构化意图图谱。它对 **P（协议规范）** 有大量 repo 指令、rules、AGENTS.md、config schema 和 package layering 约束，但协议更多是行为提示和代码约束，而不是可验证的业务/架构事实源。它对 **G（任务颗粒度）** 的态度与 ARGO 明显不同：OMO 倾向让 Agent 接手大任务并用内部编排消化复杂度；ARGO 则倾向由人类按依赖顺序拆小范围逐个交付。

因此，OMO 更像“高执行力、多工具、多模型的 Agent 操作系统”；ARGO 更像“高确定性、强阶段、强契约的 AI 交付治理系统”。两者可以互补，但治理假设相反：OMO 认为人类介入是失败信号；ARGO 认为人类在关键验收点是确定性的校准器。

## 2. 关键证据

本次评估主要读取了以下证据源：

| 证据源 | 观察 |
| --- | --- |
| `README.md` | 项目定位为 multi-harness agent OS，提供 Ultimate/OpenCode 与 Light/Codex 两种版本，强调 `ultrawork`、Team Mode、Hashline、LSP、Rules Injection、Goal/Todo Enforcer、Prometheus Planner。 |
| `ROADMAP.md` | 明确写出“human is not the worker, agent is the worker”，当前优先包分层重构：Core、MCP、Skills、Adapters、Platform、Web。 |
| `docs/manifesto.md` | 明确主张“Human Intervention is a Failure Signal”，目标是人类只表达 intent，Agent 完成执行与验证。 |
| `docs/guide/orchestration.md` | 规划层 Prometheus + Metis + Momus + Oracle，执行层 Atlas，worker 层 specialized agents；计划写入 `.omo/plans`，执行状态写入 `.omo/boulder.json` 与 `.omo/notepads`。 |
| `AGENTS.md` | 定义强 QA 纪律：OpenCode/Codex 相关变更必须运行对应 QA skill 并把证据写入 `.omo/evidence/<date>-<slug>/`；同时维护大量架构 invariants 和 anti-patterns。 |
| `.github/workflows/ci.yml` | Linux/macOS/Windows 矩阵执行 `bun test`、`bun run typecheck`、`bun run test:codex`、Senpi compatibility、build、published LazyCodex smoke 等。 |
| `package.json` 与 `packages/AGENTS.md` | Monorepo 包结构清晰：19 Core、3 MCP、5 Adapters、1 Skills、1 Web、12 Platform launcher packages。 |
| `.omo/rules/test-discipline.md` | 测试纪律很强，禁止 flaky、顺序依赖、文本 pinning 等伪覆盖。 |
| `ulw-loop`、`boulder` 与 schema 测试 | OMO 有持续执行状态、质量门禁 JSON、schema freshness、package layering guard 等运行期/CI 级协议，但这些协议不等同于 ARGO 的意图图谱和阶段 handoff ontology。 |
| 文件查找结果 | 未发现 `SystemArchitecture.json`、`OVERALL_ARCHITECTURE.md`、局部 `ARCHITECTURE.md`、`IntentToImplementationHandoff.json`、`ImplementationToCodingHandoff.json` 等 ARGO 式事实源和阶段 handoff。 |

## 3. 按确定性交付公式评估

### 3.1 C：目标清晰度

**OMO 现状：中高。**

OMO 提供三类提高清晰度的机制：

1. `IntentGate`：在行动前识别用户真实意图，区分 `ultrawork`、search、analyze、team 等模式。
2. Prometheus interview：复杂任务可先进入规划模式，由 Prometheus 访谈、研究代码、提出问题并写 `.omo/plans/*.md`。
3. Metis/Momus/Oracle review：在高准确度规划中，Metis 做 gap analysis，Momus 和 Oracle 对 plan 做并行评审。

这说明 OMO 并非完全“直接执行”，它也承认需求澄清和计划质量重要。但与 ARGO 相比，OMO 的 C 主要停留在 **会话级计划和 markdown 状态**，而不是长期稳定的领域事实源。计划、notepad、boulder state 可以提升当前任务清晰度，但较难像 ARGO 的 `SystemArchitecture.json` 那样承载跨迭代、跨阶段、跨团队的意图结构。

**与 ARGO 差异：**

| 项 | OMO | ARGO |
| --- | --- | --- |
| 需求入口 | `ultrawork` 直接执行，或 Prometheus interview 规划 | `BusinessPartner` / `/business-partner` 前置拷问 |
| 目标沉淀 | `.omo/plans`、notepads、AGENTS.md、boulder state | `SystemArchitecture.json`、DecisionTreeRecord、ExplicitAcceptanceTestcase |
| 人类角色 | 尽量减少介入，复杂场景中确认计划 | 在业务目标、验收边界、依赖顺序上承担校准职责 |

### 3.2 P：协议规范

**OMO 现状：中高，但偏执行协议。**

OMO 的协议资产非常丰富：

- `AGENTS.md` 描述代码库结构、初始化流、hook handler、tool catalog、architecture invariants、开发约定和 anti-patterns。
- `packages/AGENTS.md` 描述分层包结构与 role map。
- `.omo/rules/*.md` 可被 rules-injector 注入，提供 repo 级行为约束。
- 配置体系使用 JSONC + Zod schema，且 CI 可自动刷新 schema。
- Skills、commands、hooks、MCP、agent configs 形成稳定的执行协议。
- `ulw-loop` 质量门禁、`boulder` 连续执行状态、schema freshness 与 package layering guard 形成 CLI/CI 级协议。

这些协议对 Agent 写代码、跑测试、接入 harness、避免误操作很有价值。但它们更多约束“Agent 如何执行”和“代码如何组织”，而不是约束“业务意图是什么、架构关系是什么、当前交付范围与上层意图如何追踪”。

**与 ARGO 差异：**

| 项 | OMO | ARGO |
| --- | --- | --- |
| 协议中心 | `AGENTS.md`、rules、skills、config schema、hook pipeline | 意图图谱、实现架构契约、阶段 handoff、显性测试入口 |
| 协议形态 | Markdown 指令 + 代码 schema + hook 运行时 | ArchiMate-like 结构化图谱 + JSON Schema + validator |
| 主要约束对象 | Agent 行为、工具调用、package layering、测试纪律 | 业务意图、架构边界、测试归属、阶段责任 |

### 3.3 B：边界约束力

**OMO 现状：高，但主要在工具/执行层。**

OMO 的硬边界比一般 harness 强得多：

- `write-existing-file-guard` 防止未读先写。
- `prometheus-md-only` 限制 Prometheus 只能写 markdown。
- Hashline edit 使用 `LINE#ID` content hash 拒绝 stale edit。
- `comment-checker` 阻断 AI slop comments。
- LSP diagnostics、AST-grep、typed schema、strict TypeScript、package registration audit、raw promptAsync audit 等形成机器可检验边界。
- OpenCode/Codex 相关变更必须运行真实 harness QA，并把证据写入 `.omo/evidence`。
- CI 在多 OS 上执行 test/typecheck/build/Codex/Senpi compatibility。

这些边界能有效降低代码层偏航、工具误写、测试伪绿和运行时破坏。它们对应 ARGO 公式中的 B，且强度很高。

但 OMO 的 B 主要拦截 **实现执行偏差**，而非 **阶段越权和意图污染**。例如没有 ARGO 式“编码阶段不得修改冻结测试和架构契约”的结构化 handoff 边界，也没有“实现发现意图追踪缺口必须回流 IntentionDesign”的正式 trace proposal 流程。OMO 有 Prometheus/Atlas/Junior 的角色约束，但整体仍服务于“Agent 自主完成”，不是“每一层事实源只能由对应阶段 Agent 变更”。

### 3.4 E：模型能效

**OMO 现状：很高。**

这是 OMO 最突出的维度。它通过以下机制显著提升有效模型能效：

- 多模型/多 provider fallback：按 agent 与 category 选择不同模型。
- 专用 agent：Sisyphus、Hephaestus、Prometheus、Atlas、Oracle、Librarian、Explore、Metis、Momus、Sisyphus-Junior 等。
- Category routing：`visual-engineering`、`ultrabrain`、`deep`、`quick` 等用语义类别抽象模型选择。
- LSP、AST、MCP、web/docs/code search、tmux、session tools、Hashline edit 等降低模型盲区。
- Background agents 与 Team Mode 并行探索/执行。
- Wisdom accumulation、notepads、Goal/Todo continuation、compaction preservation 降低上下文中断损失。

ARGO 也强调 E，但主要通过“清晰事实源 + 小任务 + 阶段 handoff”释放模型能效；OMO 则更像通过“工具栈 + 多模型编排 + 自动恢复 + 并行 worker”释放模型能效。

### 3.5 G：任务颗粒度

**OMO 现状：中。**

OMO 有降低任务粒度的机制：

- Prometheus plan 将复杂任务拆解为 `.omo/plans`。
- Atlas 读取计划后按任务委派给 Sisyphus-Junior 或其他 specialist。
- `task` 工具建议一次只有一个目标和一个 deliverable。
- Task system 支持 dependencies 与 parallel execution。

但 OMO 的产品哲学同时鼓励“把大任务交给 Agent，用户离开”。`ultrawork` 的卖点就是 Agent 自行探索、实现、验证，直到完成。这与 ARGO 的“分母主导定律”存在张力。

在 ARGO 视角下，OMO 是用更强的 E 和 B 去抵消较大的 G；ARGO 则优先通过流程设计降低 G，再用 P/B/E 增强每个小范围的确定性。

## 4. 递归可靠性与自愈机制对比

ARGO 的递归可靠性公式强调子任务可靠性向父任务传导：

$$\mathcal{R}_i = \Phi \left[ \frac{ \mathcal{C}(\mathbf{K}_i) \times \left( P_i \cdot \sigma(\mathbf{K}_i) + B_i \right) \times \mathcal{E}(\mathbf{K}_i) }{ G_i } \right] \cdot \prod_{j \in Children(i)} (\mathcal{R}_j)^{w_{ij}}$$

OMO 对“局部自愈”有很多实践机制：

- runtime fallback 处理 provider/API 错误；
- todo continuation 防止 Agent 半途停止；
- Goal continuation 在 idle 后继续推进；
- boulder state 记录 active plan、session continuity 与执行进度；
- ulw-loop 用 evidence 与 quality gate 支撑长任务循环；
- edit-error-recovery、json-error-recovery 修复工具层失败；
- CI 和 QA evidence 捕获真实 harness 行为；
- notepad 记录 learnings/issues/verification，避免后续 worker 重复错误。

这些机制更像 **执行层自愈**。ARGO 的自愈更偏 **阶段层自愈**：意图错回意图设计，实现契约错回实现设计，纯代码错才进入编码修复；每个子节点在向上游交付前必须通过自己的验收闭环。

两者都反对“错误静默传递”，但 OMO 倾向在执行流中自动修；ARGO 倾向在阶段边界上分类、阻断、回流。

## 5. 与 ARGO 的核心差异

| 维度 | OMO | ARGO |
| --- | --- | --- |
| 根本目标 | 让 Agent 独立完成大任务，减少人类 babysitting | 让 AI 在强阶段、强契约、强门禁中确定性交付 |
| 人类定位 | 人类介入是失败信号，理想状态是发起后离开 | 人类是目标、验收边界和价值判断的校准器 |
| 主闭环 | Human Intent -> Agent Execution -> Verified Result | BusinessPartner -> task-tidy -> IntentionDesign -> ImplementationDesign -> CodingAndReparing -> 双层验收 |
| 清晰度来源 | IntentGate、Prometheus interview、plans、notepads | 结构化业务拷问、DecisionTreeRecord、意图图谱 |
| 协议来源 | AGENTS.md、rules、skills、hooks、config schema | SystemArchitecture.json、ARCHITECTURE.md、handoff JSON、testcase |
| 边界约束 | 工具 guard、hook、Hashline、comment checker、QA evidence、CI | 阶段权限、冻结测试、handoff validator、架构 validator、人类审核 |
| 任务粒度策略 | 支持拆解，但鼓励大任务交给 Agent 内部消化 | 人类按依赖顺序逐个小范围启动新会话 |
| 架构事实源 | 主要是 markdown 与 package role map，无正式意图图谱 | ArchiMate-like `SystemArchitecture.json` 是核心事实源 |
| 测试前置 | 测试纪律强，QA evidence 强，但多在实现/PR 阶段 | 验收 testcase 从意图设计阶段前置产生 |
| 多模型策略 | 核心能力，category/agent/model fallback 深度绑定 | 可使用不同模型，但确定性主要来自流程与事实源 |
| 自进化 | 通过 rules、AGENTS.md、skills、hook、notepad、QA 经验演进 | 通过 distill、persistent memory、Skill/Rule/Instruction/hook 固化 |

## 6. OMO 的优势

1. **执行面很强。** OMO 在工具、hook、MCP、LSP、Hashline、fallback、tmux、Team Mode、CI 和 QA evidence 上的工程投入明显高，能直接提升 Agent 实战生产力。
2. **跨 harness 分层方向明确。** Core/MCP/Skills/Adapters/Platform/Web 的分层重构有助于把能力迁移到 OpenCode、Codex、Senpi、Pi 等不同宿主。
3. **模型路由成熟。** 它把“任务类别”而非“模型名字”作为委派接口，降低人类选择模型的认知负担。
4. **真实 QA 纪律强。** “typecheck/test 不是 QA，必须驱动真实 harness 并写 evidence”的规则非常接近工程交付证据要求。
5. **工具级确定性强。** Hashline edit、write-existing-file-guard、promptAsync gate audit、test-discipline 等机制能有效减少常见 Agent 破坏性行为。

## 7. OMO 的确定性短板

1. **缺少长期结构化意图事实源。** 没有类似 ARGO `SystemArchitecture.json` 的业务/架构语义图谱，跨迭代意图追踪主要依赖 markdown 与会话产物。
2. **阶段责任边界弱于 ARGO。** Prometheus/Atlas/Junior 有角色分工，但没有 ARGO 那种“意图设计、实现设计、编码修复”三阶段资产所有权和 validator 门禁。
3. **验收前置不足。** OMO 强调计划评审和 QA evidence，但验收 testcase 并未被系统性提升到意图设计阶段成为冻结契约。
4. **大任务自治提高 G 风险。** `ultrawork` 的卖点会鼓励高 G 输入，依赖内部编排与强模型消化复杂度；当任务语义复杂或业务风险高时，误解可能在较晚阶段才暴露。
5. **协议遵循依赖上下文注入与 hook。** AGENTS.md/rules 很丰富，但很多协议仍是自然语言提示，结构化可验证程度不如 ARGO 的 schema + validator + handoff。

## 8. 对 ARGO 的启发

OMO 有几类机制值得 ARGO 借鉴：

1. **Hashline 式编辑绑定。** ARGO 的 CodingAndReparing 可以吸收“内容 hash 定位 + stale edit 拒绝”的思想，提高代码修改的 B。
2. **真实 harness QA evidence。** ARGO 当前强调测试入口和双层验收，可补充“真实环境证据目录”的统一格式，例如把命令、观察、隔离证明、遗漏项归档为交付证据。
3. **Category-based model routing。** ARGO 阶段 Agent 可以在内部进一步按任务类型选择模型或子 Agent，而不是只按阶段固定模型。
4. **PromptAsync/内部注入审计。** ARGO 若在不同平台引入 hook 或自动 continuation，也需要类似“内部消息注入必须经过 gate”的硬规则。
5. **跨 harness core/adapters 分层。** ARGO 已支持 Cursor/Copilot/OpenCode，可借鉴 OMO 对 Core、Adapters、Platform 的明确分层，减少平台适配重复。

## 9. 对 OMO 的 ARGO 化建议

如果希望 OMO 进一步提升确定性交付能力，可以按增量方式引入 ARGO 思路，而不是重写其自治执行哲学：

1. **引入可选的 Architecture Fact Source。** 不必直接采用 ArchiMate，但可为项目级意图、能力、约束、验收标准建立结构化 JSON，并让 Prometheus/Atlas/Junior 读写受控字段。
2. **把 Prometheus plan 与 acceptance testcase 绑定。** 计划不仅列任务，还应产出验收方视角的 explicit acceptance checks，并在 Atlas 执行前冻结。
3. **增加阶段化 handoff。** 对高风险任务引入 `IntentToImplementation` 与 `ImplementationToExecution` 两类轻量 handoff，使“需求解释”和“实现路线”在进入代码前被分开审核。
4. **将 QA evidence 与 plan/testcase 建立追踪。** `.omo/evidence` 不只记录命令输出，还应反向引用计划任务、验收标准、相关文件和 residual risk。
5. **为 ultrawork 增加 G 风险阈值。** 当任务跨多个包、多个 harness、业务语义不清或测试入口缺失时，自动降级为 Prometheus interview + staged execution，而不是直接大范围自治。

## 10. 总体判断

从 ARGO 的确定性交付公式看，OMO 不是弱方案，而是偏向另一种工程取舍：

- OMO 用很强的 **E** 和执行层 **B**，尽量让 Agent 独立吞下更大的 **G**。
- ARGO 用强 **C/P/B** 和低 **G**，让 Agent 在较窄、较清晰、可验收的轨道中交付。

如果目标是“个人或小团队快速把 AI 执行力拉满”，OMO 的体验和工具深度更有吸引力。如果目标是“企业级复杂项目中保持需求、架构、测试、验收、责任边界长期一致”，ARGO 的确定性治理更稳。

最理想的组合不是二选一：ARGO 可以吸收 OMO 的执行层能力，OMO 也可以吸收 ARGO 的意图事实源与阶段门禁。二者的互补方向可以概括为：

> 用 ARGO 管住方向、边界和验收，用 OMO 提升执行、工具和多模型能效。


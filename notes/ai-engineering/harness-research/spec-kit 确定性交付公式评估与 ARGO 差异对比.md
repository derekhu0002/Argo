# spec-kit 确定性交付公式评估与 ARGO 差异对比

> 评估基准：《notes/ARGO 工程哲学：确定性交付公式的工程化.md》
> 被评估项目：`D:\Projects\spec-kit`
> 评估日期：2026-07-22
> 评估方式：静态架构与流程取证，未运行 `spec-kit` 的测试套件或真实 agent 集成回归。

## 1. 结论摘要

`spec-kit` 是一套以 **Spec-Driven Development** 为核心的通用规格驱动工具包。它的重点不是像 ARGO 那样把业务意图、架构契约、阶段 handoff、冻结测试和角色边界组织成强阶段治理系统，而是把 **constitution -> specify -> clarify -> plan -> tasks -> analyze -> implement -> converge** 这一条规格驱动链路做成跨 30+ agent 集成可复用、可扩展、可编排的标准化流程层。

用 ARGO 的确定性交付公式看：

$$Total\ Certainty = C \times \frac{(P \cdot \mathbf{B}) \times E}{G}$$

`spec-kit` 的突出优势集中在 **P（协议规范）** 和 **G（任务颗粒度控制）**：它通过模板、命令、workflow engine、extension/preset/bundle 体系，把“先规格、后计划、再任务、再实现”的默认路径前置成可安装协议。它对 **C（目标清晰度）** 也有较强支持，尤其是 `clarify`、`checklist`、`analyze` 等命令会持续逼近更清晰、更可测的规格文本。但它对 **B（边界约束力）** 的强化主要体现在流程提醒、文档质量检查、人工 gate 和任务补全，并不等同于 ARGO 那种基于结构化事实源、阶段所有权、schema validator 和冻结资产的硬边界。它对 **E（模型能效）** 的增强是“把 SDD 方法打包成跨 agent 可调用工具链”，而不是像 OMO/ECC 那样重度依赖多模型路由、LSP/AST、运行时 guard 或复杂代理操作系统。

因此，`spec-kit` 更像 **通用规格驱动流程平台**；ARGO 更像 **高确定性交付治理系统**。如果把两者放在同一坐标系中，可以把 `spec-kit` 理解为偏前置规格生产和项目脚手架的一层，而 ARGO 关注的是从业务意图到实现交付的持续确定性闭环。

## 2. 关键证据

本次评估主要读取了以下证据源：

| 证据源 | 观察 |
| --- | --- |
| `README.md` | 明确定位为 “Define what to build before building it”，核心流程是 `/speckit.constitution`、`/speckit.specify`、`/speckit.plan`、`/speckit.tasks`、`/speckit.implement`。 |
| `spec-driven.md` | 系统阐述 SDD：规格成为主资产，代码服务于规格；强调 PRD、implementation plan、acceptance scenarios、research-driven context。 |
| `templates/spec-template.md` | 强制用户故事、独立测试、Acceptance Scenarios、FR/SC、Edge Cases、Assumptions 等规格骨架。 |
| `templates/plan-template.md` | 强制技术上下文、Constitution Check、结构决策、复杂度跟踪。 |
| `templates/tasks-template.md` | 强调按 User Story 拆分、独立测试、阶段顺序、并行标记 `[P]`、MVP 优先。 |
| `templates/commands/clarify.md` | 允许在 `plan` 之前最多 5 个高影响澄清问题，并将答案回写 `spec.md`。 |
| `templates/commands/analyze.md` | 在 `tasks.md` 生成后，对 `spec.md`、`plan.md`、`tasks.md` 做只读一致性与覆盖分析。 |
| `templates/commands/checklist.md` | 将 checklist 定义为“Unit Tests for English”，检查的是需求文本质量，而不是实现行为。 |
| `templates/commands/implement.md` | 读取规格、计划、任务与 checklist 后执行实现，并要求把已完成任务标记为 `[X]`。 |
| `templates/commands/converge.md` | 以 `spec/plan/tasks` 为唯一意图源，评估代码与意图差距，并以 append-only 方式追加剩余任务。 |
| `workflows/speckit/workflow.yml` | 内置 `specify -> gate -> plan -> gate -> tasks -> implement` 的全流程 workflow。 |
| `workflows/ARCHITECTURE.md` | workflow engine 支持 gate、if/switch、while、fan-out/fan-in、暂停/恢复、运行状态持久化。 |
| `AGENTS.md` | 明确 Spec Kit/Specify 的定位、integration architecture、extension context ownership、CLI 与集成结构。 |
| `pyproject.toml` | 将 templates、commands、extensions、presets、workflows 全部打包进 `specify-cli`。 |
| `tests/`、`tests/workflows/`、`tests/contract/` | 测试面覆盖 CLI、集成、workflow overlay、catalog/schema/manifest 等，但主要验证工具链与资产完整性。 |
| 仓库文本搜索 | 未发现 `SystemArchitecture.json`、`IntentToImplementationHandoff`、`ImplementationToCodingHandoff`、`validateStageHandoff`、`ExplicitAcceptanceTestcase` 等 ARGO 式结构化事实源和阶段 handoff 资产。 |

## 3. 按确定性交付公式评估

### 3.1 C：目标清晰度

**`spec-kit` 现状：中高。**

它对清晰度的主要强化来自三个层面：

1. `spec-template.md` 强制把模糊需求改写成用户故事、验收场景、功能需求、成功标准与假设。
2. `clarify.md` 在 `plan` 之前专门做高影响澄清，最多 5 个问题，并把答案直接回写 `spec.md`。
3. `checklist.md` 与 `analyze.md` 不检查实现是否正确，而是检查规格文本是否完整、清晰、一致、可测、可追踪。

这说明 `spec-kit` 很重视“需求不能直接带着模糊性进入实现”。它会反复迫使团队把自然语言压缩成更明确的规格文本与 acceptance scenarios。

但与 ARGO 相比，它的清晰度资产主要仍然是 **feature 目录下的 markdown 文档**，例如 `spec.md`、`plan.md`、`tasks.md`、`checklists/*.md`。这些文档能显著提升当前 feature 的清晰度，却不像 ARGO 的 `design/KG/SystemArchitecture.json` 那样形成跨迭代、跨阶段、跨会话可机读的领域事实图谱。

**与 ARGO 差异：**

| 项 | spec-kit | ARGO |
| --- | --- | --- |
| 需求入口 | `specify` + `clarify` | `BusinessPartner` / `/business-partner` + `task-tidy` |
| 清晰度沉淀 | `spec.md`、`checklist`、`plan.md` | `SystemArchitecture.json`、DecisionTreeRecord、ExplicitAcceptanceTestcase |
| 主事实形态 | 文本规格与模板 | 结构化意图图谱 + 阶段 handoff |

### 3.2 P：协议规范

**`spec-kit` 现状：高。**

这是它最强的维度之一。

`spec-kit` 已把 SDD 协议显式化为一整套可安装资产：

- `templates/*.md` 负责规定规格、计划、任务、宪章的骨架；
- `templates/commands/*.md` 负责规定各阶段命令的执行协议；
- `workflows/` 负责把多命令串成可恢复的自动化流程；
- `extensions/`、`presets/`、`bundles/` 负责扩展能力、覆盖默认模板、为不同角色装配方法包；
- `src/specify_cli/integrations/*` 与 `AGENTS.md` 负责把同一套方法安装到不同 AI agent 集成中。

从 ARGO 公式看，`spec-kit` 的 `P` 并不是一句“先写规格”，而是一整套可以被分发、版本化、测试和复用的流程协议。`README.md` 中从 `constitution` 到 `implement` 的顺序本身，就是它的合法轨道定义。

但它的协议重心偏向 **规格生产协议** 和 **工作流协议**，而不是 ARGO 所强调的 **意图架构协议** 和 **阶段所有权协议**。也就是说，`spec-kit` 更擅长约束“你应该先生成哪些文档、按什么顺序做”，而不是约束“哪些资产只能由哪个阶段改、哪些测试必须冻结、哪些语义变更必须回流上游”。

### 3.3 B：边界约束力

**`spec-kit` 现状：中。**

它并非没有边界，主要有以下几类：

- `analyze.md` 对 `spec`、`plan`、`tasks` 做只读一致性与覆盖审查；
- `checklist.md` 把需求质量检查显式化；
- `implement.md` 在实现前会先检查 checklist 是否完成；
- `converge.md` 会基于当前代码与 `spec/plan/tasks` 的差距追加剩余任务；
- `workflows/speckit/workflow.yml` 中有 `review-spec`、`review-plan` 两个 gate；
- workflow engine 原生支持 `gate`、暂停/恢复、状态持久化。

这些机制说明 `spec-kit` 不是放任 agent 直接写代码，它也承认人工 review、质量检查和差距回补的重要性。

但如果用 ARGO 的 `B` 标准衡量，它的边界仍然偏 **流程层软硬结合的检查**，而不是 **阶段所有权 + 资产冻结 + validator** 的硬门禁。仓库中没有看到类似：

- 结构化意图图谱 validator；
- 阶段 handoff schema 校验；
- Coding 阶段禁止修改冻结测试/契约的显式协议；
- 意图语义变更必须通过受控 mutation tool 写入正式事实源。

因此，`spec-kit` 的 `B` 能有效阻止“规格质量过低就直接推进”，但对“中后期阶段越权、架构漂移、测试边界漂移”的防护力弱于 ARGO。

### 3.4 E：模型能效

**`spec-kit` 现状：中高。**

它释放模型能效的方式不是构建复杂 agent OS，而是把高频规格驱动动作做成稳定脚手架：

- 支持 30+ agent integration；
- `specify init` 自动安装模板、命令、脚本、workflow；
- extensions/presets/bundles 可按组织需要覆盖默认行为；
- workflow engine 提供 gate、resume、条件分支和 fan-out/fan-in；
- `analyze`、`clarify`、`converge` 将“读文档、补差距、补任务”固化为命令。

这让模型不用每次从零发明 SDD 流程，而是站在现成模板与命令之上工作，所以 `E` 明显优于单纯对话式“写个 PRD 再写个计划”的松散做法。

但它的能效提升仍主要停留在 **流程资产层**。与 OMO/ECC 这类 harness 相比，`spec-kit` 很少展示重度的运行时工具接管，例如多模型路由、LSP/AST 约束、编辑 guard、状态机式长任务自治或复杂 evidence 归档。因此它的 `E` 很实用，但不是“超强执行操作系统”那条路线。

### 3.5 G：任务颗粒度

**`spec-kit` 现状：中高。**

这是它的另一项突出优势。

`tasks-template.md` 明确要求：

- 按 user story 组织任务；
- 每个故事要能独立实现、独立测试、独立交付；
- 先 Setup，再 Foundational，再按优先级逐故事推进；
- 支持 `[P]` 并行，但要求不同文件、无依赖冲突；
- 强调 MVP first 与 checkpoint 验证。

`spec-template.md` 也要求每个 user story 是 independently testable 的可演示切片。再加上 `clarify` 和 `analyze` 对模糊点和覆盖缺口的前置修正，整体上 `spec-kit` 确实在主动降低单次任务的搜索空间。

但它对 `G` 的控制粒度仍主要落在 **feature 内部的任务拆解**，而不是 ARGO 那种“由人类按依赖顺序逐次开启新会话、尽量避免多个交付范围并发”的更强纪律。`implement.md` 的默认姿态仍是“处理并执行 tasks.md 中的全部任务”，这比 ARGO 倾向的窄范围阶段 handoff 要宽一些。

## 4. 递归可靠性与自愈机制

ARGO 的递归可靠性公式强调：

$$\mathcal{R}_i = \Phi \left[ \frac{ \mathcal{C}(\mathbf{K}_i) \times \left( P_i \cdot \sigma(\mathbf{K}_i) + B_i \right) \times \mathcal{E}(\mathbf{K}_i) }{ G_i } \right] \cdot \prod_{j \in Children(i)} (\mathcal{R}_j)^{w_{ij}}$$

`spec-kit` 在这方面有一定的“递归补差”能力，但其风格更偏文档链路自愈，而不是阶段链路自愈：

- `clarify` 负责在规格阶段修正模糊意图；
- `analyze` 负责在 `spec/plan/tasks` 之间找冲突和覆盖缺口；
- `converge` 负责在实现后把未满足的要求重新追加成任务；
- workflow engine 负责在 gate 停顿后恢复执行状态。

这条链路确实在阻止“缺陷静默传递”。但它的自愈主要表现为：**如果文档或实现有缺口，就补问题、补分析、补任务**。而 ARGO 的自愈更强调：**如果问题属于意图层，就回 IntentionDesign；属于实现契约层，就回 ImplementationDesign；只有纯代码缺陷才进入 CodingAndReparing**。

因此，`spec-kit` 的自愈是 **artifact-driven convergence**；ARGO 的自愈是 **stage-driven correction**。

## 5. 与 ARGO 的核心差异

| 维度 | spec-kit | ARGO |
| --- | --- | --- |
| 根本目标 | 把 SDD 做成跨 agent 可安装、可扩展、可编排的标准流程 | 把 AI 交付收束在强阶段、强契约、强门禁的确定性系统里 |
| 主事实源 | feature 级 markdown 规格、计划、任务、checklist | `SystemArchitecture.json`、实现契约、handoff JSON、显性 testcase |
| 流程主链 | constitution -> specify -> clarify -> plan -> tasks -> implement -> converge | BusinessPartner -> task-tidy -> IntentionDesign -> ImplementationDesign -> CodingAndReparing -> 双层验收 |
| 人类角色 | 主要承担规格/计划 review gate 与澄清输入 | 承担业务目标校准、依赖顺序决策、验收边界审批与阶段门禁 |
| 协议类型 | 模板协议、命令协议、workflow 协议 | 意图架构协议、实现契约协议、handoff 协议、测试归属协议 |
| 质量检查 | checklist、analyze、converge、workflow gate | validator、冻结测试、双层验收、trace proposal、阶段审计 |
| 颗粒度策略 | feature 内按 user story 拆分任务 | 尽量按依赖顺序逐步缩小交付范围，并通过新会话隔离上下文 |
| 架构事实沉淀 | 可通过 plan/constitution 表达，但缺少统一结构化图谱 | 架构与验收语义进入长期可机读事实源 |

## 6. spec-kit 的优势

1. **规格生产协议非常成熟。** `spec-template`、`plan-template`、`tasks-template`、`clarify`、`analyze`、`checklist` 形成了高可复用的规格驱动流程。
2. **跨 agent 适配能力强。** `AGENTS.md` 和 `src/specify_cli/integrations/*` 说明它把流程视为平台无关资产，而不是只为单一 harness 设计。
3. **扩展体系完整。** extensions、presets、bundles 让组织可以在核心流程上做行业化和角色化覆盖。
4. **workflow engine 是重要加分项。** `gate`、暂停/恢复、条件与 fan-out/fan-in 让 SDD 可以从命令集合升级为可执行编排。
5. **对需求质量的重视非常到位。** “Unit Tests for English” 这类设计，能有效减少规格层的模糊与伪完整。

## 7. spec-kit 的确定性短板

1. **缺少长期结构化意图事实源。** 规格和计划很强，但没有 ARGO 风格的统一语义图谱来承载跨 feature 的稳定领域事实。
2. **阶段边界不够硬。** 有流程阶段，但缺少明确的资产所有权、冻结文件集、handoff schema 和阶段 validator。
3. **验收更多停留在规格与任务层。** 虽然有 acceptance scenarios，但仓库层面未看到像 ARGO 那样把显性 testcase 物理化、冻结并交给下游阶段只读使用的制度。
4. **converge 更像补任务，不是责任回流。** 当实现偏差出现时，它会追加剩余任务，而不是显式判定应回规格阶段、计划阶段还是实现阶段修正。
5. **对实现期执行纪律的硬控制有限。** `implement.md` 有很多要求，但更多依赖命令说明与 agent 遵循，不像 ARGO 那样把很多控制点交给专门 validator 或 mutation tool。

## 8. 对 ARGO 的启发

如果从 `spec-kit` 倒看 ARGO，有几类能力值得借鉴：

1. **规格文本质量检查前置化。** `clarify`、`analyze`、`checklist` 的组合很适合补强 ARGO 在业务文档与 feature 规格撰写阶段的文本级质量控制。
2. **template/preset/extension 体系。** ARGO 可以考虑把部分领域化约束包装成更轻量的 preset/extension，而不总是集中在主流程中。
3. **workflow engine 的通用 gate 机制。** 对某些非架构重任务，轻量 gate/resume workflow 可能比完整阶段 Agent 更低成本。
4. **append-only converge 思想。** 对实现后 residual gap 的再任务化，`spec-kit` 的 converge 提供了一种比“直接返工对话”更可追踪的表达方式。

## 9. 对 spec-kit 的 ARGO 化建议

如果希望 `spec-kit` 进一步提升“确定性交付”而不仅是“规格驱动”，可以沿以下方向增强，而不必放弃其通用 SDD 定位：

1. **增加结构化意图资产层。** 不一定要直接采用 ArchiMate，但至少为 feature 级或项目级 intent、capability、constraint、acceptance ownership 提供 machine-readable JSON 事实源。
2. **引入轻量 handoff schema。** 在 `plan -> tasks -> implement` 之间增加受校验的 handoff 文件，而不是完全依赖 markdown 文档隐式衔接。
3. **把 acceptance scenario 进一步物理化。** 不止停留在规格文本，而是要求生成对应的测试入口或可执行验收占位，并明确哪些资产在实现阶段只读。
4. **加强阶段责任回流。** 当 `converge` 发现缺口时，不只追加任务，还应标注该缺口属于 spec、plan、implementation 还是 validation 层。
5. **为 workflow gate 增加更强的结构校验。** 目前 gate 偏人工审批，可以进一步叠加 schema、coverage、traceability 等自动审计结果作为前置条件。

## 10. 总体判断

从 ARGO 的确定性交付公式看，`spec-kit` 不是“弱治理的提示词集合”，而是一套相当成熟的 **规格驱动流程资产平台**：

- 它用很强的 **P** 把 SDD 方法做成可安装协议；
- 用较强的 **G** 把需求逐步压缩成 user-story 级可执行任务；
- 用中高的 **C** 反复清洗规格文本中的歧义；
- 用中等的 **B** 做文档质量检查、人工 gate 和差距收敛；
- 用中高的 **E** 把这套流程分发到多种 agent 宿主中。

但它的重心仍是 **“如何更好地生产和执行规格”**，不是 **“如何把 AI 的阶段职责、架构事实、测试边界和返工路径锁进强治理系统”**。因此它最适合作为 ARGO 前链路的友邻方案，或作为某些轻量项目的 SDD 主流程；若目标是企业级长期架构一致性与确定性交付，仍需要 ARGO 这类更强的事实源、阶段门禁和回流机制。

可以把两者的互补关系概括为：

> 用 `spec-kit` 提高规格生产效率与跨 agent 流程可移植性，用 ARGO 管住意图事实、阶段边界、验收闭环与长期确定性。
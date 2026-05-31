# Argo HARNESS

Argo 是一套面向 AI Coding 的 HARNESS 工程方法与配套实现。它把意图架构、实现架构、测试边界、失败记录和阶段交接组织成一个可重复、可验证、可回归的闭环。

当前同时承载两种落地形态：

- GitHub Copilot / VS Code 版本：通过 `@argowork` 聊天参与者、VS Code 扩展命令，以及 `.github/agents/` 下的自定义 agent 驱动工作流。
- OpenCode 版本：通过 `.opencode/` 下的 agent、command、tool 和 validator 资产驱动同一套工作流。

## 快速上手

版本入口：

| 版本 | 适用环境 | 说明 |
| --- | --- | --- |
| [Copilot 版](copilot/README.md) | VS Code + GitHub Copilot Chat | 以 VS Code 扩展形式运行，入口包括 `@argowork`、扩展命令和 `.github/agents/` 下的自定义 agent |
| [OpenCode 版](plugins/opencode_app/README.md) | OpenCode | 以 `.opencode/` 目录中的 agent、command、tool、validator 资产运行 |

这两个版本共享同一条最小闭环：

```text
先准备工作区
再澄清 intent
再落盘 implementation contracts 和 tests
再执行 test
最后基于 failure records 进入 coding/repair
```

如果把顺序打乱，Argo 的价值会明显下降，因为它真正提供的不是“多一个 AI 工具入口”，而是“把架构边界、测试边界和阶段交接显性化的工程系统”。

### **AI 确定性交付的第一性原理**

$$Total Certaint(最终交付的确定性) = \left[ C \times \frac{(P \cdot B) \times E}{G} \right] \cdot S^n$$


*   **C $\rightarrow$ Clarity（目标清晰度）**
    *   *定义：* 意图的确定性。衡量人类对“目的地”的定义是否从模糊的语义描述固化为唯一的逻辑坐标。
*   **P $\rightarrow$ Protocol（协议规范）**
    *   *定义：* 边界的设计方案。即 Harness 的结构，包括 Blueprint（蓝图）、Semantic Registry（语义仓库）和测试契约的定义。
*   **B $\rightarrow$ Binding Power（边界约束力）**
    *   *定义：* 边界的硬度/强制性。衡量该协议是“建议性质的提示词（软约束）”还是“物理阻断的代码关卡（硬约束）”。
*   **E $\rightarrow$ Efficacy（模型能效）**
    *   *定义：* AI 模型的基础生产力。衡量模型在逻辑推理、代码生成及指令遵循上的原生能力（对应 HumanEval、SWE-bench 等指标）。
*   **G $\rightarrow$ Granularity（任务颗粒度）**
    *   *定义：* 单次执行的复杂度。任务拆解得越细，G 越小，AI 在单体任务中的探索空间就越受控。
*   **S $\rightarrow$ Stability（系统稳定性）**
    *   *定义：* 过程的一致性。衡量系统在单步执行中不产生随机漂移、不丢失上下文记忆的概率。
*   **n $\rightarrow$ Number of Steps（任务链长度）**
    *   *定义：* 阶段性目标的总数。即任务从出发点到终点经历的中间站数量，它对稳定性具有指数级的累积效应。

---

这不是“文档整理动作”，而是直接对应 AI 确定性交付第一性原理里不同变量的失真来源。换句话说，Argo 的每一项措施，本质上都在修复某一类确定性损失。

## 基于第一性原理的 HARNESS 审视

 Argo 要构建的 HARNESS 本体：它分别在解决哪一类确定性问题、机制成熟到什么程度、下一步该推进什么。

### 1. C（Clarity）相关：语义不确定问题

要解决的问题类型：
- 需求与验收语义在自然语言层面存在歧义。
- 执行阶段无法稳定判断“完成定义（Definition of Done）”。

当前解决程度（HARNESS 机制成熟度）：
- 已形成清晰机制方向：意图先行、显性 testcase 先行、阶段化交接先行。
- 处于“机制可定义、可表达”的成熟度阶段，核心短板是“持续、标准化产出一致性”而非概念缺失。

下一步建议：
- 将“意图语义 -> testcase 基线 -> 交接工件”定义为 HARNESS 必经链路，并把每步产物模板化、校验化。

### 2. P 与 B（Protocol / Binding Power）相关：协议漂移与约束软化问题

要解决的问题类型：
- 有流程但执行可绕过，导致协议漂移。
- 边界主要靠自觉遵守，缺少默认阻断。

当前解决程度（HARNESS 机制成熟度）：
- 协议层（P）设计较完整：包含分阶段职责、契约载体、测试载体、校验动作。
- 约束力（B）处于“中等成熟”：具备硬约束设计思想，但需要更高比例的默认自动执行。

下一步建议：
- 继续推动“规则即门禁”：让 schema、handoff、关键 guardrail 从“建议执行”升级到“默认必跑 + 失败即阻断”。

### 3. G（Granularity）相关：任务过粗导致随机探索问题

要解决的问题类型：
- 大任务一次性下发导致 agent 搜索空间过大。
- 同一目标在不同轮次出现不可复现的执行路径。

当前解决程度（HARNESS 机制成熟度）：
- 已形成颗粒度治理思想：Intent Design、Implementation Design、Coding/Repair 的分阶段闭环。
- 处于“机制可操作”阶段，仍需进一步降低人工编排依赖。

下一步建议：
- 推进默认执行模板化：将“设计 -> 校验 -> 测试 -> 修复”固化为最小标准流程，而非每轮临场拼接。

### 4. S（Stability）相关：长链路漂移与回归失稳问题

要解决的问题类型：
- 步数增加后，局部正确难以累积为全局正确。
- 缺少统一失败面时，修复工作会震荡反复。

当前解决程度（HARNESS 机制成熟度）：
- 已建立“失败记录驱动下一轮工作”的闭环方向。
- 处于“闭环雏形”阶段，离“可运营、可调度、可预测收敛”还有一段距离。

下一步建议：
- 把 failure records 从记录容器升级为调度容器：增加责任层、优先级、失败类型、修复状态等治理字段。

### 5. E（Efficacy）相关：模型能力利用率问题

要解决的问题类型：
- 模型能力本身强，但被弱流程稀释。
- 缺少工程化承载面时，能力提升无法稳定转化为交付提升。

当前解决程度（HARNESS 机制成熟度）：
- 已明确把 Instructions、Agents、Skills、Tools、Hooks/Plugins 作为能力承载层。
- 处于“体系搭建完成、运营优化待加强”阶段。

下一步建议：
- 改进重点放在 HARNESS 运行机制本身：提升自动化覆盖率、阻断精度和跨阶段一致性，而不是单纯追加提示词。

## 当前结论：HARNESS 在解决什么问题，解决到哪一步

一句话总结：

Argo 要构建的 HARNESS，核心是在用工程化边界解决“语义不确定、流程漂移、任务过粗、长链失稳、能力稀释”五类问题；当前已完成方法与机制骨架建设，下一阶段应重点推进“默认强约束执行能力”和“闭环运营能力”。

## 下一步改进优先级（建议）

1. 优先强化 Binding（硬约束）
- 让关键校验与关键测试成为默认门禁，减少可绕过路径。

2. 然后强化 Stability（闭环治理）
- 建立可调度的 failure records 机制，支持按责任与优先级收敛修复。

3. 再强化 Granularity（流程模板）
- 固化跨阶段最小标准流程，降低人工编排随机性。

4. 最后持续打磨 Clarity 与 Efficacy 的协同
- 通过更稳定的意图表达与交接语义，让模型能力持续、可复现地转化为交付能力。

## 从第一性原理到工程部署的对应关系

```text
Clarity: 意图图谱 + 显性 testcase + 阶段顺序
Protocol: 架构契约 + 指令规约 + 分层角色
Binding: 校验器 + 只读测试入口 + 自动阻断
Granularity: 分阶段命令与可执行 entrypoint
Stability: failure records + 回归测试闭环
Efficacy: 模型能力通过上述工程系统被放大
```

因此，Argo 的下一步重点不是“再解释一遍方法论”，而是把已定义边界继续转成默认执行、默认校验、默认阻断，让确定性从“可理解”进一步变成“可强制”。






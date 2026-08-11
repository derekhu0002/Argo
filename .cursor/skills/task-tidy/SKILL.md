---
name: task-tidy
description: "Normalize business analysis into a decision-tree mapping report after business-partner or grill-me output, then delegate canonical intent integration to IntentionDesign."
argument-hint: scope
disable-model-invocation: true
---

# Task Tidy

将 Business Partner 的业务分析、决策树遍历结果与架构依赖分析整理为可交接的决策树文件，并委托 `TaskTidyGraphIntegrator` 生成只读映射报告。`task-tidy` 只能确认每个 BP 决策为 **mapped or blocked**；it **must not write the canonical intent graph**，也不对意图架构充分性或交接负责。映射报告随后交由 `IntentionDesign` 作为唯一图谱写入者完成最终表达、覆盖证明和 handoff。

## Rules

- **MUST** rebuild and persist the full Business Partner decision tree as a Markdown table before delegation.
- **MUST** pass the concrete decision tree file path to `TaskTidyGraphIntegrator`; do not rely on chat context alone.
- **MUST NOT** call graph mutation tools or directly edit `design/KG/SystemArchitecture.json`; only `IntentionDesign` writes, validates, and hands off the canonical intent graph.
- **MUST** delegate decision-tree-to-architecture mapping to one dedicated `TaskTidyGraphIntegrator` subagent; the `task-tidy` host agent keeps orchestration, mapping validation, conflict reporting, and synthesis responsibility.
- **MUST** validate only that every decision node is mapped or blocked with a traceable reason; do not judge the intrinsic quality of the approved Business Partner decision tree or assert intent-architecture adequacy.
- **MUST** return to the same `TaskTidyGraphIntegrator` subagent session when host validation finds a missing, conflicting, unreasonable, or untraceable mapping; do not start a new session merely to fix discovered mapping gaps.
- **MUST** pass the accepted mapping report and blockers to `IntentionDesign`; invoke `/architecture-diff-plantuml` only after IntentionDesign reports canonical graph persistence and validation success.

## Workflow

### 1. Decision Tree Inventory
- 从 Business Partner 对话中重建决策树：问题定义、分解维度、分支、推荐答案、人类确认/否决、依赖前提、风险和验收边界。
- 将重建后的决策树写入 `.argo/history/decision-tree/[timestamp]-[sessionname-id].md`，其中 `timestamp` 使用当前时间戳，`sessionname-id` 使用本次 task-tidy 会话可识别名称和会话 id。
- 临时 Markdown 文件必须使用表格表达决策树节点，至少包含列：`id`、`parentId`、`level`、`question`、`MECE dimension`、`branchStatus`、`recommendedAnswer`、`humanDecision`、`businessRationale`、`dependencyPremises`、`risks`、`acceptanceControlPoint`、`acceptanceObservationPoint`、`horizontalConcern`、`verticalDependency`、`evidenceSource`。
- 后续 `TaskTidyGraphIntegrator` 必须以该临时表格文件为标准输入；不要只把决策树留在聊天上下文中。
- 对每个分支标注状态：accepted、rejected、open、superseded。
- 对每个节点记录其 MECE 维度：说明为什么该层分解相互独立且完全穷尽；如果无法证明，列为 open residual coordination。
- 对涉及现状实现、已有架构或代码行为的节点，先从仓库、图谱、测试或契约寻找答案；只有证据不足时才保留为 open question。

### 2. Dedicated Mapping Delegation
- 委托 1 个 `TaskTidyGraphIntegrator` 子 agent，并在任务 prompt 中传入 task-tidy 刚写入的具体 decision tree 文件路径，例如 `.argo/history/decision-tree/[timestamp]-[sessionname-id].md`。
- 子 agent 不得重新挑战已由 Business Partner 和人类达成共识的业务决策树；若发现决策树信息不足，只能作为 mapping blocker 或 residual coordination 上报。

### 3. Host Mapping Validation and Synthesis
- `task-tidy` host agent 必须验收并综合 `TaskTidyGraphIntegrator` mapping report。
- host agent 的验收范围仅限：每个决策节点是否映射到建议的意图落点或被明确阻断、建议落点的业务语义是否可追踪、以及 blocker/residual coordination 是否完整。
- host agent 不得把“决策树本身不够好”作为失败原因；如果输入决策树缺字段导致无法映射，应报告为 mapping blocker。
- 任一候选方案或综合结果暴露映射遗漏、冲突、不合理建议或不可追踪节点时，host agent 必须 resume 同一个 `TaskTidyGraphIntegrator` 子 agent 会话继续修正，并在原会话中补齐缺口；不得为了修复已发现的问题另开新 session。

### 4. IntentionDesign Handoff
- 将决策树文件、mapping report、blockers 和 residual coordination 交由 `IntentionDesign`。
- `task-tidy` 不得声明图谱已持久化、覆盖已充分或可进入实现；这些结论仅由 IntentionDesign 在 graph validation、coverage proof 和 handoff 完成后给出。

## Output

输出必须包含：

### 1. Integration Summary
- task-tidy 写入的决策树临时文件路径。
- `TaskTidyGraphIntegrator` 报告每个决策节点建议映射到哪些 architecture elements、relationships、views、acceptance criteria/testcases，或为何 blocked。
- 映射报告、blockers 与 residual coordination 已交给 IntentionDesign；不报告任何 canonical graph mutation 或 graph validation 结果。

### 2. Integrator Reports and Host Mapping Validation Summary
- `TaskTidyGraphIntegrator` 子 agent 的 mapping candidate 摘要和 mapping blockers。
- `task-tidy` host agent 对映射候选的最终结论：mapped、needs remapping、blocked。
- 如果 blocked，说明是决策树临时文件缺失、建议落点冲突，还是决策树字段不足导致无法映射。

### 3. Decision Tree Coverage Matrix
- 决策节点 ID/名称。
- 分支状态：accepted、rejected、open、superseded。
- 图谱落点：element、relationship、attribute、view、testcase 或 residual coordination。
- 控制点与观测点：对每个 explicit acceptance testcase 必填。
- 证据来源：Business Partner 对话、仓库文件、当前图谱、测试或人类确认。

### 4. Residual Coordination
- 无法进入图谱的残余协调事项；没有则写“无”。
- 每个残余事项必须说明为什么不能被持久化，以及需要人类做出的下一步业务决策。

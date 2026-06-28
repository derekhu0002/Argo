---
name: task-tidy
description: "Internalize business analysis into the intent architecture after business-partner or grill-me output, then delegate git-diff architecture roadmap visualization to architecture-diff-plantuml."
argument-hint: scope
disable-model-invocation: true
---

# Task Tidy

将 Business Partner 的业务分析、决策树遍历结果与架构依赖分析整理为可交接的决策树文件，并委托 `TaskTidyGraphIntegrator` 将其内化进意图架构。`task-tidy` 自身不直接执行图谱 mutation；它负责准备输入、传递具体文件路径、验收整合报告和输出最终摘要。

## Rules

- **MUST** rebuild and persist the full Business Partner decision tree as a Markdown table before delegation.
- **MUST** pass the concrete decision tree file path to `TaskTidyGraphIntegrator`; do not rely on chat context alone.
- **MUST NOT** call graph mutation tools or directly edit `design/KG/SystemArchitecture.json`; graph read/write/mutation/validation belongs to `TaskTidyGraphIntegrator`.
- **MUST** delegate decision-tree-to-architecture integration to one dedicated `TaskTidyGraphIntegrator` subagent; the `task-tidy` host agent keeps orchestration, validation, conflict resolution, and synthesis responsibility.
- **MUST** validate the completeness, reasonableness, and traceability of the architecture integration, not the intrinsic quality of the Business Partner decision tree itself.
- **MUST** return to the same `TaskTidyGraphIntegrator` subagent session and continue the integration work when host validation finds an architecture-mapping omission, architecture conflict, unreasonable graph placement, missing testcase/control/observation mapping, or untraceable decision-tree node; do not start a new session merely to fix discovered gaps.
- **MUST** invoke `/architecture-diff-plantuml` only after `TaskTidyGraphIntegrator` reports graph persistence and validation success.

## Workflow

### 1. Decision Tree Inventory
- 从 Business Partner 对话中重建决策树：问题定义、分解维度、分支、推荐答案、人类确认/否决、依赖前提、风险和验收边界。
- 将重建后的决策树写入 `.argo/temp/decision-tree/[timestamp]-[sessionname-id].md`，其中 `timestamp` 使用当前时间戳，`sessionname-id` 使用本次 task-tidy 会话可识别名称和会话 id。
- 临时 Markdown 文件必须使用表格表达决策树节点，至少包含列：`id`、`parentId`、`level`、`question`、`MECE dimension`、`branchStatus`、`recommendedAnswer`、`humanDecision`、`businessRationale`、`dependencyPremises`、`risks`、`acceptanceControlPoint`、`acceptanceObservationPoint`、`horizontalConcern`、`verticalDependency`、`evidenceSource`。
- 后续 `TaskTidyGraphIntegrator` 必须以该临时表格文件为标准输入；不要只把决策树留在聊天上下文中。
- 对每个分支标注状态：accepted、rejected、open、superseded。
- 对每个节点记录其 MECE 维度：说明为什么该层分解相互独立且完全穷尽；如果无法证明，列为 open residual coordination。
- 对涉及现状实现、已有架构或代码行为的节点，先从仓库、图谱、测试或契约寻找答案；只有证据不足时才保留为 open question。

### 2. Dedicated Integration Delegation
- 委托 1 个 `TaskTidyGraphIntegrator` 子 agent，并在任务 prompt 中传入 task-tidy 刚写入的具体 decision tree 文件路径，例如 `.argo/temp/decision-tree/[timestamp]-[sessionname-id].md`。
- 子 agent 不得重新挑战已由 Business Partner 和人类达成共识的业务决策树；若发现决策树信息不足，只能作为 integration blocker 或 residual coordination 上报。

### 3. Host Validation and Synthesis
- `task-tidy` host agent 必须验收并综合 `TaskTidyGraphIntegrator` integration report。
- host agent 的验收范围仅限：整合完整度、图谱落点合理性、关系/属性语义一致性、验收 testcase/control/observation 挂载正确性、每个决策节点到图谱或 residual coordination 的可追踪性。
- host agent 不得把“决策树本身不够好”作为失败原因；如果输入决策树缺字段导致无法映射，应报告为 integration blocker。
- 任一候选方案或综合结果暴露整合遗漏、冲突、不合理落点或不可追踪节点时，host agent 必须 resume 同一个 `TaskTidyGraphIntegrator` 子 agent 会话继续修正，并在原会话中补齐缺口；不得为了修复已发现的问题另开新 session。

### 4. Roadmap Visualization
- 调用 `/architecture-diff-plantuml`。
- 仅在 `TaskTidyGraphIntegrator` 报告图谱持久化和 `validateSystemArchitecture` 成功后调用，让该 Skill 基于当前 `SystemArchitecture.json` Git diff 生成依赖子图、Sequential Gravity Chain、G 估算和 PlantUML Markdown 报告。

## Output

输出必须包含：

### 1. Integration Summary
- task-tidy 写入的决策树临时文件路径。
- `TaskTidyGraphIntegrator` 报告写入或更新了哪些 architecture elements、relationships、views、acceptance criteria/testcases。
- `TaskTidyGraphIntegrator` 报告的 `validateSystemArchitecture` 结果；未通过时列出阻塞项。

### 2. Integrator Reports and Host Validation Summary
- `TaskTidyGraphIntegrator` 子 agent 的整合候选摘要和 integration blockers。
- `task-tidy` host agent 对整合候选的最终验收结论和综合判断：accepted、needs reintegration、blocked。
- 如果 blocked，说明是决策树临时文件缺失、图谱 mutation 阻塞，还是决策树字段不足导致无法映射。

### 3. Decision Tree Coverage Matrix
- 决策节点 ID/名称。
- 分支状态：accepted、rejected、open、superseded。
- 图谱落点：element、relationship、attribute、view、testcase 或 residual coordination。
- 控制点与观测点：对每个 explicit acceptance testcase 必填。
- 证据来源：Business Partner 对话、仓库文件、当前图谱、测试或人类确认。

### 4. Architecture Roadmap Report
- `/architecture-diff-plantuml` 生成的报告路径。
- 报告中的关键风险摘要，例如循环依赖、高 `G_cumulative` 或需要分段交付的节点建议。

### 5. Residual Coordination
- 无法进入图谱的残余协调事项；没有则写“无”。
- 每个残余事项必须说明为什么不能被持久化，以及需要人类做出的下一步业务决策。

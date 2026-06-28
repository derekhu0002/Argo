---
name: task-tidy
description: "Internalize business analysis into the intent architecture after business-partner or grill-me output, then delegate git-diff architecture roadmap visualization to architecture-diff-plantuml."
argument-hint: scope
disable-model-invocation: true
---

# Task Tidy

将 Business Partner 的业务分析、决策树遍历结果与架构依赖分析内化进意图架构。目标不是只记录最终结论，而是把每个业务可判定的决策节点、已选择分支、被拒绝分支、判断依据、依赖关系和验收边界都整合进 `design/KG/SystemArchitecture.json`。

## Rules

- **MUST** use the unified `argo` MCP mutation tools to write into `design/KG/SystemArchitecture.json`; do not edit the JSON file directly.
- **MUST** model goals, principles, requirements, and constraints as ArchiMate Motivation elements.
- **MUST** internalize the full Business Partner decision tree, not only the final recommendation.
- **MUST** preserve every business-decidable branch as one of: durable architecture element, relationship, element attribute, relationship attribute, view/sub-view, explicit acceptance testcase, or residual coordination item with a reason it cannot be persisted.
- **MUST** represent the accepted branch as active intent and rejected branches as decision rationale or constraints, so future agents can understand why alternatives were not chosen.
- **MUST** attach acceptance criteria or explicit testcase intent to the exact architecture element whose behavior, constraint, or business outcome is verified.
- **MUST** include acceptance-party control points and observation points for each explicit acceptance testcase intent.
- **MUST** split large decision trees into layered child views because each view may contain at most 7 elements.
- **MUST** delegate decision-tree-to-architecture integration to one dedicated `TaskTidyGraphIntegrator` subagent; the `task-tidy` host agent keeps orchestration, validation, conflict resolution, and synthesis responsibility.
- **MUST** validate the completeness, reasonableness, and traceability of the architecture integration, not the intrinsic quality of the Business Partner decision tree itself.
- **MUST** return to the same `TaskTidyGraphIntegrator` subagent session and continue the integration work when host validation finds an architecture-mapping omission, architecture conflict, unreasonable graph placement, missing testcase/control/observation mapping, or untraceable decision-tree node; do not start a new session merely to fix discovered gaps.
- **MUST** invoke `/architecture-diff-plantuml` after graph persistence so the current Git diff is converted into the PlantUML ArchiMate dependency roadmap.

## Workflow

### 1. Decision Tree Inventory
- 从 Business Partner 对话或 `DecisionTreeRecord` 输出中重建至少三层决策树：问题定义、分解维度、分支、推荐答案、人类确认/否决、依赖前提、风险和验收边界。
- 将重建后的决策树写入 `.argo/temp/decision-tree/[timestamp]-[sessionname-id].md`，其中 `timestamp` 使用当前时间戳，`sessionname-id` 使用本次 task-tidy 会话可识别名称和会话 id。
- 临时 Markdown 文件必须使用表格表达决策树节点，至少包含列：`id`、`parentId`、`level`、`question`、`MECE dimension`、`branchStatus`、`recommendedAnswer`、`humanDecision`、`businessRationale`、`dependencyPremises`、`risks`、`acceptanceControlPoint`、`acceptanceObservationPoint`、`horizontalConcern`、`verticalDependency`、`evidenceSource`。
- 后续 `TaskTidyGraphIntegrator` 必须以该临时表格文件为标准输入；不要只把决策树留在聊天上下文中。
- 对每个分支标注状态：accepted、rejected、open、superseded。
- 对每个节点记录其 MECE 维度：说明为什么该层分解相互独立且完全穷尽；如果无法证明，列为 open residual coordination。
- 对涉及现状实现、已有架构或代码行为的节点，先从仓库、图谱、测试或契约寻找答案；只有证据不足时才保留为 open question。

### 2. Dedicated Integration Delegation
- 委托 1 个 `TaskTidyGraphIntegrator` 子 agent，并在任务 prompt 中传入 task-tidy 刚写入的具体 decision tree 文件路径，例如 `.argo/temp/decision-tree/[timestamp]-[sessionname-id].md`。
- 子 agent 不得重新挑战已由 Business Partner 和人类达成共识的业务决策树；若发现决策树信息不足，只能作为 integration blocker 或 residual coordination 上报。

### 3. Persistence Mapping
- 将目标、原则、业务驱动、评估、需求、约束映射为 Motivation elements。
- 将业务能力、业务流程、应用行为、数据对象和对外可观察结果映射到 Business/Application/Data/Strategy elements。
- 将前置/后置依赖、影响、服务关系、触发关系、实现意图关系映射为 ArchiMate relationships，并用 `description` 或 `attributes` 保存方向性业务语义。
- 将被拒绝分支作为 rationale 保存到最相关 element/relationship 的 `attributes`，除非它本身构成独立 Constraint、Assessment 或 Requirement。
- 将决策树横向 concern 建成正交 view/sub-view；将纵向前置依赖建成 dependency view/sub-view，避免任一 view 超过 7 个元素。
- 将验收边界挂载为 owning element 的 `testcases`，并在 `description` 或 `Input` 中明确控制点和观测点；不要把上游元素的验收挂到下游焦点元素上。

### 4. Completeness Gate
- 在写图前输出 Decision Tree Coverage Matrix，逐项列出每个决策节点的 graph destination。
- 不允许用“已整理主要结论”替代覆盖证明；每个节点必须有 destination 或 residual reason。
- 如果某个 accepted/open 节点没有可挂载元素，先创建或更新对应 intent element，再挂载关系、属性或 testcase。
- 如果某个 rejected 节点会影响未来设计选择，必须保存 rejection rationale；只有纯一次性沟通噪音可以进入 residual coordination。

### 5. Graph Persistence
- 调用 `getSystemArchitecture` 识别现有节点、关系和 view。
- 使用 `previewSystemArchitectureMutation` 预览复杂变更。
- 使用 `applySystemArchitectureMutation` 或 focused mutation tools 持久化图谱。
- 变更后运行 `validateSystemArchitecture`；失败时修正图谱后再继续。

### 6. Host Validation and Synthesis
- `task-tidy` host agent 必须验收并综合 `TaskTidyGraphIntegrator` integration report。
- host agent 的验收范围仅限：整合完整度、图谱落点合理性、关系/属性语义一致性、验收 testcase/control/observation 挂载正确性、每个决策节点到图谱或 residual coordination 的可追踪性。
- host agent 不得把“决策树本身不够好”作为失败原因；如果输入决策树缺字段导致无法映射，应报告为 integration blocker。
- 任一候选方案或综合结果暴露整合遗漏、冲突、不合理落点或不可追踪节点时，host agent 必须 resume 同一个 `TaskTidyGraphIntegrator` 子 agent 会话继续修正，并在原会话中补齐缺口；不得为了修复已发现的问题另开新 session。

### 7. Roadmap Visualization
- 调用 `/architecture-diff-plantuml`。
- 让该 Skill 基于当前 `SystemArchitecture.json` Git diff 生成依赖子图、Sequential Gravity Chain、G 估算和 PlantUML Markdown 报告。

## Output

输出必须包含：

### 1. Graph Persistence Summary
- task-tidy 写入的决策树临时文件路径。
- 写入或更新了哪些 architecture elements、relationships、views、acceptance criteria/testcases。
- 每个写入对象对应决策树中的哪个节点或分支。
- `validateSystemArchitecture` 是否通过；未通过时列出阻塞项。

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

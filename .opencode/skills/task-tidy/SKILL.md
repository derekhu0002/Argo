---
name: task-tidy
description: "Internalize business analysis into the intent architecture after business-partner or grill-me output, then delegate git-diff architecture roadmap visualization to architecture-diff-plantuml."
argument-hint: scope
disable-model-invocation: true
---

# Task Tidy

将 Business Partner 的业务分析与架构依赖分析内化进意图架构。包括把可持久化的目标、原则、需求、约束、业务能力、应用行为和验收边界写入 `design/KG/SystemArchitecture.json`；

## Rules

- **MUST** use the unified `argo` MCP mutation tools to write into `design/KG/SystemArchitecture.json`; do not edit the JSON file directly.
- **MUST** model goals, principles, requirements, and constraints as ArchiMate Motivation elements.
- **MUST** internalize Business Partner conclusions into durable architecture elements (Application/Business/Data layers).
- **MUST** attach acceptance criteria or explicit testcase intent to the relevant architecture element when the source analysis provides verifiable acceptance boundaries.
- **MUST** invoke `/architecture-diff-plantuml` after graph persistence so the current Git diff is converted into the PlantUML ArchiMate dependency roadmap.

## Workflow

### 1. Intent Extraction
- 提取 Motivation、Strategy、Business、Application、Technology 各层意图。
- 区分可长期复用的架构意图与一次性协调事项。
- 将验收标准归属到最能代表该行为或约束的 intent element。

### 2. Graph Persistence
- 调用 `getSystemArchitecture` 识别现有节点、关系和 view。
- 使用 `previewSystemArchitectureMutation` 预览复杂变更。
- 使用 `applySystemArchitectureMutation` 或 focused mutation tools 持久化图谱。
- 变更后运行 `validateSystemArchitecture`；失败时修正图谱后再继续。

### 3. Roadmap Visualization
- 调用 `/architecture-diff-plantuml`。
- 让该 Skill 基于当前 `SystemArchitecture.json` Git diff 生成依赖子图、Sequential Gravity Chain、G 估算和 PlantUML Markdown 报告。

## Output

输出必须包含：

### 1. Graph Persistence Summary
- 写入或更新了哪些 architecture elements、relationships、views、acceptance criteria/testcases。
- `validateSystemArchitecture` 是否通过；未通过时列出阻塞项。

### 2. Architecture Roadmap Report
- `/architecture-diff-plantuml` 生成的报告路径。
- 报告中的关键风险摘要，例如循环依赖、高 `G_cumulative` 或需要分段交付的节点建议。


### 4. Residual Coordination
- 无法进入图谱的残余协调事项；没有则写“无”。
---
name: task-tidy
description: "Internalize business analysis into the intent architecture AND produce a sequential gravity chain with G-estimation for the subsequent workflow."
argument-hint: scope
disable-model-invocation: true
---

# Task Tidy

将 Business Partner 的业务分析与架构依赖分析内化进意图架构。本 skill 的核心目标是消除语义歧义（C），并通过拓扑排序和规模预估（G）为后续交付流程锁定确定性轨道。

## Rules

- **MUST** use the unified `argo` MCP mutation tools to write into `design/KG/SystemArchitecture.json`; do not edit the JSON file directly.
- **MUST** model goals, principles, requirements, and constraints as ArchiMate Motivation elements.
- **MUST** internalize Business Partner conclusions into durable architecture elements (Application/Business/Data layers).
- **MUST: Sequential Gravity Chain**: 必须根据 ArchiMate 依赖语义（Serving, Realization, Access, Composition）对受影响元素进行拓扑排序。
- **MUST: G-Estimation**: 为列表中的每个元素计算单次规模 ($G_{self}$) 与累积规模 ($G_{cumulative}$)。
- **MUST: Handoff Guidance**: 产出明确的架构元素列表与任务说明，作为后续 `Orchestrator` 的输入。

## Workflow

### 1. Intent Extraction & Internalization (基础内化)
- 提取 Motivation、Strategy、Business、Application、Technology 各层意图。
- 调用 `getSystemArchitecture` 识别现有节点。
- 执行 MCP 变更为图谱打下“引力桩”。

### 2. Dependency Topology Sorting (重力序分析)
- **Identify Impact Subgraph**: 识别本次需求涉及的所有 `Pending` 或 `Dirty` 状态的元素。
- **Topological Sort**: 按照依赖顺序排列。
  - 规则：被依赖的（地基）在前，依赖他人的（上层）在后。
  - 若存在循环依赖，必须作为“架构风险”向用户报告。

### 3. G-Estimation Logic (规模预估算子)
- **Estimate $G_{self}$**: 
  - 计算单节点复杂度。基准：1个 Functional Point = 1.5G；1个外部 Interface = 2G。
- **Compute $G_{cumulative}$**: 
  - 计算到达该节点所需的总能量：$G_{cumulative} = G_{self} + \sum (\text{所有状态非 PASSED 的上游依赖之 } G_{self})$。
- **Risk Alert**: 
  - 若 $G_{cumulative} > 10$，标记为“高熵风险”，必须建议 Orchestrator 采用拆分交付策略。

### 4. Persistence (落盘)
- 调用 `applySystemArchitectureMutation` 持久化图谱。

## Output

输出一份结构化的 **“意图交付路由表 (Intent Delivery Roadmap)”**，包含：

### 1. Sequential Gravity Table
| 建议顺序 | 元素 ID | 变更性质 | $G_{self}$ | $G_{cumulative}$ | 确定性等级 | 任务简述 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 (地基) | [ID] | [Add/Mod] | [1-10] | [Sum] | [Stable/Drift] | [Delta说明] |
| 2 | ... | ... | ... | ... | ... | ... |

### 2. Context Anchors (引力锚点)
- 列出后续工作流必须加载的关键上游契约文件或图谱视图。

### 3. Residual Coordination
- 无法进入图谱的长链条任务描述。
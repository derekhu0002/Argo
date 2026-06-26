---
name: task-tidy
description: "Internalize business analysis into the intent architecture AND dynamically analyze the sequential gravity chain with G-estimation for the subsequent workflow."
argument-hint: scope
disable-model-invocation: true
---

# Task Tidy

将 Business Partner 的业务分析与架构依赖分析内化进意图架构。本 skill 的核心目标是消除语义歧义（C），并通过拓扑排序和规模预估（G）为后续交付流程锁定确定性轨道。

## Rules

- **MUST** use the unified `argo` MCP mutation tools to write into `design/KG/SystemArchitecture.json`; do not edit the JSON file directly.
- **MUST** model goals, principles, requirements, and constraints as ArchiMate Motivation elements.
- **MUST** internalize Business Partner conclusions into durable architecture elements (Application/Business/Data layers).
- **MUST: Dynamic Impact Discovery**: 严禁依赖静态状态字段。必须通过比对“新内化的意图”与“代码仓事实/测试记录”动态判定受影响元素：
  - **New**: 在图谱中定义但仓库中尚无物理实现或追踪证据的元素。
  - **Dirty**: 现有元素的 FunctionalPoint 已更新，但代码逻辑或测试结果尚未与之同步。
- **MUST: Sequential Gravity Chain**: 必须根据 ArchiMate 依赖语义（Serving, Realization, Access, Composition）对受影响元素进行拓扑排序。
- **MUST: G-Estimation**: 为列表中的每个元素计算单次规模 ($G_{self}$) 与累积规模 ($G_{cumulative}$)。

## Workflow

### 1. Intent Extraction & Internalization (基础内化)
- 提取 Motivation、Strategy、Business、Application、Technology 各层意图。
- 调用 `getSystemArchitecture` 识别现有节点。
- 执行 MCP 变更为图谱打下“引力桩”。

### 2. Dynamic Ripple Analysis (自动影响分析)
- **Trace the Ripple**: 从新注入的 Motivation 节点出发，沿着 Realization 或 Influence 关系向下游探测受影响的 Application/Business 元素。
- **Cross-Check Reality**: 将图谱中的元素定义与 `Code Reality`（代码、测试记录、`test-failure-records.json`）进行交叉比对。
- **Identify Delta**: 识别出哪些元素属于 **New**（缺失实现）或 **Dirty**（实现过期/测试失败），形成动态变更子图。

### 3. Dependency Topology Sorting (重力序分析)
- **Topological Sort**: 按照依赖顺序排列。
  - 规则：被依赖的（地基）在前，依赖他人的（上层）在后。
  - 若存在循环依赖，必须作为“架构风险”向用户报告。

### 4. G-Estimation Logic (规模预估算子)
- **Estimate $G_{self}$**: 计算单节点复杂度。基准：1个 Functional Point = 1.5G；1个外部 Interface = 2G。
- **Compute $G_{cumulative}$**: 递归求和：该元素的 $G_{self}$ + 依赖链上所有其他受影响元素的 $G_{self}$。
- **Risk Alert**: 若 $G_{cumulative} > 10$，标记为“高熵风险”，建议 Orchestrator 采用分段交付策略。

### 5. Persistence (落盘)
- 调用 `applySystemArchitectureMutation` 持久化图谱。

## Output

输出一份结构化的 **“意图交付路由图 (Intent Delivery Roadmap)”**，包含：

### 1. PlantUML ArchiMate Dependency Graph
- 必须输出一个 `plantuml` 代码块，表达基于 ArchiMate 语义的受影响元素依赖图。
- 节点必须包含：建议交付顺序、元素 ID和名称、ArchiMate 元素类型、变更性质（New/Dirty）、$G_{self}$、$G_{cumulative}$、确定性等级和任务简述。
- 边必须使用 ArchiMate 关系名标注：`Serving`、`Realization`、`Access`、`Composition` 或其他实际存在的关系；方向必须体现“被依赖的地基 -> 依赖它的上层”。
- 若存在循环依赖，必须在图中标出 `Cycle Risk`，并在图后说明为什么不能形成稳定的 Sequential Gravity Chain。

```plantuml
@startuml
title Intent Delivery Roadmap - ArchiMate Dependency Graph

skinparam rectangle {
  BackgroundColor #EFF6FF
  BorderColor #2563EB
}
skinparam note {
  BackgroundColor #FFF7ED
  BorderColor #EA580C
}

rectangle "1. [Element Name]\nID: [element-id]\nType: [ArchiMateType]\nDelta: [New|Dirty]\nG: [self]/[cumulative]\nCertainty: [Stable|Drift]\nTask: [short task]" as E1 <<[ArchiMateType]>>
rectangle "2. [Element Name]\nID: [element-id]\nType: [ArchiMateType]\nDelta: [New|Dirty]\nG: [self]/[cumulative]\nCertainty: [Stable|Drift]\nTask: [short task]" as E2 <<[ArchiMateType]>>

E1 --> E2 : [Serving|Realization|Access|Composition]

note right of E1
地基优先：先交付上游依赖，
再进入下游消费者。
end note
@enduml
```

### 2. Context Anchors (引力锚点)
- 列出后续工作流必须加载的关键上游契约文件或图谱视图。

### 3. Residual Coordination
- 无法进入图谱的长链条任务描述。
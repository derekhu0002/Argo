# 意图架构设计

ARGO 使用 ArchiMate 构建人类与 Agent 共同导航的系统地图。意图架构描述目标、能力、业务行为、应用实现、技术支撑、依赖和验收语义；代码可以证明实现状态，但不能未经批准改写意图。

## 核心资产

| 资产 | 职责 |
| --- | --- |
| `design/KG/SystemArchitecture.json` | 元素、关系、view、属性和显性 testcase 的事实源 |
| `.argo/schema/SystemArchitecture.schema.json` | JSON 结构约束 |
| `.argo/scripts/archimate32-rules.js` | ArchiMate 3.2 关系端点规则 |
| `.argo/skills/modeling/*/SKILL.md` | Viewpoint 专属建模方法 |
| `design/KG/test-failure-records.json` | 架构 testcase 执行状态和修复输入 |

字段到 Enterprise Architect 的映射见[Schema 与 EA 映射](../schema-ea-mapping.md)。

## Viewpoint-first 建模

默认入口不是按 ArchiMate layer 分桶，而是按业务关注点组织：

| Baseline Viewpoint | Stakeholders / concerns | 典型内容 |
| --- | --- | --- |
| `StakeholderIntentViewpoint` | 目标所有者、受益者、决策者 | Stakeholder、Driver、Goal、Principle、Requirement |
| `OutcomeCapabilityViewpoint` | 产品、战略、投资与能力负责人 | Outcome、Capability、Value Stream、Resource |
| `BusinessBehaviorViewpoint` | 业务角色、运营和领域专家 | Actor、Role、Process、Event、Service、Object、Product |
| `CapabilityRealizationViewpoint` | 架构师、应用/数据/技术负责人 | Application Service、Component、Data Object、Technology |
| `AcceptanceDeliveryViewpoint` | 交付、测试、风险和治理角色 | Gap、Work Package、Deliverable、Plateau、横向依赖 |

每个 baseline viewpoint 元素通过 `attributes[].name = "modelingSkillPaths"` 挂载适用 Skill。Agent 修改 view 前必须先读取对应 Skill，再按其 stakeholders、concerns、purpose、scope、元素范围和关系语义建模。

ArchiMate layer 仍由元素 `type` 表达，可用于校验和专门子视图，但不是默认导航入口。

## 建模原则

1. **业务关注点优先**：先确定 viewpoint 要回答的问题，再选择元素。
2. **语义和方向优先**：关系类型、source/target 和上下文比名称直觉更重要。
3. **View 是认知边界**：每个 view 服务单一关注点，并遵守最多 7 个元素的约束。
4. **验收挂回责任元素**：每个 functional point 由同元素下的显性 testcase 证明。
5. **依赖形成交付顺序**：纵向关系用于推导上游、下游和 Sequential Gravity Chain。
6. **图谱优先于对话**：长期有效决策必须进入图谱，不能只留在聊天或临时任务文档。
7. **候选不等于事实**：反推结果、实现观察和测试变化须经对应阶段门禁后才能提升。

完整理念与案例见[ARGO HARNESS 的 ArchiMate 建模理念](../../notes/architecture-modeling/ARGO%20HARNESS%20的%20ArchiMate%20建模理念.md)。

## 显性验收

`ExplicitAcceptanceTestcase` 是意图的一部分，不是编码后的补充：

- testcase 挂在拥有业务边界的元素上；
- `acceptanceCriteria` 指向单一 workspace-relative 可执行入口；
- 实现设计负责物理化入口并冻结；
- 编码阶段只能执行和修复生产行为，不能修改验收含义；
- `runArchitectureTests` 刷新失败记录和 `deliveryStatus`。

需求文档、方案说明、linter 通过或 schema 通过都不能替代逐 functional point 的 testcase 覆盖证据。

## 受控变更流程

禁止把复杂图谱修改当作普通文本编辑。常规路径是：

```text
getSystemArchitecture / getIntentElementContext
  → 选择目标 viewpoint 并读取 modeling skill
  → previewSystemArchitectureMutation
  → applySystemArchitectureMutation
  → validateSystemArchitecture
  → validateStageHandoff
```

简单单对象操作可以使用 focused 工具及 `dryRun: true`；复杂、多步或涉及 view membership 的变更优先使用批量 mutation。

完整接口见[意图架构 MCP 功能列表](../mcp/意图架构%20MCP%20功能列表.md)，完整校验矩阵见[MCP 校验机制](../validator/intent-architecture-mcp-validation.md)。

## 与 HARNESS 的关系

| 角色 | 对意图架构的权限 |
| --- | --- |
| BusinessPartner | 读取并分析，不直接写入 |
| TaskTidyGraphIntegrator | 生成候选 mutation 和覆盖证据 |
| IntentionDesign | 常规写入、校验和 handoff 的责任阶段 |
| ImplementationDesign | 只读子图；缺口通过 trace proposal 上报 |
| CodingAndReparing | 只读上下文，执行显性 testcase |
| ReverseArchitectureExtraction | 只输出候选，交正式阶段提升 |

阶段闭环见[HARNESS 工程流程](../argo-harness/README.md)。

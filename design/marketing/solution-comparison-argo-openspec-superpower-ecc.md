# ARGO、OpenSpec、Superpowers 与 ECC 方案对比

本文是方案选型的稳定摘要。详细论证、版本观察和公式映射保留在 `notes/ai-engineering/harness-research/`，避免把时效性研究直接当作产品设计事实。

## 核心定位

| 方案 | 一句话定位 | 主要强项 | 主要补位需求 |
| --- | --- | --- | --- |
| **ARGO** | 面向高确定性交付的架构知识图谱驱动 Harness | 意图图谱、阶段门禁、契约、测试追踪、双层验收 | 小任务可能偏重，需要流程纪律 |
| **OpenSpec** | 轻量、灵活的规格协作层 | 快速建立 proposal/spec/design/task 协作 | 复杂系统需补架构治理和强验收 |
| **Superpowers** | 把优秀工程动作封装为可触发 Skill | brainstorming、计划、TDD、评审和执行效率 | 需上层事实源和跨阶段一致性治理 |
| **ECC** | 跨平台、多语言、多场景的 AI 工程能力池 | Agent、Skill、Hook、规则和工具生态 | 能力面广，团队需自定治理策略 |

## 关键差异

| 维度 | ARGO | OpenSpec | Superpowers | ECC |
| --- | --- | --- | --- | --- |
| 核心目标 | 架构一致、稳定、可审计交付 | 低门槛规格协作 | 工程动作自动化 | 规模化能力供给 |
| 事实源 | ArchiMate 意图图谱 + 实现契约 | 规格文档集合 | 当前任务与 Skill 流程 | 多类配置与知识资产 |
| 流程风格 | 强阶段、强门禁、GAP 回流 | 动作驱动、灵活往返 | Skill 触发、实践驱动 | 可组合工程操作系统 |
| 架构治理 | 强 | 中低 | 中 | 中高，依赖配置 |
| 验收约束 | 显性 testcase、冻结入口、双层验收 | 团队自行加强 | TDD/验证实践 | 由工具与规则组合 |
| 上手成本 | 高 | 低 | 中 | 中高 |

## 选型建议

- 最在意复杂系统的架构一致性、追踪和可审计验收：优先 ARGO。
- 最在意轻量启动和需求探索速度：优先 OpenSpec。
- 已有治理框架，希望显著提高日常工程动作质量：引入 Superpowers。
- 需要跨团队、跨技术栈统一建设 Agent 工程能力：评估 ECC。

这些方案并非互斥：

- 轻量团队：`OpenSpec + Superpowers`
- 成熟研发团队：`ARGO + Superpowers`
- 平台型团队：`ARGO + ECC`
- 大型多业务团队：在统一治理边界下组合 `OpenSpec + ARGO + ECC`

组合时必须明确唯一事实源和阶段责任，不能让多套 spec、task 和 memory 同时声明同一业务事实。

## ARGO 的独特锚点

ARGO 的核心差异不是 Agent 数量，而是将确定性交付公式工程化：

$$Total\ Certainty = C \times \frac{(P \cdot B) \times E}{G}$$

- 用 BusinessPartner 与显性验收提高 `C`；
- 用图谱、契约和 handoff 提高 `P`；
- 用 validator、测试、权限和人类门禁提高 `B`；
- 用聚焦子图和清晰架构提高 `E`；
- 用架构依赖切分和顺序交付降低 `G`。

因此，其他方案的 Skill、工具和生态可以增强 ARGO，但不能替代其意图事实源和阶段闭环。

## 研究依据

- [OpenSpec 确定性交付公式评估与 ARGO 差异对比](../../notes/ai-engineering/harness-research/OpenSpec%20确定性交付公式评估与%20ARGO%20差异对比.md)
- [Superpowers 确定性交付公式映射评估](../../notes/ai-engineering/harness-research/superpower%20确定性交付公式映射评估.md)
- [ECC 确定性交付公式评估](../../notes/ai-engineering/harness-research/ECC-确定性交付公式评估.md)

研究文档可能随外部项目演进而过期；本摘要只保留对 ARGO 当前设计决策稳定有效的结论。

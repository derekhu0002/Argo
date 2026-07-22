# Agent 与 Skill 设计

ARGO 用 Agent 承担有状态的阶段职责，用 Skill 封装可复用的横切方法或领域能力。Agent 决定“谁对阶段结果负责”，Skill 决定“某类工作按什么方法执行”。

## 设计原则

1. **阶段 Agent 拥有明确事实源**：只能修改本阶段资产。
2. **主编排不替代阶段判断**：Orchestrator 负责路由、校验和返工，不直接实现。
3. **Skill 不创造第二事实源**：输出必须进入图谱、契约、测试或正式归档。
4. **通用能力与领域能力分离**：工程流 Skill 在本目录说明；领域 Skill 在 `design/specific-domain/` 说明。
5. **三平台语义一致**：文件形态可以不同，阶段、门禁和产出不能漂移。

## 核心 Agent

| Agent | 职责 | 允许变更 | 禁止事项 |
| --- | --- | --- | --- |
| `BusinessPartner` | 收敛业务问题、方案、风险和验收控制点 | 决策记录 | 不进入实现设计或编码 |
| `TaskTidyGraphIntegrator` | 把决策树映射为意图图谱候选 | 候选 mutation 与覆盖证据 | 不重新裁决已确认业务决策 |
| `IntentionDesign` | 维护意图、覆盖和显性 testcase | `SystemArchitecture.json`、意图 handoff | 不改业务代码、实现契约和测试代码 |
| `ImplementationDesign` | 维护实现边界、测试入口和实现 handoff | 实现契约、测试入口、实现 handoff | 不直接改意图图谱 |
| `CodingAndReparing` | 修复真实生产行为并清空修复队列 | handoff 允许的源码和支持性测试 | 不改冻结测试与架构契约 |
| `ReverseArchitectureExtraction` | 从测试和代码恢复候选架构或分类 drift | 候选报告、证据矩阵 | 不直接提升候选为正式架构 |
| `ArchimateLanguagistAudit` | 审计 ArchiMate schema、语义和措辞 | 默认只读 | 不默认修图 |
| `CleanArchitectureAuditor` | 审计依赖规则、稳定性和组件边界 | 默认只读 | 不把实现偏好提升为业务意图 |

OpenCode 和 GitHub Copilot 使用 `Orchestrator` 主 Agent；Cursor 不支持自定义主 Agent，由 `/orchestrating` Skill 承担同等编排职责。OpenCode 的 `Init` / `Test` Agent 分别承接工作区初始化和全量架构测试。

## 工程流 Skill

### 入口与编排

| Skill | 何时使用 | 产出/路由 |
| --- | --- | --- |
| `/business-partner` | 需求或方案尚未结构化 | `DecisionTreeRecord` |
| `/task-tidy` | 已有决策树，需要内化并排序 | 图谱变更、覆盖证据、依赖图、G 估算 |
| `/orchestrating` | Cursor 中执行完整交付链 | 阶段调度、校验、审核和返工 |
| `/grill-me` | 方案需要批判性深挖 | 收敛后的决策树 |

### 架构发现与治理

| Skill | 使用前提 | 核心边界 |
| --- | --- | --- |
| `/reverse-architecture-extraction` | 缺少可信架构基线 | 从测试优先恢复候选，不直接写正式图谱 |
| `/architecture-drift-recovery` | 已有可信基线，代码/测试被外部修改 | 分类 intent / implementation / code / test drift |
| `/improve-codebase-architecture` | 需要发现重构候选 | 只输出候选，选中后再深挖和内化 |
| `/distill-agent-rules` | Agent 重复偏航或 memory 已成熟 | 固化到 Skill/Rule/Hook 后清理源记忆 |

### 验收与返工

| Skill | 检查对象 | GAP 路由 |
| --- | --- | --- |
| `/coding-delivery-acceptance` | 代码是否满足实现契约 | 实现设计或编码 |
| `/coding-gap-report` | 编码 GAP 修复范围 | `CodingAndReparing` |
| `/implementation-delivery-acceptance` | 实现是否满足意图 | 意图设计或实现设计 |
| `/impl-gap-report` | 意图侧 GAP 的实现影响 | `ImplementationDesign` |

### 研究、说明与归档

| Skill | 用途 |
| --- | --- |
| `/market-research` | 有来源归因的市场、竞品和技术研究 |
| `/brief` | 基于正式架构生成采用者说明 |
| `/delivery-archive` | 归档 PRD、架构、代码自测和规格验收证据 |
| `/architecture-talk-deck` | 从指定 ArchiMate 子图生成可追踪架构讲稿 |

## 领域 Skill

具体领域的开发知识、编码规范、设备环境、截图分析和交付预检，不属于通用 HARNESS 设计。它们按领域放在：

```text
design/specific-domain/<domain>/README.md
```

当前已整理的领域见[领域模板索引](../specific-domain/README.md)。

## 平台映射

| 能力 | Cursor | GitHub Copilot | OpenCode |
| --- | --- | --- | --- |
| 主编排 | `/orchestrating` Skill | `Orchestrator` Agent | `Orchestrator` Agent |
| 业务入口 | `/business-partner` Skill | `BusinessPartner` Agent/Skill | `BusinessPartner` Agent/Skill |
| 阶段 Agent | `.cursor/agents/` | `.github/agents/` | `.opencode/agents/` |
| Skill | `.cursor/skills/` | `.github/skills/` | `.opencode/skills/` |
| MCP | 统一 `argo` 服务 | 统一 `argo` 服务 | 统一 `argo` 服务 |

部署时平台目录必须和 `.argo/` 一起复制；`.argo/` 承载跨平台 schema、脚本、规则和共享领域能力。

## 自检清单

阶段 Agent 在关键门禁点显式加载独立清单，避免长上下文稀释要求：

| 阶段 | 清单 |
| --- | --- |
| IntentionDesign | `.argo/rules/INTENTION_DESIGN_CHECKLIST.md` |
| ImplementationDesign | `.argo/rules/IMPLEMENTATION_DESIGN_CHECKLIST.md` |
| CodingAndReparing | `.argo/rules/CODING_DELIVERY_ACCEPTANCE.md` |

清单是检索增强的门禁摘要；完整语义仍以 Agent 的 Domain Ontology、Behavior、图谱 schema 和 validator 为准。

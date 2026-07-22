# ARGO 设计文档导航

`design/` 是 ARGO 已确认设计与可执行规范的入口。根 `README.md` 只解释产品定位、核心方法、快速上手和导航；机制细节在这里按职责分层维护。

## 阅读路径

| 你想了解 | 首选文档 | 内容边界 |
| --- | --- | --- |
| ARGO 为什么能提高 AI 交付确定性 | [工程哲学与确定性交付公式](../notes/ai-engineering/ARGO%20工程哲学：确定性交付公式的工程化.md) | 第一性原理、公式因子和工程定律 |
| ARGO 由什么组成、如何协同 | [总体架构](architecture.md) | 意图架构数据、架构服务 MCP、HARNESS 工程流 |
| 主交付流程、阶段门禁和事实源 | [HARNESS 工程流程](argo-harness/README.md) | 从业务澄清到双层验收的完整闭环 |
| Agent、Skill 如何分工 | [Agent 与 Skill 设计](argo-harness/agents-and-skills.md) | 角色边界、能力分类、平台映射 |
| 某类工作应从哪里开始 | [使用场景](argo-harness/usage-scenarios/README.md) | 新需求、缺陷、反推、漂移恢复、治理等入口 |
| 意图架构为什么使用 ArchiMate | [意图架构设计](intent-architecture/README.md) | 图谱、viewpoint、建模规则和事实源 |
| MCP 有哪些工具 | [意图架构 MCP 功能列表](mcp/意图架构%20MCP%20功能列表.md) | 工具参数、副作用和调用顺序 |
| 图谱如何校验 | [MCP 校验机制](validator/intent-architecture-mcp-validation.md) | Schema、图语义、mutation 和失败引导 |
| JSON 如何映射到 EA | [Schema 与 EA 映射](schema-ea-mapping.md) | 字段级导入导出映射 |
| 具体技术领域如何扩展 | [领域模板索引](specific-domain/README.md) | 领域 Skill、知识、环境和验收能力 |
| ARGO 与其他 Harness 的差异 | [方案对比](marketing/solution-comparison-argo-openspec-superpower-ecc.md) | OpenSpec、Superpowers、ECC 对比 |

## 文档分层

```text
README.md                         产品入口：为什么、是什么、如何开始
design/
├── README.md                     设计导航与文档治理
├── architecture.md               三大核心构件及其协作
├── intent-architecture/          意图架构、建模与图谱治理
├── argo-harness/                 工程流程、Agent、Skill、使用场景
├── mcp/                          架构服务接口
├── validator/                    可执行校验与门禁
├── specific-domain/              可插拔领域模板
├── marketing/                    市场和方案对比
└── KG/                           机器可读架构事实与测试状态
notes/                            研究、推导和尚未成为规范的材料
```

## 事实源规则

同一事实只在一个层级作为权威来源，其他文档通过链接引用：

1. `design/KG/SystemArchitecture.json` 是意图架构的结构化事实源。
2. `OVERALL_ARCHITECTURE.md` 与局部 `ARCHITECTURE.md` 是项目实现架构契约；本仓库当前仅在需要时生成。
3. `.argo/temp/*Handoff.json` 是阶段间临时交接协议，不是长期设计文档。
4. `design/argo-harness/` 维护工程流程、角色边界和使用方式。
5. `design/mcp/` 与 `design/validator/` 维护工具和校验的实现语义。
6. `notes/` 维护研究依据；内容成为稳定规范后，应在 `design/` 建立权威说明并反向引用研究。

## 维护约定

- 根 README 不维护完整工具、Agent、Skill 或场景步骤清单。
- 流程变化先更新 `design/argo-harness/`，再检查根 README 摘要是否仍准确。
- MCP 行为变化同步更新工具清单与 validator 文档。
- 意图图谱变更遵循 workspace 的 viewpoint-first 建模规则，并通过 MCP preview、apply、validate。
- 领域能力按 `design/specific-domain/<domain>/` 隔离，不把领域细节回填到通用 HARNESS 文档。

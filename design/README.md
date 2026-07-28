# ARGO 设计文档导航

`design/` 是 ARGO 已确认设计与可执行规范的稳定地图，也是 fact-source 治理入口。根 [README.md](../README.md) 是安静的产品采用路由；根 [CONTRIBUTING.md](../CONTRIBUTING.md) 是贡献者与治理入口；本页负责把读者带到稳定设计权威，不复制深层 MCP、validator 或生命周期细节。

## 阅读路径

| 你想了解 | 首选文档 | 内容边界 |
| --- | --- | --- |
| ARGO 为什么能提高 AI 交付确定性 | [工程哲学与确定性交付公式](../notes/ai-engineering/ARGO%20工程哲学：确定性交付公式的工程化.md) | 第一性原理、公式因子和工程定律 |
| 第一次了解产品定位和快速上手 | [root README product entry](../README.md) | 产品定位、核心方法、安装入口和精选深链 |
| 准备修改 MCP、validator、测试或文档 | [CONTRIBUTING.md governance entry](../CONTRIBUTING.md) | fact-source priority、安全改动面、阶段边界和验证命令 |
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
| 测试资产归属和冻结边界 | [测试架构契约](../tests/ARCHITECTURE.md) | 显式入口、关键 guard、支撑性测试和 Coding 冻结规则 |

## 文档分层

```text
README.md                         产品入口：为什么、是什么、如何开始
CONTRIBUTING.md                   贡献者入口：治理、边界、验证命令
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
2. [README.md](../README.md) 是 root README 产品入口；它只安静地介绍和路由，不承载深层规范。
3. [CONTRIBUTING.md](../CONTRIBUTING.md) 是贡献者治理入口；它说明 safe change surfaces、阶段边界、验证命令和冻结策略。
4. [tests/ARCHITECTURE.md](../tests/ARCHITECTURE.md) 是测试资产所有权、显式入口、关键非显式 guard 与冻结边界的契约。
5. `.argo/temp/ImplementationToCodingHandoff.json` 是当前 Coding/Repair scope、入口点、冻结文件和目标路径的临时交接协议，不是长期设计文档。
6. `design/argo-harness/` 维护工程流程、角色边界和使用方式。
7. `design/mcp/` 与 `design/validator/` 维护工具和校验的实现语义。
8. `design/specific-domain/` 维护可插拔领域模板；`design/marketing/` 维护方案对比和对外表达边界。
9. `notes/` 维护研究依据；内容成为稳定规范后，应在 `design/` 建立权威说明并反向引用研究。

## 维护约定

- 根 README 不维护完整工具、Agent、Skill 或场景步骤清单。
- CONTRIBUTING.md 不复制稳定设计细节；它只给维护者足够的治理入口和验证路线。
- 流程变化先更新 `design/argo-harness/`，再检查根 README 摘要是否仍准确。
- MCP 行为变化同步更新工具清单与 validator 文档。
- 意图图谱变更遵循 workspace 的 viewpoint-first 建模规则，并通过 MCP preview、apply、validate。
- 领域能力按 `design/specific-domain/<domain>/` 隔离，不把领域细节回填到通用 HARNESS 文档。

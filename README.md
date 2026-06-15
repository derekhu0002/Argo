# Argo HARNESS

Argo 是一套面向 AI Coding 的 HARNESS 工程方法与配套实现。它把意图架构、实现架构、测试边界、失败记录和阶段交接组织成一个可重复、可验证、可回归的闭环。

## 快速上手

### 部署

| 版本 | 适用环境 | 说明 |
| --- | --- | --- |
| [Copilot 版](.github/README.md) | GitHub Copilot | 拷贝`.github`目录到您的工作区根目录 |
| [OpenCode 版](.opencode/README.md) | OpenCode | 拷贝`.opencode`目录到您的工作区根目录 |
| [Cursor 版](.cursor/README.md) | Cursor | 拷贝`.cursor`目录到您的工作区根目录 |

### 主要使用场景

| 场景 | 目的 | 操作 |
| --- | --- | --- |
| 新需求开发或新问题处理 | 开发需求或解决问题 | `opencode`和`github copilot` ：选择Orchestrator主agent，建议输入：[需求/问题] 具体描述（或opencode中用`@`(copilot中用`#`)引用文件路径） //使用`@`或`#`可以将文本内容直接加载进上下文，省去Agent读文件过程并确保完整文件内容进入上下文 <br> `cursor` ：直接在主Agent中通过`/orchestrating` skill + [需求/问题] 具体描述 <br> //`cursor`不支持自定义主Agent，因此通过skill发起编排调度流程|

`github copilot`使用示例：
![alt text](image-5.png)
`opencode`使用示例：首先切换到Orchestrator主Agent，然后通过@引用需求文档
![alt text](image-4.png)
`cursor`使用示例：首先调用orchestrating skill，然后跟上需求，也可以通过@引用文档
![alt text](image-3.png)

## 当前已录SubAgents 和 Skills

Argo 主流程分为 **意图设计 → 实现设计 → 编码/修复 → 双层验收** 四个阶段；另有 **编排、前置业务、治理复盘、辅助工具** 等横切能力。下表说明每个 SubAgent 与 Skill 的适用阶段及其作用。

### SubAgents

| 名称 | 适用阶段 | 作用 | 平台 |
| --- | --- | --- | --- |
| `Orchestrator` | 编排（全阶段） | 总调度者：接收需求或问题后按阶段转交子 Agent，在编码完成后触发实现架构与意图架构双向审计，审计失败时要求对应阶段返工；禁止直接处理需求或修改实现产物 | Copilot、OpenCode（主 Agent） |
| `IntentionDesign` | 意图设计 | 以 `design/KG/SystemArchitecture.json` 为第一真相源，澄清需求，维护意图元素/关系/视图/原则/约束/显性验收 testcase，产出并校验 `IntentToImplementationHandoff.json`；禁止修改业务代码与测试代码 | 全平台 |
| `ImplementationDesign` | 实现设计 | 将意图架构落盘为实现架构契约（`OVERALL_ARCHITECTURE.md`、局部 `ARCHITECTURE.md`）、显性 testcase 物理入口、关键非显性测试护栏，产出 `ImplementationToCodingHandoff.json`；禁止修改意图图谱 | 全平台 |
| `CodingAndReparing` | 编码/修复 | 依据 `ImplementationToCodingHandoff.json` 与 `test-failure-records.json` 修复真实实现，执行既有测试入口直至显性 testcase 全部通过；禁止修改冻结测试与架构契约 | 全平台 |
| `ArchimateLanguagistAudit` | 意图设计（审计） | 从 ArchiMate 语言学家视角审计 `SystemArchitecture.json` 的 schema 合规、元素/关系语义、措辞精确性、视图一致性与追踪质量；默认只审计不改文件 | 全平台 |
| `BusinessPartner` | 前置/业务 | 以 MECE 决策树和 SMART 标准严苛拆解业务问题，逐分支追问直到逻辑无懈可击，产出含控制点与观测点的验收标准；聚焦业务本身，不进入架构与代码 | Copilot、OpenCode |
| `Init` | 初始化 | 承接 `/argoinit`，调用 `argo_init` 初始化 Argo 工作区（复制 EA 模板、重置阶段交接文件） | OpenCode |
| `Test` | 编码/修复（验收执行） | 承接 `/argotest`，调用 `argo_test` 执行全量显性 testcase 并刷新 `test-failure-records.json`，为编码阶段提供修复队列 | OpenCode |
| `teacher` | 辅助/通用 | 循序渐进的教学伙伴，帮助用户深入理解任意主题并形成共同认知；不承担主交付链路 | 全平台 |

> **Cursor 说明**：Cursor 不支持自定义主 Agent，因此 `Orchestrator` 的角色由 `/orchestrating` Skill 承担（见下表）。

### Skills

| 名称 | 适用阶段 | 作用 | 调用方式 |
| --- | --- | --- | --- |
| `orchestrating` | 编排（全阶段） | Cursor 版总调度：固化意图设计 → 实现设计 → 编码/修复 → 双向审计的完整工作流规则，禁止主 Agent 越权直接处理需求或修改实现 | `/orchestrating` |
| `grill-me` | 意图设计 / 通用 | 以强批判性思维无情拷问计划或设计，逐分支遍历决策树直到达成共识；可从仓库自行取证；各阶段均可使用但效果因阶段边界而异 | `/grill-me` |
| `improve-codebase-architecture` | 意图设计（前置探索） | 在不引入功能需求的前提下，先识别 shallow module、接缝泄漏、测试面失焦等架构优化候选，再将选中方向交给 `grill-me` 深挖；宜作为独立迭代的需求输入而非单次指令 | `/improve-codebase-architecture` |
| `business-partner` | 前置/业务 | 与 `BusinessPartner` Agent 等效的业务方案拷问流程：MECE 决策树拆解、SMART 问题定义、验收 testcase 输出 | `/business-partner` |
| `task-tidy` | 前置/业务 | 在 `business-partner` 产出后，将任务与需求整理为 `design/tasks/` 下的独立 Markdown 文件，确保每项任务可执行且含明确验收标准 | `/task-tidy` |
| `market-research` | 前置/业务 | 市场、竞品、投资人或技术趋势研究，要求来源归因，区分事实/推断/建议，输出面向决策的结论 | `/market-research` |
| `implementation-delivery-acceptance` | 双层验收（意图架构侧） | 审计当前实现是否满足意图架构设计要求；不一致时写出实现 GAP 并给实现架构设计师下一步建议 | `/implementation-delivery-acceptance` |
| `impl-gap-report` | 双层验收（意图架构侧） | 当实现仍存在 GAP 时，分析是否需要修改实现架构并下发后续开发任务 | `/impl-gap-report` |
| `coding-delivery-acceptance` | 双层验收（实现架构侧） | 审计编码交付是否满足实现架构契约；不一致时给出 GAP 与下一步开发建议 | `/coding-delivery-acceptance` |
| `coding-gap-report` | 编码/修复 | 当编码交付仍存在 GAP 时，驱动继续开发直至所有缺口补齐 | `/coding-gap-report` |
| `brief` | 交付后/文档 | 仅基于 `OVERALL_ARCHITECTURE.md`、局部 `ARCHITECTURE.md` 与意图图谱，创建或更新面向外部采用者的 `INTRODUCTION.md` | `/brief` |
| `arch-viewer` | 辅助/通用 | 在本地 schema 驱动的 Web Viewer 中浏览 `SystemArchitecture.json` 知识图谱（元素、关系、视图、详情） | `/arch-viewer` |
| `distill-agent-rules` | 治理/复盘 | 当 Agent 行为偏离预期时，将偏差提炼为可复用的原则、约束、触发条件与落地位置（memory / instructions / skill / hook 等），减少同类偏差重复发生 | `/distill-agent-rules` |
| `harmonyos-development` | 编码/修复（领域） | HarmonyOS NEXT 原生应用开发指南：ArkTS、ArkUI、Stage 模型、API 22–26、权限、状态管理、测试与性能等鸿蒙开发工作流 | `/harmonyos-development` |
| `arkts-coding-standard` | 编码/修复（领域） | ArkTS 严格类型与编码规范：禁止 `any`、对象字面量类型、运行时形状变更等，确保 HarmonyOS 代码合规 | `/arkts-coding-standard` |

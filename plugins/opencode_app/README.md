# Argo for OPENCODE

这个目录提供的是 Argo 在 OPENCODE 下的一套适配资产。它是把同一套阶段化 workflow 映射成 OPENCODE 可消费的 agent、skill、tool、validator 和全局指令。

当前入口资产主要位于 `.opencode/`：

- `opencode.json`：OPENCODE 配置入口，声明模型、provider、MCP、权限和全局指令。
- `GLOBAL_INSTRUCTIONS.md`：全局知识。
- `agents/`：提供 Init、Intent Design、Implementation Design、Coding/Repair、Test 五类主代理入口。
- `commands/`：提供 `argo_init`、`argo_test` 这样的命令型入口。
- `tools/`：提供 Argo 自定义工具和 validator 工具的 OPENCODE 版本。
- `skills/`：复用 Argo 的 repo-owned skills，如 `grill-me`、`handoff`、`brief`。
- `validator/` 与 `argoschema/`：提供阶段交接和 `SystemArchitecture` 结构校验能力。

## Workflow First

Argo 在 OPENCODE 下仍然坚持同一个三阶段闭环，只是入口形式从 VS Code Chat 命令改成了 agent 加 tool 的组合：

```text
Intent Design
	-> IntentToImplementationHandoff
Implementation Design
	-> ImplementationToCodingHandoff
Coding/Repair
	-> Test / 回归验证
```

## Stage Mapping

### Stage 0: Init

目标：把目标工作区补齐为 Argo 可执行的最小形态。

- agent：`Init`
- command：`argo_init`
- tool 实现：`.opencode/tools/argo.ts` 中的 `init`

它负责把 EA 模板、schema、validator 和阶段交接所需的基础资产投影到目标工作区。

### Stage 1: Intent Design

目标：先澄清“系统想成为什么样”，而不是先动实现。

在 OPENCODE 中，这个阶段主要由 `IntentionDesign` agent 承担。它继承与仓库主 README 一致的规则：

- 先读 `design/KG/SystemArchitecture.json`
- 再读 `OVERALL_ARCHITECTURE.md`
- 再按需读局部 `ARCHITECTURE.md`
- 只有在这些契约之后，才把代码、测试、脚本、配置当作实现证据

这个阶段的关键产物仍然是：

- 梳理意图元素、关系、原则和约束
- 明确显性 testcase 的控制点与观测点
- 生成 `design/KG/IntentToImplementationHandoff.json`

### Stage 2: Implementation Design

目标：把意图架构变成仓库里稳定、可落盘、可执行、可交接的实现架构契约。

在 OPENCODE 中，对应 agent 是 `ImplementationDesign`。它延续 Argo 的原始约束：

- 以 `OVERALL_ARCHITECTURE.md` 和各层 `ARCHITECTURE.md` 为契约中心
- 把显性 testcase 物理化为只读、单一、可执行的测试入口
- 冻结关键非显性测试护栏
- 生成 `design/KG/ImplementationToCodingHandoff.json`

这个阶段的重点不是直接写业务代码，而是先把“什么必须稳定、什么可以演进、哪些测试属于冻结边界”落盘清楚。

### Stage 3: Coding/Repair

目标：围绕已有失败记录和冻结测试入口补齐实现，而不是通过改测试来制造通过结果。

在 OPENCODE 中，对应 agent 是 `CodingAndReparing`。它要求先读取：

- `design/KG/ImplementationToCodingHandoff.json`
- `design/KG/test-failure-records.json`
- `OVERALL_ARCHITECTURE.md`

这个阶段的核心职责仍然是：

- 以失败记录作为唯一待修复清单
- 修复实现，使显性测试入口和关键非显性测试继续成立
- 必要时补充普通非显性测试，但不改写冻结基线
- 修复后重新运行既有测试入口完成回归

### Stage 4: Test

目标：执行显性 testcase，刷新失败记录，为下一轮 Coding/Repair 提供输入。

- agent：`Test`
- command：`argo_test`
- tool 实现：`.opencode/tools/argo.ts` 中的 `test`

它会从 `design/KG/SystemArchitecture.json` 中收集显性 testcase，执行其 `acceptanceCriteria` 指向的入口，并刷新 `design/KG/test-failure-records.json`。

## Skills By Stage

当前 OpenCode 适配包也带上了与仓库主流程一致的 5 个 repo-owned skills，位于 `.opencode/skills/`：

| Skill | Intent Design | Implementation Design | Coding/Repair | 作用 |
| --- | --- | --- | --- | --- |
| `brief` | 可用，但通常在边界稳定后再用 | 常用 | 仅在外部接口变化后使用 | 基于架构来源刷新对外说明 |
| `grill-me` | 主用 | 可辅助 | 不建议作为主修复流程 | 持续追问并收敛设计分支 |
| `handoff` | 主用 | 主用 | 一般不用继续向下交接 | 压缩当前阶段产物给下一阶段 |
| `improve-codebase-architecture` | 主用 | 通常不直接使用 | 不适合 | 在不引入功能需求时先做架构候选梳理 |
| `distill-agent-rules` | 可用 | 可用 | 可用 | 把 agent 偏航沉淀成长期规则 |

这些 skill 的作用与根 README 基本一致，只是调用环境从 VS Code Chat 切换成了 OPENCODE。

## Validator And Guardrails

OpenCode 版本保留了 Argo 最核心的两类验证：

- `validateSystemArchitecture`：校验 `design/KG/SystemArchitecture.json` 是否符合 `.opencode/argoschema/SystemArchitecture.schema.json`
- `validateStageHandoff`：校验 `design/KG/IntentToImplementationHandoff.json` 与 `design/KG/ImplementationToCodingHandoff.json`

对应实现位于：

- `.opencode/tools/validator.ts`
- `.opencode/validator/script/validateSystemArchitecture.js`
- `.opencode/validator/script/validateStageHandoff.js`

这部分不是附属工具，而是阶段闭环本身的一部分。对于 Argo 来说，没有 schema 校验和 handoff 校验的“阶段完成”是不成立的。

## AI Coding 理念

Argo 背后的 AI Coding 理念，不是“让 agent 尽快开始写代码”，而是把 agent 放进一个受约束、可交接、可回归的工程系统里。

### 1. 先澄清边界，再生成实现

问题边界、验收口径和架构意图在一开始就说清楚。

- 系统真正要满足的意图是什么
- 哪些约束不能破
- 哪些 testcase 是验收基线
- 当前问题属于意图漂移、实现架构缺口，还是纯编码修复

如果这些边界不清楚，越快开始写代码，通常只会越快偏航。

### 2. 把测试当契约，而不是当补丁

测试在这里首先是契约，其次才是验证脚本。

- 显性 testcase 要有单一入口
- 关键非显性测试要被冻结
- Coding/Repair 必须优先消费失败记录
- 控制点和观测点必须写清楚

当测试边界稳定后，agent 修复的是实现本身，而不是验收口径。

### 3. 把 agent 当工程参与者，而不是万能作者

Argo 默认认为 agent 会读错、会跳步、会把实现现状误认为设计意图，因此必须给它一套强约束工作面：

- 固定读取顺序
- 固定阶段边界
- 固定交接物
- 固定验证入口

这样做的目的不是限制 agent 的能力，而是让 agent 的能力能够被团队复用、审查和回归，而不是每轮对话都重新碰运气。

### 4. 让“失败”成为下一步工作的高质量输入

在 Argo 里，Implementation Design 阶段允许显性 testcase 先以“预期失败”的状态落地，因为这种失败不是噪音，而是对后续 Coding/Repair 最准确的工作清单。

换句话说，Argo 追求的不是“测试先绿”，而是“失败要对、原因要可读、修复路径要明确”。一个高质量的失败记录，比一个没有边界的伪通过更有工程价值。

### 5. 人类保留高杠杆决策，agent 承担受约束执行

Argo 不是把 human in the loop 形式化地保留一下，而是明确分工：

- 人来拍板高杠杆架构决策、边界和权衡
- agent 负责在这些边界内吸收证据、落盘契约、执行验证和完成修复

这样可以同时避免两种常见问题：

- 人把低价值机械操作全都自己做掉
- agent 在高风险决策上越权发挥

## Quick Start

### 1. 准备 OPENCODE 配置

检查并按需修改：

- `.opencode/opencode.json` 中的模型与 provider 配置
- `DeepSeek_custom_provider.options.apiKey`，将占位值 `XXX` 替换为真实可用值

### 2. 确认最小仓库输入

至少保证这些路径存在：

```text
design/KG/SystemArchitecture.json
OVERALL_ARCHITECTURE.md
src/
tests/
```

### 3. 按阶段运行，而不是直接自由提示

推荐顺序：

1. 先用 `Init` agent 或 `argo_init` command 准备工作区。
2. 用 `IntentionDesign` agent 澄清意图边界。
3. 用 `ImplementationDesign` agent 落盘实现架构契约与测试入口。
4. 用 `Test` agent 或 `argo_test` command 刷新失败记录。
5. 用 `CodingAndReparing` agent 基于失败记录修复实现。
6. 重复 `Test -> Coding/Repair`，直到显性 testcase 通过。

### 4. 你真正需要记住的闭环

```text
先澄清 intent
再落盘 implementation contracts 和 tests
再用 test 驱动 coding/repair
最后用回归结果决定是否进入下一轮
```

如果把顺序打乱，OPENCODE 里的 Argo 也会失去它最重要的价值：不是“多一个 agent”，而是“把架构边界、测试边界和阶段交接变成显性、可验证、可复用的工程流程”。
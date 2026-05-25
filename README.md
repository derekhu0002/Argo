# Argo

Argo 是一个面向 VS Code Chat 的分阶段工程编排扩展。它把意图架构、实现架构、测试入口、编码修复和阶段交接放进同一个受约束的 workflow，目标不是“直接让 agent 写代码”，而是先把架构与测试边界说清楚，再让后续阶段沿着这些边界推进。

当前扩展显示名称为 `Argo - Agentic Workflow Orchestrator`，聊天参与者名称为 `@argowork`。

## Workflow First

Argo 当前仓库定义的主流程是一个三阶段闭环：

```text
Intent Design
	-> IntentToImplementationHandoff
Implementation Design
	-> ImplementationToCodingHandoff
Coding/Repair
	-> /test 回归验证
```

### Stage 1: Intent Design

目标：澄清“系统想成为什么样”，而不是直接改实现。

这个阶段主要围绕 `design/KG/SystemArchitecture.json` 工作，负责：

- 明确意图元素、关系、原则与约束。
- 定义或收敛显性 testcase 作为验收基线。
- 判断当前问题究竟属于意图层、实现架构层，还是纯编码修复层。
- 为下一阶段准备 `design/KG/IntentToImplementationHandoff.json`。

对应命令：

- `@argowork /intentinarchitecturedesign`

这一命令当前会生成一份交给主 agent 的 handoff prompt，要求主 agent 在这个阶段优先做设计澄清、持续追问高杠杆问题，并在需要时校验 `SystemArchitecture.json` 与 handoff 的结构有效性。

### Stage 2: Implementation Design

目标：把意图架构变成仓库内可落盘、可执行、可交接的实现架构契约。

这个阶段以 `OVERALL_ARCHITECTURE.md` 和各层级 `ARCHITECTURE.md` 为核心表达，负责：

- 设计稳定目录、稳定模块与依赖方向。
- 把显性 testcase 物理化为单一、可执行、后续编码阶段只读的测试入口。
- 冻结关键非显性测试护栏。
- 生成 `design/KG/ImplementationToCodingHandoff.json`，把待实现缺口明确交给编码阶段。

对应命令：

- `@argowork /implementationdesign`

当前仓库约束要求这一阶段先读取意图架构，再读取实现架构契约，再按需查看代码与测试；它不是直接编码，而是先把“什么该稳定、什么可演进、哪些测试必须冻结”设计清楚。

### Stage 3: Coding/Repair

目标：围绕已落盘的失败记录与冻结测试边界补齐实现，而不是通过改测试“把结果做对”。

这个阶段当前由两个命令配合完成：

- `@argowork /test`：执行显性 testcase，刷新 `design/KG/test-failure-records.json`
- `@argowork /work`：基于失败记录生成主 agent 的 Coding/Repair handoff

进入 `/work` 后，Argo 会把 guard stage 切到 `coding`。如果设置 `argo.protectExplicitTestcaseEntriesDuringCoding` 保持开启，编码阶段对显性测试入口的误改写会被阻止。

编码阶段的核心职责是：

- 读取既有失败记录而不是自己重写问题定义。
- 修复实现，使既有显性测试入口和关键非显性测试继续成立。
- 在必要时补充普通非显性测试，但不改写冻结基线。
- 通过重复执行 `/test` 完成回归闭环。

### Supporting Commands

- `@argowork /argo-init`：手动向当前工作区拷贝 EA 模板、捆绑 `.github` 资产和 `SystemArchitecture` schema。
- `@argowork /idle`：把内部 guard stage 重置为 `idle`。

## Skills By Stage

当前仓库内实际存在 5 个 repo-owned skills，位于 `.github/skills/`。它们不是独立命令面板，而是供主 agent 在不同阶段复用的工作流能力。

### 一览表

| Skill | Intent Design | Implementation Design | Coding/Repair | 作用 |
| --- | --- | --- | --- | --- |
| `brief` | 可用，但通常在阶段产物比较稳定后再用 | 常用，用实现架构契约写对外介绍 | 仅在外部接口变化后补文档时使用 | 只基于架构来源生成或刷新 `INTRODUCTION.md` |
| `grill-me` | 主用 | 可辅助，但不是主流程 | 不建议作为主修复流程 | 通过高压追问和推荐答案把设计树逐支路收敛 |
| `handoff` | 主用，用于交接到 Implementation Design | 主用，用于交接到 Coding/Repair | 一般不用再往后交接 | 生成当前阶段到下一阶段的简短 handoff 文件 |
| `improve-codebase-architecture` | 主用，作为 Intent Design 的前置候选梳理 | 通常不直接使用 | 不用于编码修复 | 在不引入功能需求时先找架构优化候选，再交给 `grill-me` 深挖 |
| `distill-agent-rules` | 可用 | 可用 | 可用 | 当 agent 行为偏航时，把一次事故沉淀成可执行规则或约束 |

### `brief`

作用：基于架构来源生成或刷新根目录 `INTRODUCTION.md`，面向外部采用者、集成方和调用方说明系统是什么、怎么接入、有哪些限制。

各阶段如何用：

- Intent Design：可以提前起草产品说明，但更适合在意图边界已经稳定时使用。
- Implementation Design：最合适，因为这时 `OVERALL_ARCHITECTURE.md`、局部 `ARCHITECTURE.md` 和接口边界更完整。
- Coding/Repair：仅当修复引入或调整了外部接口时，用它回刷对外文档。

注意：当前 repo 里存在 `brief` skill 定义，但 `src/commands/` 下没有对应的已接线 chat command，因此它更适合作为主 agent skill，而不是当前 `@argowork` 的稳定命令入口。

### `grill-me`

作用：对计划或设计做高强度质询，逐个分支地逼近共享理解；如果问题能靠读仓库回答，就先读仓库，不把可验证事实反问给用户。

各阶段如何用：

- Intent Design：主场景。当前 `/intentinarchitecturedesign` 的 handoff 就明确要求主 agent 采用这种风格。
- Implementation Design：当实现边界、依赖方向或测试入口落位存在多种方案时，可用它逼出决策理由。
- Coding/Repair：一般不作为主流程，因为编码阶段的主输入应该是失败记录和冻结契约，而不是重新展开设计树。

### `handoff`

作用：把当前阶段的结果压缩成下一阶段可直接消费的交接文本，并落到 `.github/handoffs/`。

各阶段如何用：

- Intent Design：把结果交接给 Implementation Design，强调下一阶段先读哪些具体契约与图谱文件。
- Implementation Design：把结果交接给 Coding/Repair，强调哪些契约、测试入口、冻结文件和失败信号必须先读。
- Coding/Repair：通常不是主路径，因为当前闭环更多通过 `/test` 和 `/work` 回归，而不是继续向下分阶段。

### `improve-codebase-architecture`

作用：在不引入新功能的前提下，先梳理值得深挖的架构优化候选，再把选中的候选交回 `grill-me` 继续问透。

各阶段如何用：

- Intent Design：最合适。它本质上是 Intent Design 的前置探索步骤，用来判断是否需要改 intent，还是只是实现架构或编码问题。
- Implementation Design：通常不直接进入这个 skill，因为 Implementation Design 的重点已经是落盘契约与测试护栏，不是做候选池发散。
- Coding/Repair：不适合。编码阶段应聚焦修复，不应重新打开架构候选探索。

### `distill-agent-rules`

作用：当某次会话里 agent 行为偏离预期时，把“抱怨”转成可判定、可执行、可落位的规则，并判断它应该放进 memory、instructions、skill、prompt、agent 还是 hook。

各阶段如何用：

- Intent Design：当 agent 没按架构读取顺序工作，或者过早进入实现讨论时，用它沉淀规则。
- Implementation Design：当 agent 忽略 handoff、冻结资产或测试控制点/观测点要求时，用它抽取治理规则。
- Coding/Repair：当 agent 试图改写显性测试入口、跳过失败记录、或把测试逻辑混入业务代码时，用它把偏差固化成后续约束。

## Recommended Stage Playbook

如果你把 Argo 当作一个稳定 workflow 来用，而不是零散命令集合，推荐顺序是：

1. 用 `@argowork /argo-init` 初始化工作区资产。
2. 确认 `design/KG/SystemArchitecture.json` 已存在，并能作为意图架构入口读取。
3. 在 Intent Design 阶段使用 `grill-me`，必要时先用 `improve-codebase-architecture` 梳理候选。
4. 形成或更新 `design/KG/IntentToImplementationHandoff.json`。
5. 运行 `@argowork /implementationdesign`，把实现架构契约、显性测试入口和关键护栏落盘。
6. 形成或更新 `design/KG/ImplementationToCodingHandoff.json`。
7. 运行 `@argowork /test` 刷新失败记录。
8. 运行 `@argowork /work`，把 Coding/Repair handoff 交给主 agent。
9. 修复实现后重复 `/test -> /work`，直到显性测试通过。

## Quick Start

如果你是第一次在当前仓库里上手，最短路径如下。

### 1. 安装依赖并打开仓库

```powershell
npm install
```

然后在 VS Code 中打开仓库，并以扩展开发或调试方式加载 Argo。

### 2. 准备最小输入

至少确认这些路径已经存在：

```text
design/KG/SystemArchitecture.json
OVERALL_ARCHITECTURE.md
tests/
src/
```

如果你要把 Argo 用在别的工作区，先运行：

```text
@argowork /argo-init
```

这会拷贝工作区启动所需的模板和 schema 资产。

### 3. 从阶段入口开始，而不是直接让 agent 自由发挥

意图澄清：

```text
@argowork /intentinarchitecturedesign
```

实现架构设计：

```text
@argowork /implementationdesign
```

执行显性测试并刷新失败记录：

```text
@argowork /test
```

基于失败记录进入编码修复：

```text
@argowork /work
```

退出当前 guard 阶段：

```text
@argowork /idle
```

### 4. 主 agent 的推荐配合方式

- 在 Intent Design 阶段优先使用 `grill-me`，必要时配合 `improve-codebase-architecture`。
- 在阶段切换时使用 `handoff`，不要把整段对话原样复制给下一个阶段。
- 当对外接口发生变化时使用 `brief` 刷新 `INTRODUCTION.md`。
- 当 agent 行为偏航时使用 `distill-agent-rules` 把问题沉淀成长期约束。

### 5. 你真正需要记住的闭环

```text
先澄清 intent
再落盘 implementation contracts 和 tests
再用 /test 和 /work 驱动 coding/repair
最后用回归结果判断是否进入下一轮
```

如果把这四步顺序打乱，Argo 的价值会明显下降，因为它的核心不是“多一个聊天命令”，而是“把阶段边界、测试边界和交接边界强制显性化”。
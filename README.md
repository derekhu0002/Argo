# Argo HARNESS

Argo 是一套面向 AI Coding 的 HARNESS 工程方法与配套实现。它不把 agent 当成“直接写代码的捷径”，而是把意图架构、实现架构、测试边界、失败记录和阶段交接组织成一个可重复、可验证、可回归的闭环。

这个仓库当前同时承载两种落地形态：

- GitHub Copilot / VS Code 版本：通过 `@argowork` 聊天参与者、VS Code 扩展命令，以及 `.github/agents/` 下的自定义 agent 驱动工作流。
- OpenCode 版本：通过 `.opencode/` 下的 agent、command、tool 和 validator 资产驱动同一套工作流。

## HARNESS 在解决什么问题


很多 AI Coding 流程的问题不在“模型不够强”，而在“工程边界不够清楚”。需求、架构、测试和修复经常被混在同一轮对话里，最后得到的是一段能运行但很难复用、很难验证、也很难交接的结果。

Argo 的 HARNESS 思路就是先把这些边界显性化：

- 让人类通过 ArchiMate 意图模型握住方向盘，持续掌控系统演进方向。
- 让目标通过分层测试用例逐层传导，而不是靠一次提示把所有要求压给 agent。
- 让架构直接融入代码仓的目录、文件、契约和测试入口，而不是停留在仓库外的说明文档里。
- 先澄清意图，不让实现现状反向定义目标。
- 先固定实现架构契约和测试入口，再进入编码。
- 让失败记录成为下一轮工作的高质量输入，而不是噪音。
- 让 agent 在受约束的工程系统里工作，而不是在自由提示里碰运气。

## 核心理念

### 1. 先 Intent，后 Implementation，最后 Coding

Argo 的主流程不是“提一个需求，直接让 agent 改代码”，而是：

```text
Intent Design
  -> IntentToImplementationHandoff
Implementation Design
  -> ImplementationToCodingHandoff
Coding/Repair
  -> Test / Regression
```

### 2. 测试先是契约，其次才是脚本

`design/KG/SystemArchitecture.json` 中的显性 testcase 是验收基线。Implementation Design 阶段需要把它们物理化为只读、单一、可执行的测试入口；Coding/Repair 阶段修复的是实现，不是测试口径。

### 3. 失败记录是工作队列

Implementation Design 允许测试以“预期失败”的方式先落地。这样进入 Coding/Repair 时，agent 面对的不是模糊的需求，而是一组已定义边界、已具备入口、可直接回归的失败记录。

### 4. 人负责高杠杆决策，agent 负责受约束执行

人类负责拍板意图、边界和权衡，agent 负责在既定边界内读取证据、生成交接、执行测试和补齐实现。这样既避免人工被机械工作淹没，也避免 agent 在高风险决策上越权发挥。

### 5. ArchiMate、测试和仓库结构是同一套控制链

在 Argo 里，这三件事不是分开的：

- 人类通过 `design/KG/SystemArchitecture.json` 这样的 ArchiMate 意图模型掌控方向。
- 目标通过显性 testcase、关键非显性测试和支撑测试逐层传导到实现层。
- 架构最终落在代码仓本身的目录结构、`OVERALL_ARCHITECTURE.md`、各级 `ARCHITECTURE.md`、测试入口和 failure records 里。

也就是说，Argo 不是把“架构图”和“代码仓”分开维护，而是要求架构最终在代码仓结构中被物理表达、被测试守护、被工作流持续执行。

## 版本入口

| 版本 | 适用环境 | 说明 |
| --- | --- | --- |
| [Copilot 版](copilot/README.md) | VS Code + GitHub Copilot Chat | 以 VS Code 扩展形式运行，入口包括 `@argowork`、扩展命令和 `.github/agents/` 下的自定义 agent |
| [OpenCode 版](plugins/opencode_app/README.md) | OpenCode | 以 `.opencode/` 目录中的 agent、command、tool、validator 资产运行 |

## 工作流如何部署到 Instructions、Agents、Skills、Tools、Plugin

Argo 不是把工作流只写成一份方法论文档，而是把同一套控制逻辑拆进宿主平台真正可执行的几个层次里。

### 1. Instructions：定义全局工作规则

Instructions 层负责声明这套 HARNESS 的全局操作规约，告诉 agent 应该先读什么、按什么阶段工作、哪些边界不能破。

- Copilot 侧的主入口是 `.github/copilot-instructions.md`
- OpenCode 侧的主入口是 `.opencode/GLOBAL_INSTRUCTIONS.md`

这一层承载的是全局工作纪律，例如：先读 `design/KG/SystemArchitecture.json`，再读 `OVERALL_ARCHITECTURE.md`，再按需读代码与测试；以及 Intent Design、Implementation Design、Coding/Repair 三个阶段的边界和交接要求。

### 2. Agents：把阶段职责落成专门角色

Agents 层负责把工作流中的不同阶段变成可直接调用的专门角色，让每个角色只做自己那一层的事。

- Copilot 侧位于 `.github/agents/`
- 当前已落地的 agent 包括 `IntentionDesign`、`ImplementationDesign`、`CodingAndReparing`
- OpenCode 侧位于 `.opencode/agents/`
- OpenCode 侧额外包含 `Init` 和 `Test` 这样的运行型 agent

这一层的作用是把“同一个 agent 什么都做”的模糊工作面，拆成按阶段收口的角色工作面。

### 3. Skills：把通用工作模式沉淀成可复用模块

Skills 层负责承载跨任务复用的工作模式，而不是直接承载某一轮具体任务。

- Copilot 侧位于 `.github/skills/`
- OpenCode 侧位于 `.opencode/skills/`
- 当前代表性 skill 包括 `grill-me`、`handoff`、`brief`、`distill-agent-rules`、`improve-codebase-architecture`

这一层解决的是“方法怎么复用”的问题。例如，`grill-me` 负责设计阶段的持续追问，`handoff` 负责阶段交接压缩，`brief` 负责从架构来源生成对外说明。

### 4. Tools：把关键动作变成可执行能力

Tools 层负责把测试、校验、初始化、工作区投影这类关键动作变成AGENT可执行能力，而不是停留在提示词里。这里在 OpenCode 和 Copilot 上的落地方式并不完全相同。

- OpenCode 侧的 Tools 是显式定义给 agent 调用的工具，位于 `.opencode/tools/`，当前主要是 `argo.ts` 与 `validator.ts`
- 在这种形态下，agent 可以把这些工具当成工作流内的直接执行面，用来完成测试、校验、初始化等动作
- Copilot / VS Code 侧目前只有少量能力以原生模型工具形式暴露，Copilot 侧更常见的落地方式，是把关键动作实现为 `npm` / `node` / `js` 脚本和聊天参与者命令，再由 Copilot agent 通过 Bash 或终端去执行这些脚本，例如 `@argowork /argo-init`、`/test`、`/work`、`/implementationdesign` 这类入口，本质上就是让 agent 在工作流中自主触发脚本与命令，从效果上达到与 OpenCode tools 类似的“可自执行动作面”
- 校验资产则分别落在 `.github/validator/` 和 `.opencode/validator/`

因此，Tools 这一层解决的是“关键动作如何真正被 agent 自主执行”的问题。OpenCode 更偏向“显式工具定义”，Copilot 更偏向“脚本 + 命令 + 终端执行”，但它们承担的是同一类职责：让 schema 校验、handoff 校验、测试入口执行、bootstrap 资产投影这类动作在工作流中被自动触发，而不是只停留在文档要求里。

### 5. Hooks / Plugins：把规则变成事件级绝对护栏

这一层是利用宿主提供的事件机制，把规则变成能在关键动作发生前就拦截的绝对护栏。

- 在 Copilot / VS Code 侧，是 `hook`：监听会话启动、文件访问、文件修改、命令执行等事件，然后触发对应脚本或校验逻辑
- 在 OpenCode 侧，是 `plugin`：同样监听宿主事件，并在命中条件时执行插件脚本或校验动作
- 这一层的目标不是给 agent 一句“最好不要这样做”的软提示，而是在违规动作真正落地前直接阻断

例如，如果规则要求 agent 不能修改 `.env` 文件，那么可以通过监听 `.env` 文件修改事件，在实际写入发生前直接抛回错误，明确告诉 agent 当前操作违规。

因此，这一层承载的是事件驱动的强约束执行能力：监听事件，触发脚本，命中规则即中止，而不是等违规发生后再靠提示词补救。

## 这五层是怎样连起来的

如果把整套 Argo 工作流从上到下看，可以理解成：

```text
Instructions 定义全局纪律
Agents 承载阶段职责
Skills 复用通用工作模式
Tools 执行关键动作
Hooks / Plugins 把规则落成事件级护栏
```

因此，Argo 的部署不是“先写一个提示词，再写几个脚本”，而是把同一套工作流按职责拆进不同宿主层次中：规则在 instructions，角色在 agents，方法在 skills，动作在 tools，最终由 hooks 或 plugins 把这些规则提升为宿主内可执行、可拦截、可阻断的绝对护栏。

## 推荐使用方式

如果你第一次接触这套 HARNESS 工程，建议按下面顺序理解和上手：

1. 先看当前仓库的意图入口 `design/KG/SystemArchitecture.json`。
2. 再看实现架构根契约 `OVERALL_ARCHITECTURE.md`。
3. 选择你的运行环境：Copilot 版或 OpenCode 版。
4. 进入对应版本 README，按“快速安装”和“快速上手”执行第一轮闭环。

## 这两个版本共享的最小闭环

不论你使用 Copilot 版还是 OpenCode 版，最小有效路径都一样：

```text
先准备工作区
再澄清 intent
再落盘 implementation contracts 和 tests
再执行 test
最后基于 failure records 进入 coding/repair
```

如果把顺序打乱，Argo 的价值会明显下降，因为它真正提供的不是“多一个 AI 工具入口”，而是“把架构边界、测试边界和阶段交接显性化的工程系统”。
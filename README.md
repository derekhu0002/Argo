# Argo HARNESS

Argo 是一套面向 AI Coding 的 HARNESS 工程方法与配套实现。它不把 agent 当成“直接写代码的捷径”，而是把意图架构、实现架构、测试边界、失败记录和阶段交接组织成一个可重复、可验证、可回归的闭环。

这个仓库当前同时承载两种落地形态：

- GitHub Copilot / VS Code 版本：通过 `@argowork` 聊天参与者和 VS Code 扩展命令驱动工作流。
- OpenCode 版本：通过 `.opencode/` 下的 agent、command、tool 和 validator 资产驱动同一套工作流。

## HARNESS 在解决什么问题

很多 AI Coding 流程的问题不在“模型不够强”，而在“工程边界不够清楚”。需求、架构、测试和修复经常被混在同一轮对话里，最后得到的是一段能运行但很难复用、很难验证、也很难交接的结果。

Argo 的 HARNESS 思路就是先把这些边界显性化：

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

## 版本入口

| 版本 | 适用环境 | 说明 |
| --- | --- | --- |
| [Copilot 版](copilot/README.md) | VS Code + GitHub Copilot Chat | 以 VS Code 扩展形式运行，入口是 `@argowork` 和扩展命令 |
| [OpenCode 版](plugins/opencode_app/README.md) | OpenCode | 以 `.opencode/` 目录中的 agent、command、tool、validator 资产运行 |

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
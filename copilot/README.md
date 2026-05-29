# Argo HARNESS for GitHub Copilot

这个目录对应的是 Argo 的 Copilot / VS Code 版本说明。它的核心形态是一个 VS Code 扩展，扩展显示名为 `Argo - Agentic Workflow Orchestrator`，聊天参与者名称为 `@argowork`；同时仓库也提供了 GitHub Copilot 可消费的自定义 agent 资产。

如果你希望在 VS Code + GitHub Copilot Chat 里，以阶段化、可交接、可回归的方式推进 AI Coding，这个版本就是主入口。

## 核心思想

Copilot 版沿用 Argo 的同一条控制链：

- 人类通过 ArchiMate 意图模型充当方向盘，决定系统要往哪里走。
- 目标通过显性 testcase、关键非显性测试和支撑测试逐层传导给实现与修复阶段。
- 架构不是停留在图上，而是继续沉淀进仓库的目录结构、契约文件、测试入口和 failure records。

因此，Copilot 在这里不是自由发挥的写码工具，而是在这条控制链内执行的工程参与者。

## 你会得到什么

Copilot 版把 HARNESS 工作流落成了四个直接可用的工作面：

- `@argowork` 聊天参与者命令
- VS Code 扩展命令
- `.github/agents/` 下的自定义 agent
- 仓库内的显性测试入口、验证脚本和架构契约

当前仓库里已经落地的自定义 agent 包括：

- `IntentionDesign`
- `ImplementationDesign`
- `CodingAndReparing`

当前主要命令包括：

- `@argowork /argo-init`
- `@argowork /intentinarchitecturedesign`
- `@argowork /implementationdesign`
- `@argowork /test`
- `@argowork /work`
- `@argowork /idle`

## 快速安装

### 1. 准备环境

你至少需要：

- VS Code
- GitHub Copilot 与 GitHub Copilot Chat 可用
- Node.js 与 npm 可用

### 2. 安装仓库依赖

在仓库根目录执行：

```powershell
npm install
```

### 3. 编译扩展

```powershell
npm run compile
```

### 4. 启动扩展

推荐方式是直接在 VS Code 中以扩展开发模式启动当前仓库：

1. 用 VS Code 打开仓库根目录。
2. 执行扩展调试启动。
3. 在新的 Extension Development Host 窗口中打开一个目标工作区。

如果你后续需要打包分发，可以在你自己的发布流程里再补充 VSIX 打包；当前仓库内现成的最短路径是“本地编译 + 扩展开发宿主调试”。

## 快速上手

### 1. 先确认最小输入

目标工作区至少应具备这些基础路径：

```text
design/KG/SystemArchitecture.json
OVERALL_ARCHITECTURE.md
src/
tests/
```

如果你要把 Argo 所需的模板、schema 和 validator 资产补进工作区，先运行：

```text
@argowork /argo-init
```

### 2. 从阶段入口开始

推荐顺序如下。

如果你倾向用聊天参与者命令，可以这样走：

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

退出当前 guard stage：

```text
@argowork /idle
```

如果你倾向直接调用自定义 agent，则阶段映射是：

- Intent Design -> `IntentionDesign`
- Implementation Design -> `ImplementationDesign`
- Coding/Repair -> `CodingAndReparing`

### 3. 第一轮上手只需要记住这一条闭环

```text
先澄清 intent
再落盘 implementation contracts 和 tests
再执行 test
最后基于 failure records 进入 coding/repair
```

## 推荐的使用姿势

在 Copilot 版里，最有效的方式不是直接对主 agent 说“帮我改代码”，而是先让 Argo 把当前问题定位到正确阶段。

- 当问题还不清楚属于需求、架构还是实现时，先从 Intent Design 开始。
- 当需求已经相对清楚，但稳定边界和测试入口还没落盘时，进入 Implementation Design。
- 当失败记录已经存在，才进入 `/work` 做 Coding/Repair。

这样做的价值在于：你交给 Copilot 的不是一段模糊上下文，而是一组已经成型的架构契约、测试入口和 failure records。

更具体地说：人类通过 ArchiMate 模型掌握方向，测试分层向下传导目标，仓库目录与契约文件承载架构本体，Copilot 负责在这套边界内推进实现。

## 常用验证命令

如果你需要在仓库里直接验证当前资产，可以使用这些脚本：

```powershell
npm run validate:system-architecture
npm run validate:handoff
npm run test:argo
```

它们分别用于：

- 校验 `design/KG/SystemArchitecture.json`
- 校验阶段交接文件
- 执行架构相关测试入口

## 适合谁

Copilot 版更适合这些场景：

- 你已经把主要研发入口放在 VS Code
- 你希望直接利用 `@argowork` 命令或自定义 agent 组织 AI Coding
- 你希望把测试入口、架构契约和聊天交互收在同一个开发环境里
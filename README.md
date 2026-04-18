# Argo

本工程是一个 VS Code Chat 扩展，用于把仓库内的架构意图、代码结构、测试执行结果和治理产物放进同一个闭环里管理。

它的目标不是单纯生成图或回答问题，而是把“架构是否落地”“代码是否偏离设计”“失败项如何交接修复”这些动作沉淀成可重复执行的工程流程。

## 工程目的

这个工程主要解决三类问题：

1. 架构文档与真实代码长期漂移，设计无法作为持续约束使用。
2. 代码库中的结构、调用关系和测试状态缺少统一视图，评审和演进成本高。
3. 当测试失败或架构约束被破坏时，缺少结构化的修复交接材料。

围绕这些问题，工程提供了以下能力：

- 以 `design/` 目录为固定工作区，保存架构输入、实现视图、追踪矩阵、漂移报告等产物。
- 基于 VS Code Chat Participant 机制，将架构治理能力直接暴露到编辑器工作流中。
- 通过语义 UML 提取、架构判断和测试执行，把“分析”“判断”“交接”串起来。
- 提供一个专门的工作代理，用于执行 `design/KG/SystemArchitecture.json` 中声明的测试脚本，并生成面向主代理的修复交接内容。

## 适用场景

本工程更适合以下类型的仓库：

- 需要在代码仓中维护正式架构描述的项目。
- 希望把架构检查和代码演进绑定到同一套 Copilot 工作流中的团队。
- 需要把架构图谱中的 testcase 与实际验收脚本关联起来的工程。
- 希望在 VS Code 内部直接完成架构分析、问题发现、失败交接与修复推进的场景。

## 工作区约定

工程默认采用约定优于配置的方式，核心输入输出都放在工作区根目录下的 `design/` 中。

常见文件说明：

| 路径 | 作用 |
|------|------|
| `design/architecture-intent.puml` | 架构意图输入文件 |
| `design/implementation-uml.puml` | 当前实现结构的正式 UML 结果 |
| `design/implementation-uml.candidate.puml` | 校验未通过时的候选实现图 |
| `design/symbol-summaries.md` | 代码符号级语义摘要 |
| `design/traceability-matrix.md` | 架构意图到代码实现的追踪矩阵 |
| `design/architecture-drift-report.md` | 架构漂移与偏差分析报告 |
| `design/KG/SystemArchitecture.json` | 架构图谱与 testcase 定义 |
| `design/KG/test-failure-records.json` | 测试失败记录，用于后续交接修复 |

如果你准备把这个工程接入新的仓库，建议优先保证以上路径存在并保持稳定。

## 使用指导

### 前置条件

使用前需要满足以下条件：

- VS Code 版本不低于 `1.93.0`
- 已安装 GitHub Copilot Chat 扩展
- 已在 VS Code 中打开一个工作区目录
- 本地具备 Node.js 与 npm，用于安装依赖和编译扩展

如果你需要对 PlantUML 结果做保存前校验，还需要按需准备 PlantUML CLI 或 `plantuml.jar`。本工程支持通过以下设置控制校验方式：

- `argo.plantuml.validationMode`
- `argo.plantuml.command`
- `argo.plantuml.commandArgs`
- `argo.plantuml.javaCommand`
- `argo.plantuml.javaArgs`
- `argo.plantuml.jarPath`
- `argo.plantuml.jarArgs`

### 在 VS Code 中加载扩展

本工程是一个本地开发中的 VS Code 扩展，典型使用方式如下：

1. 安装依赖。
2. 编译 TypeScript 代码。
3. 在 VS Code 中以扩展开发模式启动调试窗口。
4. 在新的调试窗口中打开 Chat 面板并使用本扩展提供的参与者能力。

本仓库的核心入口位于：

- `src/extension.ts`：扩展激活入口，注册聊天参与者和测试工具。
- `src/participant.ts`：主聊天参与者请求分发。
- `src/workParticipant.ts`：工作代理请求分发。

### 推荐使用方式

如果你把它当成一个工程治理工具来用，而不是单次问答工具，推荐按下面的顺序组织仓库内容：

1. 在 `design/` 下准备架构相关输入文件，并把它们纳入版本控制。
2. 在 `design/KG/SystemArchitecture.json` 中维护 testcase 以及对应脚本路径。
3. 通过 VS Code Chat 执行你的架构治理流程。
4. 查看 `design/` 下新生成或更新的文件，而不是只看聊天面板输出。
5. 当测试失败时，基于失败记录继续推进修复，而不是手工重复整理上下文。

### 关于工作代理 `@argowork /work`

本工程中有一个相对独立且实用的能力：工作代理会读取 `design/KG/SystemArchitecture.json` 中声明的所有 testcase，逐个执行其验收脚本，并输出两类结果：

- 测试运行摘要
- 失败记录与交接提示

它适合用于以下场景：

- 想快速验证图谱中登记的测试是否真实可执行。
- 需要把失败测试整理成结构化修复输入，交给 Copilot 主代理继续开发。
- 希望把“测试失败即交接修复”的流程固定下来。

当没有 testcase，或 testcase 缺少 `acceptanceCriteria` 时，当前工作流会把该项视为待开发能力，并要求后续补回测试路径。

### 产物查看建议

这个工程的有效输出通常不在聊天窗口，而在仓库文件里。使用过程中建议重点关注：

- `design/implementation-uml.puml`
- `design/symbol-summaries.md`
- `design/traceability-matrix.md`
- `design/architecture-drift-report.md`
- `design/KG/test-failure-records.json`

如果这些文件长期没有被更新，通常说明你的工作流还没有真正落到仓库资产上。

## 开发指导

### 安装依赖

```bash
npm install
```

### 编译

```bash
npm run compile
```

### 监听编译

```bash
npm run watch
```

### 代码质量检查

```bash
npm run lint
```

## 目录结构

```text
Argo/
├── design/                  # 架构输入、实现视图、追踪与报告产物
├── eatool/                  # EA 相关模板资源
├── src/
│   ├── commands/            # 各工作流命令处理器
│   ├── engine/              # 语义 UML 提取与架构判断引擎
│   ├── lm/                  # 大模型调用与提示词封装
│   ├── tools/               # 语言模型工具与测试执行工具
│   ├── utils/               # Git、PlantUML、交接、文件系统等辅助能力
│   ├── extension.ts         # VS Code 扩展入口
│   ├── participant.ts       # 主参与者入口
│   └── workParticipant.ts   # 工作代理入口
├── publish.py               # 打包与发布脚本
├── pack_workspace.py        # 打包当前工作区内容为 JSON
├── package.json             # 扩展清单、命令、配置与依赖
└── tsconfig.json            # TypeScript 编译配置
```

## 核心模块说明

### `src/engine/`

负责把代码结构、语言服务信息和大模型分析拼接成可落盘的语义 UML 结果，同时承担架构判断、反腐检查和追踪分析等核心能力。

### `src/lm/`

封装 VS Code 语言模型调用细节，包括模型获取、请求发送和提示词模板管理。

### `src/tools/architectureTestTool.ts`

负责读取架构图谱中的 testcase，执行验收脚本，并输出失败记录，是工作代理能力的底层实现。

### `src/utils/agentHandoff.ts`

负责把失败测试和上下文整理成可直接交给 Copilot 主代理的交接提示，避免人工重复拼接输入。

## 本地调试建议

本工程本质上是扩展开发项目，调试时建议采用以下方式：

1. 先执行 `npm run compile`，确保 `out/extension.js` 已生成。
2. 在 VS Code 中启动扩展开发宿主窗口。
3. 在宿主窗口中打开目标工作区，并验证 `design/` 目录约定是否齐全。
4. 从 Chat 面板触发实际工作流，观察聊天输出和 `design/` 文件变化是否一致。
5. 如果是测试链路问题，优先检查 `design/KG/SystemArchitecture.json` 中 testcase 的脚本路径是否可执行。

## 打包与发布

`publish.py` 提供了构建、打包和发布的统一入口。

### 仅打包 VSIX

```bash
python publish.py package
```

### 指定版本打包

```bash
python publish.py package --version 0.10.5
```

### 自动递增补丁版本并发布

```bash
python publish.py publish
```

### 使用显式版本发布

```bash
python publish.py publish --version 0.10.5
```

发布前脚本会自动执行这些步骤：

- 安装依赖（如缺失）
- 检查 `@vscode/vsce` 是否可用
- 编译 TypeScript
- 执行发布前检查
- 生成 `build/` 下的 `.vsix` 包

如果要真正发布到 VS Code Marketplace，需要提供 `VSCE_PAT` 或通过 `--pat` 传入令牌。

## 维护建议

为了让这个工程持续有效，建议在日常开发中遵守以下约束：

- 不要把 `design/` 当成临时目录，核心产物应进入版本控制。
- testcase 的脚本路径必须真实可执行，避免图谱与仓库脱节。
- 聊天输出只作为过程提示，最终依据应以落盘文件和测试结果为准。
- 每次调整流程或扩展能力后，优先检查 `src/extension.ts`、`package.json` 和 `src/commands/` 的一致性。

## License

MIT

The generated VSIX can be installed with:

```bash
code --install-extension argo-architect-0.1.0.vsix
```

Publish workflow is also handled by `publish.py`.

## Utility Scripts

### `publish.py`

Builds, validates, and packages or publishes the extension.

### `pack_workspace.py`

Exports workspace files into JSON while respecting `.gitignore` patterns. Useful for external inspection or prompt packaging workflows.

## Current Status

The project currently provides the core orchestration flow, semantic UML extraction pipeline, intent-to-implementation comparison, and fixed-path design asset management under `design/`.

## License

MIT
# Argo — Work Agent

Argo 工作代理是一个 VS Code Chat 扩展，专注于读取 `design/KG/SystemArchitecture.json` 中声明的测试用例，逐个执行其验收脚本，并生成结构化的测试结果报告与修复交接内容。

它的目标是把"测试执行""结果收集""失败交接"这些动作标准化为可重复的工程流程，使得失败项可以被结构化地交给主代理继续修复。

## 工程目的

Argo 工作代理主要解决一个核心问题：

当架构图谱中声明了多个测试用例（testcase）时，需要有一个自动化工具能够：

1. 读取图谱中的所有 testcase 定义。
2. 依次执行每个 testcase 的 `acceptanceCriteria` 脚本。
3. 捕获测试输出和返回码，判断成功或失败。
4. 失败时生成结构化的失败记录文件。
5. 把失败信息和相关上下文整理成可交给 Copilot 主代理的修复提示。

围绕这个目标，工程提供了以下能力：

- 以 `design/KG/SystemArchitecture.json` 作为唯一的 testcase 声明来源。
- 提供 `/work` 命令，用于执行图谱中的所有测试。
- 自动生成 `design/KG/test-failure-records.json`，供后续修复使用。

## 适用场景

本工程更适合以下类型的仓库：

- 已经在 `design/KG/SystemArchitecture.json` 中维护了 testcase 定义和验收脚本路径的项目。
- 希望在 Copilot Chat 中快速验证这些测试是否真实可执行的团队。
- 需要自动化捕获测试失败信息并生成修复交接内容的工程。
- 希望把"测试失败 → 生成失败记录 → 交接修复"的流程固定下来的场景。

## 工作区约定

工程默认采用约定优于配置的方式，核心输入输出都放在工作区根目录下的 `design/` 中。

常见文件说明：

| 路径 | 作用 |
|------|------|
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

### 在 VS Code 中加载扩展

本工程是一个本地开发中的 VS Code 扩展，典型使用方式如下：

1. 安装依赖。
2. 编译 TypeScript 代码。
3. 在 VS Code 中以扩展开发模式启动调试窗口。
4. 在新的调试窗口中打开 Chat 面板并使用 `@argowork /work` 命令。

本仓库的核心入口位于：

- `src/extension.ts`：扩展激活入口，注册工作代理 `argo.worker`。
- `src/workParticipant.ts`：工作代理请求处理和分发。
- `src/commands/work.ts`：`/work` 命令的核心实现。

### 推荐使用方式

推荐按下面的顺序使用工作代理：

1. 在 `design/KG/SystemArchitecture.json` 中为相关功能定义 testcase，每个 testcase 必须包含 `acceptanceCriteria` 字段指向一个真实可执行的脚本路径或 pytest node id。
2. 确保这些脚本在执行时能够独立运行，无需额外的命令行参数或环境准备。
3. 在 VS Code Chat 中使用 `@argowork /work` 命令执行所有 testcase。
4. 观察 `design/KG/test-failure-records.json` 中的失败记录。
5. 基于失败记录，把上下文交给 Copilot 主代理继续修复，而不是手工重复整理。

### `/work` 命令工作流

`@argowork /work` 命令是工作代理的核心能力。它会：
1. **读取**：读取 `design/KG/SystemArchitecture.json` 中所有元素的 `testcases` 数组。
2. **执行**：对每个 testcase，执行其 `acceptanceCriteria` 指向的脚本。
3. **收集**：捕获脚本的退出码和输出。
4. **报告**：输出运行摘要，包括通过个数、失败个数和失败原因。
5. **交接**：生成 `design/KG/test-failure-records.json`，包含所有失败用例的详细信息。

典型工作流如下：

```text
你        @argowork /work
   ↓
工作代理  读取 SystemArchitecture.json → 逐个执行 testcase → 生成 test-failure-records.json
   ↓
主代理    读取失败记录 → 修复代码 → 推送修改
   ↓
你        再次运行 @argowork /work → 验证修复结果
```

如果 testcase 缺少 `acceptanceCriteria` 或无法执行，工作流会标记为失败并记录错误原因。

### 产物查看建议

这个工程的有效输出通常不在聊天窗口，而在仓库文件里。使用过程中建议重点关注：

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
├── design/                  # 架构图谱、testcase 定义、失败记录产物
├── eatool/                  # EA 相关模板资源
├── src/
│   ├── commands/            # /work 命令实现
│   │   └── work.ts         # 工作代理 /work 命令处理
│   ├── tools/               # 工具定义与测试执行实现
│   │   └── architectureTestTool.ts  # 核心工具：读取图谱、执行测试、生成失败记录
│   ├── utils/               # 工作区初始化、文件操作等辅助能力
│   ├── extension.ts         # VS Code 扩展入口，注册工作代理和工具
│   └── workParticipant.ts   # 工作代理请求处理
├── tests/                   # 测试脚本
│   └── e2e/                # E2E 测试
├── publish.py               # 打包与发布脚本
├── pack_workspace.py        # 打包当前工作区内容为 JSON
├── package.json             # 扩展清单、命令、配置与依赖
└── tsconfig.json            # TypeScript 编译配置
```

## 核心模块说明

### `src/commands/work.ts`

实现 `/work` 命令的请求处理逻辑。收到命令后，调用 `architectureTestTool` 执行图谱中的所有 testcase，并通过流式输出返回结果摘要。

### `src/tools/architectureTestTool.ts`

工作代理的核心工具。负责：

1. 读取 `design/KG/SystemArchitecture.json` 中的所有 testcase。
2. 对每个 testcase，执行 `acceptanceCriteria` 指向的脚本（支持文件路径和 pytest node id）。
3. 捕获脚本返回码和输出。
4. 生成 `design/KG/test-failure-records.json`，记录所有失败用例。
5. 输出运行摘要（通过个数、失败个数、失败原因）。

### `src/utils/workspaceBootstrap.ts`

在扩展激活时，自动为新工作区创建 EA 模型模板文件。确保 `design/` 目录结构完整。

## 本地调试建议

本工程本质上是扩展开发项目，调试时建议采用以下方式：

1. 先执行 `npm run compile`，确保 `out/extension.js` 已生成。
2. 执行 `npm run test:e2e:workspace-bootstrap` 验证工作区初始化是否正常。
3. 在 VS Code 中启动扩展开发宿主窗口。
4. 在宿主窗口中打开一个包含 `design/KG/SystemArchitecture.json` 的工作区。
5. 从 Chat 面板输入 `@argowork /work` 触发工作代理。
6. 观察输出摘要和生成的 `design/KG/test-failure-records.json` 是否符合预期。
7. 如果 testcase 未被执行或脚本执行失败，检查 `acceptanceCriteria` 指向的脚本路径是否真实存在和可执行。

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

- **testcase 完整性**：`design/KG/SystemArchitecture.json` 中的每个 testcase 必须完整包含 `name`、`description`、`acceptanceCriteria` 和 `TestResults` 字段。
- **脚本可执行性**：`acceptanceCriteria` 必须指向一个真实存在、可独立执行的脚本或 pytest node id，不能是 `npm run` 或其他命令行调用。
- **失败记录管理**：`design/KG/test-failure-records.json` 是工作代理生成的输出，不要手工编辑，而是基于它继续推进修复。
- **版本控制**：把 `design/KG/SystemArchitecture.json` 纳入版本控制，作为团队共同维护的架构图谱。
- **扩展维护**：修改 `/work` 命令实现时，优先检查 `src/extension.ts`、`package.json` 和 `src/commands/work.ts` 的一致性。

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
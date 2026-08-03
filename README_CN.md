# ARGO HARNESS

## 快速开始

### 安装

将平台适配包与共享的 `.argo/` 目录一同复制到目标工作区根目录，然后确认目标平台能够发现名为 `argo` 的 MCP 服务：

| 版本 | 环境 | 部署内容 | 主要入口 |
| --- | --- | --- | --- |
| [Cursor](.cursor/) | Cursor | `.cursor/` + `.argo/` | `/business-partner`；任务启动时选择 `/task-emit-human-in-the-loop` 或 `/task-emit-afk` |
| [Copilot](.github/) | GitHub Copilot | `.github/` + `.argo/` | `BusinessPartner`；任务启动时选择 `task-emit-human-in-the-loop` 或 `task-emit-afk` |
| [OpenCode](.opencode/) | OpenCode | `.opencode/` + `.argo/` | `BusinessPartner`；任务启动时选择 `task-emit-human-in-the-loop` 或 `task-emit-afk`，另有 `/argo-init`、`/argotest` |

安装后执行 `/argo-init`。它检查 `argo` MCP工具、GraphRAG（向量知识图谱）的就绪状态，并初始化知识图谱语义生命周期；（注：仅在配置了向量排序模型的情况下才进行自动Embedding并入库）

### 选择正确的入口

所有新需求和问题单（包括缺陷与测试失败）统一先进入 `BusinessPartner` 。它负责澄清业务目标、影响范围和验收边界，当决策完成后，将已收敛的决策树交给 `/task-tidy`。任务包准备完成后，再根据参与方式选择任务启动模式：
1）`/task-emit-human-in-the-loop` ：由人持续进行阶段审批与最终验收；
2）`/task-emit-afk` 由 Agent 自主持续推进、打回未通过验收的任务，直至验收通过；

| 场景               | 从这里开始                                                                                                                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 新需求、业务提案、缺陷或测试失败 | `BusinessPartner` / `/business-partner` → `/task-tidy` → 选择 `/task-emit-human-in-the-loop` 或 `/task-emit-afk`，验收通过后调用：`/delivery-archive`进行迭代交付文档归档                                    |
| 架构优化             | `BusinessPartner` / `/business-partner` → `/improve-codebase-architecture` → `/task-tidy` → 选择 `/task-emit-human-in-the-loop` 或 `/task-emit-afk`，验收通过后调用：`/delivery-archive`进行迭代交付文档归档 |

有关详细的选择标准、建议输入和输出，请参阅[使用场景与入口选择](design/argo-harness/usage-scenarios/README.md)。

## 扩展 ARGO //TODO：这里重新换成“开始前的准备工作”，主要介绍可以对意图架构知识图谱进行预填充，包括业务需求、架构设计、工作包，特别是工作包可以关联该工作需要使用的SKILL、工具、需要的知识等

项目可以通过领域模板和工作包扩展。工作包将一个有边界的交付关注点连接到约束它的架构元素，再提供交付该关注点所需的技能、环境访问和证据。

每个工作包应：

- 在意图架构中识别相关的目标、能力、流程、应用、技术和验收测试用例；
- 仅暴露该架构范围所需的领域技能、知识、测试环境信息、设备或外部服务控制；
- 定义其编码边界和测试入口；以及
- 通过公共验证流程返回构建、运行、可观测性和验收证据。

每个领域模板可以组合：

- 默认意图架构和视角；
- 领域技能和知识库；
- 编码标准和实现边界；
- 测试环境、设备或外部服务控制接口；以及
- 构建、运行、可观测性和验收证据。

| 可用领域 | 能力 |
| --- | --- |
| [HarmonyOS 与跨平台移动开发](design/specific-domain/harmonyos/README.md) | ArkTS/ArkUI、设备环境、窗口分析、跨平台比较、构建和运行工作流，以及交付预检 |

在 `design/specific-domain/<domain>/` 下添加新模板，并将领域技能放在 `.argo/skills/<domain>/` 或相应的平台适配目录中。领域能力不得绕过公共的意图设计、实现设计或两级验收流程。

更多扩展约定请参阅[领域模板索引](design/specific-domain/README.md)。

# 领域模板索引

领域模板是 ARGO 的可变扩展层。稳定底座仍是意图架构、`argo` MCP 和 HARNESS 工程流；模板只为某类项目预装默认上下文和能力。

一个领域目录可以说明：

- 默认意图架构或可复用 viewpoint；
- 何时使用哪些领域 Skill；
- 需要加载的知识库和编码规范；
- 测试环境、设备、外部服务和控制接口；
- 构建、运行、观测和验收证据；
- 与通用阶段 Agent 的绑定方式。

## 已有领域

| 领域 | 设计文档 | 能力摘要 |
| --- | --- | --- |
| HarmonyOS 与跨端移动开发 | [HarmonyOS 领域模板](harmonyos/README.md) | ArkTS/ArkUI、设备环境、跨端页面分析、构建和交付预检 |

## 新增领域约定

```text
design/specific-domain/<domain>/
└── README.md                       领域边界、Skill、知识、环境和验收说明

.argo/skills/<domain>/              跨平台 Skill 实现
.cursor|.github|.opencode/skills/   平台入口或适配层
```

领域文档不得复制通用 HARNESS 主流程。只说明领域特有能力，以及这些能力在哪个通用阶段被调用。

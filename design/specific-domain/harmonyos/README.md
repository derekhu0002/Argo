# HarmonyOS 与跨端移动开发领域模板

该模板服务于 HarmonyOS NEXT、ArkTS、ArkUI、DevEco Studio、Android 到 HarmonyOS 迁移、跨端页面对齐和交付证据采集。

领域 Skill 不替代 ARGO 的意图设计和实现设计。涉及业务语义、用户旅程、验收边界或实现契约变化时，仍先走通用阶段闭环；这些 Skill 只在编码、调试、迁移和交付验证阶段提供领域知识与可观察证据。

## 能力与入口

| 能力 | Skill | 典型用途 |
| --- | --- | --- |
| HarmonyOS 开发知识 | `/harmonyos-development` | ArkTS、ArkUI、Stage 模型、权限、状态、测试与性能 |
| ArkTS 编码规范 | `/arkts-coding-standard` | 严格类型、对象形状、`any` 和运行时形状检查 |
| 模拟器准备 | `/emulator-setup` | 启动 Android / HarmonyOS 模拟器并检查 `adb` / `hdc` |
| Android 窗口分析 | `/android-window-analysis` | 用组件树和截图确认 Android 页面状态 |
| HarmonyOS 窗口分析 | `/window-analysis` | 用组件树和截图确认 HarmonyOS 页面状态 |
| 跨端页面比较 | `/cross-platform-page-compare` | 输出 TOP3 页面差距与视觉验收标准 |
| 构建、打包、安装、启动 | `/wp-harmony-build-package-run-skill` | 形成候选产物和运行观察证据 |
| UI 截图比较 | `/wp-ui-snapshot-comparison-skill` | 按 journey step 捕获、配对并比较截图 |
| 交付预检 | `/wp-delivery-preflight-skill` | 聚合构建运行和 UI 比较结果 |

## 推荐调用顺序

### 新功能或行为变化

```text
通用新需求流程
  → IntentionDesign 确认用户旅程和显性验收
  → ImplementationDesign 定义 ArkUI/ArkTS 边界和测试入口
  → harmonyos-development + arkts-coding-standard
  → 构建运行
  → UI/行为证据
  → 通用双层验收
```

### Android 到 HarmonyOS 页面迁移

```text
emulator-setup
  → android-window-analysis
  → window-analysis
  → cross-platform-page-compare
  → 按已审核实现 handoff 修复
  → wp-delivery-preflight-skill
```

页面比较输出是实现证据，不自动改写业务验收语义。若发现原需求或用户旅程不完整，必须回到意图设计。

## 交付观察边界

领域交付至少区分：

- **构建证据**：编译、打包和产物路径；
- **运行证据**：安装、启动、设备连接和关键日志；
- **结构证据**：组件树、可访问文本和页面状态；
- **视觉证据**：命名 journey step 的截图与差异；
- **业务证据**：由意图架构显性 testcase 定义的可观察结果。

`wp-*` Skill 的 `summary`、`artifacts`、`evidence` 和 `comparison` 是可组合的观察边界，不能用单张截图或“构建成功”替代完整业务验收。

## 实现位置

共享领域能力位于 `.argo/skills/mobile-dev/`；平台目录可提供入口适配。具体 Skill 的输入、输出和限制以各自 `SKILL.md` 与局部 `ARCHITECTURE.md` 为准。

通用流程见[HARNESS 工程流程](../../argo-harness/README.md)，入口选择见[使用场景](../../argo-harness/usage-scenarios/README.md)。

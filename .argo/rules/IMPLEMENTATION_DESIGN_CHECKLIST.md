# ImplementationDesign 交付件清单

> 由 ImplementationDesign Agent 在对外 handoff 给 CodingAndReparing 之前逐项自检。
> 触发方式：Agent 必须先写出 `ImplementationToCodingHandoff.json`，再在交接前 `read_file` 本文件并逐项确认。

---

## A. 架构合约

| # | 交付件 | 路径 | 要求 |
|---|--------|------|------|
| A1 | **根架构合约** | `OVERALL_ARCHITECTURE.md`（仓库根目录） | ① 声明根级规则（依赖方向、边界纪律） ② 列出全部 StableArchitectureElement 及其路径映射 ③ 列出全部 ImplementsMapping（实现元素 → 意图元素 ID） ④ 不包含模块级细节（归属局部合约） |
| A2 | **局部架构合约** | 每个稳定目录下一份 `ARCHITECTURE.md` | ① 声明本模块局部职责 ② 列出局部依赖（依赖的模块 + 接口） ③ 列出本模块拥有的全部测试资产路径 ④ 可引用根合约但**不得重复**根合约中的规则 |

---

## B. 测试资产

| # | 交付件 | 路径 | 要求 |
|---|--------|------|------|
| B1 | **显式测试入口点** | 每个 ExplicitAcceptanceTestcase 对应一个可执行文件 | ① 含 GIVEN / WHEN / THEN 三段式断言 ② 使用 TestHarness 抽象（不直接写 SQL/HTTP/GraphQL plumbing） ③ 语义化数据命名 + 业务可读失败分类 ④ Coding 阶段对此文件**只读** ⑤ **已在本阶段实际运行**并分类为 pass / expected failure / design blocker |
| B2 | **关键非显式测试** | 按类别存放 | ① 覆盖四类：`ArchitectureBoundaryGuard` / `DependencyDirectionGuard` / `ExplicitEntrypointCorrectnessGuard` / `KeyImplementationTraceabilityGuard` ② 入口点冻结（frozen），Coding 阶段不可修改 ③ 声明受保护的 fixtures 和 baselines |
| B3 | **支撑性非显式测试** | 按需存放 | ① 明确护栏目的说明 ② Coding 阶段允许演进 |
| B4 | **TestHarness** | 测试工具目录 | ① 业务可读方法 ② 隐藏底层 plumbing（SQL/Cypher/GraphQL/HTTP/环境变量） |

---

## C. 核心 Handoff 产物

| # | 交付件 | 路径 | 要求 |
|---|--------|------|------|
| C1 | **ImplementationToCodingHandoff.json** | `.argo/temp/ImplementationToCodingHandoff.json` | 以下 8 个字段全部非空（该类别无内容除外）： |

**C1 字段清单：**

| 字段 | 类型 | 要求 |
|------|------|------|
| `implementationContracts` | `string[]` | A1 + 全部 A2 的路径 |
| `explicitEntrypoints` | `string[]` | 全部 B1 的路径 |
| `criticalNonExplicitTests` | `string[]` | 全部 B2 的路径 + 每项 category 标注 |
| `supportingNonExplicitTests` | `string[]` | 全部 B3 的路径 |
| `expectedFailureRecordsPath` | `string` | 指向预期失败记录文件（供 Coding 修复） |
| `codingTargets` | `string[]` | CodingAndReparing 需实现/修改的文件清单 |
| `taskExecutionPlan` | `object[]` | 有序实现计划，每项含 taskId / description / dependencies / targetFiles |
| `frozenFiles` | `string[]` | CodingAndReparing **禁止修改**的文件路径（至少含全部 B1 + B2） |

---

## D. 可选上游反馈

| # | 交付件 | 路径 | 触发条件 | 要求 |
|---|--------|------|----------|------|
| D1 | **ImplementationToIntentTraceProposal.json** | `design/KG/ImplementationToIntentTraceProposal.json` | 实现锚点与意图元素存在语义不匹配/缺失 | ① 列出 proposedIntentTraceLinks ② 每项含 implementationAnchor + proposedIntentElementId + rationale |

---

## E. 运行时记录

| # | 交付件 | 路径 | 要求 |
|---|--------|------|------|
| E1 | **会话决策记录** | `design/persistant-memory/implementation-design.md` | 记录关键决策、合约变更、开放架构风险 |
| E2 | **测试运行分类结果** | 体现在 C1 的 expectedFailureRecords 中 | 每个 B1 入口点已运行并得到明确的 pass / expected failure / design blocker 分类 |

---

## F. 阶段门禁

| # | 门禁 | 要求 |
|---|------|------|
| F1 | **schema 校验** | `argo.validateStageHandoff` 以 `stage = "implementation-to-coding"` 运行通过 |
| F2 | **人工审批** | 向人类展示完整 handoff 摘要（contracts + entrypoints + guardrails + frozenFiles + expectedFailureRecordsPath + taskExecutionPlan），获得**显式批准**后才可 emit |
| F3 | **pre-coding delivery baseline** | handoff 前运行全量 `argo.runArchitectureTests`，刷新 `deliveryStatus` 与 failure records；若 MCP 调用超时，直接运行 `node .argo/scripts/runArchitectureTests.js`；该结果作为 Coding 阶段 delivered 回归检测基线 |
| F4 | **阶段提交** | 写出并校验 `ImplementationToCodingHandoff.json` 后、handoff 给 CodingAndReparing 前完成 ImplementationDesign 阶段 git commit，提交 contracts、test entrypoints、handoff、runner 刷新的 `deliveryStatus`/failure records 等本阶段产物 |

---

## 汇总确认项

```
[ ] A1 OVERALL_ARCHITECTURE.md 已写入，含根级规则 + 稳定元素映射 + ImplementsMapping
[ ] A2 每个稳定目录均有 ARCHITECTURE.md，无根规则重复
[ ] B1 每个显式验收用例已物化为可执行入口，含 GIVEN/WHEN/THEN
[ ] B1 入口点已实际运行并分类（pass / expected failure / design blocker）
[ ] B2 四类 CriticalNonExplicitTest 均覆盖
[ ] B3 SupportingNonExplicitTest 有护栏目的说明
[ ] B4 TestHarness 提供业务可读抽象
[ ] C1 ImplementationToCodingHandoff.json 8 字段齐全
[ ] C1 frozenFiles 至少包含全部 B1 + B2
[ ] C1 expectedFailureRecordsPath 指向有效记录文件
[ ] C1 taskExecutionPlan 有序且每项含 taskId/description/dependencies/targetFiles
[ ] D1 TraceProposal 按需生成（无不匹配则跳过）
[ ] E1 会话决策记录已写
[ ] E2 测试运行分类结果已记录
[ ] F1 argo.validateStageHandoff 通过
[ ] F2 人类已审批完整 handoff 摘要
[ ] F3 已运行全量 argo.runArchitectureTests 并形成 pre-coding deliveryStatus 基线
[ ] F4 已完成 ImplementationDesign 阶段 git commit
```

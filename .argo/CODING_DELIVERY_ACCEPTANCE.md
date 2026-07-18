# CodingAndReparing 交付验收标准

> CodingAndReparing Agent 在修复队列清空后必须逐项自检。
> 触发方式：Agent 必须在所有修复完成后 `read_file` 本文件并逐项确认，全部通过后内部声明完成（无需向人类报告；ImplementationDesign 的 audit 事件会审计其产出）。

---

## 核心验收准则

> **当前 handoff 范围内所有显式测试用例与关键非显式测试通过**，且满足以下全部约束。
>
> ⚠️ **范围限定**：仅要求 `ImplementationToCodingHandoff.json` 中 `explicitEntrypoints` 和 `criticalNonExplicitTests` 列出的测试通过。其他测试（不属于本 handoff 交付范围的旧测试、未来迭代测试、非本模块测试）即使失败也不阻塞当前阶段完成。
>
> `argo.runArchitectureTests` 仍必须全量运行，用于刷新整个意图图谱的 `deliveryStatus` 并生成/更新 failure records。非 handoff scope 的剩余失败必须报告为 out-of-scope remaining failures，但不阻塞本轮 CodingAndReparing 完成。
>
> `deliveryStatus` 是 runner-owned 字段：CodingAndReparing 不得手动编辑、回滚或伪造；但 `argo.runArchitectureTests` 自动产生的 `deliveryStatus` diff 是合法副作用。验收时必须保留带有新鲜 runner 证据的 `deliveryStatus` 变更。

---

## A. 显式测试全通过

| # | 条件 | 验证方式 |
|---|------|----------|
| A1 | `ImplementationToCodingHandoff.json` 中 `explicitEntrypoints` 列出的**每一个**测试入口点全部 pass | `argo.runArchitectureTests`，0 个显式测试失败 |
| A2 | `expectedFailureRecordsPath` 中记录的所有预期失败已全部消除 | 对比修复前后的 failure records：预期失败清单为空 |
| A3 | 不得通过修改 frozen 测试入口点（B1/B2）来让测试通过 | 检查 diff：`frozenFiles` 中任何文件未被修改 |

---

## B. 关键非显式测试全通过

| # | 条件 | 验证方式 |
|---|------|----------|
| B1 | `criticalNonExplicitTests` 中列出的全部测试通过 | `argo.runArchitectureTests`，0 个关键非显式测试失败 |
| B2 | 四类 Guard 全部通过：ArchitectureBoundaryGuard / DependencyDirectionGuard / ExplicitEntrypointCorrectnessGuard / KeyImplementationTraceabilityGuard | 每类至少一个通过的测试结果 |

---

## C. 合约遵守

| # | 条件 | 验证方式 |
|---|------|----------|
| C1 | 所有手工修改仅限 `codingTargets` 中列出的文件 + 合约允许的支撑性测试文件；`argo.runArchitectureTests` 自动刷新 `deliveryStatus` 产生的 `SystemArchitecture.json` diff 例外 | 检查 diff：无文件越权修改；若存在 `deliveryStatus` diff，必须有本轮 runner 证据 |
| C2 | `frozenFiles` 中任何文件未被修改 | `git diff --name-only` 与 frozenFiles 交集为空 |
| C3 | `OVERALL_ARCHITECTURE.md` 未被修改 | diff 检查 |
| C4 | 任何 `**/ARCHITECTURE.md` 未被修改 | diff 检查 |
| C5 | `.argo/temp/ImplementationToCodingHandoff.json` 未被修改 | diff 检查 |

---

## D. 代码质量约束

| # | 条件 | 验证方式 |
|---|------|----------|
| D1 | 无 test-only 分支/开关/后门/assertion-only 字段/假 mock/fixture 路径 | 代码审查：生产代码不含测试专用逻辑 |
| D2 | 修复采用最小代码量 | 代码审查：变更量合理，无推测性功能/一次性抽象/未请求的可配置性/不可能场景处理 |
| D3 | 修复遵循依赖顺序：上游依赖 → 共享合约 → 前置入口点 → 下游能力 | 修复记录可追溯至 handoff 的 taskExecutionPlan |
| D4 | 每个修复可追溯至 handoff item / failure record / explicit testcase entrypoint | 修复记录含追溯链 |

---

## E. 接口一致性

| # | 条件 | 验证方式 |
|---|------|----------|
| E1 | 如有外部接口变更，`INTRODUCTION.md` 已更新匹配实际接口 | 检查 diff |
| E2 | 如有新增/变更的配置项，相关文档已同步 | 检查 diff |

---

## F. 支撑性测试（可选）

| # | 条件 | 验证方式 |
|---|------|----------|
| F1 | 新增或优化的支撑性测试（supportingNonExplicitTests）在合约允许范围内 | diff 仅触及 contract-allowed 文件 |
| F2 | 支撑性测试有明确的 control point 和 observation point | 代码审查 |

---

## G. 门禁

| # | 门禁 | 要求 |
|---|------|------|
| G1 | `argo.runArchitectureTests` 已全量运行；handoff-scoped explicitEntrypoints 与 criticalNonExplicitTests 通过；非 scope 失败已报告 | 本 handoff 范围 0 失败；全量 failure records 中剩余失败均标注为 out-of-scope |
| G2 | Handoff 完整性检查 | 如果 handoff 缺失/不完整/与仓库状态冲突导致无法工作，报告 Implementation Design gap（而非跳过） |
| G3 | 测试环境问题不能作为跳过理由 | 如测试环境阻塞，停止并向人类求助 |
| G4 | delivered 回归检查 | 对比 ImplementationDesign 阶段 pre-coding 基线 commit 与 Coding 后全量 runner 结果；任何基线中 `delivered` 的元素变为 `not_delivered` 都是阻塞回归，必须修复 |
| G5 | 阶段提交 | Coding/Repair 完成后、进入 ImplementationDesign audit 前，提交 Coding 阶段 git commit，包含代码修复、允许的支撑测试、全量 runner 刷新的 `deliveryStatus`/failure records |

---

## 汇总确认项

```
[ ] A1 所有 explicitEntrypoints 全部 pass（0 失败）
[ ] A2 expectedFailureRecords 已清空
[ ] A3 frozenFiles 未被修改（含 B1 显式入口 + B2 关键非显式测试）
[ ] B1 所有 criticalNonExplicitTests 全部 pass
[ ] B2 四类 Guard 全部通过
[ ] C1 修改仅限 codingTargets + contract-allowed 支撑性测试
[ ] C2 frozenFiles 零修改
[ ] C3 OVERALL_ARCHITECTURE.md 未修改
[ ] C4 **/ARCHITECTURE.md 未修改
[ ] C5 ImplementationToCodingHandoff.json 未修改
[ ] D1 生产代码无 test-only 逻辑
[ ] D2 最小代码量修复
[ ] D3 修复顺序遵循依赖顺序
[ ] D4 每个修复有追溯链
[ ] E1 INTRODUCTION.md 与接口一致（如有接口变更）
[ ] E2 配置文档同步（如有配置变更）
[ ] F1 支撑性测试在合约允许范围（如有新增）
[ ] F2 支撑性测试有 control/observation point
[ ] G1 argo.runArchitectureTests 已全量运行；handoff scope 0 失败；非 scope 剩余失败已报告
[ ] G2 Handoff 完整性无 gap
[ ] G3 无测试环境阻塞
[ ] G4 无 delivered -> not_delivered 回归
[ ] G5 已完成 Coding/Repair 阶段 git commit
```

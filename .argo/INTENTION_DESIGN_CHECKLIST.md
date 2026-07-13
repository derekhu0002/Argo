# IntentionDesign 交付件清单

> 由 IntentionDesign Agent 在 emit `IntentToImplementationHandoff.json` 之前逐项自检。
> 触发方式：Agent 必须在 handoff 前 `read_file` 本文件并逐项确认。

---

## A. 意图架构（SystemArchitecture.json）

| # | 交付件 | 路径 | 要求 |
|---|--------|------|------|
| A1 | **意图图变更已持久化** | `design/KG/SystemArchitecture.json` | ① 通过 `argo.applySystemArchitectureMutation` 写入 ② 通过 `argo.validateSystemArchitecture` 校验通过 |
| A2 | **ArchitectureEntityElement 完备** | A1 内 | ① 每个需求可精确映射到已有元素 ② 每个元素有 name / description / attributes / functionalPoints |
| A3 | **FunctionalPoint 完备** | A1 内，挂在对应元素下 | ① 每个元素的 functionalPoint 已列出 ② 每个 functionalPoint 有明确的业务可观测边界 |
| A4 | **IntentRelationship 完备** | A1 内 | ① 上游依赖/下游影响/方向语义已用正确的 ArchiMate 关系类型表达 ② 关系和元素通过 `argo.getIntentElementContext` 可检索 |
| A5 | **View 成员正确** | A1 内 | 新增或修改的元素已加入正确的 View |

---

## B. 验收测试（ExplicitAcceptanceTestcase）

| # | 交付件 | 路径 | 要求 |
|---|--------|------|------|
| B1 | **每个元素挂载了验收测试** | A1 内，挂在对应 ArchitectureEntityElement 下 | ① 测试挂在正确的元素下（上游元素的测试挂在上游，不挂在焦点元素） ② 每个测试有明确的 control point 和 observation point |
| B2 | **每个 functionalPoint 被测试覆盖** | A1 内 CoverageMatrix | ① CoverageMatrix 列出了每个 functionalPoint → mounted testcase id 的映射 ② 任何 functionalPoint 无映射 = 不满足 pre-handoff 条件 |
| B3 | **新增/修改的测试已获人类审批** | A1 内 | ① 本会话中新增或修改的 ExplicitAcceptanceTestcase 的 `approvedByHuman` 必须为 `true` |

---

## C. 依赖子图覆盖证明

| # | 交付件 | 要求 |
|---|--------|------|
| C1 | **依赖子图探索完成** | ① 从焦点元素出发，沿依赖边递归探索直到所有叶节点 `deliveryStatus = "delivered"` ② 已交付节点的证据：所有 mounted testcases pass + 所有上游依赖也 delivered |
| C2 | **覆盖证明** | ① 依赖子图中每个元素：列出 functionalPoints + 列出 mounted testcase ids + 给出覆盖映射 ② 不得用设计文档/方案文档/validation pass/linter 结果替代 same-element mounted testcase ids |

---

## D. Pre-Handoff 充分性条件（8 条全部通过）

| # | 条件 | 状态 |
|---|------|------|
| D1 | 每个需求可精确映射到已有 ArchitectureEntityElement | [ ] |
| D2 | 每个元素 functionalPoints / business outcome / observable boundary 不缺不偏 | [ ] |
| D3 | 所有 IntentRelationship 正确表达了依赖/影响/方向和 ArchiMate 语义 | [ ] |
| D4 | 所有 ExplicitAcceptanceTestcase（含 control point / observation point / 人类审批）完备 | [ ] |
| D5 | 依赖子图覆盖证明完整（每条 functionalPoint 有 same-element mounted testcase 映射，已交付边界有 pass 证据） | [ ] |
| D6 | 可追溯性充足（需求来源/验收标准锚点在图中可查） | [ ] |
| D7 | 本会话新增/修改的 testcase 均 `approvedByHuman = true` | [ ] |
| D8 | 整体 handoff 已获全局人类审批（`approvedByHuman` on handoff = `true`） | [ ] |

---

## E. Handoff 产物

| # | 交付件 | 路径 | 要求 |
|---|--------|------|------|
| E1 | **IntentToImplementationHandoff.json** | `.argo/temp/IntentToImplementationHandoff.json` | 字段齐全：`stage`(=intent-to-implementation) / `generatedAt` / `sourceIntentGraphPath` / `intentElementIds` / `relationshipIds` / `summary` / `openQuestions` / `notes` |
| E2 | **schema 校验** | E1 | `argo.validateStageHandoff` 以 `stage = "intent-to-implementation"` 运行通过 |
| E3 | **Handoff 人类审批** | E1 | `approvedByHuman = true`，与 per-testcase 审批独立，即使无新增测试也必须满足 |

---

## F. 运行时记录

| # | 交付件 | 路径 | 要求 |
|---|--------|------|------|
| F1 | **会话决策记录** | `design/persistant-memory/intention-design.md` | 记录关键决策、覆盖证明摘要、开放问题 |

---

## 汇总确认项

```
[ ] A1 SystemArchitecture.json mutation 已持久化并校验通过
[ ] A2 所有 ArchitectureEntityElement 完备
[ ] A3 所有 FunctionalPoint 完备
[ ] A4 所有 IntentRelationship 完备
[ ] A5 View 成员正确
[ ] B1 每个元素有 mounted AcceptanceTest
[ ] B2 CoverageMatrix 覆盖映射完整
[ ] B3 新增/修改 testcase 均 approvedByHuman=true
[ ] C1 依赖子图探索完成（到达所有 delivered 叶节点）
[ ] C2 覆盖证明为 same-element mounted testcase 映射（非文档/validation）
[ ] D1-D8 全部 8 条 pre-handoff 条件通过
[ ] E1 IntentToImplementationHandoff.json 字段齐全
[ ] E2 argo.validateStageHandoff 通过
[ ] E3 Handoff 全局人类审批 approvedByHuman=true
[ ] F1 会话决策记录已写
```

---
name: task-emit-afk
description: "Package the target architecture elements and acceptance cases into delivery slices"
argument-hint: scope
disable-model-invocation: true
---

## Role

将待开发的架构元素和需要通过的验收用例，按合适粒度拆分为可交付任务包，并在全部任务包整理完成后再启动 `/Orchestrator`。

## Rules

- **MUST** 在分包前固定本次决策基线：task-tidy 生成的具体决策树文件、架构元素 ID 与范围、挂载验收用例、accepted/rejected 分支、约束及依赖顺序。缺少可追踪基线时不得启动 `/Orchestrator`。
- **MUST** 只把本次要实现的架构元素 ID、名称、对应交付范围、挂载验收用例和决策基线引用放入 `WorkPackage`。
- **MUST** 以固定结构输出，保证每个任务包都能被稳定解析。
- **MUST** 仅在全部任务包整理完成后，最后再启动 `/Orchestrator`；不得在中途启动。
- **MUST** 为每个架构元素单独描述交付范围，明确本次交付的是该元素的全部内容还是部分内容。
- **MUST** 将验收用例与其对应的架构元素一起纳入分包边界，避免交付范围失配。
- **MUST** 在测试用例已存在时，将其挂载在对应的架构元素下，不得以任务包级别笼统汇总。
- **MUST** 在测试用例在意图架构图谱中尚未存在时，可以不提供，且直接去掉该字段。
- **MUST** 按可独立验收、可顺序推进的粒度分包，不要输出过粗或过碎的任务切片。
- **MUST NOT** 输出任何工作流说明、执行步骤、审批流程说明或方法论指导。
- **MUST NOT** 扩写为实现方案、设计分析、代码建议或测试执行说明。

## Workflow

1. 识别本次涉及的架构元素与已有验收用例。
2. 按可独立交付、可独立验收的粒度整理 `WorkPackage`。
3. 为每个架构元素填写交付范围，以及可选的测试用例挂载信息。
4. 按以下结构输出全部 `WorkPackage`：

```md
## WorkPackage 1

- 架构元素:
	- ID: <element-id>
	- 名称: <element-name>
	- 本次交付范围: <scope>
	- 决策基线: <decision-tree-path#decision-node-ids>
	- 测试用例:
		- <testcase-id>: <testcase-name>
		- <testcase-id>: <testcase-name>

## WorkPackage 2

- 架构元素:
	- ID: <element-id>
	- 名称: <element-name>
	- 本次交付范围: <scope>
	- 决策基线: <decision-tree-path#decision-node-ids>
	- 测试用例:
		- <testcase-id>: <testcase-name>
		- <testcase-id>: <testcase-name>
```

如果一个任务包包含多个架构元素，则在同一个 `WorkPackage` 下为每个架构元素重复同样的结构，并分别填写各自的交付范围与测试用例。如果只有一个任务包，则只输出一个 `WorkPackage` 块；如果有多个任务包，则按 `WorkPackage 1`、`WorkPackage 2`、`WorkPackage 3` 依次编号。
5. 在全部 `WorkPackage` 输出完成后，将 `WorkPackage` 按依赖顺序 Handoff 给不同的 `/Orchestrator`。Handoff 必须严格按以下结构输出：

```md
## WorkPackage

- 架构元素:
	- ID: <element-id>
	- 名称: <element-name>
	- 本次交付范围: <scope>
	- 决策基线: <decision-tree-path#decision-node-ids>
	- 测试用例:
		- <testcase-id>: <testcase-name>
		- <testcase-id>: <testcase-name>
```

6. 之后你继续负责全权审批与最终验收；如果验收未通过，必须打回并继续推进，直到验收通过。
7. 每个阶段审批请求返回后，你必须依据该 `WorkPackage` 的决策基线核对。全部满足才可返回 `APPROVED`；可在既有决策内修复则返回 `REWORK_REQUIRED`；需要新业务决定或缺少必要人工授权则返回 `BLOCKED_HUMAN_DECISION`。
8. `/Orchestrator` 报告全部阶段和审计完成后，你必须逐个 `WorkPackage` 完成最终符合性验收。只有所有架构元素范围、accepted/rejected 决策、验收用例、约束、依赖、门禁及无回退证据均符合前期决策，且不存在 unresolved blocker，才可宣布最终验收通过。测试通过本身不是充分条件。
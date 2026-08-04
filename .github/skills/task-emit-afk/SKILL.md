---
name: task-emit-afk
description: "Package the target architecture elements and acceptance cases into delivery slices"
argument-hint: scope
disable-model-invocation: true
---

## Role

将待开发的架构元素和需要通过的验收用例，按合适粒度拆分为可交付任务包，并在全部任务包整理完成后再启动 `/Orchestrator`。

你保留后续全权审批与最终验收职责；如果验收未通过，必须打回并继续推进，直到验收通过。

## Rules

- **MUST** 只输出本次要实现的架构元素 ID、名称，以及对应交付范围。
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
	- 测试用例:
		- <testcase-id>: <testcase-name>
		- <testcase-id>: <testcase-name>

## WorkPackage 2

- 架构元素:
	- ID: <element-id>
	- 名称: <element-name>
	- 本次交付范围: <scope>
	- 测试用例:
		- <testcase-id>: <testcase-name>
		- <testcase-id>: <testcase-name>
```

如果一个任务包包含多个架构元素，则在同一个 `WorkPackage` 下为每个架构元素重复同样的结构，并分别填写各自的交付范围与测试用例。如果只有一个任务包，则只输出一个 `WorkPackage` 块；如果有多个任务包，则按 `WorkPackage 1`、`WorkPackage 2`、`WorkPackage 3` 依次编号。
5. 在全部 `WorkPackage` 输出完成后，将 `WorkPackage`按依赖顺序Handoff给不同的`/Orchestrator`。Handoff必须严格按以下结构输出：

```md
## WorkPackage

- 架构元素:
	- ID: <element-id>
	- 名称: <element-name>
	- 本次交付范围: <scope>
	- 测试用例:
		- <testcase-id>: <testcase-name>
		- <testcase-id>: <testcase-name>
```
---
name: task-emit-human-in-the-loop
description: "Package the target architecture elements and acceptance cases into delivery slices for FastOrchestrator, leave approval and final acceptance to the human, and only emit element scope without workflow instructions."
argument-hint: scope
disable-model-invocation: true
---

## Role

将待开发的架构元素和需要通过的验收用例，按合适粒度拆分为可交付任务包，并依次委派给 `/FastOrchestrator`。

后续审批与最终验收由人负责；你只负责持续提供可交付任务包，供人工审批与验收使用。

## Rules

- **MUST** 只输出本次要实现的架构元素 ID、名称，以及对应交付范围。
- **MUST** 以固定结构输出，保证每个任务包都能被稳定解析。
- **MUST** 为每个架构元素单独描述交付范围，明确本次交付的是该元素的全部内容还是部分内容。
- **MUST** 将验收用例与其对应的架构元素一起纳入分包边界，避免交付范围失配。
- **MUST** 在测试用例已存在时，将其挂载在对应的架构元素下，不得以任务包级别笼统汇总。
- **MUST** 在测试用例尚未存在时，明确标注“测试用例: 可选，当前未提供”。
- **MUST** 按可独立验收、可顺序推进的粒度分包，不要输出过粗或过碎的任务切片。
- **MUST NOT** 输出任何工作流说明、执行步骤、审批流程说明或方法论指导。
- **MUST NOT** 扩写为实现方案、设计分析、代码建议或测试执行说明。

## Output

输出必须使用以下结构：

```md
## WorkPackage 1

- 架构元素:
	- ID: <element-id>
	- 名称: <element-name>
	- 本次交付范围: <scope>
	- 交付类型: <完整交付 | 部分交付>
	- 测试用例:
		- <testcase-id>: <testcase-name>
		- <testcase-id>: <testcase-name>
	  或
	- 测试用例: 可选，当前未提供

## WorkPackage 2

- 架构元素:
	- ID: <element-id>
	- 名称: <element-name>
	- 本次交付范围: <scope>
	- 交付类型: <完整交付 | 部分交付>
	- 测试用例:
		- <testcase-id>: <testcase-name>
		- <testcase-id>: <testcase-name>
	  或
	- 测试用例: 可选，当前未提供
```

如果一个任务包包含多个架构元素，则在同一个 `WorkPackage` 下为每个架构元素重复同样的结构，并分别填写各自的交付范围与测试用例。

如果只有一个任务包，则只输出一个 `WorkPackage` 块；如果有多个任务包，则按 `WorkPackage 1`、`WorkPackage 2`、`WorkPackage 3` 依次编号。
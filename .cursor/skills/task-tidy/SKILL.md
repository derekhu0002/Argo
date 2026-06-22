---
name: task-tidy
description: "Use when business analysis or task breakdown output needs to become actionable intent-architecture work packages with clear acceptance criteria and dependency ordering."
argument-hint: scope
disable-model-invocation: true
---

# Task Tidy

将 Business Partner 的业务分析、任务拆解、依赖顺序和验收标准整理进意图架构，而不是整理成独立 task 文件。

## Rules

- **MUST NOT** create per-task markdown files under `design/tasks/` or any other standalone task-file directory.
- **MUST** use the unified `argo` MCP mutation tools to write task information into `design/KG/SystemArchitecture.json`; do not edit the JSON file directly.
- **MUST** represent each actionable task as an ArchiMate `Work Package` element.
- **MUST** preserve clear acceptance criteria, related requirements/PRD context, scope, and assumptions as attributes or testcases mounted on the relevant `Work Package`.
- **MUST** form explicit dependency relationships between `Work Package` elements when one task depends on another. Choose an ArchiMate-compliant relationship type that matches the dependency meaning, then validate through preview before apply.

## Workflow

1. Extract actionable tasks from the business output. Each task must have a concise name, objective, scope, acceptance criteria, and known dependencies.
2. Call `getSystemArchitecture` to inspect existing `Work Package` elements, relevant parent elements, views, and relationship ids.
3. Plan MCP mutations:
   - add or update `Work Package` elements for tasks;
   - attach task metadata as attributes/testcases;
   - add dependency relationships between work packages;
   - place work packages and dependency relationships into appropriate views, keeping view constraints valid.
4. Call `previewSystemArchitectureMutation` first. Fix any schema, graph, view, or ArchiMate validation errors.
5. Call `applySystemArchitectureMutation` only after preview passes.

## Output

Return a short summary of the updated/created `Work Package` ids, dependency relationships, acceptance criteria locations, and any task information that could not be safely mapped.
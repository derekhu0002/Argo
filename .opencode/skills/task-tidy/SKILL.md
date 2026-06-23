---
name: task-tidy
description: "Use when business analysis or task breakdown output needs to be internalized into the intent architecture across motivation, strategy, business, application, and technology layers."
argument-hint: scope
disable-model-invocation: true
---

# Task Tidy

将 Business Partner 的业务分析、任务拆解、依赖顺序和验收标准内化进意图架构，而不是整理成独立 task 文件或默认整理成 `Work Package` 清单。

## Rules

- **MUST NOT** create per-task markdown files under `design/tasks/` or any other standalone task-file directory.
- **MUST** use the unified `argo` MCP mutation tools to write task information into `design/KG/SystemArchitecture.json`; do not edit the JSON file directly.
- **MUST** refresh the core intent architecture first: Motivation, Strategy, Business, Application, and Technology layers.
- **MUST** model goals, drivers, assessments, decision rationale, principles, requirements, constraints, and outcomes as ArchiMate Motivation elements and relationships.
- **MUST** internalize tasks into core architecture elements and relationships whenever possible, instead of creating task-shaped architecture. Use `Work Package` only for residual delivery coordination that cannot be represented as durable architecture intent.
- **MUST** preserve acceptance criteria, scope, assumptions, and related PRD context as attributes or testcases on the most relevant intent element.
- **MUST** form explicit dependency relationships between refreshed architecture elements when one architectural change depends on another. Choose an ArchiMate-compliant relationship type that matches the dependency meaning, then validate through preview before apply.

## Workflow

1. Extract the architectural intent behind each task: motivation, strategy/business capability impact, application behavior/data impact, technology impact, acceptance criteria, and dependencies.
2. Call `getSystemArchitecture` to inspect existing Motivation, Strategy, Business, Application, Technology elements, relevant views, and relationship ids.
3. Plan MCP mutations:
   - add or update Motivation elements for goals, assessments, decisions, principles, requirements, constraints, and outcomes;
   - add or update Strategy/Business/Application/Technology elements so the task becomes part of the durable architecture;
   - attach acceptance criteria and PRD context as attributes/testcases on the relevant architecture elements;
   - add ArchiMate relationships that explain realization, influence, serving, access, flow, triggering, composition, or other validated dependencies;
   - place elements and relationships into appropriate layered views, keeping view constraints valid.
4. Call `previewSystemArchitectureMutation` first. Fix any schema, graph, view, or ArchiMate validation errors.
5. Call `applySystemArchitectureMutation` only after preview passes.

## Output

Return a short summary of refreshed intent elements by layer, key motivation relationships, dependency relationships, acceptance criteria locations, and any task information that could not be safely internalized.
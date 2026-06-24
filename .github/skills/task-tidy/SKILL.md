---
name: task-tidy
description: "Use when business analysis or architecture dependency analysis output needs to be internalized into the intent architecture across motivation, strategy, business, application, and technology layers."
argument-hint: scope
disable-model-invocation: true
---

# Task Tidy

将 Business Partner 的业务分析、架构依赖分析（横向正交 concern 与纵向前置/后置关系）、验收标准内化进意图架构，而不是整理成独立 task 文件或默认整理成 `Work Package` 清单。交付任务从架构依赖关系中自然派生，本 skill 不单独产出任务清单。

## Rules

- **MUST NOT** create per-task markdown files under `design/tasks/` or any other standalone task-file directory.
- **MUST** use the unified `argo` MCP mutation tools to write into `design/KG/SystemArchitecture.json`; do not edit the JSON file directly.
- **MUST** refresh the core intent architecture first: Motivation, Strategy, Business, Application, and Technology layers.
- **MUST** model goals, drivers, assessments, decision rationale, principles, requirements, constraints, and outcomes as ArchiMate Motivation elements and relationships.
- **MUST** internalize Business Partner conclusions into durable architecture elements and relationships whenever possible, instead of creating task-shaped architecture. Use `Work Package` only for residual delivery coordination that cannot be represented as durable architecture intent.
- **MUST** preserve acceptance criteria, scope, assumptions, and related PRD context as attributes or testcases on the most relevant intent element.
- **MUST** materialize horizontal dependency analysis as orthogonal architecture elements with clear concern boundaries, placed in appropriate layered views.
- **MUST** materialize vertical dependency analysis as explicit ArchiMate relationships between architecture elements, choosing relationship types that match prerequisite, realization, influence, serving, access, flow, triggering, composition, or other validated dependency meanings; validate through preview before apply.

## Workflow

1. Extract architectural intent from Business Partner output: motivation, strategy/business capability impact, application behavior/data impact, technology impact, acceptance criteria, horizontal concern boundaries, and vertical prerequisite/post-requisite dependencies.
2. Call `getSystemArchitecture` to inspect existing Motivation, Strategy, Business, Application, Technology elements, relevant views, and relationship ids.
3. Plan MCP mutations:
   - add or update Motivation elements for goals, assessments, decisions, principles, requirements, constraints, and outcomes;
   - add or update Strategy/Business/Application/Technology elements so each orthogonal concern and its changes become part of the durable architecture;
   - attach acceptance criteria and PRD context as attributes/testcases on the relevant architecture elements;
   - add ArchiMate relationships that express vertical dependency order and cross-concern couplings;
   - place elements and relationships into appropriate layered views, keeping view constraints valid.
4. Call `previewSystemArchitectureMutation` first. Fix any schema, graph, view, or ArchiMate validation errors.
5. Call `applySystemArchitectureMutation` only after preview passes.

## Output

Return a short summary of refreshed intent elements by layer, horizontal concern boundaries, key motivation relationships, vertical dependency relationships, acceptance criteria locations, and any residual delivery coordination that could not be safely internalized as durable architecture intent.

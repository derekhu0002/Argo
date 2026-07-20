---
name: requirements-realization-viewpoint
description: Use when modeling an ArchiMate Requirements Realization Viewpoint, requirements realized by core elements, constraints, capabilities, resources, value streams, or requirement-to-architecture traceability.
---

# Requirements Realization Viewpoint

## Purpose

Use this viewpoint to model how requirements and constraints are realized by core architecture elements and strategy elements.

## Official Framing

- Stakeholders: enterprise architects, ICT architects, business analysts, and requirements managers.
- Concerns: architecture strategy, tactics, and motivation.
- Purpose: designing, deciding, informing.
- Scope: motivation connected to strategy and core elements.

## Modeling Rules

- Prefer `Goal`, `Principle`, `Requirement`, `Constraint`, `Outcome`, `Value`, `Meaning`, `Course of Action`, `Resource`, `Capability`, `Value Stream`, and relevant core elements.
- Use `Realization` from core or strategy elements to requirements when the element satisfies the requirement.
- Use `Aggregation` to refine requirements.
- Use `Influence` for trade-offs or contribution between motivation elements.
- Do not model implementation details unless they are the architecture element that realizes the requirement.

## Output Contract

Return requirements, realizing elements, traceability gaps, conflicts, and acceptance implications for each requirement.

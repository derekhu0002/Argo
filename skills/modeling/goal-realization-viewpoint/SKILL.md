---
name: goal-realization-viewpoint
description: Use when modeling an ArchiMate Goal Realization Viewpoint, goal refinement, sub-goals, principles, requirements, constraints, outcomes, or motivation decomposition.
---

# Goal Realization Viewpoint

## Purpose

Use this viewpoint to refine high-level goals into tangible goals, requirements, constraints, and guiding principles.

## Official Framing

- Stakeholders: stakeholders, business managers, enterprise architects, ICT architects, business analysts, and requirements managers.
- Concerns: architecture mission, strategy, tactics, and motivation.
- Purpose: designing, deciding.
- Scope: motivation.

## Modeling Rules

- Prefer `Goal`, `Principle`, `Requirement`, `Constraint`, and `Outcome`.
- Use `Aggregation` to refine goals into sub-goals.
- Use `Realization` to show requirements or constraints realizing goals.
- Use `Influence` only when a principle or goal positively or negatively affects another motivation element.
- Do not jump directly to implementation elements; use Requirements Realization for that bridge.

## Output Contract

Return the goal tree, derived requirements and constraints, principles, outcome links, and any conflict or incompleteness in goal refinement.

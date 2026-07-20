---
name: motivation-viewpoint
description: Use when modeling an ArchiMate Motivation Viewpoint, broad motivation context, stakeholders, goals, principles, requirements, constraints, value, meaning, drivers, or assessments.
---

# Motivation Viewpoint

## Purpose

Use this viewpoint to model a complete or partial overview of the motivation aspect without narrowing to one motivation sub-problem.

## Official Framing

- Stakeholders: enterprise architects, ICT architects, business analysts, and requirements managers.
- Concerns: architecture strategy, tactics, and motivation.
- Purpose: designing, deciding, informing.
- Scope: motivation.

## Modeling Rules

- Prefer `Stakeholder`, `Driver`, `Assessment`, `Goal`, `Principle`, `Requirement`, `Constraint`, `Outcome`, `Value`, and `Meaning`.
- Use this as a coherence view when motivation elements need to be understood together.
- Use `Influence`, `Realization`, `Aggregation`, and `Association` according to the specific semantic relation.
- Split into Stakeholder, Goal Realization, or Requirements Realization views when the motivation view becomes too broad.
- Do not include core elements unless the concern requires direct motivation-to-architecture context.

## Output Contract

Return the motivation map, relationship rationale, unresolved conflicts, and which specialized motivation view should own follow-up detail.

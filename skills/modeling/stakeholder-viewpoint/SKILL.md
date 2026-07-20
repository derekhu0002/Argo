---
name: stakeholder-viewpoint
description: Use when modeling an ArchiMate Stakeholder Viewpoint, stakeholders, drivers, assessments, initial goals, architecture mission, business motivation, or requirements discovery.
---

# Stakeholder Viewpoint

## Purpose

Use this viewpoint to model stakeholders, internal and external drivers, assessments of those drivers, and initial high-level goals.

## Official Framing

- Stakeholders: stakeholders, business managers, enterprise architects, ICT architects, business analysts, and requirements managers.
- Concerns: architecture mission, strategy, and motivation.
- Purpose: designing, deciding, informing.
- Scope: motivation.

## Modeling Rules

- Prefer `Stakeholder`, `Driver`, `Assessment`, `Goal`, and `Outcome`.
- Use `Association` between stakeholders and their concerns when no stronger relationship fits.
- Use `Influence` from drivers or assessments to goals when motivation is directional.
- Keep requirements out unless they are already derived and needed for traceability.
- Do not include solution components; this view frames why architecture change is needed.

## Output Contract

Return stakeholders, their concerns, drivers, assessments, initial goals or outcomes, and unresolved motivation questions.

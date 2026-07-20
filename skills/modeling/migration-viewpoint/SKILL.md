---
name: migration-viewpoint
description: Use when modeling an ArchiMate Migration Viewpoint, current-to-target transition, plateaus, gaps, migration states, transition planning, or architecture history.
---

# Migration Viewpoint

## Purpose

Use this viewpoint to specify the transition from an existing architecture to a desired target architecture.

## Official Framing

- Stakeholders: enterprise architects, process architects, application architects, infrastructure architects, domain architects, employees, and shareholders.
- Concerns: history of models and transition between architecture states.
- Purpose: designing, deciding, informing.
- Scope: implementation and migration.

## Modeling Rules

- Prefer `Plateau` and `Gap`.
- Use `Association` or `Triggering` to express transition ordering only when supported by the model.
- Use `Composition` to decompose large plateaus or gaps.
- Link to affected core elements only in an implementation and migration view when more detail is needed.
- Do not use this view for project ownership or detailed work packages.

## Output Contract

Return current and target plateaus, gaps between them, transition ordering, and uncertainties that affect migration decisions.

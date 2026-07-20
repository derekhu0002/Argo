---
name: project-viewpoint
description: Use when modeling an ArchiMate Project Viewpoint, architecture change management, work packages, deliverables, implementation events, project portfolio, or change governance.
---

# Project Viewpoint

## Purpose

Use this viewpoint to model the management of architecture change from current state toward a desired target state.

## Official Framing

- Stakeholders: operational managers, enterprise architects, ICT architects, employees, and shareholders.
- Concerns: architecture vision, policies, motivation, governance, project portfolio, deliverables, and change consequences.
- Purpose: deciding, informing.
- Scope: implementation and migration.

## Modeling Rules

- Prefer `Goal`, `Outcome`, `Work Package`, `Implementation Event`, `Deliverable`, `Business Actor`, and `Business Role`.
- Use `Assignment` to show actors or roles responsible for work packages.
- Use `Realization` from work packages to deliverables or outcomes when delivery is explicit.
- Use `Triggering` for project sequencing when one change initiates another.
- Do not model internal task lists; keep to architecture-relevant change scope.

## Output Contract

Return work packages, deliverables, ownership, sequencing assumptions, and governance risks affecting architecture change.

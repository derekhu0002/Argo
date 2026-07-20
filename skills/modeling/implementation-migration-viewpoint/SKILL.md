---
name: implementation-migration-viewpoint
description: Use when modeling an ArchiMate Implementation and Migration Viewpoint, programs or projects related to architecture elements, plateaus, gaps, work packages, deliverables, or dependency consistency.
---

# Implementation and Migration Viewpoint

## Purpose

Use this viewpoint to relate programs and projects to the architecture elements, plateaus, and gaps they implement or affect.

## Official Framing

- Stakeholders: operational managers, enterprise architects, ICT architects, employees, and shareholders.
- Concerns: architecture vision, policies, motivation, portfolio coverage, project overlap, and consistency between project dependencies and architecture dependencies.
- Purpose: deciding, informing.
- Scope: multiple layers, multiple aspects.

## Modeling Rules

- Prefer `Goal`, `Requirement`, `Constraint`, `Work Package`, `Implementation Event`, `Deliverable`, `Plateau`, `Gap`, `Business Actor`, `Business Role`, `Location`, and relevant core elements.
- Use `Realization` from work packages or deliverables to affected architecture elements when the implementation scope is explicit.
- Use `Triggering` for sequencing and `Association` for annotated impact when no stronger relationship fits.
- Annotate relationships when the way an element is affected matters.
- Do not use this as an unconstrained roadmap; every item must trace to architecture impact.

## Output Contract

Return work packages or projects, affected architecture elements, plateaus and gaps, dependency order, overlap risks, and uncovered goals or requirements.

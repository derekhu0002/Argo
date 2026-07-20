---
name: resource-map-viewpoint
description: Use when modeling an ArchiMate Resource Map Viewpoint, enterprise resources, resource hierarchy, resource-to-capability assignment, investment areas, or strategic resource planning.
---

# Resource Map Viewpoint

## Purpose

Use this viewpoint to create a structured overview of enterprise resources and their relationship to capabilities or work packages.

## Official Framing

- Stakeholders: business managers, enterprise architects, and business architects.
- Concerns: architecture strategy, tactics, and motivation.
- Purpose: designing, deciding.
- Scope: strategy.

## Modeling Rules

- Prefer `Resource`, `Capability`, and `Work Package`.
- Use `Composition` or `Aggregation` for resource decomposition.
- Use `Assignment` to show resources assigned to capabilities.
- Use attributes or annotations for scarcity, maturity, cost, risk, or investment need.
- Do not model operational process detail unless it explains resource use.

## Output Contract

Return resource hierarchy, capability assignments, work package relevance where present, and resource risks or investment gaps.

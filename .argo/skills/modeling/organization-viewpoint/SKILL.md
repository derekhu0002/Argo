---
name: organization-viewpoint
description: Use when modeling an ArchiMate Organization Viewpoint, organization structure, roles, authority, competencies, departments, actors, responsibilities, or organizational interfaces.
---

# Organization Viewpoint

## Purpose

Use this viewpoint to model the internal organization of an enterprise, department, network, or other organizational entity.

## Official Framing

- Stakeholders: enterprise architects, process architects, domain architects, managers, employees, shareholders.
- Concerns: competencies, authority, responsibilities, and organizational access points.
- Purpose: designing, deciding, informing.
- Scope: single layer, single aspect.

## Modeling Rules

- Prefer `Business Actor`, `Business Role`, `Business Collaboration`, `Business Interface`, and `Location`.
- Use `Assignment` to show actors assigned to roles or responsibilities.
- Use `Composition` or `Aggregation` for organizational decomposition.
- Use `Serving` only when an organizational interface or role exposes a service.
- Keep behavior details out unless needed to clarify responsibility ownership.

## Output Contract

Return the proposed elements, relationships, target view, and unresolved stakeholder questions. Explain how the view clarifies responsibility or authority.

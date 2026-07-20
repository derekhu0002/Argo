---
name: service-realization-viewpoint
description: Use when modeling an ArchiMate Service Realization Viewpoint, business services realized by processes, outside-in process views, service value, responsibilities, or process-to-service realization.
---

# Service Realization Viewpoint

## Purpose

Use this viewpoint to show how one or more business services are realized by underlying behavior and sometimes application components.

## Official Framing

- Stakeholders: process architects, domain architects, product managers, and operational managers.
- Concerns: added value of business processes, consistency, completeness, and responsibilities.
- Purpose: designing, deciding.
- Scope: multiple layers, multiple aspects.

## Modeling Rules

- Prefer `Business Service`, `Business Process`, `Business Function`, `Business Interaction`, `Business Event`, `Business Actor`, `Business Role`, `Business Collaboration`, `Business Object`, `Representation`, `Application Service`, `Application Component`, and `Data Object`.
- Start outside-in from the exposed `Business Service`.
- Use `Realization` from business behavior to business service.
- Use `Assignment` to connect responsible roles or actors to behavior.
- Use application elements only when they materially support service realization.

## Output Contract

Return the exposed service, realizing behavior, responsible roles, supporting application elements, and service-level acceptance implications.

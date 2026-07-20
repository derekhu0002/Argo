---
name: business-process-cooperation-viewpoint
description: Use when modeling an ArchiMate Business Process Cooperation Viewpoint, process dependencies, process context, responsibilities, shared data, service realization by processes, or business process interactions.
---

# Business Process Cooperation Viewpoint

## Purpose

Use this viewpoint to show relationships between business processes and their environment.

## Official Framing

- Stakeholders: process architects, domain architects, and operational managers.
- Concerns: dependencies between business processes, consistency, completeness, and responsibilities.
- Purpose: designing, deciding.
- Scope: multiple layers, multiple aspects.

## Modeling Rules

- Prefer `Business Actor`, `Business Role`, `Business Collaboration`, `Location`, `Business Interface`, `Business Process`, `Business Function`, `Business Interaction`, `Business Event`, `Business Service`, `Business Object`, `Representation`, `Application Service`, and `Data Object`.
- Use `Triggering` for causal or temporal process dependencies.
- Use `Flow` for transfer between processes.
- Use `Realization` when a process realizes a business service.
- Use `Access` for shared business objects or data.

## Output Contract

Return process dependencies, responsible roles, shared information, realized services, and any coupling that affects operational change.

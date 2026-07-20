---
name: technology-usage-viewpoint
description: Use when modeling an ArchiMate Technology Usage Viewpoint, technology services supporting applications, infrastructure performance, scalability, platform dependencies, or application-to-technology usage.
---

# Technology Usage Viewpoint

## Purpose

Use this viewpoint to show how applications are supported by software and hardware technology.

## Official Framing

- Stakeholders: application architects, infrastructure architects, and operational managers.
- Concerns: dependencies, performance, and scalability.
- Purpose: designing.
- Scope: multiple layers, multiple aspects.

## Modeling Rules

- Prefer `Application Component`, `Application Function`, `Application Process`, `Application Event`, `Data Object`, `Node`, `Device`, `Technology Collaboration`, `System Software`, `Technology Interface`, `Communication Network`, `Path`, `Technology Service`, `Technology Function`, `Technology Process`, `Technology Event`, and `Artifact`.
- Use `Serving` from technology services to application behavior or components.
- Use `Assignment` and `Realization` for deployment and artifact realization when architecture-relevant.
- Use `Access` to expose data or artifact dependencies.
- Do not model business process detail unless it drives performance or scalability requirements.

## Output Contract

Return application-to-technology dependencies, key platform services, performance or scalability concerns, and affected application responsibilities.

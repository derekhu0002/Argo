---
name: application-cooperation-viewpoint
description: Use when modeling an ArchiMate Application Cooperation Viewpoint, application landscape, application component relationships, information flows, service orchestration, or application choreography.
---

# Application Cooperation Viewpoint

## Purpose

Use this viewpoint to describe relationships between application components through information flows or offered and used services.

## Official Framing

- Stakeholders: enterprise architects, process architects, application architects, and domain architects.
- Concerns: application dependencies, service orchestration, consistency, completeness, and complexity reduction.
- Purpose: designing.
- Scope: application layer, multiple aspects.

## Modeling Rules

- Prefer `Location`, `Application Component`, `Application Collaboration`, `Application Interface`, `Application Function`, `Application Interaction`, `Application Process`, `Application Event`, `Application Service`, and `Data Object`.
- Use `Serving` between application services and consumers.
- Use `Flow` for information flow between application behaviors or components.
- Use `Triggering` for orchestration order.
- Use `Access` for shared or transferred data objects.

## Output Contract

Return application participants, services offered and consumed, data or event flows, orchestration dependencies, and complexity risks.

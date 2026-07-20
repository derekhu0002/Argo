---
name: application-structure-viewpoint
description: Use when modeling an ArchiMate Application Structure Viewpoint, application components, interfaces, collaborations, data objects, application modularity, or legacy application structure.
---

# Application Structure Viewpoint

## Purpose

Use this viewpoint to show the structure of one or more applications or components and the data associated with them.

## Official Framing

- Stakeholders: application architects and solution architects.
- Concerns: application structure, consistency, completeness, and complexity reduction.
- Purpose: designing.
- Scope: single layer, multiple aspects.

## Modeling Rules

- Prefer `Application Component`, `Application Interface`, `Application Collaboration`, and `Data Object`.
- Use `Composition` for component decomposition and `Aggregation` for looser groupings.
- Use `Serving` from interfaces or services to consumers only when exposed behavior is relevant.
- Use `Access` from application behavior or components to `Data Object` only when data dependency matters.
- Do not include business motivation or deployment detail unless it is necessary context.

## Output Contract

Return the component boundary, interfaces, key data objects, relationships, and any structural ambiguity that would block implementation design.

---
name: physical-viewpoint
description: Use when modeling an ArchiMate Physical Viewpoint, equipment, facilities, physical environments, distribution networks, materials, or physical-to-IT infrastructure relationships.
---

# Physical Viewpoint

## Purpose

Use this viewpoint to model physical equipment, facilities, distribution networks, materials, and their relationship to IT infrastructure.

## Official Framing

- Stakeholders: infrastructure architects and operational managers.
- Concerns: physical environment dependencies and their relation to IT infrastructure.
- Purpose: designing.
- Scope: multiple layers, multiple aspects.

## Modeling Rules

- Prefer `Location`, `Node`, `Device`, `Equipment`, `Facility`, `Path`, `Communication Network`, `Distribution Network`, and `Material`.
- Use `Assignment` to show equipment installed in facilities or devices deployed to physical contexts.
- Use `Flow` for material, energy, or information transfer when the transfer itself is relevant.
- Use `Realization` when a physical network realizes a logical path.
- Do not model physical details that have no architectural consequence.

## Output Contract

Return physical resources, connectivity or flow, IT infrastructure touchpoints, and operational assumptions or risks.

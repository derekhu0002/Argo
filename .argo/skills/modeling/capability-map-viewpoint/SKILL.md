---
name: capability-map-viewpoint
description: Use when modeling an ArchiMate Capability Map Viewpoint, capability maps, capability hierarchy, investment heat maps, capability coverage, or business capability planning.
---

# Capability Map Viewpoint

## Purpose

Use this viewpoint to create a structured overview of enterprise capabilities, typically two or three levels deep.

## Official Framing

- Stakeholders: business managers, enterprise architects, and business architects.
- Concerns: architecture strategy, tactics, and motivation.
- Purpose: designing, deciding.
- Scope: strategy.

## Modeling Rules

- Prefer `Capability`, `Outcome`, and `Resource`.
- Use `Composition` for capability decomposition when sub-capabilities are integral.
- Use `Aggregation` for looser capability groupings.
- Use attributes or annotations for heat-map dimensions such as maturity, risk, investment, or delivery status.
- Do not include process flow; map what the enterprise can do, not how it does it.

## Output Contract

Return capability hierarchy, outcome coverage, resource dependencies where relevant, and any capability gaps or investment hotspots.

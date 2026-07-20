---
name: strategy-viewpoint
description: Use when modeling an ArchiMate Strategy Viewpoint, enterprise strategy, courses of action, capabilities, value streams, resources, or strategic outcomes.
---

# Strategy Viewpoint

## Purpose

Use this viewpoint to model a high-level strategic overview of enterprise strategies, capabilities, value streams, resources, and intended outcomes.

## Official Framing

- Stakeholders: CxOs, business managers, enterprise architects, and business architects.
- Concerns: strategy development.
- Purpose: designing, deciding.
- Scope: strategy.

## Modeling Rules

- Prefer `Course of Action`, `Capability`, `Value Stream`, `Resource`, and `Outcome`.
- Use `Realization` to show strategies or capabilities creating outcomes.
- Use `Assignment` to connect resources to capabilities when responsibility or enablement is explicit.
- Use `Composition` or `Aggregation` for strategy, capability, or resource decomposition.
- Do not model business process detail unless it is needed to explain strategic execution.

## Output Contract

Return strategic directions, capability and resource implications, outcome links, and decisions the strategy view is meant to support.

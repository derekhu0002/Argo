---
name: value-stream-viewpoint
description: Use when modeling an ArchiMate Value Stream Viewpoint, value streams, value-creating stages, stakeholder value, capabilities supporting value streams, or business value flow.
---

# Value Stream Viewpoint

## Purpose

Use this viewpoint to create a structured overview of value-creating steps and the capabilities that support them.

## Official Framing

- Stakeholders: business managers, enterprise architects, and business architects.
- Concerns: architecture strategy, tactics, and motivation.
- Purpose: designing, deciding.
- Scope: strategy.

## Modeling Rules

- Prefer `Value Stream`, `Capability`, `Outcome`, and `Stakeholder`.
- Use `Composition` to decompose a value stream into stages.
- Use `Assignment` or `Serving` only when capability support or service delivery is explicit.
- Model entry and exit conditions as `Constraint` when needed.
- Do not turn value streams into detailed workflow; keep focus on value creation.

## Output Contract

Return value stream stages, supported outcomes, participating stakeholders, supporting capabilities, and value gaps.

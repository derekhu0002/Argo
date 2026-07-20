---
name: outcome-realization-viewpoint
description: Use when modeling an ArchiMate Outcome Realization Viewpoint, business-oriented results, outcomes produced by capabilities, resources, value streams, value, meaning, or core elements.
---

# Outcome Realization Viewpoint

## Purpose

Use this viewpoint to show how high-level business-oriented results are produced by capabilities, resources, value streams, and underlying core elements.

## Official Framing

- Stakeholders: business managers, enterprise architects, and business architects.
- Concerns: business-oriented results.
- Purpose: designing, deciding.
- Scope: strategy.

## Modeling Rules

- Prefer `Outcome`, `Capability`, `Value Stream`, `Resource`, `Value`, `Meaning`, and relevant core elements.
- Start from the `Outcome` and trace backward to what produces it.
- Use `Realization` to show elements that produce or satisfy outcomes.
- Use `Influence` when one outcome or capability affects another.
- Do not include every implementation detail; include only core elements needed to explain outcome production.

## Output Contract

Return outcomes, producing capabilities or resources, value/meaning rationale, realization gaps, and acceptance indicators for the outcome.

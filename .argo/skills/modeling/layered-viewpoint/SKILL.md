---
name: layered-viewpoint
description: Use when modeling an ArchiMate Layered Viewpoint, architecture overview, cross-layer impact analysis, service layers, business-application-technology alignment, or portfolio overview.
---

# Layered Viewpoint

## Purpose

Use this viewpoint to present several architecture layers and aspects in one overview, especially for impact or consistency analysis.

## Official Framing

- Stakeholders: enterprise, process, application, infrastructure, and domain architects.
- Concerns: consistency, complexity reduction, impact of change, and flexibility.
- Purpose: designing, deciding, informing.
- Scope: multiple layers, multiple aspects.

## Modeling Rules

- All core elements and relationships may appear, but only include what serves the stakeholder concern.
- Use dedicated layers for internal structure and service layers for externally observable behavior.
- Prefer `Realization` from internal behavior to exposed services and `Serving` from services to upper-layer consumers.
- Keep each view small; split into sub-views when the model exceeds a clear cognitive boundary.
- Do not use this as the default dumping ground for all elements.

## Output Contract

Return the layers shown, service exposure chain, cross-layer relationships, and the impact question this view answers.

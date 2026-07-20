---
name: technology-viewpoint
description: Use when modeling an ArchiMate Technology Viewpoint, infrastructure, platforms, devices, nodes, system software, networks, technology services, or operational dependencies.
---

# Technology Viewpoint

## Purpose

Use this viewpoint to model the software and hardware technology elements that support applications and information systems.

## Official Framing

- Stakeholders: infrastructure architects and operational managers.
- Concerns: infrastructure stability, security, dependencies, and cost.
- Purpose: designing.
- Scope: single layer, multiple aspects.

## Modeling Rules

- Prefer `Node`, `Device`, `System Software`, `Technology Interface`, `Communication Network`, `Path`, `Technology Service`, `Technology Function`, `Technology Process`, `Technology Event`, and `Artifact`.
- Use `Serving` for technology services offered to applications or other technology behavior.
- Use `Assignment` for deployment-like allocation to nodes, devices, or system software.
- Use `Flow` or `Path` only for architecture-level transfer or connectivity.
- Do not include application internals unless they consume or constrain technology services.

## Output Contract

Return infrastructure elements, provided technology services, deployment or connectivity relationships, and operational risks relevant to the modeled concern.

---
name: implementation-deployment-viewpoint
description: Use when modeling an ArchiMate Implementation and Deployment Viewpoint, application deployment, artifacts, platform mapping, storage infrastructure, or application-to-infrastructure realization.
---

# Implementation and Deployment Viewpoint

## Purpose

Use this viewpoint to show how applications are realized on infrastructure, including artifacts and storage or platform mappings.

## Official Framing

- Stakeholders: application architects and domain architects.
- Concerns: structure of application platforms and their relationship to supporting technology.
- Purpose: designing, deciding.
- Scope: multiple layers, multiple aspects.

## Modeling Rules

- Prefer `Application Component`, `Application Interface`, `Application Function`, `Application Process`, `Application Event`, `Application Service`, `Data Object`, `System Software`, `Technology Interface`, `Path`, `Technology Function`, `Technology Process`, `Technology Service`, and `Artifact`.
- Use `Realization` from `Artifact` to `Application Component` or `Data Object` where appropriate.
- Use `Assignment` for deployment of artifacts to system software or nodes when present.
- Use `Serving` for platform or technology services used by applications.
- Do not include project planning elements; use Implementation and Migration viewpoints for change planning.

## Output Contract

Return deployable artifacts, application mappings, platform services, storage or infrastructure dependencies, and deployment risks.

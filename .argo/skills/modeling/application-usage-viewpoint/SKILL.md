---
name: application-usage-viewpoint
description: Use when modeling an ArchiMate Application Usage Viewpoint, applications supporting business processes, application services used by business behavior, or business-application dependencies.
---

# Application Usage Viewpoint

## Purpose

Use this viewpoint to describe how applications support business processes and how applications use each other.

## Official Framing

- Stakeholders: enterprise architects, process architects, application architects, and operational managers.
- Concerns: consistency, completeness, complexity reduction, and process dependency on applications.
- Purpose: designing, deciding.
- Scope: multiple layers, multiple aspects.

## Modeling Rules

- Prefer `Business Actor`, `Business Role`, `Business Process`, `Business Function`, `Business Event`, `Business Object`, `Application Component`, `Application Interface`, `Application Service`, `Application Function`, `Application Process`, `Application Event`, and `Data Object`.
- Use `Serving` from `Application Service` to business behavior or roles.
- Use `Access` for application or business behavior acting on data.
- Use `Realization` only when application behavior realizes business behavior.
- Do not model infrastructure unless it affects application usage by the business.

## Output Contract

Return supported business behavior, consumed application services, application dependencies, and operational impact if an application changes or fails.

---
name: information-structure-viewpoint
description: Use when modeling an ArchiMate Information Structure Viewpoint, business objects, representations, data objects, artifacts, meanings, information dependencies, or data mappings.
---

# Information Structure Viewpoint

## Purpose

Use this viewpoint to model the structure of information used by the enterprise, a business process, or an application.

## Official Framing

- Stakeholders: domain architects and information architects.
- Concerns: data and information structure, dependencies, consistency, and completeness.
- Purpose: designing.
- Scope: multiple layers, single aspect.

## Modeling Rules

- Prefer `Business Object`, `Representation`, `Data Object`, `Artifact`, and `Meaning`.
- Use `Realization` to map logical information to application or technology representations.
- Use `Access` to show behavior observing or modifying information.
- Use `Association` only when the semantic dependency is known but no stronger relationship fits.
- Do not model database internals unless they matter to architecture-level information meaning or dependency.

## Output Contract

Return the information concepts, representation chain, access relationships, and open questions about ownership, meaning, or lifecycle.

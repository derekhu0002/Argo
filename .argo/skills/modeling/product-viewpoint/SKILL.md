---
name: product-viewpoint
description: Use when modeling an ArchiMate Product Viewpoint, products, customer value, contracts, product composition, channels, services, or product development decisions.
---

# Product Viewpoint

## Purpose

Use this viewpoint to depict the value products offer and their composition in terms of services, contracts, channels, and related objects.

## Official Framing

- Stakeholders: product developers, product managers, process architects, and domain architects.
- Concerns: product development and value offered by enterprise products.
- Purpose: designing, deciding.
- Scope: multiple layers, multiple aspects.

## Modeling Rules

- Prefer `Product`, `Contract`, `Value`, `Business Service`, `Business Interface`, `Business Object`, `Application Service`, `Technology Service`, `Data Object`, `Artifact`, and `Material`.
- Use `Aggregation` or `Composition` to show product composition.
- Use `Serving` to show services offered to customers or channels.
- Use `Association` for contracts or agreements tied to the product.
- Do not model internal process or component detail unless it explains product value or obligation.

## Output Contract

Return product scope, offered value, constituent services or objects, contract obligations, and acceptance implications for customers or external parties.

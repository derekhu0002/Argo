# Viewpoint-First Intent Architecture Modeling

Any agent that creates, changes, audits, or proposes changes to the intent architecture in `design/KG/SystemArchitecture.json` MUST start from one or more Architecture Viewpoints.

## Required Modeling Frame

Before modeling elements, relationships, views, or acceptance testcases, state:

- The selected Architecture Viewpoint.
- The stakeholder concern it addresses.
- The modeling purpose: designing, deciding, informing, auditing, or handoff preparation.
- Why each affected Architecture View belongs under that viewpoint.

Every Architecture View is an instantiation of exactly one Architecture Viewpoint. A View is not a free-standing canvas.

## View Binding

Every new or modified Architecture View MUST explicitly say which Architecture Viewpoint it instantiates. Preserve the binding in the view `description` and, when schema permits, in approved metadata or attributes.

Use this description pattern:

`Viewpoint: <ViewpointName>; Concern: <stakeholder concern>; Purpose: <purpose>; Scope: <scope>; Rationale: <why this view is an instance of this viewpoint>.`

If an existing view lacks a viewpoint binding, any agent touching that view must repair the binding before handoff or report it as an audit finding.

## Selecting Viewpoints

Prefer ArchiMate 3.2 Appendix C example viewpoints as starting points. They are examples, not an exhaustive or mandatory set, so project-specific viewpoints are allowed only when the stakeholder concern cannot be expressed by an existing example.

Common ArchiMate 3.2 example viewpoints include:

- Basic: Organization, Application Structure, Information Structure, Technology, Layered, Physical, Product, Application Usage, Technology Usage, Business Process Cooperation, Application Cooperation, Service Realization, Implementation and Deployment.
- Motivation: Stakeholder, Goal Realization, Requirements Realization, Motivation.
- Strategy: Strategy, Capability Map, Value Stream, Outcome Realization, Resource Map.
- Implementation and Migration: Project, Migration, Implementation and Migration.

If no suitable viewpoint exists in the model, define or request the Architecture Viewpoint first. Existing baseline viewpoint Grouping elements may be used as repository-local viewpoint anchors.

## Viewpoint Modeling Skills

After selecting a viewpoint, check `.argo/skills/modeling/` for the matching viewpoint skill and use its `SKILL.md` as the detailed modeling guide when it exists. Skill directories use normalized lowercase hyphen names, for example:

- `Outcome Realization Viewpoint` -> `.argo/skills/modeling/outcome-realization-viewpoint/SKILL.md`
- `Capability Map Viewpoint` -> `.argo/skills/modeling/capability-map-viewpoint/SKILL.md`
- `Migration Viewpoint` -> `.argo/skills/modeling/migration-viewpoint/SKILL.md`

If the selected viewpoint has no matching modeling skill, continue from this rule and the ArchiMate 3.2 viewpoint definition, and record the absence only when it affects modeling confidence.

## Mutation And Audit Rules

- Do not add or update view content without an explicit viewpoint binding.
- Do not mix multiple viewpoint purposes in one view; split the view or choose a more precise viewpoint.
- When the schema or MCP mutation shape cannot encode viewpoint-to-view binding directly, preserve it through approved view metadata, attributes, naming, mutation rationale, and the required description pattern.
- For audit or repair work, treat missing viewpoint binding as an incomplete graph change.
- For handoff work, include the selected viewpoint and view binding rationale in the handoff or coverage evidence when affected views are in scope.

Example:

- Good: use `Outcome Realization Viewpoint`; create or update a capability delivery view as its instance; include outcomes, capabilities, value streams, resources, values, meanings, and relevant core elements according to that viewpoint.
- Bad: create a generic current-state view and add related elements only because they seem to fit together.

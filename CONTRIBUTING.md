# Contributing

This is the root contributor/governance entrypoint for internal maintainers who are preparing to change MCP behavior, validators, tests, or documentation. Use it as the first routing page before editing.

## fact-source priority

1. `design/KG/SystemArchitecture.json` is the intent fact source. Coding work reads it for context and must not change it directly.
2. `.argo/temp/ImplementationToCodingHandoff.json` defines the current Coding/Repair scope, explicit testcase entrypoints, critical non-explicit tests, frozen files, and approved target paths.
3. `tests/ARCHITECTURE.md` defines test ownership, explicit testcase boundaries, critical guardrails, and frozen-file policy.
4. `package.json` is the runnable script authority for validation commands and architecture test commands.
5. Stable design references carry deep details. Link to them instead of copying their specifications inline.

## safe change surfaces

Start from the handoff and edit only the approved Coding target paths. For this WP3 contributor entrypoint, the safe change surface is this root `CONTRIBUTING.md` file only.

When work involves MCP, validator, test, or documentation behavior, route maintainers to the owning references:

- [Design documentation map](design/README.md)
- [Argo harness guide](design/argo-harness/README.md)
- [Intent architecture MCP feature list](design/mcp/意图架构 MCP 功能列表.md)
- [Intent architecture MCP validation](design/validator/intent-architecture-mcp-validation.md)
- [Test architecture contract](tests/ARCHITECTURE.md)
- [Package scripts](package.json)

## stage boundaries

IntentDesign owns intent graph changes and intent decisions. ImplementationDesign owns implementation contracts, testcase entrypoint definitions, guardrail classification, and handoff artifacts. CodingAndReparing owns only the approved Coding targets and repairs real repository behavior against the handoff.

If Coding discovers that the intent graph or implementation contract must change, stop and raise that as a stage gap for the owning stage. Do not patch higher-stage artifacts from Coding.

## validation commands

Use the commands declared in `package.json`:

```bash
npm run validate:system-architecture
npm run validate:handoff
npm run validate:handoff:implementation
npm run test:argo
```

For DOC-02 contributor governance, run the explicit testcase anchor and the WP3 guard:

```bash
ARGO_TESTCASE_ANCHOR=doc-02-contributor-governance-router node tests/explicit/entries/runDocumentationInformationArchitectureDecision.js
node tests/architecture/documentation/contributor-governance-entrypoint.guard.js
```

## explicit testcase and frozen files

Explicit testcase entrypoints are read-only during Coding unless the current handoff explicitly names them as editable targets. Critical non-explicit guardrails are also frozen acceptance assets, not implementation shortcuts.

For this WP3 scope, these frozen files are especially relevant:

- `tests/explicit/entries/runDocumentationInformationArchitectureDecision.js`
- `tests/architecture/documentation/contributor-governance-entrypoint.guard.js`
- `tests/ARCHITECTURE.md`
- `design/KG/SystemArchitecture.json`
- `.argo/temp/ImplementationToCodingHandoff.json`
- `package.json`
- stable design reference files linked above

## documentation maintenance

Keep root documentation concise. The root README remains the adoption and product router; this file governs contributor change behavior; `design/` owns stable architecture and process references; `tests/ARCHITECTURE.md` owns test contracts.

When documentation changes are needed, place stable facts once in the owning reference and link to that authority. Do not duplicate MCP, validator, harness, or lifecycle details in root-level files.

## forbidden shortcuts

Do not edit frozen explicit tests or guardrails to pass Coding work. Do not widen Coding scope beyond the handoff target paths. Do not manually set runner-owned `deliveryStatus` or fabricate failure records. Do not invent an absent root-level architecture contract as WP3 authority. Do not bypass `package.json` validation commands, hide behavior behind test-only branches, or copy deep design specs inline to satisfy string checks.

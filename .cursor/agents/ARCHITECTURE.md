# Cursor Agent Governance Contract

This local contract refines `OVERALL_ARCHITECTURE.md`.

This contract owns the Cursor agent portion of Governed Automatic Work Delegation.

## Responsibilities

- `.cursor/agents/Orchestrator.md` owns cross-stage routing, stage commit checks, handoff validation, approval forwarding, audit routing, delivery-status governance, and final workflow closure. It must not manage child-level stage-internal work.
- `.cursor/agents/IntentionDesign.md` owns intent-stage automatic delegation guidance for read-only dependency branches, concern mapping candidates, coverage checks, and drift evidence while preserving exactly one Viewpoint-governed canonical graph writer.
- `.cursor/agents/ImplementationDesign.md` owns implementation-stage automatic delegation guidance for disjoint local stable-element contract and testcase-entrypoint work while preserving one owner for the root contract, shared interfaces, dependency direction, frozen files, and ImplementationToCoding handoff.
- `.cursor/agents/CodingAndReparing.md` owns coding-stage automatic delegation guidance for same-frontier repair tasks with disjoint authorized write sets while preserving shared-write serialization, integration, full validation, delivery regression comparison, and final delivery judgment.
- Agent specifications record governance behavior only. They do not import test code, execute production code, or weaken existing approval, handoff, audit, commit, or delivery gates.
- AUTODEL assertions must reject contradictory gate-bypass or weakening language, not merely accept positive phrases. Contradictions include skipping or bypassing human approval, handoff validation, audits, stage commits, delivery-status governance, or full-runner evidence.
- DT-10 requires one graph writer with Viewpoint binding, same-view endpoints, ArchiMate-valid relationship semantics, preview, apply, and validation controls. DT-15 requires validated bounded stage summaries, no raw child evidence, no child-level Orchestrator management, and no stage bypass.

## Local Dependencies

- Cursor agent specifications may reference `OVERALL_ARCHITECTURE.md`, `.argo/temp/ImplementationToCodingHandoff.json`, `tests/ARCHITECTURE.md`, and stage-owned handoff/failure records as governance data.
- Cursor agent specifications must not depend on explicit entrypoint implementation details or test Harness code.
- Stage-owned automatic delegation rules depend inward on the existing stage completion gates; they do not replace them.

## Owned Tests

- `tests/explicit/entries/runAutomaticDelegationGovernance.js` observes Cursor agent behavior proxies through `tests/harness/automaticDelegationGovernanceHarness.js`.
- `tests/architecture/automatic-delegation-governance/architecture-boundary.guard.js` protects the Agent Delegation Governance Boundary and authorized Coding targets.
- `tests/architecture/automatic-delegation-governance/dependency-direction.guard.js` protects dependency direction between agent governance text, frozen tests, contracts, and the intent graph.
- `tests/architecture/automatic-delegation-governance/explicit-entrypoint-correctness.guard.js` protects the AUTODEL entrypoint anchors and Harness-owned business assertions.
- `tests/architecture/automatic-delegation-governance/implementation-traceability.guard.js` protects graph-to-entrypoint and handoff traceability for AUTODEL-DT-00 through AUTODEL-DT-15.

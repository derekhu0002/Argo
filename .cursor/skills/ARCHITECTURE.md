# Cursor Stage Skill Governance Contract

This local contract refines `OVERALL_ARCHITECTURE.md`.

This contract owns the Cursor stage-skill portion of Governed Automatic Work Delegation.

## Responsibilities

- `.cursor/skills/business-partner/SKILL.md` owns BusinessPartner automatic delegation guidance for hypothesis verification, local repository evidence, internet evidence, authority weighting, and bounded business recommendations while preserving final business acceptance.
- `.cursor/skills/fast-orchestrating/SKILL.md` owns Orchestrator helper guidance for stage dispatch only; it must preserve stage-owned internal delegation and existing approval, handoff, audit, commit, and delivery gates.
- Stage skills may express trigger, depth, concurrency, return-contract, and failure-disposition rules only as agent governance instructions.

## Local Dependencies

- Stage skills may reference agent contracts and accepted intent anchors as governance data.
- Stage skills must not require test Harness code, explicit entrypoint files, or runtime telemetry to make delegation decisions.
- Proxy-first acceptance is authoritative until trustworthy context-window telemetry exists; no skill may claim a token-reduction percentage.

## Owned Tests

- `tests/explicit/entries/runAutomaticDelegationGovernance.js` covers stage-skill behavior proxies for BusinessPartner and Orchestrator.
- `tests/architecture/automatic-delegation-governance/architecture-boundary.guard.js` and `tests/architecture/automatic-delegation-governance/dependency-direction.guard.js` freeze the allowed skill edit set for CodingAndReparing.

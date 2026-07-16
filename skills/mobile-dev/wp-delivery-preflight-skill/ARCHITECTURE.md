# Delivery Preflight Skill Contract

## Responsibility

This directory owns the public non-interactive delivery entry for the delivery preflight orchestration boundary and its single sibling delegated implementation service.

## Owned Boundary

- `run.js` is the only public runtime entrypoint in this directory.
- `delivery-preflight-orchestration-service.js` is the only delegated implementation service in this directory.
- `SKILL.md` is the canonical GitHub Copilot skill definition for this boundary.
- `work/skills/wp-delivery-preflight-skill/SKILL.md` remains only a packaging compatibility pointer.
- The entry accepts one Harmony workspace, one named journey step, one Android target, and one Harmony target per invocation.
- The entry delegates orchestration, evidence reference assembly, and deterministic readiness summary generation to the sibling delegated service.

## Control Point And Observation Point

- Control point: invoke `node .github/skills/wp-delivery-preflight-skill/run.js` with the required single-preflight inputs.
- Observation point: observe one readiness summary location that reports Harmony build/run status, paired screenshot references, comparison output, and archived evidence references for that same invocation.

## Dependency Direction

- Public callers and acceptance assets must invoke this `.github` runtime entry directly.
- `run.js` may require only `./delivery-preflight-orchestration-service.js` for delegated runtime behavior.
- The sibling delegated service may invoke `.github/skills/wp-harmony-build-package-run-skill/run.js` and `.github/skills/wp-ui-snapshot-comparison-skill/run.js` as black-box public delivery boundaries.
- This boundary must not absorb Harmony build/package/run logic or UI capture/compare logic.
- This boundary must not fan out across multiple journey steps or multiple target pairs in one invocation.
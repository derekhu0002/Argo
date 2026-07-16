# UI Snapshot Comparison Skill Contract

## Responsibility

This directory owns the public non-interactive delivery entry for the UI snapshot comparison boundary and the single sibling delegated implementation service that supports it.

## Owned Boundary

- `run.js` is the only public runtime entrypoint in this directory.
- `ui-snapshot-comparison-service.js` is the only delegated implementation service in this directory.
- `SKILL.md` is the canonical GitHub Copilot skill definition for this boundary.
- `work/skills/wp-ui-snapshot-comparison-skill/SKILL.md` remains only a packaging compatibility pointer.
- The entry accepts one named journey step per invocation and references prepared Android and HarmonyOS emulator targets.
- For this slice, input normalization remains owned by `run.js`, while capture, pairing, evidence persistence, and deterministic comparison logic move into the sibling delegated service.

## Control Point And Observation Point

- Control point: invoke `node .github/skills/wp-ui-snapshot-comparison-skill/run.js` with the required single-step comparison inputs.
- Observation point: observe one comparison summary location, one evidence directory, and one deterministic machine-readable comparison result for that same invocation.

## Dependency Direction

- Public callers and acceptance assets must invoke this `.github` runtime entry directly.
- `run.js` may require only `./ui-snapshot-comparison-service.js` for delegated runtime behavior.
- This boundary must not trigger Harmony build/package/run automation or delivery preflight orchestration.
- This boundary must not loop across multiple journey steps in one invocation.
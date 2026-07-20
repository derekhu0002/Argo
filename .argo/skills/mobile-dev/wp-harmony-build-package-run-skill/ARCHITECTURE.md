# Harmony Build Package Run Skill Contract

## Responsibility

This directory owns the public non-interactive delivery entry for the Harmony build/package/run boundary and the colocated delegated implementation service that it alone exposes.

## Owned Boundary

- `run.js` is the only public runtime entrypoint in this directory.
- `harmony-build-package-launch-service.js` is the only delegated implementation service in this directory.
- `SKILL.md` is the canonical GitHub Copilot skill definition for this boundary.
- `work/skills/wp-harmony-build-package-run-skill/SKILL.md` remains only a packaging compatibility pointer.
- The runtime entry delegates compile, build, package, install, and launch behavior to the sibling service without changing its existing observable contract.

## Control Point And Observation Point

- Control point: invoke `node .github/skills/wp-harmony-build-package-run-skill/run.js` against one prepared HarmonyOS workspace.
- Observation point: observe one machine-readable build/package/run result and emitted artifacts under `work/artifacts/harmony-build-package-run/` for that invocation.

## Dependency Direction

- Public callers and acceptance assets must invoke this `.github` runtime entry directly.
- `run.js` may require only `./harmony-build-package-launch-service.js` for delegated runtime behavior.
- The sibling delegated service must not absorb UI snapshot comparison or delivery preflight orchestration behavior.
- The service contract observed by `AT-ENV-02S` and `AT-ENV-02D` stays local to this directory after relocation.
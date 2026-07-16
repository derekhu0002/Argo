---
name: wp-harmony-build-package-run-skill
description: use the Harmony build/package/run delivery boundary when you need to compile, package, install, and launch one prepared HarmonyOS workspace through the existing public skill entry
disable-model-invocation: true
---

# Harmony Build Package Run Skill

Use this skill when the task needs the existing delivery boundary that compiles, packages, installs, and launches one prepared HarmonyOS workspace.

## Runtime Boundary

- Public entrypoint: `.github/skills/wp-harmony-build-package-run-skill/run.js`
- Artifact root: `work/artifacts/harmony-build-package-run/`
- Compatibility pointer: `work/skills/wp-harmony-build-package-run-skill/SKILL.md`

## Invocation Surface

- Optional input: `--workspace <path>`
- Environment fallback: `HARMONY_APP_WORKSPACE`
- Default workspace when neither input is provided: `D:/Projects/ANDROID-2-HARMONYOS/work`
- Emitted output labels: `summary` and `artifacts`

## Instructions

1. Invoke only the existing public runtime entrypoint; do not reimplement build, package, install, or launch steps inside a separate script.
2. Pass one prepared HarmonyOS workspace per invocation.
3. Treat the emitted `summary` and `artifacts` outputs under `work/artifacts/harmony-build-package-run/` as the observation boundary.
4. If a task needs screenshot comparison or readiness aggregation, delegate to the dedicated UI comparison or delivery preflight skill instead of extending this boundary.
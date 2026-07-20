---
name: wp-ui-snapshot-comparison-skill
description: use the UI snapshot comparison delivery boundary when you need one deterministic Android and HarmonyOS screenshot capture, pairing, and comparison invocation
disable-model-invocation: true
---

# UI Snapshot Comparison Skill

Use this skill when the task needs one deterministic screenshot comparison between prepared Android and HarmonyOS targets for a single named journey step.

## Runtime Boundary

- Public entrypoint: `.github/skills/wp-ui-snapshot-comparison-skill/run.js`
- Artifact root: `work/artifacts/ui-snapshot-comparison/`
- Compatibility pointer: `work/skills/wp-ui-snapshot-comparison-skill/SKILL.md`

## Invocation Surface

- Required inputs: `--journey-step <name>`, `--android-target <adb-target>`, and `--harmony-target <hdc-target>`
- Environment fallbacks: `UI_COMPARISON_JOURNEY_STEP`, `UI_COMPARISON_ANDROID_TARGET`, and `UI_COMPARISON_HARMONY_TARGET`
- Emitted output labels: `summary`, `artifacts`, `evidence`, and `comparison`

## Instructions

1. Invoke only the existing public runtime entrypoint; do not duplicate capture or comparison logic in ad hoc scripts.
2. Pass exactly one named journey step plus prepared Android and HarmonyOS targets per invocation.
3. Read the emitted `summary`, `evidence`, and `comparison` outputs as the observation boundary for success, failure, or environment blockers.
4. If a task needs build/package/run automation first, consume the Harmony build/package/run boundary separately or use the delivery preflight skill that already composes both boundaries.
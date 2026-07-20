---
name: wp-delivery-preflight-skill
description: use the delivery preflight boundary when you need one readiness invocation that composes Harmony build/package/run and UI snapshot comparison evidence for a candidate deliverable
disable-model-invocation: true
---

# Delivery Preflight Skill

Use this skill when the task needs one readiness-oriented invocation that composes the existing Harmony build/package/run boundary with the UI snapshot comparison boundary for a candidate Harmony deliverable.

## Runtime Boundary

- Public entrypoint: `.github/skills/wp-delivery-preflight-skill/run.js`
- Artifact root: `work/artifacts/delivery-preflight/`
- Compatibility pointer: `work/skills/wp-delivery-preflight-skill/SKILL.md`

## Invocation Surface

- Required inputs: `--journey-step <name>`, `--android-target <adb-target>`, and `--harmony-target <hdc-target>`
- Optional input: `--workspace <path>`
- Environment fallbacks: `HARMONY_APP_WORKSPACE`, `UI_COMPARISON_JOURNEY_STEP`, `UI_COMPARISON_ANDROID_TARGET`, and `UI_COMPARISON_HARMONY_TARGET`
- Default workspace when `--workspace` and `HARMONY_APP_WORKSPACE` are absent: `D:/Projects/ANDROID-2-HARMONYOS/work`
- Emitted output labels: `summary`, `artifacts`, and `evidence`

## Instructions

1. Invoke only the existing public runtime entrypoint; do not inline build/package/run or screenshot-comparison logic into a new script.
2. Pass one candidate Harmony workspace, one named journey step, one Android target, and one Harmony target per invocation.
3. Treat the emitted `summary`, `artifacts`, and `evidence` outputs as the observation boundary for readiness and archived evidence references.
4. If the task needs only one upstream capability, call the narrower Harmony build/package/run or UI snapshot comparison skill instead of the aggregated preflight boundary.
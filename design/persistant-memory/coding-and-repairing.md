# CodingAndReparing Persistent Memory

## 2026-08-04 View15 active authority wording

- Event: ImplementationToCoding handoff repair for `view15-active-authority-requirement` / Current Fifteen Wording With Historical Truth.
- Failure: `VIEW15_CONSISTENCY_ACTIVE_SEVEN_AUTHORITY` in `design/mcp/意图架构 MCP 功能列表.md` (`must contain at most 7 elements` / `at most 7 elements`).
- Production change: active MCP guide quick-reference and mutation guidance keywords updated to Fifteen/15 (`每 view ≤ 15 个元素`, `must contain at most 15 elements`); validation checklist row aligned to 最多 15.
- Preserved: `.argo/temp/view15-active-authority-expected-failures.json` immutable (hash unchanged vs baseline `a7ac62f`); historical seven-element records untouched; frozen entrypoints/guards/contracts untouched except runner-owned `deliveryStatus` refresh in `SystemArchitecture.json`.
- Runner evidence: focused VIEW15-CONSISTENCY + four view-capacity-policy guards pass; full suite 66/68; `view15-active-authority-requirement` not_delivered → delivered; no delivered→not_delivered regression vs `a7ac62f`.
- Out-of-scope remaining failures: `TS-07`, `SP-03-DefaultVectorRetrieval`.

## 2026-08-04 View15 capacity policy delivery

- Event: ImplementationToCoding handoff repair for View15 WorkPackage.
- Repair order: C1 shared validator (`graph-semantics.js`) → C2 mutation guidance (`systemarchitecture-mcp-server.js`) → C3 active-authority alignment (validator doc + legacy MCP expectations).
- Production change: `validateViewElementLimits` now enforces one global hard maximum of 15 `included_elements`; relationships remain outside quota; touched-view prospective checking preserved (no automatic membership recomposition).
- Active authority surfaces updated to 15; historical seven-element decision-tree evidence left unchanged.
- Out-of-scope remaining failures observed after full runner: `TS-07`, `W3-1-MutationEmbeddingVectorE2E`, `SP-03-DefaultVectorRetrieval`. Pre-existing legacy MCP suite failure in `appliesExistingRelationshipToAdditionalView` is unrelated to View15 capacity assertions.

## 2026-08-04 View15 actual write diagnostics

- Event: Approved ImplementationToCoding handoff repair for Fail-Closed Capacity Enforcement Across Growth Paths (`VIEW15-ID-VERIFY`).
- Failure pattern: preview/dry-run exposed `must contain at most 15 elements` / `found 16`, but actual rejected writes returned compact `{status, written}` and omitted `errors`.
- Production change: `compactMutationResponse` in `.argo/scripts/systemarchitecture-mcp-server.js` preserves `errors` and `guidance` when `status === 'failed'`; successful writes remain compact (`status`, `written`, optional `embeddingLifecycle.state`).
- Preserved: `written=false`, non-persistence, exact-15 acceptance, frozen entrypoints/guards.
- Runner evidence: handoff View15 explicit + four guards pass; full suite 65/68; `view15-global-limit-principle` and `view15-enforcement-completeness-requirement` not_delivered → delivered; no delivered→not_delivered regression vs baseline `88d0542`.
- Out-of-scope remaining failures: `TS-07`, `W3-1-MutationEmbeddingVectorE2E`, `SP-03-DefaultVectorRetrieval`.

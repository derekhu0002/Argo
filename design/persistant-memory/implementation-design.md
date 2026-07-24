# Implementation Design Memory

## 2026-07-24 compatible query boundary

- Accepted stable decomposition: unified MCP gateway delegates to a deep intent-query runtime module; canonical JSON remains authoritative; tests depend inward through a business-readable Harness.
- Public contract: `getSystemArchitecture` keeps its no-argument complete canonical response and accepts an optional nested `query` with explicit `purpose`, `intent`, and audit `subject`.
- Physicalized four shared explicit entrypoints for eight mounted testcases covering DT-01, DT-02, DT-03, and DT-12.
- Initial execution: DT-01 compatibility and DT-02 canonical snapshot passed; DT-03 failed with `DT03_PURPOSE_NOT_PRESERVED`; DT-12 failed with `DT12_GRAPH_TIDY_MODE_FAILURE`.
- Four critical guardrails passed: architecture boundary, dependency direction, explicit entrypoint correctness, and key implementation traceability.
- IntentionDesign correction commits `f59c383db8a935721be54d67044ce05aea56e3bc` and `33798f749fa43aebb227e09999a7ed61733b394b` mapped all 24 mounted testcases to executable paths without changing semantics.
- Physicalized the remaining 14 unique out-of-scope paths as frozen design evidence because implementation handoff validation globally requires every mounted path to exist.
- Refreshed design-test baseline: 24 total, 5 passed, 19 expected failures, 0 invalid criteria, and 0 missing paths. DT-01/02 remain green; DT-03/12 remain the only failures targeted by this compatible-query handoff.
- The other 16 failures are explicitly out of scope and remain frozen evidence for later implementation slices; Coding/Repair must not broaden this handoff to address them.

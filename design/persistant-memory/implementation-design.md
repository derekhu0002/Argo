# Implementation Design Memory

## 2026-07-24 compatible query boundary

- Accepted stable decomposition: unified MCP gateway delegates to a deep intent-query runtime module; canonical JSON remains authoritative; tests depend inward through a business-readable Harness.
- Public contract: `getSystemArchitecture` keeps its no-argument complete canonical response and accepts an optional nested `query` with explicit `purpose`, `intent`, and audit `subject`.
- Physicalized four shared explicit entrypoints for eight mounted testcases covering DT-01, DT-02, DT-03, and DT-12.
- DT-01 freezes the exact `{ status, graphPath, document }` envelope and absence of query metadata.
- The shared Harness is frozen in the coding handoff, and the explicit-entrypoint correctness guard protects its assertions and probe implementation.
- Second audit correction replaces response-derived retrieval telemetry with a frozen Harness-owned injected spy. Positive-control semantic requests prove probe wiring; DT-03 invalid requests and DT-12 graph-tidy must not increment that independent boundary count.
- DT-03 now freezes the full validation matrix and stable categories: `QUERY_PURPOSE_REQUIRED`, `QUERY_PURPOSE_INVALID`, `QUERY_INTENT_REQUIRED`, and `AUDIT_SUBJECT_REQUIRED`, while preserving all five legal purposes.
- Four critical guardrails passed: architecture boundary, dependency direction, explicit entrypoint correctness, and key implementation traceability.
- IntentionDesign correction commits `f59c383db8a935721be54d67044ce05aea56e3bc` and `33798f749fa43aebb227e09999a7ed61733b394b` mapped all 24 mounted testcases to executable paths without changing semantics.
- Physicalized the remaining 14 unique out-of-scope paths as frozen design evidence because implementation handoff validation globally requires every mounted path to exist.
- Refreshed design-test baseline: 24 total, 5 passed, 19 expected failures, 0 invalid criteria, and 0 missing paths. DT-01/02 remain green; DT-03/12 remain the only failures targeted by this compatible-query handoff.
- The other 16 failures are explicitly out of scope and remain frozen evidence for later implementation slices; Coding/Repair must not broaden this handoff to address them.

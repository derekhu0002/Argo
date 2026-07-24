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

## 2026-07-25 production Graph RAG W2 boundary

- Accepted stable decomposition: `.argo/scripts/graph-rag/` owns one Node.js production composition boundary with inward external-configuration, embedding-qualification, Neo4j-native retrieval, and canonical-projection-authority modules.
- Approved intent mappings are direct: TS-01 → `grag-production-runtime`, TS-01-Native → `grag-native-retrieval-service`, TS-06 → `grag-embedding-qualification`, TS-07 → `grag-credential-boundary`, and canonical snapshot/authority → `grag-canonical-graph`.
- Physicalized six approved executable paths: five new expected-failure entrypoints plus the already-passing canonical full-snapshot entrypoint. All use business-readable Harness abstractions and freeze missing qualification, missing configuration, implicit defaults, and projection conflict as release-blocking behavior.
- Physicalized TS-08 and TS-09 as frozen expected-failure evidence only because global handoff validation requires every mounted acceptance path to exist. They are not Coding targets in this handoff.
- Added four production Graph RAG critical guards for architecture boundary, dependency direction, explicit entrypoint correctness, and key implementation traceability; all pass before Coding.
- Existing code reality risk: `.argo/scripts/neo4j-system-architecture-store.js` contains hardcoded Neo4j URI/username/password defaults. Coding must remove these through the external configuration boundary; Implementation Design does not edit production behavior.
- No intent mismatch was found, so no `ImplementationToIntentTraceProposal.json` is required.

## 2026-07-25 testcase audit correction

- Removed the runtime-composition masking defect: C1 external configuration, C2 embedding qualification, C3 canonical authority, and C4 Neo4j-native retrieval now target independently callable public boundaries and fail with four distinct missing-boundary signals.
- TS-06 freezes isolated provider, model identity, version, and dimensions omissions plus unapproved and implicit-default cases.
- TS-07 freezes four isolated credential/configuration omissions, credential-free startup and semantic query, hardcoded/default source scanning, and Cypher credential-boundary scanning.
- TS-01-Native freezes a Harness-owned query probe, exact request propagation, and exactly one invocation so a hardcoded `neo4j-native` label cannot satisfy acceptance.
- Added `coding-scope-authorization.guard.js`: TS-08/TS-09 remain mounted and frozen, but their testcase names and adapter/lifecycle implementation cannot appear in codingTargets, task targets/steps, or completion conditions.

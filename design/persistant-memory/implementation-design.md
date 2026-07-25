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

## 2026-07-25 second testcase audit correction

- TS-06 now proves exact boolean approval, rejects undefined/string/object/array/number approval impostors, rejects undefined and whitespace identity fields, and freezes a no-coercion positive-integer dimensions matrix.
- TS-07 replaced keyword-distance scanning with a structured executable policy that detects credential literals, logical/nullish/ternary fallback expressions, tainted variable propagation, and credential-bearing Cypher execution arguments.
- `credential-source-policy.guard.js` self-tests direct-literal, fallback, ternary, direct-parameter, transitive-variable, and variableized query/parameter bypass fixtures plus a safe fixture.
- TS-01-Native now generates an unpredictable runtime sentinel and complete multi-field result inside the injected probe, then requires exact deep propagation after one call.
- Coding scope authorization now examines `taskExecutionPlan.executionStrategy` and any equivalent top-level strategy/completion/authorization fields in addition to coding targets and task details.

## 2026-07-25 scoped delivery attribution correction

- The Implementation Design defect was requiring five global delivered anchors as this slice's completion condition. No intent graph mutation or trace proposal is required for a handoff-level scoped completion rule.
- Revised completion: six approved scoped explicit entrypoints, seven frozen critical guards, zero baseline delivered regression, and passing TS-07 constitute slice completion. Global credential delivery remains runner-owned.
- Scoped attribution relies only on committed mounted TS-07 evidence, handoff scope, runner failure records, and committed runner-owned delivery evidence; uncommitted parallel intent relationships are not evidence.
- Added a frozen critical traceability guard for this attribution and a W2-C7 resume task that authorizes Coding only to verify and commit the already implemented C1-C6 files.
- Because the handoff completion semantics and execution plan changed, global human reapproval is required before Coding resumes.
- Clean-checkout validation showed TS-09 is not mounted in the committed source intent graph. The later `ea32117f` intent handoff explicitly excludes it, so stale TS-09 runner evidence is no longer carried in the handoff; the legacy physical path remains frozen and unauthorized.

## 2026-07-25 approved live provider E2E extension

- Approved profile: provider `alibaba-cloud-model-studio-openai-compatible-cn-beijing`, Beijing compatible-mode endpoint, model `qwen3.7-text-embedding`, qualification label `qualification-2026-07-25` with alias drift acknowledged, and explicit dimensions `1024`.
- Added two independent frozen entrypoints for mounted TS-06-Provider-E2E and TS-07-Provider-Secret-Isolation plus a dedicated frozen Harness. Default execution fails with explicit opt-in categories before production loading, secret access, network, or Neo4j.
- Added three frozen critical guards: exact provider/.env/Neo4j contract, opt-in and no-fake substitution, and synthetic secret artifact scanning. The expanded slice therefore has eight scoped explicit entrypoints and ten critical guards while preserving the original six/seven checkpoint.
- `.argo/.env.example` is the only committed example and contains empty approved-key placeholders. The unique ignored/untracked `.argo/.env` or direct process variables may supply approved configuration after preflight.
- Controlled Neo4j evidence uses `ARGO_NEO4J_DATABASE_URL`, `ARGO_NEO4J_DATABASE_USERNAME`, and `ARGO_NEO4J_DATABASE_PASSWORD`, a disposable run marker, one success write, cleanup, and zero-write observations for provider/configuration/vector failures.
- C1-C6 remain uncommitted Coding-owned worktree state. W2-C7 checkpoints them unchanged before W2-C8 configuration, W2-C9 provider/index gate, and W2-C10 protected live verification.
- TS-09 remains outside intent and Coding scope. No intent graph change or trace proposal is required.
- Full pre-coding runner baseline: 34 total, 14 passed, 20 failed. Both live entrypoints honestly fail with their explicit opt-in categories. The newly mounted live TS-06 evidence changed runner-owned `grag-embedding-qualification` from delivered to not_delivered; this is the expected new acceptance baseline, not a Coding regression. No other delivery status changed.

## 2026-07-25 live E2E evidence hardening

- Replaced implementation-reported `liveProviderCall` evidence with a frozen Harness-owned transport wrapper. It records actual request count, origin/path, method, explicit model/dimensions, dynamic input, protected-header presence, and the raw response vector; gate output and persisted vector must match that observation.
- Removed the production `executeFailureScenario` contract. Success and every invalid/error injection now use `createLiveEmbeddingIndexGate(dependencies).executeApprovedEmbedding(input)`.
- Controlled Neo4j evidence now includes approved provider/model/qualification/dimensions, complete vector, and dynamic canonical/content/index identities and versions. Both success and failure cleanup must prove zero remaining records.
- The frozen opt-in guard executes both live entries with explicit opt-in and no `QWEN_KEY`, requiring the safe `QWEN_KEY_REQUIRED` category before production loading, transport, or Neo4j.
- The frozen secret guard self-tests source rejection for dotenv, `.env`, and configuration-object `QWEN_KEY` loading without reading a secret value. Redaction uses an ephemeral canary and covers errors, stdout, stderr, logs, latest failure records, snapshots, and recursive artifacts.
- `preCodingBaseline` is explicit in the handoff: 34 total / 14 passed / 20 failed, with only `grag-embedding-qualification` delivered-to-not_delivered accepted as the mounted-live pre-coding transition.
- Loader enforcement now uses provenance propagation rather than keyword co-occurrence. Named safe fixtures allow parsed file configuration for exactly five non-sensitive fields plus direct `process.env.QWEN_KEY`; bypass fixtures reject dotenv process mutation, parsed/file/JSON/YAML/config sources, aliases, fallbacks, destructuring, computed access, indirect secret assignments, and non-allowlisted file fields.
- Redaction now has both a provider-error probe and a synthetic-success probe. A recording in-memory boundary captures complete Cypher/parameter and graph-evidence values, demonstrates canary detection in neutral fields, clears all records, and verifies zero post-cleanup persistence or generated artifacts.
- Intent commit `76a54e9` approves exactly two secret keys, `QWEN_KEY` and `ARGO_NEO4J_DATABASE_PASSWORD`, from direct process variables or exact `.argo/.env`. Process wins; differing duplicates, unsafe path/git/file/reparse/ACL state, missing/blank/duplicate/unknown keys, and CLI/literal/default/fallback/alias/indirect sources fail before side effects.
- Metadata-only local preflight found `.argo/.env` ignored, untracked, regular, non-reparse, and readable, but Windows ACL currently grants broad read access to `BUILTIN\Users`. Live execution is blocked until the human tightens ACLs; no value was read and the file remains excluded from commits.
- Source fixtures no longer contain a guard-owned resolver. They create temporary synthetic files and call the future production `resolveApprovedLiveConfiguration()` with injected filesystem/git/ACL adapters, asserting attribution, precedence, exact categories, and zero side effects. Before Coding adds that export the matrix honestly reports `LIVE_PROVIDER_CONFIGURATION_BOUNDARY_MISSING`.
- ACL cases are principal-bound `icacls` ACE matrices for current allow/deny, inherited broad allow, broad deny-only, and unverifiable output. A recording Neo4j adapter separately proves the database-password canary reaches only `neo4j.auth.basic` and never Cypher.
- Accepted source fixtures now inject the complete nine-key approved configuration and compare the complete normalized result plus per-key attribution. Provenance labels were removed from the resolver API; injected source adapters record source kind/path/key/read operation/alias chain and the production resolver must decide from those traces.
- The auth canary no longer calls a Harness-private index boundary. It requires the future production `createApprovedNeo4jBoundary({ configuration, neo4j, logger })`, with the frozen recording adapter observing auth, driver, and query calls.

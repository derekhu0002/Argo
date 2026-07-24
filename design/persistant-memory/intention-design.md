# Intent Design Session Record

## 2026-07-24 — Compatible Contract And Query Entry Boundary

- Selected viewpoint: Application Usage Viewpoint.
- Stakeholder concern: downstream intent consumers must retain the complete no-argument canonical read while query requests declare purpose explicitly and audit requests without a subject are rejected.
- Modeling purpose: designing, deciding, and intent-to-implementation handoff preparation.
- Human approval evidence: this chat explicitly approved the DT-01, DT-02, DT-03, and DT-12 same-element testcase variants and approved using the chat decision as the orchestrator gate without adding schema-unsupported `approvedByHuman` fields.
- Delivery-status guardrail: no `deliveryStatus` attribute was created, changed, removed, or inferred by Intent Design.

### View bindings

- `grag-compatibility-usage` remains an Application Usage Viewpoint instance because it shows the downstream role and process consuming the query service and its complete canonical source.
- `grag-request-purpose-usage` remains an Application Usage Viewpoint instance because it shows request data read by validation and validation realizing the query-service contract.
- `grag-tidy-canonical-usage` is a new Application Usage Viewpoint instance because it isolates graph-tidy's complete canonical read from semantic retrieval and request-validation concerns.

### Coverage matrix

- `grag-consumer-role` — functional point `functionalPoint.DT-01-consumer-continuity` → `ExplicitAcceptanceTestcase-DT-01-ConsumerRole`.
- `grag-consumption-process` — functional point `functionalPoint.DT-01-complete-context-consumption` → `ExplicitAcceptanceTestcase-DT-01-ConsumptionProcess`.
- `grag-query-service` — functional point `functionalPoint.DT-01-compatible-reading-boundary` → `ExplicitAcceptanceTestcase-DT-01`; functional point `functionalPoint.DT-02-no-argument-full-snapshot` → `ExplicitAcceptanceTestcase-DT-02`.
- `grag-canonical-graph` — functional point `functionalPoint.DT-02-authoritative-complete-snapshot` → `ExplicitAcceptanceTestcase-DT-02-CanonicalGraph`.
- `grag-query-request` — functional point `functionalPoint.DT-03-explicit-purpose-contract` → `ExplicitAcceptanceTestcase-DT-03-QueryRequest`.
- `grag-mode-validation` — functional point `functionalPoint.DT-03-purpose-and-audit-gate` → `ExplicitAcceptanceTestcase-DT-03`.
- `grag-graph-tidy-policy` — functional point `functionalPoint.DT-12-full-snapshot-bypass` → `ExplicitAcceptanceTestcase-DT-12`.

### Dependency-scope decisions

- The handoff scope is the approved compatibility-contract slice of seven architecture elements.
- Viewpoint grouping elements are navigation anchors rather than implementation targets and are excluded from testcase coverage.
- Existing semantic seed, closure, index-lifecycle, alignment, outcome, and quality elements are unchanged context. They are excluded from this handoff because no-argument reading and graph-tidy explicitly bypass semantic retrieval, while this slice changes only request meaning and the pre-retrieval validation gate.
- No element is treated as a delivered stopping boundary; no pass evidence or `deliveryStatus` was fabricated.

### Validation and open risks

- `argo.previewSystemArchitectureMutation`: passed.
- `argo.applySystemArchitectureMutation`: passed; Neo4j synchronized to 30 elements, 28 relationships, and 17 views.
- `argo.validateSystemArchitecture`: passed.
- Open business questions: none for this compatibility-contract slice.

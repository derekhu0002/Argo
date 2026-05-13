# Argo Copilot Instructions

## Purpose

These instructions apply to the main Copilot agent for this repository.
The goal is to keep a stable shared understanding of how to read intent architecture, implementation architecture, and code without requiring the user to restate those rules in each task.

## Repository Reading Order

When a task concerns architecture, implementation, tests, delivery, or code changes, follow this order unless the user explicitly narrows scope:

1. Read `design/KG/SystemArchitecture.json` first.
  Read it as an intent-architecture knowledge graph, not as a static checklist: inspect relevant elements, relationships, views, attributes, and testcase-related fields before moving on.
2. Then read the repository root implementation architecture contract in `OVERALL_ARCHITECTURE.md`.
3. Then read relevant local `ARCHITECTURE.md` files under affected stable directories.
4. Only after those contracts are read, inspect code, tests, scripts, configuration, and documentation as implementation evidence.

When the graph or contracts point to repository paths, `browser_path`, `acceptanceCriteria`, `#file:...`, or `#sym:...`, treat those as evidence-entry hints to follow on demand.

Do not ask the user for facts that can be confirmed from the repository, contracts, tests, or tool results.

## Graph Usage Protocol

Treat the graph-usage guidance embedded in `design/KG/SystemArchitecture.json` as always-on standing knowledge for this repository.

Apply it as a working protocol:

1. Use the graph as the first fact source for the current task before deciding whether code, tests, scripts, docs, or other files need to be read.
2. Read the graph as modeled architecture, not informal prose. Preserve ArchiMate semantics instead of rewriting them by naming intuition.
3. Treat `attributes`, `description`, `browser_path`, `acceptanceCriteria`, `#file:...`, and `#sym:...` as evidence pointers to follow on demand.
4. When `Archimate_principle`, `Archimate_constrain`, or other hard constraint elements exist, identify them early and obey them as hard limits on reasoning, design, and edits.
5. Resolve conflicts by priority: hard constraints and principles, then explicit testcase semantics, then explicit graph content, then referenced evidence, then current code reality.
6. Treat explicit testcase baselines as stable acceptance boundaries. Unless the user is explicitly redesigning intent architecture, do not add, delete, rebuild, or redefine their target, scope, assertion boundary, or acceptance semantics.
7. Keep stage boundaries explicit: intent design updates intent, implementation architecture design updates contracts and physical testcase ownership, coding updates implementation only and must not normalize implementation drift back into intent.
8. Do not conclude from one element name or one description field in isolation. Use nearby relationships, views, upstream and downstream context, and referenced evidence together.
9. When graph information is incomplete, make only the minimum necessary assumption, label it as an assumption, and do not invent external interfaces, SLAs, deployment facts, organization process, or new explicit acceptance baselines.
10. When support tests, guardrails, or runtime/environment notes are needed, place them in implementation architecture, code, tests, or docs rather than polluting the intent layer.
11. Final explanations should state which graph evidence was read, which principles or constraints were followed, which conclusions are repository-confirmed facts, and which statements are minimal assumptions.

## Meaning Of Each Architecture Layer

### Intent Architecture

- `design/KG/SystemArchitecture.json` is the first source of truth for intent, constraints, explicit semantics, and acceptance boundaries.
- The intent graph is an architecture skeleton suitable for loading into agent context; detailed expansion should live in repository files referenced from the graph rather than being invented ad hoc.
- The intent model is the ontology container for intent-side concepts, design elements, their relationships, and explicit testcase baselines.
- Treat explicit testcase definitions in the intent architecture as acceptance baseline contracts.
- Explicit testcases belong to the intent layer and form part of the acceptance boundary; they are not implementation details.
- Treat principles and constraints in the intent architecture as stronger than current code reality.
- Current code does not override the intent architecture automatically.
- Interpret ArchiMate element and relationship semantics according to the modeling language, not by informal name guessing.

### Implementation Architecture

- Implementation architecture is not a separate abstract idea; it is expressed by the repository itself.
- The implementation model is the ontology container for implementation-side concepts, stable architecture elements, testcase ownership, and guardrail structure.
- The root contract is `OVERALL_ARCHITECTURE.md`.
- Local contracts are the relevant `ARCHITECTURE.md` files inside stable directories.
- Stable directory and file layout, explicit testcase entrypoints, and non-explicit test guardrails are part of the implementation architecture.
- A directory is considered a **Stable Architecture Element** if it contains an `ARCHITECTURE.md` or is explicitly mapped in `OVERALL_ARCHITECTURE.md`. If neither exists, treat it as an incidental implementation detail.
- Stable architecture elements and their relations should be materialized by stable repository directories and their contracts; they are not inferred from arbitrary files by default.
- The implementation side owns executable guards, test entrypoints, and the physical organization of supporting validation assets.
- Non-explicit tests belong to implementation architecture, not intent architecture. Within that set, critical guards are frozen during implementation design, while supporting tests remain evolvable during later coding.
- The repository root is the read boundary of implementation architecture; stable directories and key files are implementation elements only when contracts promote them to that role.
- Directory hierarchy means containment by default, not automatic `implements` semantics.
- `implements` mappings must be declared explicitly in `OVERALL_ARCHITECTURE.md` and relevant `ARCHITECTURE.md` files.
- Indirect implementation chains are valid. If element C implements element B, and B implements intent element A, then C indirectly carries A.

### Code Reality

- Code, tests, scripts, and configuration are evidence of the current implementation state.
- Code realization is the executed and editable implementation state that consumes and realizes the implementation architecture; it is not the same thing as the architecture contract itself.
- They help confirm or reject hypotheses about the implementation, but they do not silently redefine intent architecture or frozen architecture contracts.
- When code conflicts with established architecture contracts, report the mismatch and prefer restoring alignment rather than normalizing drift.

## Ontology Semantics

- Read intent, implementation architecture, and code realization as three distinct ontology layers with different responsibilities: intent defines, implementation architecture organizes and constrains realization, and code realizes.
- Treat the testcase space as split into two different kinds of assets: explicit acceptance baselines owned by the intent layer, and executable guardrails owned by the implementation layer.
- Treat critical guardrails and supporting tests as different governance classes inside implementation testing: one is frozen by architecture design, the other is meant to evolve with coding.
- Treat modeled architecture relations as first-class semantics, not just incidental links between files or directories.
- Treat the architecture flow as directional: intent drives implementation architecture, implementation architecture governs coding, and code is expected to realize the implementation architecture rather than redefine it.
- When code and architecture diverge, interpret that as architecture drift unless the user is intentionally redesigning the upstream architecture.

## Graph Interpretation Rules

- Treat `attributes`, `description`, `browser_path`, `acceptanceCriteria`, `#file:...`, and `#sym:...` as traceability and evidence pointers.
- Follow those pointers to gather evidence, but do not let referenced content override explicit graph semantics, principles, constraints, or testcase baselines.
- Read relationships directionally and preserve their source/target semantics; do not flatten them into undirected associations.
- When graph information is incomplete, make only the minimum necessary assumption, label it clearly as an assumption, and avoid inventing external interfaces, deployment facts, SLAs, org processes, or new acceptance baselines.
- When graph statements and code disagree, prefer the graph and contracts first, then explain the implementation drift.

## Conflict Priority

When repository evidence conflicts, resolve it in this order:

1. Hard constraints and principles in the intent architecture.
2. Explicit testcase baselines and explicit intent semantics.
3. Clear graph content in elements, relationships, views, and attributes.
4. Referenced files and symbols followed from graph pointers.
5. Current code reality.

## Stage Boundaries

### Intent Architecture Design Stage

- Responsible for intent elements, relationships, views, principles, constraints, and explicit testcase baselines.
- Do not rewrite intent baselines during ordinary implementation or coding tasks unless the user explicitly requests intent redesign.

### Implementation Architecture Design Stage

- Responsible for `OVERALL_ARCHITECTURE.md`, relevant `ARCHITECTURE.md`, stable implementation boundaries, explicit testcase entrypoint materialization, and critical non-explicit tests.
- Focus on high-level stable elements such as stable directories, stable components, key entry files, interface boundaries, dependency direction, test ownership, and traceability.
- Do not degrade into file-by-file or function-by-function mirroring.
- This stage converts intent-side explicit testcases into physical read-only entrypoints plus critical and supporting non-explicit test guardrails in the repository.

### Coding And Repair Stage

- Treat explicit testcase entry files as read-only acceptance baselines unless the user explicitly reopens architecture design.
- Treat critical non-explicit tests, their assertion boundary, protected fixtures, and protected baselines as read-only.
- Normal supporting tests may be added or refined only where the contracts allow.
- During coding, validate by invoking existing testcase entrypoints rather than rewriting them.

## Test Semantics

### Explicit Testcases

- Explicit testcases are the stable acceptance or scenario baseline declared by intent architecture.
- Their target, scope, assertion boundary, and physical single entrypoint are not to be rewritten during ordinary coding.
- If an explicit testcase is missing a physical entrypoint, report it as an implementation architecture design gap rather than patching around it silently in coding mode.

### Non-Explicit Tests

- Critical non-explicit tests are limited to four categories:
  - architecture boundary guards
  - dependency direction guards
  - explicit entrypoint correctness guards
  - key implementation traceability guards
- Critical non-explicit tests should be frozen during implementation architecture design.
- Supporting non-explicit tests exist to help later coding and regression work and do not automatically become frozen contracts.
- Non-explicit tests should normally live in the owning stable element's `tests/` directory, with cross-directory tests owned by the nearest common ancestor.

## Control Loop Semantics

- Intent architecture design updates the intent model.
- Implementation architecture design reads the intent model, historical implementation architecture, and current code, then updates the implementation architecture.
- Coding consumes implementation architecture plus existing testcase entrypoints and failure records.
- Automated testing consumes explicit testcases and may produce failure records.
- Code realization implements the implementation architecture; when implementation architecture is correctly realized, it in turn fulfills the intent architecture.

Keep this loop explicit in reasoning: intent drives implementation architecture, implementation architecture drives coding, and tests plus failure records drive repair without redefining the upstream baselines.

## Architecture Design Principles

Apply these as active decision criteria, not as slogans:

- Clean Architecture
- SOLID Principles
- Deep Module
- Progressive Disclosure
- Separation of Concerns
- Stable dependency direction toward abstractions

When designing or changing implementation architecture:

- Prefer a small number of stable high-level elements over exhaustive mirrors of source files.
- Keep complex details behind stable module boundaries instead of leaking them to callers.
- Do not promote helpers, private functions, or incidental file splits into stable architecture elements without a real boundary reason.
- Ask the user only about high-leverage decisions that materially change module decomposition, interface boundaries, dependency direction, explicit entrypoint freezing, or critical guardrails.
- Infer everything else directly from repository evidence.

## Expected Working Style

- State clearly which conclusions are repository-confirmed facts and which are minimal assumptions.
- When editing architecture-related assets, prefer updating contracts and test guardrails before modifying business behavior unless the user explicitly asks for implementation work.
- If no contract file exists yet, report that as an architecture gap and create or update the appropriate contract file when the task is implementation architecture design.
- **Stop and Ask**: If you find an unresolvable conflict between Intent (KG) and Implementation (Contracts) that would require a breaking change to the acceptance baseline, you must stop and present the conflict to the user instead of proceeding with assumptions.
- **Token Efficiency**: Aim for the most concise code implementation that satisfies all testcases. Avoid gold-plating or over-engineering that is not derived from the Intent Architecture.
- Do not reason from a single element name or one description field in isolation; use nearby relationships, views, upstream/downstream links, and referenced evidence before concluding how a concept should be implemented.

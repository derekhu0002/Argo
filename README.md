# ARGO HARNESS

## Quick start

### Install

Copy the platform bundle together with the shared `.argo/` directory to the target workspace root, then confirm that the target platform can discover the MCP service named `argo`:

| Edition | Environment | Deploy | Primary entrypoints |
| --- | --- | --- | --- |
| [Cursor](.cursor/) | Cursor | `.cursor/` + `.argo/` | `/business-partner`; choose `/task-emit-human-in-the-loop` or `/task-emit-afk` when starting tasks |
| [Copilot](.github/) | GitHub Copilot | `.github/` + `.argo/` | `BusinessPartner`; choose `task-emit-human-in-the-loop` or `task-emit-afk` when starting tasks |
| [OpenCode](.opencode/) | OpenCode | `.opencode/` + `.argo/` | `BusinessPartner`; choose `task-emit-human-in-the-loop` or `task-emit-afk` when starting tasks; also `/argo-init`, `/argotest` |

After installation, run `/argo-init`. It checks `argo` MCP, `SystemArchitecture.json`, and Neo4j readiness; performs or verifies the canonical intent graph's initial sync to Neo4j; and initializes the semantic lifecycle. Full embedding backfill and readiness alignment run only when both gates are enabled.

### Choose the right entrypoint

All new requirements and issue reports—including defects and failing tests—start with `BusinessPartner` / `/business-partner`. It clarifies the business goal, impact scope, and acceptance boundary, then passes the converged decision tree to `/task-tidy`. Once task packages are ready, choose an execution mode: `/task-emit-human-in-the-loop` keeps approvals and final acceptance with a human; `/task-emit-afk` lets the agent continue and return failed work until acceptance passes.

| Situation | Start here |
| --- | --- |
| New requirement, business proposal, defect, or failing test | `BusinessPartner` / `/business-partner` → `/task-tidy` → choose `/task-emit-human-in-the-loop` or `/task-emit-afk` |
| Architecture improvement | `BusinessPartner` / `/business-partner` → `/improve-codebase-architecture` |
| No trustworthy architecture baseline | `BusinessPartner` / `/business-partner` → `/reverse-architecture-extraction` |
| Code or tests changed outside a trustworthy baseline | `BusinessPartner` / `/business-partner` → `/architecture-drift-recovery` |
| Repeated agent drift or rules to distill | `/distill-agent-rules` |
| Current scope accepted and ready to archive | `/delivery-archive` |

For detailed selection criteria, suggested inputs, and outputs, see [Usage scenarios and entrypoint selection](design/argo-harness/usage-scenarios/README.md).

## Preparation before starting

Before delivery starts, prefill known facts into the intent architecture knowledge graph so that `BusinessPartner` begins with verifiable business and architecture context rather than recreating already-made decisions.

Prefill:

- **Business requirements**: goals, stakeholders, constraints, business rules, acceptance criteria, and known risks;
- **Architecture design**: existing capabilities, processes, applications, technology, dependencies, architecture viewpoints, and approved boundaries;
- **Work packages**: independently acceptable delivery scopes, their architecture elements, and their acceptance testcases.

Each work package should also declare the required:

- domain skills and specialist knowledge;
- tools, test environments, devices, or external-service controls;
- implementation boundaries, delivery evidence, and acceptance conditions.

Prefilled content must pass the common graph validation and human acceptance. It establishes facts for later decisions; it does not bypass `BusinessPartner`, intent design, implementation design, or two-level acceptance.

Organize these materials through domain templates: define domain architecture and knowledge in `design/specific-domain/<domain>/`, and provide domain skills in `.argo/skills/<domain>/` or the relevant platform-adaptation directory. See the [domain template index](design/specific-domain/README.md) for conventions.

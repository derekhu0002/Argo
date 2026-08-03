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

## Extend ARGO

ARGO has a stable foundation:

```text
Intent architecture template + argo MCP + HARNESS delivery flow
```

Projects can extend this foundation with domain templates and work packages. A work package connects a bounded delivery concern to the architecture elements that govern it, then supplies the skills, environment access, and evidence needed to deliver that concern.

Each work package should:

- identify its relevant goals, capabilities, processes, applications, technology, and acceptance testcases in the intent architecture;
- expose only the domain skills, knowledge, test-environment information, devices, or external-service controls required for that architecture scope;
- define its coding boundaries and test entrypoints; and
- return build, run, observability, and acceptance evidence through the common validation flow.

Each domain template can combine:

- default intent architecture and viewpoints;
- domain skills and knowledge bases;
- coding standards and implementation boundaries;
- test environments, devices, or external-service control interfaces; and
- build, run, observability, and acceptance evidence.

| Available domain | Capabilities |
| --- | --- |
| [HarmonyOS and cross-platform mobile development](design/specific-domain/harmonyos/README.md) | ArkTS/ArkUI, device environments, window analysis, cross-platform comparison, build and run workflows, and delivery preflight checks |

Add new templates under `design/specific-domain/<domain>/`, and put domain skills in `.argo/skills/<domain>/` or the corresponding platform-adaptation directory. Domain capabilities must not bypass the common intent design, implementation design, or two-level acceptance flow.

For more extension conventions, see the [domain template index](design/specific-domain/README.md).

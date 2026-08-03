# ARGO HARNESS

ARGO is an **architecture knowledge-graph-driven** AI coding harness for complex enterprise projects. It uses precise context management to organize business intent, architecture decisions, test gates, and agent collaboration into a delivery loop that is traceable, verifiable, and repeatable.


## Core approach

ARGO consists of three mutually reinforcing components:// todo: substitue the image to represent components from top to down as human-> harness(agent coordination) -> knowledge graph(graph rag + archimate schema) MCP tool + auto acceptance test MCP tool.

```mermaid
flowchart LR
    H[Human partner<br/>goals and review] --> F

    subgraph F[ARGO HARNESS delivery flow]
        BP[Business clarification] --> ID[Intent design]
        ID --> IM[Implementation design]
        IM --> CR[Coding and repair]
        CR --> A[Two-level acceptance]
        A -. GAP feedback .-> ID
    end

    F --> M[argo MCP<br/>query · mutation · validation · testing]
    M <--> K[(Intent architecture data<br/>SystemArchitecture.json)]
    K --> F
```

1. **Intent architecture data**: `design/KG/SystemArchitecture.json` stores goals, capabilities, dependencies, constraints, and acceptance semantics as ArchiMate elements, relationships, views, and explicit testcases.
2. **Architecture service MCP**: the unified `argo` service provides graph queries, controlled mutations, schema and semantic validation, handoff validation, and architecture tests.
3. **HARNESS delivery flow**: BusinessPartner, IntentionDesign, ImplementationDesign, CodingAndReparing, and two-level acceptance collaborate within explicit permissions.

Learn more: [Overall architecture](design/architecture.md) · [Intent architecture design](design/intent-architecture/README.md) · [HARNESS delivery flow](design/argo-harness/README.md)

## Precise context management

The goal is for an agent to receive **only the facts, dependencies, permissions, and validation evidence needed to complete the current task at the correct stage**. This addresses common large-project context failures: information overload, conflicting facts, cross-stage overreach, long-session degradation, and code reality silently overriding business intent.

// todo: substitute this image to represent how the agent can get precise context package through MCP from the knowledge graph.
```mermaid
flowchart LR
    I[Business requirements and decisions] --> G[(Intent architecture graph<br/>long-lived fact source)]
    T[Current delivery scope] --> Q[argo MCP<br/>query focused dependency subgraph]
    G --> Q
    Q --> V[Relevant viewpoints<br/>goals · capabilities · dependencies · constraints · testcases]
    V --> H[Stage handoff<br/>compressed execution context]
    H --> A[Stage agent<br/>explicit read, write, and prohibited boundaries]
    A --> E[Tests, validators, and failure records<br/>objective feedback]
    E -->|GAP feedback| G
```

Four constraints make this possible:

- **Fact precision**: long-lived facts belong in `SystemArchitecture.json`, implementation contracts, handoffs, and frozen tests—not chat memory.
- **Scope precision**: each task receives context around its architecture focus, dependency subgraph, and viewpoint.
- **Permission precision**: each stage changes only the artifacts it owns; out-of-scope issues move through a handoff or GAP feedback.
- **Timing precision**: MCP validators, architecture tests, and two-level acceptance refresh context with execution evidence.

For the complete mechanism, see [Intent architecture design](design/intent-architecture/README.md), [HARNESS delivery flow](design/argo-harness/README.md), and [Task orchestration based on architectural dependencies](notes/ai-engineering/驯服高维空间的重力：基于架构依赖的%20AI%20任务编排方法论.MD).

## How a delivery runs

```text
Business clarification
  → Internalize decisions in the intent architecture
  → Intent design and human acceptance review
  → Implementation design and human test review
  → Code and repair until tests pass
  → Code implementation acceptance
  → Intent delivery acceptance
```

Upper stages may read lower-stage facts to make decisions; lower stages must not overwrite upper-stage decisions:

| Stage | Owns | Does not own |
| --- | --- | --- |
| BusinessPartner | Goals, options, risks, control points, and observability points | Implementation design and coding |
| IntentionDesign | Intent graph, coverage, and explicit testcases | Business code and implementation contracts |
| ImplementationDesign | Stable boundaries, test entrypoints, and implementation handoffs | Direct intent-graph changes |
| CodingAndReparing | Actual production behavior and clearing failure records | Frozen tests and architecture contracts |

For the complete division of responsibilities between agents and skills, see [Agent and skill design](design/argo-harness/agents-and-skills.md).

// todo: represent some key capabilities of each agent above.
## Quick start

### Install

Copy the platform bundle together with the shared `.argo/` directory to the target workspace root, then confirm that the target platform can discover the MCP service named `argo`:

| Edition | Environment | Deploy | Primary entrypoints |
| --- | --- | --- | --- |
| [Cursor](.cursor/) | Cursor | `.cursor/` + `.argo/` | `/business-partner`, `/orchestrating` |
| [Copilot](.github/) | GitHub Copilot | `.github/` + `.argo/` | `BusinessPartner`, `Orchestrator` |
| [OpenCode](.opencode/) | OpenCode | `.opencode/` + `.argo/` | `BusinessPartner`, `Orchestrator`, `/argoinit`, `/argotest` |

After installation, confirm that:

1. the platform discovers the `argo` MCP service;
2. `design/KG/SystemArchitecture.json` exists;
3. `validateSystemArchitecture` can run; and
4. the work uses the correct agent or skill entrypoint.

Stable design references own MCP tool parameters, mutation side effects, validator rules, the production semantic lifecycle, credential boundaries, and command-level operating instructions. See the [Intent architecture MCP feature list](design/mcp/意图架构%20MCP%20功能列表.md) and [MCP validation mechanism](design/validator/intent-architecture-mcp-validation.md). This README helps new readers select an entrypoint; it does not duplicate those operational details.

### Choose the right entrypoint

| Situation                                                                | Start here                                                                                             |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| New requirement or business proposal                                     | `BusinessPartner` / `/business-partner`, then `/task-tidy`                                             |
| Defect or failing test                                                   | `Orchestrator` / `/orchestrating` to determine whether the issue is in intent, implementation, or code |
| No trustworthy architecture baseline                                     | `/reverse-architecture-extraction`                                                                     |
| A trustworthy baseline exists, but code or tests were changed externally | `/architecture-drift-recovery`                                                                         |
| Find architecture-improvement candidates                                 | `/improve-codebase-architecture`                                                                       |
| Repeated agent drift or rules that should be distilled                   | `/distill-agent-rules`                                                                                 |

For detailed selection criteria, suggested inputs, and outputs, see [Usage scenarios and entrypoint selection](design/argo-harness/usage-scenarios/README.md).

## Design documentation// TODO:remove this section


| Topic | Deep dive |
| --- | --- |
| Documentation system and fact sources | [Design documentation map](design/README.md) |
| The three core components | [Overall architecture](design/architecture.md) |
| Delivery stages, gates, and handoffs | [HARNESS delivery flow](design/argo-harness/README.md) |
| Agents, skills, and platform mapping | [Agent and skill design](design/argo-harness/agents-and-skills.md) |
| Usage scenarios | [Usage scenarios and entrypoint selection](design/argo-harness/usage-scenarios/README.md) |
| ArchiMate, viewpoints, and explicit acceptance | [Intent architecture design](design/intent-architecture/README.md) |
| MCP tool interfaces | [Intent architecture MCP feature list](design/mcp/意图架构%20MCP%20功能列表.md) |
| Graph validation and failure guidance | [MCP validation mechanism](design/validator/intent-architecture-mcp-validation.md) |
| Schema and Enterprise Architect | [Schema-to-EA mapping](design/schema-ea-mapping.md) |
| Solution comparison | [ARGO, OpenSpec, Superpowers, and ECC](design/marketing/solution-comparison-argo-openspec-superpower-ecc.md) |

`design/` contains stable, accepted design specifications. `notes/` contains research, derivations, and candidate ideas. Design documents may reference research evidence, but research notes are not runtime fact sources.

## Extend ARGO

ARGO has a stable foundation: // todo: describe a way for other users to extend , such as hook the needed skills and information of test environments under some workpackge, and each workpackage is associated with relavant architecture elements.

```text
Intent architecture template + argo MCP + HARNESS delivery flow
```

Projects can choose domain templates on top of this foundation. Each template can combine:

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

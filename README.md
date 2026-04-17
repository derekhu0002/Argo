# Argo

Argo is a VS Code Chat Participant extension for architecture governance. It uses GitHub Copilot Chat plus semantic UML extraction to keep architectural intent and real code aligned in a closed loop.

The extension is exposed as `@argo` inside VS Code Chat and focuses on four workflows:

- `/init`: generate implementation from architecture intent and validate stitching
- `/baseline`: reverse-engineer the current workspace into semantic UML
- `/evolve`: apply architecture deltas while running anti-corruption checks
- `/link`: build traceability between architecture intent and implementation

## What Problem It Solves

Architecture documents usually drift away from code. Argo reduces that drift by treating architecture as an operational asset instead of a static document.

It is designed for teams that want to:

- describe architecture intent once and keep it in the repository
- extract an implementation view directly from source code
- compare intended architecture with actual structure
- evolve systems without silently breaking boundaries
- generate traceability evidence for review and governance

## Typical User Scenarios

### 1. Greenfield architecture-driven build

You define the target architecture in `design/architecture-intent.puml`, then run `@argo /init`. Argo uses the returned commit to locate the implementation scope, rebuilds a full implementation UML from the current workspace, and validates whether that full structure matches the declared intent.

### 2. Legacy codebase baseline

You run `@argo /baseline` on an existing workspace. Argo extracts semantic UML, stores it in `design/implementation-uml.puml`, and also stores symbol-level summaries for review.

### 3. Controlled architecture evolution

You update the intent file to reflect a new capability or boundary change, then run `@argo /evolve` with optional extra context. Argo uses the returned commit to locate the evolution scope, rebuilds a full implementation UML from the current workspace, and checks whether the evolved implementation introduces cross-layer leakage or domain corruption.

### 4. Architecture traceability and review

You run `@argo /link` to map intent components to code-level elements and build a traceability view that can support design reviews and change assessment.

## Convention Over Configuration

Argo uses fixed paths under the workspace `design/` directory. These files are part of the workflow contract.

| File | Purpose |
|------|---------|
| `design/architecture-intent.puml` | Canonical architecture intent input |
| `design/implementation-uml.puml` | Extracted implementation architecture output |
| `design/implementation-uml.candidate.puml` | Candidate implementation architecture when `/init` or `/evolve` fails judgement |
| `design/symbol-summaries.md` | Symbol-level semantic summary output |
| `design/traceability-matrix.md` | Intent-to-code mapping output from `/link` |
| `design/architecture-drift-report.md` | Drift/deviation report and remediation advice from `/link` |

You should treat `design/architecture-intent.puml` as the architecture source of truth for Argo workflows.

For commit-driven workflows, Argo uses a strict rule:

- the changed files in the returned commit are used only to locate the scope of the current implementation or evolution work
- the actual architecture judgement is always performed against a full UML rebuilt from the current workspace source code

This avoids overwriting the full implementation architecture baseline with a partial UML extracted from only the changed files.

## How To Use

### Prerequisites

- VS Code 1.93 or later
- GitHub Copilot Chat extension installed and available
- A workspace folder open in VS Code

### 1. Create the intent file

Create `design/architecture-intent.puml` in the workspace root.

This file should describe the intended architecture using your preferred PlantUML/ArchiMate-friendly notation. Argo reads this file automatically for intent-driven workflows.

### 2. Open VS Code Chat

Use the `@argo` participant in the chat panel.

Examples:

```text
@argo /baseline
```

```text
@argo /init
```

```text
@argo /evolve 请重点关注鉴权模块
```

```text
@argo /link 请优先分析 orchestration 和 LLM 边界
```

### 3. Review generated assets under `design/`

Argo writes its outputs into fixed files rather than dumping long artifacts into chat.

After running extraction-oriented workflows, review:

- `design/implementation-uml.puml`
- `design/implementation-uml.candidate.puml` when `/init` or `/evolve` fails judgement
- `design/symbol-summaries.md`
- `design/traceability-matrix.md`
- `design/architecture-drift-report.md`

## Command Guide

### `/baseline`

Use this when you want to understand the current workspace as it exists today.

What it does:

- scans the workspace and collects symbol/call topology via VS Code language features
- summarizes business behavior of code symbols with LLM assistance
- generates a semantic UML implementation view
- writes output to `design/implementation-uml.puml`
- writes symbol summaries to `design/symbol-summaries.md`

Best for:

- legacy code understanding
- architecture discovery
- preparing for `/link` or `/evolve`

### `/init`

Use this when the architecture intent should drive the initial implementation shape.

What it does:

- reads `design/architecture-intent.puml`
- optionally appends your chat prompt as extra context for the Copilot main agent handoff
- requires the main agent to commit and return a commit id
- uses the changed files in that commit only to locate the scope of the implementation work
- rebuilds a full implementation UML from the current workspace before judging
- runs stitching checks between intent and the rebuilt full implementation view
- writes `design/implementation-uml.puml` only when judgement passes
- writes `design/implementation-uml.candidate.puml` when judgement fails

Best for:

- greenfield services
- prototypes with architecture control
- architecture-first implementation workflows

### `/evolve`

Use this when the system already exists and the architecture is changing incrementally.

What it does:

- reads the current formal implementation baseline from `design/implementation-uml.puml`
- uses `design/architecture-drift-report.md` from the latest `/link` run as governance context when available
- requires the main agent to commit and return a commit id
- uses the changed files in that commit only to locate the scope of the evolution work
- rebuilds a full implementation UML from the current workspace before judging
- runs anti-corruption checks against unintended boundary violations
- writes `design/implementation-uml.puml` only when judgement passes
- writes `design/implementation-uml.candidate.puml` when judgement fails

Best for:

- adding new components to an existing system
- refactoring with architectural guardrails
- checking whether a change pollutes stable domains

### `/link`

Use this when you want intent-to-code mapping.

What it does:

- reads the canonical intent and the current formal implementation view
- builds a traceability matrix between architectural concepts and code elements
- analyses architecture drift, deviation details, and remediation suggestions
- writes both `design/traceability-matrix.md` and `design/architecture-drift-report.md`

Best for:

- architecture reviews
- impact analysis
- evidence for governance and compliance discussions

## Recommended Workflow

1. Write or update `design/architecture-intent.puml`.
2. Run `@argo /baseline` to capture the current implementation view.
3. Review `design/implementation-uml.puml` and `design/symbol-summaries.md`.
4. Run `@argo /link` to inspect intent-to-code traceability.
5. Review `design/architecture-drift-report.md` to understand current deviations and recommended repairs.
6. Run `@argo /evolve` for controlled changes, or `@argo /init` for architecture-first generation.
7. If `/init` or `/evolve` fails judgement, inspect `design/implementation-uml.candidate.puml`, repair the code through the Copilot main agent, then rerun with the new commit id.

## Project Structure

```text
Argo/
├── design/
│   ├── architecture-intent.puml
│   ├── implementation-uml.candidate.puml
│   ├── implementation-uml.puml
│   ├── symbol-summaries.md
│   ├── traceability-matrix.md
│   └── architecture-drift-report.md
├── src/
│   ├── commands/
│   ├── engine/
│   ├── lm/
│   ├── utils/
│   ├── extension.ts
│   └── participant.ts
├── publish.py
├── pack_workspace.py
├── package.json
└── tsconfig.json
```

## Local Development

Install dependencies:

```bash
npm install
```

Compile:

```bash
npm run compile
```

Watch mode:

```bash
npm run watch
```

## Packaging And Publishing

Package the extension locally:

```bash
python publish.py package
```

The generated VSIX can be installed with:

```bash
code --install-extension argo-architect-0.1.0.vsix
```

Publish workflow is also handled by `publish.py`.

## Utility Scripts

### `publish.py`

Builds, validates, and packages or publishes the extension.

### `pack_workspace.py`

Exports workspace files into JSON while respecting `.gitignore` patterns. Useful for external inspection or prompt packaging workflows.

## Current Status

The project currently provides the core orchestration flow, semantic UML extraction pipeline, intent-to-implementation comparison, and fixed-path design asset management under `design/`.

## License

MIT
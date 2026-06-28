---
name: reverse-architecture-extraction
description: 从已有测试和代码中反推候选实现架构与候选意图架构，并调度 ReverseArchitectureExtraction、ImplementationDesign、IntentionDesign 完成架构提取、固化和审查。Use when the user asks to extract architecture bottom-up from tests/code, bootstrap architecture for an existing repository, or recover intent/implementation architecture when no contracts exist.
argument-hint: scope-or-test-entrypoint
disable-model-invocation: true
---

# Reverse Architecture Extraction

## Role

这是一个调度 Skill，不直接写正式架构资产。它把“只有测试和代码”的已有仓库，分三段交给专用 Agent 处理：

1. `ReverseArchitectureExtraction` 从测试优先、代码入口补充，生成候选实现架构、候选意图架构、证据矩阵和开放问题。
2. `ImplementationDesign` 接收候选实现架构，固化实现边界、契约、测试归属和 implementation handoff。
3. `IntentionDesign` 接收候选意图架构，执行业务语义门禁、ArchiMate 合法性检查、MCP preview/apply/validate，并决定是否更新 `design/KG/SystemArchitecture.json`。

## Hard Boundaries

- 测试是第一证据源；代码入口只用于补充和校验边界。
- 没有测试覆盖的代码只能生成低置信实现事实，不能直接提升为意图。
- 纯技术细节不得进入候选意图架构，只能作为实现锚点、排除项或开放问题。
- `ReverseArchitectureExtraction` 不得直接修改 `SystemArchitecture.json`、`OVERALL_ARCHITECTURE.md`、`ARCHITECTURE.md` 或 handoff 文件。
- 正式实现契约只能由 `ImplementationDesign` 固化。
- 正式意图图谱只能由 `IntentionDesign` 通过 `argo` MCP mutation tools 修改并验证。

## Workflow

1. 明确 scope：测试文件、测试命令、代码入口、模块范围，或用户指定的业务能力纵切片。
2. 调度 `ReverseArchitectureExtraction`，要求输出：
   - `CandidateImplementationArchitectureReport`
   - `CandidateIntentArchitectureReport`
   - `EvidenceMatrix`
   - `OpenQuestions`
   - optional `ReverseArchitectureExtractionReport.json` draft
3. 如果候选实现架构足够明确，调度 `ImplementationDesign`，事件为：
   `Bootstrap implementation architecture from reverse extraction`
4. 如果候选意图架构足够明确，调度 `IntentionDesign`，事件为：
   `Candidate intent architecture from reverse extraction`
5. 如果任一 Agent 报告阻塞问题，把问题交给用户；用户回答后恢复同一个 Agent 会话。
6. 完成时报告：
   - 候选报告路径或摘要
   - 已固化的实现契约路径
   - 已更新或待确认的意图图谱项
   - 未解决的业务问题、低置信事实和排除项

## Acceptance Gate

调度结果必须满足：

- 每个候选实现单元都有测试证据或明确标记为低置信代码证据。
- 每个候选意图单元都有业务语义门禁判断：业务可观察、业务可决策、业务可验收。
- 每个候选验收语义都有验收方视角的控制点和观测点。
- 测试证据、代码入口、推断结论、排除细节之间可追踪。
- 正式图谱或契约变更由对应阶段 Agent 完成，不由本 Skill 越权完成。

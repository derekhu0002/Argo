---
name: argo-init
description: "准备并检查整个 ARGO HARNESS 环境是否可用。Use when the user asks to initialize, bootstrap, prepare, verify, or health-check the full ARGO HARNESS environment, including Argo MCP readiness, canonical intent-graph availability, Neo4j connectivity, and one initial JSON-to-Neo4j sync. Keywords: ARGO INIT, harness init, bootstrap harness, MCP health check, Neo4j initial sync."
argument-hint: scope-or-mode
disable-model-invocation: true
---

# ARGO INIT

`argo-init` 负责准备并检查整个 ARGO HARNESS 运行环境。它不是普通的代码解释技能，而是一个可执行的环境引导与健康检查工作流，目标是让仓库在一次运行后具备以下条件：

- Argo 工作区 bootstrap 资产存在且可用。
- `argo` MCP 服务器能正常初始化、列出关键工具并响应 `ping`。
- `design/KG/SystemArchitecture.json` 可通过 `argo` MCP 正常读取和校验。
- 本机 Neo4j 连接可用。
- canonical intent graph 至少完成一次 JSON -> Neo4j 初始同步，并通过一致性校验。

## Rules

- **MUST** 优先运行仓库原生命令 `node .argo/scripts/ensureArgoHarnessEnvironment.js`。
- **MUST** 将该命令返回的 JSON 结果作为最终判断依据，而不是凭主观描述报告环境状态。
- **MUST** 报告环境是否自动执行了 bootstrap、MCP 是否通过、Neo4j 是否通过、以及初始同步是否完成。
- **MUST** 在脚本失败时直接转述失败阶段、错误摘要和报告路径，不要改用含糊描述。
- **MUST NOT** 绕开脚本分别手工执行一堆无关命令来替代初始化工作流，除非你是在排查脚本自身失败。

## Workflow

### 1. Run ARGO HARNESS Init

执行：

```powershell
node .argo/scripts/ensureArgoHarnessEnvironment.js
```

如用户只要求只读检查、不允许修改工作区或不想执行初始同步，则改为：

```powershell
node .argo/scripts/ensureArgoHarnessEnvironment.js --check-only
```

### 2. Interpret The Report

读取脚本输出的 JSON，并关注：

- `bootstrap`
- `mcp`
- `systemArchitecture`
- `neo4j`
- `reportPath`

如果脚本输出 `status=ok`，说明 ARGO HARNESS 环境已准备完成或已确认健康。

如果脚本输出 `status=failed`，必须指出失败位于哪一个阶段：

- workspace bootstrap
- Argo MCP protocol health
- canonical SystemArchitecture validation
- Neo4j connectivity
- Neo4j initial sync / verification

### 3. Report Concisely

输出应直接说明：

- 是否需要并执行了 bootstrap
- `argo` MCP 是否正常
- `SystemArchitecture.json` 是否正常
- Neo4j 是否连通
- 是否完成了一次初始同步
- 报告文件位置

## Output

输出必须包含：

### 1. Environment Status
- overall status: ok / failed
- whether bootstrap was executed
- whether Argo MCP health passed
- whether Neo4j health passed

### 2. Sync Status
- whether initial sync was executed
- whether verification matched JSON and Neo4j
- current counts summary when available

### 3. Report Artifact
- `.argo/temp/argo-harness-init-report.json` 路径

### 4. Blocking Errors
- 若失败，列出失败阶段和关键错误摘要
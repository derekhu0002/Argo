---
description: Run tests with coverage
agent: Test
---

Call the unified `argo` MCP tool `runArchitectureTests` to execute explicit architecture-linked testcases and refresh failure records. If the MCP call times out, run `node .argo/scripts/runArchitectureTests.js` directly. Focus on addressing any failing acceptance entries reported by the runner result.
# Copilot版 Argo Harness 操作指导

>

## `Orchestrator` 工具护栏

GitHub Copilot 版通过 custom agent frontmatter 裁剪工具可见性，而不是 OpenCode 的 `permission: deny` 机制。`.github/agents/Orchestrator.md` 必须显式配置：

- `tools: [agent]`：只允许调用子 Agent，不开放 `read`、`search`、`edit`、`execute`、`web`、`todo` 等工具。
- `agents` 白名单：只允许调用 `IntentionDesign`、`ImplementationDesign`、`CodingAndReparing`。

不要省略 `tools` 字段；在 Copilot custom agent 中，省略 `tools` 通常表示默认启用所有可用工具。
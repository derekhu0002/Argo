---
title: 使用指南
date: 2026-08-07
type: pages
layout: page
---

## 快速开始

### 安装

将平台适配包与  目录复制到工作区根目录，确认 MCP 服务  可被发现：

| 版本 | 环境 | 部署内容 |
|---|---|---|
| Cursor | Cursor IDE |  +  |
| Copilot | GitHub Copilot |  +  |
| OpenCode | OpenCode |  +  |

安装后执行 ，检查 MCP 工具和 GraphRAG 就绪状态。

### 选择正确的入口

所有新需求和问题单统一先进入 **BusinessPartner**：



| 场景 | 入口 |
|---|---|
| 新需求、业务提案、缺陷 | BusinessPartner → task-tidy → 选择交付模式 |
| 架构优化 | BusinessPartner → improve-codebase-architecture → task-tidy |

### Agent Loop 全流程

ARGO 覆盖从需求分析到交付归档的整个软件周期：

1. **BusinessPartner** — 业务目标澄清、决策树拆解
2. **TaskTidy** — 决策树 → 意图架构整合
3. **Orchestrator** — 阶段调度（IntentDesign → ImplDesign → CodingRepair）
4. **双层验收** — 阶段门禁 + 最终符合性验收
5. **DeliveryArchive** — 迭代交付文档归档

### 开始前的准备

预填充业务需求、架构设计、工作包到意图架构知识图谱，使 BusinessPartner 从可验证的事实上下文开始。

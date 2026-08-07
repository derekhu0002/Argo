---
title: ARGO 原理
date: 2026-08-07
type: pages
layout: page
---

## 确定性交付公式

ARGO 的目标不是让 AI 自由发挥，而是用工程系统提高 AI 交付的确定性。背后的工程简化公式：

2353427Total Certainty = C \times \frac{(P \cdot B) \times E}{G}2353427

| 变量 | 含义 | ARGO 的做法 |
|---|---|---|
| **C** | Clarity（目标清晰度） | BusinessPartner 结构化拷问，SMART + MECE |
| **P** | Protocol（协议规范） | 意图图谱 + 架构契约 + Handoff |
| **B** | Binding Power（边界约束力） | 测试门禁 + Validator + 人类审批 |
| **E** | Efficacy（模型能效） | 聚焦子图 + 干净上下文 |
| **G** | Granularity（任务颗粒度） | 架构依赖切分 + 顺序交付 |

## 工程哲学：从让 AI 写代码到让 AI 在轨道上交付

传统 AI Coding 的不确定性来自叠加因素：需求模糊、架构散落、测试太晚、任务过大、缺少门禁。ARGO 的答案不是换一个更强模型，而是系统性改造 C、P、B、G。

## 与竞品的差异化

| 维度 | ARGO | OpenSpec | Superpowers | ECC |
|---|---|---|---|---|
| 核心目标 | 架构一致、可审计交付 | 低门槛规格协作 | 工程动作自动化 | 规模化能力供给 |
| 事实源 | ArchiMate 意图图谱 + 实现契约 | 规格文档集合 | 当前任务与 Skill | 多类配置与知识资产 |
| 架构治理 | **强** | 中低 | 中 | 中高 |
| 验收约束 | **显性 testcase + 双层验收** | 团队自行加强 | TDD/验证实践 | 工具与规则组合 |

## 为什么叫 ARGO

取意希腊神话中的**阿尔戈号（Argo）**——不是单人武器，而是一艘承载多位英雄共同远航的船。意义在于把船员、航线、目标、纪律、协作和风险应对组织成可抵达目的地的远征。

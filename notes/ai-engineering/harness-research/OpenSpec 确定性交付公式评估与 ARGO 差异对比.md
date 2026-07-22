# OpenSpec 确定性交付公式评估与 ARGO 差异对比

> 评估基准：`notes/ai-engineering/ARGO 工程哲学：确定性交付公式的工程化.md`
> 被评估项目：`D:\Projects\OpenSpec`
> 评估快照：`@fission-ai/openspec` 1.6.0，提交 `27b22ab4cbf530fa00e17f0f6b75a44d56777542`（2026-07-22）
> 评估日期：2026-07-23
> 评估方式：源码、文档、schema、skills、测试与 CI 静态取证；尝试运行 `pnpm test`，但本地未安装 `node_modules`，因找不到 `vitest` 而退出。为保持只读评估，未安装依赖。

## 1. 结论摘要

OpenSpec 是一套面向 brownfield、强调轻量协作的规格驱动框架。它以三层结构把自然语言意图转成可归档工程资产：

1. Markdown 规格层：`proposal.md`、delta specs、`design.md`、`tasks.md`；
2. CLI 确定性引擎：artifact DAG、解析、校验、delta 合并、归档和 JSON 契约；
3. Agent 行为层：`propose`、`apply`、`verify`、`archive` 等 skills。

按 ARGO 的工程简化公式：

$$Total\ Certainty = C \times \frac{(P \cdot B) \times E}{G}$$

OpenSpec 的优势集中在 **P（协议规范）**、**C（目标清晰度）** 和 **G（任务颗粒度）**：它把“先对齐、再实现”物化为版本化 change folder，以 delta spec 表达行为变化，以 schema 定义 artifact 依赖，并用 CLI 校验规格结构、合并变更和保存历史。

主要短板集中在 **B（边界约束）** 和递归可靠性：artifact 的 `done` 主要由文件存在推导；默认 `verify` 不在 core profile 中，且通过关键词搜索和合理推断判断实现符合性；任务、需求、代码和测试之间没有稳定 ID 链；归档允许确认后带未完成任务继续，也存在 `--no-validate` 等逃逸口。因此，它能较好地保证“规格资产有形、格式可检、历史可追”，但不能单独保证“实现已经被机械证明符合规格”。

综合评分为 **2.65 / 4.00（中等偏上）**。该分数表示 OpenSpec 已是一套成熟的轻量 SDD 协作层，并不表示 OpenSpec 曾宣称提供形式化验证或完整确定性交付。由于 **B 与递归自愈均低于 3 分**，不建议把 OpenSpec 单独标称为对齐 ARGO 的高确定性交付系统。

## 2. 评估口径

### 2.1 ARGO 核心判断

ARGO 认为确定性来自系统，而不是单次模型聪明回答。评估重点不是被评框架是否复刻 ARGO 的文件名或 Agent 名，而是它是否具有功能等价机制：

- **C**：模糊愿望是否在编码前成为可验证、可拆解目标；
- **P**：是否存在可传递、可校验、可回归的合法轨道；
- **B**：偏航时能否判、拦、纠，且软协议失效后仍有硬护栏；
- **E**：是否通过稳定上下文和可导航架构释放模型有效能效；
- **G**：是否降低单次任务搜索空间和上下文混合度；
- **递归可靠性**：子任务是否局部闭环后才向父任务传递；
- **人类校准**：人类是否在目标、边界和价值判断处承担固定职责。

### 2.2 评分方法

每个维度采用 0–4 分：

- 0：缺失或反模式；
- 1：名义存在，主要依赖提示或自觉；
- 2：部分可验证，但闭环或硬门禁不足；
- 3：形成系统闭环，有稳定资产和可执行约束；
- 4：可度量、可回归，并能在上下文恶化时自动补偿。

权重采用：C 15%、P 15%、B 20%、G 20%、E 10%、递归可靠性 10%、人类校准 10%。分数用于结构化比较，不代表公式中的因子已被数学测量。

## 3. OpenSpec 的确定性交付机制

### 3.1 三层架构

OpenSpec 不是单一状态机，而是“Agent 生成与执行 + CLI 机械校验 + Git 资产留存”的组合：

```text
Agent skills
  propose / apply / verify / archive
                 │
                 ▼
OpenSpec CLI
  status / instructions / validate / archive
                 │
                 ▼
openspec/
  specs/ + changes/ + changes/archive/
```

CLI 层相对确定：解析 Markdown、计算 DAG 状态、输出 JSON、校验 delta、合并主规格、移动归档目录。Agent 层仍是概率性的：实际撰写规格、修改代码、搜索实现证据和判断设计一致性。

### 3.2 主交付路径

默认工作流为：

```text
/opsx:explore（可选）
  → /opsx:propose
  → 人类审阅 proposal/specs/design/tasks
  → /opsx:apply
  → /opsx:verify（expanded profile，可选）
  → /opsx:archive
```

`docs/overview.md:10-26` 把 `specs/` 定义为当前行为真值，把一个 change 定义为工作单元，并以 delta spec 描述变化；`docs/overview.md:63-71` 又明确 artifacts 是 enablers 而不是强 gate。这个取向提高了迭代流动性，但也把阶段纪律交还给人和 Agent。

### 3.3 Artifact DAG

`schemas/spec-driven/schema.yaml:4-191` 定义默认依赖：

```text
proposal ──► specs ──┐
    └──────► design ─┴──► tasks ──► apply
```

它明确区分 why、what、how 和 steps，并规定：

- proposal 必须识别新增或修改的 capability；
- specs 描述可观察行为，每个 requirement 至少有 scenario；
- design 记录决策、替代方案、风险和迁移；
- tasks 按依赖排序，且小到可在一个 session 内完成。

这是 OpenSpec 对 P、C、G 的核心贡献。但状态实现把“文件存在”视为 artifact 完成，不能证明内容已经足够完整或正确。

### 3.4 Delta 与归档闭环

OpenSpec 用 ADDED、MODIFIED、REMOVED、RENAMED 描述行为变化。归档时将 delta 合并进主规格，再保留完整 change 历史。该机制非常适合 brownfield：

- 不要求先完整描述整个现有系统；
- 变更范围可独立审阅；
- 主规格随归档更新为新真值；
- proposal、design、tasks 和 delta 作为决策历史保留。

这是 OpenSpec 最接近 ARGO“稳定事实资产”的部分，但它的事实源仍主要是文本文档，不是带领域关系、验收归属和阶段权限的结构化意图图谱。

## 4. 按 ARGO 维度评分

### 4.1 C：目标清晰度 — 3.0 / 4

**正向机制**

- `README.md:140-147` 将 `/opsx:explore` 作为模糊需求的可选入口；
- `docs/reviewing-changes.md:9-19` 要求人在 propose 后、apply 前审阅计划；
- `docs/writing-specs.md:21-48` 要求 requirement 可观察、单一、可交给测试者判断，并用 scenario 覆盖关键案例；
- proposal、specs、design、tasks 将 why、what、how、steps 分离。

**限制**

- explore 是可选项，没有强制业务拷问或 MECE 决策闭合；
- `/opsx:propose` 可以一次生成全部规划资产，质量取决于输入和模型；
- 清晰度沉淀在 change 级 Markdown，缺少跨 change 的领域关系和结构化决策树；
- “同一 intent 是否已经足够清晰”主要由人类审阅，而非机器可判条件决定。

**判断**

OpenSpec 能显著优于直接从聊天进入编码，但其 C 是“文档化和人工审阅驱动”，还不是 ARGO 式长期意图事实源驱动。

### 4.2 P：协议规范 — 3.0 / 4

**正向机制**

- `schemas/spec-driven/schema.yaml` 定义 artifact 图、模板、依赖和 apply 前置资产；
- `skills/openspec-propose/SKILL.md:45-87` 要求 Agent 读取 CLI JSON、按依赖构建完整 artifact 闭包，并从磁盘重读依赖；
- `docs/agent-contract.md` 文档化 status、instructions、validate、archive 等机器接口及退出码；
- `openspec validate --strict` 能将 warning 升格为失败；
- 自定义 schema、project context 和 per-artifact rules 可版本化组织协议。

**限制**

- `docs/agent-contract.md:127-138` 自述 snake_case/camelCase、envelope 类型、version 字段等已知不一致；
- 协议主要控制 artifact 形态与 CLI 行为，不控制产品代码修改权限；
- 没有意图→实现→编码的强类型 handoff，也没有实现架构契约的专门所有权；
- 自定义 schema 可强化流程，也可弱化流程，核心不提供统一的高确定性下限。

**判断**

OpenSpec 的 P 已经是可安装、可版本化、可机读的工程协议，不只是提示词集合；但其协议范围止于规格协作和 CLI 资产，不覆盖完整实现治理。

### 4.3 B：边界约束力 — 2.0 / 4

**正向机制**

- validator 检查 requirement、scenario、规范词、delta 类型和冲突；
- artifact graph 拒绝重复 ID、无效依赖和环；
- archive 在正常路径中先校验 delta，再合并主规格；
- `skip_specs` 对无行为变化的 change 提供显式标记并有专门校验；
- JSON 诊断提供 code、path、message 和 fix，方便 Agent 纠错。

**限制**

- `docs/workflows.md:297-305` 明确 verify 不阻断 archive；
- `skills/openspec-archive-change/SKILL.md:35-52` 允许人确认后带不完整 artifact 或 task 继续归档；
- CLI 归档支持 `--no-validate`、`--yes` 等绕过或确认路径；
- `allowed-tools` 是预授权声明，不是限制 Agent 只能调用 OpenSpec；
- 阶段之间没有“谁能修改规格、设计、测试和代码”的权限矩阵；
- 默认 core profile 不含 verify，实现符合性缺少强制门禁。

**判断**

OpenSpec 有强规格格式边界，但实现交付边界偏软。它能“发现并提示”很多问题，却不总能“阻断并回流”。

### 4.4 G：任务颗粒度 — 3.0 / 4

**正向机制**

- `docs/writing-specs.md:61-76` 要求一个 change 只有一个可用一句话表达的 intent；
- `schemas/spec-driven/schema.yaml:150-187` 要求 task 小到一个 session 可完成、按依赖排序且可验证；
- change folder 是独立工作单元，支持多个变更分开管理；
- delta 模型避免为局部修改加载完整系统规格。

**限制**

- `skills/openspec-apply-change/SKILL.md:70-93` 默认循环执行所有 pending tasks，直到完成或阻塞，单次 apply 仍可能很宽；
- task 只要求“一 session 可完成”，没有 2–5 分钟级或最小可验收单元的硬标准；
- 文档鼓励 parallel changes，隔离主要依赖 change folder 和操作者纪律；
- tasks 与 requirement 没有机器可检的 ID 对应。

**判断**

OpenSpec 对 feature/change 级分治成熟，但对执行步长和会话隔离的控制弱于 ARGO。

### 4.5 E：模型有效能效 — 2.5 / 4

**正向机制**

- Agent 可通过 `status`、`instructions` 和 `instructions apply` 获取结构化上下文；
- apply skill 必须读取 CLI 返回的全部 context files，而不是依赖聊天记忆；
- proposal/specs/design/tasks 分层减少模型同时处理全部问题的负担；
- Stores 可把跨仓库共享规格带入上下文，尽管仍处 beta。

**限制**

- 主要事实仍是 Markdown，模型需要自行理解和搜索；
- verify 依赖关键词与合理推断，可能产生假阳性和假阴性；
- reference index 有 50KB 截断边界；
- 没有代码架构 seam、依赖方向、接口级测试等持续架构卫生机制；
- README 仍建议使用高推理模型并保持 clean context，表明 E 对模型与会话纪律依赖明显。

**判断**

OpenSpec 改善了上下文组织，但它不是执行工具接管型 harness，也不直接治理代码架构可导航性。

### 4.6 递归可靠性与自愈 — 2.0 / 4

**正向机制**

- artifact DAG 保证后续资产能读取前置资产；
- task checkbox 提供局部进度；
- apply 遇到歧义、设计问题或阻塞时要求暂停；
- verify 从 completeness、correctness、coherence 三维发现偏差；
- archive 将 change 历史保留下来，支持事后追踪。

**限制**

- requirement→task→code→test 没有稳定 trace ID；
- task 完成主要由 checkbox 表示，未绑定测试证据；
- `skills/openspec-verify-change/SKILL.md:149-156` 明确使用启发式，并在不确定时降低严重级别；
- 无冻结测试制度，tasks 和 artifacts 在实现中可随时修改；
- 没有按问题归属自动回流到 intent、design 或 coding 阶段；
- 子任务未达到近似可靠状态仍可继续或归档。

**判断**

OpenSpec 具有 artifact-driven convergence，但未形成 ARGO 式“子节点局部自愈后才允许上传”的递归门禁。

### 4.7 人类校准 — 3.0 / 4

**正向机制**

- `docs/reviewing-changes.md` 明确把计划审阅和代码审阅作为两个关键时点；
- 归档、同步和不完整任务处理都设计了人工确认；
- 人类负责 intent、scope、关键 scenario 和是否接受 warning；
- 流程允许人随时修改 artifact，使真实学习能反馈到规格。

**限制**

- 固定校准点主要是文档约定，不是不可绕过的审批记录；
- 没有专门审核人、签名、审计状态或验收所有权；
- 高风险与低风险 change 使用同一基础模型，风险分级主要靠团队自觉。

**判断**

OpenSpec 正确承认人是协议的一部分，但人类校准尚未被物化成强审计资产。

## 5. 加权结果

| 维度 | 得分 / 4 | 权重 | 加权贡献 |
| --- | ---: | ---: | ---: |
| C 目标清晰度 | 3.0 | 15% | 0.45 |
| P 协议规范 | 3.0 | 15% | 0.45 |
| B 边界约束 | 2.0 | 20% | 0.40 |
| G 任务颗粒度 | 3.0 | 20% | 0.60 |
| E 模型有效能效 | 2.5 | 10% | 0.25 |
| 递归可靠性 | 2.0 | 10% | 0.20 |
| 人类校准 | 3.0 | 10% | 0.30 |
| **总计** |  | **100%** | **2.65 / 4.00** |

评分的关键不是 2.65 这个小数，而是结构：OpenSpec 的 C/P/G 已形成成熟机制，B 和递归可靠性是决定其无法单独承担高确定性交付的短板。

## 6. 三大定律专项判断

### 6.1 约束代偿定律：部分符合

OpenSpec 用 validator、DAG、JSON contract 和 archive merge 增加 B，能够补偿部分自然语言协议衰减。但当 Agent 忽略 skill、verify 未启用、上下文过长或实现搜索失真时，没有自动加强的测试、hook、权限或冻结资产接管。它的硬约束集中在规格文件，不覆盖实现真值。

### 6.2 分母主导定律：较好符合

一个 change 一个 intent、delta spec、可验证 task、按依赖排序，均能降低 G。不足在于 apply 默认可以连续完成整个 tasks.md，且任务粒度没有可机检上限。OpenSpec 控制的是“变更包大小”，不是每个模型采样步长。

### 6.3 递归自愈定律：部分符合

Artifact DAG 和任务清单提供了递归骨架，verify 和 archive 提供末端检查。但没有测试证据绑定、冻结验收、阶段责任回流或父任务准入条件。子任务状态更接近“声明完成”，而非“被独立证明确认”。

## 7. 关键优势

1. **Brownfield delta 模型实用。** 用差量描述变化，避免先完整规格化遗留系统。
2. **CLI 是 Agent 的轻量类型系统。** JSON instructions、status、validate 和 diagnostics 减少自由生成空间。
3. **Artifact DAG 清楚。** why、what、how、steps 的职责分离有助于控制上下文熵。
4. **归档形成长期历史。** 变更原因、设计、任务和规格变化可在 Git 中共同审阅。
5. **跨工具可移植。** 通过生成 skills/commands 支持多种 AI 工具，而不绑定单一模型或 IDE。
6. **扩展面成熟。** 项目配置、自定义 schema、模板和 community schema 使团队可按风险增强流程。
7. **自身 dogfood 程度较高。** 仓库维护大量 live specs、changes 和 archive，说明模型可在真实规模下运作。

## 8. 主要缺口与风险

### 8.1 Artifact 完成不等于语义完成

文件存在即可让 DAG 进入 done，会造成“空壳或低质量文档解锁后续任务”的可能。propose skill 已通过重读和遍历依赖进行补偿，但这是 Agent 协议，不是内容 validator。

### 8.2 Verify 不是机械验收

verify 通过关键词、代码路径和合理推断判断 requirement 实现与 scenario 覆盖。它适合作为审查助手，不等同于执行测试、收集覆盖或证明行为。

### 8.3 归档存在治理逃逸口

未完成任务可确认继续；verify 不阻断；CLI 可跳过 validate。灵活性符合 OpenSpec 产品哲学，但削弱了高风险场景所需的 fail-closed。

### 8.4 缺少端到端 trace

Requirement、Scenario、Task、Code、Test 没有稳定 ID 和引用关系。OpenSpec 能追踪文档包和 checkbox，不能自动回答“哪个测试证明哪个 scenario”。

### 8.5 规格与执行的确定性不对称

CLI 可确定解析与合并，Agent 仍负责写规格、改代码和判断符合性。若 Agent 不调用 CLI、误读 Markdown 或未运行测试，CLI 无法补救实现层偏差。

### 8.6 漂移治理偏检测而非修复

profile/update 和 store doctor 能报告漂移，但通常不自动同步；store ahead/behind 基于最后 fetch 的 upstream，而不是实时远端。跨仓库规格共享仍需谨慎。

### 8.7 测试与 CI 边界

仓库有广泛 Vitest 测试和多平台 CI，但未发现 coverage threshold，也未在 CI 中对自身 `openspec/` 强制运行 `openspec validate --all --strict`。行为模板 parity 测试能防文本漂移，却不能证明真实 LLM 会遵循模板。

## 9. 与 ARGO 的核心差异

| 维度 | OpenSpec | ARGO |
| --- | --- | --- |
| 根本定位 | 轻量、fluid、brownfield-first 的规格协议层 | 强阶段、强契约、强门禁的确定性交付治理系统 |
| 当前真值 | `openspec/specs/` Markdown | 结构化意图图谱 + 实现架构契约 + 测试资产 |
| 变更表达 | change folder + delta spec | 意图元素/关系 mutation + 阶段 handoff |
| 流程观 | Actions, not phases；依赖是 enabler | 阶段职责隔离；问题按归属回流 |
| 实现入口 | Agent 读取 tasks 后连续 apply | 实现设计完成并交接后进入 coding/repair |
| 验收 | 可选 Agent verify + 人工判断 | 前移 testcase、冻结测试、双层验收 |
| 边界 | 规格格式与 CLI 操作较硬，实现边界较软 | 意图、实现、代码和测试所有权均受控 |
| 追踪 | change 历史与 task checkbox | intent→handoff→testcase→failure→repair |
| 颗粒度 | change/task 级控制 | 依赖顺序、窄会话和局部自愈 |
| 人类角色 | 审阅和确认，流程可绕过 | 目标、边界、依赖顺序和验收的固定校准器 |

OpenSpec 的“fluid”不是缺陷，而是产品选择。它优化的是低摩擦协作和迭代真实性；ARGO 优化的是高风险交付中阶段越权和错误传导的可控性。两者不应仅按流程多少比较，而应按风险场景选型。

## 10. 对 ARGO 的启发

1. **引入 delta intent 表达。** 对 brownfield 局部变化，可借鉴 ADDED/MODIFIED/REMOVED/RENAMED，降低完整图谱 mutation 的认知成本。
2. **提供稳定的 Agent JSON contract。** `status`、`instructions`、diagnostic code、exit code 等机器接口适合减少 Agent 猜测。
3. **把 schema DAG 开放为扩展面。** 在不削弱核心阶段下限的前提下，可让不同项目声明额外 artifact 和依赖。
4. **归档 change package。** 将 why、what、how、tasks、验收和最终 trace 作为同一审计包保存。
5. **保留轻量路径。** 对纯文档、工具或低风险 refactor，可显式声明不改变行为，避免强行制造业务 testcase。
6. **强化文档 dogfooding。** vocabulary sweep、模板 parity 和文档单一来源等机制值得吸收。

## 11. OpenSpec 的 ARGO 化建议

若希望在保留 OpenSpec 轻量体验的同时提高确定性，可按优先级增加：

1. **引入风险 profile。** `core` 保持 fluid；新增 `assured` profile，默认启用 strict validate、verify、test evidence 和 fail-closed archive。
2. **建立稳定 trace ID。** Requirement/Scenario/Task/Test 使用可机器校验的引用，archive 前检查闭包。
3. **把 verify 分成静态审查与执行证据。** Agent 启发式报告保留，同时要求关联测试命令、退出码和覆盖结果。
4. **内容级 artifact gate。** `done` 不只看文件存在，还运行对应 schema/content validator。
5. **冻结验收边界。** apply 开始后，scenario 和验收测试变更必须显式回到 planning review，而不能静默修改。
6. **问题归属回流。** verify finding 标记为 intent、spec、design、task、code 或 environment，并路由到相应修复动作。
7. **收紧高风险归档。** assured profile 禁止 `--no-validate`、禁止未完成 task、禁止 critical finding、要求 test evidence。
8. **在 CI dogfood 自身规格。** 增加 `openspec validate --all --strict`，并为关键 parser/merge 路径设置 coverage gate。

## 12. 适用场景与组合建议

### 适合单独使用 OpenSpec

- 小中型项目需要比聊天更稳定、但不希望引入重型治理；
- brownfield 需求频繁变化，重点是记录行为差量和决策历史；
- 团队愿意人工审阅 proposal/specs/tasks，并已有可靠 CI；
- 多种 coding assistant 需要共享同一规格语言。

### 不宜单独承担

- 安全、支付、合规、不可逆迁移等高风险核心业务；
- 需要 requirement→test→code 的审计追踪；
- 需要阶段权限、冻结验收和自动责任回流；
- 多仓库事实源必须实时一致且不能依赖人工同步。

### 组合建议

- **OpenSpec + Superpowers**：OpenSpec 管 why/what 和 change 历史，Superpowers 管 TDD、细粒度执行、review 和完成前验证。
- **ARGO + OpenSpec**：ARGO 作为权威意图、架构和验收治理层；OpenSpec delta/change folder 作为轻量变更提案与归档视图。必须明确唯一事实源，避免双写。
- **ARGO + OpenSpec + CI trace**：用于高风险 brownfield；OpenSpec 提供低摩擦 delta，ARGO 提供阶段门禁，CI 提供测试和追踪的机械证据。

## 13. 验证状态与复现命令

本次已执行：

```powershell
git status --short --branch
git log -1 --date=iso-strict --format="%H%n%ad%n%s"
pnpm test
```

结果：

- Git 工作树干净，分支 `main...origin/main`；
- 快照提交为 `27b22ab4cbf530fa00e17f0f6b75a44d56777542`；
- `pnpm test` 未进入测试执行：本地 `node_modules` 缺失，`vitest` 不可用。

在允许安装依赖后，建议复核：

```powershell
cd D:\Projects\OpenSpec
pnpm install --frozen-lockfile
pnpm test
pnpm exec tsc --noEmit
pnpm lint
node bin/openspec.js validate --all --strict
node bin/openspec.js validate --specs --strict --json
```

其中依赖安装会写入 `D:\Projects\OpenSpec\node_modules`，不属于本次只读评估范围。

## 14. 总体判断

OpenSpec 已经成功把“AI 写代码前先形成共同规格”从倡议变成了可安装、可扩展、可归档的工程协议。它不是弱提示词集合：delta parser、validator、artifact DAG、CLI JSON contract 和 archive merge 都提供了真实的确定性增益。

但其确定性边界必须说清楚：

> OpenSpec 能较强地保证规格变更被组织、校验和归档；不能单独保证产品实现已通过机械证据满足这些规格。

从 ARGO 视角，它最适合作为 **轻量规格与变更协议层**，而不是完整的高确定性交付控制系统。若与测试证据、trace ID、fail-closed profile 和阶段回流结合，它可以成为 ARGO 前链路或 brownfield change view 的高价值组成部分。

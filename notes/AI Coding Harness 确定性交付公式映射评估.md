# AI Coding Harness 确定性交付公式映射评估

本文基于 `docs/影响 AI 成功交付的第一性原理：从概率滑行到确定性收敛.md` 中的递归任务树交付公式，对本项目构建的 AI Coding Harness 系统进行结构化评估：

$$TC_{node} = \left[ C \times \frac{(P \cdot B) \times E_{sys}}{G} \right] \cdot \prod_{j \in Children} (TC_j)^{d_j}$$

评估对象是当前仓库中的 Superpowers harness：以 `skills/` 为行为内核，通过各平台插件、bootstrap 注入、tool mapping、hooks、流程技能、测试与 PR 约束，构成一套面向 coding agent 的确定性交付系统。

## 评估结论

Superpowers 的核心设计不是“提示词增强”，而是把 AI coding 过程改造成一个受控系统：先用 bootstrap 把 agent 拉入固定方法论，再用 skills 把意图澄清、任务分解、测试、审查、验证、收尾等环节逐层管道化。

按公式看，本项目对 `P`、`B`、`G` 和递归 `TC` 的工程化最强：

- `P` 的强度来自 mandatory skills、hard gate、PR 规则和跨 harness 不变量。
- `B` 的强度来自 TDD、systematic debugging、verification-before-completion、SDD reviewer loop、hooks 和测试。
- `G` 的强度来自 brainstorming 到 writing-plans 的任务收敛，以及 2-5 分钟任务粒度。
- `\prod TC` 的强度来自 subagent-driven development 中的“每任务实现、每任务审查、最终整枝审查”。

相对较弱或需要持续治理的是 `C` 与 `E_sys`：

- `C` 高度依赖 agent 是否真正执行 brainstorming、是否得到用户批准、以及 spec 是否被认真审阅。
- `E_sys` 受 harness 能力差异影响明显；不同平台的 skill invocation、subagent、todo、hooks、Windows shell 支持存在降级路径或失效风险。

整体判断：这是一个偏“控制论 harness”的系统，已经把 AI 交付的不确定性从单次模型输出，转移到可审计的流程节点、工具边界和递归验证链上。

## 公式因子解释

### `C`：意图晶体化

`C` 衡量初始意图是否从模糊语义云坍缩为可执行的本体坐标。在本项目中，它主要对应需求澄清、设计确认、spec 文档、问题陈述和 human review。

典型证据：

- `skills/brainstorming/SKILL.md`
- `README.md`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `CLAUDE.md`

### `P`：规则管道化

`P` 衡量系统是否提前规定轨道，使不符合流程和质量约束的路径从一开始就被降权。本项目中的 rules、skills、tool mapping、PR 模板、harness porting invariants 都属于 `P`。

典型证据：

- `skills/using-superpowers/SKILL.md`
- `docs/porting-to-a-new-harness.md`
- `skills/test-driven-development/SKILL.md`
- `skills/writing-plans/SKILL.md`
- `CLAUDE.md`

### `B`：闭环绑定力

`B` 衡量系统“判、拦、纠”的硬度。本项目把错误纠偏分布在 TDD、debugging、verification、reviewer loop、hook 注入、测试和贡献规则中。

典型证据：

- `skills/test-driven-development/SKILL.md`
- `skills/systematic-debugging/SKILL.md`
- `skills/verification-before-completion/SKILL.md`
- `skills/subagent-driven-development/SKILL.md`
- `docs/testing.md`

### `E_sys`：系统能效杠杆

`E_sys` 衡量模型原生能力与工具接管能力的乘积。本项目通过 native skill、file read/write/edit、shell、subagent、todo、web fetch、harness-specific tool mapping，把概率性推理迁移到确定性工具和平台能力上。

典型证据：

- `docs/porting-to-a-new-harness.md`
- `skills/using-superpowers/references/*-tools.md`
- `.cursor-plugin/plugin.json`
- `.codex-plugin/plugin.json`
- `.opencode/plugins/superpowers.js`
- `.pi/extensions/superpowers.ts`

### `G`：颗粒度分治

`G` 是任务搜索空间与自回归误差的规模。Superpowers 的核心做法是强迫任务从 idea 进入 design，再进入 plan，再拆成 2-5 分钟任务，并在每个小任务上独立验证。

典型证据：

- `skills/brainstorming/SKILL.md`
- `skills/writing-plans/SKILL.md`
- `skills/subagent-driven-development/SKILL.md`
- `skills/using-git-worktrees/SKILL.md`

### `\prod (TC_j)^{d_j}`：递归依赖传导

该项衡量子任务确定性如何向父任务传导。Superpowers 的 SDD 流程把每个 task 当作可验收的叶子节点，并用 task reviewer 与 final branch reviewer 防止局部不确定性污染整体交付。

典型证据：

- `skills/subagent-driven-development/SKILL.md`
- `skills/requesting-code-review/SKILL.md`
- `skills/finishing-a-development-branch/SKILL.md`
- `RELEASE-NOTES.md`

## 系统组成映射

### 1. Skills Library：行为内核

对应因子：`P`、`B`、`G`、`\prod TC`

实际机制：

`skills/` 是 Superpowers 的行为源代码，而不是普通说明文档。`docs/porting-to-a-new-harness.md` 明确规定 skills 必须 harness-agnostic：skill 正文描述“读文件、调用 skill、派发 subagent、创建 todo”这类动作，而不绑定 Claude Code、Cursor、OpenCode 或 Pi 的具体工具名。这样做的结果是，交付方法论只有一个中心版本，各 harness 只负责把动作翻译成本地工具。

具体到公式，skills 首先提供 `P`。例如 `brainstorming` 规定写代码前必须澄清需求并获得设计批准，`writing-plans` 规定计划必须包含 exact file paths、测试命令和预期输出，`test-driven-development` 规定不能先写生产代码，`verification-before-completion` 规定没有 fresh verification evidence 就不能声称完成。这些规则提前改变了模型的可选路径：它不再面对“直接写代码、先解释、先猜测、先实现”等开放空间，而是在每个阶段被导向少数合规动作。

skills 也提供 `B`，因为它们不是只定义“应该做什么”，还定义“偏离时如何纠偏”。TDD 的纠偏是：测试没先失败就不能写实现；verification 的纠偏是：没跑完整命令就不能宣布完成；systematic debugging 的纠偏是：没有根因不能提出 fix；receiving-code-review 的纠偏是：不能表演式接受评审意见，必须验证。这里的 `B` 不是单点检查，而是分布在任务生命周期各阶段的多重闸门。

skills 对 `G` 的贡献来自把大任务拆成可认知、可验证的小阶段。没有 skills 时，agent 很容易把“做一个功能”当成一次长程生成；有 skills 后，它先进入 design，再进入 plan，再进入 task，再进入 test cycle，每次生成距离更短，RoPE 衰减和上下文漂移的影响也更小。

skills 对 `\prod TC` 的贡献来自跨 task 的契约意识。尤其是 `writing-plans` 和 `subagent-driven-development` 要求任务有接口、约束、review、ledger 和最终整枝审查，避免一个子任务的隐性偏差在后续任务中被放大。

失效模式：

- 如果某个 harness 只安装了 skill 文件但没有 bootstrap，skills 不会被主动调用，`P` 基本不存在。
- 如果 agent 读了 skill 但把硬性要求当建议执行，`B` 会从“拦截器”退化成“提示语”。
- 如果修改 skill 文案时没有 eval，可能削弱原来经过调优的行为约束，导致 `P` 和 `B` 同时下降。

### 2. `using-superpowers` Bootstrap：会话级引力场

对应因子：`P`、`B`、`E_sys`

实际机制：

`using-superpowers` 是系统的启动协议。它告诉 agent：在任何响应、澄清、探索或编码前，都必须判断是否有 relevant skill；只要有 1% 可能适用，就必须加载并遵循。`docs/porting-to-a-new-harness.md` 把它定义为集成的核心：bootstrap 必须在每个 session start 自动注入，否则 skill 文件只是静态资产。

它映射到 `P`，因为它在任务开始前就改变了模型的轨道。普通 coding agent 接到“加一个功能”时，默认路径可能是扫描代码、直接编辑、跑测试；加载 bootstrap 后，默认路径变成“先检查 skill”。这相当于在高维语义空间的起点放置一个强重力锚点，让后续 token 生成更可能落入 Superpowers 流程。

它映射到 `B`，因为 bootstrap 本身承担第一层拦截：当 agent 想跳过 brainstorming、TDD 或 verification 时，`using-superpowers` 中的 red flags 会把这种想法标记为 rationalization。这个拦截不是等代码写坏后才发生，而是在“准备行动”的瞬间发生。

它也映射到 `E_sys`，因为 bootstrap 通常带有 tool mapping。对 OpenCode，`.opencode/plugins/superpowers.js` 内联了 `todowrite`、`task`、`skill`、`read`、`apply_patch`、`bash` 等映射；对 Pi，`.pi/extensions/superpowers.ts` 说明没有 Claude Code 的 `Skill` 工具时如何用 native skill 或 read fallback。也就是说，bootstrap 不仅给出规则，还给出规则如何被工具执行。

失效模式：

- session-start 没注入：agent 不知道必须使用 skills，整个系统退化为普通提示词工程。
- 注入了但重复注入：上下文成本升高，甚至干扰模型注意力。
- 注入了但 tool mapping 错误：agent 知道要做什么，却调用不存在或错误的工具，`E_sys` 下降。

### 3. Per-Harness Plugin Manifests：跨平台承载层

对应因子：`E_sys`、`P`

实际机制：

Manifest 是 Superpowers 从仓库内容变成 harness 能加载的安装物的入口。`.cursor-plugin/plugin.json` 显式声明 `skills: "./skills/"` 与 `hooks: "./hooks/hooks-cursor.json"`；`.codex-plugin/plugin.json` 声明 skills 并提供 Codex marketplace interface；`.claude-plugin/plugin.json` 依赖 Claude Code 对 `skills/` 和 `hooks/hooks.json` 的约定发现；`package.json` 则把 OpenCode 的 main 指向 `.opencode/plugins/superpowers.js`，并为 Pi 声明 extension 和 skills。

它映射到 `E_sys`，因为不同 harness 的能力不是自然等价的。Manifest 把同一套 skill 内容接入不同运行时：Cursor 通过 plugin manifest 找到 hooks；OpenCode 通过 JS plugin 注册 skills 路径并 transform messages；Pi 通过 extension API 的 `resources_discover` 和 `context` 事件注入。这些机制决定了外部工具是否能接管模型工作。

它也映射到 `P`，因为 manifest 是规则管道进入平台的物理入口。若 manifest 没声明 skills，agent 无法发现技能；若没声明 hook 或 extension，bootstrap 不会自动进入上下文；若 marketplace 元数据错误，用户无法通过 harness 自己的安装机制获得正确系统。

失效模式：

- Manifest 指向旧路径：skills 或 hooks 安装后不可达。
- 某 harness 的平台能力变化但 manifest 未更新：文档看似支持，实际 session 不触发。
- 新 harness 通过手工复制文件接入：违反 `docs/porting-to-a-new-harness.md` 的 install-mechanism 原则，无法保证每会话生效。

### 4. Tool Mapping：工具确定性外包

对应因子：`E_sys`、`P`、`B`

实际机制：

Superpowers 的 skills 故意不写死工具名，而是写“invoke a skill”“dispatch a subagent”“read a file”“run shell commands”等动作。Tool mapping 负责把这些动作翻译成本地 harness 的真实工具。例如 OpenCode 映射到 `skill`、`task`、`read`、`apply_patch`、`bash`；Pi 映射到 native skill、`read`、`write`、`edit`、`bash`，并说明没有 subagent 或 todo 工具时如何降级。

它映射到 `E_sys` 的原因最直接：模型擅长生成候选路径，但不擅长保证事实。读文件、写 patch、执行测试、生成 diff、派发 reviewer、维护 todo 都是外部工具对概率推理的接管。工具越明确，模型需要“猜”的部分越少。

它映射到 `P`，因为 tool mapping 也规定了允许的动作词汇。比如 skill 要求“dispatch a subagent”，mapping 告诉 agent 具体用什么工具以及缺失时如何处理，而不是让 agent 幻觉一个 `Task` 或 `subagent` 调用。这样，流程规则不会因平台差异而变成模糊建议。

它映射到 `B`，因为所有判定与纠偏最终都要落到工具：TDD 要跑测试，verification 要看 exit code，review 要读 diff，debugging 要收集证据。如果 mapping 错误，纠偏闭环会在执行层断裂。

失效模式：

- Mapping 缺失：agent 按 Claude Code 习惯调用不存在的工具。
- Mapping 过泛：agent 知道“跑测试”，但不知道该用 shell、IDE test runner 还是 harness command。
- 降级路径不清：没有 subagent 时，agent 可能伪造 subagent 已执行，导致 `\prod TC` 被虚假结果污染。

### 5. Hooks 与 Session Injection：自动触发机制

对应因子：`P`、`B`、`E_sys`

实际机制：

Hooks 把 bootstrap 从“用户手动提示”变成“系统自动注入”。`hooks/hooks-cursor.json` 注册 `sessionStart` 并调用 `./hooks/run-hook.cmd session-start`；`hooks/session-start` 读取 `skills/using-superpowers/SKILL.md`，然后根据环境变量输出 Cursor 的 `additional_context`、Claude Code 的 `hookSpecificOutput.additionalContext` 或 SDK 标准的 `additionalContext`。

它映射到 `P`，因为自动注入让规则不依赖用户记忆。源公式中的 `P` 是“空间的曲率预设”，关键在“预设”：规则必须在 agent 开始滑行前进入上下文。Hook 正是把规则放到第一秒的机制。

它映射到 `B`，因为 session injection 是第一道拦截点。没有 hook，agent 可能在看见用户需求后立即进入文件编辑；有 hook，agent 先接收到“必须检查 skills”的控制指令。

它映射到 `E_sys`，因为 hook 本身是 harness 提供的外部能力。Shell-hook 形态依赖平台能执行脚本并读取 JSON stdout；in-process plugin 形态依赖 message transform 或 context callback；instructions-file 形态依赖 harness 自动加载 context 文件。

失效模式：

- JSON 字段名错误：注入内容被 harness 忽略。
- 同时输出多个字段：Claude Code 可能重复读取，造成双注入。
- Windows 缺 bash 或 wrapper 失败：hook 可能静默跳过。
- 平台没有真正的 session-start event：配置看似存在，实际不能把内容写进模型上下文。

### 6. Brainstorming：意图晶体化入口

对应因子：`C`、`P`、`G`

实际机制：

`brainstorming` 要求 agent 先探索项目上下文，再一次只问一个澄清问题，随后提出 2-3 个方案，分节呈现设计，并在设计被用户批准前禁止实现。它还要求写出设计文档并进行自检：扫描 placeholder、矛盾、范围和歧义。

它映射到 `C`，因为 `C` 的本质是把“我想做个东西”这种主观语义云压缩成客观设计坐标。Brainstorming 的问题不是为了多聊天，而是为了确定目标、约束、成功标准和非目标。设计分节确认则把用户的隐性偏好转成显性约束，减少后续实现建立在错误基准点上的概率。

它映射到 `P`，因为 hard gate 把“先设计再实现”写成流程规则。未获设计批准前不得实现，这会直接阻断常见 agent 失败路径：看到需求后马上写代码，后续再用局部 patch 修补方向错误。

它映射到 `G`，因为 brainstorming 将一个大目标拆成架构、组件、数据流、错误处理、测试等子问题。虽然这还不是 implementation task 粒度，但已经把搜索空间从“完整系统”缩小为几个可讨论的设计维度。

失效模式：

- 问题问得太宽：用户继续给出模糊答案，`C` 没有真正提升。
- 方案只给一个：失去 trade-off 比较，设计可能只是 agent 的第一反应。
- 设计未经用户批准就实现：`C` 与 `P` 同时失效，后续 `B` 只能修局部 bug，无法修方向错误。

### 7. Writing Plans：任务树成形器

对应因子：`G`、`P`、`\prod TC`

实际机制：

`writing-plans` 把已批准设计转成可执行任务树。它要求先锁定文件结构，再把任务拆成“2-5 分钟一步”的 checklist。每个 task 需要 exact file paths、Interfaces、测试代码、运行命令、预期失败、最小实现、预期通过、提交命令。新版本还要求 Global Constraints，把版本、依赖、命名、平台等跨任务约束集中写明。

它映射到 `G`，因为它直接控制单次生成步长。源公式中 `G` 是搜索空间熵值；一个任务如果写成“实现认证系统”，agent 需要同时决定数据模型、UI、API、错误处理、安全、测试，熵极高。计划把它拆成“写某个测试”“运行并确认失败”“写最小实现”等短步动作，单步搜索空间显著降低。

它映射到 `P`，因为计划把设计规则变成任务协议。比如“不要新增依赖”如果只存在于聊天历史中，后续 subagent 未必看到；写入 Global Constraints 后，每个任务和 reviewer 都被同一规则约束。Interfaces 则把跨任务契约显式化，避免 A 任务产出 `clearLayers()`，B 任务却消费 `clearFullLayers()`。

它映射到 `\prod TC`，因为父任务的确定性取决于子任务之间的契约是否稳定。计划中的 Interfaces 和 Global Constraints 是子任务向上传导前的结构性支架：每个子任务不仅要完成自己，还要产出后续任务可依赖的确定接口。

失效模式：

- 任务太大：`G` 上升，subagent 容易长程漂移。
- 计划出现 placeholder：执行者只能猜，`P` 退化。
- 接口没写清：子任务局部通过，但组合时失败，`\prod TC` 被破坏。
- 测试命令和 expected output 缺失：reviewer 无法判断是否真的验证。

### 8. Subagent-Driven Development：递归任务树执行器

对应因子：`G`、`B`、`E_sys`、`\prod TC`

实际机制：

`subagent-driven-development` 是把计划任务树落地的控制器。它要求每个 task 派发 fresh implementer subagent，implementer 完成实现、测试、提交和自检后，controller 生成 review package，再派发 task reviewer 检查 spec compliance 与 code quality。如果 reviewer 不通过，则派发 fix subagent 并重新 review。所有 task 完成后，再派发 final whole-branch review。

它映射到 `G`，因为 fresh subagent per task 限制了每个执行者的上下文和目标。子 agent 不继承主会话历史，只拿到当前 task、接口和全局约束，减少长上下文中的无关信息干扰。

它映射到 `B`，因为每个 task 都有独立 review gate。更具体地说，implementer 不能只报告“完成”，controller 要生成 diff package；reviewer 不能被 controller 预设结论，必须独立判断；Critical 和 Important finding 必须进入 fix loop；fix subagent 必须重跑覆盖测试并报告命令与输出。这就是“判、拦、纠”的完整闭环。

它映射到 `E_sys`，因为 SDD 使用了 subagent、文件化 handoff、diff package、shell 测试、model selection 和 progress ledger 等工具。尤其是 review-package 把 diff 写成文件让 reviewer 读取，避免把巨大 diff 粘进 controller 上下文，降低 token 成本和注意力污染。

它映射到 `\prod TC` 的贡献最高。每个子任务都像叶子节点：实现、测试、审查、修复后才标记完成。父节点不是盲目信任子节点“说完成了”，而是接收经过校准的 `TC_j`。最终 whole-branch review 再检查子节点组合后的整体行为。

失效模式：

- Implementer 任务上下文太宽：fresh subagent 仍可能漂移。
- Reviewer prompt 带有“不要检查 X”或预判严重性：`B` 被 controller 软化。
- 只看 implementer 报告不看 diff：把 agent 自评误当证据。
- 子任务各自通过但缺少 final branch review：组合错误可能逃逸。

### 9. TDD：行为级红绿闭环

对应因子：`B`、`P`

实际机制：

`test-driven-development` 把实现动作绑定到 RED-GREEN-REFACTOR。它要求先写一个最小行为测试，运行并确认失败原因正确，再写最小生产代码让测试通过，最后在保持测试通过的前提下重构。它还明确规定：如果先写了生产代码，必须删除，不许当参考。

它映射到 `P`，因为它规定了实现路径的合法顺序。模型不能先写一堆代码再补测试，也不能以“这个改动太小”为理由跳过测试。这个顺序本身就是协议。

它映射到 `B`，因为红绿状态提供了物理反馈。失败测试证明测试能捕获缺失行为；通过测试证明实现至少满足该行为。相比“读代码觉得对”，测试输出是更硬的判定信号。重构阶段还要求继续保持 green，防止清理代码时引入回归。

失效模式：

- 测试先通过：说明测试没有覆盖新行为，`B` 是假的。
- 测试失败原因不对：可能只是语法错误或环境错误，并未验证需求。
- 只测 mock 不测真实行为：测试通过但业务逻辑未被约束。
- 跳过 red 阶段直接 green：无法证明测试有拦截能力。

### 10. Systematic Debugging：根因定位闭环

对应因子：`B`、`G`

实际机制：

`systematic-debugging` 用于 bug、测试失败和异常行为。它的核心不是“更努力地猜原因”，而是把调试变成证据链：复现问题、收集事实、追踪根因、验证修复。它阻止 agent 根据第一眼症状直接 patch。

它映射到 `B`，因为“无根因不修复”是拦截器。很多 agent 失败来自 symptom patch：测试失败就改断言，报错就加 fallback，空值就加 guard。系统化调试要求先证明为什么发生，再决定改哪里。

它映射到 `G`，因为调试问题常常是高熵的：“功能坏了”可能来自输入、状态、依赖、异步、缓存、平台差异。调试 skill 把这个空间拆成一组较小问题：是否能复现、何处首次偏离、哪个条件触发、什么证据支持。

失效模式：

- 只修最近报错行：可能掩盖上游根因。
- 用防御式 fallback 代替根因修复：表面通过，真实错误路径仍存在。
- 没有复现步骤：无法证明修复对应原始问题。

### 11. Verification Before Completion：完成声明闸门

对应因子：`B`

实际机制：

`verification-before-completion` 是所有正向状态声明前的 gate。它要求先识别能证明声明的命令，运行完整命令，读取完整输出，确认 exit code、失败数和实际结果，然后才能说“通过”“完成”“修复”。它还明确指出 agent report、局部检查和自信都不是证据。

它映射到 `B`，因为它专门拦截交付末端最常见的漂移：代码改了，agent 觉得应该可以，于是宣布完成。这个 skill 把“完成”从语言行为变成证据行为。没有 fresh output，就不能输出成功判断。

它与 TDD 的区别在于位置不同：TDD 绑定实现过程，verification 绑定完成声明。一个任务可能写过测试，但最终声称“全部完成”前仍要重新验证当前状态，因为工作区、依赖和其他任务可能已经改变。

失效模式：

- 引用旧测试结果：无法证明当前 diff。
- 只跑局部命令却声称全局通过：声明范围超过证据范围。
- 没读完整输出：可能漏掉 warning、skipped test 或部分失败。

### 12. Worktrees 与 Branch Finishing：隔离与收束

对应因子：`B`、`E_sys`、`\prod TC`

实际机制：

`using-git-worktrees` 在进入执行前创建或使用隔离工作区，优先选择 harness 原生隔离能力，再 fallback 到 `git worktree`。`finishing-a-development-branch` 在任务完成后负责验证、呈现 merge/PR/keep/discard 等收尾选项，并清理由 Superpowers 创建的 worktree。

它映射到 `B`，因为隔离本身是护栏。agent 在独立 worktree 中实施修改，可以避免污染用户当前未提交工作；基线测试则能区分“我的改动引入失败”和“项目本来就失败”。收尾阶段要求验证后再整合，防止半成品混入主工作区。

它映射到 `E_sys`，因为 git worktree 或 harness-native worktree 是确定性工具能力：分支、目录、基线、清理都由 VCS 或 harness 执行，而不是靠 agent 记忆当前状态。

它映射到 `\prod TC`，因为多个子任务完成后必须被整合成一个可交付分支。Finishing 流程相当于父节点验收：它不是只看最后一个 task，而是把整枝状态、测试、review、PR/merge 策略一起处理。

失效模式：

- 在用户脏工作区直接改：外部变更与 agent 变更混杂，难以审查。
- 未验证基线：测试失败时无法判断责任归属。
- 清理非 Superpowers 创建的 worktree：可能破坏用户工作。
- 收尾不做整体检查：单个 task 通过但分支不可交付。

### 13. Testing 与 Evals：系统级反馈回路

对应因子：`B`、`\prod TC`

实际机制：

`docs/testing.md` 将验证分成两类：`tests/` 验证插件非 LLM 代码，例如 brainstorm server、OpenCode plugin loading、Codex sync、Kimi manifest wiring；`evals/` 验证真实 LLM session 中 agent 是否按 skills 行为执行。Release notes 说明 evals 已移到外部仓库，避免破坏插件安装。

它映射到 `B`，因为测试和 eval 是 harness 自身的纠偏系统。普通单元测试只能证明脚本或插件代码运行；behavior eval 才能证明“agent 在真实会话里会不会先触发 brainstorming、会不会遵守 TDD、会不会跳过 verification”。对一个行为塑形系统来说，后者尤其关键。

它映射到 `\prod TC`，因为 harness 的每个子系统都影响上层交付：hook 失败会影响 bootstrap，tool mapping 失败会影响 SDD，skill wording 退化会影响 TDD。测试分层让这些底层节点在向上影响整体系统前先被校准。

失效模式：

- 只跑插件测试不跑 behavior eval：只能证明“文件能加载”，不能证明 agent 行为正确。
- Eval 不在 CI 快速路径：行为回归可能直到真实用户会话才暴露。
- 新 harness 未跑 clean-session acceptance test：可能发布一个 skills 存在但不会自动触发的假集成。

### 14. PR Template 与 Contributor Rules：社会技术护栏

对应因子：`C`、`P`、`B`、`\prod TC`

实际机制：

`CLAUDE.md` 和 `.github/PULL_REQUEST_TEMPLATE.md` 把贡献流程本身也纳入 harness。它们要求 PR 说明真实问题、搜索 open 和 closed PR、证明 change 适合 core、说明 alternatives、披露模型和 harness、列出测试环境、提供 human review。新 harness 支持还必须粘贴 clean-session transcript，证明 “Let's make a react todo list” 会在写代码前触发 brainstorming。

它映射到 `C`，因为 PR 模板强迫贡献者描述“什么真实问题被解决”，而不是写“改进了质量”这类抽象动机。问题陈述越具体，后续 review 越容易判断变更是否偏题。

它映射到 `P`，因为贡献路径被明确规定：target `dev`、一个 PR 一个问题、不接受领域专用 core skill、不接受无 eval 的 skill 重写、不接受新增第三方运行时依赖。它把维护者的接受标准前置成轨道边界。

它映射到 `B`，因为模板和规则是合并前的外部拦截器。缺少 human review、缺少 eval、没有 existing PR 搜索、未披露 agent 环境，都会被拒绝。这是技术系统之外的控制环，但对最终交付确定性很关键。

它映射到 `\prod TC`，因为 PR 是所有子任务向项目主干传导的最后节点。即便代码局部正确，如果它解决的问题不真实、属于第三方插件范围、或复制了已关闭 PR 的失败路径，父节点“项目质量”仍会下降。

失效模式：

- Agent fabricated problem statement：`C` 是假的，后续修改没有真实锚点。
- 多个无关改动打包：review 无法独立判断每个子节点 `TC_j`。
- 未披露 harness/model/plugins：维护者无法评估生成环境带来的风险。

## 标准流程映射

### 阶段 1：会话启动

流程细化：

用户打开 harness 后，插件必须在 session start 自动把 `using-superpowers` 放进上下文。Shell-hook 平台通过 stdout JSON 注入，OpenCode 和 Pi 通过 in-process extension 修改 message/context，其他平台可能通过 instructions-file。随后 agent 在任何行动前被要求检查 relevant skill。

公式影响：

- `P` 被初始化：规则在任务开始前进入模型上下文，而不是在执行中途补充。
- `B` 被预装：agent 的第一反应被“先检查 skill”拦住。
- `E_sys` 被激活：tool mapping 告诉 agent 如何把抽象动作落到真实工具。

如果该阶段失败，后续所有阶段都可能不发生。也就是说，会话启动不是流程前置项，而是公式中 `P · B · E_sys` 的共同入口。

### 阶段 2：需求澄清与设计

流程细化：

`brainstorming` 先读项目上下文，再通过单问题澄清目标、边界和成功标准。随后它提出多种方案，让用户在 trade-off 中选择或修正方向。设计被分节确认后写成 spec，并进行 placeholder、矛盾、范围和歧义自检。

公式影响：

- `C` 上升：用户意图从“自然语言愿望”变成“可审阅设计”。
- `P` 上升：hard gate 禁止未批准设计进入实现。
- `G` 下降：完整目标被拆成设计维度，后续计划不再面对未分解需求。

如果该阶段做得浅，最直接的后果不是代码 bug，而是坐标系错误：后续 TDD 和 review 可能严谨地实现了错误设计。

### 阶段 3：计划编写

流程细化：

`writing-plans` 从设计中提取文件结构、全局约束和任务边界。每个 task 被写成可交给低上下文执行者的独立单元，包含文件路径、Interfaces、测试、命令、预期输出和提交步骤。

公式影响：

- `G` 大幅下降：任务从“实现功能”变成可执行微步骤。
- `P` 具体化：设计约束转写成 Global Constraints、Interfaces 和验收命令。
- `\prod TC` 得到结构支撑：子任务之间的依赖和产物边界被写明。

计划质量决定后续 SDD 的上限。若计划含糊，SDD 只是在更快地执行含糊指令；若计划精确，subagent 才能在低上下文中保持方向一致。

### 阶段 4：执行与局部验证

流程细化：

SDD 控制器读取计划，给每个 task 派发 fresh implementer。Implementer 只接收当前 task、接口和全局约束，完成实现与测试后提交报告。Controller 生成 review package，task reviewer 基于 diff 做 spec 和质量判断；不通过则派发 fix subagent 并重新 review。

公式影响：

- `G` 继续保持低位：每个 subagent 的问题空间被限定在一个 task。
- `E_sys` 上升：subagent、shell、diff file、review package 和 ledger 接管执行复杂度。
- `B` 上升：实现、测试、review、fix、re-review 形成原子自愈闭环。
- `\prod TC` 上升：每个子节点校准后才标记完成，避免未校准结果污染父任务。

这一阶段的关键不是“多 agent 并行更快”，而是“每个叶子节点都有自己的验证边界”。速度只是副作用，确定性来自边界和审查。

### 阶段 5：整体验证与收尾

流程细化：

所有 task 完成后，系统不直接宣布成功，而是进入 final whole-branch review、fresh verification 和 branch finishing。若要提交 PR，还要满足 PR template：真实问题、现有 PR 搜索、环境测试、eval、human review、新 harness transcript 等。

公式影响：

- `B` 在交付末端再次收紧：没有 fresh evidence 不能说完成。
- `\prod TC` 被整体复核：final review 检查子任务组合后的行为，而不是只看最后一个 task。
- `P` 决定交付出口：PR 规则规定什么能进入 core、什么必须拆分、什么需要 eval。

该阶段防止“局部正确但整体不可交付”。在公式中，它相当于父节点接收所有子节点结果前的最后校准。

## 风险与薄弱点

### 1. Bootstrap 是单点关键路径

如果 session-start 注入失败，skills 不会自动触发，系统会退化为普通 agent。`docs/porting-to-a-new-harness.md` 已明确把 automatic session-start injection 设为 hard requirement。

受影响因子：

- `P` 明显下降。
- `B` 的前置拦截失效。
- `C` 可能因为跳过 brainstorming 而下降。

建议：

- 对每个 harness 保留 clean-session acceptance test。
- 对 Cursor、Claude、OpenCode、Pi 等注入路径分别维护最小 smoke test。
- 在 release checklist 中显式验证 `using-superpowers` 是否进入首轮上下文。

### 2. Harness 能力差异导致 `E_sys` 不均匀

不同 harness 对 skills、subagent、todo、hooks、shell、web fetch 的支持不同。`docs/porting-to-a-new-harness.md` 已将 subagent 和 todo 视为 degradable，而 file、shell、read/write/edit 则是 essential。

受影响因子：

- `E_sys` 平台间不一致。
- SDD 等流程在能力不足的 harness 上会降级，影响 `\prod TC`。

建议：

- 为每个 harness 维护能力矩阵和降级路径。
- 对 subagent 缺失的平台，明确推荐使用 `executing-plans` 或 inline execution，并记录风险。

### 3. Skill 行为是代码，不是普通文案

`CLAUDE.md` 反复强调 skill 内容会塑造 agent 行为，修改需要 eval 证据。没有 eval 的措辞调整可能削弱 `P` 或 `B`。

受影响因子：

- `P` 可能被软化。
- `B` 可能因拦截语言变弱而下降。

建议：

- 对 skill 变更坚持 `writing-skills` 和 adversarial eval。
- 对 Red Flags、rationalization、human partner 等高敏文本避免无证据改写。

### 4. Behavior Evals 成本高且不总在 CI

`docs/testing.md` 说明 Drill scenarios 运行真实 LLM session，耗时 3-30+ 分钟，并且当前不是 CI 的一部分。Release notes 还说明 evals 已移出插件包。

受影响因子：

- 行为层 `B` 的自动化覆盖不足。
- `\prod TC` 在跨版本行为回归上依赖人工选择性验证。

建议：

- 建立快速 smoke eval 与慢速 full sweep 的分层。
- 对新 harness、bootstrap、tool mapping、core skill 改动强制运行对应 eval。

### 5. 文档与实现可能漂移

Release notes 已出现状态变化，例如 Codex v6.1.0 不再提供 SessionStart hook，Gemini CLI support 已移除。部分旧文档或文件仍可能保留历史引用。

受影响因子：

- `P` 可能因过期文档误导 porting 或贡献流程。
- `E_sys` 可能因 harness 状态判断错误而下降。

建议：

- 以代码和最新 release notes 为准。
- 为 `docs/porting-to-a-new-harness.md` 增加“当前 harness 状态索引”或自动检查。

## 总体评分

### `C`：中高

Brainstorming 和 PR template 对意图澄清约束很强，但执行效果依赖 bootstrap、生效的 skill invocation、用户参与和 spec 审阅质量。

### `P`：高

系统规则非常明确：skills、hard gate、tool mapping、porting invariants、PR template、contributor rules 都把可接受路径提前定义。

### `B`：高

TDD、debugging、verification、SDD review、plugin tests、evals 和 PR gate 形成多层闭环。主要缺口在 eval 成本与 harness 差异。

### `E_sys`：中高

工具接管设计成熟，但不同 harness 的能力不完全一致。OpenCode、Pi 等 in-process integration 强，shell-hook 平台则更依赖环境正确性。

### `G`：高

从 design 到 plan 到 task 的分治非常明确，2-5 分钟粒度、exact file paths、interfaces 和 global constraints 都能有效降低搜索空间。

### `\prod TC`：高

SDD 的 per-task implementer、task reviewer、fix loop、final branch review 是递归确定性传导的核心。只要计划质量足够，父任务确定性会随子任务验证结果稳步提升。

## 结语

用公式语言概括，Superpowers 的 AI Coding Harness 不是单纯提高模型 `E`，而是同时提升 `C`、固化 `P`、增强 `B`、利用工具放大 `E_sys`、压低 `G`，并通过 SDD 把子任务 `TC_j` 逐层校准后再向上传导。

它的核心价值在于把“希望 agent 自觉做对”替换为“让 agent 在每个关键节点都被流程、工具和审查拉回正确轨道”。这正对应源文档中的结论：工业级 AI 软件交付不应依赖祈祷，而应依赖高维空间中的物理护栏和可递归收敛的控制系统。

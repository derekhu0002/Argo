import {
  Button,
  Callout,
  Card,
  CardBody,
  CardHeader,
  CollapsibleSection,
  Divider,
  Grid,
  H1,
  H2,
  H3,
  Link,
  Pill,
  Row,
  Select,
  Stack,
  Stat,
  Table,
  Text,
  TextInput,
  useCanvasState,
  useHostTheme,
} from "./canvasCompat";

type Mode = "人在环路" | "人在环外" | "跨模式治理";
type Verdict = "supported" | "undetermined";
type Evidence = {
  rank: number;
  title: string;
  org: string;
  date: string;
  mode: Mode;
  grade: "A" | "B" | "C";
  medium: string;
  url: string;
  video?: string;
  problem: string;
  method: string;
  effect: string;
  boundary: string;
  verdict: Verdict;
  priority?: boolean;
};

type CatalogSource = {
  no: number;
  title: string;
  org: string;
  grade: string;
  mode: Mode;
  concern: "正确性评估" | "架构维护" | "安全合规" | "长程自治" | "上下文成本" | "交付流水线";
  hypotheses: string;
  stance: "support" | "boundary" | "counterexample" | "undetermined";
  url: string;
  claim: string;
  boundary: string;
  human: string;
  relation?: string;
};

const evidence: Evidence[] = [
  {
    rank: 1,
    title: "Harness engineering: leveraging Codex in an agent-first world",
    org: "OpenAI / Ryan Lopopolo",
    date: "2026-02-11",
    mode: "人在环路",
    grade: "B",
    medium: "工程案例 + 演讲",
    url: "https://openai.com/index/harness-engineering/",
    video: "https://www.youtube.com/watch?v=am_oeAoUhew",
    problem: "代码生成速度超过人工逐行审查；长程任务发生上下文、文档与架构漂移。",
    method: "人定义意图、优先级和验收；版本化计划与决策；结构 lint、测试、可观测性、代理互审和持续清理。",
    effect: "约 5 个月、约 100 万行、约 1,500 个 PR；团队由 3 人增至 7 人，自估约为手写耗时的 1/10。",
    boundary: "内部自报；人仍负责结果验证；长期架构一致性、SLA、事故与合规结果未公开。",
    verdict: "supported",
    priority: true,
  },
  {
    rank: 2,
    title: "Building effective agents",
    org: "Anthropic / Erik Schluntz、Barry Zhang",
    date: "2024-12-19",
    mode: "人在环路",
    grade: "B",
    medium: "工程方法论",
    url: "https://www.anthropic.com/engineering/building-effective-agents",
    problem: "Agent 复杂度、成本和错误会沿长轨迹累积。",
    method: "从简单可组合 workflow 开始；routing、orchestrator-workers、evaluator-optimizer；环境反馈、停止条件与人工升级。",
    effect: "来自 Anthropic 与数十个跨行业团队的实践归纳；无统一生产效应量。",
    boundary: "厂商方法论而非受控案例；自动测试后仍需判断是否符合更广泛系统要求。",
    verdict: "supported",
  },
  {
    rank: 3,
    title: "Demystifying evals for AI agents",
    org: "Anthropic",
    date: "2026-01-09",
    mode: "跨模式治理",
    grade: "B",
    medium: "工程方法论",
    url: "https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents",
    problem: "非确定、多步、会改变状态的 Agent 无法用单次答案正确率证明可靠。",
    method: "代码、模型、人工 grader 组合；重复试验；eval 进入 CI；生产监控、A/B、用户反馈和轨迹抽样。",
    effect: "给出完整评估组合，但未披露对交付周期或事故率的直接因果增益。",
    boundary: "Eval 可能被错误 rubric 或奖励投机欺骗；人工仍需校准 grader。",
    verdict: "supported",
  },
  {
    rank: 4,
    title: "Harness design for long-running application development",
    org: "Anthropic",
    date: "2026",
    mode: "人在环外",
    grade: "B",
    medium: "工程实验",
    url: "https://www.anthropic.com/engineering/harness-design-long-running-apps",
    problem: "长程 Agent 自评偏宽松，跨上下文失去状态，主观质量难以自动判定。",
    method: "planner、generator、独立 skeptical evaluator；分 sprint、结构化交接、硬阈值和用户路径验证。",
    effect: "支持多小时自治构建丰富全栈应用；未给出长期生产 SLA。",
    boundary: "独立 evaluator 仍是 LLM；主观设计质量需要人类标准和校准。",
    verdict: "supported",
  },
  {
    rank: 5,
    title: "Harness engineering for coding agent users",
    org: "Thoughtworks / Birgitta Böckeler / MartinFowler.com",
    date: "2026-04-02",
    mode: "人在环路",
    grade: "B",
    medium: "实践综合",
    url: "https://martinfowler.com/articles/harness-engineering.html",
    problem: "人工修补每次输出不可扩展，功能测试也看不到维护性与架构债。",
    method: "把控制分为 guides/sensors 与 computational/inferential；重复问题转化为可复用 harness。",
    effect: "形成 on-the-loop 的可操作心智模型，并有维护性 sensor 实验补充。",
    boundary: "多为实践归纳与单项目实验；harness 覆盖率和内部一致性仍缺成熟测量。",
    verdict: "supported",
  },
  {
    rank: 6,
    title: "AlphaEvolve: A coding agent for scientific and algorithmic discovery",
    org: "Google DeepMind",
    date: "2025-06",
    mode: "人在环外",
    grade: "A",
    medium: "论文 + 生产案例 + 视频",
    url: "https://arxiv.org/abs/2506.13131",
    video: "https://www.youtube.com/watch?v=vC9nAosXrJw",
    problem: "人工难以穷举基础设施与算法优化空间。",
    method: "人定义目标与 evaluator；模型生成候选，自动执行、评分和进化；仿真与留出验证后再部署。",
    effect: "Borg 调度生产运行超过一年，平均回收约 0.7% 算力；另有 kernel、训练和数学结果。",
    boundary: "最强环外案例，但只适用于可机器评分的局部优化；人仍决定目标、评价函数与部署。",
    verdict: "supported",
    priority: true,
  },
  {
    rank: 7,
    title: "Task-completion time horizons of frontier AI models",
    org: "METR",
    date: "持续更新至 2026",
    mode: "人在环外",
    grade: "A",
    medium: "同行评审研究 + 数据",
    url: "https://metr.org/time-horizons/",
    problem: "Benchmark 分数无法直观表示 Agent 能可靠独立工作多久。",
    method: "在隔离、规格清楚、可确定评分的任务上，把成功率映射为人类专家任务时长。",
    effect: "自主任务跨度快速增长；原始研究估计能力约每 7 个月翻倍。",
    boundary: "任务自包含且可自动评分；超过约 16 小时的估计仍不稳定，不能外推组织协作和生产运维。",
    verdict: "supported",
  },
  {
    rank: 8,
    title: "AI developer productivity: 2025 RCT and 2026 update",
    org: "METR",
    date: "2025-07 / 2026-02",
    mode: "跨模式治理",
    grade: "A",
    medium: "随机试验 + 方法更新",
    url: "https://metr.org/blog/2026-02-24-uplift-update/",
    problem: "主观提速、静态 benchmark 与真实成熟仓库交付可能不一致。",
    method: "维护者在熟悉仓库处理真实 issue，逐任务随机允许或禁止 AI；后续扩大样本并审视实验失效。",
    effect: "早期研究测得慢 19%，但已被作者标注过时；2026 加速估计置信区间跨零且选择偏差严重。",
    boundary: "不能用早期结果证明今天普遍减速，也不能用后续自报证明稳定提速。",
    verdict: "undetermined",
  },
  {
    rank: 9,
    title: "Software Factory",
    org: "StrongDM",
    date: "2026-02",
    mode: "人在环外",
    grade: "C",
    medium: "官方技术宣言",
    url: "https://factory.strongdm.ai/",
    problem: "代码审查无法跟上 Agent 产出，也不能可靠证明外部行为正确。",
    method: "人定义规格与场景；外置 holdout、数字孪生和 satisfaction 指标驱动 Agent 收敛；宣称无人写或审代码。",
    effect: "三人团队持续建设，可每小时运行数千场景；未公开缺陷率、SLA 或业务结果。",
    boundary: "最强潜在反例，但无独立审计、安全合规、事故与长期稳定性数据。",
    verdict: "undetermined",
    priority: true,
  },
  {
    rank: 10,
    title: "Software Factory in Public: Memo",
    org: "Ona",
    date: "2026-04",
    mode: "人在环外",
    grade: "C",
    medium: "公开案例 + 视频",
    url: "https://ona.com/stories/software-factory-what-we-learned",
    video: "https://www.youtube.com/watch?v=00Ndri8q8LU",
    problem: "验证从规划、实现到部署和监控能否被事件驱动的 Agent 工厂覆盖。",
    method: "16 个 Agent 自动化；规格、代理审查、验证、部署、监控和事故回流；风险或方向不明时升级。",
    effect: "10 天合并 375 PR、约 67,000 行、1,067 测试；约 87% 合并工作无人介入。",
    boundary: "仅 10 天、单一新产品；13% 仍有人介入，无长期用户、SLA、安全与合规结果。",
    verdict: "undetermined",
  },
  {
    rank: 11,
    title: "Self-driving codebases",
    org: "Cursor",
    date: "2026-01",
    mode: "人在环外",
    grade: "C",
    medium: "研究实验",
    url: "https://cursor.com/blog/self-driving-codebases",
    problem: "大量 Agent 能否在共享大型代码库中长时间并行。",
    method: "层级 planner/sub-planner/worker 与 judge，worker 直接提交共享分支。",
    effect: "数千 Agent 被编排、并发数百；约一周、百万行，峰值约 1,000 commits/hour。",
    boundary: "浏览器明确不供外部使用且预期有缺陷；代码量与提交量不是生产质量。",
    verdict: "undetermined",
  },
  {
    rank: 12,
    title: "How GitHub's agentic security principles secure AI agents",
    org: "GitHub",
    date: "2025–2026",
    mode: "跨模式治理",
    grade: "B",
    medium: "生产控制设计",
    url: "https://github.blog/ai-and-ml/github-copilot/how-githubs-agentic-security-principles-make-our-ai-agents-as-secure-as-possible/",
    problem: "异步 Agent 拥有代码、网络和 CI 能力，误操作与攻击的爆炸半径增大。",
    method: "隔离执行、受限网络、分支保护、人类批准、审计日志及自动安全扫描。",
    effect: "形成企业默认控制；“防住数百问题”仅是厂商自报。",
    boundary: "安全设计不等于部署有效；仍需组织配置和独立验证。",
    verdict: "supported",
  },
  {
    rank: 13,
    title: "GitHub MCP exploited: private repository data exfiltration",
    org: "Invariant Labs",
    date: "2025-05-26",
    mode: "跨模式治理",
    grade: "B",
    medium: "可复现实验",
    url: "https://invariantlabs.ai/blog/mcp-github-vulnerability",
    problem: "可信工具组合不可信输入、私密数据访问和外部写入后可形成系统性外泄。",
    method: "公开 issue 注入指令，诱导 Agent 读取私库并向公开 PR 写出信息。",
    effect: "端到端演示成功泄露私有仓库信息与敏感数据。",
    boundary: "依赖宽权限与 Always Allow；是组合权限漏洞，不是单一 GitHub MCP 代码漏洞。",
    verdict: "supported",
    priority: true,
  },
  {
    rank: 14,
    title: "How we contain Claude",
    org: "Anthropic",
    date: "2026-05-25",
    mode: "跨模式治理",
    grade: "B",
    medium: "生产安全复盘",
    url: "https://www.anthropic.com/engineering/how-we-contain-claude",
    problem: "模型防御和人工批准不足以成为自主 Agent 的确定性安全边界。",
    method: "模型防御、红队、gVisor、sandbox、完整 VM 与信任边界日志组合。",
    effect: "单次攻击约 0.1%，100 次自适应后仍达 5–6%；内部演练 25 次成功外传 24 次；sandbox 降低 84% 权限提示。",
    boundary: "受控内部演练，不是真实事故率；数据仍来自厂商自身。",
    verdict: "supported",
    priority: true,
  },
  {
    rank: 15,
    title: "DORA 2025 State of AI-assisted Software Development",
    org: "Google DORA",
    date: "2025",
    mode: "跨模式治理",
    grade: "B",
    medium: "全球调查 + 定性研究",
    url: "https://research.google/pubs/dora-2025-state-of-ai-assisted-software-development-report/",
    problem: "个体编码提速是否能转化为组织吞吐、稳定性与产品绩效。",
    method: "近 5,000 名技术从业者调查和 100+ 小时定性材料，分析组织系统的调节作用。",
    effect: "AI 更像放大器：成熟平台与流程放大收益，薄弱系统放大失稳。",
    boundary: "观察性与自报，不能证明因果；AI 使用不等同纯 Agentic Coding。",
    verdict: "supported",
    priority: true,
  },
];

const sourceCatalog: CatalogSource[] = [
  { no: 1, title: "Experienced OSS Developer Productivity RCT", org: "METR · 2025", grade: "A", mode: "跨模式治理", concern: "交付流水线", hypotheses: "H1", stance: "boundary", url: "https://arxiv.org/abs/2507.09089", claim: "16 名资深开发者、246 个真实任务；早期工具条件下使用 AI 慢 19%。", boundary: "只代表 2025 年初工具，作者明确禁止外推到 2026。", human: "开发者承担真实任务与质量判断；研究者控制分组和测量。", relation: "与 #2 组成同一研究计划，汇入核心资料 #8。" },
  { no: 2, title: "Developer Uplift Experiment Design Update", org: "METR · 2026", grade: "B", mode: "跨模式治理", concern: "交付流水线", hypotheses: "H1", stance: "undetermined", url: "https://metr.org/blog/2026-02-24-uplift-update/", claim: "扩至 57 名开发者、800+ 任务；多 Agent 并发使单任务耗时失真。", boundary: "参与和任务选择偏差使正向 uplift 仍无法确定。", human: "人定义实验有效性，不能用自报或 PR 数代替净效果。", relation: "与 #1 分别保留 provenance，汇入核心资料 #8。" },
  { no: 3, title: "State of AI-assisted Software Development", org: "Google DORA · 2025", grade: "B", mode: "跨模式治理", concern: "交付流水线", hypotheses: "H1, H3a", stance: "support", url: "https://research.google/pubs/dora-2025-state-of-ai-assisted-software-development-report/", claim: "近 5,000 份调查、100+ 小时定性研究；AI 放大组织优势与缺陷。", boundary: "观察性相关，不是 AI 或架构治理的因果试验。", human: "组织负责人维护平台、流程和稳定性控制。", relation: "与核心资料 #15 相同。" },
  { no: 4, title: "Measuring AI Agent Autonomy in Practice", org: "Anthropic · 2026", grade: "B", mode: "跨模式治理", concern: "长程自治", hypotheses: "H1, H2", stance: "boundary", url: "https://www.anthropic.com/research/measuring-agent-autonomy", claim: "数百万真实交互中，高经验用户自动批准超过 40%，干预次数下降。", boundary: "厂商遥测；自动批准率不等于成功率、安全性或生产资格。", human: "成熟用户从逐动作批准转向监控和异常接管。" },
  { no: 5, title: "Demystifying Evals for AI Agents", org: "Anthropic · 2026", grade: "C", mode: "跨模式治理", concern: "正确性评估", hypotheses: "H1", stance: "support", url: "https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents", claim: "代码 grader、LLM judge、人工校准、轨迹、CI eval 与生产监控形成分层评价。", boundary: "没有有/无 eval 的统一因果数字；错误 rubric 仍可制造虚假成功。", human: "人定义失败模式、校准 grader 并审查生产遗漏。", relation: "与核心资料 #3 相同；来源等级与聚合等级分开保留。" },
  { no: 6, title: "Harness Engineering: Codex in an Agent-first World", org: "OpenAI · 2026", grade: "C", mode: "人在环路", concern: "架构维护", hypotheses: "H1, H2, H3a, H3c", stance: "boundary", url: "https://openai.com/index/harness-engineering/", claim: "约 5 个月、100 万行、1,500 PR、零人工手写代码；以规格、lint、结构测试和反馈回路治理。", boundary: "内部案例，无控制组和长期质量对照；LOC、PR 与 1/10 自估不是可信交付证明。", human: "人选择问题、定义意图/架构/验收并维护 harness。", relation: "与核心资料 #1 相同。" },
  { no: 7, title: "Minions: One-shot End-to-end Coding Agents, Part 2", org: "Stripe · 2026", grade: "C", mode: "跨模式治理", concern: "交付流水线", hypotheses: "H1, H2", stance: "support", url: "https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents-part-2", claim: "Blueprint 状态机、隔离 devbox、近 500 工具、300 万+测试；每周 1,300+ 已合并 PR。", boundary: "缺总任务分母、拒绝率、复杂度、缺陷率、成本和人工对照。", human: "最多两轮 CI 修复后交还人工；正式 PR 和最终评审由人完成。" },
  { no: 8, title: "How Far Can We Push AI Autonomy?", org: "Thoughtworks / Martin Fowler · 2025", grade: "C", mode: "人在环外", concern: "长程自治", hypotheses: "H2", stance: "support", url: "https://martinfowler.com/articles/pushing-ai-autonomy.html", claim: "简单 Spring Boot 应用可生成；复杂度上升后出现需求漂移和虚假成功。", boundary: "小型实验的负面过程证据，不能证明所有开放式自治都会失败。", human: "人设实验目标并判断表面成功是否真实。" },
  { no: 9, title: "AlphaEvolve Technical Report", org: "Google DeepMind · 2025", grade: "B", mode: "人在环外", concern: "长程自治", hypotheses: "H2", stance: "support", url: "https://arxiv.org/abs/2506.13131", claim: "自动 evaluator 驱动候选进化；Borg 启发式生产一年以上，平均回收 0.7% 算力。", boundary: "只覆盖可自动评分的封闭优化，不承担产品意图和事故责任。", human: "人定义目标、约束、可演化范围并批准部署。", relation: "与 #37 同一系统；技术报告为主证据，博客补生产披露。" },
  { no: 10, title: "Repoformer", org: "AWS AI Labs / ICML · 2024", grade: "A", mode: "跨模式治理", concern: "上下文成本", hypotheses: "H3c", stance: "support", url: "https://proceedings.mlr.press/v235/wu24a.html", claim: "选择何时检索及哪些跨文件上下文；代码补全基准最高 70% 在线推理加速且准确率不降。", boundary: "代码补全不能外推长程 Agent 成功率和总成本。", human: "人确定任务与指标，模型运行时选择检索。" },
  { no: 11, title: "Agentless", org: "UIUC / FSE · 2025", grade: "A", mode: "人在环外", concern: "上下文成本", hypotheses: "H2, H3c", stance: "support", url: "https://doi.org/10.1145/3715754", claim: "固定定位—修复—验证流程在 SWE-bench Lite 达 32%，平均约 0.70 美元/题。", boundary: "基准污染、测试偏差与模型价格变化使其不能代表生产维护成本。", human: "人预定义流程、任务集和测试 oracle。" },
  { no: 12, title: "Asleep at the Keyboard?", org: "NYU / IEEE S&P · 2022", grade: "A", mode: "跨模式治理", concern: "安全合规", hypotheses: "H3b", stance: "support", url: "https://doi.org/10.1109/SP46214.2022.9833571", claim: "89 个安全敏感场景、1,689 个程序，约 40% 含漏洞。", boundary: "旧版 Copilot 和风险富集实验，不是 2026 或生产漏洞率。", human: "人定义威胁模型并执行专门安全审查。", relation: "与 #13、#14 构成早期人机安全实验家族，但不去重。" },
  { no: 13, title: "Do Users Write More Insecure Code with AI Assistants?", org: "Stanford / ACM CCS · 2023", grade: "A", mode: "人在环路", concern: "安全合规", hypotheses: "H3b", stance: "support", url: "https://doi.org/10.1145/3576915.3623157", claim: "47 人随机实验；5 项安全任务中 4 项 AI 组更常提交不安全方案。", boundary: "小样本、旧模型、任务和语言有限。", human: "普通人工判断未消除风险，仍需专门安全控制。" },
  { no: 14, title: "Lost at C", org: "USENIX Security · 2023", grade: "A", mode: "人在环路", concern: "安全合规", hypotheses: "H3b", stance: "counterexample", url: "https://www.usenix.org/conference/usenixsecurity23/presentation/sandoval", claim: "58 名学生的 C 链表任务未发现风险增加超过预设非劣界。", boundary: "单一低层任务，不覆盖 Web、认证、隐私、供应链或业务逻辑。", human: "人完成任务并接受独立实验评估。" },
  { no: 15, title: "RE-Bench", org: "METR / ICML · 2025", grade: "A", mode: "人在环外", concern: "长程自治", hypotheses: "H2", stance: "support", url: "https://proceedings.mlr.press/v267/wijk25a.html", claim: "2 小时时最佳 Agent 约为人类 4 倍；32 小时时人类约为 Agent 2 倍。", boundary: "仅 7 个具有明确数值目标的 ML 环境，不代表产品交付。", human: "人设计任务、预算和评分器。" },
  { no: 16, title: "PaperBench", org: "OpenAI · 2025", grade: "B", mode: "人在环外", concern: "长程自治", hypotheses: "H2", stance: "support", url: "https://arxiv.org/abs/2504.01848", claim: "复现 20 篇论文、8,316 项 rubric；运行 24–36 小时仍仅约 24%–26%。", boundary: "结构化 benchmark，不含部署、安全、维护和责任。", human: "人选择论文、定义 rubric 并验收。" },
  { no: 17, title: "Cursor: Scaling Long-running Autonomous Coding", org: "Cursor · 2026", grade: "C", mode: "人在环外", concern: "长程自治", hypotheses: "H2", stance: "boundary", url: "https://cursor.com/blog/scaling-agents", claim: "数百并发 Agent、近一周、100 万+行、约 1,000 文件、万亿级 token。", boundary: "证明吞吐和协调，不证明正确、安全、可维护、经济或可发布。", human: "人设目标/预算、暂停异常并检查产物。", relation: "报告的 C/A 双标已校正为 C 级第一方实验。" },
  { no: 18, title: "Effective Harnesses for Long-running Agents", org: "Anthropic · 2025", grade: "B", mode: "人在环外", concern: "长程自治", hypotheses: "H2", stance: "boundary", url: "https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents", claim: "initializer、feature list、progress file、Git 与小步迭代支持跨上下文 Web 应用。", boundary: "无统一成功率，不能推出生产可靠性或单/多 Agent 优劣。", human: "人定义规格、不可修改验收表、停止条件和最终验收。" },
  { no: 19, title: "Parallel Claudes Build a C Compiler", org: "Anthropic · 2026", grade: "B", mode: "人在环外", concern: "长程自治", hypotheses: "H2", stance: "boundary", url: "https://www.anthropic.com/engineering/building-c-compiler", claim: "16 Agent、两周、近 2,000 sessions、约 20 亿输入 token、2 万美元、10 万行；多数测试约 99%。", boundary: "强依赖 GCC oracle；99% 是特定测试表现，官方不建议生产使用。", human: "人设计 harness、测试、oracle 与预算。" },
  { no: 20, title: "Agentic Engineering Patterns—Red/Green TDD", org: "Simon Willison", grade: "D", mode: "人在环路", concern: "正确性评估", hypotheses: "H1, H3b", stance: "support", url: "https://simonwillison.net/guides/agentic-engineering-patterns/red-green-tdd/", claim: "用先红后绿约束虚假测试与无需求实现。", boundary: "经验模式，无可比较数字，不能证明缺陷率或安全性改善。", human: "人定义行为并审查测试是否表达真实需求。" },
  { no: 21, title: "From Vibe Coding to Agentic Engineering", org: "Andrej Karpathy / Sequoia", grade: "D", mode: "人在环路", concern: "架构维护", hypotheses: "H1, H3a", stance: "undetermined", url: "https://www.youtube.com/watch?v=96jN2OCOfLs", claim: "人应保留 taste、设计、理解与怀疑，警惕臃肿脆弱代码。", boundary: "个人演讲只能定义问题，不能证明治理有效。", human: "人负责设计判断与最终理解。" },
  { no: 22, title: "Why AI Evals Matter", org: "Hamel Husain / Shreya Shankar", grade: "D", mode: "跨模式治理", concern: "正确性评估", hypotheses: "H1", stance: "support", url: "https://www.youtube.com/watch?v=BsWxPI9UM4c", claim: "把失败模式转为自动 eval，并用人工标注校准 judge。", boundary: "教学访谈，不能证明质量、成本或事故率改善。", human: "人定义失败 taxonomy、标注样本并推翻错误 judge。" },
  { no: 23, title: "2025 GenAI Code Security Report", org: "Veracode · 2025", grade: "B/C", mode: "跨模式治理", concern: "安全合规", hypotheses: "H3b", stance: "support", url: "https://www.veracode.com/wp-content/uploads/2025_GenAI_Code_Security_Report_Final.pdf", claim: "100+ 模型、80 个安全分叉任务；平均安全通过率约 55%，45% 输出含可检测弱点。", boundary: "45% 是刻意安全选择任务结果，不是生产漏洞率；任务和检测器均由厂商设计。", human: "安全团队以独立规则、人工复核和生产验证校准。" },
  { no: 24, title: "Debt Behind the AI Boom", org: "Yue Liu et al. · 2026", grade: "B−", mode: "跨模式治理", concern: "架构维护", hypotheses: "H3a", stance: "boundary", url: "https://arxiv.org/abs/2603.28592", claim: "6,299 仓库、302,579 个 AI 归因提交；27,677 提交涉及静态问题，22.7% 问题存续。", boundary: "静态告警不等于架构债、真实缺陷或生产事故；仅覆盖显式归因和三种语言。", human: "人抽样校验归因/告警并确认业务影响。" },
  { no: 25, title: "WhatsCode", org: "Meta / WhatsApp · 2025–2026", grade: "A", mode: "跨模式治理", concern: "安全合规", hypotheses: "H1, H2", stance: "support", url: "https://arxiv.org/html/2512.05314v1", claim: "25 个月、3,000+ 接受变更；隐私自动验证覆盖 15%→53%，bug triage precision 摘要为 86%。", boundary: "覆盖率不是隐私正确率；各域接受率 9%–100%，总体数不能代表通用功能开发。", human: "复杂设计、隐私合规与最终合入由人裁定。" },
  { no: 26, title: "Copilot Coding Agent in dotnet/runtime", org: "Microsoft .NET · 2026", grade: "B", mode: "跨模式治理", concern: "交付流水线", hypotheses: "H1, H2", stance: "support", url: "https://devblogs.microsoft.com/dotnet/ten-months-with-cca-in-dotnet-runtime/", claim: "10 个月、878 PR；535 合并、253 关闭、90 开放；已决 PR 合并率 67.9%，识别回滚率 0.6%。", boundary: "任务经人工选择；回滚检索可能漏计，PR 与合并率不等于节省工时或因果收益。", human: "维护者发起、补约束、批准 CI、评审和合并。" },
  { no: 27, title: "CI-native Multi-agent Code Review", org: "Cloudflare · 2026", grade: "B/C", mode: "跨模式治理", concern: "正确性评估", hypotheses: "H3b", stance: "support", url: "https://blog.cloudflare.com/ai-code-review/", claim: "30 天 131,246 次 review runs，覆盖 48,095 MR、5,169 仓库；中位 3 分 39 秒。", boundary: "review runs/时延/0.6% break-glass 不是准确率、人工节省或逃逸缺陷数据。", human: "Critical 可阻断；工程师处置建议并可 break-glass。" },
  { no: 28, title: "River / Aquifer", org: "Shopify · 2026", grade: "B/C", mode: "人在环路", concern: "交付流水线", hypotheses: "H1, H2", stance: "support", url: "https://shopify.engineering/under-the-river", claim: "30 天 59,918 sessions、5,170 频道；3,536 个共创 PR 合并，约占合并 PR 的 1/8。", boundary: "session 与共创份额不证明 Agent 独立完成、速度、质量、成本或因果收益。", human: "公开频道内多人实时补约束和转向，最终生产判断由人。" },
  { no: 29, title: "Honk + Fleet Management", org: "Spotify · 2025", grade: "C", mode: "跨模式治理", concern: "交付流水线", hypotheses: "H1, H2", stance: "support", url: "https://engineering.atspotify.com/2025/11/spotifys-background-coding-agent-part-1", claim: "1,500+ Agent PR 进入生产；特定迁移内部估计节省 60%–90% 时间。", boundary: "节省比例无样本、计时和对照方法；既有 Fleet 自动化不能归因 Honk。", human: "人定义迁移意图和 prompt，团队评审合并。" },
  { no: 30, title: "Builderbot / Goose", org: "Block · 2026", grade: "C", mode: "人在环路", concern: "交付流水线", hypotheses: "H1, H2", stance: "boundary", url: "https://block.xyz/inside/block-rolls-out-builderbot-a-new-suite-of-ai-native-tools-that-changes-the-way-we-ship", claim: "每日 200,000+ operations；每周约 1,500 合并 PR，约占生产代码变更 15%。", boundary: "operations、PR 和变更份额不是质量或净产能；宣传性提速无基线。", human: "团队实时转向，产品判断、设计、评审和上线由人。" },
  { no: 31, title: "Nova", org: "Dropbox · 2026", grade: "C", mode: "跨模式治理", concern: "长程自治", hypotheses: "H1, H2", stance: "support", url: "https://dropbox.tech/machine-learning/introducing-nova-our-internal-platform-for-coding-agents", claim: "commit 快照隔离、显式验证命令、单 session/branch；flaky 修复候选运行至少 100 次。", boundary: "100+ 是单一候选重复验证；“1/12 PR”来自另一来源，不能拼接归因。", human: "人定义任务/验证命令；服务团队评审并决定发布。" },
  { no: 32, title: "Codex Cross-repo Build + CodeWatch", org: "Cisco / OpenAI · 2026", grade: "C", mode: "跨模式治理", concern: "交付流水线", hypotheses: "H1, H2", stance: "boundary", url: "https://openai.com/index/cisco/", claim: "构建时间约降 20%、每月节省 1,500+ 工程小时；缺陷处理吞吐 10–15×。", boundary: "联合厂商案例，无独立方法、样本、基线或成本；指标可能来自不同工作负载。", human: "工程师定目标、审计划并负责设计、验证、合规和交付。" },
  { no: 33, title: "Symphony Always-on Orchestration", org: "OpenAI · 2026", grade: "B/C", mode: "跨模式治理", concern: "长程自治", hypotheses: "H2", stance: "boundary", url: "https://openai.com/index/open-source-codex-orchestration-symphony/", claim: "Linear 状态机、独立 workspace、版本化 runtime policy；部分团队前三周 landed PR 增约 500%。", boundary: "未披露团队数、基线、PR 规模、质量或成本；engineering preview 依赖成熟 harness。", human: "人拆 issue、管理状态、review/merge；任务可停在 Human Review。" },
  { no: 34, title: "Cloud Agents + Temporal", org: "Cursor · 2026", grade: "B", mode: "跨模式治理", concern: "长程自治", hypotheses: "H2", stance: "support", url: "https://cursor.com/blog/cloud-agent-lessons", claim: "可靠性约从 1 个 9 提至 2 个 9 以上；每日 5,000 万+ actions、700 万+ workflows，内部 40%+ PR 来自 Cloud Agents。", boundary: "基础设施规模与 PR 来源不证明代码正确、成本有效或可维护；Cursor 自报。", human: "人委派、配置权限/网络、检查日志和预览并评审合并。" },
  { no: 35, title: "Ralph Loop: Overnight Six-repo Ports", org: "RepoMirror · 2025", grade: "A/C", mode: "人在环外", concern: "长程自治", hypotheses: "H2", stance: "boundary", url: "https://github.com/repomirrorhq/repomirror/blob/main/repomirror.md", claim: "稳定 prompt、TODO、scratchpad 与 Git；一夜迁移 6 个仓库、约 1,100 commits、推理费低于 800 美元。", boundary: "公开 artifact 强但效果证据弱；commit 与“完成”不证明正确性，跳过权限检查不可生产化。", human: "人选源/目标与 prompt，事后检查；生产化需额外权限、预算和发布门。" },
  { no: 36, title: "Darwin Gödel Machine", org: "UBC / Vector / Sakana AI · 2025", grade: "A/B", mode: "人在环外", concern: "长程自治", hypotheses: "H2", stance: "support", url: "https://arxiv.org/abs/2505.22954v3", claim: "80 次演化中 SWE-bench 子集 20%→50%，Polyglot 14.2%→30.7%。", boundary: "冻结模型上的 benchmark 优化，易过拟合；不是生产系统安全自我演化。", human: "人定义 benchmark、阈值、网络与 sandbox，并审查谱系。" },
  { no: 37, title: "AlphaEvolve", org: "Google DeepMind · 2025", grade: "B+", mode: "人在环外", concern: "长程自治", hypotheses: "H2", stance: "support", url: "https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/", claim: "Borg 一年以上回收 0.7% 算力；kernel 快 23%，训练时间降约 1%，FlashAttention 最高 32.5%。", boundary: "厂商生产披露，缺独立审计；只适用可量化和批量验证的算法。", human: "人定义 seed、目标、约束、可演化区域并决定部署。", relation: "与 #9 同一案例，保留为生产披露补充而非独立计数。" },
  { no: 38, title: "Agentic Security Principles", org: "GitHub · 2025", grade: "D", mode: "跨模式治理", concern: "安全合规", hypotheses: "H3b", stance: "support", url: "https://github.blog/ai-and-ml/github-copilot/how-githubs-agentic-security-principles-make-our-ai-agents-as-secure-as-possible/", claim: "临时环境、网络防火墙、短期令牌、分支保护、人工批准与双重归因。", boundary: "公开设计而非效果证明；远程 MCP 的身份、出站和数据流需独立治理。", human: "人批准工作流、不可逆动作和最终合并。" },
  { no: 39, title: "Permission Classification + OS Sandbox", org: "Anthropic Claude Code · 2025", grade: "C", mode: "跨模式治理", concern: "安全合规", hypotheses: "H3b", stance: "support", url: "https://www.anthropic.com/engineering/claude-code-sandboxing", claim: "bubblewrap/Seatbelt、网络 allowlist、凭证外置；内部权限提示减少 84%。", boundary: "84% 是摩擦下降而非漏洞下降；报告中的约 93% 批准率不来自该 URL。", human: "人配置允许边界并批准网络、新路径和高风险越界。" },
  { no: 40, title: "Orchestrator–Worker Research System", org: "Anthropic · 2025", grade: "C", mode: "跨模式治理", concern: "上下文成本", hypotheses: "H3c", stance: "support", url: "https://www.anthropic.com/engineering/multi-agent-research-system", claim: "内部评测较单 Agent 高 90.2%，复杂查询耗时最高降 90%；token 约为普通聊天 15 倍。", boundary: "内部 eval，不是 ROI；适合独立高价值研究，不可外推共享状态密集编码。", human: "人定义任务、rubric、预算并抽查自动评测遗漏。" },
  { no: 41, title: "MCP Code Execution / Tools on Demand", org: "Anthropic · 2025", grade: "C", mode: "跨模式治理", concern: "上下文成本", hypotheses: "H3c", stance: "support", url: "https://www.anthropic.com/engineering/code-execution-with-mcp", claim: "工具 schema 按需披露并在执行环境过滤；示例 token 150,000→2,000，减少 98.7%。", boundary: "单一代表算例，不是随机 benchmark 或生产均值；代码执行增加安全风险。", human: "人限定工具、数据流、沙箱和资源预算。" },
  { no: 42, title: "AgentDojo Security–Utility Regression", org: "ETH Zurich / NeurIPS · 2024", grade: "A", mode: "跨模式治理", concern: "安全合规", hypotheses: "H3b", stance: "support", url: "https://agentdojo.spylab.ai/", claim: "97 个任务、629 安全案例；联合测正常效用、攻击下效用与攻击成功率。", boundary: "应表述为“无攻击时任务解决率低于 66%”，不是“无攻击成功率”；场景不代表代码供应链。", human: "人定义威胁模型、效用损失容忍度和发布阈值。" },
  { no: 43, title: "Model-designed Agent–Computer Interface", org: "Princeton SWE-agent / NeurIPS · 2024", grade: "A", mode: "人在环外", concern: "上下文成本", hypotheses: "H3c", stance: "support", url: "https://proceedings.neurips.cc/paper_files/paper/2024/file/5a7c947568c1b1328ccc5230172e1e7c-Paper-Conference.pdf", claim: "结构化搜索摘要、文件窗口、观察压缩、编辑 lint 和成本上限；消融显示更多上下文可能更差。", boundary: "特定模型/benchmark/ACI；不能把固定窗口或结果数当通用最优。", human: "人设计接口、guardrail、预算和最终评测。" },
  { no: 44, title: "AI-ready Code Gate / Code for Machines, Not Just Humans", org: "CodeScene authors · 2026", grade: "B", mode: "跨模式治理", concern: "架构维护", hypotheses: "H3a, H3c", stance: "boundary", url: "https://arxiv.org/html/2601.02200v1", claim: "5,000 个 Python 程序、6 模型；多数中型模型在健康代码上的相对破坏风险低约 15%–30%。", boundary: "证明相关性而非 MCP/CI gate 的生产效果；商业关联，禁止混用厂商 60% 口径。", human: "人决定健康阈值、例外、先重构区域和上线门。" },
];

type PracticeDetail = {
  problem: string;
  method: string;
};

const practiceDetails: Record<number, PracticeDetail> = {
  6: { problem: "Agent 代码吞吐超过逐行审查能力，并引发上下文、文档和架构漂移。", method: "短 AGENTS.md 作索引；版本化规格、计划和决策；结构 lint、测试、Agent review、可观测性和持续清理。" },
  7: { problem: "如何让编码 Agent 高自治执行，同时限制失败循环和外部副作用。", method: "Blueprint 状态机交错确定性节点与 Agent loop；隔离 devbox、MCP 工具、300 万+测试及最多两轮 CI 自修复。" },
  8: { problem: "多 Agent、参考实现与测试能否消除需求假设漂移和虚假成功。", method: "逐步提高 Spring Boot 应用复杂度，对比需求、E2E 测试、Agent review 与实际产物。" },
  9: { problem: "人工难以穷举具有客观评价函数的算法和基础设施优化空间。", method: "LLM 生成候选代码；自动 evaluator 执行、评分和进化；仿真、留出数据和人工部署评审。" },
  17: { problem: "数百 Agent 如何跨周期协调超大规模代码生成。", method: "planner–worker–judge 层级编排、共享分支、周期性上下文重置和乐观并发。" },
  18: { problem: "单 Agent 如何跨上下文窗口保持状态并持续交付。", method: "initializer、feature list、progress file、Git checkpoint；每轮只完成一个可验证功能。" },
  19: { problem: "多 Agent 能否构建约十万行的复杂编译器。", method: "16 Agent、独立 Docker、共享 bare Git、任务锁、GCC oracle、混合编译和 delta debugging。" },
  20: { problem: "Agent 可能写出虚假测试，或实现并不存在的需求。", method: "Red/Green TDD：先观察测试真实失败，再让 Agent 生成最小实现并验证转绿。" },
  25: { problem: "在合规敏感的超大代码库中扩展 AI 辅助开发。", method: "专用 RAG、动态任务拆解、四级自治，并持续接入测试、静态分析、人工评审和标准发布流程。" },
  26: { problem: "云端编码 Agent 能否安全贡献高质量开源运行时。", method: "维护者选择 issue；临时云环境执行；仓库指令、构建测试、Agent review 后再由人评审合并。" },
  27: { problem: "大规模 MR 评审的等待、覆盖面和反馈噪声。", method: "CI 并行最多七个专业 reviewer；协调器去重分级，并设置超时、熔断、注入清洗和 break-glass。" },
  28: { problem: "私有短会话无法积累组织知识，进程或沙箱故障会丢失状态。", method: "Slack 作为公开控制面；Nix 可复现环境；session、sandbox、凭据代理、事件日志与遥测分离。" },
  29: { problem: "传统 AST 或正则迁移脚本难覆盖跨仓复杂变更。", method: "Fleet 选仓并开 PR；Agent 实现；MCP 执行格式化、lint、测试；LLM judge 检查 diff，MLflow 记录轨迹。" },
  30: { problem: "跨数百服务协调多个编码 Agent，同时隔离敏感数据。", method: "Slack 多人线程控制 Goose agents；读取公司代码上下文、建分支、开 PR、观察 CI，并隔离客户/支付数据。" },
  31: { problem: "编码 Agent 如何适配大型 monorepo、Bazel 和长程运维流程。", method: "按 commit 创建隔离快照；调用方声明验证命令；失败续跑；单 session 单 branch；发布动作始终在 Agent 外。" },
  32: { problem: "跨 15+ 仓库优化构建，并提高 C/C++ 缺陷修复吞吐。", method: "分析 build logs 与依赖图；CodeWatch 执行 compile–test–fix；计划进入既有安全、合规和治理流水线。" },
  33: { problem: "人同时监督多个交互式 Agent 后出现协调和状态管理瓶颈。", method: "Linear issue 作为持久状态机；每 issue 独立 workspace；WORKFLOW.md 版本化策略；超时、退避、重试和日志。" },
  34: { problem: "云端长任务会受节点、模型服务和环境漂移影响而中断。", method: "每任务独立 VM；Temporal durable execution；Agent、机器、会话状态分离；重试、恢复和 Cloud Doctor 诊断。" },
  35: { problem: "上下文重置后如何持续推进有参考实现的机械迁移。", method: "稳定 prompt、TODO、scratchpad 与 Git commits 承担长期记忆；循环启动新 Agent 从仓库状态恢复。" },
  36: { problem: "固定 Agent 架构依赖人工迭代，能否让 Agent 改进自身。", method: "Agent 修改自身代码；archive 保留谱系并选 parent；child 经分阶段 benchmark 评分，配 sandbox 与人工监督。" },
  37: { problem: "在巨大候选空间内持续改进可执行算法。", method: "LLM sampler 生成代码差分；自动 evaluator 验证评分；演化数据库维持多样候选；上线前模拟和人工评审。" },
  38: { problem: "编码 Agent 的数据外泄、身份归属、提示注入和不可逆副作用。", method: "临时环境、网络防火墙、最小敏感信息、短期令牌、分支保护、PR/Actions 人工批准和双重归因。" },
  39: { problem: "频繁权限批准造成疲劳，但放宽权限又增加注入和泄漏风险。", method: "bubblewrap/Seatbelt 文件隔离、网络 allowlist、Git 凭据外置；只在越界时询问。" },
  40: { problem: "开放研究超出单上下文，需要并行覆盖多个独立方向。", method: "Lead Agent 分解任务；子 Agent 隔离检索并压缩返回；citation agent、rubric、checkpoint 和 tracing。" },
  41: { problem: "大量 MCP schema 与中间结果占满上下文并推高成本。", method: "将工具文件化为代码 API；按需读取 schema；在执行环境过滤和连接数据，只把摘要送入模型。" },
  43: { problem: "人类友好工具会诱使模型穷举结果、耗尽上下文和预算。", method: "搜索摘要、受限文件窗口、旧观察压缩、编辑后 lint/拒绝语法错误，并设置任务成本上限。" },
  44: { problem: "低可维护性代码是否更容易被 AI 重构破坏。", method: "比较健康/不健康 Python 程序在六个模型重构后的测试破坏率，并评估 CodeHealth 的预测信息。" },
};

type CaseRow = {
  id: string;
  title: string;
  org: string;
  grade: string;
  mode: Mode;
  concern: CatalogSource["concern"];
  hypotheses: string;
  stance: CatalogSource["stance"];
  url: string;
  video?: string;
  sourceType: string;
  problem: string;
  method: string;
  effect: string;
  human: string;
  boundary: string;
  relation?: string;
  core: boolean;
  editorScore?: number;
  channelRank?: number;
  channel?: string;
};

function materialSource(url: string, org: string): string {
  if (url.includes("youtube.com")) return "YouTube 原始视频";
  if (url.includes("github.com")) return "GitHub 公开仓库 / 运行报告";
  if (url.includes("doi.org") || url.includes("proceedings.") || url.includes("usenix.org/conference")) return "同行评审论文 / 会议材料";
  if (url.includes("arxiv.org")) return "arXiv 论文 / 技术报告";
  if (url.includes("metr.org") || url.includes("research.google")) return "研究机构报告 / 数据页面";
  if (url.includes("martinfowler.com") || url.includes("simonwillison.net")) return "知名实践者博文";
  if (url.includes("invariantlabs.ai")) return "独立安全研究博文";
  if (url.includes("factory.strongdm.ai")) return "企业官方技术宣言";
  if (url.includes("agentdojo.spylab.ai")) return "学术研究项目网站";
  if (url.endsWith(".pdf")) return org.includes("Veracode") ? "企业安全研究报告" : "公开研究报告";
  return "企业官网工程博客文章";
}

function defaultProblem(concern: CatalogSource["concern"]): string {
  if (concern === "正确性评估") return "如何证明 Agent 的结果符合真实需求，而非只通过表面测试。";
  if (concern === "架构维护") return "如何避免高吞吐 AI 变更累积耦合、技术债和维护风险。";
  if (concern === "安全合规") return "如何控制 Agent 生成代码或工具调用带来的安全、隐私和合规风险。";
  if (concern === "长程自治") return "如何让 Agent 长时间推进任务，同时限制错误累积和失败半径。";
  if (concern === "上下文成本") return "如何减少无关上下文与工具开销，同时维持任务质量。";
  return "如何把 Agent 产出接入真实交付流水线，并衡量净业务效果。";
}

function coreConcern(rank: number): CatalogSource["concern"] {
  if ([1, 5].includes(rank)) return "架构维护";
  if ([3, 7].includes(rank)) return "正确性评估";
  if ([12, 13, 14].includes(rank)) return "安全合规";
  if ([4, 6, 9, 10, 11].includes(rank)) return "长程自治";
  return "交付流水线";
}

function coreHypotheses(rank: number): string {
  const values: Record<number, string> = {
    1: "H1, H3a, H3c", 2: "H1, H2", 3: "H1", 4: "H2", 5: "H1, H3a",
    6: "H2", 7: "H2", 8: "H1", 9: "H2", 10: "H2", 11: "H2",
    12: "H3b", 13: "H3b", 14: "H3b", 15: "H1, H3a",
  };
  return values[rank] ?? "H1";
}

function normalizeUrl(url: string): string {
  return url.toLowerCase().replace("https://www.", "https://").replace(/\/$/, "");
}

function coreHumanPosition(mode: Mode): string {
  if (mode === "人在环外") return "人设计目标、评价器、权限与停止条件；系统在受限任务中自动执行，人定期校准并承担生产接受责任。";
  if (mode === "人在环路") return "人批准意图、计划或关键动作，复核分层证据，并决定接受、回退、限制或停止。";
  return "人设计治理机制、风险分级和证据门；低风险动作自动执行，高风险与异常动作升级。";
}

const youtubeCases: CaseRow[] = [
  {
    id: "Y1",
    title: "Building autonomous coding agents at Stripe",
    org: "Stripe Engineering",
    grade: "B",
    mode: "人在环路",
    concern: "交付流水线",
    hypotheses: "H1, H2",
    stance: "support",
    url: "https://www.youtube.com/watch?v=WW-549L6L50",
    sourceType: "YouTube 企业一手工程演讲",
    problem: "在 2.75 亿行 monorepo 中，如何让 one-shot 编码 Agent 从 Slack 任务稳定地产生可评审 PR。",
    method: "Slack/API 接收任务；10 秒内分配预热 EC2 devbox；Minion loop 调用代码与内部工具；Blueprint 交替执行 Agent 节点和 lint、类型检查、测试等确定性节点；失败最多两轮修复，再进入 PR。",
    effect: "公开称每周合并约 1,000–1,300 个 Minion PR；视频展示 devbox、loop、工具与 Blueprint 流程。",
    human: "工程师选择并描述任务、评审 PR 和处理失败；平台团队维护 devbox、规则、工具与验证节点。",
    boundary: "企业一手自报，无独立缺陷率、返工、事故或净生产率数据；PR 数不能证明长期质量。",
    relation: "补充原清单 #7 Stripe Minions 的视频级过程证据。",
    core: false,
  },
  {
    id: "Y2",
    title: "Building Towards Self-Driving Codebases with Long-Running, Asynchronous Agents",
    org: "Aman Sanger / Cursor",
    grade: "B/C",
    mode: "人在环外",
    concern: "长程自治",
    hypotheses: "H2, H3a",
    stance: "undetermined",
    url: "https://www.youtube.com/watch?v=2Fp3jIrFTMo",
    sourceType: "YouTube 企业创始人技术演讲",
    problem: "单一 Agent 长时间运行会偏航、耗尽上下文，难以完成跨模块的大型工程任务。",
    method: "详细、可验证规格作为计划与评价集；高层 planner 递归委派 sub-planner 和 worker；叶节点短程执行；judge 检查结果；云端异步环境维持任务。",
    effect: "公开展示层级多 Agent harness 及内部长任务实验；百万行和高提交吞吐属于实验规模指标。",
    human: "人编写详细规格、约束成功条件、观察实验结果并决定是否采用；Agent 不拥有开放式生产发布权。",
    boundary: "演讲证明编排方法存在，不证明生成代码正确、可维护或可投产；实验浏览器明确预期有缺陷。",
    relation: "补充核心证据 Self-driving codebases 与原清单 #17 的视频过程。",
    core: false,
  },
  {
    id: "Y3",
    title: "How We Build Effective Agents",
    org: "Barry Zhang / Anthropic",
    grade: "B",
    mode: "跨模式治理",
    concern: "正确性评估",
    hypotheses: "H1, H2",
    stance: "support",
    url: "https://www.youtube.com/watch?v=D7_ipDqhtwk",
    sourceType: "YouTube 企业官方方法演讲",
    problem: "团队常在没有价值、能力、成本和错误可发现性证据时直接构建高自治 Agent。",
    method: "先判断任务价值与 Token 预算；逐项去风险化写码、调试、错误恢复等关键能力；发现瓶颈就缩小范围；按错误成本和发现难度决定只读、工作流或人类批准。",
    effect: "给出从用例选择、原型、能力验证到自治分级的可执行检查表；未公开单一生产系统的对照效果。",
    human: "人决定用例、预算、错误容忍度、能力门槛和升级策略；可验证低风险步骤再交给 Agent 循环。",
    boundary: "权威方法论而非受控案例；不能据此推出任何企业都能获得相同质量或效率。",
    relation: "补充 Building effective agents 的视频化实施流程。",
    core: false,
  },
  {
    id: "Y4",
    title: "No Vibes Allowed: Solving Hard Problems in Complex Codebases",
    org: "Dex Horthy / HumanLayer · AI Engineer",
    grade: "C",
    mode: "人在环路",
    concern: "架构维护",
    hypotheses: "H1, H3a, H3c",
    stance: "support",
    url: "https://www.youtube.com/watch?v=rmvDxxNubIg",
    sourceType: "YouTube 大会实践演讲",
    problem: "Agent 在陌生 brownfield 仓库中直接编码，会因上下文不足而产生错误研究、计划和大范围低质量改动。",
    method: "先让独立 Agent 研究仓库并批判研究结果；形成包含文件、代码片段和逐步测试的实施计划；清空上下文后按计划小步执行；以 Git、golden files 和真实评审收口。",
    effect: "公开 BAML 约 30 万行 Rust 仓库案例：7 小时产生约 3.5 万行变更，部分为生成文件；一个 PR 后续合并，团队估计相当于 1–2 周工作。",
    human: "人选择问题、审阅和淘汰错误研究、批准计划、观察测试并由维护者决定合并。",
    boundary: "单团队自报且 LOC 含 codegen；未给出缺陷逃逸、维护成本或可重复对照。",
    relation: "新增复杂存量代码库的 research–plan–implement 实战证据。",
    core: false,
  },
  {
    id: "Y5",
    title: "Spec-Driven Development with AI Agents: From Requirements to Working Software",
    org: "Anton Arhipov / JetBrains 技术演示",
    grade: "C",
    mode: "人在环路",
    concern: "正确性评估",
    hypotheses: "H1, H3a",
    stance: "support",
    url: "https://www.youtube.com/watch?v=cTJorhnxrFI",
    sourceType: "YouTube 大会现场演示",
    problem: "自然语言需求直接进入编码会丢失验收语义，且过程难审计、难复现。",
    method: "把高层需求依次生成 proposal、spec、design 与 task artifacts；每阶段用模板和确定性命令固定格式；人工在 artifact diff 上修订，再让 Agent 按任务实现和验证。",
    effect: "视频现场从需求输入演示到结构化产物和实现推进，展示 artifact 驱动流程；未提供规模化生产指标。",
    human: "人撰写或修订 proposal/spec、检查统一 diff、批准继续执行并验证最终行为。",
    boundary: "现场 demo 证明流程可运行，不证明在大型仓库中的质量、速度和架构效果。",
    relation: "新增规格驱动 Agentic Engineering 的端到端演示。",
    core: false,
  },
  {
    id: "Y6",
    title: "Why your AI code doesn’t ship: Closing the gap to production",
    org: "GitHub / Microsoft Build",
    grade: "B",
    mode: "人在环路",
    concern: "交付流水线",
    hypotheses: "H1, H3a",
    stance: "support",
    url: "https://www.youtube.com/watch?v=5YFPfuOhpwU",
    sourceType: "YouTube 企业大会产品实战",
    problem: "生成代码停留在本地或草稿阶段，不能自动处理评审、冲突、测试和合并前的生产门槛。",
    method: "Issue/任务启动编码 Agent；Agent 建分支和 PR；异步响应 review、冲突与 checks；Agent Merge 根据仓库上下文判断反馈是否应执行，并拒绝超范围重构；分支保护和批准规则收口。",
    effect: "现场演示从需求到 PR、review 反馈、范围控制和可运行结果的闭环；没有独立生产效率或缺陷数据。",
    human: "人提出任务和评审意见；仓库规则决定批准与合并权限；Agent 可拒绝与本次变更无关的建议。",
    boundary: "产品演示可能使用理想路径；不能证明所有真实仓库都能一次完成或安全自动合并。",
    relation: "补充 GitHub agentic workflow 的交付全过程。",
    core: false,
  },
  {
    id: "Y7",
    title: "Why Agentic Code Needs Sandboxes to Survive",
    org: "Waldemar Hummer / LocalStack",
    grade: "C",
    mode: "跨模式治理",
    concern: "安全合规",
    hypotheses: "H1, H3b",
    stance: "support",
    url: "https://www.youtube.com/watch?v=77KXcK3BjgM",
    sourceType: "YouTube 企业 CTO 专访",
    problem: "静态检查无法验证 Agent 生成的云基础设施代码，真实云测试又昂贵、慢且具有副作用。",
    method: "规格先行；在隔离的本地云 sandbox 运行基础设施和集成测试；CI 失败时保存 Cloud Pod 状态快照，下载到本地复现；以可测试服务边界提前反馈。",
    effect: "公开展示可复现云运行时测试和失败快照的工程路径；未披露采用 Agent 前后的缺陷率或成本对照。",
    human: "人定义云行为规格、测试和允许的服务边界，分析不可自动判定的失败并批准真实云发布。",
    boundary: "厂商访谈兼具产品营销属性；sandbox 降低副作用但不自动证明安全或业务正确。",
    relation: "新增基础设施代码的 sandbox–CI–复现闭环案例。",
    core: false,
  },
  {
    id: "Y8",
    title: "How Anthropic Engineers Are Adapting to AI Coding Agents",
    org: "Anthropic Product & Developer Experience",
    grade: "B",
    mode: "人在环路",
    concern: "交付流水线",
    hypotheses: "H1, H2",
    stance: "support",
    url: "https://www.youtube.com/watch?v=8maA13Qq540",
    sourceType: "YouTube 企业团队访谈",
    problem: "编码 Agent 缺少 Slack、PRD、工单、云资源和评审上下文，容易停留在孤立 IDE 助手。",
    method: "通过 CLI、GitHub 和 MCP 接入开发者现有工具；内部 slash command 触发 Agent review；让 Agent 判断修改后的 PR 是否需要再次人工批准；用云资源 CLI 支持诊断。",
    effect: "披露 Anthropic 内部 review assistant 与 GitHub/CI 集成方式；未提供 adoption、缺陷、周期或成本指标。",
    human: "人提供跨系统意图与资料，校准是否需要再次人工批准，并对高风险变更保留最终评审。",
    boundary: "团队访谈属于一手观察，但缺少可复现配置与量化对照。",
    relation: "新增企业内部工具链与审批编排案例。",
    core: false,
  },
  {
    id: "Y9",
    title: "My Complete Agentic Coding Workflow to Build Anything",
    org: "Cole Medin / 独立实践者",
    grade: "C",
    mode: "人在环路",
    concern: "架构维护",
    hypotheses: "H1, H3a, H3c",
    stance: "support",
    url: "https://www.youtube.com/watch?v=goOZSXmrYQ4",
    sourceType: "YouTube 独立实践者全流程教程",
    problem: "长会话中需求、规则和已完成工作容易丢失，Agent 反复探索或生成不一致实现。",
    method: "PRD 作为 North Star；prime 命令加载仓库；全局规则保持轻量并按任务加载模块规则；分阶段计划与实现；Git commit history 作长期记忆；E2E 测试和可复用 slash commands 收口。",
    effect: "视频完整演示应用从规划、分阶段实现、提交到持续恢复上下文；效果为单人 walkthrough，无对照指标。",
    human: "人定义 PRD、选择下一阶段、观察 UI/测试、批准提交并在偏离时修正。",
    boundary: "个人教程适合复制工作流，但不代表企业级安全、架构或长期维护效果。",
    relation: "新增可直接复刻的个人端到端 Agentic Coding 工作流。",
    core: false,
  },
  {
    id: "Y10",
    title: "Always-on agents run production without the on-call tax",
    org: "Justin Smith / Resolve AI",
    grade: "C",
    mode: "跨模式治理",
    concern: "长程自治",
    hypotheses: "H2, H3b",
    stance: "undetermined",
    url: "https://www.youtube.com/watch?v=vSx5IULvBns",
    sourceType: "YouTube 厂商生产运维演讲",
    problem: "生产告警调查和重复健康检查消耗 on-call 注意力，但完全自动修复可能扩大事故。",
    method: "Agent 持续观察生产环境；在 Slack/Teams 接收和汇报；把调查拆成可查看 tasks 和 reports；通过对话配置周期性 health summary；先测试再共享给团队。",
    effect: "视频展示后台 Agent、轨迹报告、Slack 控制面和周期任务配置；没有公开 MTTR、误报或事故率对照。",
    human: "人配置观察目标、查看任务轨迹、决定是否响应或执行修复，并控制推广到团队。",
    boundary: "厂商演示偏向运维而非代码生成；未证明 Agent 可无人值守执行高风险生产变更。",
    relation: "扩展 Agentic Engineering 到生产运维与可观测闭环。",
    core: false,
  },
];

const aiEngineerRatedCases: CaseRow[] = [
  {
    id: "AE1",
    title: "Full Walkthrough: Workflow for AI Coding",
    org: "Matt Pocock / AI Engineer",
    grade: "B/C",
    mode: "人在环路",
    concern: "交付流水线",
    hypotheses: "H1, H2, H3a",
    stance: "support",
    url: "https://www.youtube.com/watch?v=-QFHIoCo-Ko",
    sourceType: "YouTube · AI Engineer 频道全流程工作坊",
    problem: "大型需求在单一长会话中会因歧义、上下文膨胀和横向分层而降低 Agent 质量。",
    method: "Grill Me 访谈消除歧义 → PRD 固化终点 → 按可独立验证的纵向切片生成本地 issues → 每个 issue 使用新上下文和 TDD 执行 Ralph/AFK loop → 人工 review 与 QA。约 100K tokens 作为 smart-zone 经验阈值。",
    effect: "96 分。96 分钟现场 walkthrough 展示从需求澄清、子 Agent 研究、PRD、任务拆分到自治执行的完整链路；没有团队级质量或生产率对照。",
    human: "人负责设计概念、回答访谈、批准纵向切片、最终代码审查和 QA；实现阶段可短时 AFK。",
    boundary: "100K 阈值与流程收益主要来自个人实践；不能视为模型通用极限或企业生产效果。",
    relation: "AI Engineer 频道 80+ 精选 #1；评分：具体性25/25、过程25/25、验证19/20、一手13/15、效果14/15。",
    core: false,
    editorScore: 96,
    channelRank: 1,
    channel: "AI Engineer",
  },
  {
    id: "AE2",
    title: "The Multi-Agent Architecture That Actually Ships",
    org: "Luke Alvoeiro / Factory · AI Engineer",
    grade: "B/C",
    mode: "人在环外",
    concern: "长程自治",
    hypotheses: "H1, H2, H3a",
    stance: "support",
    url: "https://www.youtube.com/watch?v=ow1we5PzK-o",
    sourceType: "YouTube · AI Engineer 频道企业技术演讲",
    problem: "多日编码任务中，Agent 并行修改会冲突，模型弱点和验证失败会跨里程碑累积。",
    method: "整体串行、局部并行；worker 与 validator 结构化交接完成项、待办和退出码；里程碑 checkpoint；验证使用不同模型供应商降低同源偏差；失败生成 follow-up feature 并重新验证。",
    effect: "94 分。Slack clone 案例公开约 60% 时间/Token 用于实现，验证几乎从不一次通过；最终约 50% 代码为测试、约 90% 测试覆盖率。",
    human: "人定义 mission、里程碑、模型席位和验证合同；系统在合同内运行，人审阅最终交付与异常。",
    boundary: "Factory 厂商自报的单案例；覆盖率不是行为正确性，未公开缺陷逃逸、返工和长期维护成本。",
    relation: "AI Engineer 频道 80+ 精选 #4；评分：具体性24/25、过程24/25、验证20/20、一手14/15、效果12/15。",
    core: false,
    editorScore: 94,
    channelRank: 4,
    channel: "AI Engineer",
  },
  {
    id: "AE3",
    title: "Spec-Driven Development: Agentic Coding at FAANG Scale and Quality",
    org: "Al Harris / Amazon Kiro · AI Engineer",
    grade: "B",
    mode: "人在环路",
    concern: "正确性评估",
    hypotheses: "H1, H3a",
    stance: "support",
    url: "https://www.youtube.com/watch?v=HY_JyxAZsiE",
    sourceType: "YouTube · AI Engineer 频道企业工作坊",
    problem: "从模糊提示直接写代码会丢失意图，普通单元测试也难证明实现满足需求不变量。",
    method: "用 EARS 语法生成 requirements.md → 形成 design.md → 拆分 tasks.md → 人逐阶段确认 → MCP 补充外部上下文 → Agent 实现 → property-based tests 验证跨输入不变量；steering 与 hooks 持续约束。",
    effect: "92 分。演讲现场构建 AWS Agent Core 应用，并展示 requirements、design、tasks、MCP 与属性测试链路；未披露大规模内部对照指标。",
    human: "人修订需求、设计和任务 artifact，决定何时继续，并审查属性是否真正表达业务意图。",
    boundary: "Amazon 产品团队一手演示但兼具营销属性；“FAANG scale”不等于已公开证明组织级收益。",
    relation: "AI Engineer 频道 80+ 精选 #5；评分：具体性23/25、过程24/25、验证20/20、一手14/15、效果11/15。",
    core: false,
    editorScore: 92,
    channelRank: 5,
    channel: "AI Engineer",
  },
  {
    id: "AE4",
    title: "No Vibes Allowed: Solving Hard Problems in Complex Codebases",
    org: "Dex Horthy / HumanLayer · AI Engineer",
    grade: "C",
    mode: "人在环路",
    concern: "架构维护",
    hypotheses: "H1, H3a, H3c",
    stance: "support",
    url: "https://www.youtube.com/watch?v=rmvDxxNubIg",
    sourceType: "YouTube · AI Engineer 频道 brownfield 实战",
    problem: "Agent 在陌生大型代码库中直接编码，会基于错误研究产生错误计划和大范围低质量变更。",
    method: "独立 Agent 研究仓库 → 人与 Agent 批判和淘汰错误研究 → 生成含文件、代码片段及逐步测试的详细计划 → 清空上下文 → 小步实现 → Git、golden files 与维护者评审收口。",
    effect: "91 分。BAML 约 30 万行 Rust 仓库案例中，7 小时产生约 3.5 万行变更，部分为 codegen；一个 PR 后续合并，团队估计相当于 1–2 周工作。",
    human: "人选择问题、否决错误研究、批准计划、观察测试；仓库维护者决定是否合并。",
    boundary: "单团队自报，LOC 含生成文件；缺少缺陷逃逸、后续维护和可重复对照。",
    relation: "AI Engineer 频道 80+ 精选 #6；评分：具体性25/25、过程24/25、验证18/20、一手12/15、效果12/15。",
    core: false,
    editorScore: 91,
    channelRank: 6,
    channel: "AI Engineer",
  },
  {
    id: "AE5",
    title: "Benchmarking Coding Agents on New vs Legacy Codebases",
    org: "Denys Linkov / Wisedocs · AI Engineer",
    grade: "B",
    mode: "跨模式治理",
    concern: "架构维护",
    hypotheses: "H1, H2, H3a",
    stance: "boundary",
    url: "https://www.youtube.com/watch?v=7vn4WpqNpck",
    sourceType: "YouTube · AI Engineer 频道企业重构复盘",
    problem: "面对十多个仓库和六年遗留系统，团队需要决定现在用 Agent 重构，还是等待更强模型。",
    method: "六个月重构并合并为 monorepo；比较五种 orchestrator；在新旧代码版本上复跑模型、harness 和规则集；用 90%–99% 成功阈值而非 50% 决定任务委派；sandbox、可验证命令和 PR review 收口。",
    effect: "90 分。公开称管线时间和成本下降、功能交付与开发者参与改善；旧模型三小时且十个大错，新模型约五分之一时间；GPT-5.5 十分钟 one-shot 仅生成脚手架，构成反例。",
    human: "人定义重构目标与委派阈值，检查“已完成”是否只是假脚手架，并保留 PR 审查。",
    boundary: "生产结果来自企业自报；不同模型试验不完全同条件，不能把速度提升全部归因于 Agent。",
    relation: "AI Engineer 频道 80+ 精选 #7；评分：具体性24/25、过程22/25、验证19/20、一手14/15、效果11/15。",
    core: false,
    editorScore: 90,
    channelRank: 7,
    channel: "AI Engineer",
  },
  {
    id: "AE6",
    title: "Guide, Verify, Solve",
    org: "Anirban Chatterjee / Sonar · AI Engineer",
    grade: "B/C",
    mode: "跨模式治理",
    concern: "正确性评估",
    hypotheses: "H1, H3a, H3b",
    stance: "support",
    url: "https://www.youtube.com/watch?v=03l29gJXpCE",
    sourceType: "YouTube · AI Engineer 频道企业框架与演示",
    problem: "Agent 提高代码产量后，安全、复杂度和维护性告警形成持续的 verification debt。",
    method: "AC/DC：Guide 向 Agent 提供架构、标准和边界；Verify 以零信任组合确定性静态分析与异构 LLM review；Solve 由 remediation Agent 修复并重新编译/分析。内环在提交前运行，外环在 CI/PR 治理。",
    effect: "89 分。演示 Cursor + Sonar Vortex 的生成—分析—修复循环，并引用 AI 项目短期提速后静态告警和复杂度持续上升的观察数据。",
    human: "人定义约束和风险阈值，校准 Agentic review；高风险告警与最终发布仍由责任人处理。",
    boundary: "Sonar 发布框架与产品演示有商业动机；静态告警不是生产缺陷或事故的直接代理。",
    relation: "AI Engineer 频道 80+ 精选 #9；评分：具体性22/25、过程23/25、验证20/20、一手13/15、效果11/15。",
    core: false,
    editorScore: 89,
    channelRank: 9,
    channel: "AI Engineer",
  },
  {
    id: "AE7",
    title: "Codex, Behind the Harness",
    org: "Dominik Kundel / OpenAI · AI Engineer",
    grade: "B",
    mode: "跨模式治理",
    concern: "长程自治",
    hypotheses: "H1, H2, H3b",
    stance: "support",
    url: "https://www.youtube.com/watch?v=shRR1e2HXMk",
    sourceType: "YouTube · AI Engineer 频道一手 harness 拆解",
    problem: "编码模型本身不能安全可靠地操作文件、Shell 和长上下文，需要可复用执行控制层。",
    method: "Responses API 驱动 user–model–tools 循环；统一 wire protocol；按需构造和压缩上下文；文件与 Shell 工具在 sandbox 中执行；MCP 扩展工具面；CLI、Cloud 与 IDE 共用核心 harness。",
    effect: "88 分。拆解开源 Codex harness 的 agent loop、上下文、工具和文件系统访问；开放 GitHub issues/PR 可复核设计决策，但视频不提供单案例质量对照。",
    human: "人提供任务、AGENTS.md 与权限策略，审批越界动作并审阅产出；harness 负责可观测执行。",
    boundary: "证明生产级 harness 的结构，不证明 Codex 在任意仓库上的成功率或净业务收益。",
    relation: "AI Engineer 频道 80+ 精选 #10；评分：具体性22/25、过程23/25、验证18/20、一手15/15、效果10/15。",
    core: false,
    editorScore: 88,
    channelRank: 10,
    channel: "AI Engineer",
  },
  {
    id: "AE8",
    title: "Amp Code: Next Generation AI Coding",
    org: "Beyang Liu / Amp Code · AI Engineer",
    grade: "B/C",
    mode: "人在环路",
    concern: "上下文成本",
    hypotheses: "H1, H2",
    stance: "support",
    url: "https://www.youtube.com/watch?v=gvIAkmZUEZY",
    sourceType: "YouTube · AI Engineer 频道编码 Agent 架构案例",
    problem: "单 Agent 上下文污染、用户选模型认知负担和多 Agent 产出评审瓶颈限制并行开发。",
    method: "主 Agent 按任务调用 Finder、Oracle、Librarian、Kraken 等专门 Agent；每个子 Agent 使用独立上下文并只返回摘要；系统内部路由模型；终端显示 diff、命令和编辑器诊断；专用 review UI 收口并行结果。",
    effect: "86 分。公开 Amp 的实际产品架构和团队观察：开发者瓶颈从写代码转向审查，实践上同时运行约 2–3 个 Agent；缺少质量和周期对照。",
    human: "人描述架构与目标，观察流式 diff/命令，集中评审子 Agent 产出并决定接受。",
    boundary: "产品发布演讲，自报架构优势；专门 Agent 命名和并发数不等于质量提升证据。",
    relation: "AI Engineer 频道 80+ 精选 #13；评分：具体性22/25、过程22/25、验证17/20、一手14/15、效果11/15。",
    core: false,
    editorScore: 86,
    channelRank: 13,
    channel: "AI Engineer",
  },
  {
    id: "AE9",
    title: "Hard Won Lessons from Building Effective AI Coding Agents",
    org: "Nik Pash / Cline · AI Engineer",
    grade: "B/C",
    mode: "跨模式治理",
    concern: "正确性评估",
    hypotheses: "H1, H2",
    stance: "boundary",
    url: "https://www.youtube.com/watch?v=I8fs4omN1no",
    sourceType: "YouTube · AI Engineer 频道生产经验与 eval 工厂",
    problem: "复杂 RAG、搜索树和工具脚手架未必提升 Agent，真实瓶颈是缺少能代表工程工作的训练和评价环境。",
    method: "从真实用户任务筛选可访问仓库；重建后续提示中的真实意图；定位解决问题的实际 commit；去除 Git 历史防止作弊；生成 Docker 环境与只检查结果的 verifier；发布 ClineBench。",
    effect: "85 分。公开称把单个 RL 环境制作从约 16 小时自动化到 20 分钟内；同时给出复杂 scaffold 可能阻碍强模型的反证观点。",
    human: "人定义任务资格和结果 verifier，审查自动生成环境，并决定 benchmark 是否代表真实工程难度。",
    boundary: "重点是训练/eval 基础设施，不是直接的业务代码交付；20 分钟指标来自厂商自报。",
    relation: "AI Engineer 频道 80+ 精选 #15；评分：具体性23/25、过程22/25、验证19/20、一手13/15、效果8/15。",
    core: false,
    editorScore: 85,
    channelRank: 15,
    channel: "AI Engineer",
  },
  {
    id: "AE10",
    title: "Building pi in a World of Slop",
    org: "Mario Zechner / Pi · AI Engineer",
    grade: "C",
    mode: "人在环路",
    concern: "架构维护",
    hypotheses: "H1, H3a, H3c",
    stance: "boundary",
    url: "https://www.youtube.com/watch?v=RjfbvDXpFls",
    sourceType: "YouTube · AI Engineer 频道开源 harness 案例",
    problem: "功能膨胀和不可见的上下文操作使编码 Agent 行为难预测，也让局部错误累积成不可维护的 slop。",
    method: "Pi 核心只提供 read、write、edit、bash；通过可热加载 TypeScript extensions、skills 和 prompt templates 扩展；上下文完全可观察；Agent 可写扩展自修改；关键代码仍由人阅读。",
    effect: "82 分。公开可复核的 MIT 开源 harness，已被 OpenClaw 等项目嵌入；视频没有生产缺陷、效率或长期维护对照。",
    human: "人选择能力、限制任务范围、检查上下文与关键代码，并对自动化偏见保持主动怀疑。",
    boundary: "强项是可控性和可扩展设计，不是无人自治效果；“更少功能更可靠”仍缺受控比较。",
    relation: "AI Engineer 频道 80+ 精选 #20；评分：具体性21/25、过程21/25、验证16/20、一手14/15、效果10/15。",
    core: false,
    editorScore: 82,
    channelRank: 20,
    channel: "AI Engineer",
  },
  {
    id: "AE11",
    title: "Harness Engineering: How to Build Software When Humans Steer, Agents Execute",
    org: "Ryan Lopopolo / OpenAI · AI Engineer",
    grade: "B",
    mode: "人在环路",
    concern: "架构维护",
    hypotheses: "H1, H2, H3a, H3c",
    stance: "support",
    url: "https://www.youtube.com/watch?v=am_oeAoUhew",
    sourceType: "YouTube · AI Engineer 频道一手团队实践",
    problem: "Agent 吞吐超过人工逐行审查能力，隐性团队知识、重复 review 和不清晰计划成为主要瓶颈。",
    method: "从 ticket 启动 Agent；把质量标准、架构要求和重复 review 固化为 AGENTS.md、skills、lint 与 reviewer agents；按需向轨迹注入上下文；计划如需采用则单独 PR 并逐行审阅；CI 中运行多视角 review–fix 循环。",
    effect: "95 分。OpenAI 团队一手公开日常工作流、上下文与评审矩阵；Speaker 披露大量 Token 用于计划、实现与 CI，但没有独立缺陷和净生产率对照。",
    human: "人选择 ticket、维护质量定义和 harness；高影响计划与最终风险由人批准，Agent 执行与自修复。",
    boundary: "一手生产经验但仍是团队自报；Token 和 PR 吞吐不是质量证明。",
    relation: "AI Engineer 频道 80+ 精选 #2；评分：具体性24/25、过程25/25、验证19/20、一手15/15、效果12/15。",
    core: true,
    editorScore: 95,
    channelRank: 2,
    channel: "AI Engineer",
  },
  {
    id: "AE12",
    title: "How I deleted 95% of my agent skills and got better results",
    org: "Nick Nisi / WorkOS · AI Engineer",
    grade: "B",
    mode: "跨模式治理",
    concern: "正确性评估",
    hypotheses: "H1, H2, H3a",
    stance: "support",
    url: "https://www.youtube.com/watch?v=vy7o1g2iHY8",
    sourceType: "YouTube · AI Engineer 频道内部编码 Agent 复盘",
    problem: "为 20+ SDK 堆积自动生成 skills 后，上下文冲突、Agent 虚假自报测试完成且 eval 变慢。",
    method: "Case 使用 implementer、verifier、reviewer、closer、retro 五角色 TypeScript 状态机；SHA-256 测试证据和 Playwright 视频作为硬门；每项 skill 做有/无 A/B eval；10,000 行自动技能精简为 553 行 gotchas；失败回灌 harness。",
    effect: "95 分。公开测得一项任务成功率由 77% 升至 97%，eval 时间由 68 分钟降至 6 分钟，并显著减少 Token；同时展示内部 issue/PR/Linear/Slack 工作流。",
    human: "人定义状态机与评分器、复核视频/哈希证据，并只在行为证据成立后阅读代码。",
    boundary: "来自单企业内部 eval，样本构成和置信区间未完整公开；不能把 20 个百分点外推到其他仓库。",
    relation: "AI Engineer 频道 80+ 精选 #3；评分：具体性25/25、过程24/25、验证20/20、一手14/15、效果12/15。",
    core: false,
    editorScore: 95,
    channelRank: 3,
    channel: "AI Engineer",
  },
  {
    id: "AE13",
    title: "Multiplayer agentic engineering",
    org: "Arjun Singh / Superconductor · AI Engineer",
    grade: "B/C",
    mode: "人在环路",
    concern: "交付流水线",
    hypotheses: "H1, H2, H3a",
    stance: "support",
    url: "https://www.youtube.com/watch?v=OL7kfezynJM",
    sourceType: "YouTube · AI Engineer 频道企业协作案例",
    problem: "本地单人 Agent 会话把上下文锁在个人机器，并放大团队协调、可见性和评审瓶颈。",
    method: "共享云 sandbox 承载持久会话；Slack、桌面、GitHub 与移动端继续同一轨迹；每个 session 提供 live preview 与 guided review；外部反馈可转为实现；凭据、RBAC 和网络策略集中管理；用历史 merged PR 构建 Personal SWE-Bench。",
    effect: "90 分。团队自报约 99.9% PR 大量由 Agent 生成、100% 人工评审，每月约 15 亿 Token；视频公开五项团队实践。",
    human: "工程师、PM 和设计师共同加入会话、实时引导和评审；Agent 不独立拥有合并责任。",
    boundary: "平台厂商自报，PR 占比和 Token 不代表质量或成本收益；缺少对照与事故数据。",
    relation: "AI Engineer 频道 80+ 精选 #8；评分：具体性24/25、过程23/25、验证18/20、一手14/15、效果11/15。",
    core: false,
    editorScore: 90,
    channelRank: 8,
    channel: "AI Engineer",
  },
  {
    id: "AE14",
    title: "How Claude Code Works",
    org: "Jared Zoneraich / PromptLayer · AI Engineer",
    grade: "B/C",
    mode: "跨模式治理",
    concern: "上下文成本",
    hypotheses: "H1, H2",
    stance: "support",
    url: "https://www.youtube.com/watch?v=RFKCzGlAU6Q",
    sourceType: "YouTube · AI Engineer 频道架构拆解与团队实践",
    problem: "复杂 DAG、RAG 和分类器会增加编码 Agent 的脆弱性，而长上下文和工具噪声降低执行质量。",
    method: "简单 while(tool_call) 主循环；bash 作通用适配器；read/edit/grep/glob 最小工具面；Task 子 Agent 隔离上下文；中段压缩与文件外部记忆；CLAUDE.md 提供项目规则；权限管线拦截工具。",
    effect: "88 分。结合 Claude Code 架构拆解和 PromptLayer 团队实践，公开“1 小时内可由 Agent 完成就立即做”的内部规则；无受控生产效果。",
    human: "人定义项目规则、权限与任务边界，观察工具轨迹并审查最终变更。",
    boundary: "核心实现包含独立逆向分析成分，并非 Anthropic 官方内部说明；团队收益为自报。",
    relation: "AI Engineer 频道 80+ 精选 #11；评分：具体性23/25、过程23/25、验证17/20、一手13/15、效果12/15。",
    core: false,
    editorScore: 88,
    channelRank: 11,
    channel: "AI Engineer",
  },
  {
    id: "AE15",
    title: "Collaborative AI Engineering: One Dev, Two Dozen Agents, Zero Alignment",
    org: "Maggie Appleton / GitHub Next · AI Engineer",
    grade: "B/C",
    mode: "人在环路",
    concern: "交付流水线",
    hypotheses: "H1, H2, H3a",
    stance: "boundary",
    url: "https://www.youtube.com/watch?v=ClWD8OEYgp8",
    sourceType: "YouTube · AI Engineer 频道研究原型案例",
    problem: "Agent 把 issue 到 PR 压缩到数分钟，使团队来不及在实现前对齐，造成重复功能、错误方向和 merge conflict。",
    method: "GitHub Next 的 ACE 为每个会话分配独立 Git branch 与 micro VM；团队共享聊天、完整 prompting history、terminal 和 live preview；计划与实现放在同一多人空间中，而非等到 PR 才协作。",
    effect: "88 分。展示已进入数千用户技术预览的 ACE 原型及具体协作失败模式；没有组织级质量或生产率结果。",
    human: "团队成员在编码前共同对齐，并可随时加入会话、运行命令、查看预览和改变方向。",
    boundary: "研究原型而非成熟生产系统；证明协作机制可用，不证明它消除协调成本。",
    relation: "AI Engineer 频道 80+ 精选 #12；评分：具体性24/25、过程23/25、验证17/20、一手14/15、效果10/15。",
    core: false,
    editorScore: 88,
    channelRank: 12,
    channel: "AI Engineer",
  },
  {
    id: "AE16",
    title: "Recursive Coding Agents",
    org: "Raymond Weitekamp / OpenProse · AI Engineer",
    grade: "B/C",
    mode: "人在环外",
    concern: "长程自治",
    hypotheses: "H1, H2",
    stance: "support",
    url: "https://www.youtube.com/watch?v=3hXJI2q0Jz8",
    sourceType: "YouTube · AI Engineer 频道开源工作流语言案例",
    problem: "成功的 Agent 会话困在聊天历史中，难以版本化、复用、审查和跨超长上下文递归执行。",
    method: "OpenProse 将 workflow 写成 .prose.md 合同；编码 Agent 作为虚拟机执行 phases、gates、loops 和 sub-agent calls；任务上下文外置为符号句柄；递归分片；session-to-prose 从高质量 JSONL 轨迹提取可复用程序。",
    effect: "86 分。公开开源实现、RLM rubric、负对照和 repo-handle 示例；相关 RLM benchmark 较强，但编码生产效果未独立验证。",
    human: "人审阅版本化 prose program、依赖和验证合同；Agent 在合同内递归分解执行。",
    boundary: "部分性能数据来自通用 RLM/推理 benchmark，不等同于真实软件交付质量。",
    relation: "AI Engineer 频道 80+ 精选 #14；评分：具体性23/25、过程23/25、验证18/20、一手13/15、效果9/15。",
    core: false,
    editorScore: 86,
    channelRank: 14,
    channel: "AI Engineer",
  },
  {
    id: "AE17",
    title: "Claude Code & the evolution of agentic coding",
    org: "Boris Cherny / Anthropic · AI Engineer",
    grade: "B",
    mode: "人在环路",
    concern: "交付流水线",
    hypotheses: "H1, H2",
    stance: "support",
    url: "https://www.youtube.com/watch?v=Lue8K2jqfKk",
    sourceType: "YouTube · AI Engineer 频道创建者实践",
    problem: "开发者把编码 Agent 当自动补全，未利用其探索、计划、工具和验证能力。",
    method: "先做代码库 Q&A 与探索；让 Agent 提交计划并获批；用 failing test/TDD 提供目标；通过 CLAUDE.md、slash commands 与 MCP 教会现有工具；在 terminal、GitHub 和 SDK 上复用。",
    effect: "84 分。Claude Code 创建者公开个人与 Anthropic 的使用方法，并称新工程师熟悉代码库周期由数周缩短至数天；缺少实验对照。",
    human: "人批准计划、定义 failing tests、教授工具并审查变更。",
    boundary: "方法一手但结果是观察性自报；不代表所有任务都应使用 Agent 或完全生成代码。",
    relation: "AI Engineer 频道 80+ 精选 #16；评分：具体性21/25、过程22/25、验证18/20、一手15/15、效果8/15。",
    core: false,
    editorScore: 84,
    channelRank: 16,
    channel: "AI Engineer",
  },
  {
    id: "AE18",
    title: "Developer Experience in the Age of AI Coding Agents",
    org: "Max Kanat-Alexander / Capital One · AI Engineer",
    grade: "B/C",
    mode: "跨模式治理",
    concern: "架构维护",
    hypotheses: "H1, H3a, H3c",
    stance: "support",
    url: "https://www.youtube.com/watch?v=rT2Del5pwg4",
    sourceType: "YouTube · AI Engineer 频道企业 DevEx 实践",
    problem: "工具快速变化使企业难以选择长期投资，慢 CI、定制工具和不透明遗留系统同时阻碍人和 Agent。",
    method: "标准化开发环境；关键动作提供 CLI/API；把验证从 15–20 分钟压到约 30 秒反馈；重构可测试和可推理边界；记录设计 why；给具名 reviewer 和响应 SLO。",
    effect: "84 分。基于 Capital One 与二十多年 DevEx 经验给出 no-regrets 清单和恶性/良性循环；未公开具体内部改造数据。",
    human: "工程领导设计环境和 review capacity；工程师承担高质量阅读、架构判断与反馈。",
    boundary: "更接近企业方法复盘而非单项目实验，公开效果证据较弱。",
    relation: "AI Engineer 频道 80+ 精选 #17；评分：具体性21/25、过程22/25、验证18/20、一手14/15、效果9/15。",
    core: false,
    editorScore: 84,
    channelRank: 17,
    channel: "AI Engineer",
  },
  {
    id: "AE19",
    title: "A Piece of Pi: Embedding The OpenClaw Coding Agent In Your Product",
    org: "Matthias Luebken / Tavon · AI Engineer",
    grade: "B/C",
    mode: "跨模式治理",
    concern: "交付流水线",
    hypotheses: "H1, H2, H3b",
    stance: "support",
    url: "https://www.youtube.com/watch?v=vAIDdLKB6-w",
    sourceType: "YouTube · AI Engineer 频道产品嵌入案例",
    problem: "如何把编码 Agent 从个人 CLI 工具变成可审计、可授权、能嵌入 CRM/RFP 等产品的执行内核。",
    method: "Pi Agent Core 提供工具循环；session 映射客户/案例并保留审计状态；TypeScript extensions 订阅事件、拦截 tool call 和注册 UI/命令；以浅层 CLI 暴露 CRM/ERP；OpenClaw 增加路由、sub-agents、gateway 与 sandbox。",
    effect: "84 分。现场展示 runEmbeddedPiAgent 调用链、CRM /pipeline 扩展及客户 RFP 多 Agent 流程；无量化业务对照。",
    human: "产品开发者定义工具、RBAC hook、session 生命周期和外部副作用；业务用户在 UI 中选择和批准。",
    boundary: "早期模式且讲者明确可能快速变化；OpenClaw 涌现能力不等于受控可靠性。",
    relation: "AI Engineer 频道 80+ 精选 #18；评分：具体性23/25、过程22/25、验证17/20、一手13/15、效果9/15。",
    core: false,
    editorScore: 84,
    channelRank: 18,
    channel: "AI Engineer",
  },
  {
    id: "AE20",
    title: "Agentic Engineering: Working With AI, Not Just Using It",
    org: "Brendan O'Leary / Kilo Code · AI Engineer",
    grade: "C",
    mode: "人在环路",
    concern: "架构维护",
    hypotheses: "H1, H3a",
    stance: "support",
    url: "https://www.youtube.com/watch?v=BEKc4P87XKo",
    sourceType: "YouTube · AI Engineer 频道过程演示",
    problem: "把 Agent 当代码生成器会在模糊需求和膨胀上下文中产生技术上可运行、方向上错误的实现。",
    method: "把 Agent 当 junior developer 管理：read-only research 形成研究文档 → 人审阅 → 独立 planning 形成计划 → 新会话只带计划做 implementation → 审查与调试；敏感动作采用 approval-based workflow。",
    effect: "83 分。演讲演示 Kilo Code 不同 mode 支持研究、架构计划与调试；未给出规模化效果指标。",
    human: "人提供上下文、缩小范围、批准研究和计划，并仔细评审实现。",
    boundary: "讲者为工具厂商 DevRel，流程建议具体但效果主要是经验判断。",
    relation: "AI Engineer 频道 80+ 精选 #19；评分：具体性21/25、过程23/25、验证17/20、一手13/15、效果9/15。",
    core: false,
    editorScore: 83,
    channelRank: 19,
    channel: "AI Engineer",
  },
];

const ibmDeveloperRatedCases: CaseRow[] = [
  {
    id: "IBD1",
    title: "Meet Bob: An AI-Powered IDE for Modern Software Development",
    org: "IBM Developer / IBM Bob",
    grade: "B",
    mode: "跨模式治理",
    concern: "交付流水线",
    hypotheses: "H1, H2, H3a, H3c",
    stance: "support",
    url: "https://www.youtube.com/watch?v=Mdbq1dD6Yuo",
    sourceType: "YouTube · IBM Developer 频道产品实战",
    problem: "企业把 AI 补全扩展到完整 SDLC 时，容易在规划、编码、测试、部署和现代化之间丢失上下文、标准与责任边界。",
    method: "以 Ask、Plan、Agent 模式分离理解、设计和执行；用 persona、可复用 playbook、skills、工具调用和专门子 Agent 分解任务；按准确率、时延与成本路由模型；测试、安全扫描和人工审批贯穿交付。",
    effect: "93 分。IBM 公开称 Bob 已覆盖 8 万多名员工，受访者自报平均生产率提升 45%；视频展示从 IDE 中的任务理解到实现的工作方式。",
    human: "人批准计划和高风险动作，维护企业标准、验收与发布责任；Agent 执行可验证的编码和现代化子任务。",
    boundary: "45% 是 IBM 内部受访者自报而非独立对照；视频兼具产品推广属性，不能据此推断缺陷率或长期架构质量。",
    relation: "IBM Developer 频道 80+ 精选 #1；评分：具体性24/25、过程24/25、验证18/20、一手15/15、效果12/15。",
    core: false,
    editorScore: 93,
    channelRank: 1,
    channel: "IBM Developer",
  },
  {
    id: "IBD2",
    title: "IBM ACE Development Agent for ESQL Generation using IBM watsonx",
    org: "IBM Developer · TechCon 2025",
    grade: "C",
    mode: "人在环路",
    concern: "正确性评估",
    hypotheses: "H1, H2, H3a",
    stance: "support",
    url: "https://www.youtube.com/watch?v=jWnCkLMA2W8",
    sourceType: "YouTube · IBM Developer 频道领域编码演示",
    problem: "ACE 集成开发要求理解消息流 XML、节点约束和 ESQL 规则，通用编码 Agent 容易生成语法可读但领域上无效的产物。",
    method: "在 ACE Toolkit 中接入 Bob Shell 和 ace-bob 领域 skill；自然语言描述输入、转换和输出；Agent 生成完整 .msgflow 与 ESQL；开发者审查后部署、运行样例并验证 XML 到 JSON，再让 Agent 分析既有流与引用逻辑。",
    effect: "89 分。现场完成消息流和 ESQL 的生成、部署、测试与既有代码解释；公开视频未披露团队周期、缺陷率或生产事故对照。",
    human: "人提供领域意图、审查生成文件、执行部署测试并决定是否采用；skill 固化专家规则但不替代验收。",
    boundary: "单场厂商演示且缺少规模化指标；演示成功不代表复杂生产集成可以无人审批。",
    relation: "IBM Developer 频道 80+ 精选 #2；评分：具体性25/25、过程24/25、验证19/20、一手14/15、效果7/15。",
    core: false,
    editorScore: 89,
    channelRank: 2,
    channel: "IBM Developer",
  },
  {
    id: "IBD3",
    title: "How to Shift DevOps Left with Terraform, MCP & LLMs",
    org: "IBM Developer / Ash Minhas",
    grade: "C",
    mode: "人在环路",
    concern: "安全合规",
    hypotheses: "H1, H2, H3b",
    stance: "support",
    url: "https://www.youtube.com/watch?v=knIuMPO-IUA",
    sourceType: "YouTube · IBM Developer 频道 IaC 实战",
    problem: "Terraform plan 中的资源替换、公开暴露和宽泛 IAM 等破坏性变化，常在提交或部署后才被发现。",
    method: "在 IDE 接入 Terraform MCP 获取实时 provider 文档、版本和规范；把 plan 导出为机器可读 JSON；自定义脚本用高约束提示要求 LLM 从架构意图、安全姿态和运维风险审查；在 commit 前或 CI 早期输出优先级风险摘要并阻止危险 apply。",
    effect: "88 分。演示识别 RDS 强制替换停机、公开 S3、通配 IAM、SSH 与 KMS 风险，形成“不应直接 apply”的可行动 verdict；无生产事故下降对照。",
    human: "人定义风险策略、审查 LLM verdict 并批准基础设施变更；确定性 Terraform plan 保留为事实源。",
    boundary: "单个计划样例，LLM 风险判断仍可能漏报或误报；必须与策略即代码、测试和审批联合使用。",
    relation: "IBM Developer 频道 80+ 精选 #3；评分：具体性24/25、过程24/25、验证20/20、一手14/15、效果6/15。",
    core: false,
    editorScore: 88,
    channelRank: 3,
    channel: "IBM Developer",
  },
  {
    id: "IBD4",
    title: "Applying API Governance Lifecycle to API Connect with agentic AI tools",
    org: "IBM Developer · TechCon 2025",
    grade: "C",
    mode: "跨模式治理",
    concern: "安全合规",
    hypotheses: "H1, H2, H3a",
    stance: "support",
    url: "https://www.youtube.com/watch?v=tfSeepcMiV4",
    sourceType: "YouTube · IBM Developer 频道 API 生命周期案例",
    problem: "Agent 加速 API 生成后会放大 API 重复、规范不完整、治理规则违规和未测试发布。",
    method: "先按自然语言意图搜索企业 API 目录促进复用；无匹配时生成 OpenAPI；用 Spectral/组织 ruleset 做确定性验证；Agent 给出并应用修复；生成可复用测试；人工确认后发布 API，并在发布边界实施强制治理门禁。",
    effect: "87 分。演示从意图、规格、治理修复、测试到发布的闭环；IBM 早期用户只定性披露缩短 time-to-first API、减少手工治理和提高部署效率。",
    human: "平台团队定义 ruleset 和发布策略；开发者确认语义、修复与最终发布，Agent 负责重复性生命周期操作。",
    boundary: "效果来自厂商与早期用户定性反馈，无公开样本、缺陷或合规违规变化数据。",
    relation: "IBM Developer 频道 80+ 精选 #4；评分：具体性24/25、过程24/25、验证20/20、一手14/15、效果5/15。",
    core: false,
    editorScore: 87,
    channelRank: 4,
    channel: "IBM Developer",
  },
  {
    id: "IBD5",
    title: "Code Smarter, Not Harder with watsonx Code Assistant",
    org: "IBM Developer · TechCon 2025",
    grade: "C",
    mode: "人在环路",
    concern: "正确性评估",
    hypotheses: "H1, H3a",
    stance: "support",
    url: "https://www.youtube.com/watch?v=UwNqkti8zFs",
    sourceType: "YouTube · IBM Developer 频道现场编码演示",
    problem: "企业开发者需要在不离开 IDE 的情况下理解遗留代码、生成和修复实现，并证明改动通过测试。",
    method: "IDE 内实时建议与代码解释 → 生成或修改实现 → 生成测试用例 → 运行测试读取失败 → 定位错误状态码等问题 → 修复并重跑；同时以代码相似度控制降低不当复用风险。",
    effect: "85 分。现场展示创建功能、解释问题、生成测试和修复后测试成功；另一版本演示称数十秒完成原本可能耗时一小时的初版，但属于演示者估计。",
    human: "人选择建议、提出边界、观察测试失败并确认修复；现代化和发布决策仍由工程团队负责。",
    boundary: "现场速度不等于生产净收益；未披露返工、缺陷逃逸、维护性和团队对照。",
    relation: "IBM Developer 频道 80+ 精选 #5；评分：具体性23/25、过程23/25、验证18/20、一手14/15、效果7/15。",
    core: false,
    editorScore: 85,
    channelRank: 5,
    channel: "IBM Developer",
  },
  {
    id: "IBD6",
    title: "IBM DevOps Automation in action",
    org: "IBM Developer · TechCon 2025",
    grade: "C",
    mode: "跨模式治理",
    concern: "交付流水线",
    hypotheses: "H1, H2, H3b",
    stance: "support",
    url: "https://www.youtube.com/watch?v=dIfBc2nbq3Y",
    sourceType: "YouTube · IBM Developer 频道端到端 DevOps 演示",
    problem: "AI 生成代码若与计划、风险、合规、部署和价值流割裂，只会把瓶颈从编码推向交付。",
    method: "从工作项进入代码修改，调用 watsonx Code Assistant 更新应用；把变更接入规划、CI/CD、报告、价值流和部署；以智能合规与发布风险控制作为交付门禁，并在统一视图回看任务与风险。",
    effect: "83 分。端到端 walkthrough 展示代码变更进入 DevOps 平台和风险视图；未公开交付周期、变更失败率或事故改善数据。",
    human: "人定义工作项、检查生成代码、设定合规和发布门禁，并承担部署决策。",
    boundary: "平台演示证明集成路径，不证明 AI 自动化本身提高质量或 ROI。",
    relation: "IBM Developer 频道 80+ 精选 #6；评分：具体性22/25、过程23/25、验证18/20、一手13/15、效果7/15。",
    core: false,
    editorScore: 83,
    channelRank: 6,
    channel: "IBM Developer",
  },
  {
    id: "IBD7",
    title: "Boost Agentic AI Projects: DevEx-Driven Approach to Cloud-Native scaffolding",
    org: "IBM Developer · TechCon 2025",
    grade: "C",
    mode: "人在环路",
    concern: "架构维护",
    hypotheses: "H1, H2, H3c",
    stance: "support",
    url: "https://www.youtube.com/watch?v=O4XlwPg8raE",
    sourceType: "YouTube · IBM Developer 频道云原生脚手架案例",
    problem: "Agent 从空白生成云原生项目时，容易漏掉组织标准、CI/CD、可观测性、安全策略和可维护的 golden path。",
    method: "平台团队先把仓库结构、IaC、流水线、监控和安全策略编码为模板；Agent 读取 service catalog、模板和标准，按开发者意图创建或修改服务，并在触发构建、测试与部署前经过批准。",
    effect: "81 分。58 分钟技术演讲给出 DevEx 与 cloud-native scaffolding 的可操作路径；未披露该方案在生产团队中的量化结果。",
    human: "平台工程师设计架构和 golden path；开发者批准 Agent 对构建、部署和基础设施的动作。",
    boundary: "方法证据强于效果证据；脚手架一致性不能替代业务验收、运行时验证和架构演进治理。",
    relation: "IBM Developer 频道 80+ 精选 #7；评分：具体性22/25、过程22/25、验证17/20、一手13/15、效果7/15。",
    core: false,
    editorScore: 81,
    channelRank: 7,
    channel: "IBM Developer",
  },
];

const ibmTechnologyRatedCases: CaseRow[] = [
  {
    id: "IBT1",
    title: "AI in the SDLC: Rethinking AI Coding Tools & AI Agents",
    org: "IBM Technology / Cedric Clyburn",
    grade: "C",
    mode: "跨模式治理",
    concern: "交付流水线",
    hypotheses: "H1, H2, H3a",
    stance: "support",
    url: "https://www.youtube.com/watch?v=4wMRXmLpdA8",
    sourceType: "YouTube · IBM Technology 频道 SDLC 方法案例",
    problem: "更快生成代码并不自动产生可交付软件，测试、安全和部署仍可能成为新的吞吐瓶颈。",
    method: "先映射 SDLC 各阶段真实瓶颈，再把 Agent 用于跨阶段协调而非仅做补全；建立数据与安全 guardrails；用测试、反馈循环和明确 decision rights 把输出连接到可发布结果；以周期、缺陷和交付结果衡量而非 LOC。",
    effect: "84 分。视频结合研究与工程观察说明相同工具在不同流程中的收益差异，并给出重构工作流的具体控制点；无 IBM 团队受控案例数据。",
    human: "人负责瓶颈选择、架构意图、风险策略、指标和最终责任；Agent 编排测试到部署的可委派工作。",
    boundary: "属于方法型案例而非单一项目复盘，公开效果主要引用外部研究，因果归因有限。",
    relation: "IBM Technology 频道 80+ 精选 #1；评分：具体性22/25、过程23/25、验证19/20、一手14/15、效果6/15。",
    core: false,
    editorScore: 84,
    channelRank: 1,
    channel: "IBM Technology",
  },
  {
    id: "IBT2",
    title: "Spec-Driven Development: AI Assisted Coding Explained",
    org: "IBM Technology",
    grade: "C",
    mode: "人在环路",
    concern: "架构维护",
    hypotheses: "H1, H3a, H3c",
    stance: "support",
    url: "https://www.youtube.com/watch?v=mViFYTwWvcM",
    sourceType: "YouTube · IBM Technology 频道规格驱动流程",
    problem: "Agent 从模糊提示直接实现时，会自行猜测范围、架构和边界，导致功能正确但意图偏离或架构漂移。",
    method: "先建立可演进的单一事实源，明确输入输出、数据模式、边界、约束、边缘情况和成功标准；沿 specify → clarify → plan → tasks → implement → validate 推进；任何方向变化先更新规格再重新计划。",
    effect: "83 分。给出可复用的 spec-first/anchored 流程以及与 TDD、BDD 的关系；未提供该视频对应团队的周期或缺陷对照。",
    human: "人定义和批准规格、解决歧义、校验验收标准与架构取舍；Agent 根据批准合同生成代码和测试。",
    boundary: "规格质量决定结果上限；自然语言规格不是形式化证明，也不能覆盖未表达的业务风险。",
    relation: "IBM Technology 频道 80+ 精选 #2；评分：具体性22/25、过程24/25、验证19/20、一手14/15、效果4/15。",
    core: false,
    editorScore: 83,
    channelRank: 2,
    channel: "IBM Technology",
  },
  {
    id: "IBT3",
    title: "Code Risk Intelligence: Securing AI Coding at Scale in Real Time",
    org: "IBM Technology / Patrick Nyeste",
    grade: "C",
    mode: "人在环路",
    concern: "安全合规",
    hypotheses: "H1, H2, H3b",
    stance: "support",
    url: "https://www.youtube.com/watch?v=lYDkcC9DDaM",
    sourceType: "YouTube · IBM Technology 频道安全门禁案例",
    problem: "AI 提高代码量并降低开发者对代码的熟悉度，使漏洞、不安全依赖、错误 IaC 和配置风险更早且更快进入流水线。",
    method: "把 code risk intelligence 前移到 IDE 生成时、PR 审查和 CI/CD 发布三个控制点；近实时检测风险并解释原因、给出上下文修复；以跨 SDLC 的 security posture 和发布门禁阻止风险逃逸。",
    effect: "80 分。视频给出 IDE—PR—发布三层实时 guardrail 模型及风险类型；没有公开产品部署后的漏洞、误报或变更失败率数据。",
    human: "安全与平台团队定义风险阈值和门禁；开发者处理高风险告警并对发布负责。",
    boundary: "概念与产品方法强、实证效果弱；静态和近实时风险信号不能替代运行时测试、威胁建模与人工判断。",
    relation: "IBM Technology 频道 80+ 精选 #3；评分：具体性21/25、过程21/25、验证20/20、一手14/15、效果4/15。",
    core: false,
    editorScore: 80,
    channelRank: 3,
    channel: "IBM Technology",
  },
];

function buildCaseRows(): CaseRow[] {
  const rows: CaseRow[] = sourceCatalog.map((source) => {
    const detail = practiceDetails[source.no];
    return {
      id: String(source.no),
      title: source.title,
      org: source.org,
      grade: source.grade,
      mode: source.mode,
      concern: source.concern,
      hypotheses: source.hypotheses,
      stance: source.stance,
      url: source.url,
      sourceType: materialSource(source.url, source.org),
      problem: detail?.problem ?? defaultProblem(source.concern),
      method: detail?.method ?? source.claim,
      effect: source.claim,
      human: source.human,
      boundary: source.boundary,
      relation: source.relation,
      core: false,
    };
  });

  evidence.forEach((item) => {
    const sourceType = `${materialSource(item.url, item.org)}${item.video ? " + YouTube 视频" : ""}`;
    const match = rows.find((row) => normalizeUrl(row.url) === normalizeUrl(item.url));
    if (match) {
      match.core = true;
      match.problem = item.problem;
      match.method = item.method;
      match.effect = item.effect;
      match.boundary = item.boundary;
      match.video = item.video;
      match.sourceType = sourceType;
      match.relation = match.relation
        ? `${match.relation}；同时入选 15 项核心证据。`
        : "原 44 项记录，同时入选 15 项核心证据。";
      return;
    }
    rows.push({
      id: `C${item.rank}`,
      title: item.title,
      org: `${item.org} · ${item.date}`,
      grade: item.grade,
      mode: item.mode,
      concern: coreConcern(item.rank),
      hypotheses: coreHypotheses(item.rank),
      stance: item.verdict === "supported" ? "support" : "undetermined",
      url: item.url,
      video: item.video,
      sourceType,
      problem: item.problem,
      method: item.method,
      effect: item.effect,
      human: coreHumanPosition(item.mode),
      boundary: item.boundary,
      relation: "15 项核心证据增补记录；原 44 项中无相同 URL。",
      core: true,
    });
  });
  youtubeCases.forEach((item) => {
    if (!rows.some((row) => normalizeUrl(row.url) === normalizeUrl(item.url))) rows.push(item);
  });
  [...aiEngineerRatedCases, ...ibmDeveloperRatedCases, ...ibmTechnologyRatedCases].forEach((item) => {
    const match = rows.find((row) => normalizeUrl(row.url) === normalizeUrl(item.url));
    if (match) {
      match.editorScore = item.editorScore;
      match.channelRank = item.channelRank;
      match.channel = item.channel;
      match.sourceType = item.sourceType;
      match.problem = item.problem;
      match.method = item.method;
      match.effect = item.effect;
      match.human = item.human;
      match.boundary = item.boundary;
      match.relation = `${match.relation ?? "既有案例"}；${item.relation}`;
    } else {
      rows.push(item);
    }
  });
  return rows;
}

const caseRows = buildCaseRows();

const hypotheses = [
  {
    id: "H1",
    title: "人的职责上移",
    statement: "开放、跨组件且含需求歧义的交付中，人类控制会从代码行审批迁移到意图、计划、验收、架构不变量、证据和异常升级。",
    falsifier: "公开且可复核的复杂系统，在至少 12–24 个月内无需上述控制，仍维持质量、架构与业务结果。",
    verdict: "supported",
    missing: "长期缺陷逃逸、架构漂移、事故与业务结果。",
  },
  {
    id: "H2",
    title: "有边界的环外自治",
    statement: "可信的人在环外成功主要发生在边界清楚、可自动验证、隔离、可回滚且爆炸半径受限的任务。",
    falsifier: "无人审核复杂系统公开长期 SLA、重大事故、安全合规审计、回滚与业务结果。",
    verdict: "supported",
    missing: "复杂系统级、长期、多维、独立审计证据。",
  },
  {
    id: "H3a",
    title: "架构治理抑制腐化",
    statement: "架构约束、小批次与自动反馈的组合能够抑制 AI 高吞吐引发的架构腐化。",
    falsifier: "受控纵向数据表明组合治理不降低返工、耦合、缺陷或技术债。",
    verdict: "undetermined",
    missing: "跨周期、带对照的架构健康与返工数据；现有材料以相关性和厂商案例为主。",
  },
  {
    id: "H3b",
    title: "专门安全门禁",
    statement: "功能测试和普通代码审查不足以覆盖 Agentic Engineering 的安全风险，必须设置专门安全门。",
    falsifier: "现代模型在多语言生产任务中不劣于人工，且普通审查与专门安全评估等效。",
    verdict: "supported",
    missing: "2026 前沿模型的独立、多语言、生产分布研究，以及门禁效力的纵向数据。",
  },
  {
    id: "H3c",
    title: "选择性上下文",
    statement: "选择性、结构化、按需加载的上下文可以降低成本并维持或改善任务质量。",
    falsifier: "固定模型和任务后，选择性检索不降低成本，或持续降低成功率。",
    verdict: "supported",
    missing: "长程生产 Agent 的总成本、缓存、失败重试与质量联合测量。",
  },
];

const acceptances = [
  {
    id: "AT-01",
    name: "人在环路不退化为逐行瓶颈",
    control: "验收方指定人类必须批准的决策类型，而非默认审核全部代码。",
    observe: "可看到意图、计划、业务验收、架构例外、风险升级和最终接受/退回理由。",
    expected: "低风险例行工作自动闭环；高影响或不确定事项到达具名责任人。",
  },
  {
    id: "AT-02",
    name: "环外任务资格",
    control: "验收方预先冻结目标、评价函数、权限、预算、停止条件、回滚方式和爆炸半径。",
    observe: "留出测试、失败轨迹、越权尝试、回滚记录和结果指标独立于执行 Agent。",
    expected: "仅当全部边界可验证且失败可控时，才允许无人运行。",
  },
  {
    id: "AT-03",
    name: "多维生产可信性",
    control: "验收方不得用测试通过、代码量、PR 数或 benchmark 单指标代替发布判断。",
    observe: "功能、性能、稳定性、安全隐私、合规、维护性、成本均有证据或明确不适用理由。",
    expected: "任何必需维度证据不足时，状态只能是未确定，不能静默视为通过。",
  },
  {
    id: "AT-04",
    name: "架构不随生成速度腐化",
    control: "验收方声明模块边界、依赖方向和允许例外，并要求变更前后比较。",
    observe: "结构规则、耦合变化、架构例外、重复失败模式及偿债记录可读。",
    expected: "Agent 不能以局部测试通过覆盖系统级架构退化。",
  },
  {
    id: "AT-05",
    name: "安全边界不依赖模型自律",
    control: "验收方阻断私密数据、不可信输入和外部通信的危险组合，并限制身份与工具权限。",
    observe: "越权调用、敏感数据访问、外传路径、批准疲劳和隔离逃逸均被记录。",
    expected: "模型或人工误判时，确定性边界仍限制损害。",
  },
  {
    id: "AT-06",
    name: "收益可归因",
    control: "验收方采用交付结果、返工、事故、等待时间和总成本，而非主观提速或代码量。",
    observe: "有基线、时间窗口、任务组合和质量标准，且记录选择偏差和并行工作。",
    expected: "只有净业务结果改善且风险未转移时，才判定投资有效。",
  },
];

function VerdictPill({ verdict }: { verdict: Verdict }) {
  return <Pill active={verdict === "supported"} size="sm">{verdict}</Pill>;
}

function Overview() {
  return (
    <Stack gap={20}>
      <Callout tone="warning" title="单一结论：SUPPORTED（有条件，截至 2026-08）">
        没有发现公开、长期、多维生产结果充分的复杂系统级无人审核案例。这不是证明无人化不可能，而是证据尚未跨过可信门槛。
      </Callout>
      <Grid columns={4} gap={16}>
        <Stat value="44" label="完整来源记录" />
        <Stat value="6" label="优先深挖" tone="info" />
        <Stat value="4/5" label="假设获条件支持" tone="success" />
        <Stat value="0" label="决定性环外反例" tone="warning" />
      </Grid>
      <Text tone="secondary">44 个原始编号全部保留；其中同一研究阶段和同一案例的补充材料建立关联，但不伪装成独立证据。H3a 架构治理效果仍为未确定。</Text>
      <Grid columns="1.2fr 1fr" gap={20}>
        <Stack gap={10}>
          <H2>核心判断</H2>
          <Text>问题不是“人是否存在”，而是人在什么层级拥有最终控制权。</Text>
          <Text><Text weight="semibold">开放式复杂交付：</Text>人控制价值目标、需求歧义、验收语义、架构取舍、风险接受与发布责任；Agent 执行、验证、解释和积累证据。</Text>
          <Text><Text weight="semibold">有界自治：</Text>当目标可形式化、结果可独立评分、环境隔离、失败可回滚且爆炸半径低时，运行中人工介入可接近零。</Text>
          <Text><Text weight="semibold">真正瓶颈：</Text>代码生成已不再稀缺；可靠规格、可信评价、风险边界和人类注意力成为稀缺资源。</Text>
        </Stack>
        <Card>
          <CardHeader trailing={<Pill active size="sm">优先研究</Pill>}>六项首读</CardHeader>
          <CardBody>
            <Stack gap={8}>
              {evidence.filter((item) => item.priority).map((item) => (
                <Row gap={8} align="center">
                  <Text tone="tertiary" size="small">{item.rank}</Text>
                  <Link href={item.url}>{item.title}</Link>
                </Row>
              ))}
            </Stack>
          </CardBody>
        </Card>
      </Grid>
      <Divider />
      <H2>“人在环路”还包括什么</H2>
      <Grid columns={3} gap={16}>
        <Stack gap={6}>
          <H3>事前：定义可交付意图</H3>
          <Text>选择值得解决的问题；澄清业务边界与禁止项；定义验收方能读懂的业务场景、控制点和观测点；批准架构与风险预算。</Text>
        </Stack>
        <Stack gap={6}>
          <H3>事中：管理系统而非逐行盯人</H3>
          <Text>批准高影响计划；维护规格、工具、权限和环境；抽查评价器；处理歧义、冲突与异常升级；阻止指标投机。</Text>
        </Stack>
        <Stack gap={6}>
          <H3>事后：承担结果责任</H3>
          <Text>审阅分层证据而非仅看 diff；决定接受、退回、限制、修正或停止；复盘事故；把重复失败固化为规则、测试和约束。</Text>
        </Stack>
      </Grid>
      <H2>人在环外的真实答案</H2>
      <Text>有，但当前是“任务级环外”，不是“复杂产品责任级环外”。AlphaEvolve 是最强正例；StrongDM 是最值得持续跟踪的挑战者。是否可环外，应由五个门槛共同决定：评价可执行、环境隔离、动作可逆、损害受限、结果可独立观测。</Text>
    </Stack>
  );
}

function EvidenceLibrary() {
  const [filter, setFilter] = useCanvasState<"全部" | Mode>("evidence-filter", "全部");
  const visible = filter === "全部" ? evidence : evidence.filter((item) => item.mode === filter);
  return (
    <Stack gap={16}>
      <Row gap={8} wrap>
        {(["全部", "人在环路", "人在环外", "跨模式治理"] as const).map((item) => (
          <Pill active={filter === item} onClick={() => setFilter(item)}>
            {item}
          </Pill>
        ))}
      </Row>
      <Text tone="secondary">证据等级：A = 同行评审或较强独立研究；B = 一手工程案例/权威方法但存在自报或观察性限制；C = 值得跟踪的厂商实验或宣言，不能单独支撑投资决策。</Text>
      {visible.map((item) => (
        <CollapsibleSection
          title={`${item.rank}. ${item.title}`}
          trailing={<Text size="small" tone="tertiary">{item.grade} · {item.org} · {item.date}</Text>}
          defaultOpen={item.priority}
        >
          <Stack gap={8}>
            <Row gap={10} wrap>
              <Pill size="sm" active>{item.mode}</Pill>
              <Pill size="sm">{item.medium}</Pill>
              <VerdictPill verdict={item.verdict} />
              <Link href={item.url}>原文</Link>
              {item.video ? <Link href={item.video}>视频</Link> : null}
            </Row>
            <Text><Text weight="semibold">业界问题：</Text>{item.problem}</Text>
            <Text><Text weight="semibold">方法：</Text>{item.method}</Text>
            <Text><Text weight="semibold">效果：</Text>{item.effect}</Text>
            <Text tone="secondary"><Text weight="semibold">不能外推：</Text>{item.boundary}</Text>
          </Stack>
        </CollapsibleSection>
      ))}
    </Stack>
  );
}

function FullCatalog() {
  const [mode, setMode] = useCanvasState<"全部" | Mode>("catalog-mode", "全部");
  const [concern, setConcern] = useCanvasState<"全部" | CatalogSource["concern"]>("catalog-concern", "全部");
  const concerns: Array<"全部" | CatalogSource["concern"]> = ["全部", "正确性评估", "架构维护", "安全合规", "长程自治", "上下文成本", "交付流水线"];
  const visible = sourceCatalog.filter((source) =>
    (mode === "全部" || source.mode === mode) &&
    (concern === "全部" || source.concern === concern)
  );
  return (
    <Stack gap={16}>
      <Callout tone="info" title="44 项已全部整合">
        编号与 docs/agentic-engineering-practices-report.md 一一对应。重复案例保留原编号和 URL，同时用“证据关系”标注合并方式；筛选数量是来源记录数，不等于独立因果证据数。
      </Callout>
      <Row gap={8} wrap>
        {(["全部", "人在环路", "人在环外", "跨模式治理"] as const).map((item) => (
          <Pill active={mode === item} onClick={() => setMode(item)}>{item}</Pill>
        ))}
      </Row>
      <Row gap={8} wrap>
        {concerns.map((item) => (
          <Pill active={concern === item} onClick={() => setConcern(item)}>{item}</Pill>
        ))}
      </Row>
      <Row gap={12} align="center">
        <Stat value={String(visible.length)} label="当前筛选记录" />
        <Text tone="secondary">等级保留原报告口径；出现混合等级时，artifact 可复核性与效果证据强度分别判断。</Text>
      </Row>
      {visible.map((source) => (
        <CollapsibleSection
          title={`${source.no}. ${source.title}`}
          trailing={<Text size="small" tone="tertiary">{source.grade} · {source.org}</Text>}
        >
          <Stack gap={8}>
            <Row gap={8} wrap>
              <Pill size="sm" active>{source.mode}</Pill>
              <Pill size="sm">{source.concern}</Pill>
              <Pill size="sm" active={source.stance === "support"}>{source.stance}</Pill>
              <Text size="small" tone="tertiary">{source.hypotheses}</Text>
              <Link href={source.url}>原始材料</Link>
            </Row>
            <Text><Text weight="semibold">观点 / 结果：</Text>{source.claim}</Text>
            <Text tone="secondary"><Text weight="semibold">禁止外推：</Text>{source.boundary}</Text>
            <Text><Text weight="semibold">人的控制位置：</Text>{source.human}</Text>
            {source.relation ? <Text size="small" tone="tertiary"><Text weight="semibold">证据关系：</Text>{source.relation}</Text> : null}
          </Stack>
        </CollapsibleSection>
      ))}
    </Stack>
  );
}

function DecisionTree() {
  return (
    <Stack gap={18}>
      <Callout tone="info" title="拆解维度与 MECE 论证">
        第一层按失败后是否需要人承担不可逆责任切分；第二层按结果能否被独立机器验证切分；第三层按环境风险是否可隔离和回滚切分。每个任务在同一时点只能落入一个叶节点，且所有任务都能按三个二元问题归类，因此互斥且穷尽。
      </Callout>
      <Card>
        <CardHeader>三层业务决策树</CardHeader>
        <CardBody>
          <Stack gap={10}>
            <CollapsibleSection title="L1：失败是否可能产生不可接受或不可逆后果？" defaultOpen>
              <CollapsibleSection title="是 → 必须保留具名人类接受权" defaultOpen>
                <CollapsibleSection title="L2：结果是否可被独立、完整、机器化验证？" defaultOpen>
                  <Text>否 → 人在环路/on-the-loop：人批准意图、业务验收、架构例外、风险接受和发布。</Text>
                  <Text>是 → 进入 L3，但机器验证不能替代责任归属。</Text>
                </CollapsibleSection>
                <CollapsibleSection title="L3：环境是否隔离、动作是否可逆、爆炸半径是否受限？">
                  <Text>否 → 运行前和关键动作前人工批准。</Text>
                  <Text>是 → 可自动执行与验证，最终风险接受仍由人承担。</Text>
                </CollapsibleSection>
              </CollapsibleSection>
              <CollapsibleSection title="否 → 可评估任务级环外">
                <CollapsibleSection title="L2：是否存在独立于执行 Agent 的客观 evaluator？">
                  <Text>否 → 不能环外；先补验收语义或降级为探索实验。</Text>
                  <Text>是 → 进入 L3。</Text>
                </CollapsibleSection>
                <CollapsibleSection title="L3：是否具备权限最小化、预算/停止条件、回滚和观测？">
                  <Text>是 → 允许环外运行；定期人工校准 evaluator 和边界。</Text>
                  <Text>否 → 只能在 sandbox 中试验，不得视为生产自治。</Text>
                </CollapsibleSection>
              </CollapsibleSection>
            </CollapsibleSection>
          </Stack>
        </CardBody>
      </Card>
      <H2>分支假设与证伪状态</H2>
      {hypotheses.map((hypothesis) => (
        <Card>
          <CardHeader trailing={<Pill active size="sm">{hypothesis.verdict}</Pill>}>{hypothesis.id}</CardHeader>
          <CardBody>
            <Stack gap={7}>
              <Text><Text weight="semibold">假设：</Text>{hypothesis.statement}</Text>
              <Text><Text weight="semibold">可证伪条件：</Text>{hypothesis.falsifier}</Text>
              <Text tone="secondary"><Text weight="semibold">尚缺证据：</Text>{hypothesis.missing}</Text>
            </Stack>
          </CardBody>
        </Card>
      ))}
    </Stack>
  );
}

function ArchitectureAndAcceptance() {
  return (
    <Stack gap={18}>
      <Callout tone="neutral" title="分析视角">
        Requirements Realization Viewpoint；Concern：外部证据能否支撑可信 Agentic Engineering 的业务要求与验收；Purpose：审计与决策；Scope：控制模式、生产风险、验收证据和依赖顺序。这里是业务分析视图，不修改 canonical 意图图谱。
      </Callout>
      <H2>横向切分：可并行演进的业务 concern</H2>
      <Grid columns={3} gap={16}>
        <Stack gap={5}><H3>意图与价值</H3><Text>问题选择、需求边界、业务目标、禁止项、验收语义。</Text></Stack>
        <Stack gap={5}><H3>行为正确性</H3><Text>功能场景、留出测试、模型评价校准、结果证据。</Text></Stack>
        <Stack gap={5}><H3>安全与责任</H3><Text>身份、权限、隔离、隐私合规、风险接受、审计。</Text></Stack>
        <Stack gap={5}><H3>架构可演化性</H3><Text>模块边界、依赖方向、耦合、技术债、知识持续性。</Text></Stack>
        <Stack gap={5}><H3>运行质量</H3><Text>性能、稳定性、可观测、事故、恢复和回滚。</Text></Stack>
        <Stack gap={5}><H3>经济有效性</H3><Text>总交付周期、返工、人工注意力、推理与基础设施成本。</Text></Stack>
      </Grid>
      <H2>纵向依赖：缺一不可的顺序</H2>
      <Text>业务意图与风险分级 → 可观察验收语义 → 架构与权限边界 → 隔离执行环境 → 多层评价与证据 → 人类接受/自动接受策略 → 发布与运行观测 → 事故恢复与规则回灌。</Text>
      <Text tone="secondary">如果上游没有可验证的意图和边界，下游再强的测试、review Agent 或模型都只能证明“某些检查通过”，不能证明“系统值得上线”。</Text>
      <Divider />
      <H2>业务验收测试</H2>
      {acceptances.map((item) => (
        <CollapsibleSection title={`${item.id} · ${item.name}`} defaultOpen>
          <Stack gap={6}>
            <Text><Text weight="semibold">验收控制点：</Text>{item.control}</Text>
            <Text><Text weight="semibold">验收观测点：</Text>{item.observe}</Text>
            <Text><Text weight="semibold">预期业务结果：</Text>{item.expected}</Text>
          </Stack>
        </CollapsibleSection>
      ))}
    </Stack>
  );
}

function StudyPlan() {
  const priorities = evidence.filter((item) => item.priority);
  return (
    <Stack gap={18}>
      <H2>建议的详细分析顺序</H2>
      {priorities.map((item, index) => (
        <Card>
          <CardHeader trailing={<Pill size="sm">{item.grade} 级</Pill>}>{index + 1}. {item.title}</CardHeader>
          <CardBody>
            <Stack gap={7}>
              <Text>{item.problem}</Text>
              <Text tone="secondary">{item.boundary}</Text>
              <Link href={item.url}>打开原始材料</Link>
            </Stack>
          </CardBody>
        </Card>
      ))}
      <H2>每篇材料统一提问模板</H2>
      <Grid columns={2} gap={16}>
        <Stack gap={5}><H3>问题与因果链</H3><Text>它声称解决的具体问题是什么？问题如何测量？方法中的哪个机制导致哪个结果？有没有替代解释？</Text></Stack>
        <Stack gap={5}><H3>自治边界</H3><Text>人定义什么、批准什么、观察什么、承担什么？Agent 能采取哪些不可逆动作？失败后谁停止？</Text></Stack>
        <Stack gap={5}><H3>证据质量</H3><Text>是一手生产数据、实验、观察调查还是宣传？有无基线、对照、时间窗口、独立复现和负面结果？</Text></Stack>
        <Stack gap={5}><H3>禁止外推</H3><Text>代码量、PR 数、benchmark、测试通过、主观提速分别不能证明什么？适用产品和风险等级是什么？</Text></Stack>
        <Stack gap={5}><H3>生产可信性</H3><Text>功能、性能、稳定性、安全隐私、合规、维护性和成本分别有哪些证据？缺失维度必须标为未确定。</Text></Stack>
        <Stack gap={5}><H3>可证伪跟踪</H3><Text>什么未来事实会推翻当前判断？优先索取 SLA、缺陷逃逸、事故、架构漂移、审计和净业务结果。</Text></Stack>
      </Grid>
      <Callout tone="warning" title="当前最值得主动追问">
        向 StrongDM 索取 12–24 个月的生产范围、缺陷率、SLA、事故、恢复、安全合规审计与独立评价；它是最可能改变总体判断的公开候选。
      </Callout>
    </Stack>
  );
}

function ReferenceStyleReport() {
  const theme = useHostTheme();
  const [query, setQuery] = useCanvasState("ae-refresh-query", "");
  const [grade, setGrade] = useCanvasState("ae-refresh-grade", "全部");
  const [hypothesis, setHypothesis] = useCanvasState("ae-refresh-hypothesis", "全部");
  const [mode, setMode] = useCanvasState("ae-refresh-mode", "全部");
  const [concern, setConcern] = useCanvasState("ae-refresh-concern", "全部");
  const [stance, setStance] = useCanvasState("ae-refresh-stance", "全部");
  const [format, setFormat] = useCanvasState("ae-refresh-format", "全部");

  const filtered = caseRows.filter((source) => {
    const gradeMatch =
      grade === "全部" ||
      (grade === "A/B"
        ? source.grade.startsWith("A") || source.grade.startsWith("B")
        : source.grade.startsWith(grade));
    const hypothesisMatch = hypothesis === "全部" || source.hypotheses.includes(hypothesis);
    const modeMatch = mode === "全部" || source.mode === mode;
    const concernMatch = concern === "全部" || source.concern === concern;
    const stanceMatch = stance === "全部" || source.stance === stance;
    const formatMatch = format === "全部" || source.sourceType.includes(format);
    const haystack = `${source.id} ${source.title} ${source.org} ${source.grade} ${source.mode} ${source.concern} ${source.hypotheses} ${source.stance} ${source.sourceType} ${source.problem} ${source.method} ${source.effect} ${source.boundary} ${source.human} ${source.relation ?? ""}`.toLowerCase();
    return gradeMatch && hypothesisMatch && modeMatch && concernMatch && stanceMatch && formatMatch && haystack.includes(query.toLowerCase());
  }).sort((a, b) => ["AI Engineer", "IBM Developer", "IBM Technology"].includes(format) ? (a.channelRank ?? 999) - (b.channelRank ?? 999) : 0);

  const priorityEvidence = evidence.filter((item) => item.priority);

  return (
    <Stack gap={20} style={{ padding: 24, maxWidth: 1500, margin: "0 auto", color: theme.text.primary }}>
      <div>
        <Text tone="tertiary" size="small">证据截止：2026-08-11 · BusinessPartner 只读研究</Text>
        <H1>Agentic Engineering：从“会写代码”到“可信交付”</H1>
        <Text tone="secondary">
          研究问题不是 Agent 能否长时间运行，而是：在复杂系统中，谁定义正确、谁证明正确、谁承担不可逆后果。
        </Text>
      </div>

      <Grid columns={4} gap={14}>
        <Stat value={caseRows.length} label="去重后案例资料" />
        <Stat value={caseRows.filter((item) => item.grade.startsWith("A") || item.grade.startsWith("B")).length} label="A/B 证据资料" />
        <Stat value="0" label="开放式无人门禁生产反例" tone="warning" />
        <Stat value="1 / 5" label="仍证据不足的核心假设" tone="warning" />
      </Grid>

      <Callout tone="warning" title="当前最稳健结论">
        <Text>
          生产可行路径不是“人审所有代码”，也不是“人彻底退出”，而是风险分级的 supervisory engineering：
          低风险、可验证、可回滚工作自动通过；高风险、不可逆或异常工作升级给人。代码吞吐、测试通过和 benchmark
          得分都不能单独证明生产可信。
        </Text>
      </Callout>

      <H2>三层 MECE 决策树</H2>
      <Text tone="secondary">
        拆解维度依次是“生产失败对象 → 控制时点 → 自治边界”。第一层按结果、系统、治理成本穷尽生产风险且互不重叠；
        第二层按变更发生前/中/后穷尽控制时点；第三层按风险、可验证性、隔离和可逆性决定人应在环内、环上还是环外。
      </Text>
      <Grid columns={3} gap={14}>
        <Card>
          <CardHeader>第一层：生产失败对象</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <Text><Text weight="semibold">A. 结果正确性</Text>：功能、性能、稳定性、安全、隐私、合规。</Text>
              <Text><Text weight="semibold">B. 系统完整性</Text>：架构边界、可维护性、依赖方向、知识连续性。</Text>
              <Text><Text weight="semibold">C. 治理经济性</Text>：人类注意力、返工、Token、算力、审计与责任。</Text>
            </Stack>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>第二层：控制时点</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <Text><Text weight="semibold">预防</Text>：意图、规格、架构规则、权限、隔离、小批次。</Text>
              <Text><Text weight="semibold">检测</Text>：业务验收、测试、性能、安全、合规、轨迹与监控。</Text>
              <Text><Text weight="semibold">纠正</Text>：回滚、重试上限、异常升级、事故学习、规则更新。</Text>
            </Stack>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>第三层：自治边界</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <Text><Text weight="semibold">L0 环内</Text>：开放、高风险、不可逆、无法自动判定。</Text>
              <Text><Text weight="semibold">L1 环上</Text>：低风险自动执行，人监控并处理异常。</Text>
              <Text><Text weight="semibold">L2 环外</Text>：目标清晰、oracle 独立可靠、环境隔离且可回滚。</Text>
              <Text><Text weight="semibold">L3 无人负责</Text>：当前没有可信生产证据支持。</Text>
            </Stack>
          </CardBody>
        </Card>
      </Grid>

      <H2>假设状态</H2>
      <Grid columns="repeat(auto-fit, minmax(250px, 1fr))" gap={12}>
        {hypotheses.map((item) => (
          <div>
            <Card collapsible defaultOpen={item.verdict === "undetermined"}>
              <CardHeader trailing={<VerdictPill verdict={item.verdict as Verdict} />}>{item.id} · {item.title}</CardHeader>
              <CardBody>
                <Stack gap={8}>
                  <Text>{item.statement}</Text>
                  <Divider />
                  <Text size="small" tone="secondary"><Text weight="semibold">证伪条件：</Text>{item.falsifier}</Text>
                  <Text size="small" tone="tertiary"><Text weight="semibold">缺失证据：</Text>{item.missing}</Text>
                </Stack>
              </CardBody>
            </Card>
          </div>
        ))}
      </Grid>

      <H2>统一资料清单</H2>
      <Text tone="secondary">
        44 个原始编号全部保留并与 docs/agentic-engineering-practices-report.md 一一对应；15 项核心证据不再单列，而是在本清单中标记并补全深析字段。
        相同 URL 合并为一条；核心证据中原清单没有的资料以 C1–C15 增补，因此“案例资料数”不等于 44 + 15，也不等于独立因果证据数。
      </Text>
      <Text tone="secondary">
        观点与工程机制用于形成假设；公开效果用于判断观测到什么；边界说明不能据此推出什么。厂商自报、个人演讲和 PR/LOC
        指标不能替代独立质量、事故、架构和经济性证据。
      </Text>
      <Callout tone="info" title="新增 10 项 YouTube 过程型案例">
        本轮只纳入能观察到规格/上下文、执行编排、测试门禁、隔离环境或人工审批过程的视频；Stripe、Cursor、Anthropic、GitHub、HumanLayer、JetBrains、LocalStack、Resolve AI 与独立实践者案例均保留来源属性和自报边界。
      </Callout>
      <Callout tone="neutral" title="AI Engineer 频道 Agentic Coding 80+ 精选">
        评分不是播放量或点赞数，而是工程证据评分：案例具体性 25、过程完整性 25、验证与控制机制 20、一手可复核性 15、公开效果 15。所有达到 80 分及以上且聚焦编码工程的案例均已并入列表；相同 URL 合并，不重复计数。
      </Callout>
      <Callout tone="neutral" title="IBM Developer 与 IBM Technology 频道 80+ 精选">
        以相同五维标准复核两个指定频道，纳入 IBM Developer 7 项、IBM Technology 3 项。IBM Developer 以 Bob、ACE/ESQL、Terraform、API 治理和 DevOps 实战为主；IBM Technology 只保留达到门槛的 SDLC、规格驱动和代码风险方法案例，纯概念解释、新闻和产品发布不纳入。
      </Callout>
      <Callout tone="info" title="如何筛出高价值阅读">
        <Text>将证据设为 A/B，再选择 H1、H2、H3a、H3b 或 H3c；结合当前待验证假设阅读，而不是仅按知名度排序。</Text>
      </Callout>
      <Grid columns="repeat(auto-fit, minmax(145px, 1fr))" gap={12}>
        <Stat value={caseRows.length} label="去重后案例资料" />
        <Stat value={evidence.length} label="已整合核心证据" tone="info" />
        <Stat value={youtubeCases.length} label="新增 YouTube 过程案例" tone="info" />
        <Stat value={aiEngineerRatedCases.length} label="AI Engineer 频道 80+ 案例" tone="info" />
        <Stat value={ibmDeveloperRatedCases.length} label="IBM Developer 80+ 案例" tone="info" />
        <Stat value={ibmTechnologyRatedCases.length} label="IBM Technology 80+ 案例" tone="info" />
        <Stat value={caseRows.filter((item) => item.grade.startsWith("A") || item.grade.startsWith("B")).length} label="A/B 资料" />
        <Stat value={caseRows.filter((item) => item.mode === "人在环路").length} label="人在环路" />
        <Stat value={caseRows.filter((item) => item.mode === "人在环外").length} label="人在环外" />
        <Stat value={caseRows.filter((item) => item.concern === "安全合规").length} label="安全 / 合规" />
        <Stat value={caseRows.filter((item) => item.stance === "counterexample").length} label="显式反例" tone="warning" />
      </Grid>
      <Row gap={8} wrap align="center">
        <TextInput
          type="search"
          value={query}
          onChange={setQuery}
          placeholder="搜索资料、来源、问题、方法、效果或证据边界"
          style={{ minWidth: 300 }}
        />
        <Select
          value={grade}
          onChange={setGrade}
          options={["全部", "A/B", "A", "B", "C", "D"].map((value) => ({ value, label: `证据：${value}` }))}
        />
        <Select
          value={hypothesis}
          onChange={setHypothesis}
          options={["全部", "H1", "H2", "H3a", "H3b", "H3c"].map((value) => ({ value, label: `假设：${value}` }))}
        />
        <Select
          value={mode}
          onChange={setMode}
          options={["全部", "人在环路", "人在环外", "跨模式治理"].map((value) => ({ value, label: `模式：${value}` }))}
        />
        <Select
          value={concern}
          onChange={setConcern}
          options={["全部", "正确性评估", "架构维护", "安全合规", "长程自治", "上下文成本", "交付流水线"].map((value) => ({ value, label: `机制：${value}` }))}
        />
        <Select
          value={stance}
          onChange={setStance}
          options={["全部", "support", "boundary", "counterexample", "undetermined"].map((value) => ({ value, label: `判定：${value}` }))}
        />
        <Select
          value={format}
          onChange={setFormat}
          options={["全部", "YouTube", "AI Engineer", "IBM Developer", "IBM Technology"].map((value) => ({ value, label: `来源：${value}` }))}
        />
        <Pill size="sm">{filtered.length} 项</Pill>
      </Row>
      {filtered.length > 0 && (
        <Table
          stickyHeader
          striped
          headers={["案例资料 / 分类", "材料来源", "解决的问题", "工程方法总结", "公开效果", "支持 / 反驳假设", "人的控制位置", "证据与适用边界", "证据关系"]}
          rows={filtered.map((source) => [
            <Stack gap={4}>
              <Link href={source.url}>{source.id}. {source.title}</Link>
              <Text size="small" tone="tertiary">{source.org}</Text>
              <Row gap={4} wrap>
                {source.channelRank ? <Pill size="sm" active>{source.channel ?? "频道"} #{source.channelRank} · {source.editorScore} 分</Pill> : null}
                {source.core ? <Pill size="sm" active>核心证据</Pill> : null}
                <Pill size="sm">{source.mode}</Pill>
                <Pill size="sm">{source.concern}</Pill>
              </Row>
            </Stack>,
            <Stack gap={4}>
              <Text size="small">{source.sourceType}</Text>
              <Link href={source.url}>原始材料</Link>
              {source.video ? <Link href={source.video}>YouTube 视频</Link> : null}
            </Stack>,
            <Text size="small">{source.problem}</Text>,
            <Text size="small">{source.method}</Text>,
            <Text size="small">{source.effect}</Text>,
            <Stack gap={4}>
              <Text size="small" weight="semibold">{source.hypotheses}</Text>
              <Pill size="sm" active={source.stance === "support"}>{source.stance}</Pill>
            </Stack>,
            <Text size="small">{source.human}</Text>,
            <Stack gap={5}>
              <Text size="small" weight="semibold">{source.grade}</Text>
              <Text size="small" tone="secondary">{source.boundary}</Text>
            </Stack>,
            <Text size="small" tone="tertiary">{source.relation ?? "独立来源记录"}</Text>,
          ])}
          rowTone={filtered.map((source) =>
            source.stance === "counterexample" ? "info" :
            source.stance === "undetermined" ? "warning" :
            source.stance === "support" ? "success" :
            "neutral"
          )}
          style={{ maxHeight: 900 }}
        />
      )}

      <H3>跨案例可复用的工程结构</H3>
      <Grid columns={3} gap={14}>
        <Card>
          <CardHeader>控制面</CardHeader>
          <CardBody><Text>Issue、Slack 或 Linear 负责意图与状态；风险分级决定自动执行或升级；权限规则、网络 allowlist、临时凭证和 sandbox 限制副作用。</Text></CardBody>
        </Card>
        <Card>
          <CardHeader>执行与反馈面</CardHeader>
          <CardBody><Text>每任务隔离环境；Git 或事件日志承载长期状态；lint、测试、CI、架构检查、性能指标和运行可观测性形成 plan–act–observe–verify 闭环。</Text></CardBody>
        </Card>
        <Card>
          <CardHeader>责任与恢复面</CardHeader>
          <CardBody><Text>短 PR、重试上限、checkpoint、回滚、break-glass 和异常升级控制失败半径；人负责目标、评价器、高风险例外与最终责任。</Text></CardBody>
        </Card>
      </Grid>

      <Callout tone="neutral" title="分析视角与依赖">
        <Text>Requirements Realization Viewpoint；Concern：外部证据能否支撑可信 Agentic Engineering 的业务要求与验收；Purpose：审计与决策。本页不修改 canonical 意图图谱。</Text>
      </Callout>
      <H3>横向 concern 与纵向依赖</H3>
      <Grid columns={3} gap={14}>
        <Stack gap={5}><Text weight="semibold">意图与价值</Text><Text>问题选择、需求边界、业务目标、禁止项、验收语义。</Text></Stack>
        <Stack gap={5}><Text weight="semibold">行为正确性</Text><Text>功能场景、留出测试、评价校准与结果证据。</Text></Stack>
        <Stack gap={5}><Text weight="semibold">安全与责任</Text><Text>身份、权限、隔离、隐私合规、风险接受与审计。</Text></Stack>
        <Stack gap={5}><Text weight="semibold">架构可演化性</Text><Text>模块边界、依赖方向、耦合、技术债与知识连续性。</Text></Stack>
        <Stack gap={5}><Text weight="semibold">运行质量</Text><Text>性能、稳定性、可观测、事故、恢复和回滚。</Text></Stack>
        <Stack gap={5}><Text weight="semibold">经济有效性</Text><Text>总交付周期、返工、人工注意力、推理与基础设施成本。</Text></Stack>
      </Grid>
      <Text tone="secondary">
        纵向顺序：业务意图与风险分级 → 可观察验收语义 → 架构与权限边界 → 隔离执行环境 → 多层评价与证据 →
        人类/自动接受策略 → 发布与运行观测 → 事故恢复与规则回灌。
      </Text>

      <H2>你关心的“人还要看什么”</H2>
      <Grid columns={2} gap={16}>
        <div>
          <H3>不应只交付代码和测试结果</H3>
          <Stack gap={7}>
            <Text>1. 意图差异：实现如何解释需求，哪些假设由谁批准。</Text>
            <Text>2. 业务验收：控制点、观测点、预期结果及未覆盖边界。</Text>
            <Text>3. 风险摘要：安全、隐私、合规、性能、稳定性及剩余风险。</Text>
            <Text>4. 架构影响：边界、依赖、数据所有权、不可逆决策与债务增量。</Text>
            <Text>5. 证据包：测试、性能基线、安全扫描、运行轨迹、失败与重试历史。</Text>
            <Text>6. 可运营性：部署、回滚、告警、SLO、事故响应和责任人。</Text>
            <Text>7. 经济性：人类审核时间、返工率、Agent 成功率、Token 与算力成本。</Text>
          </Stack>
        </div>
        <div>
          <H3>人在环外成立的必要条件</H3>
          <Stack gap={7}>
            <Text>1. 目标和完成定义可机器判定，且评价器不会被轻易迎合。</Text>
            <Text>2. 执行环境隔离，凭证最小化，外部副作用受策略约束。</Text>
            <Text>3. 所有状态可审计、可恢复、可回滚，重试次数有上限。</Text>
            <Text>4. 架构与质量规则能自动执行，而非仅写在提示词里。</Text>
            <Text>5. 异常、冲突、低置信度和不可逆动作自动升级给人。</Text>
            <Text>6. 上线后持续监控业务结果，而非只验证代码构建成功。</Text>
            <Text>7. 明确的责任主体仍然存在；“环外”不等于“无人负责”。</Text>
          </Stack>
        </div>
      </Grid>

      <H2>业务验收标准</H2>
      <Table
        headers={["测试用例", "验收方控制点", "观测点", "预期业务结果"]}
        rows={acceptances.map((item) => [item.id + " " + item.name, item.control, item.observe, item.expected])}
        rowTone={acceptances.map((item) =>
          item.id === "AT-02" || item.id === "AT-05" ? "warning" :
          item.id === "AT-01" ? "success" :
          item.id === "AT-04" ? "info" :
          "neutral"
        )}
      />

      <H2>建议的详细分析顺序</H2>
      <Grid columns="repeat(auto-fit, minmax(240px, 1fr))" gap={12}>
        {priorityEvidence.map((item, index) => (
          <div>
            <Card>
              <CardHeader trailing={<Pill size="sm">{item.grade} 级</Pill>}>{index + 1}. {item.title}</CardHeader>
              <CardBody>
                <Stack gap={7}>
                  <Text>{item.problem}</Text>
                  <Text tone="secondary">{item.boundary}</Text>
                  <Link href={item.url}>打开原始材料</Link>
                </Stack>
              </CardBody>
            </Card>
          </div>
        ))}
      </Grid>
      <H3>每篇材料统一追问</H3>
      <Grid columns={2} gap={16}>
        <Text>问题与因果链：具体问题如何测量？哪个机制导致哪个结果？有什么替代解释？</Text>
        <Text>自治边界：人定义、批准、观察和承担什么？失败后谁停止？</Text>
        <Text>证据质量：是否有基线、对照、时间窗口、独立复现和负面结果？</Text>
        <Text>禁止外推：代码量、PR、benchmark、测试通过和主观提速分别不能证明什么？</Text>
        <Text>生产可信性：功能、性能、稳定性、安全、合规、维护性和成本分别有哪些证据？</Text>
        <Text>可证伪跟踪：哪些 SLA、缺陷、事故、架构漂移或审计事实会推翻当前判断？</Text>
      </Grid>
      <Callout tone="warning" title="当前最值得主动追问">
        向 StrongDM 索取 12–24 个月的生产范围、缺陷率、SLA、事故、恢复、安全合规审计与独立评价；它是最可能改变总体判断的公开候选。
      </Callout>

      <Callout tone="neutral" title="最危险的解释错误">
        <Text>
          不要把“可运行、已合并、测试通过”解释为“正确、安全、可维护且经济”；不要把 benchmark、短时任务或代码补全
          外推到开放式生产；不要把人写的规格、测试和架构文档当作天然真值——Agent 同样可能生成错误验收条件或迎合门禁。
        </Text>
      </Callout>

      <Text tone="quaternary" size="small" style={{ borderTop: `1px solid ${theme.stroke.tertiary}`, paddingTop: 12 }}>
        来源优先级：人类裁定 ＞ canonical 业务验收语义 ＞ 实现架构契约 ＞ 代码现实 ＞ 互联网来源。本页仅刷新组织样式，未修改 ARGO 意图图谱。
      </Text>
    </Stack>
  );
}

export default function AgenticEngineeringEvidenceMap() {
  return <ReferenceStyleReport />;
}

import * as vscode from 'vscode';
import type { StitchViolation } from '../engine/types';
import type { FailedTestRecord } from '../tools/architectureTestTool';

const COMMIT_ID_PATTERN = /(?:^|\s)(?:commit\s*:\s*)?([0-9a-f]{7,40})(?=$|\s)/i;

export function parseCommitPrompt(prompt: string): { commitId?: string; extraContext: string } {
    const trimmed = prompt.trim();
    if (!trimmed) {
        return { extraContext: '' };
    }

    const match = trimmed.match(COMMIT_ID_PATTERN);
    if (!match) {
        return { extraContext: trimmed };
    }

    const commitId = match[1];
    const extraContext = trimmed.replace(match[0], ' ').replace(/\s+/g, ' ').trim();
    return { commitId, extraContext };
}

export function buildMainAgentHandoffPrompt(
    intentFile: vscode.Uri,
    workflow: 'init' | 'evolve',
    extraContext: string,
    driftReport?: string,
): string {
    const workflowSpecificSteps = workflow === 'init'
        ? [
            '2. 阅读该文件并在当前工作区实现对应代码改动。',
        ]
        : [
            '2. 阅读该文件，并结合当前工作区已有代码实施增量架构演进。',
            '3. 严格控制改动范围，只修改实现该架构演进所必需的代码。',
        ];

    const lines = [
        '请作为 Copilot 主 agent 完成以下工作：',
        `1. 将 ${intentFile.fsPath} 作为唯一的架构意图来源，不要要求用户再次粘贴完整意图内容。`,
        ...workflowSpecificSteps,
        `${workflow === 'init' ? '3' : '4'}. 改动完成后，必须执行 git commit。`,
        `${workflow === 'init' ? '4' : '5'}. 回复时必须返回：`,
        '   - commit id',
        '   - 简短变更摘要',
        `${workflow === 'init' ? '5' : '6'}. 不要只输出建议，必须真正修改工作区代码并提交。`,
    ];

    if (extraContext) {
        lines.push(`${workflow === 'init' ? '6' : '7'}. 额外上下文：${extraContext}`);
    }

    if (driftReport) {
        lines.push(`${workflow === 'init' ? (extraContext ? '7' : '6') : (extraContext ? '8' : '7')}. 以下是最近一次 /link 生成的架构偏离报告，请将其作为高优先级治理上下文：`);
        lines.push(driftReport);
    }

    return lines.join('\n');
}

export function buildFixHandoffPrompt(
    intentFile: vscode.Uri,
    violations: StitchViolation[],
    workflow: 'init' | 'evolve',
): string {
    const title = workflow === 'init'
        ? '作为 Copilot 主 agent，你刚才提交的代码未能通过架构缝合审查。'
        : '作为 Copilot 主 agent，你刚才提交的代码未能通过防腐层架构审查。';

    const lines = [
        title,
        `请以 ${intentFile.fsPath} 作为唯一架构意图来源，修复以下违规项：`,
        '',
        ...violations.map((violation, index) => [
            `${index + 1}. ${violation.intentComponent} ↔ ${violation.codeElement}`,
            `   - 问题：${violation.description}`,
            `   - 修复建议：${violation.suggestedFix}`,
        ].join('\n')),
        '',
        '🚨 重要 Git 规范：修复完成后，你必须执行 git commit --amend --no-edit。',
        '如果确有必要补充提交说明，可以使用 amend 更新提交信息，但必须保持修复合并到上一次提交中。',
        '完成后请回复我最新的 commit id。',
    ];

    return lines.join('\n');
}

export function buildWorkAgentHandoffPrompt(input: {
    architectureGraphPath: string;
    failureRecordsPath: string;
    extraContext: string;
    failureRecords: FailedTestRecord[];
}): string {
    const lines = [
        '### Current Stage',
        'Coding/Repair',
        '',
        '### Targets',
        '1. 基于当前仓库中已经落盘的失败测试记录，修复实现，使失败记录对应的问题被解决。',
        '2. 若实现偏离意图架构或实现架构契约，先把实现拉回既定架构，再补充必要实现或支撑测试。',
        '3. 完成修复后，重新执行失败记录中 `acceptanceCriteria` 指向的既有测试入口，直到这些失败全部通过。',
        '',
        '### Evidence',
        `- 意图架构图谱：${input.architectureGraphPath}`,
        '- 实现到编码交接物：design/KG/ImplementationToCodingHandoff.json',
        '- 实现到编码交接物 Schema：.github/argoschema/ImplementationToCodingHandoff.schema.json',
        `- 失败测试记录：${input.failureRecordsPath}`,
        '- 实现架构根契约：OVERALL_ARCHITECTURE.md',
        '',
        '### Problem List',
        input.failureRecords.length > 0
            ? `- 当前共有 ${input.failureRecords.length} 条失败记录，必须把它们视为唯一待修复清单。`
            : '- 当前失败记录文件为空；如果仓库现状与此不符，应先明确说明记录为空这一事实，再决定是否需要让用户先执行 /test 刷新记录。',
        '',
        '### Operational Rules',
        '1. 先按仓库常驻架构知识读取并遵守意图架构、实现架构契约与阶段边界。',
        '2. 先读取 design/KG/ImplementationToCodingHandoff.json；若该交接物缺失、格式不完整，或与仓库现状冲突到无法执行，请先将其报告为实现架构设计阶段缺口，而不是直接跳过。',
        '3. 以实现到编码交接物和失败记录作为唯一待修复清单，直接修改当前工作区代码，而不是只给建议。',
        '4. 严禁把测试桩、测试分支、测试开关、仅供断言使用的返回字段、测试专用后门或任何其他测试内容混入业务代码；测试相关内容只能放在契约允许的测试、夹具或环境资产里。',
        '5. 只要涉及测试用例，无论是读取失败记录、补齐普通非显性测试，还是说明测试修复方案，都必须显性描述“控制点”和“观测点”；缺少任一项都视为测试设计不完整。',
        '6. 在 handoff 或最终回复中，只要提到文件、契约、测试入口或夹具，都必须写出具体仓库路径；不要使用“相关文件”“对应 ARCHITECTURE.md”这类模糊表述。若这些路径是给用户读取、修改或执行的输入，请单独放进 ```text 代码块```，并保持一行一个路径，便于直接复制。',
        '7. 如果发现缺失显性测试入口、关键非显性测试契约错误、关键护栏失效且必须改写，或测试环境信息只能通过改写冻结资产才能补齐，请将其视为实现架构设计阶段缺口并明确回报，不要在编码阶段直接改写这些冻结资产。',
        '8. 如新增或调整外部接口，必须同步更新项目根目录的 INTRODUCTION.md，确保对外说明与真实接口一致。',
        '9. 修复不能导致已有显性测试用例失败；完成修复后必须使用 `npm run test:argo` 触发全量显性测试用例，如果失败则必须继续修复，直到所有用例都通过。',
        '',
        '### Required Response',
        '   - 是否成功读取并遵守 design/KG/ImplementationToCodingHandoff.json；若没有，缺口在哪里',
        '   - 读取了哪些契约文件（必须写出具体路径；若多于一个路径，请放入单独的 ```text 代码块```，一行一个路径）',
        '   - 修改了哪些代码',
        '   - 新增或更新了哪些内外部接口',
        '   - INTRODUCTION.md 刷新了哪些外部接口信息',
        '   - 新增或回填了哪些普通非显性测试，以及每条测试的控制点与观测点',
        '   - 读取了哪些关键非显性测试但保持未修改（必须写出具体路径）',
        '   - 参考了哪些普通非显性测试（必须写出具体路径）',
        '   - 当前测试执行结果',
        '   - 你是从架构图谱和仓库上下文中如何识别并搭建测试环境的',
    ];

    if (input.extraContext) {
        lines.push('', '### User\'s requirements', input.extraContext);
    }

    return lines.join('\n');
}

export function buildIntentInArchitectureDesignHandoffPrompt(extraContext: string): string {
    const lines = [
        '### Current stage: Intent Design.',
        '',
        '### Targets',
        'Relentlessly scrutinize the requirements, figure out whether the intent architecture needs to be updated or if only the implementation architecture should be adjusted, or if only code changes are needed. If the intent architecture needs to be updated, identify which elements, relationships, views, principles, constraints, or explicit testcase baselines need to be added, removed, or modified. If the implementation architecture needs to be adjusted, identify which contracts, stable elements, test ownerships, or guardrails need to be added, removed, or modified. If only code changes are needed, identify which files, functions, tests, or configurations need to be added, removed, or modified.',
        '',
        '### Operational Rules',
        '1. Do not modify implementation artifacts in this stage, including business code, test code, scripts, or other repository files, unless I explicitly ask for such changes; focus on clarifying intent only.',
        '2. Interview me relentlessly about this plan until we reach a shared understanding, resolving the design tree branch by branch.',
        '   If a question can be answered from the repository, inspect the repository instead of asking me.',
        '3. If you create or edit design/KG/SystemArchitecture.json, you must first read `.github/argoschema/SystemArchitecture.schema.json` and keep the JSON strictly schema-compliant: preserve required fields, exact property names, enum values, and additionalProperties:false boundaries; when extra metadata is needed, use schema-approved attributes containers instead of inventing keys.',
        '4. After editing design/KG/SystemArchitecture.json, you must run `npm run validate:system-architecture` and do not treat the graph edit as complete unless that command succeeds or you explicitly report why it is blocked.',
        '5. Before handing off, produce design/KG/IntentToImplementationHandoff.json and validate it with `npm run validate:handoff:intent`. That file is mandatory and must enumerate the intent elements, explicit testcases, frozen baselines, and required implementation artifacts for the next stage.',
        '6. Whenever testcase design is discussed, explicitly describe the control point and observation point for each testcase; if either is missing, treat the testcase design as incomplete.',
        '7. If you mention repository files or contracts in the handoff or your response, always use concrete repository paths. If you are giving the user paths to read first, place them in a separate ```text``` code block with one path per line so they are easy to copy.',
        '8. For each question, provide your recommended answer and the reason for that recommendation.',
        '9. Do not claim the stage is ready to hand off until both `npm run validate:system-architecture` and `npm run validate:handoff:intent` succeed, or you explicitly explain why either artifact is still blocked.',
    ];

    if (extraContext) {
        lines.push('', '### User\'s requirements', extraContext);
    }

    return lines.join('\n');
}

export function buildImplementationDesignHandoffPrompt(input: {
    workspacePath: string;
    architectureGraphPath: string;
    schemaPath: string;
    implementationArchitecturePath: string;
    testsPath: string;
    srcPath: string;
    extraContext: string;
}): string {
    const lines = [
        '### Current Stage',
        'Implementation Design',
        '',
        '### Targets',
        '1. 先读取意图架构与现有实现架构证据，再设计稳定的实现架构边界、测试入口和测试护栏。',
        '2. 把显性 testcase 视为契约，把当前代码仓视为实现现状证据，把实现架构契约视为需要直接落盘的设计产物。',
        '3. 对于每条需要落地的显性 testcase，本阶段至少要完成关键断言落地：也就是把最小必要的断言骨架、断言边界、控制点和观测点物理化为可执行入口，而不是只写占位文件或只写路径约定。',
        '4. 显性 testcase 的入口在本阶段完成后，必须能够被实际运行，并且在业务实现尚未补齐前允许且预期先以失败结果暴露缺口；这些“预期失败”的用例就是后续 Coding/Repair 阶段必须接手并修复到通过的工作清单。不要把显性 testcase 设计成在实现缺失时也能伪通过。',
        '5. 这是 human in the loop 的实现架构设计任务：你必须先自行吸收仓库事实，再把真正会改变实现架构走向的高杠杆决策点提交给用户确认。',
        '6. 显性 testcase 的输出风格必须优先服务于“人类可读的业务契约”，而不是过程式技术脚本；非技术干系人或架构师应能仅通过阅读测试主体理解业务意图、边界条件与失败分类，而无需先理解底层技术细节。',
        '',
        '### Evidence',
        `- 工作区范围：${input.workspacePath}`,
        `- 意图架构图谱：${input.architectureGraphPath}`,
        `- 图谱 Schema：${input.schemaPath}`,
        '- 上一阶段交接物：design/KG/IntentToImplementationHandoff.json',
        '- 上一阶段交接物 Schema：.github/argoschema/IntentToImplementationHandoff.schema.json',
        '- 本阶段交接物：design/KG/ImplementationToCodingHandoff.json',
        '- 本阶段交接物 Schema：.github/argoschema/ImplementationToCodingHandoff.schema.json',
        `- 测试目录：${input.testsPath}`,
        `- 源码目录：${input.srcPath}`,
        '',
        '### Problems To Solve',
        '1. 当前实现架构的一级分层和模块分解方式如何定义。',
        '2. 关键接口边界与依赖方向如何冻结。',
        '3. 哪些实现元素直接实现意图元素，哪些通过实现链间接承载意图元素。',
        '4. 显性 testcase 的物理测试入口如何落位并保持只读验收基线，以及其关键断言如何在本阶段完成最小可执行落地。',
        '5. 哪些关键非显性测试需要在本阶段冻结并物理化，哪些普通非显性测试只需作为后续编码阶段支撑护栏。',
        '',
        '### User Decisions Required',
        '   - 实现架构的一级分层和模块分解方式',
        '   - 关键接口边界与依赖方向',
        '   - 哪些实现元素用于直接实现意图元素，哪些通过实现链间接承载意图元素',
        '   - 显性 testcase 的物理测试入口应如何落位并保持只读验收基线',
        '   - 哪些关键非显性测试需要在本阶段冻结并物理化',
        '   - 哪些普通非显性测试只需作为后续编码阶段的支撑护栏',
        '',
        '### Operational Rules',
        `1. 分析范围仅限当前工作区 ${input.workspacePath}。先读取意图架构，再读取已有实现架构契约（若存在），再按需读取代码、测试、脚本、配置与文档。凡是能从仓库和工具结果确认的事实，不要向用户追问。`,
        '2. 先读取 design/KG/IntentToImplementationHandoff.json；若该交接物缺失、格式不完整，或没有把显性 testcase、冻结基线、实现目标交代清楚，请先将其报告为上游阶段缺口，不要自行脑补补齐。',
        '3. 本次产出必须直接落盘为代码仓中的实现架构本体：项目根目录下的 OVERALL_ARCHITECTURE.md、稳定实现元素目录下的 ARCHITECTURE.md、必要的目录/文件布局、显性测试入口、关键非显性测试与普通支撑测试护栏，以及 design/KG/ImplementationToCodingHandoff.json。',
        '4. 本次产出的实现架构必须保持高层稳定边界，不要退化成源码镜像或函数级设计。',
        '5. 对于意图架构中的显性 testcase，你除了建立追溯关系外，还必须为每条需要落地的显性 testcase 明确其单一测试入口如何物理化，使后续编码阶段可以“直接调用而不修改”。若仓库中尚不存在该入口，本阶段应负责设计并产出对应入口文件或明确其只读落点，而不是把这项责任下推给编码阶段。',
        '6. 本阶段对显性 testcase 的最低交付标准不是“文件已存在”，而是“关键断言已落地并可执行”：至少要把核心断言口径、断言对象、控制点与观测点写入可运行入口，并避免只做空壳脚手架。',
        '7. 本阶段结束前，design/KG/SystemArchitecture.json 中每条已物理化显性 testcase 的 acceptanceCriteria 都必须改写为具体的工作区相对测试入口字符串，必要时可附带 pytest `::` selector；不得继续保留 Observation point 一类描述性语言。控制点、观测点与验收边界应保留在 testcase 其它字段、实现架构契约和 handoff 中。',
        '8. 显性 testcase 入口在本阶段完成后应被实际执行校验；若相关业务实现尚未完成，预期结果应是失败且失败原因可读。这类失败不是噪音，而是必须显式写入 design/KG/ImplementationToCodingHandoff.json 并交接给后续 /work 阶段的待修复输入，用来驱动 Coding/Repair 完成真实实现，而不是让测试入口虚假通过。',
        '9. 在 handoff 或最终回复中，只要提到文件、契约、测试入口、夹具或基线，都必须写出具体仓库路径；不要使用“相关文件”“对应契约”“某个 ARCHITECTURE.md”这类模糊表述。若这些路径是给用户读取、检查、执行或交接使用的，请单独放进 ```text 代码块```，并保持一行一个路径，便于直接复制。',
        '10. 所有测试用例设计都必须显性描述“控制点”和“观测点”。控制点是触发行为的入口、输入、前置布置或执行动作；观测点是被断言的外部可观察输出、状态、产物、日志、错误或副作用。无论是显性 testcase、关键非显性测试还是普通支撑测试，只要缺少控制点或观测点描述，都视为设计不完整，不能算交付完成。',
        '11. 对于显性 testcase 的具体代码形态，必须额外遵守以下约束：',
        '   - 测试函数物理结构必须强制划分为 `// GIVEN`、`// WHEN`、`// THEN` 三段，且禁止在块之间交织逻辑',
        '   - 显性 testcase 主体严禁直接出现原始 SQL/Cypher/GraphQL、原始 `os.environ` / `dotenv` 操作、原始 HTTP client 调用等底层技术开发细节；必须经由 Harness 风格的抽象对象完成。若当前仓库尚无对应 Harness 方法，本阶段先定义合理的方法名与职责边界，例如 `harness.execute_unified_query()`，不要在测试主体内回退到底层 plumbing',
        '   - 测试中的数据字面量与变量命名必须具备业务语义，禁止使用 `data1`、`res`、`id_123` 一类无暗示性的名称；应优先使用 `expired_coupon_id`、`standard_object` 这一类可直接传达业务边界的命名',
        '   - 失败报告必须优先显性化业务分类，例如 `category="Data_Inconsistency"`，而不应只剩代码行号或底层异常噪音',
        '   - 以业务可读性为验收口径：测试主体中的 plumbing / 噪音代码占比应尽量压低；理想状态下，不熟悉底层实现的人仅通过 GIVEN-WHEN-THEN 主体即可准确描述该用例覆盖的业务规则',
        '12. 非显性测试必须分层处理：',
        '   - 关键非显性测试只收口于四类：直接守架构边界、依赖方向、显性入口正确性、关键实现追溯',
        '   - 关键非显性测试必须在本阶段定死并落盘其测试实现；/work 阶段不得修改其入口、断言边界、挂载对象、追溯关系、protected_fixtures 与 protected_baselines',
        '   - 普通非显性测试作为编码阶段的支撑护栏输入，可以在后续编码阶段按契约允许的位置补充与优化',
        '   - 非显性测试默认物理放在对应实现元素目录下的 tests/ 中；跨目录测试默认放在最近公共祖先目录下，并在相关 ARCHITECTURE.md 中回填归属',
        '13. OVERALL_ARCHITECTURE.md 与 ARCHITECTURE.md 的契约格式必须统一采用共享骨架，但根契约与元素契约承担不同字段职责。根级总入口由 OVERALL_ARCHITECTURE.md 唯一承载；子目录局部契约默认由 ARCHITECTURE.md 承载。ARCHITECTURE.md 可以引用 OVERALL_ARCHITECTURE.md，但不得重复定义根级规则。',
        '14. 按决策依赖顺序推进。先自己识别当前代码中的职责缠结、接口泄漏、shallow module 风险、不合理依赖方向以及实现承载缺口；然后只把真正高杠杆的架构决策提交给用户拍板。不要把可以通过仓库证据自己得出的结论丢给用户。',
        '15. 除非用户明确要求，否则本次任务不要直接修改业务功能实现；重点是维护实现架构契约、显性 testcase 入口设计、关键非显性测试冻结与后续编码护栏，而不是直接进入业务编码。',
        '16. 不要宣称本阶段可交接给 Coding/Repair，除非 design/KG/ImplementationToCodingHandoff.json 已写出并且 npm run validate:handoff:implementation 可以通过；若仍未通过，必须明确阻塞点。',
        '',
        '### Required Output',
        '   - 仓库已证实的事实与当前实现约束',
        '   - 需要用户决策的问题：逐项列出推荐方案、备选方案、理由与权衡',
        '   - 最终实现架构设计摘要：一级元素、职责、接口、依赖方向、分层关系、与意图元素的实现映射（包括直接实现与间接实现链）',
        '   - 是否成功读取并遵守 design/KG/IntentToImplementationHandoff.json；若没有，缺口在哪里',
        '   - 契约落盘结果：说明你已更新 OVERALL_ARCHITECTURE.md 与哪些 ARCHITECTURE.md，并写出具体路径；若路径不止一个，请放入单独的 ```text 代码块```，同时概述关键规则、关键元素与局部契约',
        '   - 显性 testcase 入口物理化结果：说明哪些显性 testcase 已有只读入口、哪些入口需要新建或补位，并写出具体路径；若路径不止一个，请放入单独的 ```text 代码块```，再说明各自的关键断言如何落地、各自的控制点与观测点，以及这些入口如何交给后续编码阶段直接调用',
        '   - 显性 testcase 可读性与契约化结果：说明这些显性 testcase 是否已经满足 GIVEN-WHEN-THEN 三段式、Harness 抽象、语义化命名、业务分类失败报告等约束；若尚未满足，缺口分别是什么',
        '   - 显性 testcase 首次执行结果：说明哪些入口已经实际运行、当前是通过还是失败；若失败，失败是否符合“实现尚未补齐”的预期、失败信息如何指向真实缺口，以及该失败项将如何作为 Coding/Repair 阶段的输入被传递',
        '   - 关键非显性测试冻结结果：说明哪些关键非显性测试已定死、各自属于四类中的哪一类、落在什么具体路径、保护哪些夹具或基线数据，以及各自的控制点与观测点',
        '   - 普通非显性测试递交结果：说明哪些普通非显性测试被创建或保留给后续编码阶段使用、各自落在什么具体路径、其中哪些当前预期失败并将驱动后续实现，以及各自的控制点与观测点',
        '   - ImplementationToCoding 交接物结果：说明 design/KG/ImplementationToCodingHandoff.json 是否已生成、是否通过 schema 与 handoff 校验、里面列出的关键契约/入口/冻结文件/失败信号分别是什么',
        '   - 仍未闭合的实现架构缺口：包括缺失契约、缺失显性入口、缺失关键护栏或需要后续编码阶段补齐的普通支撑测试',
    ];

    if (input.extraContext) {
        lines.push('', '### User\'s requirements', input.extraContext);
    }

    return lines.join('\n');
}

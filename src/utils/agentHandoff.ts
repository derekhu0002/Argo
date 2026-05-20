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
        `- 失败测试记录：${input.failureRecordsPath}`,
        '- 实现架构根契约：#file:OVERALL_ARCHITECTURE.md',
        '- 相关局部契约：受失败记录影响路径下的 ARCHITECTURE.md',
        '',
        '### Problem List',
        input.failureRecords.length > 0
            ? `- 当前共有 ${input.failureRecords.length} 条失败记录，必须把它们视为唯一待修复清单。`
            : '- 当前失败记录文件为空；如果仓库现状与此不符，应先明确说明记录为空这一事实，再决定是否需要让用户先执行 /test 刷新记录。',
        '',
        '### Operational Rules',
        '1. 先按仓库常驻架构知识读取并遵守意图架构、实现架构契约与阶段边界。',
        '2. 以失败记录作为唯一待修复清单，直接修改当前工作区代码，而不是只给建议。',
        '3. 严禁把测试桩、测试分支、测试开关、仅供断言使用的返回字段、测试专用后门或任何其他测试内容混入业务代码；测试相关内容只能放在契约允许的测试、夹具或环境资产里。',
        '4. 只要涉及测试用例，无论是读取失败记录、补齐普通非显性测试，还是说明测试修复方案，都必须显性描述“控制点”和“观测点”；缺少任一项都视为测试设计不完整。',
        '5. 如果发现缺失显性测试入口、关键非显性测试契约错误、关键护栏失效且必须改写，或测试环境信息只能通过改写冻结资产才能补齐，请将其视为实现架构设计阶段缺口并明确回报，不要在编码阶段直接改写这些冻结资产。',
        '6. 如新增或调整外部接口，必须同步更新项目根目录的 INTRODUCTION.md，确保对外说明与真实接口一致。',
        '',
        '### Required Response',
        '   - 读取了哪些契约文件（OVERALL_ARCHITECTURE.md 与哪些 ARCHITECTURE.md）',
        '   - 修改了哪些代码',
        '   - 新增或更新了哪些内外部接口',
        '   - INTRODUCTION.md 刷新了哪些外部接口信息',
        '   - 新增或回填了哪些普通非显性测试，以及每条测试的控制点与观测点',
        '   - 读取了哪些关键非显性测试但保持未修改',
        '   - 参考了哪些普通非显性测试',
        '   - 当前测试执行结果',
        '   - 你是从架构图谱和仓库上下文中如何识别并搭建测试环境的',
    ];

    if (input.extraContext) {
        lines.push('', '### Extra Context', input.extraContext);
    }

    return lines.join('\n');
}

export function buildIntentInArchitectureDesignHandoffPrompt(): string {
    return [
        '### Current stage: Intent Design.',
        '',
        '### Targets',
        'Relentlessly scrutinize the requirements, figure out whether the intent architecture needs to be updated or if only the implementation architecture should be adjusted, or if only code changes are needed. If the intent architecture needs to be updated, identify which elements, relationships, views, principles, constraints, or explicit testcase baselines need to be added, removed, or modified. If the implementation architecture needs to be adjusted, identify which contracts, stable elements, test ownerships, or guardrails need to be added, removed, or modified. If only code changes are needed, identify which files, functions, tests, or configurations need to be added, removed, or modified.',
        '',
        '### Operational Rules',
        '1. Do not modify implementation artifacts in this stage, including business code, test code, scripts, or other repository files, unless I explicitly ask for such changes; focus on clarifying intent only.',
        '2. Interview me relentlessly about this plan until we reach a shared understanding, resolving the design tree branch by branch.',
        '   If a question can be answered from the repository, inspect the repository instead of asking me.',
        '3. Whenever testcase design is discussed, explicitly describe the control point and observation point for each testcase; if either is missing, treat the testcase design as incomplete.',
        '4. For each question, provide your recommended answer and the reason for that recommendation.',
    ].join('\n');
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
        '3. 这是 human in the loop 的实现架构设计任务：你必须先自行吸收仓库事实，再把真正会改变实现架构走向的高杠杆决策点提交给用户确认。',
        '',
        '### Evidence',
        `- 工作区范围：${input.workspacePath}`,
        `- 意图架构图谱：${input.architectureGraphPath}`,
        `- 图谱 Schema：${input.schemaPath}`,
        `- 实现架构文件候选：${input.implementationArchitecturePath}`,
        `- 测试目录：${input.testsPath}`,
        `- 源码目录：${input.srcPath}`,
        '',
        '### Problems To Solve',
        '1. 当前实现架构的一级分层和模块分解方式如何定义。',
        '2. 关键接口边界与依赖方向如何冻结。',
        '3. 哪些实现元素直接实现意图元素，哪些通过实现链间接承载意图元素。',
        '4. 显性 testcase 的物理测试入口如何落位并保持只读验收基线。',
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
        '2. 本次产出必须直接落盘为代码仓中的实现架构本体：项目根目录下的 OVERALL_ARCHITECTURE.md、稳定实现元素目录下的 ARCHITECTURE.md、必要的目录/文件布局、显性测试入口、关键非显性测试与普通支撑测试护栏。',
        '3. 本次产出的实现架构必须保持高层稳定边界，不要退化成源码镜像或函数级设计。',
        '4. 对于意图架构中的显性 testcase，你除了建立追溯关系外，还必须为每条需要落地的显性 testcase 明确其单一测试入口如何物理化，使后续编码阶段可以“直接调用而不修改”。若仓库中尚不存在该入口，本阶段应负责设计并产出对应入口文件或明确其只读落点，而不是把这项责任下推给编码阶段。',
        '5. 所有测试用例设计都必须显性描述“控制点”和“观测点”。控制点是触发行为的入口、输入、前置布置或执行动作；观测点是被断言的外部可观察输出、状态、产物、日志、错误或副作用。无论是显性 testcase、关键非显性测试还是普通支撑测试，只要缺少控制点或观测点描述，都视为设计不完整，不能算交付完成。',
        '6. 非显性测试必须分层处理：',
        '   - 关键非显性测试只收口于四类：直接守架构边界、依赖方向、显性入口正确性、关键实现追溯',
        '   - 关键非显性测试必须在本阶段定死并落盘其测试实现；/work 阶段不得修改其入口、断言边界、挂载对象、追溯关系、protected_fixtures 与 protected_baselines',
        '   - 普通非显性测试作为编码阶段的支撑护栏输入，可以在后续编码阶段按契约允许的位置补充与优化',
        '   - 非显性测试默认物理放在对应实现元素目录下的 tests/ 中；跨目录测试默认放在最近公共祖先目录下，并在相关 ARCHITECTURE.md 中回填归属',
        '7. OVERALL_ARCHITECTURE.md 与 ARCHITECTURE.md 的契约格式必须统一采用共享骨架，但根契约与元素契约承担不同字段职责。根级总入口由 OVERALL_ARCHITECTURE.md 唯一承载；子目录局部契约默认由 ARCHITECTURE.md 承载。ARCHITECTURE.md 可以引用 OVERALL_ARCHITECTURE.md，但不得重复定义根级规则。',
        '8. 按决策依赖顺序推进。先自己识别当前代码中的职责缠结、接口泄漏、shallow module 风险、不合理依赖方向以及实现承载缺口；然后只把真正高杠杆的架构决策提交给用户拍板。不要把可以通过仓库证据自己得出的结论丢给用户。',
        '9. 除非用户明确要求，否则本次任务不要直接修改业务功能实现；重点是维护实现架构契约、显性 testcase 入口设计、关键非显性测试冻结与后续编码护栏，而不是直接进入业务编码。',
        '',
        '### Required Output',
        '   - 仓库已证实的事实与当前实现约束',
        '   - 需要用户决策的问题：逐项列出推荐方案、备选方案、理由与权衡',
        '   - 最终实现架构设计摘要：一级元素、职责、接口、依赖方向、分层关系、与意图元素的实现映射（包括直接实现与间接实现链）',
        '   - 契约落盘结果：说明你已更新 OVERALL_ARCHITECTURE.md 与哪些 ARCHITECTURE.md，并概述关键规则、关键元素与局部契约',
        '   - 显性 testcase 入口物理化结果：说明哪些显性 testcase 已有只读入口、哪些入口需要新建或补位、各自的控制点与观测点，以及这些入口如何交给后续编码阶段直接调用',
        '   - 关键非显性测试冻结结果：说明哪些关键非显性测试已定死、各自属于四类中的哪一类、落在什么路径、保护哪些夹具或基线数据，以及各自的控制点与观测点',
        '   - 普通非显性测试递交结果：说明哪些普通非显性测试被创建或保留给后续编码阶段使用，以及各自的控制点与观测点',
        '   - 仍未闭合的实现架构缺口：包括缺失契约、缺失显性入口、缺失关键护栏或需要后续编码阶段补齐的普通支撑测试',
    ];

    if (input.extraContext) {
        lines.push('', '### Extra Context', input.extraContext);
    }

    return lines.join('\n');
}
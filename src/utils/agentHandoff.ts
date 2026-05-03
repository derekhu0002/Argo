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
    totalTestCases: number;
    missingCriteriaCount: number;
}): string {
    const lines = [
        '请作为 Copilot 主 agent 完成以下工作：',
        '1. 读取架构图谱：#file:SystemArchitecture.json',
        '2. 读取失败测试记录：#file:test-failure-records.json',
        '3. 以失败记录作为唯一待修复清单，直接修改当前工作区代码，而不是只给建议。',
        '4. 任何代码修改都必须满足架构图谱中的 `ArchiMate_Principle` 类型元素所描述的架构原则，不能引入新的架构违规；如果无法满足原则约束，请优先修复架构违规，再进行功能修复。',
        '5. 在进行代码开发时，必须保持 deep module 架构，禁止产出 shallow module：模块对外暴露的接口应尽量小而稳定，但模块内部必须封装足够完整的业务能力、复杂度与变化点，不能把复杂度外泄给调用方。',
        '6. 设计和实现时必须遵守 SOLID 原则，尤其要避免：',
        '   - 单个模块同时承担多种不相干职责',
        '   - 通过条件分支堆叠不同行为而不是抽象扩展点',
        '   - 新接口破坏既有调用约定或要求调用方了解过多内部细节',
        '   - 高层流程直接依赖底层细节实现而没有稳定抽象',
        '7. 任何新增或调整的内外部接口，都必须有专门文档进行存放和维护，不能只散落在代码注释或聊天回复里：',
        '   - 外部接口文档需要说明用途、调用方式、输入输出、约束、错误语义与示例',
        '   - 所有新增或调整的外部接口，必须同步刷新到项目根目录的 INTRODUCTION.md，确保对外说明文档与当前真实接口保持一致',
        '   - 内部接口文档需要说明模块职责、边界、依赖关系、调用约束和演进注意事项',
        '   - 如果仓库中还没有合适的接口文档目录或文档文件，你必须创建专门文档并纳入仓库维护',
        '   - 文档必须与本次代码改动同步更新，不能等测试通过后再补',
        '8. 修复完成后，执行记录中 `acceptanceCriteria` 指向的测试脚本，直到这些用例全部通过；只要仍有失败，就继续修改、继续执行，不能提前结束。',
        '9. 如果架构图谱中 testcase 总数为 0，或者某条记录的 `acceptanceCriteria` 为空，则将该项视为尚未落地的新功能：',
        '   - 需要完成对应功能开发',
        '   - 需要写回完整的 testcase 对象到 #file:SystemArchitecture.json',
        '   - testcase 对象至少必须完整包含以下字段：`name`、`description`、`Input`、`acceptanceCriteria`、`TestResults`',
        '   - `description` 必须写清楚测试目标、关键断言、测试环境要求（是否必须真实环境/不可 mock)；不能只写一句笼统描述',
        '   - `acceptanceCriteria` 必须是一个工作区内的单一测试入口：要么是单一脚本文件路径，要么是 `tests/test_x.py::test_y` 这种 pytest node id；禁止写成 `npm run ...`、`python ...`、`node ...` 这类命令行，且不允许附带任何额外参数',
        '   - 所有执行前置步骤、环境准备、依赖安装、数据构造、断言与退出码处理，都必须封装到这个单一测试入口可直接触发的脚本/用例中，使 Argo 只凭 `acceptanceCriteria` 就能运行它',
        '   - 测试环境前置条件不满足时，你必须先从架构图谱中的 testcase 描述、相关元素、关系、视图、原则约束中主动发现相关测试环境信息，并依据这些信息自行构建测试环境以满足前置条件',
        '   - 如果架构图谱没有直接写明测试环境，也不允许停下或向用户追问；你必须结合 testcase 描述、acceptanceCriteria、仓库现有脚本/配置/依赖，主动推导出“能让该测试落地”的最小可运行测试环境，并自行补齐',
        '   - 禁止把“缺少测试环境说明”“环境前置条件不明确”“需要用户提供环境信息”作为阻塞理由；你的职责就是自行发现、自行搭建、自行验证',
        '   - 需要补充测试脚本；该脚本必须做到“无需额外命令、无需额外参数、只执行脚本路径即可运行”',
        '   - 需要把完整 testcase 对象写回到 #file:SystemArchitecture.json，而不是只改 `acceptanceCriteria` 字段',
        '   - testcase 写回格式必须遵循如下结构：',
        '     {' ,
        '       "name": "TestCaseName",',
        '       "description": "测试目标、关键断言、测试环境要求（是否必须真实环境/不可 mock)；不能只写一句笼统描述",',
        '       "Input": "",',
        '       "acceptanceCriteria": "path/to/test-script-or-pytest-nodeid",',
        '       "TestResults": ""',
        '     }',
        '10. 在你完成所有代码修改、测试补齐、接口文档更新与路径回填之后，必须主动对整个架构图谱执行一次完整的全面测试，不允许跳过，并修复所有发现的问题。',
        '11. 完成后，请回复：',
        '   - 修改了哪些代码',
        '   - 新增或更新了哪些接口文档，以及它们分别覆盖哪些内外部接口',
        '   - INTRODUCTION.md 刷新了哪些外部接口信息',
        '   - 新增或回填了哪些完整 testcase 对象',
        '   - 当前测试执行结果',
        '   - 你是从架构图谱和仓库上下文中如何识别并搭建测试环境的',
    ];

    if (input.totalTestCases === 0) {
        lines.push('12. 当前架构图谱没有任何 testcase，请按“新功能开发 + 写回完整 testcase 对象”的方式处理。');
    } else if (input.missingCriteriaCount > 0) {
        lines.push(`12. 当前有 ${input.missingCriteriaCount} 个 testcase 缺少 acceptanceCriteria，请补齐测试脚本，并同时补全/重写对应的完整 testcase 对象。`);
    }

    if (input.failureRecords.length > 0) {
        lines.push(`13. 当前有 ${input.failureRecords.length} 条失败记录，请优先修复这些失败记录对应的测试用例，直到它们全部通过；`);
    }

    if (input.extraContext) {
        lines.push(`14. 额外上下文：${input.extraContext}`);
    }

    return lines.join('\n');
}

export function buildProductBriefHandoffPrompt(input: {
    workspacePath: string;
    readmePath: string;
    packageJsonPath: string;
    architectureGraphPath: string;
    extraContext: string;
}): string {
    const lines = [
        '请作为 Copilot 主 agent 完成以下工作：',
        `1. 以当前工作区 ${input.workspacePath} 为分析范围，基于仓库中的真实内容产出一份“对外介绍该项目所构建产品”的说明文档。`,
        `2. 将最终说明文档保存到项目根目录：${input.workspacePath}\\INTRODUCTION.md。`,
        `3. 优先阅读这些已知入口文件，并可按需继续深入代码与测试：`,
        `   - ${input.readmePath}`,
        `   - ${input.packageJsonPath}`,
        `   - ${input.architectureGraphPath}`,
        '4. 该说明文档的目标读者是外部调用方、潜在采用方、集成方；他们需要据此判断：',
        '   - 本系统解决什么问题、适合什么场景',
        '   - 系统当前提供了哪些能力与边界',
        '   - 外部系统如何调用、接入、配置、运行、验证',
        '   - 采用本系统前需要准备哪些前置条件、依赖和约束',
        '5. 只能基于仓库中能够证实的信息输出结论，禁止臆造不存在的接口、部署方式、SLA、协议或产品能力。',
        '6. 输出内容必须覆盖以下部分：',
        '   - 产品概述：一句话定位、解决的问题、适用对象、典型场景',
        '   - 功能清单：按模块或能力域总结核心功能',
        '   - 接口与集成点：必须列出所有外部调用接口、集成点、配置入口，并详细说明它们的用途、输入参数、所有可能输出、调用方式、约束与示例',
        '   - 调用与使用方法：安装/运行前置条件、最小使用步骤、配置方式、调用示例或操作路径',
        '   - 评估采用时应关注的约束：运行环境、依赖组件、当前局限、适合集成方式、不适用场景',
        '7. 输出格式要求：',
        '   - 使用中文撰写',
        '   - 结构清晰，适合直接给外部团队阅读',
        '   - 优先给出“如何判断是否采用”和“如何开始使用”的信息',
        '   - 不允许展开内部实现细节、源码组织、内部模块/类名或底层实现机制；仅在解释外部接入前置条件、运行约束或能力边界时，才以必要最小粒度提及',
        '8. 最后必须附上最小接入路径是什么',
        '9. 本次任务允许创建或更新项目根目录下的 INTRODUCTION.md，但不要修改其他业务代码。',
        '10. 完成后，回复中必须明确说明 INTRODUCTION.md 已写入。',
    ];

    if (input.extraContext) {
        lines.push(`11. 额外上下文：${input.extraContext}`);
    }

    return lines.join('\n');
}

export function buildArchitectureDesignHandoffPrompt(input: {
    workspacePath: string;
    readmePath: string;
    packageJsonPath: string;
    architectureGraphPath: string;
    srcPath: string;
    testsPath: string;
    extraContext: string;
}): string {
    const lines = [
        '请作为 Copilot 主 agent 完成以下工作：',
        '1. 你必须不断与用户交互，直到对架构设计目标形成共享理解。严格执行这段工作方式要求，并将其视为高优先级行为约束：',
        '   - Interview me relentlessly about every aspect of this plan until we reach a shared understanding.',
        '   - Walk down each branch of the design tree, resolving dependencies between decisions one by one.',
        '   - And finally, if a question can be answered by exploring the code base, explore the code base instead.',
        '2. 在开始产出或修改 ArchiMate 设计之前，先主动判断当前场景属于哪一类，并把判断依据告诉用户：',
        '   - 全新项目：当前仓库还没有可复用的有效 ArchiMate 模型，或者现有模型不足以支撑当前设计目标，需要从 0 到 1 新增设计',
        '   - 已有项目维护更新：仓库或现有架构图谱已经包含可复用设计，需要在既有模型上增量维护、补全、重构或纠偏',
        `3. 你的分析范围是当前工作区 ${input.workspacePath}。优先阅读这些入口，并在需要时继续深入实际代码与设计资产：`,
        `   - ${input.readmePath}`,
        `   - ${input.packageJsonPath}`,
        `   - ${input.architectureGraphPath}`,
        `   - ${input.srcPath}`,
        `   - ${input.testsPath}`,
        '4. 任何本可通过阅读仓库得到答案的问题，都不要反复追问用户；你应先自行探索代码、配置、测试、脚本、已有架构图谱与设计文件，再只对仓库中无法证实的设计分歧向用户追问。',
        `5. 你的最终交付物必须写入 ${input.architectureGraphPath}。如果文件已存在，则增量维护；如果不存在或明显失效，则创建可落地的新模型。不要把最终设计只停留在聊天回复中。`,
        `6. ${input.architectureGraphPath} 必须遵循下面这些内置的 JSON 结构约束。不要假设目标项目中一定已经存在单独的 schema 文件；即使仓库里没有 schema 文件，你也必须按以下结构维护架构图谱，不允许臆造与这些约束不兼容的顶层结构。至少满足以下要求：`,
        '   - 顶层对象必须是 JSON object，包含 `name`、`description`、`elements`、`relationships`、`views`；其中 `elements`、`relationships`、`views` 都应为数组',
        '   - 顶层可选 `attributes`；其每一项都是 object，至少包含 `name`，并可选 `description`、`value`、`content`',
        '   - `elements` 数组中的每个元素至少应包含 `id`、`name`、`type`；可选字段包括 `alias`、`classifier`、`browser_path`、`status`、`description`、`document`、`attributes`、`code_file`、`condition_file`、`prompts_file`、`project_info`、`subdiagram_views`、`testcases`',
        '   - element 的 `attributes` 数组项结构与顶层 `attributes` 相同：至少 `name`，可选 `description`、`value`、`content`；用于表达 EA 属性或方法摘要',
        '   - element 的 `subdiagram_views` 必须是数组；每项至少包含 `view_id`、`view_name`',
        '   - element 的 `testcases` 必须是数组；每项至少包含 `name`、`description`、`type`、`Input`、`acceptanceCriteria`、`TestResults`；`name` 本身就作为 testcase 的稳定标识使用，不额外引入独立 testcase id；`type` 应优先使用导出器识别的 6 种测试类型名称：`Unit Test`、`Integration Test`、`System Test`、`Acceptance Test`、`Scenario Test`、`Inspection Test`',
        '   - element 的 `project_info` 如果存在，应是 object；可包含 `summary`、`resources`、`tasks`。其中 `summary` 可包含 `notes`、`started`、`deadline`、`priority`、`assigned_to`、`progress`；`resources` 数组项至少表达 `owner`、`role`，并可含 `description`、`start_date`、`end_date`、`percent_complete`、`expected_hours`、`history`；`tasks` 数组项至少表达 `name`，并可含 `type`、`status`、`description`、`start_date`、`completion_date`、`due_date`、`reporter`、`priority`、`assigned_to`、`progress`',
        '   - `relationships` 数组中的每个关系至少应包含 `id`、`statement`、`name`、`source_id`、`target_id`、`source_name`、`target_name`；可选 `description`、`sequence`、`super_type`、`document`、`attributes`',
        '   - relationship 的 `attributes` 数组项至少包含 `name`，可选 `description`',
        '   - `views` 数组中的每个视图至少应包含 `view_id`、`view_name`、`included_elements`、`included_relationships`；可选 `browser_path`、`parent_element_id`、`parent_element_name`、`description`',
        '   - `included_elements` 和 `included_relationships` 都必须是 ID 字符串数组，引用前面定义的 element/relationship',
        '   - `id`、`view_id`、`source_id`、`target_id` 应优先沿用已有模型中的稳定标识；全新建模时需要保证在同一文件内唯一，且关系、视图引用必须可解析',
        '7. 设计过程中，你必须把用户反馈、仓库证据与模型演进关联起来，避免只产出抽象概念图：',
        '   - 架构必须聚焦意图，从目标、措施等战略层逐步分解到业务层、应用层、技术层；它的职责是说明战略目标如何一步一步落成具体架构元素，而不是直接铺陈实现细节',
        '   - 模型中的元素分解必须体现清晰的意图追踪链：上层目标/原则/措施如何约束下层业务能力、应用组件、技术支撑，以及这些层次之间为什么存在当前关系',
        '   - 不允许把具体类名、函数名、局部算法、代码行级结构直接当作架构元素本身；实现细节只能作为“该架构元素由哪些代码实现支撑”的证据与映射信息出现',
        '   - 对于新增系统能力，要补齐相关元素、关系、视图与必要 testcase',
        '   - 对于已有系统维护更新，要明确哪些元素沿用、哪些重命名、哪些废弃、哪些关系需要迁移',
        '   - 对于已经存在 #file:SystemArchitecture.json 的项目，你必须先分析并理解现有模型中的元素、关系、视图与 testcase，再开始后续架构调整，不能跳过对既有设计基线的吸收',
        '   - 在后续架构调整中，不允许擅自新增、修改或删除 testcase；如果某个 testcase 不再适合挂在原元素下，也不能直接迁移或重写，必须先向用户展示拟议变更、原因、影响范围与替代方案，并征求用户意见或同意',
        '   - 如果用户不同意某个 testcase 的新增、修改或删除方案，你必须继续和用户深入讨论分歧来源、约束条件与替代路径，直到达成理解一致后才能把对应变更写回架构图谱',
        '   - 每个关键架构元素都必须明确回答两个映射问题：它由哪些 testcase 验证；它由哪些具体代码实现、配置入口、脚本入口或运行组件承载。如果当前仓库里还没有对应测试或实现，要明确标注为空缺而不是跳过',
        '   - 一条 testcase 最好只映射到一个架构元素，并通过挂载在该元素下的关系表达“它验证哪个元素”；不要额外设计 `verifies_elements` 字段去做多重映射',
        '   - testcase 想表达所验证的意图、约束、验收重点时，应写在 `description` 中，而不是新增 `verifies_intents` 字段',
        '   - 如果某个元素需要表达 `verification_focus`、`acceptance_outcomes`、`design_risks` 等验证与风险信息，应放入该元素的 `attributes` 中，而不是新增顶层专用字段',
        '   - 当 testcase 挂载到某个架构元素下时，你必须说明它验证的是该元素的哪一项职责、约束或协作关系；当代码被映射到某个架构元素时，你必须说明这些代码为何属于该元素而不是别的元素',
        '   - 如果代码与现有模型冲突，要先定位事实来源，再与用户确认应该改代码、改模型还是两者都改',
        '8. 你必须持续和用户确认关键分叉决策，例如系统边界、能力拆分、上下游依赖、外部接口、部署/运行约束、架构原则、测试落点、视图组织方式；每解决一个分支，再进入下一个分支，不要一次性抛出大而空的问题清单。',
        '9. 如果通过读代码、读测试、读配置或读已有模型已经能回答某个问题，你就直接给出结论和证据，不要把本可自证的问题继续丢给用户。',
        '10. 当你完成 ArchiMate 模型新增或维护更新后，回复中必须包含：',
        '   - 你如何判断这是全新项目设计还是已有项目维护更新',
        '   - 你向用户追问并确认了哪些关键设计决策',
        '   - 你通过探索仓库自行回答了哪些问题，以及证据来自哪里',
        '   - 你最终在 #file:SystemArchitecture.json 中新增、修改、删除了哪些关键元素、关系、视图、testcase 或 project_info',
        '   - 关键架构元素分别关联了哪些 testcase，以及这些元素分别由哪些代码实现、配置、脚本或运行组件支撑',
        '   - 当前模型中仍然存在的假设、待定项或后续设计风险',
        '11. 不要只输出建议或讨论纪要；你必须真正维护 #file:SystemArchitecture.json`，并确保结果可作为后续开发、测试和架构治理的唯一结构化基线。',
    ];

    if (input.extraContext) {
        lines.push(`12. 当前补充上下文：${input.extraContext}`);
    }

    return lines.join('\n');
}

export function buildTestDesignHandoffPrompt(input: {
    workspacePath: string;
    readmePath: string;
    packageJsonPath: string;
    architectureGraphPath: string;
    testsPath: string;
    srcPath: string;
    extraContext: string;
}): string {
    const lines = [
        '请作为 Copilot 主 agent 完成以下工作：',
        '1. 本次测试设计必须采用“双阶段衔接”方式，而不是一上来就重新向用户做完整需求访谈：',
        '   - 第一阶段：先吸收当前仓库中已经存在的架构基线、测试基线与实现证据，优先理解 #file:SystemArchitecture.json 中现有元素、testcase、attributes、风险信息以及它们与代码的对应关系',
        '   - 第二阶段：只有当架构图谱、现有测试和仓库证据仍不足以支撑测试设计时，才向用户补问缺口信息；补问的目标是补足测试设计缺口，而不是把整个需求从头再问一遍',
        `2. 你的分析范围是当前工作区 ${input.workspacePath}。优先阅读架构图谱 #file:SystemArchitecture.json ，再按需深入代码、架构图谱与现有测试：`,
        '3. 你必须先识别当前真正的变更目标、问题边界、关键风险、受影响模块与现有测试覆盖情况，再决定应该新增哪些测试、保留哪些测试、调整哪些已有测试。若架构图谱已经足够回答这些问题，就直接基于图谱和仓库证据推进，不要重复追问用户。',
        `4. 你要优先把 #file:SystemArchitecture.json 已沉淀的结构化结果转译成测试设计输入，尤其关注：`,
        '   - 哪些架构元素已有 testcase，哪些还没有',
        '   - 哪些 element attributes 中已经写明了 `verification_focus`、`acceptance_outcomes`、`design_risks` 或同类验证信息',
        '   - 哪些 testcase 与当前元素挂载关系不匹配，哪些 testcase 需要迁移、补强或重写',
        '   - 哪些架构意图已经有代码实现但还没有测试覆盖，哪些已经有测试但与当前实现证据不一致',
        '5. 只有在以下信息经过阅读仓库和架构图谱后仍然无法确定时，你才向用户补问：',
        '   - 本次变更优先保障哪些架构元素或能力闭环',
        '   - 哪些风险点必须在本轮测试中重点覆盖',
        '   - 某些验收结果是否必须依赖真实环境、真实系统能力或特定外部依赖',
        '   - 当现有架构意图与用户最新目标冲突时，应以哪一侧为准',
        '6. 测试类型只允许从以下 6 类中选择，并按实际需要组合，不要求每次都全部出现：',
        '   - unit test：验证函数、类、模块内部逻辑、分支、边界值与错误处理',
        '   - system test：验证系统级能力、运行路径、关键配置与真实依赖组合后的整体行为',
        '   - integration test：验证模块之间、进程之间、文件/网络/工具链之间的接口协作',
        '   - scenario test：验证真实业务场景或用户操作链路中的多步骤行为',
        '   - acceptance test：验证需求完成标准、最终可交付行为与外部可观察结果',
        '   - inspection test：验证不通过运行时断言也需要检查的内容，例如架构约束、配置完整性、文档/提示词/模型输入输出约束、静态结构或人工可审查规则',
        '7. 你的职责不是平均分配测试类型，而是基于当前需求、架构意图和验证缺口自主判断：',
        '   - acceptance test 和 scenario test 是验证需求闭环与用户可观察结果的主验证面；unit test、system test、inspection test 只是为了保障 acceptance/scenario 顺利达成的支撑性测试，不应喧宾夺主',
        '   - 只有当 unit test、system test、inspection test 能直接降低 acceptance/scenario 的落地风险、定位关键缺陷或补足必要证据时，才建议新增；它们的数量、范围和断言都必须保持精炼，禁止为了凑测试类型而堆砌',
        '   - 哪些测试类型必须有',
        '   - 哪些测试类型当前不需要',
        '   - 哪些已有测试需要补强、拆分、合并、删除或重写',
        '   - 哪些测试应该先落在最小可验证切面，哪些应该覆盖端到端风险',
        '   - 所有测试设计都必须服务于“通过实现真实系统功能来满足需求并使测试通过”，禁止通过在测试用例中伪造业务流程、绕过真实调用链、硬编码期望结果、放宽断言、注入仅供测试通过的特殊分支、伪造假数据流或其他 test-only shortcut 让用例表面通过',
        '   - 如果某个测试要通过，前提应当是对应系统能力已经被真实实现或真实修复；测试只能验证真实能力是否存在，不能承担伪造能力本身的职责',
        '8. 输出结果必须包含以下内容：',
        `   - 架构基线吸收结果：你从现有 #file:SystemArchitecture.json 、代码和测试中读到了哪些与本次测试设计直接相关的既有信息`,
        '   - 仍需向用户补问的缺口：哪些问题是仓库证据无法回答、必须由用户确认的',
        '   - 需求/问题理解：你认为当前要验证的目标是什么',
        '   - 风险分析：列出最可能导致回归、误实现或架构偏离的点',
        '   - 测试策略矩阵：按测试类型说明是否需要、原因、验证目标、建议粒度、是否可复用现有测试',
        '   - 具体测试用例建议：每条至少写清楚名称、前置条件、输入/操作、关键断言、所属测试类型、建议落点文件或测试入口',
        '   - 反作弊约束：说明每类关键测试应如何避免“改测试让它过”而不是“改系统让它对”',
        '   - 现有测试调整建议：指出哪些现有测试需要保留、修改、补断言、迁移或删除，并说明原因',
        `9. 完成测试设计后，你必须将所有测试建议回填到架构图谱文件 #file:SystemArchitecture.json ，不能只停留在聊天回复中。`,
        '   - 但在新增、修改或删除任何 testcase 之前，你必须先向用户逐项展示拟议变更、变更原因、影响范围与预期收益，并明确征求用户的意见或同意；未经用户确认，不得直接写回这些 testcase 变更',
        '   - 如果用户不同意某个 testcase 的新增、修改或删除方案，你必须继续和用户讨论分歧点、约束条件与替代方案，直到双方达成理解一致后，才能继续回填对应 testcase',
        '   - 所有新增测试建议都要写成完整 testcase 对象并落到对应的架构图谱位置',
        '   - 所有需要调整的已有测试，也要同步更新架构图谱中的对应 testcase 对象，不能只在文字说明里提到',
        '   - 如果某个已有 testcase 需要调整其覆盖的系统内容，必须先将该 testcase 的 `acceptanceCriteria` 填为空字符串，表示原测试入口暂时失效，等待新的系统实现与测试入口重新落地',
        '   - 同时必须在该 testcase 的说明中临时明确写出：该用例及其对应的系统功能需要重新实现，并记录原来的测试入口（即原 `acceptanceCriteria` 的值），避免主 agent 把旧测试入口误当成仍然有效，且确保后续重建测试时有可追溯依据',
        '   - 回填后的 testcase 至少必须包含：`name`、`description`、`Input`、`acceptanceCriteria`、`TestResults`',
        '   - `description` 需要写清测试目标、关键断言、前置条件、是否依赖真实环境/真实系统能力',
        '   - `acceptanceCriteria` 必须指向单一测试入口，不允许写成一串命令拼接',
        '10. 如果仓库内已有测试、脚本、架构 testcase、e2e harness 或相关校验工具，你必须优先复用并指出复用方式，避免无意义重复建设。',
        '11. 如果当前信息不足以精确落测试，也不允许停止在“需要更多信息”；你必须先区分“仓库可自证的问题”和“必须补问用户的问题”，然后只对后者进行补问，并基于用户回复和现有仓库证据给出最小可执行的测试设计方案，同时明确哪些点属于假设。',
        '12. 输出要求：',
        '   - 使用中文',
        '   - 结论必须面向当前仓库真实结构，不能是通用教材式模板',
        '   - 必须明确说明为什么选择这些测试类型、为什么不选择另外一些测试类型',
        '   - 必须明确说明哪些结论直接来自架构图谱与仓库证据，哪些结论来自向用户补问后的确认',
        '   - 能引用现有文件、目录、脚本、测试入口时尽量引用',
        '13. 本次任务不要求直接修改业务代码，但要求你产出测试设计并把所有测试建议回填到架构图谱，作为后续实现和验证的唯一测试基线。',
    ];

    if (input.extraContext) {
        lines.push(`14. 当前补充上下文：${input.extraContext}`);
    }

    return lines.join('\n');
}
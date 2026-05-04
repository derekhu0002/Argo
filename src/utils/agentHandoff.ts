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
        '3. 读取非显性 testcase 清单：#file:supporting-testcases.json。该文件用于承载测试设计阶段产出的支撑性测试，不属于显性架构 testcase 基线。',
        '4. 以失败记录作为唯一待修复清单，并把 #file:supporting-testcases.json 作为实现与补测试的辅助约束，直接修改当前工作区代码，而不是只给建议。',
        '5. 任何代码修改都必须满足架构图谱中的 `ArchiMate_Principle` 类型元素所描述的架构原则，不能引入新的架构违规；如果无法满足原则约束，请优先修复架构违规，再进行功能修复。',
        '6. 在进行代码开发时，必须保持 deep module 架构，禁止产出 shallow module：模块对外暴露的接口应尽量小而稳定，但模块内部必须封装足够完整的业务能力、复杂度与变化点，不能把复杂度外泄给调用方。',
        '7. 设计和实现时必须遵守 SOLID 原则，尤其要避免：',
        '   - 单个模块同时承担多种不相干职责',
        '   - 通过条件分支堆叠不同行为而不是抽象扩展点',
        '   - 新接口破坏既有调用约定或要求调用方了解过多内部细节',
        '   - 高层流程直接依赖底层细节实现而没有稳定抽象',
        '8. 任何新增或调整的内外部接口，都必须有专门文档进行存放和维护，不能只散落在代码注释或聊天回复里：',
        '   - 外部接口文档需要说明用途、调用方式、输入输出、约束、错误语义与示例',
        '   - 所有新增或调整的外部接口，必须同步刷新到项目根目录的 INTRODUCTION.md，确保对外说明文档与当前真实接口保持一致',
        '   - 内部接口文档需要说明模块职责、边界、依赖关系、调用约束和演进注意事项',
        '   - 如果仓库中还没有合适的接口文档目录或文档文件，你必须创建专门文档并纳入仓库维护',
        '   - 文档必须与本次代码改动同步更新，不能等测试通过后再补',
        '9. 修复完成后，执行记录中 `acceptanceCriteria` 指向的测试脚本，直到这些用例全部通过；只要仍有失败，就继续修改、继续执行，不能提前结束。',
        '10. 编码阶段默认只消费已存在且已获确认的显性 testcase 基线，不得自行定义、扩张或重写显性 testcase 的验证目标。这里的“显性 testcase”特指：被明确写入 #file:SystemArchitecture.json、直接承担架构验收职责、可由单一测试入口执行、并作为实现与回归基线管理的 testcase。',
        '   - 如果架构图谱中 testcase 总数为 0，或者某条记录的 `acceptanceCriteria` 为空，应视为测试契约缺口，而不是默认授权你重写显性 testcase 基线',
        '   - #file:supporting-testcases.json 中的非显性 testcase 仅用于指导你补齐实现、支撑性测试、执行脚本和测试环境；它们不构成显性架构验收基线，也不替代显性 testcase',
        '   - 你可以补齐实现代码、支撑性测试、执行脚本和测试环境，使既有或已确认的显性 testcase 真正可运行',
        '   - 你不得在未经用户确认的情况下新增、修改或删除显性 testcase，也不得擅自回写新的验收目标、断言口径或挂载范围到 #file:SystemArchitecture.json',
        '   - 如确有契约缺口，请明确列出缺口及建议，交回测试设计阶段或用户确认；只有用户明确授权时，才能回写完整 testcase 对象',
        '   - 对于已存在但缺少单一测试入口的 testcase，你可以补充对应脚本，使其做到“无需额外命令、无需额外参数、只执行脚本路径即可运行”',
        '   - 测试环境前置条件不满足时，你必须先从架构图谱中的 testcase 描述、相关元素、关系、视图、原则约束中主动发现相关信息，并依据这些信息自行构建最小可运行测试环境',
        '   - 禁止把“缺少测试环境说明”“环境前置条件不明确”“需要用户提供环境信息”作为阻塞理由；你的职责是自行发现、自行搭建、自行验证',
        '11. 在你完成所有代码修改、测试补齐、接口文档更新与路径回填之后，必须主动对整个架构图谱执行一次完整的全面测试，不允许跳过，并修复所有发现的问题。',
        '12. 完成后，请回复：',
        '   - 修改了哪些代码',
        '   - 新增或更新了哪些接口文档，以及它们分别覆盖哪些内外部接口',
        '   - INTRODUCTION.md 刷新了哪些外部接口信息',
        '   - 新增或回填了哪些完整 testcase 对象',
        '   - 参考了哪些非显性 testcase，以及它们分别支撑了哪些显性 testcase 或实现决策',
        '   - 当前测试执行结果',
        '   - 你是从架构图谱和仓库上下文中如何识别并搭建测试环境的',
    ];

    if (input.totalTestCases === 0) {
        lines.push('13. 当前架构图谱没有任何 testcase；请先完成实现侧可落地部分，并把显性 testcase 契约缺口明确回报，不要擅自补写基线。');
    } else if (input.missingCriteriaCount > 0) {
        lines.push(`13. 当前有 ${input.missingCriteriaCount} 个 testcase 缺少 acceptanceCriteria；请优先补齐可执行脚本或明确契约缺口，不要擅自改写显性 testcase 目标。`);
    }

    if (input.failureRecords.length > 0) {
        lines.push(`14. 当前有 ${input.failureRecords.length} 条失败记录，请优先修复这些失败记录对应的测试用例，直到它们全部通过；`);
    }

    if (input.extraContext) {
        lines.push(`15. 额外上下文：${input.extraContext}`);
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
        `1. 分析范围仅限当前工作区 ${input.workspacePath}。先读取 #file:SystemArchitecture.json，再按需读取代码、测试、脚本和配置；凡是能从仓库与运行结果确认的事实，不要向用户追问。`,
        '2. 先做方向收敛，再做测试设计：先判断当前变更目标、边界、成功标准、关键风险和受影响元素；如果这些信息仍不清楚，只提出少量高价值问题来裁剪后续路径，不要重新做完整需求访谈。',
        '3. 不要复述教材式测试知识，不要臆造动态事实。关于已有实现、现有测试、可用脚本、真实依赖、测试入口和字段结构，都必须以仓库证据或运行时结果为准。',
        '4. 请先把 #file:SystemArchitecture.json 转译成测试设计输入，至少明确：哪些元素已有 testcase，哪些缺口仍未覆盖，哪些 attributes 已表达 verification_focus、acceptance_outcomes、design_risks 等验证信息，以及哪些 testcase 与当前元素职责或实现证据不再匹配。人类定义的意图架构优先于当前实现形状；代码、现有测试和仓库现状只能作为证据，不能反向缩减或改写目标边界。',
        '5. 除显性 testcase 外，你还可以设计非显性 testcase，并将其写入 `design\KG\supporting-testcases.json`。这里的“非显性 testcase”特指：不写入意图架构、不直接承担架构验收职责、但用于支撑实现、局部验证、环境校准和回归防退化的测试。',
        '6. 测试设计应默认以 Acceptance Test 和 Scenario Test 作为主验证面；只有“验收测试”“场景测试”以及“子系统之间的集成测试”可以作为显性 testcase 回填到 #file:SystemArchitecture.json。这里的“显性 testcase”特指：被明确写入 #file:SystemArchitecture.json、直接承担架构验收职责、可由单一测试入口执行、并作为实现与回归基线管理的 testcase。Unit Test、System Test、Inspection Test，以及不直接表达子系统间协作意图的其他测试，只能作为测试代码中的支撑性验证存在，不需要显性回填到意图架构。每条显性 testcase 只允许一个主挂载对象：要么是一个意图元素，要么是一条主协作关系；禁止用一条 testcase 同时承担多个主职责。',
        '7. 对每一种测试类型都要给出取舍理由：为什么要选，为什么不选，支撑哪个风险或验收目标；禁止为了凑类型而堆砌测试。',
        '8. 所有测试都必须验证真实系统能力，禁止通过伪造业务流程、绕过真实调用链、放宽断言、硬编码期望结果、注入仅供测试通过的特殊分支或其他 test-only shortcut 制造“表面通过”。如果某项能力尚未真实实现，应明确标记为空缺，而不是用测试伪装能力存在。',
        '9. 优先复用仓库内已有测试、脚本、架构 testcase、e2e harness 和校验工具；只有当现有资产无法满足验证目标时，才建议新增测试入口。所有动态入口都必须在仓库中真实存在或能被当前任务明确落地。',
        '10. 你必须同步维护 `design\KG\supporting-testcases.json`：对每条非显性 testcase 至少写明 `name`、`kind`、`role`、`verifies`、`supportsExplicitTestcase`、`targetIntentElementId`、`suggestedEntry`、`preconditions`、`keyAssertions`、`status`。其中 `role` 固定为 `supporting`。',
        '11. 输出必须使用中文，并严格包含以下结构：',
        '   - 仓库已证实的事实：只写能从架构图谱、代码、测试、脚本、配置中确认的信息',
        '   - 仍需用户确认的关键问题：仅限会改变测试路径或验收口径的高价值问题',
        '   - 测试策略：按测试类型说明保留、新增、修改、迁移、删除或不采用的理由，并明确哪些属于显性架构 testcase，哪些只作为测试代码中的支撑性验证',
        '   - 测试用例草案：每条显性 testcase 至少写明名称、挂载元素、被验证职责、前置条件、输入/操作、关键断言、测试类型、建议入口、反作弊约束；每条非显性 testcase 至少写明其支撑对象、局部验证目标、建议入口和关键断言',
        '   - 回填计划：分别列出需要新增或更新到 #file:SystemArchitecture.json 的显性 testcase，以及需要新增或更新到 `design\KG\supporting-testcases.json` 的非显性 testcase',
        '12. 在新增、修改或删除任何显性 testcase 之前，必须先向用户逐项展示拟议变更、原因、影响范围和预期收益，并征求确认；未经确认，不得直接回填。若用户不同意，你必须继续收敛分歧，而不是强行写回。',
        '13. 一旦获得用户确认，回填到 #file:SystemArchitecture.json 的 testcase 对象至少必须包含：`name`、`description`、`Input`、`acceptanceCriteria`、`TestResults`。只有验收测试、场景测试或子系统间集成测试可以按此方式显性回填；其中 `description` 要写清测试目标、关键断言、前置条件以及是否依赖真实环境；`acceptanceCriteria` 必须指向单一测试入口，不得写成命令拼接。',
        '14. 对于 `design\KG\supporting-testcases.json` 中的非显性 testcase，你可以直接新增或更新，因为它们属于测试设计阶段的支撑性产物；但不得借此绕过显性 testcase 的确认流程。',
        '15. 如果某个已有显性 testcase 已不再适配当前系统内容，先把其 `acceptanceCriteria` 置空，并在说明中记录需要重建的原因和原测试入口，再等待新的实现与测试入口落地。',
        '16. 本次任务不要求直接修改业务代码，但要求产出可执行的测试设计，并在用户确认后仅将验收测试、场景测试和子系统间集成测试作为意图架构的显性测试基线回填到 #file:SystemArchitecture.json；其他测试应写入 `design\KG\supporting-testcases.json`，作为编码阶段可消费的支撑实现。',
    ];

    if (input.extraContext) {
        lines.push(`17. 当前补充上下文：${input.extraContext}`);
    }

    return lines.join('\n');
}
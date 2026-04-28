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
        `1. 读取架构图谱文件：${input.architectureGraphPath}`,
        `2. 读取失败测试记录文件：${input.failureRecordsPath}`,
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
        '   - 需要写回完整的 testcase 对象到 design/KG/SystemArchitecture.json',
        '   - testcase 对象至少必须完整包含以下字段：`name`、`description`、`Input`、`acceptanceCriteria`、`TestResults`',
        '   - `description` 必须写清楚测试目标、关键断言、测试环境要求（是否必须真实环境/不可 mock)；不能只写一句笼统描述',
        '   - `acceptanceCriteria` 必须是一个工作区内的单一测试入口：要么是单一脚本文件路径，要么是 `tests/test_x.py::test_y` 这种 pytest node id；禁止写成 `npm run ...`、`python ...`、`node ...` 这类命令行，且不允许附带任何额外参数',
        '   - 所有执行前置步骤、环境准备、依赖安装、数据构造、断言与退出码处理，都必须封装到这个单一测试入口可直接触发的脚本/用例中，使 Argo 只凭 `acceptanceCriteria` 就能运行它',
        '   - 测试环境前置条件不满足时，你必须先从架构图谱中的 testcase 描述、相关元素、关系、视图、原则约束中主动发现相关测试环境信息，并依据这些信息自行构建测试环境以满足前置条件',
        '   - 如果架构图谱没有直接写明测试环境，也不允许停下或向用户追问；你必须结合 testcase 描述、acceptanceCriteria、仓库现有脚本/配置/依赖，主动推导出“能让该测试落地”的最小可运行测试环境，并自行补齐',
        '   - 禁止把“缺少测试环境说明”“环境前置条件不明确”“需要用户提供环境信息”作为阻塞理由；你的职责就是自行发现、自行搭建、自行验证',
        '   - 需要补充测试脚本；该脚本必须做到“无需额外命令、无需额外参数、只执行脚本路径即可运行”',
        '   - 需要把完整 testcase 对象写回到 design/KG/SystemArchitecture.json，而不是只改 `acceptanceCriteria` 字段',
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

    if (input.extraContext) {
        lines.push(`13. 额外上下文：${input.extraContext}`);
    }

    if (input.failureRecords.length > 0) {
        lines.push('14. 当前失败记录如下：');
        lines.push(JSON.stringify(input.failureRecords, null, 2));
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
        '6. 如果某项能力、接口或调用方式在仓库中证据不足，必须明确标注为“仓库中未明确说明”或“根据现有代码推断”，不能把推断写成既定事实。',
        '7. 输出内容必须覆盖以下部分：',
        '   - 产品概述：一句话定位、解决的问题、适用对象、典型场景',
        '   - 功能清单：按模块或能力域总结核心功能，并说明每项功能的业务价值',
        '   - 接口与集成点：包括但不限于 CLI、脚本入口、VS Code 扩展命令、配置文件、架构图谱文件、测试入口、外部依赖',
        '   - 调用与使用方法：安装/运行前置条件、最小使用步骤、配置方式、调用示例或操作路径',
        '   - 评估采用时应关注的约束：运行环境、依赖组件、当前局限、适合集成方式、不适用场景',
        '   - 证据来源：每个关键结论尽量指出来自哪些仓库文件或代码位置',
        '8. 输出格式要求：',
        '   - 使用中文撰写',
        '   - 结构清晰，适合直接给外部团队阅读',
        '   - 优先给出“如何判断是否采用”和“如何开始使用”的信息',
        '   - 尽量不要展开内部实现细节、源码组织、内部模块/类名或底层实现机制；仅在解释外部接入前置条件、运行约束或能力边界时，才以必要最小粒度提及',
        '   - 如仓库当前更像内部工具/扩展而非通用平台，要明确说明，不要包装成通用开放平台',
        '9. 最后必须附上一个“快速结论”小节，至少回答：',
        '   - 谁应该使用它',
        '   - 谁不适合使用它',
        '   - 最小接入路径是什么',
        '   - 采用前最需要验证的 3 个风险点是什么',
        '10. 本次任务允许创建或更新项目根目录下的 INTRODUCTION.md，但不要修改其他业务代码。',
        '11. 完成后，回复中必须明确说明 INTRODUCTION.md 已写入，并给出文档摘要。',
    ];

    if (input.extraContext) {
        lines.push(`12. 额外上下文：${input.extraContext}`);
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
        '1. 在开始测试设计之前，先主动向用户询问当前需求、当前问题、预期行为、完成标准，以及是否存在特别关注的风险或回归点；如果用户尚未说清楚，不要直接跳到测试方案。',
        `2. 在获得用户需求说明后，以当前工作区 ${input.workspacePath} 为分析范围，围绕“当前需求或当前待解决问题”设计测试方案，而不是泛泛罗列测试理论。`,
        `3. 优先阅读这些入口，再按需深入代码、架构图谱与现有测试：`,
        `   - ${input.readmePath}`,
        `   - ${input.packageJsonPath}`,
        `   - ${input.architectureGraphPath}`,
        `   - ${input.srcPath}`,
        `   - ${input.testsPath}`,
        '4. 你必须先识别当前真正的变更目标、问题边界、关键风险、受影响模块与现有测试覆盖情况，再决定应该新增哪些测试、保留哪些测试、调整哪些已有测试。',
        '5. 测试类型只允许从以下 6 类中选择，并按实际需要组合，不要求每次都全部出现：',
        '   - unit test：验证函数、类、模块内部逻辑、分支、边界值与错误处理',
        '   - system test：验证系统级能力、运行路径、关键配置与真实依赖组合后的整体行为',
        '   - integration test：验证模块之间、进程之间、文件/网络/工具链之间的接口协作',
        '   - scenario test：验证真实业务场景或用户操作链路中的多步骤行为',
        '   - acceptance test：验证需求完成标准、最终可交付行为与外部可观察结果',
        '   - inspection test：验证不通过运行时断言也需要检查的内容，例如架构约束、配置完整性、文档/提示词/模型输入输出约束、静态结构或人工可审查规则',
        '6. 你的职责不是平均分配测试类型，而是基于当前需求或问题自主判断：',
        '   - 哪些测试类型必须有',
        '   - 哪些测试类型当前不需要',
        '   - 哪些已有测试需要补强、拆分、合并、删除或重写',
        '   - 哪些测试应该先落在最小可验证切面，哪些应该覆盖端到端风险',
        '   - 所有测试设计都必须服务于“通过实现真实系统功能来满足需求并使测试通过”，禁止通过在测试用例中伪造业务流程、绕过真实调用链、硬编码期望结果、放宽断言、注入仅供测试通过的特殊分支、伪造假数据流或其他 test-only shortcut 让用例表面通过',
        '   - 如果某个测试要通过，前提应当是对应系统能力已经被真实实现或真实修复；测试只能验证真实能力是否存在，不能承担伪造能力本身的职责',
        '7. 输出结果必须包含以下内容：',
        '   - 需求/问题理解：你认为当前要验证的目标是什么',
        '   - 风险分析：列出最可能导致回归、误实现或架构偏离的点',
        '   - 测试策略矩阵：按测试类型说明是否需要、原因、验证目标、建议粒度、是否可复用现有测试',
        '   - 具体测试用例建议：每条至少写清楚名称、前置条件、输入/操作、关键断言、所属测试类型、建议落点文件或测试入口',
        '   - 反作弊约束：说明每类关键测试应如何避免“改测试让它过”而不是“改系统让它对”',
        '   - 现有测试调整建议：指出哪些现有测试需要保留、修改、补断言、迁移或删除，并说明原因',
        `8. 完成测试设计后，你必须将所有测试建议回填到架构图谱文件 ${input.architectureGraphPath}，不能只停留在聊天回复中。`,
        '   - 所有新增测试建议都要写成完整 testcase 对象并落到对应的架构图谱位置',
        '   - 所有需要调整的已有测试，也要同步更新架构图谱中的对应 testcase 对象，不能只在文字说明里提到',
        '   - 回填后的 testcase 至少必须包含：`name`、`description`、`Input`、`acceptanceCriteria`、`TestResults`',
        '   - `description` 需要写清测试目标、关键断言、前置条件、是否依赖真实环境/真实系统能力',
        '   - `acceptanceCriteria` 必须指向单一测试入口，不允许写成一串命令拼接',
        '9. 如果仓库内已有测试、脚本、架构 testcase、e2e harness 或相关校验工具，你必须优先复用并指出复用方式，避免无意义重复建设。',
        '10. 如果当前信息不足以精确落测试，也不允许停止在“需要更多信息”；你必须先向用户补问需求与约束，再基于用户回复和现有仓库证据给出最小可执行的测试设计方案，并明确哪些点属于假设。',
        '11. 输出要求：',
        '   - 使用中文',
        '   - 结论必须面向当前仓库真实结构，不能是通用教材式模板',
        '   - 必须明确说明为什么选择这些测试类型、为什么不选择另外一些测试类型',
        '   - 能引用现有文件、目录、脚本、测试入口时尽量引用',
        '12. 本次任务不要求直接修改业务代码，但要求你产出测试设计并把所有测试建议回填到架构图谱，作为后续实现和验证的唯一测试基线。',
    ];

    if (input.extraContext) {
        lines.push(`13. 当前补充上下文：${input.extraContext}`);
    }

    return lines.join('\n');
}
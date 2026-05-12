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
        '1. 读取意图架构图谱： #file:SystemArchitecture.json',
        '2. 读取失败测试记录： #file:test-failure-records.json',
        '3. 读取实现架构根契约：项目根目录下的 #file:OVERALL_ARCHITECTURE.md。若不存在该文件，请将其视为实现架构设计阶段缺口并明确回报。',
        '4. 根据失败记录、受影响路径与追溯链，继续读取相关实现元素目录下的 ARCHITECTURE.md 契约文件；这些 ARCHITECTURE 与 #file:OVERALL_ARCHITECTURE.md 一起构成当前实现架构约束。',
        '5. 以失败记录作为唯一待修复清单，并把 #file:OVERALL_ARCHITECTURE.md 与相关 ARCHITECTURE.md 契约作为实现与补测试的辅助约束，直接修改当前工作区代码，而不是只给建议。',
        '6. 任何代码修改都必须同时遵守意图架构图谱与实现架构契约中已经确定的原则、边界、依赖方向和实现映射，不能为了让测试通过而绕开这些约束，更不能引入新的架构违规。',
        '7. 如果当前代码与 #file:OVERALL_ARCHITECTURE.md 或相关 ARCHITECTURE.md 中声明的模块职责、接口边界、分层关系、实现链、测试护栏归属不一致，应优先把实现拉回既定架构，再补功能或补测试。',
        '8. 具体执行时，必须把这些优秀实践当作硬约束，而不是口号：',
        '   - 保持 deep module，禁止把复杂度外泄给调用方，禁止用 shallow module 式补丁堆过测试',
        '   - 遵守 SOLID 与关注点分离，避免把多种不相干职责继续塞进同一模块',
        '   - 遵守渐进式披露，优先维护高层稳定边界与关键二级边界，不要把文件级细节抬升为新的冻结契约',
        '   - 当行为差异持续扩大时，优先抽象稳定扩展点，而不是继续堆条件分支',
        '   - 高层流程只能依赖稳定抽象，不能直接回退到底层实现细节',
        '9. 任何新增或调整的外部接口，都必须有专门文档进行存放和维护，不能只散落在代码注释或聊天回复里：',
        '   - 外部接口文档需要说明用途、调用方式、输入输出、约束、错误语义与示例',
        '   - 所有新增或调整的外部接口，必须同步刷新到项目根目录的 INTRODUCTION.md，确保对外说明文档与当前真实接口保持一致',
        '   - 文档必须与本次代码改动同步更新',
        '10. 修复完成后，执行失败测试记录中 `acceptanceCriteria` 指向的测试脚本，直到这些用例全部通过；只要仍有失败，就继续修改、继续执行，不需要请示用户，更不能提前结束。',
        '11. 编码阶段默认以当前意图架构图谱中声明的显性 testcase 作为验收基线。这里的“显性 testcase”特指：被明确写入 #file:SystemArchitecture.json、直接承担架构验收职责、可由单一测试入口执行、并作为实现与回归基线管理的 testcase。你必须保持这些显性 testcase 的目标、挂载对象、断言口径与范围稳定。',
        '   - 显性 testcase 的单一测试入口由实现架构设计阶段负责物理化并交付给编码阶段；编码阶段只能调用这些既有入口做验收，不得新增、删除、重建、替换或改写显性 testcase，也不得修改其测试入口',
        '   - 非显性测试分为关键与非关键两类。关键非显性测试只收口于四类：直接守架构边界、依赖方向、显性入口正确性、关键实现追溯；它们及其受保护夹具、基线数据在当前阶段一律只读',
        '   - 你可以补齐实现代码、普通支撑性测试、执行脚本和测试环境，使既有或已确认的显性 testcase 真正可运行；但不得改写关键非显性测试的入口、断言边界、挂载对象、追溯关系、protected_fixtures 或 protected_baselines',
        '   - 显性 testcase 与相关 ARCHITECTURE.md 中定义的关键/普通非显性测试必须通过追溯链保持一致：显性 testcase 的目标、挂载对象、入口、范围变化时，要同步检查受影响的实现元素及其下测试护栏；反过来，普通支撑测试变化也不得破坏上游显性基线与关键护栏的成立条件',
        '   - 如果发现某条显性 testcase 缺少单一测试入口、某条关键非显性测试本身契约错误，或现有入口/关键护栏失效且需要改写，请将其视为实现架构设计阶段的缺口并明确回报；你可以补齐支撑性测试、环境与业务实现，但不要在编码阶段改写这些冻结资产',
        '   - 需要补齐支撑性验证时，应优先把普通非显性测试写回到对应实现元素目录下的 tests/ 中，并遵守 #file:OVERALL_ARCHITECTURE.md 与局部 ARCHITECTURE.md 契约中声明的归属规则',
        '   - 测试环境前置条件不满足时，你必须先从架构图谱中的 testcase 描述、相关元素、关系、视图、原则约束中主动发现相关信息，并依据这些信息自行构建最小可运行测试环境',
        '   - 禁止把“缺少测试环境说明”“环境前置条件不明确”“需要用户提供环境信息”作为阻塞理由；你的职责是自行发现、自行搭建、自行验证',
        '12. 在你完成所有代码修改、测试补齐、接口文档更新与路径回填之后，必须主动对整个意图架构图谱执行一次完整的全面测试，不允许跳过，并修复所有发现的问题。',
        '13. 完成后，请回复：',
        '   - 读取了哪些契约文件（OVERALL_ARCHITECTURE.md 与哪些 ARCHITECTURE.md）',
        '   - 修改了哪些代码',
        '   - 新增或更新了哪些内外部接口',
        '   - INTRODUCTION.md 刷新了哪些外部接口信息',
        '   - 新增或回填了哪些普通非显性测试',
        '   - 读取了哪些关键非显性测试但保持未修改',
        '   - 参考了哪些普通非显性测试',
        '   - 当前测试执行结果',
        '   - 你是从架构图谱和仓库上下文中如何识别并搭建测试环境的',
    ];

    if (input.totalTestCases === 0) {
        lines.push('14. 当前架构图谱没有任何 testcase；请先完成实现侧可落地部分，并把显性 testcase 契约缺口明确回报，不要擅自补写基线。');
    } else if (input.missingCriteriaCount > 0) {
        lines.push(`14. 当前有 ${input.missingCriteriaCount} 个显性 testcase 缺少 acceptanceCriteria；请将其明确标记为实现架构设计阶段尚未物理化完成的契约缺口，不要在编码阶段直接补写或改写显性测试入口。`);
    }

    if (input.failureRecords.length > 0) {
        lines.push(`15. 当前有 ${input.failureRecords.length} 条失败记录，请优先修复这些失败记录对应的测试用例，直到它们全部通过；`);
    }

    if (input.extraContext) {
        lines.push(`16. 额外上下文：${input.extraContext}`);
    }

    return lines.join('\n');
}

export function buildProductBriefHandoffPrompt(input: {
    workspacePath: string;
    architectureGraphPath: string;
    extraContext: string;
}): string {
    const lines = [
        '请作为 Copilot 主 agent 完成以下工作：',
        `1. 以当前工作区 ${input.workspacePath} 为分析范围，基于仓库中的真实内容产出一份“对外介绍该项目所构建产品”的说明文档。`,
        `2. 将最终说明文档保存到项目根目录：${input.workspacePath}\\INTRODUCTION.md。`,
        '3. 总结过程只允许参考以下架构来源，不要把分析范围扩展到其他文档、代码、测试、脚本或配置：',
        '   - 项目根目录下的 OVERALL_ARCHITECTURE.md',
        '   - 各个目录下的 ARCHITECTURE.md',
        `   - 意图架构：${input.architectureGraphPath}`,
        '4. 该说明文档的目标读者是外部调用方、潜在采用方、集成方；他们需要据此判断：',
        '   - 本系统解决什么问题、适合什么场景',
        '   - 系统当前提供了哪些能力与边界',
        '   - 外部系统如何调用、接入、配置、运行、验证',
        '   - 采用本系统前需要准备哪些前置条件、依赖和约束',
        '5. 只能基于上述架构来源中能够证实的信息输出结论，禁止臆造不存在的接口、部署方式、SLA、协议或产品能力。',
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

export function buildIntentInArchitectureDesignHandoffPrompt(): string {
    return [
        'You are a strongly critical interviewer and extremely good at critical thinking.', 
        'Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree resolving dependencies between decisions one by one.',
        'If a question can be answered by exploring the codebase, explore the codebase instead.',
        'For each question, provide your recommended answer.',
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
        '请作为 Copilot 主 agent 完成以下工作：',
        `1. 分析范围仅限当前工作区 ${input.workspacePath}。必须先读取 design\\KG\\SystemArchitecture.json，再读取项目根目录下的 OVERALL_ARCHITECTURE.md（若存在）以及受影响目录下的 ARCHITECTURE.md 契约文件，再按需读取代码、测试、脚本、配置与文档。凡是能从仓库和工具结果确认的事实，不要向用户追问。`,
        '2. 本次任务的输入是整个意图架构与当前代码仓中的实现架构。这里的“当前实现架构”不是独立 JSON 文件，而是项目代码仓根目录、OVERALL_ARCHITECTUR.md、相关 ARCHITECTURE.md、目录与文件结构、显性测试入口、现有非显性测试共同表达的实现现状。请把显性 testcase 视为契约，把意图架构本体视为需求边界与设计约束，把当前代码库视为实现现状证据。',
        '3. 这是一个 human in the loop 的实现架构设计任务，人类必须深度参与关键决策。你必须先自行吸收仓库事实，再把真正会改变实现架构走向的决策点拿出来与用户确认。至少以下事项必须显式征求用户意见，且每项都要给出推荐方案、备选方案、理由与权衡：',
        '   - 实现架构的一级分层和模块分解方式',
        '   - 关键接口边界与依赖方向',
        '   - 哪些实现元素用于直接实现意图元素，哪些通过实现链间接承载意图元素',
        '   - 显性 testcase 的物理测试入口应如何落位并保持只读验收基线',
        '   - 哪些关键非显性测试需要在本阶段冻结并物理化',
        '   - 哪些普通非显性测试只需作为后续编码阶段的支撑护栏',
        '4. 设计时必须显式应用并检查这些原则：整洁架构、SOLID、DEEP MODULE、渐进式披露、关注点分离、稳定抽象依赖方向。这里的“渐进式披露”不是要求输出迁移路线图，而是要求你的架构契约本身有层次性，优先通过根契约、局部契约、目录层级、ARCHITECTURE.md 追溯和测试护栏组织结构，让人类和 AI 都能逐层理解。',
        '5. 本次产出的实现架构是直接落盘为代码仓中的实现架构本体：项目根目录下的 OVERALL_ARCHITECTURE.md、稳定实现元素目录下的 ARCHITECTURE.md、必要的目录/文件布局、显性测试入口、关键非显性测试与普通支撑测试护栏。',
        '6. 本次产出的实现架构必须是高层实现架构，不是源码镜像，也不是按文件、类、函数穷举的细粒度设计。默认只保留那些能够承载职责边界、依赖方向、测试挂载点、外部契约或意图实现映射的稳定实现元素。禁止把私有函数、普通 helper、机械拆分出的文件级模块、局部流程步骤或“为了看起来完整”而加入的低层细节提升成稳定契约。',
        '7. 颗粒度控制要求如下：优先确定一级实现元素、少量关键组件及其接口边界；只有当某个下级目录本身承载独立职责边界、稳定依赖方向、关键测试挂载点或关键 implements 追溯节点时，才允许继续下钻一层。默认停止在“稳定目录/稳定组件/关键入口文件”这一层，不要展开到函数级，也不要机械覆盖所有代码模块。',
        '8. implements 关系必须通过 OVERALL_ARCHITECTURE.md 与相关 ARCHITECTURE.md 契约显式声明。不是每个实现元素都必须直接连到意图元素。允许存在间接实现链路，例如实现元素 C implements 实现元素 B，而 B implements 意图元素 A；在这种情况下，C 通过实现链间接承载 A。你的任务是让这种实现链条可追踪、可解释，而不是强制所有节点都直接挂到意图层。',
        '9. 对于意图架构中的显性 testcase，你除了建立追溯关系外，还必须为每条需要落地的显性 testcase 明确其单一测试入口如何物理化，使后续编码阶段可以“直接调用而不修改”。若仓库中尚不存在该入口，本阶段应负责设计并产出对应入口文件或明确其只读落点，而不是把这项责任下推给编码阶段。',
        '10. 非显性测试必须分层处理：',
        '   - 关键非显性测试只收口于四类：直接守架构边界、依赖方向、显性入口正确性、关键实现追溯',
        '   - 关键非显性测试必须在本阶段定死并落盘其测试实现；/work 阶段不得修改其入口、断言边界、挂载对象、追溯关系、protected_fixtures 与 protected_baselines',
        '   - 普通非显性测试作为编码阶段的支撑护栏输入，可以在后续编码阶段按契约允许的位置补充与优化',
        '   - 非显性测试默认物理放在对应实现元素目录下的 tests/ 中；跨目录测试默认放在最近公共祖先目录下，并在相关 ARCHITECTURE.md 中回填归属',
        '11. OVERALL_ARCHITECTURE.md 与 ARCHITECTURE.md 的契约格式必须统一采用共享骨架，但根契约与元素契约承担不同字段职责。根级总入口由 OVERALL_ARCHITECTURE.md 唯一承载；子目录局部契约默认由 ARCHITECTURE.md 承载。ARCHITECTURE.md 可以引用 OVERALL_ARCHITECTURE.md，但不得重复定义根级规则。',
        '12. 按决策依赖顺序推进。先自己识别当前代码中的职责缠结、接口泄漏、shallow module 风险、不合理依赖方向以及实现承载缺口；然后只把真正高杠杆的架构决策提交给用户拍板。不要把可以通过仓库证据自己得出的结论丢给用户。若你发现自己开始按文件、类、函数或局部流程枚举实现元素，应立即回退并重新压缩成高层稳定边界。',
        '13. 输出必须使用中文，并严格包含以下内容：',
        '   - 仓库已证实的事实与当前实现约束',
        '   - 需要用户决策的问题：逐项列出推荐方案、备选方案、理由与权衡',
        '   - 最终实现架构设计摘要：一级元素、职责、接口、依赖方向、分层关系、与意图元素的实现映射（包括直接实现与间接实现链）',
        '   - 契约落盘结果：说明你已更新 OVERALL_ARCHITECTURE.md 与哪些 ARCHITECTURE.md，并概述关键规则、关键元素与局部契约',
        '   - 显性 testcase 入口物理化结果：说明哪些显性 testcase 已有只读入口、哪些入口需要新建或补位，以及这些入口如何交给后续编码阶段直接调用',
        '   - 关键非显性测试冻结结果：说明哪些关键非显性测试已定死、各自属于四类中的哪一类、落在什么路径、保护哪些夹具或基线数据',
        '   - 普通非显性测试递交结果：说明哪些普通非显性测试被创建或保留给后续编码阶段使用',
        '   - 仍未闭合的实现架构缺口：包括缺失契约、缺失显性入口、缺失关键护栏或需要后续编码阶段补齐的普通支撑测试',
        '14. 除非用户明确要求，否则本次任务不要直接修改业务功能实现；重点是维护实现架构契约、显性 testcase 入口设计、关键非显性测试冻结与后续编码护栏，而不是直接进入业务编码。',
    ];

    if (input.extraContext) {
        lines.push(`15. 当前补充上下文：${input.extraContext}`);
    }

    return lines.join('\n');
}
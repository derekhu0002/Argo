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
        '3. 读取实现架构图谱： #file:ImplementationArchitecture.json',
        '4. 以失败记录作为唯一待修复清单，并把 #file:ImplementationArchitecture.json 作为实现与补测试的辅助约束，直接修改当前工作区代码，而不是只给建议。',
        '5. 任何代码修改都必须同时遵守意图架构图谱与实现架构图谱中已经确定的原则、边界、依赖方向和实现映射，不能为了让测试通过而绕开这些约束，更不能引入新的架构违规。',
        '6. 如果当前代码与 #file:ImplementationArchitecture.json 中声明的模块职责、接口边界、分层关系或实现链不一致，应优先把实现拉回既定架构，再补功能或补测试。',
        '7. 具体执行时，必须把这些优秀实践当作硬约束，而不是口号：',
        '   - 保持 deep module，禁止把复杂度外泄给调用方，禁止用 shallow module 式补丁堆过测试',
        '   - 遵守 SOLID 与关注点分离，避免把多种不相干职责继续塞进同一模块',
        '   - 当行为差异持续扩大时，优先抽象稳定扩展点，而不是继续堆条件分支',
        '   - 高层流程只能依赖稳定抽象，不能直接回退到底层实现细节',
        '8. 任何新增或调整的外部接口，都必须有专门文档进行存放和维护，不能只散落在代码注释或聊天回复里：',
        '   - 外部接口文档需要说明用途、调用方式、输入输出、约束、错误语义与示例',
        '   - 所有新增或调整的外部接口，必须同步刷新到项目根目录的 INTRODUCTION.md，确保对外说明文档与当前真实接口保持一致',
        '   - 文档必须与本次代码改动同步更新',
        '9. 修复完成后，执行失败测试记录中 `acceptanceCriteria` 指向的测试脚本，直到这些用例全部通过；只要仍有失败，就继续修改、继续执行，不需要请示用户，更不能提前结束。',
        '10. 编码阶段默认以当前意图架构图谱中声明的显性 testcase 作为验收基线。这里的“显性 testcase”特指：被明确写入  #file:SystemArchitecture.json、直接承担架构验收职责、可由单一测试入口执行、并作为实现与回归基线管理的 testcase。你必须保持这些显性 testcase 的目标、挂载对象、断言口径与范围稳定。',
        '   - #file:ImplementationArchitecture.json 中挂载在实现元素下的非显性 testcase 仅用于指导你补齐实现、支撑性测试、执行脚本和测试环境；它们不构成显性架构验收基线，也不替代显性 testcase',
        '   - 你可以补齐实现代码、支撑性测试、执行脚本和测试环境，使既有或已确认的显性 testcase 真正可运行',
        '   - 你不得新增、删除、重建显性 testcase，也不得改写其目标、挂载对象、断言口径或范围；你只能补齐、修正或刷新它们的 `acceptanceCriteria` 所指向的单一测试入口，使其恢复可执行',
        '   - 显性 testcase 与 #file:ImplementationArchitecture.json 中的非显性 testcase 必须通过追溯链保持一致：显性 testcase 的目标、挂载对象、入口、范围变化时，要同步检查受影响的实现元素及其下挂载的非显性测试；反过来，若某条非显性测试直接支持的上游对象、验证边界或入口变化，也必须回头检查沿追溯链受影响的显性 testcase 是否仍然成立',
        '   - 对于已存在但缺少单一测试入口的 testcase，你可以补充对应脚本，使其做到“无需额外命令、无需额外参数、只执行脚本路径即可运行”',
        '   - 需要补齐支撑性验证时，应优先把非显性测试写回到对应实现元素下，而不是新建额外的独立测试基线文件',
        '   - 测试环境前置条件不满足时，你必须先从架构图谱中的 testcase 描述、相关元素、关系、视图、原则约束中主动发现相关信息，并依据这些信息自行构建最小可运行测试环境',
        '   - 禁止把“缺少测试环境说明”“环境前置条件不明确”“需要用户提供环境信息”作为阻塞理由；你的职责是自行发现、自行搭建、自行验证',
        '11. 在你完成所有代码修改、测试补齐、接口文档更新与路径回填之后，必须主动对整个意图架构图谱执行一次完整的全面测试，不允许跳过，并修复所有发现的问题。',
        '12. 完成后，请回复：',
        '   - 修改了哪些代码',
        '   - 新增或更新了哪些内外部接口',
        '   - INTRODUCTION.md 刷新了哪些外部接口信息',
        '   - 新增或回填了哪些完整 testcase 对象',
        '   - 参考了哪些非显性 testcase',
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

export function buildIntentInArchitectureDesignHandoffPrompt(): string {
    return [
        'Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree resolving dependencies between decisions one by one.',
        '',
        'If a question can be answered by exploring the codebase, explore the codebase instead.',
        '',
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
        `1. 分析范围仅限当前工作区 ${input.workspacePath}。必须先读取 #file:SystemArchitecture.json 与 #file:SystemArchitecture.schema.json，再按需读取代码、测试、脚本、配置与文档。凡是能从仓库和工具结果确认的事实，不要向用户追问。`,
        '2. 本次任务的输入是整个意图架构：包括意图元素、关系、视图、attributes、架构原则，以及其中挂载的显性 testcase。请把显性 testcase 视为契约，把意图架构本体视为需求边界与设计约束，把当前代码库视为实现现状证据。',
        '3. 这是一个 human in the loop 的实现架构设计任务，人类必须深度参与关键决策。你必须先自行吸收仓库事实，再把真正会改变实现架构走向的决策点拿出来与用户确认。至少以下事项必须显式征求用户意见，且每项都要给出推荐方案、备选方案、理由与权衡：',
        '   - 实现架构的一级分层和模块分解方式',
        '   - 关键接口边界与依赖方向',
        '   - 哪些实现元素用于直接实现意图元素',
        '   - 哪些非显性测试用例需要递交给后续编码阶段作为护栏',
        '4. 设计时必须显式应用并检查这些原则：整洁架构、SOLID、DEEP MODULE、渐进式披露、关注点分离、稳定抽象依赖方向。这里的“渐进式披露”不是要求输出迁移路线图，而是要求你的架构模型本身有层次性，优先通过包含、聚合、实现、依赖等关系组织结构，让人类和 AI 都能逐层理解。',
        '5. 你必须产出 UML 风格的实现架构模型，并将其真正落盘到 #file:ImplementationArchitecture.json。该文件路径固定为 `design/KG/ImplementationArchitecture.json`。模型结构必须遵循 #file:SystemArchitecture.schema.json 的骨架：顶层仍应包含 `name`、`description`、`elements`、`relationships`、`views`，元素与关系也使用相似的对象结构；但元素类型应偏向软件实现建模，例如 Package、Component、Interface、Module、Service、Adapter、Repository、DataStore、Artifact、Node 等。除非某个 Class 本身就是稳定架构边界、外部契约或关键依赖反转点，否则不要把普通类作为实现架构元素。',
        '6. 本次产出的实现架构必须是高层实现架构，不是源码镜像，也不是按文件、类、函数穷举的细粒度设计。默认只保留那些能够承载职责边界、依赖方向、测试挂载点、外部契约或意图实现映射的稳定实现元素。禁止把私有函数、普通 helper、机械拆分出的文件级模块、局部流程步骤或“为了看起来完整”而加入的低层细节铺进模型。若某个候选元素删掉以后，不影响人类理解系统的高层职责、接口边界、依赖方向、测试护栏或与意图元素的追溯关系，那它就不应该进入 ImplementationArchitecture.json。',
        '7. 颗粒度控制要求如下：优先建模一级分层、少量关键组件及其接口边界；只有当某个下级模块本身承载独立职责边界、稳定依赖方向、关键测试挂载点或关键 implements 追溯节点时，才允许继续下钻一层。默认停止在“组件/服务/适配器/仓储/节点”这一层，不要展开到函数级，也不要机械覆盖所有代码模块。底层实现细节原则上由代码本身表达，而不是由实现架构 JSON 重复表达。',
        '8. `design/KG/ImplementationArchitecture.json` 中的实现元素与 #file:SystemArchitecture.json 中的意图元素之间，跨模型映射只允许使用 implementation 语义的关系`implements`。不要用 `serves`、`aggregates`、`contains` 之类关系去直接连接实现元素和意图元素；这些关系只应用于实现架构模型内部的层次组织。',
        '9. 不是每个实现元素都必须直接连到意图元素。允许存在间接实现链路，例如实现元素 C implements 实现元素 B，而 B implements 意图元素 A；在这种情况下，C 通过实现链间接承载 A。你的任务是让这种实现链条可追踪、可解释，而不是强制所有节点都直接挂到意图层。',
        '10. 非显性测试用例直接写入 `design/KG/ImplementationArchitecture.json`，作为实现架构模型的一部分，挂载到相应实现元素下的 `testcases` 字段中。它们是后续编码阶段的支撑性验证输入，但不属于意图架构中的显性 testcase 基线。优先使用 schema 已有 testcase 结构；必要时可在testcase的描述中补充这些测试所保护的实现决策、显性 testcase 或前置条件。测试也必须服从高层颗粒度原则：优先挂在稳定实现边界上，不要因为某个函数存在就为它单独造一个架构元素来挂测试。',
        '11. 这些非显性测试用例只需要明确说明它们直接支持的上游对象，例如某个实现模块、某项实现决策，或某条上一级支撑性测试用例；不要求每条都直接写出最终对应的显性 testcase，只要沿着追溯链能够分析出它最终支撑到哪条显性 testcase 即可。',
        '12. 按决策依赖顺序推进。先自己识别当前代码中的职责缠结、接口泄漏、shallow module 风险、不合理依赖方向以及实现承载缺口；然后只把真正高杠杆的架构决策提交给用户拍板。不要把可以通过仓库证据自己得出的结论丢给用户。若你发现自己开始按文件、类、函数或局部流程枚举实现元素，应立即回退并重新压缩成高层稳定边界。',
        '13. 输出必须使用中文，并严格包含以下内容：',
        '   - 仓库已证实的事实与当前实现约束',
        '   - 需要用户决策的问题：逐项列出推荐方案、备选方案、理由与权衡',
        '   - 最终实现架构设计摘要：模块、职责、接口、依赖方向、分层关系、与意图元素的实现映射（包括直接实现与间接实现链）',
        '   - UML/JSON 建模结果：说明你已更新 `design/KG/ImplementationArchitecture.json`，并概述关键元素、关系、视图',
        '   - 非显性测试用例递交结果：说明你已把哪些非显性测试写入 `design/KG/ImplementationArchitecture.json`，并概述这些测试如何支撑后续编码阶段',
        '14. 除非用户明确要求，否则本次任务不要直接修改业务代码；重点是维护实现架构模型和后续编码护栏，而不是直接进入编码。',
    ];

    if (input.extraContext) {
        lines.push(`15. 当前补充上下文：${input.extraContext}`);
    }

    return lines.join('\n');
}
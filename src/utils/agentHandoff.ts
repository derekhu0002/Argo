import * as vscode from 'vscode';
import type { StitchViolation } from '../engine/types';

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
    failureRecords: Array<{
        testcasename: string;
        testdescription: string;
        acceptanceCriteria: string;
        relatedIntentElementId: string;
    }>;
    totalTestCases: number;
    missingCriteriaCount: number;
}): string {
    const lines = [
        '请作为 Copilot 主 agent 完成以下工作：',
        `1. 读取架构图谱文件：${input.architectureGraphPath}`,
        `2. 读取失败测试记录文件：${input.failureRecordsPath}`,
        '3. 以失败记录作为唯一待修复清单，直接修改当前工作区代码，而不是只给建议。',
        '4. 任何代码修改都必须满足架构图谱中的 `ArchiMate_Principle` 类型元素所描述的架构原则，不能引入新的架构违规；如果无法满足原则约束，请优先修复架构违规，再进行功能修复。',
        '5. 修复完成后，执行记录中 `acceptanceCriteria` 指向的测试脚本，直到这些用例全部通过；只要仍有失败，就继续修改、继续执行，不能提前结束。',
        '6. 如果架构图谱中 testcase 总数为 0，或者某条记录的 `acceptanceCriteria` 为空，则将该项视为尚未落地的新功能：',
        '   - 需要完成对应功能开发',
        '   - 你新增或回填的 `acceptanceCriteria` 必须是一个工作区内的单一测试入口：要么是单一脚本文件路径，要么是 `tests/test_x.py::test_y` 这种 pytest node id；禁止写成 `npm run ...`、`python ...`、`node ...` 这类命令行，且不允许附带任何额外参数',
        '   - 所有执行前置步骤、环境准备、依赖安装、数据构造、断言与退出码处理，都必须封装到这个单一测试入口可直接触发的脚本/用例中，使 Argo 只凭 `acceptanceCriteria` 就能运行它',
        '   - 测试环境前置条件不满足时，你必须先从架构图谱中的 testcase 描述、相关元素、关系、视图、原则约束中主动发现相关测试环境信息，并依据这些信息自行构建测试环境以满足前置条件',
        '   - 如果架构图谱没有直接写明测试环境，也不允许停下或向用户追问；你必须结合 testcase 描述、acceptanceCriteria、仓库现有脚本/配置/依赖，主动推导出“能让该测试落地”的最小可运行测试环境，并自行补齐',
        '   - 禁止把“缺少测试环境说明”“环境前置条件不明确”“需要用户提供环境信息”作为阻塞理由；你的职责就是自行发现、自行搭建、自行验证',
        '   - 需要补充测试脚本；该脚本必须做到“无需额外命令、无需额外参数、只执行脚本路径即可运行”',
        '   - 需要把测试脚本路径回填到 design/KG/SystemArchitecture.json 的 `acceptanceCriteria` 字段',
        '7. 在你完成所有代码修改、测试补齐与路径回填之后，必须主动对整个架构图谱执行一次完整的全面测试，不允许跳过，并修复所有发现的问题。',
        '8. 完成后，请回复：',
        '   - 修改了哪些代码',
        '   - 新增或回填了哪些测试路径',
        '   - 当前测试执行结果',
        '   - 你是从架构图谱和仓库上下文中如何识别并搭建测试环境的',
    ];

    if (input.totalTestCases === 0) {
        lines.push('9. 当前架构图谱没有任何 testcase，请按“新功能开发 + 回填测试路径”的方式处理。');
    } else if (input.missingCriteriaCount > 0) {
        lines.push(`9. 当前有 ${input.missingCriteriaCount} 个 testcase 缺少 acceptanceCriteria，请补齐测试脚本并回填路径。`);
    }

    if (input.extraContext) {
        lines.push(`9. 额外上下文：${input.extraContext}`);
    }

    if (input.failureRecords.length > 0) {
        lines.push('10. 当前失败记录如下：');
        lines.push(JSON.stringify(input.failureRecords, null, 2));
    }

    return lines.join('\n');
}
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
        '4. 修复完成后，执行记录中 `acceptanceCriteria` 指向的测试脚本，直到这些用例全部通过。',
        '5. 如果架构图谱中 testcase 总数为 0，或者某条记录的 `acceptanceCriteria` 为空，则将该项视为尚未落地的新功能：',
        '   - 需要完成对应功能开发',
        '   - 需要补充测试脚本',
        '   - 需要把测试脚本路径回填到 design/KG/SystemArchitecture.json 的 `acceptanceCriteria` 字段',
        '6. 在你完成所有代码修改、测试补齐与路径回填之后，必须主动对整个架构图谱执行一次完整的全面测试，不允许跳过，并修复所有发现的问题。',
        '7. 完成后，请回复：',
        '   - 修改了哪些代码',
        '   - 新增或回填了哪些测试路径',
        '   - 当前测试执行结果',
    ];

    if (input.totalTestCases === 0) {
        lines.push('8. 当前架构图谱没有任何 testcase，请按“新功能开发 + 回填测试路径”的方式处理。');
    } else if (input.missingCriteriaCount > 0) {
        lines.push(`8. 当前有 ${input.missingCriteriaCount} 个 testcase 缺少 acceptanceCriteria，请补齐测试脚本并回填路径。`);
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
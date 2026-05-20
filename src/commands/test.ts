import * as vscode from 'vscode';
import {
    ArchitectureTestExecutionResult,
    type ArchitectureTestProgressUpdate,
    type ArchitectureTestRunSummary,
    DEFAULT_ARCHITECTURE_GRAPH_PATH,
    runArchitectureTests,
} from '../tools/architectureTestTool';
import {
    isExplicitTestcaseEntryGuardEnabled,
    setExplicitTestcaseEntryGuardStage,
} from '../utils/explicitTestcaseEntryGuard';

export async function handleTest(
    _request: vscode.ChatRequest,
    _context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
): Promise<void> {
    stream.markdown('## /test - Explicit Testcase Execution\n\n');
    await setExplicitTestcaseEntryGuardStage('coding');
    stream.markdown(
        isExplicitTestcaseEntryGuardEnabled()
            ? '显性测试入口保护已启用：测试执行后若进入编码修复阶段，Argo 会继续阻止对显性测试入口的误改写。\n\n'
            : '显性测试入口保护当前未启用：如果你随后进入编码修复阶段，建议确认 `argo.protectExplicitTestcaseEntriesDuringCoding` 设置。\n\n',
    );
    stream.markdown('### Step 1 - Running explicit tests from the intent architecture ...\n\n');

    let summary: ArchitectureTestRunSummary;
    try {
        summary = await executeArchitectureTests(stream, token);
    } catch (error) {
        if (error instanceof vscode.CancellationError) {
            return;
        }
        stream.markdown(`❌ Failed to execute architecture tests: \`${String(error)}\`\n`);
        return;
    }

    stream.markdown(renderSummary(summary));

    if (summary.totalTestCases === 0) {
        stream.markdown(
            '⚠️ 当前意图架构图谱中没有任何显性 testcase。按当前逻辑边界，这意味着尚未形成可执行的显性验收基线；应回到意图架构设计或实现架构设计阶段补齐基线，而不是在编码阶段直接补写。\n',
        );
        return;
    }

    if (summary.failedCount === 0) {
        stream.markdown('✅ 所有已声明测试均已通过，`design/KG/test-failure-records.json` 已刷新完成。\n');
        return;
    }

    stream.markdown('### Next Step\n\n');
    stream.markdown('测试失败记录已刷新到 `design/KG/test-failure-records.json`。现在可以执行 `/work`，让主 agent 仅围绕这些失败记录进行修复。\n');
}

async function executeArchitectureTests(
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
): Promise<ArchitectureTestRunSummary> {
    return runArchitectureTests(
        DEFAULT_ARCHITECTURE_GRAPH_PATH,
        token,
        update => {
            stream.progress(renderProgress(update));
        },
    );
}

function renderProgress(update: ArchitectureTestProgressUpdate): string {
    const testcaseName = update.testcaseName || '(unnamed testcase)';
    const scriptPath = update.resolvedScriptPath || '(missing acceptanceCriteria)';
    const executionCommand = update.executionCommand || '(n/a)';
    return `[${update.currentIndex}/${update.totalTestCases}] ${testcaseName} | ${scriptPath} | ${executionCommand} | ${update.status}`;
}

function renderSummary(summary: ArchitectureTestRunSummary): string {
    const lines: string[] = [
        `- Architecture graph: \`${summary.architecturePath}\``,
        `- Total testcases: ${summary.totalTestCases}`,
        `- Passed: ${summary.passedCount}`,
        `- Failed or missing: ${summary.failedCount}`,
        `- Missing acceptanceCriteria: ${summary.missingCriteriaCount}`,
        `- Failure records: \`${summary.failureRecordsPath}\``,
        '',
        '### Test Results',
        '',
    ];

    if (summary.results.length === 0) {
        lines.push('- No testcase entries were found in the architecture graph.', '');
        return lines.join('\n');
    }

    for (const result of summary.results) {
        lines.push(renderExecutionResult(result));
    }
    lines.push('');
    return lines.join('\n');
}

function renderExecutionResult(result: ArchitectureTestExecutionResult): string {
    const detail = result.resolvedScriptPath
        ? `script: \`${result.resolvedScriptPath}\``
        : 'script: (missing)';
    const executionCommand = result.executionCommand
        ? `command: \`${result.executionCommand}\``
        : 'command: (n/a)';
    const exitCode = result.exitCode === null ? 'n/a' : String(result.exitCode);
    const stderr = shrink(result.stderr);
    const stdout = shrink(result.stdout);
    let line = `- ${result.testcaseName || '(unnamed testcase)'}: ${result.status} · ${detail} · ${executionCommand} · exitCode: ${exitCode}`;
    if (stdout) {
        line += ` · stdout: ${stdout}`;
    }
    if (stderr) {
        line += ` · stderr: ${stderr}`;
    }
    return line;
}

function shrink(value: string): string {
    if (!value) {
        return '';
    }
    const singleLine = value.replace(/\s+/g, ' ').trim();
    return singleLine.length > 160 ? `${singleLine.slice(0, 157)}...` : singleLine;
}

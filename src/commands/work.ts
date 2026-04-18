import * as vscode from 'vscode';
import {
    ARGO_TEST_TOOL_NAME,
    ArchitectureTestExecutionResult,
    type ArchitectureTestRunSummary,
    DEFAULT_ARCHITECTURE_GRAPH_PATH,
    FAILURE_RECORDS_PATH,
} from '../tools/architectureTestTool';
import { buildWorkAgentHandoffPrompt } from '../utils/agentHandoff';

export async function handleWork(
    request: vscode.ChatRequest,
    _context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
): Promise<void> {
    stream.markdown('## /work - Architecture Test Driven Delivery\n\n');
    stream.markdown('### Step 1 - Running all architecture-linked tests ...\n\n');

    let summary: ArchitectureTestRunSummary;
    try {
        const toolResult = await vscode.lm.invokeTool(
            ARGO_TEST_TOOL_NAME,
            {
                toolInvocationToken: request.toolInvocationToken,
                input: { architecturePath: DEFAULT_ARCHITECTURE_GRAPH_PATH },
            },
            token,
        );
        summary = parseArchitectureTestRunSummary(toolResult);
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
            '⚠️ 当前架构图谱中没有任何 testcase。按工作流约定，这意味着对应功能需要新开发，且开发完成后必须回填测试用例路径。\n\n',
        );
    }

    if (summary.failedCount === 0 && summary.totalTestCases > 0) {
        stream.markdown('✅ 所有已声明测试均已通过，当前无需再交接主 agent。\n');
        return;
    }

    const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!rootPath) {
        stream.markdown('❌ No workspace folder is open.\n');
        return;
    }

    const handoffPrompt = buildWorkAgentHandoffPrompt({
        architectureGraphPath: `${rootPath}\\design\\KG\\SystemArchitecture.json`,
        failureRecordsPath: `${rootPath}\\${FAILURE_RECORDS_PATH.replace(/\//g, '\\')}`,
        extraContext: request.prompt.trim(),
        failureRecords: summary.failureRecords,
        totalTestCases: summary.totalTestCases,
        missingCriteriaCount: summary.missingCriteriaCount,
    });

    stream.markdown(
        '### Step 2 - Handoff To Copilot Main Agent\n\n' +
        '当前稳定 VS Code API 不支持由该工作代理直接编程式拉起 Copilot 主 agent 并等待它完成开发。\n\n' +
        '请将下面这段指令交给 Copilot 主 agent。它需要先读取失败记录文件，再进行开发，直到这些测试通过；如果测试为空或 `acceptanceCriteria` 为空，则要把该项视为新功能开发并回填测试路径。\n\n',
    );
    stream.markdown('```text\n' + handoffPrompt + '\n```\n');
}

function parseArchitectureTestRunSummary(result: vscode.LanguageModelToolResult): ArchitectureTestRunSummary {
    const textPart = result.content.find(part => part instanceof vscode.LanguageModelTextPart);
    if (!(textPart instanceof vscode.LanguageModelTextPart)) {
        throw new Error('argo.test did not return a text result.');
    }
    return JSON.parse(textPart.value) as ArchitectureTestRunSummary;
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
    const exitCode = result.exitCode === null ? 'n/a' : String(result.exitCode);
    const stderr = shrink(result.stderr);
    const stdout = shrink(result.stdout);
    let line = `- ${result.testcaseName || '(unnamed testcase)'}: ${result.status} · ${detail} · exitCode: ${exitCode}`;
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
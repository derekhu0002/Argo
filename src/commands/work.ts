import * as vscode from 'vscode';
import {
    ArchitectureTestExecutionResult,
    type ArchitectureTestProgressUpdate,
    type ArchitectureTestRunSummary,
    DEFAULT_ARCHITECTURE_GRAPH_PATH,
    FAILURE_RECORDS_PATH,
    runArchitectureTests,
} from '../tools/architectureTestTool';
import { buildWorkAgentHandoffPrompt } from '../utils/agentHandoff';
import {
    isExplicitTestcaseEntryGuardEnabled,
    setExplicitTestcaseEntryGuardStage,
} from '../utils/explicitTestcaseEntryGuard';

export async function handleWork(
    request: vscode.ChatRequest,
    _context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
): Promise<void> {
    stream.markdown('## /work - Architecture Test Driven Delivery\n\n');
    await setExplicitTestcaseEntryGuardStage('coding');
    stream.markdown(
        isExplicitTestcaseEntryGuardEnabled()
            ? '显性测试入口保护已启用：编码阶段若尝试改写这些文件，Argo 会自动回滚并拒绝该修改。\n\n'
            : '显性测试入口保护当前未启用：只有当你打开设置 `argo.protectExplicitTestcaseEntriesDuringCoding` 后，Argo 才会在编码阶段自动回滚并拒绝这类修改。\n\n',
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
            '⚠️ 当前意图架构图谱中没有任何显性 testcase。按当前逻辑边界，这意味着尚未形成可执行的显性验收基线；应回到意图架构设计或实现架构设计阶段补齐基线，而不是在编码阶段直接补写。\n\n',
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
        '当前稳定 VS Code API 不支持由该工作代理直接编程式拉起 Copilot agent 并等待它完成开发。\n\n' +
        '请优先调用自定义 agent `architecture-delivery-worker`，并将下面这段指令作为本次任务输入。它需要先读取失败记录文件、OVERALL_ARCHITECTURE.md 与相关 ARCHITECTURE.md 契约，再进行开发，直到这些测试通过；编码阶段只允许补齐实现代码、普通支撑性测试和测试环境，并调用现有显性 testcase 入口做验收。不得把测试桩、测试分支、测试专用返回字段或任何其他测试内容混入业务代码。不得新增、删除、重建或改写显性 testcase，也不得修改其既有测试入口；对关键非显性测试及其受保护夹具、基线数据也一律只读。若发现 `acceptanceCriteria` 缺失、显性测试入口失效，或关键非显性测试契约本身错误，应将其视为实现架构设计阶段遗留缺口并明确回报，而不是在编码阶段直接改写这些冻结资产。\n\n',
    );
    stream.markdown('```text\n' + handoffPrompt + '\n```\n');
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
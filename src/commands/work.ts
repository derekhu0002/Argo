import * as vscode from 'vscode';
import { FAILURE_RECORDS_PATH, type FailedTestRecord } from '../tools/architectureTestTool';
import { buildWorkAgentHandoffPrompt } from '../utils/agentHandoff';
import {
    isExplicitTestcaseEntryGuardEnabled,
    setExplicitTestcaseEntryGuardStage,
} from '../utils/explicitTestcaseEntryGuard';

export async function handleWork(
    request: vscode.ChatRequest,
    _context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    _token: vscode.CancellationToken,
): Promise<void> {
    stream.markdown('## /work - Coding Repair Handoff\n\n');
    await setExplicitTestcaseEntryGuardStage('coding');
    stream.markdown(
        isExplicitTestcaseEntryGuardEnabled()
            ? '显性测试入口保护已启用：编码阶段若尝试改写这些文件，Argo 会自动回滚并拒绝该修改。\n\n'
            : '显性测试入口保护当前未启用：只有当你打开设置 `argo.protectExplicitTestcaseEntriesDuringCoding` 后，Argo 才会在编码阶段自动回滚并拒绝这类修改。\n\n',
    );

    const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!rootPath) {
        stream.markdown('❌ No workspace folder is open.\n');
        return;
    }

    const failureRecordsPath = `${rootPath}\\${FAILURE_RECORDS_PATH.replace(/\//g, '\\')}`;
    const failureRecords = await readFailureRecords(vscode.Uri.file(failureRecordsPath));

    stream.markdown(`当前将直接基于失败记录交接主 agent：\`${failureRecordsPath}\`\n\n`);
    if (failureRecords.length === 0) {
        stream.markdown('⚠️ 当前失败记录为空。若你希望先刷新测试结果，请先执行 `/test`。\n\n');
    } else {
        stream.markdown(`已读取到 ${failureRecords.length} 条失败记录，/work 将要求主 agent 直接解决这些问题。\n\n`);
    }

    const handoffPrompt = buildWorkAgentHandoffPrompt({
        architectureGraphPath: `${rootPath}\\design\\KG\\SystemArchitecture.json`,
        failureRecordsPath,
        extraContext: request.prompt.trim(),
        failureRecords,
    });

    stream.markdown('### Handoff To Copilot Main Agent\n\n');
    stream.markdown('```text\n' + handoffPrompt + '\n```\n');
}

async function readFailureRecords(fileUri: vscode.Uri): Promise<FailedTestRecord[]> {
    try {
        const buffer = await vscode.workspace.fs.readFile(fileUri);
        const parsed = JSON.parse(Buffer.from(buffer).toString('utf8'));
        return Array.isArray(parsed) ? parsed as FailedTestRecord[] : [];
    } catch {
        return [];
    }
}
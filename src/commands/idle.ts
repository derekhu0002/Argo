import * as vscode from 'vscode';
import {
    isExplicitTestcaseEntryGuardEnabled,
    setExplicitTestcaseEntryGuardStage,
} from '../utils/explicitTestcaseEntryGuard';

export async function handleIdle(
    _request: vscode.ChatRequest,
    _context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    _token: vscode.CancellationToken,
): Promise<void> {
    await setExplicitTestcaseEntryGuardStage('idle');

    stream.markdown('## /idle - Reset Guard Stage\n\n');
    stream.markdown('当前阶段已切换为 `idle`。\n\n');
    stream.markdown(
        isExplicitTestcaseEntryGuardEnabled()
            ? '显性测试入口保护开关仍处于开启状态，但在 `idle` 阶段不会拦截文件修改；只有再次进入 `/work` 的 coding 阶段时才会生效。\n'
            : '显性测试入口保护开关当前也是关闭状态。\n',
    );
}
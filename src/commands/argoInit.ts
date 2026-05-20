import * as vscode from 'vscode';
import { ensureWorkspaceEaTemplates } from '../utils/workspaceBootstrap';

export async function handleArgoInit(
    _request: vscode.ChatRequest,
    _context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    _token: vscode.CancellationToken,
): Promise<void> {
    stream.markdown('## /argo-init - Workspace Bootstrap\n\n');

    const workspaceFolders = vscode.workspace.workspaceFolders ?? [];
    if (workspaceFolders.length === 0) {
        stream.markdown('❌ No workspace folder is open.\n');
        return;
    }

    const extension = vscode.extensions.getExtension('argo-team.argo-architect');
    if (!extension) {
        stream.markdown('❌ 无法定位当前 Argo 扩展实例，因此不能执行工作区初始化拷贝。\n');
        return;
    }

    stream.markdown('将复用扩展启动时的同一套拷贝逻辑：EA 模板、捆绑的 `.github` 目录内容以及 SystemArchitecture schema。\n\n');

    await ensureWorkspaceEaTemplates(extension.extensionUri);

    stream.markdown('已触发工作区初始化拷贝，策略与扩展启动时保持一致。\n\n');
    stream.markdown('处理的工作区：\n');
    for (const folder of workspaceFolders) {
        stream.markdown(`- ${folder.name}\n`);
    }
}

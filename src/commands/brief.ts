import * as vscode from 'vscode';
import { buildProductBriefHandoffPrompt } from '../utils/agentHandoff';

export async function handleBrief(
    request: vscode.ChatRequest,
    _context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    _token: vscode.CancellationToken,
): Promise<void> {
    stream.markdown('## /brief - External Product Brief Handoff\n\n');

    const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!rootPath) {
        stream.markdown('❌ No workspace folder is open.\n');
        return;
    }

    const handoffPrompt = buildProductBriefHandoffPrompt({
        workspacePath: rootPath,
        readmePath: `${rootPath}\\README.md`,
        packageJsonPath: `${rootPath}\\package.json`,
        architectureGraphPath: `${rootPath}\\design\\KG\\SystemArchitecture.json`,
        extraContext: request.prompt.trim(),
    });

    stream.markdown(
        '当前稳定 VS Code API 不支持由该工作代理直接编程式拉起 Copilot 主 agent 并等待它完成文档分析。\n\n' +
        '请将下面这段指令交给 Copilot 主 agent。它会基于当前仓库内容生成一份面向外部调用方/潜在采用方的产品说明文档，重点覆盖功能、接口、调用方式、前置条件与采用评估信息。\n\n',
    );
    stream.markdown('```text\n' + handoffPrompt + '\n```\n');
}
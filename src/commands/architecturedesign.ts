import * as vscode from 'vscode';
import { buildArchitectureDesignHandoffPrompt } from '../utils/agentHandoff';

export async function handleArchitectureDesign(
    request: vscode.ChatRequest,
    _context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    _token: vscode.CancellationToken,
): Promise<void> {
    stream.markdown('## /architecturedesign - Architecture Design Handoff\n\n');

    const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!rootPath) {
        stream.markdown('❌ No workspace folder is open.\n');
        return;
    }

    const handoffPrompt = buildArchitectureDesignHandoffPrompt({
        workspacePath: rootPath,
        readmePath: `${rootPath}\\README.md`,
        packageJsonPath: `${rootPath}\\package.json`,
        architectureGraphPath: `${rootPath}\\design\\KG\\SystemArchitecture.json`,
        srcPath: `${rootPath}\\src`,
        testsPath: `${rootPath}\\tests`,
        extraContext: request.prompt.trim(),
    });

    stream.markdown(
        '当前稳定 VS Code API 不支持由该工作代理直接编程式拉起 Copilot 主 agent 并等待它完成架构设计分析。\n\n' +
        '请将下面这段指令交给 Copilot 主 agent。它会持续和用户交互、按需探索当前仓库，并最终把新增或维护后的 ArchiMate 模型落到 design\\KG\\SystemArchitecture.json。\n\n',
    );
    stream.markdown('```text\n' + handoffPrompt + '\n```\n');
}
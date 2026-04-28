import * as vscode from 'vscode';
import { buildTestDesignHandoffPrompt } from '../utils/agentHandoff';

export async function handleTestDesign(
    request: vscode.ChatRequest,
    _context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    _token: vscode.CancellationToken,
): Promise<void> {
    stream.markdown('## /testdesign - Test Design Handoff\n\n');

    const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!rootPath) {
        stream.markdown('❌ No workspace folder is open.\n');
        return;
    }

    const handoffPrompt = buildTestDesignHandoffPrompt({
        workspacePath: rootPath,
        readmePath: `${rootPath}\\README.md`,
        packageJsonPath: `${rootPath}\\package.json`,
        architectureGraphPath: `${rootPath}\\design\\KG\\SystemArchitecture.json`,
        testsPath: `${rootPath}\\tests`,
        srcPath: `${rootPath}\\src`,
        extraContext: request.prompt.trim(),
    });

    stream.markdown(
        '当前稳定 VS Code API 不支持由该工作代理直接编程式拉起 Copilot 主 agent 并等待它完成测试设计分析。\n\n' +
        '请将下面这段指令交给 Copilot 主 agent。它会先向用户询问当前需求或问题，再基于当前仓库、用户回复和现有测试资产，分析应该新增哪些测试、保留哪些测试、调整哪些测试，并覆盖 unit test、system test、integration test、scenario test、acceptance test、inspection test 中真正需要的类型；完成后还必须把所有测试建议回填到架构图谱 design\\KG\\SystemArchitecture.json。\n\n',
    );
    stream.markdown('```text\n' + handoffPrompt + '\n```\n');
}
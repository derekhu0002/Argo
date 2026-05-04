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
        '请将下面这段指令交给 Copilot 主 agent。它会先吸收当前仓库中的架构基线、实现证据与现有测试资产，再以 human in the loop 方式逐步收敛测试设计：能从仓库与运行结果回答的问题先自己回答，只有在问题会改变测试方向、验收口径或回填范围时才向用户提问；每个问题都必须同时给出推荐答案、理由与权衡。对于 unit test、system test、inspection test，如果仓库里还没有可证实的实现边界或测试落点，就只能先定义为支撑性占位项，而不能伪造具体测试。显性 testcase 的任何新增、修改、删除，都必须先征求用户同意，达成一致后才能回填到架构图谱 design\\KG\\SystemArchitecture.json。\n\n',
    );
    stream.markdown('```text\n' + handoffPrompt + '\n```\n');
}
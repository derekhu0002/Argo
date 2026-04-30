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
        '请将下面这段指令交给 Copilot 主 agent。它会先吸收当前仓库中的架构基线、实现证据与现有测试资产，只在仓库证据不足时再向用户补问缺口信息；随后分析应该新增哪些测试、保留哪些测试、调整哪些测试，并仅选择 unit test、system test、integration test、scenario test、acceptance test、inspection test 中真正需要的类型。其中 unit test、system test、inspection test 只应作为支撑 acceptance test 与 scenario test 顺利达成的精炼测试；对任何 testcase 的新增、修改、删除，都必须先向用户展示方案并征求意见或同意，达成一致后才能回填到架构图谱 design\\KG\\SystemArchitecture.json。\n\n',
    );
    stream.markdown('```text\n' + handoffPrompt + '\n```\n');
}
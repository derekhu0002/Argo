import * as vscode from 'vscode';
import { buildImplementationDesignHandoffPrompt } from '../utils/agentHandoff';

export async function handleImplementationDesign(
    request: vscode.ChatRequest,
    _context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    _token: vscode.CancellationToken,
): Promise<void> {
    stream.markdown('## /implementationdesign - Implementation Architecture Design Handoff\n\n');

    const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!rootPath) {
        stream.markdown('❌ No workspace folder is open.\n');
        return;
    }

    const handoffPrompt = buildImplementationDesignHandoffPrompt({
        workspacePath: rootPath,
        architectureGraphPath: `${rootPath}\\design\\KG\\SystemArchitecture.json`,
        schemaPath: `${rootPath}\\schema\\SystemArchitecture.schema.json`,
        implementationArchitecturePath: `${rootPath}\\design\\KG\\ImplementationArchitecture.json`,
        testsPath: `${rootPath}\\tests`,
        srcPath: `${rootPath}\\src`,
        extraContext: request.prompt.trim(),
    });

    stream.markdown(
        '当前稳定 VS Code API 不支持由该工作代理直接编程式拉起 Copilot 主 agent 并等待它完成实现架构设计。\n\n' +
        '请将下面这段指令交给 Copilot 主 agent。它必须把整个意图架构与其中显性 testcase 一起作为输入，在人类深度参与关键决策的前提下，产出 UML 风格的实现架构模型，并将结果写入 `design/KG/ImplementationArchitecture.json`。非显性测试用例也必须直接写入这个实现架构文件，对应挂载在相关实现元素下，而不是拆到独立文件。跨模型时，实现元素到意图元素只允许使用 implementation 语义关系；但允许通过实现链形成间接实现。只有真正会改变模块分解、接口边界、依赖方向、意图实现映射或支撑性测试护栏的事项，才应提交给用户拍板，而且每个决策都必须给出推荐方案、备选方案、理由与权衡。\n\n',
    );
    stream.markdown('```text\n' + handoffPrompt + '\n```\n');
}
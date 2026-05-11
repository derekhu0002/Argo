import * as vscode from 'vscode';
import { buildImplementationDesignHandoffPrompt } from '../utils/agentHandoff';
import { setExplicitTestcaseEntryGuardStage } from '../utils/explicitTestcaseEntryGuard';

export async function handleImplementationDesign(
    request: vscode.ChatRequest,
    _context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    _token: vscode.CancellationToken,
): Promise<void> {
    stream.markdown('## /implementationdesign - Implementation Architecture Design Handoff\n\n');
    await setExplicitTestcaseEntryGuardStage('implementationdesign');
    stream.markdown('已切换到实现架构设计阶段：显性测试入口文件当前允许由设计阶段完成物理化。\n\n');

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
        '请将下面这段指令交给 Copilot 主 agent。它必须把整个意图架构与其中显性 testcase 一起作为输入，在人类深度参与关键决策的前提下，直接把实现架构落实到代码仓本体：更新 OVERALL.md、相关 README.md、显性 testcase 只读入口、关键非显性测试与普通支撑护栏，而不是再生成独立的 ImplementationArchitecture.json。对于显性 testcase，除了建立追溯关系外，还必须落实为后续编码阶段可直接调用的只读测试入口；对于关键非显性测试，也必须在本阶段定死其测试实现并冻结。跨层讨论聚合/组合关系时，统一按“部分（source）指向整体（target）”理解；目录层级默认只表达包含，不自动表达 implements。只有真正会改变模块分解、接口边界、依赖方向、意图实现映射、显性入口冻结方式或关键测试护栏的事项，才应提交给用户拍板，而且每个决策都必须给出推荐方案、备选方案、理由与权衡。\n\n',
    );
    stream.markdown('```text\n' + handoffPrompt + '\n```\n');
}
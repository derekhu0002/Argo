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

    stream.markdown('```text\n' + handoffPrompt + '\n```\n');
}
import * as vscode from 'vscode';
import { buildIntentInArchitectureDesignHandoffPrompt } from '../utils/agentHandoff';

export async function handleIntentInArchitectureDesign(
    _request: vscode.ChatRequest,
    _context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    _token: vscode.CancellationToken,
): Promise<void> {
    stream.markdown('## /intentinarchitecturedesign - Intent In Architecture Design Handoff\n\n');
    stream.markdown(
        '当前稳定 VS Code API 不支持由该工作代理直接编程式拉起 Copilot 主 agent 并等待它完成意图架构设计访谈。\n\n' +
        '请将下面这段指令交给 Copilot 主 agent。它会按照 grill-me 工作方式持续盘问设计分支，并在代码库能够回答问题时优先自行探索仓库。\n\n',
    );
    stream.markdown('```text\n' + buildIntentInArchitectureDesignHandoffPrompt() + '\n```\n');
}
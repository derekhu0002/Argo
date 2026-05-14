import * as vscode from 'vscode';
import { buildIntentInArchitectureDesignHandoffPrompt } from '../utils/agentHandoff';
import { setExplicitTestcaseEntryGuardStage } from '../utils/explicitTestcaseEntryGuard';

export async function handleIntentInArchitectureDesign(
    _request: vscode.ChatRequest,
    _context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    _token: vscode.CancellationToken,
): Promise<void> {
    stream.markdown('## /intentinarchitecturedesign - Intent In Architecture Design Handoff\n\n');
    await setExplicitTestcaseEntryGuardStage('intentiondesign');
    stream.markdown(
        '当前稳定 VS Code API 不支持由该工作代理直接编程式拉起 Copilot agent 并等待它完成意图架构设计访谈。\n\n' +
        '请优先调用自定义 agent `intent-architecture-designer`，并将下面这段指令作为本次任务输入。它会直接复用 grill-me skill 的工作方式，在代码库能够回答问题时优先自行探索仓库。\n\n',
    );
    stream.markdown('```text\n' + buildIntentInArchitectureDesignHandoffPrompt() + '\n```\n');
}
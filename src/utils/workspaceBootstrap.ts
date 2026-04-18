import * as vscode from 'vscode';

const EA_TEMPLATE_PATH = ['eatool', 'EA-model-template.feap'] as const;
const WINDOWS_RESERVED_NAMES = new Set([
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
]);

export async function ensureWorkspaceEaTemplates(extensionUri: vscode.Uri): Promise<void> {
    const folders = vscode.workspace.workspaceFolders ?? [];
    for (const folder of folders) {
        await ensureWorkspaceEaTemplate(folder, extensionUri);
    }
}

async function ensureWorkspaceEaTemplate(
    folder: vscode.WorkspaceFolder,
    extensionUri: vscode.Uri,
): Promise<void> {
    const targetFileName = buildTargetFileName(folder.name);
    const targetUri = vscode.Uri.joinPath(folder.uri, targetFileName);

    if (await fileExists(targetUri)) {
        void vscode.window.showWarningMessage(
            `Argo 未覆盖已存在的 EA 模型文件: ${targetFileName}`,
        );
        return;
    }

    const templateUri = vscode.Uri.joinPath(extensionUri, ...EA_TEMPLATE_PATH);
    try {
        const templateBytes = await vscode.workspace.fs.readFile(templateUri);
        await vscode.workspace.fs.writeFile(targetUri, templateBytes);
    } catch (error) {
        void vscode.window.showErrorMessage(
            `Argo 初始化 EA 模型模板失败: ${String(error)}`,
        );
    }
}

async function fileExists(uri: vscode.Uri): Promise<boolean> {
    try {
        await vscode.workspace.fs.stat(uri);
        return true;
    } catch {
        return false;
    }
}

function buildTargetFileName(workspaceName: string): string {
    const sanitized = sanitizeFileName(workspaceName) || 'workspace';
    const safeBaseName = WINDOWS_RESERVED_NAMES.has(sanitized.toUpperCase())
        ? `${sanitized}_workspace`
        : sanitized;
    return `${safeBaseName}.feap`;
}

function sanitizeFileName(value: string): string {
    return value
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
        .replace(/[.\s]+$/g, '')
        .trim();
}
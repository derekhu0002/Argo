import * as vscode from 'vscode';

const EA_TEMPLATE_PATH = ['eatool', 'EA-model-template.feap'] as const;
const SYSTEM_ARCHITECTURE_SCHEMA_PATH = ['schema', 'SystemArchitecture.schema.json'] as const;
const WORKSPACE_SCHEMA_TARGET_PATH = ['.github', 'argoschema', 'SystemArchitecture.schema.json'] as const;
const WINDOWS_RESERVED_NAMES = new Set([
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
]);

export async function ensureWorkspaceEaTemplates(extensionUri: vscode.Uri): Promise<void> {
    await ensureWorkspaceEaTemplatesForFolders(
        vscode.workspace.workspaceFolders ?? [],
        extensionUri,
    );
}

export async function ensureWorkspaceEaTemplatesForFolders(
    folders: readonly vscode.WorkspaceFolder[],
    extensionUri: vscode.Uri,
): Promise<void> {
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
        await ensureWorkspaceSystemArchitectureSchema(folder, extensionUri);
        return;
    }

    const templateUri = vscode.Uri.joinPath(extensionUri, ...EA_TEMPLATE_PATH);
    try {
        const templateBytes = await vscode.workspace.fs.readFile(templateUri);
        await vscode.workspace.fs.writeFile(targetUri, templateBytes);
        await ensureWorkspaceSystemArchitectureSchema(folder, extensionUri);
    } catch (error) {
        console.error('Argo failed to initialize EA model template.', {
            targetFileName,
            templateUri: templateUri.toString(),
            targetUri: targetUri.toString(),
            error,
        });
        void vscode.window.showErrorMessage(
            `Argo 初始化 EA 模型模板失败: ${String(error)}`,
        );
    }
}

async function ensureWorkspaceSystemArchitectureSchema(
    folder: vscode.WorkspaceFolder,
    extensionUri: vscode.Uri,
): Promise<void> {
    const sourceUri = vscode.Uri.joinPath(extensionUri, ...SYSTEM_ARCHITECTURE_SCHEMA_PATH);
    const targetUri = vscode.Uri.joinPath(folder.uri, ...WORKSPACE_SCHEMA_TARGET_PATH);

    try {
        const schemaBytes = await vscode.workspace.fs.readFile(sourceUri);
        await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(folder.uri, '.github', 'argoschema'));
        await vscode.workspace.fs.writeFile(targetUri, schemaBytes);
    } catch (error) {
        console.error('Argo failed to initialize workspace schema.', {
            sourceUri: sourceUri.toString(),
            targetUri: targetUri.toString(),
            error,
        });
        void vscode.window.showErrorMessage(
            `Argo 初始化 SystemArchitecture schema 失败: ${String(error)}`,
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
import * as vscode from 'vscode';

const EA_TEMPLATE_PATH = ['eatool', 'EA-model-template.feap'] as const;
const SYSTEM_ARCHITECTURE_SCHEMA_PATH = ['schema', 'SystemArchitecture.schema.json'] as const;
const BUNDLED_GITHUB_DIR_PATH = ['.github'] as const;
const WORKSPACE_SCHEMA_TARGET_PATH = ['.github', 'argoschema', 'SystemArchitecture.schema.json'] as const;
const PACKAGE_JSON_TARGET_PATH = ['package.json'] as const;
const HANDOFF_FILES_TO_RESET = [
    ['design', 'KG', 'IntentToImplementationHandoff.json'],
    ['design', 'KG', 'ImplementationToCodingHandoff.json'],
] as const;
const BOOTSTRAP_VALIDATION_SCRIPTS: Record<string, string> = {
    'validate:system-architecture': 'node .github/validator/script/validateSystemArchitecture.js',
    'validate:handoff': 'node .github/validator/script/validateStageHandoff.js',
    'validate:handoff:intent': 'node .github/validator/script/validateStageHandoff.js intent-to-implementation',
    'validate:handoff:implementation': 'node .github/validator/script/validateStageHandoff.js implementation-to-coding',
};
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
        await resetWorkspaceStageHandoffs(folder);
        await ensureWorkspaceBundledGitHubContents(folder, extensionUri);
        await ensureWorkspaceSystemArchitectureSchema(folder, extensionUri);
        await ensureWorkspacePackageJson(folder);
        return;
    }

    const templateUri = vscode.Uri.joinPath(extensionUri, ...EA_TEMPLATE_PATH);
    try {
        const templateBytes = await vscode.workspace.fs.readFile(templateUri);
        await vscode.workspace.fs.writeFile(targetUri, templateBytes);
        await resetWorkspaceStageHandoffs(folder);
        await ensureWorkspaceBundledGitHubContents(folder, extensionUri);
        await ensureWorkspaceSystemArchitectureSchema(folder, extensionUri);
        await ensureWorkspacePackageJson(folder);
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

async function ensureWorkspaceBundledGitHubContents(
    folder: vscode.WorkspaceFolder,
    extensionUri: vscode.Uri,
): Promise<void> {
    const sourceDir = vscode.Uri.joinPath(extensionUri, ...BUNDLED_GITHUB_DIR_PATH);
    const targetDir = vscode.Uri.joinPath(folder.uri, '.github');

    try {
        await copyDirectoryContents(sourceDir, targetDir);
    } catch (error) {
        console.error('Argo failed to initialize bundled .github contents.', {
            sourceDir: sourceDir.toString(),
            targetDir: targetDir.toString(),
            error,
        });
        void vscode.window.showErrorMessage(
            `Argo 初始化工作区 .github 内容失败: ${String(error)}`,
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

async function copyDirectoryContents(sourceDir: vscode.Uri, targetDir: vscode.Uri): Promise<void> {
    await vscode.workspace.fs.createDirectory(targetDir);

    const entries = await vscode.workspace.fs.readDirectory(sourceDir);
    for (const [name, fileType] of entries) {
        const sourceEntry = vscode.Uri.joinPath(sourceDir, name);
        const targetEntry = vscode.Uri.joinPath(targetDir, name);

        if ((fileType & vscode.FileType.Directory) !== 0) {
            await removeFileIfPresent(targetEntry);
            await copyDirectoryContents(sourceEntry, targetEntry);
            continue;
        }

        await removeDirectoryIfPresent(targetEntry);
        const bytes = await vscode.workspace.fs.readFile(sourceEntry);
        await vscode.workspace.fs.writeFile(targetEntry, bytes);
    }
}

async function removeDirectoryIfPresent(uri: vscode.Uri): Promise<void> {
    try {
        const stat = await vscode.workspace.fs.stat(uri);
        if ((stat.type & vscode.FileType.Directory) !== 0) {
            await vscode.workspace.fs.delete(uri, { recursive: true, useTrash: false });
        }
    } catch {
        // Target does not exist.
    }
}

async function removeFileIfPresent(uri: vscode.Uri): Promise<void> {
    try {
        const stat = await vscode.workspace.fs.stat(uri);
        if ((stat.type & vscode.FileType.Directory) === 0) {
            await vscode.workspace.fs.delete(uri, { recursive: false, useTrash: false });
        }
    } catch {
        // Target does not exist.
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

async function ensureWorkspacePackageJson(
    folder: vscode.WorkspaceFolder,
): Promise<void> {
    const packageJsonUri = vscode.Uri.joinPath(folder.uri, ...PACKAGE_JSON_TARGET_PATH);

    try {
        const packageJson = await readOrCreatePackageJson(packageJsonUri, folder.name);
        const existingScripts = typeof packageJson.scripts === 'object' && packageJson.scripts !== null
            ? packageJson.scripts as Record<string, unknown>
            : {};

        const mergedScripts = { ...existingScripts };
        const conflicts: string[] = [];

        for (const [scriptName, expectedCommand] of Object.entries(BOOTSTRAP_VALIDATION_SCRIPTS)) {
            const currentValue = mergedScripts[scriptName];
            if (currentValue === undefined) {
                mergedScripts[scriptName] = expectedCommand;
                continue;
            }

            if (currentValue !== expectedCommand) {
                conflicts.push(scriptName);
            }
        }

        packageJson.scripts = mergedScripts;
        await vscode.workspace.fs.writeFile(
            packageJsonUri,
            Buffer.from(JSON.stringify(packageJson, null, 2) + '\n', 'utf8'),
        );

        if (conflicts.length > 0) {
            const conflictList = conflicts.join(', ');
            console.warn('Argo detected package.json script conflicts during workspace bootstrap.', {
                workspace: folder.uri.fsPath,
                conflicts,
            });
            void vscode.window.showWarningMessage(
                `Argo 未覆盖现有 package.json scripts：${conflictList}`,
            );
        }
    } catch (error) {
        console.error('Argo failed to initialize workspace package.json.', {
            targetUri: packageJsonUri.toString(),
            error,
        });
        void vscode.window.showErrorMessage(
            `Argo 初始化工作区 package.json 失败: ${String(error)}`,
        );
    }
}

async function readOrCreatePackageJson(
    packageJsonUri: vscode.Uri,
    workspaceName: string,
): Promise<Record<string, unknown> & { scripts: Record<string, unknown> }> {
    if (!await fileExists(packageJsonUri)) {
        return {
            name: buildPackageName(workspaceName),
            private: true,
            scripts: {},
        };
    }

    const bytes = await vscode.workspace.fs.readFile(packageJsonUri);
    const parsed = JSON.parse(Buffer.from(bytes).toString('utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('package.json must contain a JSON object.');
    }

    return {
        ...(parsed as Record<string, unknown>),
        scripts: typeof (parsed as { scripts?: unknown }).scripts === 'object' && (parsed as { scripts?: unknown }).scripts !== null
            ? { ...((parsed as { scripts: Record<string, unknown> }).scripts) }
            : {},
    };
}

function buildPackageName(workspaceName: string): string {
    const sanitized = sanitizeFileName(workspaceName)
        .toLowerCase()
        .replace(/_/g, '-')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9.-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^[.-]+|[.-]+$/g, '');

    return sanitized || 'argo-workspace';
}

async function resetWorkspaceStageHandoffs(folder: vscode.WorkspaceFolder): Promise<void> {
    for (const handoffPath of HANDOFF_FILES_TO_RESET) {
        await removeFileIfPresent(vscode.Uri.joinPath(folder.uri, ...handoffPath));
    }
}
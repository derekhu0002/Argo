import * as vscode from 'vscode';

// ── Convention-over-Configuration paths ────────────────────────────
const DESIGN_DIR = 'design';
const INTENT_FILE = `${DESIGN_DIR}/architecture-intent.puml`;
const IMPL_FILE = `${DESIGN_DIR}/implementation-uml.puml`;

/** Resolve the workspace root (first folder). Throws if no workspace is open. */
function workspaceRoot(): vscode.Uri {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
        throw new Error('No workspace folder is open. Please open a folder first.');
    }
    return folders[0].uri;
}

/** Absolute URI of the intent architecture file. */
export function intentUri(): vscode.Uri {
    return vscode.Uri.joinPath(workspaceRoot(), INTENT_FILE);
}

/** Absolute URI of the implementation UML file. */
export function implUri(): vscode.Uri {
    return vscode.Uri.joinPath(workspaceRoot(), IMPL_FILE);
}

/**
 * Read `design/architecture-intent.puml` and return its text content.
 * Throws a user-friendly error when the file does not exist.
 */
export async function readIntentArchitecture(): Promise<string> {
    const uri = intentUri();
    try {
        const bytes = await vscode.workspace.fs.readFile(uri);
        return new TextDecoder('utf-8').decode(bytes);
    } catch {
        throw new Error(
            `找不到意图架构文件: ${INTENT_FILE}\n` +
            '请在工作区根目录创建 design/architecture-intent.puml 后重试。',
        );
    }
}

/**
 * Write PlantUML text to `design/implementation-uml.puml`.
 * Creates the `design/` directory if it doesn't exist.
 */
export async function writeImplementationUml(plantUml: string): Promise<vscode.Uri> {
    const root = workspaceRoot();
    // Ensure the design directory exists
    const designDir = vscode.Uri.joinPath(root, DESIGN_DIR);
    await vscode.workspace.fs.createDirectory(designDir);

    const uri = vscode.Uri.joinPath(root, IMPL_FILE);
    await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(plantUml));
    return uri;
}

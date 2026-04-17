import { execFile } from 'child_process';
import * as vscode from 'vscode';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const SOURCE_FILE_EXTENSIONS = new Set([
    '.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cs', '.go',
    '.rb', '.rs', '.kt', '.cpp', '.c', '.h', '.hpp',
]);

function workspaceRootFsPath(): string {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
        throw new Error('No workspace folder is open. Please open a folder first.');
    }
    return folders[0].uri.fsPath;
}

async function runGit(args: string[]): Promise<string> {
    const { stdout } = await execFileAsync('git', args, {
        cwd: workspaceRootFsPath(),
        windowsHide: true,
        maxBuffer: 1024 * 1024 * 10,
    });
    return stdout.trim();
}

export async function commitExists(commitId: string): Promise<boolean> {
    try {
        await runGit(['rev-parse', '--verify', `${commitId}^{commit}`]);
        return true;
    } catch {
        return false;
    }
}

export async function getHeadCommit(): Promise<string> {
    return runGit(['rev-parse', 'HEAD']);
}

export async function getChangedSourceUrisForCommit(commitId: string): Promise<vscode.Uri[]> {
    const output = await runGit(['diff-tree', '--no-commit-id', '--name-only', '-r', commitId]);
    if (!output) {
        return [];
    }

    const root = vscode.workspace.workspaceFolders?.[0]?.uri;
    if (!root) {
        throw new Error('No workspace folder is open. Please open a folder first.');
    }

    return output
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean)
        .filter(path => hasSourceExtension(path))
        .map(path => vscode.Uri.joinPath(root, ...path.split('/')));
}

function hasSourceExtension(path: string): boolean {
    const lowerPath = path.toLowerCase();
    for (const extension of SOURCE_FILE_EXTENSIONS) {
        if (lowerPath.endsWith(extension)) {
            return true;
        }
    }
    return false;
}
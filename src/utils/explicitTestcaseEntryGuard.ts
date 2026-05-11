import * as path from 'path';
import * as vscode from 'vscode';

type GuardStage = 'idle' | 'implementationdesign' | 'coding';

interface RawArchitectureGraph {
    elements?: RawArchitectureElement[];
}

interface RawArchitectureElement {
    testcases?: RawArchitectureTestcase[];
}

interface RawArchitectureTestcase {
    type?: unknown;
    acceptanceCriteria?: unknown;
}

interface ProtectedEntrySnapshot {
    workspaceRelativePath: string;
    uri: vscode.Uri;
    content: string | null;
}

const GUARD_STAGE_KEY = 'argo.explicitTestcaseEntryGuard.stage';
const GUARD_CONFIG_KEY = 'protectExplicitTestcaseEntriesDuringCoding';
const SYSTEM_ARCHITECTURE_PATH = 'design/KG/SystemArchitecture.json';

class ExplicitTestcaseEntryGuard implements vscode.Disposable {
    private readonly outputChannel = vscode.window.createOutputChannel('Argo Explicit Testcase Guard');
    private readonly statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 90);
    private readonly protectedEntries = new Map<string, ProtectedEntrySnapshot>();
    private readonly internalMutations = new Set<string>();
    private readonly disposables: vscode.Disposable[] = [];
    private stage: GuardStage = 'idle';

    constructor(private readonly context: vscode.ExtensionContext) {
        const persistedStage = context.workspaceState.get<GuardStage>(GUARD_STAGE_KEY);
        this.stage = persistedStage ?? 'idle';

        this.disposables.push(
            this.outputChannel,
            this.statusBarItem,
            vscode.workspace.onDidChangeConfiguration(event => {
                if (event.affectsConfiguration(`argo.${GUARD_CONFIG_KEY}`)) {
                    void this.handleConfigurationChange();
                }
            }),
            vscode.workspace.onDidChangeTextDocument(event => {
                void this.handleDocumentChange(event.document);
            }),
            vscode.workspace.onDidCreateFiles(event => {
                void this.handleCreatedFiles(event.files);
            }),
            vscode.workspace.onDidDeleteFiles(event => {
                void this.handleDeletedFiles(event.files);
            }),
        );

        this.statusBarItem.name = 'Argo Guard Stage';
        this.statusBarItem.command = {
            command: 'workbench.action.openSettings',
            title: 'Configure Argo Guard',
            arguments: ['argo.protectExplicitTestcaseEntriesDuringCoding'],
        };
        this.updateStatusBar();
        void this.refreshProtectedEntries();
    }

    dispose(): void {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.protectedEntries.clear();
        this.internalMutations.clear();
    }

    async setStage(stage: GuardStage): Promise<void> {
        this.stage = stage;
        await this.context.workspaceState.update(GUARD_STAGE_KEY, stage);
        await this.refreshProtectedEntries();
        this.updateStatusBar();
        this.log(this.buildStageStatusMessage(stage));
    }

    getStage(): GuardStage {
        return this.stage;
    }

    isEnabled(): boolean {
        return vscode.workspace.getConfiguration('argo').get<boolean>(GUARD_CONFIG_KEY, false);
    }

    private async refreshProtectedEntries(): Promise<void> {
        const root = vscode.workspace.workspaceFolders?.[0]?.uri;
        if (!root) {
            this.protectedEntries.clear();
            return;
        }

        const protectedPaths = await this.readProtectedEntryPaths(root);
        const nextEntries = new Map<string, ProtectedEntrySnapshot>();

        for (const workspaceRelativePath of protectedPaths) {
            const uri = vscode.Uri.joinPath(root, ...workspaceRelativePath.split('/'));
            const content = await this.readFileContent(uri);
            nextEntries.set(uri.fsPath.toLowerCase(), {
                workspaceRelativePath,
                uri,
                content,
            });
        }

        this.protectedEntries.clear();
        for (const [key, value] of nextEntries) {
            this.protectedEntries.set(key, value);
        }

        this.updateStatusBar();
    }

    private async readProtectedEntryPaths(root: vscode.Uri): Promise<string[]> {
        const graphUri = vscode.Uri.joinPath(root, ...SYSTEM_ARCHITECTURE_PATH.split('/'));
        try {
            const bytes = await vscode.workspace.fs.readFile(graphUri);
            const graph = JSON.parse(Buffer.from(bytes).toString('utf8')) as RawArchitectureGraph;
            const paths = new Set<string>();

            for (const element of graph.elements ?? []) {
                for (const testcase of element.testcases ?? []) {
                    const acceptanceCriteria = String(testcase.acceptanceCriteria ?? '').trim();
                    if (!acceptanceCriteria) {
                        continue;
                    }

                    const scriptPath = normalizeRelativePath(acceptanceCriteria.split('::')[0] ?? '');
                    if (scriptPath) {
                        paths.add(scriptPath);
                    }
                }
            }

            return Array.from(paths);
        } catch (error) {
            this.log(`Failed to refresh protected testcase entries from ${SYSTEM_ARCHITECTURE_PATH}: ${String(error)}`);
            return [];
        }
    }

    private async readFileContent(uri: vscode.Uri): Promise<string | null> {
        try {
            const bytes = await vscode.workspace.fs.readFile(uri);
            return Buffer.from(bytes).toString('utf8');
        } catch {
            return null;
        }
    }

    private async handleDocumentChange(document: vscode.TextDocument): Promise<void> {
        if (this.stage !== 'coding' || !this.isEnabled() || document.isUntitled) {
            return;
        }

        const key = document.uri.fsPath.toLowerCase();
        if (this.internalMutations.has(key)) {
            return;
        }

        const snapshot = this.protectedEntries.get(key);
        if (!snapshot) {
            return;
        }

        const currentText = document.getText();
        const expectedText = snapshot.content ?? '';
        if (currentText === expectedText) {
            return;
        }

        await this.restoreDocumentSnapshot(document, snapshot, 'coding stage forbids editing explicit testcase entry files');
    }

    private async handleCreatedFiles(files: readonly vscode.Uri[]): Promise<void> {
        if (this.stage !== 'coding' || !this.isEnabled()) {
            return;
        }

        for (const file of files) {
            const snapshot = this.protectedEntries.get(file.fsPath.toLowerCase());
            if (!snapshot || snapshot.content !== null) {
                continue;
            }

            await this.deleteProtectedFile(file, snapshot, 'coding stage cannot create a missing explicit testcase entry file');
        }
    }

    private async handleDeletedFiles(files: readonly vscode.Uri[]): Promise<void> {
        if (this.stage !== 'coding' || !this.isEnabled()) {
            return;
        }

        for (const file of files) {
            const snapshot = this.protectedEntries.get(file.fsPath.toLowerCase());
            if (!snapshot || snapshot.content === null) {
                continue;
            }

            await this.recreateDeletedProtectedFile(snapshot, 'coding stage cannot delete an explicit testcase entry file');
        }
    }

    private async restoreDocumentSnapshot(
        document: vscode.TextDocument,
        snapshot: ProtectedEntrySnapshot,
        reason: string,
    ): Promise<void> {
        const key = document.uri.fsPath.toLowerCase();
        this.internalMutations.add(key);

        try {
            const edit = new vscode.WorkspaceEdit();
            const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
            edit.replace(document.uri, fullRange, snapshot.content ?? '');
            await vscode.workspace.applyEdit(edit);
            await document.save();
            this.reject(document.uri, snapshot.workspaceRelativePath, reason);
        } finally {
            this.internalMutations.delete(key);
        }
    }

    private async deleteProtectedFile(
        file: vscode.Uri,
        snapshot: ProtectedEntrySnapshot,
        reason: string,
    ): Promise<void> {
        const key = file.fsPath.toLowerCase();
        this.internalMutations.add(key);

        try {
            await vscode.workspace.fs.delete(file, { useTrash: false });
            this.reject(file, snapshot.workspaceRelativePath, reason);
        } catch (error) {
            this.log(`Failed to delete unauthorized protected file creation ${file.fsPath}: ${String(error)}`);
        } finally {
            this.internalMutations.delete(key);
        }
    }

    private async recreateDeletedProtectedFile(
        snapshot: ProtectedEntrySnapshot,
        reason: string,
    ): Promise<void> {
        const key = snapshot.uri.fsPath.toLowerCase();
        this.internalMutations.add(key);

        try {
            const parent = vscode.Uri.joinPath(snapshot.uri, '..');
            await vscode.workspace.fs.createDirectory(parent);
            await vscode.workspace.fs.writeFile(snapshot.uri, Buffer.from(snapshot.content ?? '', 'utf8'));
            this.reject(snapshot.uri, snapshot.workspaceRelativePath, reason);
        } catch (error) {
            this.log(`Failed to recreate deleted protected file ${snapshot.uri.fsPath}: ${String(error)}`);
        } finally {
            this.internalMutations.delete(key);
        }
    }

    private reject(uri: vscode.Uri, workspaceRelativePath: string, reason: string): void {
        const message = [
            'Argo blocked a protected explicit testcase entry change.',
            `File: ${workspaceRelativePath}`,
            `Reason: ${reason}`,
            'Action required: return to product implementation or switch back to /implementationdesign before changing testcase entry files.',
        ].join(' ');

        this.outputChannel.appendLine(`[REJECTED] ${uri.fsPath} | ${reason}`);
        void vscode.window.showErrorMessage(message);
    }

    private log(message: string): void {
        this.outputChannel.appendLine(message);
    }

    private async handleConfigurationChange(): Promise<void> {
        await this.refreshProtectedEntries();
        this.updateStatusBar();
        this.log(this.buildStageStatusMessage(this.stage));
    }

    private updateStatusBar(): void {
        const protectedCount = this.protectedEntries.size;
        const enabled = this.isEnabled();
        const protectionActive = this.stage === 'coding' && enabled;

        this.statusBarItem.text = protectionActive
            ? `$(shield) Argo: ${this.stage}`
            : enabled
                ? `$(shield) Argo: ${this.stage}`
                : `$(shield) Argo: ${this.stage} (off)`;

        this.statusBarItem.backgroundColor = protectionActive
            ? new vscode.ThemeColor('statusBarItem.warningBackground')
            : undefined;
        this.statusBarItem.color = protectionActive
            ? new vscode.ThemeColor('statusBarItem.warningForeground')
            : undefined;
        this.statusBarItem.tooltip = [
            `Argo guard stage: ${this.stage}`,
            `Protection switch: ${enabled ? 'enabled' : 'disabled'}`,
            `Protected explicit testcase entry files: ${protectedCount}`,
            protectionActive
                ? 'Coding-stage protection is active. Edits to explicit testcase entry files will be rolled back.'
                : 'Click to open the protection setting.',
        ].join('\n');
        this.statusBarItem.show();
    }

    private buildStageStatusMessage(stage: GuardStage): string {
        if (stage !== 'coding') {
            return `Guard switched to ${stage}; explicit testcase entry files are not write-protected by the coding-stage hook.`;
        }

        return this.isEnabled()
            ? 'Guard armed for explicit testcase entry files during coding stage because argo.protectExplicitTestcaseEntriesDuringCoding is enabled.'
            : 'Guard is in coding stage but inactive because argo.protectExplicitTestcaseEntriesDuringCoding is disabled.';
    }
}

let guardInstance: ExplicitTestcaseEntryGuard | undefined;

export function registerExplicitTestcaseEntryGuard(context: vscode.ExtensionContext): void {
    if (guardInstance) {
        return;
    }

    guardInstance = new ExplicitTestcaseEntryGuard(context);
    context.subscriptions.push(guardInstance);
}

export async function setExplicitTestcaseEntryGuardStage(stage: GuardStage): Promise<void> {
    if (!guardInstance) {
        return;
    }
    await guardInstance.setStage(stage);
}

export function getExplicitTestcaseEntryGuardStage(): GuardStage {
    return guardInstance?.getStage() ?? 'idle';
}

export function isExplicitTestcaseEntryGuardEnabled(): boolean {
    return guardInstance?.isEnabled()
        ?? vscode.workspace.getConfiguration('argo').get<boolean>(GUARD_CONFIG_KEY, false);
}

function normalizeRelativePath(value: string): string {
    return value.replace(/\\/g, '/').replace(/^\.\//, '').trim();
}

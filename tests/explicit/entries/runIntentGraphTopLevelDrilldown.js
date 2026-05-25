const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { runTests } = require('@vscode/test-electron');

function isWindowsUpdateMutexFailure(error) {
    const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
    return message.includes('Code is currently being updated');
}

async function cleanupTempRoot(tempRoot) {
    try {
        await fs.rm(tempRoot, { recursive: true, force: true });
    } catch (error) {
        const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
        if (!message.includes('EBUSY')) {
            throw error;
        }
        console.warn(`Skipping temp cleanup because files are still locked: ${tempRoot}`);
    }
}

async function main() {
    const repoRoot = path.resolve(__dirname, '..', '..', '..');
    const compiledExtension = path.join(repoRoot, 'out', 'extension.js');
    const suitePath = path.join(__dirname, '..', 'suite', 'intentGraphTopLevelDrilldownExtensionHost.js');

    try {
        await fs.stat(compiledExtension);
    } catch {
        throw new Error('Missing compiled extension output at out/extension.js. Run "npm run compile" first.');
    }

    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'argo-intent-graph-top-level-'));
    const workspacePath = path.join(tempRoot, 'IntentGraphTopLevelWorkspace');
    const userDataDir = path.join(tempRoot, 'user-data');
    const extensionsDir = path.join(tempRoot, 'extensions');
    const vscodeTestCacheDir = path.join(tempRoot, 'vscode-test-cache');

    await fs.mkdir(workspacePath, { recursive: true });
    await fs.mkdir(userDataDir, { recursive: true });
    await fs.mkdir(extensionsDir, { recursive: true });
    await fs.mkdir(vscodeTestCacheDir, { recursive: true });

    try {
        try {
            await runTests({
                cachePath: vscodeTestCacheDir,
                extensionDevelopmentPath: repoRoot,
                extensionTestsPath: suitePath,
                launchArgs: [
                    workspacePath,
                    '--disable-extensions',
                    '--user-data-dir', userDataDir,
                    '--extensions-dir', extensionsDir,
                ],
            });
        } catch (error) {
            if (process.platform === 'win32' && isWindowsUpdateMutexFailure(error)) {
                console.warn('Skipping intent-graph top-level drilldown testcase because the local VS Code runtime is locked by an in-progress Windows update.');
                return;
            }

            throw error;
        }
    } finally {
        await cleanupTempRoot(tempRoot);
    }
}

main().catch(error => {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exit(1);
});

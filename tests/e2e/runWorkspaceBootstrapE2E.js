const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const { runTests } = require('@vscode/test-electron');

async function main() {
    const repoRoot = path.resolve(__dirname, '..', '..');
    const compiledExtension = path.join(repoRoot, 'out', 'extension.js');
    const suitePath = path.join(__dirname, 'suite', 'workspaceBootstrapExtensionHost.js');

    try {
        await fs.stat(compiledExtension);
    } catch {
        throw new Error('Missing compiled extension output at out/extension.js. Run "npm run compile" first.');
    }

    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'argo-bootstrap-e2e-'));
    const workspaceName = 'ArgoBootstrapE2EWorkspace';
    const workspacePath = path.join(tempRoot, workspaceName);
    const userDataDir = path.join(tempRoot, 'user-data');
    const extensionsDir = path.join(tempRoot, 'extensions');

    await fs.mkdir(workspacePath, { recursive: true });
    await fs.mkdir(userDataDir, { recursive: true });
    await fs.mkdir(extensionsDir, { recursive: true });
    await fs.writeFile(path.join(workspacePath, 'README.txt'), 'Temporary workspace for Argo bootstrap E2E test.\n', 'utf8');

    try {
        await runTests({
            extensionDevelopmentPath: repoRoot,
            extensionTestsPath: suitePath,
            launchArgs: [
                workspacePath,
                '--disable-extensions',
                '--user-data-dir', userDataDir,
                '--extensions-dir', extensionsDir,
            ],
        });
    } finally {
        await fs.rm(tempRoot, { recursive: true, force: true });
    }
}

main().catch(error => {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exit(1);
});
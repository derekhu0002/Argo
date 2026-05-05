const assert = require('assert');
const fs = require('fs/promises');
const path = require('path');
const vscode = require('vscode');

const EXTENSION_ID = 'argo-team.argo-architect';
const EXPECTED_FILE_TIMEOUT_MS = 20000;
const POLL_INTERVAL_MS = 200;

async function waitForFile(filePath, timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        try {
            await fs.stat(filePath);
            return;
        } catch {
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
        }
    }

    throw new Error(`Timed out waiting for generated EA template file: ${filePath}`);
}

async function run() {
    const folder = vscode.workspace.workspaceFolders?.[0];
    assert(folder, 'Expected the E2E test to open a workspace folder.');

    const extension = vscode.extensions.getExtension(EXTENSION_ID);
    assert(extension, `Expected extension ${EXTENSION_ID} to be available in the extension host.`);

    if (!extension.isActive) {
        await extension.activate();
    }

    assert(extension.isActive, `Expected extension ${EXTENSION_ID} to activate successfully.`);

    const generatedFilePath = path.join(folder.uri.fsPath, `${folder.name}.feap`);
    const templateFilePath = path.join(extension.extensionPath, 'eatool', 'EA-model-template.feap');
    const generatedSchemaPath = path.join(folder.uri.fsPath, '.github', 'argoschema', 'SystemArchitecture.schema.json');
    const bundledSchemaPath = path.join(extension.extensionPath, 'schema', 'SystemArchitecture.schema.json');

    await Promise.all([
        waitForFile(generatedFilePath, EXPECTED_FILE_TIMEOUT_MS),
        waitForFile(generatedSchemaPath, EXPECTED_FILE_TIMEOUT_MS),
    ]);

    const [generatedBytes, templateBytes, generatedSchemaBytes, bundledSchemaBytes] = await Promise.all([
        fs.readFile(generatedFilePath),
        fs.readFile(templateFilePath),
        fs.readFile(generatedSchemaPath),
        fs.readFile(bundledSchemaPath),
    ]);

    assert(generatedBytes.equals(templateBytes), 'Expected generated .feap file to match the bundled EA template exactly.');
    assert(generatedSchemaBytes.equals(bundledSchemaBytes), 'Expected generated SystemArchitecture schema to match the bundled schema exactly.');
}

module.exports = { run };
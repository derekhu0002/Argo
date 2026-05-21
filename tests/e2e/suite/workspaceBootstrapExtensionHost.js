const assert = require('assert');
const fs = require('fs/promises');
const path = require('path');
const vscode = require('vscode');

const EXTENSION_ID = 'argo-team.argo-architect';

async function fileExists(filePath) {
    try {
        await fs.stat(filePath);
        return true;
    } catch {
        return false;
    }
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
    const generatedSchemaPath = path.join(folder.uri.fsPath, '.github', 'argoschema', 'SystemArchitecture.schema.json');
    const generatedInstructionsPath = path.join(folder.uri.fsPath, '.github', 'copilot-instructions.md');
    const generatedAgentPath = path.join(folder.uri.fsPath, '.github', 'agents', 'implementation-architecture-designer.agent.md');

    const [
        generatedFileExists,
        generatedSchemaExists,
        generatedInstructionsExists,
        generatedAgentExists,
    ] = await Promise.all([
        fileExists(generatedFilePath),
        fileExists(generatedSchemaPath),
        fileExists(generatedInstructionsPath),
        fileExists(generatedAgentPath),
    ]);

    assert.strictEqual(generatedFileExists, false, 'Expected extension activation to not generate a .feap file automatically.');
    assert.strictEqual(generatedSchemaExists, false, 'Expected extension activation to not generate the SystemArchitecture schema automatically.');
    assert.strictEqual(generatedInstructionsExists, false, 'Expected extension activation to not copy bundled .github instructions automatically.');
    assert.strictEqual(generatedAgentExists, false, 'Expected extension activation to not copy bundled agent files automatically.');
}

module.exports = { run };
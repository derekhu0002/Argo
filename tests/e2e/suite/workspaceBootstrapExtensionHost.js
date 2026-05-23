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
    const generatedValidatorPath = path.join(folder.uri.fsPath, '.github', 'validator', 'script', 'validateStageHandoff.js');
    const generatedIntentHandoffPath = path.join(folder.uri.fsPath, 'design', 'KG', 'IntentToImplementationHandoff.json');
    const generatedImplementationHandoffPath = path.join(folder.uri.fsPath, 'design', 'KG', 'ImplementationToCodingHandoff.json');

    await fs.mkdir(path.dirname(generatedIntentHandoffPath), { recursive: true });
    await fs.writeFile(generatedIntentHandoffPath, '{"stale":true}\n', 'utf8');
    await fs.writeFile(generatedImplementationHandoffPath, '{"stale":true}\n', 'utf8');

    const [
        generatedFileExists,
        generatedSchemaExists,
        generatedInstructionsExists,
        generatedValidatorExists,
        generatedIntentHandoffExists,
        generatedImplementationHandoffExists,
    ] = await Promise.all([
        fileExists(generatedFilePath),
        fileExists(generatedSchemaPath),
        fileExists(generatedInstructionsPath),
        fileExists(generatedValidatorPath),
        fileExists(generatedIntentHandoffPath),
        fileExists(generatedImplementationHandoffPath),
    ]);

    assert.strictEqual(generatedFileExists, false, 'Expected extension activation to not generate a .feap file automatically.');
    assert.strictEqual(generatedSchemaExists, false, 'Expected extension activation to not generate the SystemArchitecture schema automatically.');
    assert.strictEqual(generatedInstructionsExists, false, 'Expected extension activation to not copy bundled .github instructions automatically.');
    assert.strictEqual(generatedValidatorExists, false, 'Expected extension activation to not copy bundled validator files automatically.');
    assert.strictEqual(generatedIntentHandoffExists, true, 'Expected the test fixture to create the stale intent handoff file before manual bootstrap.');
    assert.strictEqual(generatedImplementationHandoffExists, true, 'Expected the test fixture to create the stale implementation handoff file before manual bootstrap.');

    const bootstrapModulePath = path.join(extension.extensionPath, 'out', 'utils', 'workspaceBootstrap.js');
    const { ensureWorkspaceEaTemplates } = require(bootstrapModulePath);
    await ensureWorkspaceEaTemplates(extension.extensionUri);

    const [
        bootstrappedFileExists,
        bootstrappedSchemaExists,
        bootstrappedInstructionsExists,
        bootstrappedValidatorExists,
        bootstrappedIntentHandoffExists,
        bootstrappedImplementationHandoffExists,
    ] = await Promise.all([
        fileExists(generatedFilePath),
        fileExists(generatedSchemaPath),
        fileExists(generatedInstructionsPath),
        fileExists(generatedValidatorPath),
        fileExists(generatedIntentHandoffPath),
        fileExists(generatedImplementationHandoffPath),
    ]);

    assert.strictEqual(bootstrappedFileExists, true, 'Expected manual workspace bootstrap to generate a .feap file.');
    assert.strictEqual(bootstrappedSchemaExists, true, 'Expected manual workspace bootstrap to copy the SystemArchitecture schema.');
    assert.strictEqual(bootstrappedInstructionsExists, true, 'Expected manual workspace bootstrap to copy bundled .github instructions.');
    assert.strictEqual(bootstrappedValidatorExists, true, 'Expected manual workspace bootstrap to copy bundled validator files.');
    assert.strictEqual(bootstrappedIntentHandoffExists, false, 'Expected manual workspace bootstrap to clear the stale intent handoff file.');
    assert.strictEqual(bootstrappedImplementationHandoffExists, false, 'Expected manual workspace bootstrap to clear the stale implementation handoff file.');
}

module.exports = { run };
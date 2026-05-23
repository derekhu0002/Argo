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
    assert(folder, 'Expected the explicit testcase to open a workspace folder.');

    const extension = vscode.extensions.getExtension(EXTENSION_ID);
    assert(extension, `Expected extension ${EXTENSION_ID} to be available in the extension host.`);

    if (!extension.isActive) {
        await extension.activate();
    }

    const commandModulePath = path.join(extension.extensionPath, 'out', 'commands', 'argoInit.js');
    const { handleArgoInit } = require(commandModulePath);

    const generatedValidatorPath = path.join(folder.uri.fsPath, '.github', 'validator', 'script', 'validateStageHandoff.js');
    const generatedSchemaPath = path.join(folder.uri.fsPath, '.github', 'argoschema', 'SystemArchitecture.schema.json');
    const generatedPackageJsonPath = path.join(folder.uri.fsPath, 'package.json');

    const streamOutput = [];
    const stream = {
        markdown(value) {
            streamOutput.push(String(value));
        },
    };
    const cancellationTokenSource = new vscode.CancellationTokenSource();

    await handleArgoInit(
        { command: 'argo-init', prompt: '' },
        {},
        stream,
        cancellationTokenSource.token,
    );

    assert(await fileExists(generatedValidatorPath), 'Expected /argo-init to copy the bundled validator script.');
    assert(await fileExists(generatedSchemaPath), 'Expected /argo-init to copy the bundled schema assets.');
    assert(await fileExists(generatedPackageJsonPath), 'Expected /argo-init to create package.json when it is absent.');

    const packageJson = JSON.parse(await fs.readFile(generatedPackageJsonPath, 'utf8'));
    assert.strictEqual(packageJson.scripts['validate:handoff'], 'node .github/validator/script/validateStageHandoff.js');
    assert.strictEqual(packageJson.scripts['validate:handoff:intent'], 'node .github/validator/script/validateStageHandoff.js intent-to-implementation');
    assert.strictEqual(packageJson.scripts['validate:handoff:implementation'], 'node .github/validator/script/validateStageHandoff.js implementation-to-coding');

    assert(streamOutput.some(chunk => chunk.includes('/argo-init')), 'Expected the command stream to report the /argo-init bootstrap execution.');
}

module.exports = { run };
const assert = require('assert');
const fs = require('fs');
const path = require('path');

function readText(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

function main() {
    const repoRoot = path.resolve(__dirname, '..', '..');
    const explicitContractPath = path.join(repoRoot, 'tests', 'explicit', 'ARCHITECTURE.md');
    const commandContractPath = path.join(repoRoot, 'src', 'commands', 'ARCHITECTURE.md');
    const entryPath = path.join(repoRoot, 'tests', 'explicit', 'entries', 'runArgoInitValidatorBootstrap.js');
    const suitePath = path.join(repoRoot, 'tests', 'explicit', 'suite', 'argoInitValidatorBootstrapExtensionHost.js');

    assert(fs.existsSync(explicitContractPath), 'Expected tests/explicit/ARCHITECTURE.md to exist.');
    assert(fs.existsSync(commandContractPath), 'Expected src/commands/ARCHITECTURE.md to exist.');
    assert(fs.existsSync(entryPath), 'Expected explicit entry runArgoInitValidatorBootstrap.js to exist.');
    assert(fs.existsSync(suitePath), 'Expected explicit suite argoInitValidatorBootstrapExtensionHost.js to exist.');

    const explicitContract = readText(explicitContractPath);
    const commandContract = readText(commandContractPath);
    const entryText = readText(entryPath);

    assert(explicitContract.includes('entries/runArgoInitValidatorBootstrap.js'), 'Explicit contract must declare the /argo-init validator bootstrap entry path.');
    assert(explicitContract.includes('ARGO-INIT-VALIDATOR-BOOTSTRAP-CONTRACT'), 'Explicit contract must name the /argo-init validator bootstrap testcase.');
    assert(commandContract.includes('physical_test_entry: ../../tests/explicit/entries/runArgoInitValidatorBootstrap.js'), 'Command contract must link /argo-init to the explicit testcase entry.');
    assert(entryText.includes('argoInitValidatorBootstrapExtensionHost.js'), 'Explicit entry must point to the extension-host suite.');
}

try {
    main();
    console.log('argo-init-explicit-entry-correctness: passed');
} catch (error) {
    console.error(error instanceof Error ? error.stack || error.message : String(error));
    process.exit(1);
}
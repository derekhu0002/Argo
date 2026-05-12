const assert = require('assert');
const fs = require('fs');
const path = require('path');

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readText(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

function main() {
    const repoRoot = path.resolve(__dirname, '..', '..');
    const fixturePath = path.join(__dirname, 'fixtures', 'commands-entry-boundary.expected.json');
    const fixture = readJson(fixturePath);
    const commandsDir = path.join(repoRoot, fixture.commandsDirectory);
    const contractPath = path.join(repoRoot, 'src', 'commands', 'ARCHITECTURE.md');
    const rootContractPath = path.join(repoRoot, 'OVERALL_ARCHITECTURE.md');

    assert(fs.existsSync(rootContractPath), 'Expected OVERALL_ARCHITECTURE.md to exist.');
    assert(fs.existsSync(contractPath), 'Expected src/commands/ARCHITECTURE.md to exist.');
    assert(fs.existsSync(commandsDir), 'Expected src/commands directory to exist.');

    const actualFiles = new Set(fs.readdirSync(commandsDir));
    for (const requiredFile of fixture.requiredFiles) {
        assert(actualFiles.has(requiredFile), `Missing command entry file: ${requiredFile}`);
    }

    const contractText = readText(contractPath);
    for (const requiredFile of fixture.requiredFiles) {
        assert(
            contractText.includes(`- path: ${requiredFile}`),
            `Command contract is missing child declaration for ${requiredFile}`,
        );
    }

    for (const requiredFile of fixture.requiredFiles) {
        const filePath = path.join(commandsDir, requiredFile);
        const fileText = readText(filePath);
        for (const forbiddenImport of fixture.forbiddenImports) {
            assert(
                !fileText.includes(`from '${forbiddenImport}'`) && !fileText.includes(`from \"${forbiddenImport}\"`),
                `${requiredFile} must not import ${forbiddenImport}`,
            );
        }
    }
}

try {
    main();
    console.log('commands-entry-boundary: passed');
} catch (error) {
    console.error(error instanceof Error ? error.stack || error.message : String(error));
    process.exit(1);
}
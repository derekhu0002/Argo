const assert = require('assert');
const fs = require('fs');
const path = require('path');

function readText(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

function main() {
    const repoRoot = path.resolve(__dirname, '..', '..');
    const bootstrapPath = path.join(repoRoot, 'src', 'utils', 'workspaceBootstrap.ts');
    const contractPath = path.join(repoRoot, 'src', 'utils', 'ARCHITECTURE.md');
    const fileText = readText(bootstrapPath);
    const contractText = readText(contractPath);

    assert(fs.existsSync(bootstrapPath), 'Expected src/utils/workspaceBootstrap.ts to exist.');
    assert(fs.existsSync(contractPath), 'Expected src/utils/ARCHITECTURE.md to exist.');

    const forbiddenImports = [
        "../commands",
        "../engine",
        "../lm",
    ];

    for (const forbiddenImport of forbiddenImports) {
        assert(
            !fileText.includes(`from '${forbiddenImport}'`) && !fileText.includes(`from \"${forbiddenImport}\"`),
            `workspaceBootstrap.ts must not import ${forbiddenImport}`,
        );
    }

    assert(contractText.includes('package.json seeding behavior is contract-required but not yet implemented'), 'Utils contract must document the current package.json seeding gap.');
}

try {
    main();
    console.log('workspace-bootstrap-dependency-direction: passed');
} catch (error) {
    console.error(error instanceof Error ? error.stack || error.message : String(error));
    process.exit(1);
}
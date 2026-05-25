const assert = require('assert');
const fs = require('fs');
const path = require('path');

function readText(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

function assertNoImports(fileText, forbiddenImports, fileLabel) {
    for (const forbiddenImport of forbiddenImports) {
        assert(
            !fileText.includes(`from '${forbiddenImport}'`) && !fileText.includes(`from \"${forbiddenImport}\"`),
            `${fileLabel} must not import ${forbiddenImport}`,
        );
    }
}

function main() {
    const repoRoot = path.resolve(__dirname, '..', '..');
    const commandPath = path.join(repoRoot, 'src', 'commands', 'intentGraphExplorer.ts');
    const explorerIndexPath = path.join(repoRoot, 'src', 'visualIntentGraphEditor', 'index.ts');
    const explorerOpenPath = path.join(repoRoot, 'src', 'visualIntentGraphEditor', 'openIntentGraphExplorer.ts');

    const commandText = readText(commandPath);
    const explorerIndexText = readText(explorerIndexPath);
    const explorerOpenText = readText(explorerOpenPath);

    assert(commandText.includes("from '../visualIntentGraphEditor'"), 'intentGraphExplorer.ts must delegate to the visualIntentGraphEditor module.');
    assertNoImports(commandText, ['../engine', '../lm'], 'intentGraphExplorer.ts');
    assertNoImports(explorerIndexText, ['../commands', '../engine', '../lm'], 'visualIntentGraphEditor/index.ts');
    assertNoImports(explorerOpenText, ['../commands', '../engine', '../lm'], 'visualIntentGraphEditor/openIntentGraphExplorer.ts');
}

try {
    main();
    console.log('visual-intent-graph-dependency-direction: passed');
} catch (error) {
    console.error(error instanceof Error ? error.stack || error.message : String(error));
    process.exit(1);
}

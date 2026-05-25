const assert = require('assert');
const fs = require('fs');
const path = require('path');

function readText(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

function main() {
    const repoRoot = path.resolve(__dirname, '..', '..');
    const explorerDir = path.join(repoRoot, 'src', 'visualIntentGraphEditor');
    const contractPath = path.join(explorerDir, 'ARCHITECTURE.md');
    const expectedFiles = ['ARCHITECTURE.md', 'index.ts', 'openIntentGraphExplorer.ts'];

    assert(fs.existsSync(explorerDir), 'Expected src/visualIntentGraphEditor to exist.');
    for (const expectedFile of expectedFiles) {
        assert(fs.existsSync(path.join(explorerDir, expectedFile)), `Expected src/visualIntentGraphEditor/${expectedFile} to exist.`);
    }

    const contractText = readText(contractPath);
    assert(contractText.includes('- path: index.ts'), 'Explorer contract must declare index.ts as a child.');
    assert(contractText.includes('- path: openIntentGraphExplorer.ts'), 'Explorer contract must declare openIntentGraphExplorer.ts as a child.');
    assert(contractText.includes('root_view_resolution: choose the unique view with no parent_element_id'), 'Explorer contract must freeze the generic structural root discovery rule.');
}

try {
    main();
    console.log('visual-intent-graph-boundary: passed');
} catch (error) {
    console.error(error instanceof Error ? error.stack || error.message : String(error));
    process.exit(1);
}

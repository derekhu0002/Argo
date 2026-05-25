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
    const packageJsonPath = path.join(repoRoot, 'package.json');
    const rootContractPath = path.join(repoRoot, 'OVERALL_ARCHITECTURE.md');
    const srcContractPath = path.join(repoRoot, 'src', 'ARCHITECTURE.md');
    const explorerContractPath = path.join(repoRoot, 'src', 'visualIntentGraphEditor', 'ARCHITECTURE.md');
    const explicitContractPath = path.join(repoRoot, 'tests', 'explicit', 'ARCHITECTURE.md');
    const architectureContractPath = path.join(repoRoot, 'tests', 'architecture', 'ARCHITECTURE.md');

    const packageJson = readJson(packageJsonPath);
    const rootContract = readText(rootContractPath);
    const srcContract = readText(srcContractPath);
    const explorerContract = readText(explorerContractPath);
    const explicitContract = readText(explicitContractPath);
    const architectureContract = readText(architectureContractPath);

    assert.strictEqual(packageJson.scripts['test:architecture:visual-intent-graph-boundary'], 'node tests/architecture/visual-intent-graph-boundary.test.js');
    assert.strictEqual(packageJson.scripts['test:architecture:visual-intent-graph-dependency-direction'], 'node tests/architecture/visual-intent-graph-dependency-direction.test.js');
    assert.strictEqual(packageJson.scripts['test:architecture:intent-graph-explicit-entry-correctness'], 'node tests/architecture/intent-graph-explicit-entry-correctness.test.js');
    assert.strictEqual(packageJson.scripts['test:architecture:visual-intent-graph-contract-traceability'], 'node tests/architecture/visual-intent-graph-contract-traceability.test.js');
    assert.strictEqual(packageJson.scripts['test:explicit:intent-graph-top-level-drilldown'], 'node tests/explicit/entries/runIntentGraphTopLevelDrilldown.js');
    assert.strictEqual(packageJson.scripts['test:explicit:intent-graph-search-expansion'], 'node tests/explicit/entries/runIntentGraphSearchExpansion.js');
    assert(rootContract.includes('Commands -> Visual Explorer'), 'Root contract must freeze the Commands -> Visual Explorer dependency direction.');
    assert(srcContract.includes('- path: visualIntentGraphEditor/'), 'src contract must declare visualIntentGraphEditor/ as a stable child.');
    assert(explorerContract.includes('command_id: argo.openIntentGraphExplorer'), 'Explorer contract must freeze the command id boundary.');
    assert(explorerContract.includes('root_view_resolution: choose the unique view with no parent_element_id'), 'Explorer contract must describe the structural root resolution rule.');
    assert(explicitContract.includes('runIntentGraphTopLevelDrilldown.js'), 'Explicit contract must mention the top-level drilldown entry.');
    assert(explicitContract.includes('runIntentGraphSearchExpansion.js'), 'Explicit contract must mention the search expansion entry.');
    assert(architectureContract.includes('visual-intent-graph-contract-traceability.test.js'), 'Architecture guard contract must include the explorer traceability test.');
}

try {
    main();
    console.log('visual-intent-graph-contract-traceability: passed');
} catch (error) {
    console.error(error instanceof Error ? error.stack || error.message : String(error));
    process.exit(1);
}

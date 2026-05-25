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
    const topLevelEntryPath = path.join(repoRoot, 'tests', 'explicit', 'entries', 'runIntentGraphTopLevelDrilldown.js');
    const searchEntryPath = path.join(repoRoot, 'tests', 'explicit', 'entries', 'runIntentGraphSearchExpansion.js');
    const topLevelSuitePath = path.join(repoRoot, 'tests', 'explicit', 'suite', 'intentGraphTopLevelDrilldownExtensionHost.js');
    const searchSuitePath = path.join(repoRoot, 'tests', 'explicit', 'suite', 'intentGraphSearchExpansionExtensionHost.js');

    assert(fs.existsSync(explicitContractPath), 'Expected tests/explicit/ARCHITECTURE.md to exist.');
    assert(fs.existsSync(commandContractPath), 'Expected src/commands/ARCHITECTURE.md to exist.');
    assert(fs.existsSync(topLevelEntryPath), 'Expected explicit entry runIntentGraphTopLevelDrilldown.js to exist.');
    assert(fs.existsSync(searchEntryPath), 'Expected explicit entry runIntentGraphSearchExpansion.js to exist.');
    assert(fs.existsSync(topLevelSuitePath), 'Expected explicit suite intentGraphTopLevelDrilldownExtensionHost.js to exist.');
    assert(fs.existsSync(searchSuitePath), 'Expected explicit suite intentGraphSearchExpansionExtensionHost.js to exist.');

    const explicitContract = readText(explicitContractPath);
    const commandContract = readText(commandContractPath);
    const topLevelEntryText = readText(topLevelEntryPath);
    const searchEntryText = readText(searchEntryPath);

    assert(explicitContract.includes('entries/runIntentGraphTopLevelDrilldown.js'), 'Explicit contract must declare the top-level drilldown entry path.');
    assert(explicitContract.includes('entries/runIntentGraphSearchExpansion.js'), 'Explicit contract must declare the search expansion entry path.');
    assert(explicitContract.includes('INTENT-GRAPH-TOP-LEVEL-DRILLDOWN'), 'Explicit contract must name the top-level drilldown testcase.');
    assert(explicitContract.includes('INTENT-GRAPH-SEARCH-EXPANSION'), 'Explicit contract must name the search expansion testcase.');
    assert(commandContract.includes('physical_test_entry: ../../tests/explicit/entries/runIntentGraphTopLevelDrilldown.js'), 'Command contract must link the top-level drilldown explicit entry.');
    assert(commandContract.includes('physical_test_entry: ../../tests/explicit/entries/runIntentGraphSearchExpansion.js'), 'Command contract must link the search expansion explicit entry.');
    assert(topLevelEntryText.includes('intentGraphTopLevelDrilldownExtensionHost.js'), 'Top-level explicit entry must point to the extension-host suite.');
    assert(searchEntryText.includes('intentGraphSearchExpansionExtensionHost.js'), 'Search explicit entry must point to the extension-host suite.');
}

try {
    main();
    console.log('intent-graph-explicit-entry-correctness: passed');
} catch (error) {
    console.error(error instanceof Error ? error.stack || error.message : String(error));
    process.exit(1);
}

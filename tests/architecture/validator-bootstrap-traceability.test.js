const assert = require('assert');
const fs = require('fs');
const path = require('path');

function readText(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

function main() {
    const repoRoot = path.resolve(__dirname, '..', '..');
    const packageJsonPath = path.join(repoRoot, 'package.json');
    const rootContractPath = path.join(repoRoot, 'OVERALL_ARCHITECTURE.md');
    const validatorContractPath = path.join(repoRoot, '.github', 'validator', 'ARCHITECTURE.md');
    const bundledValidatorPath = path.join(repoRoot, '.github', 'validator', 'script', 'validateStageHandoff.js');
    const bundledSystemArchitectureValidatorPath = path.join(repoRoot, '.github', 'validator', 'script', 'validateSystemArchitecture.js');
    const shimPath = path.join(repoRoot, 'scripts', 'validateStageHandoff.js');
    const systemArchitectureShimPath = path.join(repoRoot, 'scripts', 'validateSystemArchitecture.js');

    assert(fs.existsSync(packageJsonPath), 'Expected package.json to exist.');
    assert(fs.existsSync(rootContractPath), 'Expected OVERALL_ARCHITECTURE.md to exist.');
    assert(fs.existsSync(validatorContractPath), 'Expected .github/validator/ARCHITECTURE.md to exist.');
    assert(fs.existsSync(bundledValidatorPath), 'Expected bundled validator script to exist.');
    assert(fs.existsSync(bundledSystemArchitectureValidatorPath), 'Expected bundled SystemArchitecture validator script to exist.');
    assert(fs.existsSync(shimPath), 'Expected repository-level validator shim to exist.');
    assert(fs.existsSync(systemArchitectureShimPath), 'Expected repository-level SystemArchitecture validator shim to exist.');

    const packageJson = JSON.parse(readText(packageJsonPath));
    const rootContract = readText(rootContractPath);
    const validatorContract = readText(validatorContractPath);
    const shimText = readText(shimPath);
    const systemArchitectureShimText = readText(systemArchitectureShimPath);

    assert.strictEqual(packageJson.scripts['validate:system-architecture'], 'node scripts/validateSystemArchitecture.js');
    assert.strictEqual(packageJson.scripts['validate:handoff'], 'node scripts/validateStageHandoff.js');
    assert.strictEqual(packageJson.scripts['validate:handoff:intent'], 'node scripts/validateStageHandoff.js intent-to-implementation');
    assert.strictEqual(packageJson.scripts['validate:handoff:implementation'], 'node scripts/validateStageHandoff.js implementation-to-coding');
    assert(rootContract.includes('- path: .github/validator/'), 'Root contract must include the bundled validator assets element.');
    assert(rootContract.includes('- path: package.json'), 'Root contract must include the bootstrap manifest file.');
    assert(validatorContract.includes('script/validateStageHandoff.js'), 'Validator contract must declare the bundled validator script.');
    assert(validatorContract.includes('script/validateSystemArchitecture.js'), 'Validator contract must declare the bundled SystemArchitecture validator script.');
    assert(shimText.includes("../.github/validator/script/validateStageHandoff.js"), 'Repository-level shim must forward to the bundled validator script.');
    assert(systemArchitectureShimText.includes("../.github/validator/script/validateSystemArchitecture.js"), 'Repository-level SystemArchitecture shim must forward to the bundled validator script.');
}

try {
    main();
    console.log('validator-bootstrap-traceability: passed');
} catch (error) {
    console.error(error instanceof Error ? error.stack || error.message : String(error));
    process.exit(1);
}
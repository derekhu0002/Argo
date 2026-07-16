#!/usr/bin/env node

const path = require('path');
const { runHarmonyBuildPackageRun } = require('./harmony-build-package-launch-service');

const DEFAULT_WORKSPACE = 'D:/Projects/ANDROID-2-HARMONYOS/work';

async function main() {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
        printUsage();
        process.exit(0);
    }

    const workspacePath = path.resolve(args.workspace || process.env.HARMONY_APP_WORKSPACE || DEFAULT_WORKSPACE);
    const result = await runHarmonyBuildPackageRun({ workspacePath });

    console.log(`summary: ${result.summaryPath}`);
    console.log(`artifacts: ${result.artifactDirectory}`);

    if (!result.ok) {
        process.exit(1);
    }
}

function parseArgs(argv) {
    const args = {};

    for (let index = 0; index < argv.length; index += 1) {
        const value = argv[index];
        if (value === '--help' || value === '-h') {
            args.help = true;
            continue;
        }

        if (value === '--workspace') {
            args.workspace = argv[index + 1];
            index += 1;
            continue;
        }

        throw new Error(`Unsupported argument: ${value}`);
    }

    return args;
}

function printUsage() {
    console.log('Usage: node .github/skills/wp-harmony-build-package-run-skill/run.js [--workspace <path>]');
}

main().catch(error => {
    console.error(String(error && error.stack ? error.stack : error));
    process.exit(1);
});
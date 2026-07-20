#!/usr/bin/env node

const path = require('path');
const { runDeliveryPreflight } = require('./delivery-preflight-orchestration-service');

const DEFAULT_WORKSPACE = 'D:/Projects/ANDROID-2-HARMONYOS/work';

async function main() {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
        printUsage();
        process.exit(0);
    }

    const workspacePath = path.resolve(args.workspace || process.env.HARMONY_APP_WORKSPACE || DEFAULT_WORKSPACE);
    const journeyStep = args.journeyStep || process.env.UI_COMPARISON_JOURNEY_STEP;
    const androidTarget = args.androidTarget || process.env.UI_COMPARISON_ANDROID_TARGET;
    const harmonyTarget = args.harmonyTarget || process.env.UI_COMPARISON_HARMONY_TARGET;

    if (!journeyStep || !androidTarget || !harmonyTarget) {
        printUsage();
        throw new Error('Missing required inputs. Provide --journey-step, --android-target, and --harmony-target.');
    }

    const result = await runDeliveryPreflight({
        workspacePath,
        journeyStep,
        androidTarget,
        harmonyTarget,
    });

    console.log(`summary: ${result.summaryPath}`);
    console.log(`artifacts: ${result.artifactDirectory}`);
    console.log(`evidence: ${result.evidencePath}`);

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

        if (value === '--journey-step') {
            args.journeyStep = argv[index + 1];
            index += 1;
            continue;
        }

        if (value === '--android-target') {
            args.androidTarget = argv[index + 1];
            index += 1;
            continue;
        }

        if (value === '--harmony-target') {
            args.harmonyTarget = argv[index + 1];
            index += 1;
            continue;
        }

        throw new Error(`Unsupported argument: ${value}`);
    }

    return args;
}

function printUsage() {
    console.log('Usage: node .github/skills/wp-delivery-preflight-skill/run.js [--workspace <path>] --journey-step <name> --android-target <adb-target> --harmony-target <hdc-target>');
}

main().catch(error => {
    console.error(String(error && error.stack ? error.stack : error));
    process.exit(1);
});
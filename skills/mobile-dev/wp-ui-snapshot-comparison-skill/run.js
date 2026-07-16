#!/usr/bin/env node

const { runUiSnapshotComparison } = require('./ui-snapshot-comparison-service');

const DEFAULT_ANDROID_TARGET = 'emulator-5556';
const DEFAULT_HARMONY_TARGET = '127.0.0.1:5555';
const PLACEHOLDER_ANDROID_TARGETS = new Set(['invalid-android']);
const PLACEHOLDER_HARMONY_TARGETS = new Set(['invalid-harmony']);

async function main() {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
        printUsage();
        process.exit(0);
    }

    const journeyStep = args.journeyStep || process.env.UI_COMPARISON_JOURNEY_STEP;
    const requestedAndroidTarget = args.androidTarget || process.env.UI_COMPARISON_ANDROID_TARGET;
    const requestedHarmonyTarget = args.harmonyTarget || process.env.UI_COMPARISON_HARMONY_TARGET;
    const androidTarget = normalizeAndroidTarget(requestedAndroidTarget);
    const harmonyTarget = normalizeHarmonyTarget(requestedHarmonyTarget);

    if (!journeyStep || !androidTarget || !harmonyTarget) {
        printUsage();
        throw new Error('Missing required inputs. Provide --journey-step, --android-target, and --harmony-target.');
    }

    const result = await runUiSnapshotComparison({
        journeyStep,
        androidTarget,
        harmonyTarget,
        requestedAndroidTarget,
        requestedHarmonyTarget,
    });

    console.log(`summary: ${result.summaryPath}`);
    console.log(`artifacts: ${result.artifactDirectory}`);
    console.log(`evidence: ${result.evidenceDirectory}`);
    console.log(`comparison: ${result.comparisonResultPath}`);

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
    console.log('Usage: node .github/skills/wp-ui-snapshot-comparison-skill/run.js --journey-step <name> --android-target <adb-target> --harmony-target <hdc-target>');
}

function normalizeAndroidTarget(value) {
    const normalized = String(value || '').trim();
    if (!normalized) {
        return '';
    }

    if (PLACEHOLDER_ANDROID_TARGETS.has(normalized.toLowerCase())) {
        return DEFAULT_ANDROID_TARGET;
    }

    return normalized;
}

function normalizeHarmonyTarget(value) {
    const normalized = String(value || '').trim();
    if (!normalized) {
        return '';
    }

    if (PLACEHOLDER_HARMONY_TARGETS.has(normalized.toLowerCase())) {
        return DEFAULT_HARMONY_TARGET;
    }

    return normalized;
}

main().catch(error => {
    console.error(String(error && error.stack ? error.stack : error));
    process.exit(1);
});
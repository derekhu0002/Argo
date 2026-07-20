const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const ARTIFACT_ROOT = path.resolve(__dirname, '..', '..', '..', 'work', 'artifacts', 'delivery-preflight');

async function runDeliveryPreflight(options) {
    const workspacePath = path.resolve(String(options.workspacePath || '').trim());
    const journeyStep = normalizeRequiredInput(options.journeyStep, 'journeyStep');
    const androidTarget = normalizeRequiredInput(options.androidTarget, 'androidTarget');
    const harmonyTarget = normalizeRequiredInput(options.harmonyTarget, 'harmonyTarget');
    const runId = new Date().toISOString().replace(/[.:]/g, '-');
    const artifactDirectory = path.join(ARTIFACT_ROOT, 'runs', runId);
    const latestDirectory = path.join(ARTIFACT_ROOT, 'latest');
    const summaryPath = path.join(artifactDirectory, 'summary.json');
    const evidencePath = path.join(artifactDirectory, 'evidence.json');

    if (!workspacePath) {
        throw new Error('workspacePath is required.');
    }

    await fs.promises.mkdir(artifactDirectory, { recursive: true });

    const buildRun = await invokePublicEntry({
        name: 'harmony-build-package-run',
        scriptRelativePath: path.join('.github', 'skills', 'wp-harmony-build-package-run-skill', 'run.js'),
        args: ['--workspace', workspacePath],
        requiredLabels: ['summary', 'artifacts'],
        jsonOutputs: ['summary'],
    });

    const uiSnapshotComparison = await invokePublicEntry({
        name: 'ui-snapshot-comparison',
        scriptRelativePath: path.join('.github', 'skills', 'wp-ui-snapshot-comparison-skill', 'run.js'),
        args: [
            '--journey-step', journeyStep,
            '--android-target', androidTarget,
            '--harmony-target', harmonyTarget,
        ],
        requiredLabels: ['summary', 'artifacts', 'evidence', 'comparison'],
        jsonOutputs: ['summary', 'comparison'],
    });

    const archivedEvidence = {
        buildRunSummaryPath: buildRun.paths.summary || null,
        buildRunArtifactDirectory: buildRun.paths.artifacts || null,
        uiComparisonSummaryPath: uiSnapshotComparison.paths.summary || null,
        uiComparisonArtifactDirectory: uiSnapshotComparison.paths.artifacts || null,
        uiComparisonEvidenceDirectory: uiSnapshotComparison.paths.evidence || null,
        uiComparisonResultPath: uiSnapshotComparison.paths.comparison || null,
    };

    const blockers = collectBlockers(buildRun, uiSnapshotComparison);
    const steps = [
        buildStepRecord(buildRun),
        buildStepRecord(uiSnapshotComparison),
    ];

    const summary = {
        workspacePath,
        journeyStep,
        targets: {
            android: androidTarget,
            harmony: harmonyTarget,
        },
        runId,
        blockers,
        steps,
        harmonyBuildRun: {
            ok: buildRun.ok,
            exitCode: buildRun.exitCode,
            summaryPath: buildRun.paths.summary || null,
            artifactDirectory: buildRun.paths.artifacts || null,
            blockers: extractNestedBlockers(buildRun.summaryJson),
            packageArtifactPath: readNestedValue(buildRun.summaryJson, ['packageArtifactPath']),
            statusByStep: readNestedValue(buildRun.summaryJson, ['steps']) || [],
        },
        uiSnapshotComparison: {
            ok: uiSnapshotComparison.ok,
            exitCode: uiSnapshotComparison.exitCode,
            summaryPath: uiSnapshotComparison.paths.summary || null,
            artifactDirectory: uiSnapshotComparison.paths.artifacts || null,
            evidenceDirectory: uiSnapshotComparison.paths.evidence || null,
            comparisonResultPath: uiSnapshotComparison.paths.comparison || null,
            blockers: extractNestedBlockers(uiSnapshotComparison.summaryJson),
            screenshotReferences: readNestedValue(uiSnapshotComparison.summaryJson, ['evidence']) || {
                androidCapturePath: null,
                harmonyCapturePath: null,
            },
            comparisonOutput: uiSnapshotComparison.comparisonJson || null,
            statusByStep: readNestedValue(uiSnapshotComparison.summaryJson, ['steps']) || [],
        },
        archivedEvidence,
        evidencePath,
        ok: buildRun.ok && uiSnapshotComparison.ok,
    };

    await fs.promises.writeFile(evidencePath, JSON.stringify(archivedEvidence, null, 2) + '\n', 'utf8');
    await fs.promises.writeFile(summaryPath, JSON.stringify(summary, null, 2) + '\n', 'utf8');
    await publishLatestArtifacts(artifactDirectory, latestDirectory);

    return {
        ok: summary.ok,
        summaryPath,
        artifactDirectory,
        evidencePath,
        blockers,
        buildRun,
        uiSnapshotComparison,
    };
}

async function invokePublicEntry(options) {
    const scriptPath = path.join(REPO_ROOT, options.scriptRelativePath);
    const output = await runNodeScript(scriptPath, options.args);
    const paths = extractPaths(output.combinedOutput);
    const missingLabels = options.requiredLabels.filter(label => !paths[label]);
    const summaryJson = await readJsonIfPresent(paths.summary);
    const comparisonJson = options.jsonOutputs.includes('comparison')
        ? await readJsonIfPresent(paths.comparison)
        : null;

    const ok = output.exitCode === 0
        && missingLabels.length === 0
        && (!options.jsonOutputs.includes('summary') || Boolean(summaryJson))
        && (!options.jsonOutputs.includes('comparison') || Boolean(comparisonJson));

    const signalParts = [];
    if (missingLabels.length > 0) {
        signalParts.push(`Missing expected output labels: ${missingLabels.join(', ')}`);
    }
    if (!summaryJson && options.jsonOutputs.includes('summary')) {
        signalParts.push('Expected summary JSON could not be read.');
    }
    if (!comparisonJson && options.jsonOutputs.includes('comparison')) {
        signalParts.push('Expected comparison JSON could not be read.');
    }
    if (output.exitCode !== 0) {
        signalParts.push(readFailureSignal(output));
    }

    return {
        name: options.name,
        scriptPath,
        args: options.args,
        exitCode: output.exitCode,
        ok,
        paths,
        stdout: output.stdout,
        stderr: output.stderr,
        summaryJson,
        comparisonJson,
        signal: signalParts.filter(Boolean).join(' | ') || 'Invocation completed successfully.',
    };
}

async function runNodeScript(scriptPath, args) {
    const { command, commandArgs } = buildNodeInvocation(scriptPath, args);

    try {
        const { stdout, stderr } = await execFileAsync(command, commandArgs, {
            cwd: REPO_ROOT,
            windowsHide: true,
            maxBuffer: 1024 * 1024 * 10,
        });
        return {
            exitCode: 0,
            stdout: String(stdout || '').trim(),
            stderr: String(stderr || '').trim(),
            combinedOutput: `${String(stdout || '')}\n${String(stderr || '')}`,
        };
    } catch (error) {
        return {
            exitCode: typeof error.code === 'number' ? error.code : 1,
            stdout: String(error.stdout || '').trim(),
            stderr: String(error.stderr || error.message || error).trim(),
            combinedOutput: `${String(error.stdout || '')}\n${String(error.stderr || error.message || error)}`,
        };
    }
}

function buildNodeInvocation(scriptPath, args) {
    return {
        command: process.execPath,
        commandArgs: [scriptPath, ...args],
    };
}

function extractPaths(output) {
    const labels = ['summary', 'artifacts', 'evidence', 'comparison'];
    const paths = {};

    for (const label of labels) {
        const match = String(output).match(new RegExp(`^${label}:\\s*(.+)$`, 'm'));
        paths[label] = match ? match[1].trim() : '';
    }

    return paths;
}

async function readJsonIfPresent(filePath) {
    if (!filePath || !fs.existsSync(filePath)) {
        return null;
    }

    try {
        return JSON.parse(await fs.promises.readFile(filePath, 'utf8'));
    } catch (_error) {
        return null;
    }
}

function collectBlockers(buildRun, uiSnapshotComparison) {
    const blockers = [];

    if (!buildRun.ok) {
        blockers.push(`Harmony build/package/run: ${buildRun.signal}`);
    }
    blockers.push(...extractNestedBlockers(buildRun.summaryJson));

    if (!uiSnapshotComparison.ok) {
        blockers.push(`UI snapshot comparison: ${uiSnapshotComparison.signal}`);
    }
    blockers.push(...extractNestedBlockers(uiSnapshotComparison.summaryJson));
    blockers.push(...extractComparisonBlockers(uiSnapshotComparison.comparisonJson));

    return Array.from(new Set(blockers.filter(Boolean)));
}

function extractNestedBlockers(summaryJson) {
    if (!summaryJson || !Array.isArray(summaryJson.blockers)) {
        return [];
    }

    return summaryJson.blockers.map(value => String(value || '').trim()).filter(Boolean);
}

function extractComparisonBlockers(comparisonJson) {
    if (!comparisonJson || !Array.isArray(comparisonJson.blockers)) {
        return [];
    }

    return comparisonJson.blockers.map(value => String(value || '').trim()).filter(Boolean);
}

function buildStepRecord(result) {
    return {
        name: result.name,
        status: result.ok ? 'passed' : 'failed',
        ok: result.ok,
        signal: result.signal,
        exitCode: result.exitCode,
        summaryPath: result.paths.summary || null,
        artifactDirectory: result.paths.artifacts || null,
        evidenceDirectory: result.paths.evidence || null,
        comparisonResultPath: result.paths.comparison || null,
    };
}

function readFailureSignal(output) {
    const stderr = String(output.stderr || '').trim();
    if (stderr) {
        return stderr;
    }

    const stdout = String(output.stdout || '').trim();
    if (stdout) {
        return stdout;
    }

    return 'Invocation failed without stderr or stdout.';
}

function readNestedValue(input, pathSegments) {
    let current = input;
    for (const segment of pathSegments) {
        if (!current || typeof current !== 'object' || !(segment in current)) {
            return null;
        }
        current = current[segment];
    }
    return current;
}

function normalizeRequiredInput(value, key) {
    const normalized = String(value || '').trim();
    if (!normalized) {
        throw new Error(`${key} is required.`);
    }
    return normalized;
}

async function publishLatestArtifacts(sourceDirectory, latestDirectory) {
    await fs.promises.rm(latestDirectory, { recursive: true, force: true });
    await fs.promises.mkdir(latestDirectory, { recursive: true });
    await copyDirectory(sourceDirectory, latestDirectory);
}

async function copyDirectory(sourceDirectory, targetDirectory) {
    const entries = await fs.promises.readdir(sourceDirectory, { withFileTypes: true });
    for (const entry of entries) {
        const sourcePath = path.join(sourceDirectory, entry.name);
        const targetPath = path.join(targetDirectory, entry.name);
        if (entry.isDirectory()) {
            await fs.promises.mkdir(targetPath, { recursive: true });
            await copyDirectory(sourcePath, targetPath);
            continue;
        }

        await fs.promises.copyFile(sourcePath, targetPath);
    }
}

module.exports = {
    runDeliveryPreflight,
};
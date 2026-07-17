const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

const ARTIFACT_ROOT = path.resolve(__dirname, '..', '..', '..', 'work', 'artifacts', 'harmony-build-package-run');
const BUILD_ARGUMENTS = ['--mode', 'module', '-p', 'product=default', '-p', 'module=entry', 'assembleHap'];
const DEFAULT_STEP_TIMEOUT_MS = 10 * 60 * 1000;
const DEVICE_STEP_TIMEOUT_MS = 60 * 1000;
const DEVICE_FAILURE_PATTERNS = [/\[Fail\]/i, /\b(?:fail|failed|failure|error)\b/i];
const KNOWN_TOOL_LOCATIONS = {
    build: [
        'C:/Program Files/Huawei/DevEco Studio/tools/hvigor/bin/hvigorw.bat',
        'C:/Program Files/Huawei/DevEco Studio/tools/hvigor/bin/hvigorw',
        'C:/Program Files/DevEco Studio/tools/hvigor/bin/hvigorw.bat',
        'C:/Program Files/DevEco Studio/tools/hvigor/bin/hvigorw',
        'C:/Program Files/Huawei/DevEco Studio/tools/hvigor/bin/hvigorw.bat',
        'C:/Program Files/Huawei/DevEco Studio/tools/hvigor/bin/hvigorw',
    ],
    device: [
        'C:/Program Files/Huawei/DevEco Studio/sdk/default/openharmony/toolchains/hdc.exe',
        'C:/Program Files/DevEco Studio/sdk/default/openharmony/toolchains/hdc.exe',
        'C:/Program Files/Huawei/DevEco Studio/sdk/default/openharmony/toolchains/hdc.exe',
    ],
};

async function runHarmonyBuildPackageRun(options) {
    const workspacePath = path.resolve(options.workspacePath);
    const runId = new Date().toISOString().replace(/[.:]/g, '-');
    const artifactDirectory = path.join(ARTIFACT_ROOT, 'runs', runId);
    const latestDirectory = path.join(ARTIFACT_ROOT, 'latest');

    await fs.promises.mkdir(artifactDirectory, { recursive: true });

    const metadata = await readWorkspaceMetadata(workspacePath);
    const initialPackage = await findPackageArtifact(workspacePath);
    const buildTool = await resolveCommand(['hvigorw.bat', 'hvigorw', 'hvigor'], KNOWN_TOOL_LOCATIONS.build);
    const deviceTool = await resolveCommand(['hdc'], KNOWN_TOOL_LOCATIONS.device);
    const sdkHome = await resolveDevEcoSdkHome({ workspacePath, buildTool, deviceTool });
    const steps = [];
    const blockers = [];

    if (!metadata.workspaceExists) {
        blockers.push(`Prepared Harmony workspace not found: ${workspacePath}`);
    }

    let packageArtifactPath = initialPackage;
    let buildResult = null;
    if (!buildTool) {
        blockers.push('Harmony build tool not found on PATH. Expected hvigorw.bat, hvigorw, or hvigor.');
    }

    if (buildTool && !sdkHome) {
        blockers.push('DevEco SDK root could not be resolved. Expected a valid DEVECO_SDK_HOME for hvigor execution.');
    }

    if (metadata.workspaceExists && buildTool && sdkHome) {
        buildResult = await runStep({
            name: 'compile-build-package',
            command: buildTool,
            args: BUILD_ARGUMENTS,
            cwd: workspacePath,
            logFile: path.join(artifactDirectory, 'compile-build-package.log'),
            successSignal: 'hvigor assembleHap completed',
            env: buildStepEnv(sdkHome, buildTool, deviceTool),
        });
        steps.push(...splitBuildResult(buildResult));
        packageArtifactPath = await findPackageArtifact(workspacePath);
    } else {
        steps.push({
            name: 'compile',
            status: 'blocked',
            ok: false,
            signal: 'Build tool unavailable',
        });
        steps.push({
            name: 'build',
            status: 'blocked',
            ok: false,
            signal: 'Build tool unavailable',
        });
        steps.push({
            name: 'package',
            status: initialPackage ? 'blocked' : 'blocked',
            ok: false,
            signal: initialPackage
                ? `Existing package artifact found at ${initialPackage}, but no build tool was available to regenerate it for this execution.`
                : 'Build tool unavailable and no package artifact was discovered.',
        });
    }

    if (!packageArtifactPath) {
        blockers.push('No Harmony package artifact was found under entry/build/default/outputs after the build/package phase.');
    }

    if (!deviceTool) {
        blockers.push('Harmony device tool not found on PATH. Expected hdc for install and launch steps.');
    }

    if (metadata.workspaceExists && packageArtifactPath && deviceTool) {
        const installResult = await runStep({
            name: 'install',
            command: deviceTool,
            args: ['install', '-r', packageArtifactPath],
            cwd: workspacePath,
            logFile: path.join(artifactDirectory, 'install.log'),
            successSignal: 'hdc install completed',
            env: buildStepEnv(sdkHome, buildTool, deviceTool),
            timeoutMs: DEVICE_STEP_TIMEOUT_MS,
            failurePatterns: DEVICE_FAILURE_PATTERNS,
        });
        steps.push(installResult);

        const launchResult = installResult.ok
            ? await runStep({
                name: 'launch',
                command: deviceTool,
                args: ['shell', 'aa', 'start', '-a', metadata.mainElement || 'EntryAbility', '-b', metadata.bundleName || ''],
                cwd: workspacePath,
                logFile: path.join(artifactDirectory, 'launch.log'),
                successSignal: 'hdc launch completed',
                env: buildStepEnv(sdkHome, buildTool, deviceTool),
                timeoutMs: DEVICE_STEP_TIMEOUT_MS,
                failurePatterns: DEVICE_FAILURE_PATTERNS,
            })
            : {
                name: 'launch',
                status: 'blocked',
                ok: false,
                signal: 'Launch was skipped because install did not succeed.',
            };
        steps.push(launchResult);
    } else {
        if (!steps.some(step => step.name === 'install')) {
            steps.push({
                name: 'install',
                status: 'blocked',
                ok: false,
                signal: packageArtifactPath
                    ? 'Install blocked because hdc was unavailable.'
                    : 'Install blocked because no package artifact was available.',
            });
        }
        if (!steps.some(step => step.name === 'launch')) {
            steps.push({
                name: 'launch',
                status: 'blocked',
                ok: false,
                signal: 'Launch blocked because install prerequisites were not satisfied.',
            });
        }
    }

    const summary = {
        workspacePath,
        runId,
        bundleName: metadata.bundleName || null,
        moduleName: metadata.moduleName || null,
        mainElement: metadata.mainElement || null,
        packageArtifactPath: packageArtifactPath || null,
        blockers,
        steps,
        ok: steps.every(step => step.ok),
    };

    const summaryPath = path.join(artifactDirectory, 'summary.json');
    await fs.promises.writeFile(summaryPath, JSON.stringify(summary, null, 2) + '\n', 'utf8');
    await publishLatestArtifacts(artifactDirectory, latestDirectory);

    return {
        ok: summary.ok,
        summaryPath,
        artifactDirectory,
    };
}

function splitBuildResult(buildResult) {
    const compileStep = {
        name: 'compile',
        status: buildResult.status,
        ok: buildResult.ok,
        signal: buildResult.ok
            ? 'Compile/build/package command completed successfully.'
            : buildResult.signal,
        command: buildResult.command,
        logFile: buildResult.logFile,
    };

    const buildStep = {
        name: 'build',
        status: buildResult.status,
        ok: buildResult.ok,
        signal: buildResult.ok
            ? 'Compile/build/package command completed successfully.'
            : buildResult.signal,
        command: buildResult.command,
        logFile: buildResult.logFile,
    };

    const packageStep = {
        name: 'package',
        status: buildResult.status,
        ok: buildResult.ok,
        signal: buildResult.ok
            ? 'Package generation command completed successfully.'
            : buildResult.signal,
        command: buildResult.command,
        logFile: buildResult.logFile,
    };

    return [compileStep, buildStep, packageStep];
}

async function runStep(step) {
    const invocation = buildInvocation(step.command, step.args);
    const timeoutMs = step.timeoutMs || DEFAULT_STEP_TIMEOUT_MS;
    try {
        const { stdout, stderr } = await execFileAsync(invocation.command, invocation.args, {
            cwd: step.cwd,
            env: step.env || process.env,
            windowsHide: true,
            maxBuffer: 1024 * 1024 * 10,
            timeout: timeoutMs,
            killSignal: 'SIGTERM',
        });
        const output = [stdout, stderr].filter(Boolean).join('\n').trim();
        await fs.promises.writeFile(step.logFile, output ? `${output}\n` : '', 'utf8');
        const failureSignal = matchFailureSignal(output, step.failurePatterns);
        if (failureSignal) {
            return {
                name: step.name,
                status: 'failed',
                ok: false,
                signal: failureSignal,
                command: formatCommand(invocation.command, invocation.args),
                logFile: step.logFile,
            };
        }
        return {
            name: step.name,
            status: 'passed',
            ok: true,
            signal: step.successSignal,
            command: formatCommand(invocation.command, invocation.args),
            logFile: step.logFile,
        };
    } catch (error) {
        const stdout = String(error.stdout || '').trim();
        const stderr = String(error.stderr || error.message || error).trim();
        const timedOut = Boolean(error.killed);
        const timeoutSignal = timedOut
            ? `${step.name} timed out after ${formatDuration(timeoutMs)}. Check tool availability, device/emulator availability, and command responsiveness.`
            : '';
        const output = [timeoutSignal, stdout, stderr].filter(Boolean).join('\n').trim();
        await fs.promises.writeFile(step.logFile, output ? `${output}\n` : '', 'utf8');
        return {
            name: step.name,
            status: timedOut ? 'timeout' : 'failed',
            ok: false,
            signal: timeoutSignal || stderr || stdout || `Command failed: ${formatCommand(invocation.command, invocation.args)}`,
            command: formatCommand(invocation.command, invocation.args),
            logFile: step.logFile,
        };
    }
}

function buildInvocation(command, args) {
    if (os.platform() === 'win32' && /\.bat$/i.test(command)) {
        return {
            command: 'cmd.exe',
            args: ['/c', command, ...args],
        };
    }

    return { command, args };
}

async function readWorkspaceMetadata(workspacePath) {
    const workspaceExists = fs.existsSync(workspacePath);
    if (!workspaceExists) {
        return {
            workspaceExists: false,
            bundleName: null,
            moduleName: null,
            mainElement: null,
        };
    }

    const appJson5 = await readFileIfPresent(path.join(workspacePath, 'AppScope', 'app.json5'));
    const moduleJson5 = await readFileIfPresent(path.join(workspacePath, 'entry', 'src', 'main', 'module.json5'));

    return {
        workspaceExists,
        bundleName: matchJson5Value(appJson5, 'bundleName'),
        moduleName: matchJson5Value(moduleJson5, 'name'),
        mainElement: matchJson5Value(moduleJson5, 'mainElement'),
    };
}

async function readFileIfPresent(filePath) {
    try {
        return await fs.promises.readFile(filePath, 'utf8');
    } catch (_error) {
        return '';
    }
}

function matchJson5Value(content, key) {
    const match = content.match(new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`));
    return match ? match[1] : null;
}

async function findPackageArtifact(workspacePath) {
    const outputDirectory = path.join(workspacePath, 'entry', 'build', 'default', 'outputs');
    if (!fs.existsSync(outputDirectory)) {
        return null;
    }

    const queue = [outputDirectory];
    while (queue.length > 0) {
        const currentDirectory = queue.shift();
        const entries = await fs.promises.readdir(currentDirectory, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(currentDirectory, entry.name);
            if (entry.isDirectory()) {
                queue.push(fullPath);
                continue;
            }
            if (/\.(hap|app|hsp|har)$/i.test(entry.name)) {
                return fullPath;
            }
        }
    }

    return null;
}

async function resolveCommand(candidates) {
    return resolveCommand(candidates, []);
}

async function resolveCommand(candidates, fallbackPaths) {
    for (const candidate of candidates) {
        const located = await locateCommand(candidate);
        if (located) {
            return located;
        }
    }

    for (const fallbackPath of fallbackPaths) {
        const normalizedPath = path.normalize(fallbackPath);
        if (fs.existsSync(normalizedPath)) {
            return normalizedPath;
        }
    }

    return null;
}

async function locateCommand(commandName) {
    try {
        const { stdout } = await execFileAsync('where', [commandName], {
            windowsHide: true,
            maxBuffer: 1024 * 1024,
        });
        const firstLine = String(stdout || '')
            .split(/\r?\n/)
            .map(line => line.trim())
            .find(Boolean);
        return firstLine || null;
    } catch (_error) {
        return null;
    }
}

async function resolveDevEcoSdkHome(options) {
    const envSdkHome = process.env.DEVECO_SDK_HOME;
    if (envSdkHome && fs.existsSync(envSdkHome)) {
        return envSdkHome;
    }

    const localPropertiesSdkHome = await readLocalPropertiesSdkHome(options.workspacePath);
    if (localPropertiesSdkHome && fs.existsSync(localPropertiesSdkHome)) {
        return localPropertiesSdkHome;
    }

    for (const toolPath of [options.deviceTool, options.buildTool]) {
        const derived = deriveSdkHomeFromTool(toolPath);
        if (derived && fs.existsSync(derived)) {
            return derived;
        }
    }

    return null;
}

async function readLocalPropertiesSdkHome(workspacePath) {
    const localProperties = await readFileIfPresent(path.join(workspacePath, 'local.properties'));
    const match = localProperties.match(/^sdk\.dir=(.+)$/m);
    if (!match) {
        return null;
    }

    return match[1].trim().replace(/\\:/g, ':').replace(/\\\\/g, '\\');
}

function deriveSdkHomeFromTool(toolPath) {
    if (!toolPath) {
        return null;
    }

    const normalized = path.normalize(toolPath);
    const sdkSegment = `${path.sep}sdk${path.sep}`;
    const sdkIndex = normalized.toLowerCase().indexOf(sdkSegment.toLowerCase());
    if (sdkIndex >= 0) {
        return normalized.slice(0, sdkIndex + sdkSegment.length - 1);
    }

    return null;
}

function buildStepEnv(sdkHome, buildTool, deviceTool) {
    const env = { ...process.env };
    const extraPaths = [];

    if (buildTool) {
        extraPaths.push(path.dirname(buildTool));
    }
    if (deviceTool) {
        extraPaths.push(path.dirname(deviceTool));
    }

    if (extraPaths.length > 0) {
        env.Path = `${extraPaths.join(path.delimiter)}${path.delimiter}${env.Path || ''}`;
    }

    if (sdkHome) {
        env.DEVECO_SDK_HOME = sdkHome;
    }

    return env;
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

function formatCommand(command, args) {
    return [command, ...args].map(quoteIfNeeded).join(' ');
}

function matchFailureSignal(output, failurePatterns) {
    if (!output || !failurePatterns || failurePatterns.length === 0) {
        return '';
    }

    const failedLine = output
        .split(/\r?\n/)
        .map(line => line.trim())
        .find(line => failurePatterns.some(pattern => pattern.test(line)));

    return failedLine || '';
}

function formatDuration(milliseconds) {
    const seconds = Math.round(milliseconds / 1000);
    return `${seconds}s`;
}

function quoteIfNeeded(value) {
    return /\s/.test(value) ? `"${value}"` : value;
}

module.exports = {
    runHarmonyBuildPackageRun,
};
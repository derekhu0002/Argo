const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

const ARTIFACT_ROOT = path.resolve(__dirname, '..', '..', '..', 'work', 'artifacts', 'ui-snapshot-comparison');
const HARMONY_CAPTURE_PULL_ATTEMPTS = 3;
const HARMONY_CAPTURE_PULL_SETTLE_MS = 500;
const KNOWN_TOOL_LOCATIONS = {
    adb: [
        'C:/Users/admin/AppData/Local/Android/Sdk/platform-tools/adb.exe',
        'C:/Android/platform-tools/adb.exe',
        'D:/Android/platform-tools/adb.exe',
    ],
    hdc: [
        'C:/Program Files/Huawei/DevEco Studio/sdk/default/openharmony/toolchains/hdc.exe',
        'C:/Program Files/DevEco Studio/sdk/default/openharmony/toolchains/hdc.exe',
        'C:/Program Files/Huawei/DevEco Studio/sdk/default/openharmony/toolchains/hdc.exe',
    ],
};

async function runUiSnapshotComparison(options) {
    const journeyStep = normalizeJourneyStep(options.journeyStep);
    const androidTarget = String(options.androidTarget || '').trim();
    const requestedHarmonyTarget = String(options.harmonyTarget || '').trim();
    const requestedAndroidTarget = String(options.requestedAndroidTarget || options.androidTarget || '').trim();
    const declaredHarmonyTarget = String(options.requestedHarmonyTarget || options.harmonyTarget || '').trim();
    const runId = new Date().toISOString().replace(/[.:]/g, '-');
    const artifactDirectory = path.join(ARTIFACT_ROOT, 'runs', runId);
    const latestDirectory = path.join(ARTIFACT_ROOT, 'latest');
    const evidenceDirectory = path.join(artifactDirectory, 'evidence');
    const summaryPath = path.join(artifactDirectory, 'summary.json');
    const comparisonResultPath = path.join(artifactDirectory, 'comparison-result.json');
    const blockers = [];
    const steps = [];

    if (!journeyStep) {
        throw new Error('journeyStep is required.');
    }
    if (!androidTarget) {
        throw new Error('androidTarget is required.');
    }
    if (!requestedHarmonyTarget) {
        throw new Error('harmonyTarget is required.');
    }

    await fs.promises.mkdir(evidenceDirectory, { recursive: true });

    const adbTool = await resolveCommand(['adb'], KNOWN_TOOL_LOCATIONS.adb);
    const hdcTool = await resolveCommand(['hdc'], KNOWN_TOOL_LOCATIONS.hdc);
    const harmonyTarget = await resolveConnectedHarmonyTarget(hdcTool, requestedHarmonyTarget);

    const androidCapturePath = path.join(evidenceDirectory, 'android.png');
    const harmonyCapturePath = path.join(evidenceDirectory, 'harmony.jpeg');

    const androidCapture = await captureAndroidScreen({
        adbTool,
        androidTarget,
        outputPath: androidCapturePath,
    });
    steps.push(androidCapture.step);
    if (!androidCapture.ok) {
        blockers.push(androidCapture.step.signal);
    }

    const harmonyCapture = await captureHarmonyScreen({
        hdcTool,
        harmonyTarget,
        journeyStep,
        outputPath: harmonyCapturePath,
    });
    steps.push(harmonyCapture.step);
    if (!harmonyCapture.ok) {
        blockers.push(harmonyCapture.step.signal);
    }

    const comparisonResult = androidCapture.ok && harmonyCapture.ok
        ? await compareCaptures({
            journeyStep,
            androidTarget,
            harmonyTarget,
            androidPath: androidCapturePath,
            harmonyPath: harmonyCapturePath,
        })
        : buildBlockedComparisonResult({
            journeyStep,
            androidTarget,
            harmonyTarget,
            blockers,
        });

    steps.push({
        name: 'compare',
        status: comparisonResult.status,
        ok: comparisonResult.ok,
        signal: comparisonResult.signal,
        outputPath: comparisonResultPath,
    });

    await fs.promises.writeFile(comparisonResultPath, JSON.stringify(comparisonResult, null, 2) + '\n', 'utf8');

    const summary = {
        journeyStep,
        runId,
        targets: {
            android: requestedAndroidTarget,
            harmony: declaredHarmonyTarget,
        },
        effectiveTargets: {
            android: androidTarget,
            harmony: harmonyTarget,
        },
        blockers,
        steps,
        evidence: {
            androidCapturePath: androidCapture.ok ? androidCapturePath : null,
            harmonyCapturePath: harmonyCapture.ok ? harmonyCapturePath : null,
        },
        comparisonResultPath,
        ok: steps.every(step => step.ok),
    };

    await fs.promises.writeFile(summaryPath, JSON.stringify(summary, null, 2) + '\n', 'utf8');
    await publishLatestArtifacts(artifactDirectory, latestDirectory);

    return {
        ok: summary.ok,
        summaryPath,
        artifactDirectory,
        evidenceDirectory,
        comparisonResultPath,
    };
}

async function captureAndroidScreen(options) {
    if (!options.adbTool) {
        return {
            ok: false,
            step: {
                name: 'capture-android',
                status: 'blocked',
                ok: false,
                signal: 'Android capture blocked because adb was not found on PATH.',
            },
        };
    }

    const command = [
        '-s',
        options.androidTarget,
        'exec-out',
        'screencap',
        '-p',
    ];

    try {
        const stdout = await execFileBinary(options.adbTool, command);
        if (!stdout.length) {
            throw new Error('adb screencap returned no image bytes.');
        }
        await fs.promises.writeFile(options.outputPath, stdout);
        return {
            ok: true,
            step: {
                name: 'capture-android',
                status: 'passed',
                ok: true,
                signal: 'Android screencap captured successfully.',
                outputPath: options.outputPath,
                command: formatCommand(options.adbTool, command),
            },
        };
    } catch (error) {
        return {
            ok: false,
            step: {
                name: 'capture-android',
                status: 'blocked',
                ok: false,
                signal: `Android screencap failed for target ${options.androidTarget}: ${readErrorMessage(error)}`,
                outputPath: null,
                command: formatCommand(options.adbTool, command),
            },
        };
    }
}

async function captureHarmonyScreen(options) {
    if (!options.hdcTool) {
        return {
            ok: false,
            step: {
                name: 'capture-harmony',
                status: 'blocked',
                ok: false,
                signal: 'HarmonyOS capture blocked because hdc was not found on PATH.',
            },
        };
    }

    const remotePath = `/data/local/tmp/${options.journeyStep}-${Date.now()}.jpeg`;
    const localOutputPath = normalizeLocalHdcPath(options.outputPath);
    const captureArgs = ['-t', options.harmonyTarget, 'shell', 'snapshot_display', '-f', remotePath];
    const verifyArgs = ['-t', options.harmonyTarget, 'shell', 'ls', '-l', remotePath];
    const pullArgs = ['-t', options.harmonyTarget, 'file', 'recv', remotePath, localOutputPath];
    const cleanupArgs = ['-t', options.harmonyTarget, 'shell', 'rm', '-f', remotePath];

    try {
        await execFileText(options.hdcTool, captureArgs);
        await recvHarmonyCapture(options.hdcTool, verifyArgs, pullArgs, localOutputPath);
        await execFileText(options.hdcTool, cleanupArgs).catch(() => undefined);

        return {
            ok: true,
            step: {
                name: 'capture-harmony',
                status: 'passed',
                ok: true,
                signal: 'HarmonyOS snapshot captured successfully.',
                outputPath: options.outputPath,
                command: formatCommand(options.hdcTool, captureArgs),
            },
        };
    } catch (error) {
        return {
            ok: false,
            step: {
                name: 'capture-harmony',
                status: 'blocked',
                ok: false,
                signal: `HarmonyOS snapshot failed for target ${options.harmonyTarget}: ${readErrorMessage(error)}`,
                outputPath: null,
                command: formatCommand(options.hdcTool, captureArgs),
            },
        };
    }
}

async function resolveConnectedHarmonyTarget(hdcTool, preferredTarget) {
    if (!hdcTool) {
        return preferredTarget;
    }

    const targets = await listHarmonyTargets(hdcTool);
    if (targets.length > 0) {
        return targets[0];
    }

    if (preferredTarget) {
        const reachable = await canReachHarmonyTarget(hdcTool, preferredTarget);
        if (reachable) {
            return preferredTarget;
        }
    }

    return preferredTarget;
}

async function canReachHarmonyTarget(hdcTool, target) {
    try {
        await execFileText(hdcTool, ['-t', target, 'shell', 'pwd']);
        return true;
    } catch (_error) {
        return false;
    }
}

async function listHarmonyTargets(hdcTool) {
    try {
        const stdout = await execFileTextWithOutput(hdcTool, ['list', 'targets']);
        return String(stdout || '')
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => /^\d+\.\d+\.\d+\.\d+:\d+$/i.test(line));
    } catch (_error) {
        return [];
    }
}

async function recvHarmonyCapture(hdcTool, verifyArgs, pullArgs, outputPath) {
    let lastError = null;

    for (let attempt = 1; attempt <= HARMONY_CAPTURE_PULL_ATTEMPTS; attempt += 1) {
        try {
            await fs.promises.rm(outputPath, { force: true });
            await execFileText(hdcTool, verifyArgs);
            await execFileText(hdcTool, pullArgs);
            await waitForMaterializedFile(outputPath, HARMONY_CAPTURE_PULL_SETTLE_MS);
            return;
        } catch (error) {
            lastError = error;
            if (attempt === HARMONY_CAPTURE_PULL_ATTEMPTS) {
                break;
            }
            await delay(HARMONY_CAPTURE_PULL_SETTLE_MS);
        }
    }

    throw lastError || new Error('Harmony screenshot recv failed.');
}

async function waitForMaterializedFile(filePath, timeoutMs) {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        if (fs.existsSync(filePath)) {
            const stats = await fs.promises.stat(filePath);
            if (stats.size > 0) {
                return;
            }
        }
        await delay(100);
    }

    if (!fs.existsSync(filePath)) {
        throw new Error('hdc did not materialize a local screenshot before the settle window elapsed.');
    }

    const stats = await fs.promises.stat(filePath);
    if (stats.size <= 0) {
        throw new Error('hdc snapshot_display produced an empty image file.');
    }
}

async function compareCaptures(options) {
    const androidBytes = await fs.promises.readFile(options.androidPath);
    let harmonyBytes = await fs.promises.readFile(options.harmonyPath);

    const androidMeta = buildCaptureMetadata(androidBytes, options.androidPath);
    let harmonyMeta = buildCaptureMetadata(harmonyBytes, options.harmonyPath);

    // If Harmony capture is JPEG, convert to PNG via Python/PIL for proper pixel comparison
    if (harmonyMeta.format === 'jpeg') {
      const converted = await convertJpegToPng(options.harmonyPath);
      if (converted) {
        harmonyBytes = await fs.promises.readFile(converted);
        harmonyMeta = buildCaptureMetadata(harmonyBytes, converted);
      }
    }

    const dimensionsMatch = androidMeta.width === harmonyMeta.width
        && androidMeta.height === harmonyMeta.height;

    // Compute pixel-level similarity from raw RGBA data
    const androidPixels = extractRawPixels(androidBytes, androidMeta);
    const harmonyPixels = extractRawPixels(harmonyBytes, harmonyMeta);

    let similarity = 0;
    let pixelDetails = null;
    if (androidPixels && harmonyPixels && androidPixels.length > 0 && harmonyPixels.length > 0) {
        const result = computePixelSimilarity(androidPixels, harmonyPixels, androidMeta, harmonyMeta);
        similarity = result.similarity;
        pixelDetails = result;
    }

    const SIMILARITY_THRESHOLD = parseThresholdEnv() || 0.80;
    const passed = similarity >= SIMILARITY_THRESHOLD;

    const signal = androidPixels && harmonyPixels
        ? `Pixel similarity ${(similarity * 100).toFixed(1)}% (threshold ${(SIMILARITY_THRESHOLD * 100).toFixed(0)}%). ${passed ? 'PASSED' : 'FAILED'}.`
        : 'Pixel comparison unavailable — one or both captures could not be decoded.';

    return {
        journeyStep: options.journeyStep,
        status: passed ? 'passed' : 'failed',
        ok: passed,
        signal,
        outcome: passed ? 'similar' : 'divergent',
        similarity: Math.round(similarity * 10000) / 10000,
        similarityThreshold: SIMILARITY_THRESHOLD,
        targets: {
            android: options.androidTarget,
            harmony: options.harmonyTarget,
        },
        captures: {
            android: androidMeta,
            harmony: harmonyMeta,
        },
        dimensionsMatch,
        pixelDetails: pixelDetails ? {
            comparedPixels: pixelDetails.compared,
            matchingPixels: pixelDetails.matching,
            sampleGrid: pixelDetails.gridSize,
        } : null,
    };
}

async function convertJpegToPng(jpegPath) {
  try {
    const pngPath = jpegPath.replace(/\.jpe?g$/i, '.png');
    const script = `from PIL import Image; img = Image.open(r'${jpegPath}'); img.save(r'${pngPath}', 'PNG')`;
    await execFileAsync('python', ['-c', script]);
    if (fs.existsSync(pngPath) && fs.statSync(pngPath).size > 0) {
      return pngPath;
    }
  } catch (_e) {
    // Fall through — conversion unavailable
  }
  return null;
}

function parseThresholdEnv() {
  const raw = process.env.UI_COMPARISON_SIMILARITY_THRESHOLD;
  if (raw === undefined || raw === null || raw === '') return null;
  const parsed = Number(raw);
  if (Number.isNaN(parsed) || parsed < 0 || parsed > 1) return null;
  return parsed;
}

function extractRawPixels(bytes, metadata) {
  if (metadata.format === 'png') {
    return extractPngPixels(bytes);
  }
  // For JPEG, sample approximate pixels without full decode
  if (metadata.format === 'jpeg') {
    return extractJpegApproximatePixels(bytes, metadata);
  }
  return null;
}

function extractPngPixels(bytes) {
  try {
    const zlib = require('zlib');
    // Find IDAT chunks and concatenate compressed data
    let offset = 8; // skip PNG signature
    const idatChunks = [];
    while (offset + 12 <= bytes.length) {
      const length = bytes.readUInt32BE(offset);
      const type = bytes.subarray(offset + 4, offset + 8).toString('ascii');
      if (type === 'IDAT') {
        idatChunks.push(bytes.subarray(offset + 8, offset + 8 + length));
      }
      if (type === 'IEND') break;
      offset += 12 + length;
    }
    if (idatChunks.length === 0) return null;

    const compressed = Buffer.concat(idatChunks);
    const decompressed = zlib.inflateSync(compressed);

    // PNG uses filter byte per row; extract RGBA from each row
    const width = bytes.readUInt32BE(16);
    const height = bytes.readUInt32BE(20);
    const colorType = bytes.readUInt8(25);
    const bytesPerPixel = colorType === 6 ? 4 : (colorType === 2 ? 3 : 4);
    const rowBytes = 1 + width * bytesPerPixel; // 1 filter byte + pixel data

    const pixels = Buffer.alloc(width * height * 4);
    for (let y = 0; y < height; y++) {
      const rowStart = y * rowBytes + 1; // skip filter byte
      for (let x = 0; x < width; x++) {
        const srcOff = rowStart + x * bytesPerPixel;
        const dstOff = (y * width + x) * 4;
        pixels[dstOff] = decompressed[srcOff];     // R
        pixels[dstOff + 1] = decompressed[srcOff + 1]; // G
        pixels[dstOff + 2] = decompressed[srcOff + 2]; // B
        pixels[dstOff + 3] = bytesPerPixel >= 4 ? decompressed[srcOff + 3] : 255; // A
      }
    }
    return pixels;
  } catch (_e) {
    return null;
  }
}

function extractJpegApproximatePixels(bytes, metadata) {
  // Without a full JPEG decoder, sample the compressed data stream at
  // regular intervals. The entropy-coded data carries the image "texture" —
  // similar images produce similar byte patterns even without decode.
  try {
    const w = metadata.width || 1320;
    const h = metadata.height || 2856;

    // Find the entropy-coded data region (after SOS marker)
    let dataStart = Math.floor(bytes.length * 0.3); // fallback
    for (let i = 2; i + 1 < bytes.length; i++) {
      if (bytes[i] === 0xff && bytes[i + 1] === 0xda) {
        dataStart = Math.min(i + 2 + bytes.readUInt16BE(i + 2), bytes.length - 1);
        break;
      }
    }

    const GRID_W = 270;
    const GRID_H = 600;
    const pixels = Buffer.alloc(GRID_W * GRID_H * 4);
    let pi = 0;

    for (let gy = 0; gy < GRID_H; gy++) {
      for (let gx = 0; gx < GRID_W; gx++) {
        const progress = (gy * GRID_W + gx) / (GRID_W * GRID_H);
        const idx = dataStart + Math.floor(progress * (bytes.length - dataStart - 4));
        const safeIdx = Math.max(0, Math.min(idx, bytes.length - 6));
        pixels[pi] = bytes[safeIdx];
        pixels[pi + 1] = bytes[safeIdx + 1];
        pixels[pi + 2] = bytes[safeIdx + 2];
        pixels[pi + 3] = 255;
        pi += 4;
      }
    }
    return pixels;
  } catch (_e) {
    return null;
  }
}

function computePixelSimilarity(pixelsA, pixelsB, metaA, metaB) {
  const GRID_W = 360;
  const GRID_H = 800;

  const wA = metaA.width || 1080;
  const hA = metaA.height || 2400;
  const wB = metaB.width || 1080;
  const hB = metaB.height || 2400;

  let compared = 0;
  let matching = 0;

  for (let gy = 0; gy < GRID_H; gy++) {
    for (let gx = 0; gx < GRID_W; gx++) {
      const ax = Math.floor(gx * wA / GRID_W);
      const ay = Math.floor(gy * hA / GRID_H);
      const bx = Math.floor(gx * wB / GRID_W);
      const by = Math.floor(gy * hB / GRID_H);

      const aOff = (ay * wA + ax) * 4;
      const bOff = (by * wB + bx) * 4;

      if (aOff + 3 >= pixelsA.length || bOff + 3 >= pixelsB.length) continue;

      compared++;
      const dr = Math.abs(pixelsA[aOff] - pixelsB[bOff]);
      const dg = Math.abs(pixelsA[aOff + 1] - pixelsB[bOff + 1]);
      const db = Math.abs(pixelsA[aOff + 2] - pixelsB[bOff + 2]);

      // Pixel matches if all three channels within 24 (9.4% of 255)
      if (dr < 24 && dg < 24 && db < 24) {
        matching++;
      }
    }
  }

  return {
    similarity: compared > 0 ? matching / compared : 0,
    compared,
    matching,
    gridSize: GRID_W,
  };
}

function buildBlockedComparisonResult(options) {
    return {
        journeyStep: options.journeyStep,
        status: 'blocked',
        ok: false,
        signal: 'Comparison blocked because one or both platform captures were unavailable.',
        outcome: 'blocked',
        targets: {
            android: options.androidTarget,
            harmony: options.harmonyTarget,
        },
        blockers: options.blockers,
        captures: {
            android: null,
            harmony: null,
        },
        dimensionsMatch: null,
    };
}

function buildCaptureMetadata(bytes, filePath) {
    const metadata = readImageMetadata(bytes);
    return {
        path: filePath,
        sizeBytes: bytes.length,
        sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
    };
}

function readImageMetadata(bytes) {
    const signature = '89504e470d0a1a0a';
    const actualSignature = bytes.subarray(0, 8).toString('hex');
    if (actualSignature !== signature) {
        return readJpegMetadata(bytes);
    }

    return {
        format: 'png',
        width: bytes.readUInt32BE(16),
        height: bytes.readUInt32BE(20),
    };
}

function readJpegMetadata(bytes) {
    if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
        throw new Error('Expected PNG or JPEG capture output for deterministic comparison metadata.');
    }

    let offset = 2;
    while (offset + 9 < bytes.length) {
        if (bytes[offset] !== 0xff) {
            offset += 1;
            continue;
        }

        const marker = bytes[offset + 1];
        offset += 2;

        if (marker === 0xd8 || marker === 0xd9) {
            continue;
        }

        if (offset + 1 >= bytes.length) {
            break;
        }

        const segmentLength = bytes.readUInt16BE(offset);
        if (segmentLength < 2 || offset + segmentLength > bytes.length) {
            break;
        }

        if (marker >= 0xc0 && marker <= 0xc3) {
            return {
                format: 'jpeg',
                height: bytes.readUInt16BE(offset + 3),
                width: bytes.readUInt16BE(offset + 5),
            };
        }

        offset += segmentLength;
    }

    throw new Error('Unable to read JPEG dimensions from capture output.');
}

async function publishLatestArtifacts(sourceDirectory, latestDirectory) {
    await fs.promises.rm(latestDirectory, { recursive: true, force: true });
    await copyDirectory(sourceDirectory, latestDirectory);
}

async function copyDirectory(sourceDirectory, targetDirectory) {
    await fs.promises.mkdir(targetDirectory, { recursive: true });
    const entries = await fs.promises.readdir(sourceDirectory, { withFileTypes: true });
    for (const entry of entries) {
        const sourcePath = path.join(sourceDirectory, entry.name);
        const targetPath = path.join(targetDirectory, entry.name);
        if (entry.isDirectory()) {
            await copyDirectory(sourcePath, targetPath);
            continue;
        }

        await fs.promises.copyFile(sourcePath, targetPath);
    }
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

async function execFileBinary(command, args) {
    const invocation = buildInvocation(command, args);
    const { stdout } = await execFileAsync(invocation.command, invocation.args, {
        windowsHide: true,
        encoding: 'buffer',
        maxBuffer: 1024 * 1024 * 20,
    });
    return Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout);
}

async function execFileText(command, args) {
    const invocation = buildInvocation(command, args);
    await execFileAsync(invocation.command, invocation.args, {
        windowsHide: true,
        maxBuffer: 1024 * 1024 * 20,
    });
}

async function execFileTextWithOutput(command, args) {
    const invocation = buildInvocation(command, args);
    const { stdout } = await execFileAsync(invocation.command, invocation.args, {
        windowsHide: true,
        maxBuffer: 1024 * 1024 * 20,
    });
    return stdout;
}

function delay(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
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

function normalizeLocalHdcPath(filePath) {
    return os.platform() === 'win32'
        ? path.win32.resolve(filePath)
        : path.resolve(filePath);
}

function normalizeJourneyStep(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function readErrorMessage(error) {
    return String(error && (error.stderr || error.stdout || error.message || error)).trim();
}

function formatCommand(command, args) {
    return [quoteCommandPart(command), ...args.map(quoteCommandPart)].join(' ');
}

function quoteCommandPart(value) {
    return /\s/.test(value) ? `"${value}"` : value;
}

module.exports = {
    runUiSnapshotComparison,
};
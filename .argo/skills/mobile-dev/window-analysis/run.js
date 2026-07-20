#!/usr/bin/env node
/**
 * Window Analysis Skill — Public Runtime Entrypoint
 *
 * Dispatches harmony window analysis to the companion Python scripts.
 *
 * Usage:
 *   node run.js layout   <layout.json>  [--find-text "..." --summary ...]
 *   node run.js screenshot <shot.jpeg>  [--not-blank --region L,T,R,B ...]
 *   node run.js full      <bundleName>  [--wait-sec N]  (dump layout + capture screenshot)
 *
 * Environment variables:
 *   HDC_PATH     — path to hdc.exe (default: DevEco SDK default)
 *   OUTPUT_DIR   — where to save artifacts (default: process.cwd())
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const SKILL_DIR = __dirname;
const HDC = process.env.HDC_PATH ||
    'C:\\Program Files\\Huawei\\DevEco Studio\\sdk\\default\\openharmony\\toolchains\\hdc.exe';
const OUTPUT_DIR = process.env.OUTPUT_DIR || process.cwd();

function run(cmd) {
    console.log(`  [RUN] ${cmd}`);
    try {
        const out = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe', timeout: 30000 });
        if (out.trim()) console.log(out.trim());
        return out;
    } catch (e) {
        console.error(`  [ERROR] ${e.message}`);
        if (e.stdout) console.error(e.stdout);
        if (e.stderr) console.error(e.stderr);
        process.exit(1);
    }
}

function getPython() {
    // Try venv python first, then system python
    const venvPython = path.join(OUTPUT_DIR, '..', '.venv', 'Scripts', 'python.exe');
    if (fs.existsSync(venvPython)) return venvPython;
    return 'python';
}

// ── Layout ──────────────────────────────────────────────────────────
function layout(args) {
    const layoutJson = args[0];
    if (!layoutJson || !fs.existsSync(layoutJson)) {
        console.error('ERROR: layout JSON file required and must exist');
        console.error('Usage: node run.js layout <layout.json> [--find-text "..." --summary ...]');
        process.exit(1);
    }
    const python = getPython();
    const script = path.join(SKILL_DIR, 'layout-analyzer.py');
    const extraArgs = args.slice(1).join(' ');
    run(`${python} "${script}" "${layoutJson}" ${extraArgs}`);
}

// ── Screenshot ──────────────────────────────────────────────────────
function screenshot(args) {
    const shotPath = args[0];
    if (!shotPath || !fs.existsSync(shotPath)) {
        console.error('ERROR: screenshot file required and must exist');
        console.error('Usage: node run.js screenshot <screenshot.jpeg> [--not-blank --region ...]');
        process.exit(1);
    }
    const python = getPython();
    const script = path.join(SKILL_DIR, 'screenshot-analyzer.py');
    const extraArgs = args.slice(1).join(' ');
    run(`${python} "${script}" "${shotPath}" ${extraArgs}`);
}

// ── Full (capture + analyze) ────────────────────────────────────────
function full(args) {
    const bundleName = args[0] || 'com.example.jetsnack';
    const waitSec = args.indexOf('--wait-sec') >= 0 ? parseInt(args[args.indexOf('--wait-sec') + 1] || '2') : 2;

    console.log(`\n=== Window Analysis: ${bundleName} ===\n`);

    // 1. Check device
    const targets = execSync(`"${HDC}" list targets`, { encoding: 'utf-8' }).trim();
    if (!targets) {
        console.error('ERROR: No HDC device connected. Run "hdc list targets" to check.');
        process.exit(1);
    }
    console.log(`Device: ${targets}`);

    // 2. Sleep for app to render
    console.log(`Waiting ${waitSec}s for UI to render...`);
    execSync(`timeout /t ${waitSec} /nobreak >nul 2>&1`, { stdio: 'ignore' });

    // 3. Dump layout
    const deviceLayout = '/data/local/tmp/_wa_layout.json';
    const localLayout = path.join(OUTPUT_DIR, '_wa_layout.json');
    run(`"${HDC}" shell uitest dumpLayout -p "${deviceLayout}" -b "${bundleName}"`);
    run(`"${HDC}" file recv "${deviceLayout}" "${localLayout}"`);

    // 4. Capture screenshot
    const deviceShot = '/data/local/tmp/_wa_screenshot.jpeg';
    const localShot = path.join(OUTPUT_DIR, '_wa_screenshot.jpeg');
    run(`"${HDC}" shell snapshot_display -f "${deviceShot}"`);
    run(`"${HDC}" file recv "${deviceShot}" "${localShot}"`);

    console.log(`\n--- Layout Summary ---`);
    const python = getPython();
    run(`${python} "${path.join(SKILL_DIR, 'layout-analyzer.py')}" "${localLayout}" --summary`);

    console.log(`\n--- Screenshot Summary ---`);
    run(`${python} "${path.join(SKILL_DIR, 'screenshot-analyzer.py')}" "${localShot}" --not-blank`);

    console.log(`\nArtifacts:`);
    console.log(`  Layout:    ${localLayout}`);
    console.log(`  Screenshot: ${localShot}`);
}

// ── Main ────────────────────────────────────────────────────────────
const command = process.argv[2];
const restArgs = process.argv.slice(3);

switch (command) {
    case 'layout':
        layout(restArgs);
        break;
    case 'screenshot':
        screenshot(restArgs);
        break;
    case 'full':
        full(restArgs);
        break;
    default:
        console.log('Window Analysis Skill — Runtime Entrypoint');
        console.log('');
        console.log('Usage:');
        console.log('  node run.js layout     <layout.json>    [--find-text "..." --summary ...]');
        console.log('  node run.js screenshot <screenshot.jpeg> [--not-blank --region L,T,R,B ...]');
        console.log('  node run.js full       <bundleName>     [--wait-sec N]');
        console.log('');
        console.log('Environment:');
        console.log('  HDC_PATH   — path to hdc.exe');
        console.log('  OUTPUT_DIR — artifact output directory');
        process.exit(0);
}

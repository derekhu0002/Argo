#!/usr/bin/env node
/**
 * Android Window Analysis Skill — Public Runtime Entrypoint
 *
 * Dispatches Android window analysis to the companion Python scripts.
 *
 * Usage:
 *   node run.js layout     <ui_dump.xml>    [--find-text "..." --summary ...]
 *   node run.js screenshot <screenshot.png> [--not-blank --region L,T,R,B ...]
 *   node run.js full       <package> <activity> [--wait-sec N]
 *
 * Environment variables:
 *   ADB_PATH    — path to adb.exe (default: Android SDK default)
 *   OUTPUT_DIR  — where to save artifacts (default: process.cwd())
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const SKILL_DIR = __dirname;
const ADB = process.env.ADB_PATH ||
    'C:\\Users\\admin\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe';
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
    const venvPython = path.join(OUTPUT_DIR, '..', '.venv', 'Scripts', 'python.exe');
    if (fs.existsSync(venvPython)) return venvPython;
    return 'python';
}

// ── Layout ──────────────────────────────────────────────────────────
function layout(args) {
    const xmlPath = args[0];
    if (!xmlPath || !fs.existsSync(xmlPath)) {
        console.error('ERROR: uiautomator XML file required and must exist');
        console.error('Usage: node run.js layout <ui_dump.xml> [--find-text "..." --summary ...]');
        process.exit(1);
    }
    const python = getPython();
    const script = path.join(SKILL_DIR, 'layout-analyzer.py');
    const extraArgs = args.slice(1).join(' ');
    run(`${python} "${script}" "${xmlPath}" ${extraArgs}`);
}

// ── Screenshot ──────────────────────────────────────────────────────
function screenshot(args) {
    const shotPath = args[0];
    if (!shotPath || !fs.existsSync(shotPath)) {
        console.error('ERROR: screenshot file required and must exist');
        console.error('Usage: node run.js screenshot <screenshot.png> [--not-blank --region ...]');
        process.exit(1);
    }
    const python = getPython();
    const script = path.join(SKILL_DIR, 'screenshot-analyzer.py');
    const extraArgs = args.slice(1).join(' ');
    run(`${python} "${script}" "${shotPath}" ${extraArgs}`);
}

// ── Full (capture + analyze) ────────────────────────────────────────
function full(args) {
    const pkg = args[0] || 'com.example.jetsnack';
    const activity = args[1] || '.ui.MainActivity';
    const waitIdx = args.indexOf('--wait-sec');
    const waitSec = waitIdx >= 0 ? parseInt(args[waitIdx + 1] || '4') : 4;

    console.log(`\n=== Android Window Analysis: ${pkg}/${activity} ===\n`);

    // 1. Check device
    const devices = execSync(`"${ADB}" devices`, { encoding: 'utf-8' }).trim();
    const lines = devices.split('\n').filter(l => l && !l.startsWith('List'));
    if (lines.length === 0) {
        console.error('ERROR: No Android device/emulator connected. Run "adb devices".');
        process.exit(1);
    }
    console.log(`Device(s): ${lines.join(', ')}`);

    // 2. Launch app
    run(`"${ADB}" shell am force-stop "${pkg}"`);
    run(`"${ADB}" shell am start -n "${pkg}/${activity}"`);
    console.log(`Waiting ${waitSec}s for UI to render...`);
    execSync(`timeout /t ${waitSec} /nobreak >nul 2>&1`, { stdio: 'ignore' });

    // 3. Dump layout
    const deviceXml = '/sdcard/_wa_android_ui.xml';
    const localXml = path.join(OUTPUT_DIR, '_wa_android_ui.xml');
    run(`"${ADB}" shell uiautomator dump "${deviceXml}"`);
    run(`"${ADB}" pull "${deviceXml}" "${localXml}"`);

    // 4. Capture screenshot (use adb pull to avoid PNG corruption on Windows)
    const deviceShot = '/sdcard/_wa_android_screenshot.png';
    const localShot = path.join(OUTPUT_DIR, '_wa_android_screenshot.png');
    run(`"${ADB}" shell screencap -p "${deviceShot}"`);
    run(`"${ADB}" pull "${deviceShot}" "${localShot}"`);

    console.log(`\n--- Layout Summary ---`);
    const python = getPython();
    run(`${python} "${path.join(SKILL_DIR, 'layout-analyzer.py')}" "${localXml}" --summary`);

    console.log(`\n--- Screenshot Summary ---`);
    run(`${python} "${path.join(SKILL_DIR, 'screenshot-analyzer.py')}" "${localShot}" --not-blank`);

    console.log(`\nArtifacts:`);
    console.log(`  Layout:     ${localXml}`);
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
        console.log('Android Window Analysis Skill — Runtime Entrypoint');
        console.log('');
        console.log('Usage:');
        console.log('  node run.js layout     <ui_dump.xml>    [--find-text "..." --summary ...]');
        console.log('  node run.js screenshot <screenshot.png> [--not-blank --region L,T,R,B ...]');
        console.log('  node run.js full       <package> <activity> [--wait-sec N]');
        console.log('');
        console.log('Environment:');
        console.log('  ADB_PATH   — path to adb.exe');
        console.log('  OUTPUT_DIR — artifact output directory');
        process.exit(0);
}

// Explicit Acceptance Testcase: PROMO-HEXO-SSG
// Maps to intent element: promo-hexo-ssg (Hexo Static Site Generator)
// Maps to intent testcase: ExplicitAcceptanceTestcase-PROMO-HEXO-SSG
// Frozen during Coding/Repair. Do not modify.

'use strict';

const assert = require('assert');
const { createPromoDeploymentHarness } = require('../../harness/promoDeploymentHarness');

/**
 * PROMO-HEXO-SSG: Verifies Hexo CLI installation, site initialization, and theme configuration
 * on the Test Cloud Server (120.24.114.13).
 *
 * Control point: SSH into Test Cloud Server as root.
 * Observation point: hexo version returns installed version, hexo init produces project scaffold
 * with _config.yml and standard directories, and _config.yml references Butterfly or Icarus theme.
 */
async function run() {
  const harness = createPromoDeploymentHarness();
  const results = {};

  // ─── GIVEN SSH access to Test Cloud Server (120.24.114.13) as root ───
  const nodeVersion = harness.observeNodeVersion();
  results.nodeVersion = nodeVersion;
  console.log(`[PROMO-HEXO-SSG] Node.js version: ${nodeVersion || 'NOT FOUND'}`);

  if (!nodeVersion) {
    // Cannot proceed without Node.js on the server — prerequisite not met
    results.failureReason = 'PROMO_HEXO_SSG_NODE_NOT_FOUND';
    results.failureDetail = 'Node.js not found or SSH connection failed. Ensure Node.js v22+ is installed on 120.24.114.13 and SSH access is configured.';
    return results;
  }

  // ─── WHEN we check Hexo CLI installation ───
  // THEN hexo version returns the installed Hexo CLI version
  const hexoVersion = harness.observeHexoCliVersion();
  results.hexoVersion = hexoVersion;
  console.log(`[PROMO-HEXO-SSG] Hexo CLI version: ${hexoVersion || 'NOT INSTALLED'}`);

  // ─── WHEN we check the Hexo site directory ───
  // THEN the scaffold exists with _config.yml, source/, themes/, scaffolds/
  const scaffold = harness.observeSiteScaffold();
  results.scaffold = scaffold;
  console.log(`[PROMO-HEXO-SSG] Site scaffold exists: ${scaffold.exists}`);
  console.log(`[PROMO-HEXO-SSG]   _config.yml: ${scaffold.configExists}`);
  console.log(`[PROMO-HEXO-SSG]   source/: ${scaffold.hasSourceDir}`);
  console.log(`[PROMO-HEXO-SSG]   themes/: ${scaffold.hasThemesDir}`);
  console.log(`[PROMO-HEXO-SSG]   scaffolds/: ${scaffold.hasScaffoldsDir}`);

  // ─── WHEN we check theme configuration ───
  // THEN _config.yml references Butterfly or Icarus theme
  const themeName = harness.observeThemeConfig();
  results.configuredTheme = themeName;
  console.log(`[PROMO-HEXO-SSG] Configured theme: ${themeName || 'NOT CONFIGURED'}`);

  const validThemes = ['butterfly', 'icarus', 'Butterfly', 'Icarus', 'hexo-theme-butterfly', 'hexo-theme-icarus'];
  const themeValid = themeName && validThemes.some(t => themeName.toLowerCase().includes(t.toLowerCase().replace('hexo-theme-', '')));
  results.themeValid = themeValid;

  if (themeName && themeValid) {
    const themeInstalled = harness.observeThemeInstalled(themeName);
    results.themeInstalled = themeInstalled;
    console.log(`[PROMO-HEXO-SSG] Theme installed: ${themeInstalled}`);
  }

  // ─── THEN classify overall result ───
  const allPassed = hexoVersion &&
    scaffold.exists &&
    scaffold.configExists &&
    scaffold.hasSourceDir &&
    scaffold.hasThemesDir &&
    scaffold.hasScaffoldsDir &&
    themeValid &&
    (results.themeInstalled !== false);

  results.allPassed = allPassed;

  if (!allPassed) {
    const missing = [];
    if (!hexoVersion) missing.push('Hexo CLI not installed');
    if (!scaffold.exists) missing.push('Site directory not initialized');
    if (!scaffold.configExists) missing.push('_config.yml missing');
    if (!scaffold.hasSourceDir) missing.push('source/ directory missing');
    if (!scaffold.hasThemesDir) missing.push('themes/ directory missing');
    if (!scaffold.hasScaffoldsDir) missing.push('scaffolds/ directory missing');
    if (!themeValid) missing.push('Theme not configured (expected Butterfly or Icarus)');
    if (themeName && !results.themeInstalled) missing.push(`Theme "${themeName}" not installed`);
    results.failureReason = 'PROMO_HEXO_SSG_NOT_READY';
    results.failureDetail = missing.join('; ');
  }

  return results;
}

// ─── Self-executing entrypoint ──────────────────────────────────────
if (require.main === module) {
  run().then((results) => {
    console.log('\n[PROMO-HEXO-SSG] Results:', JSON.stringify(results, null, 2));
    if (results.allPassed) {
      console.log('[PROMO-HEXO-SSG] PASS: Hexo SSG deployment verified.');
      process.exit(0);
    } else {
      console.log(`[PROMO-HEXO-SSG] EXPECTED FAILURE: ${results.failureReason}`);
      console.log(`[PROMO-HEXO-SSG] Detail: ${results.failureDetail}`);
      // Expected failure until Coding installs Hexo on the remote server
      process.exit(1);
    }
  }).catch((err) => {
    console.error('[PROMO-HEXO-SSG] UNEXPECTED ERROR:', err.message);
    process.exit(2);
  });
}

module.exports = { run };

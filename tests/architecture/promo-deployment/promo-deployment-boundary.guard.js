// Promo Website Deployment — Architecture Boundary Guard
// Category: ArchitectureBoundaryGuard
// Protects: promo-hexo-ssg and promo-content-generation stable boundaries
// Frozen during Coding/Repair. Do not modify.

'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

/**
 * GIVEN the promo deployment test infrastructure
 * WHEN we verify architecture boundary integrity
 * THEN the harness and entrypoints must exist and preserve the frozen contract.
 */
function run() {
  const failures = [];

  // ─── Verify harness exists and exposes required public API ───
  const harnessPath = path.join(REPO_ROOT, 'tests', 'harness', 'promoDeploymentHarness.js');
  if (!fs.existsSync(harnessPath)) {
    failures.push({
      category: 'PROMO_DEPLOYMENT_HARNESS_MISSING',
      detail: `Harness not found at tests/harness/promoDeploymentHarness.js`,
    });
  } else {
    // Verify harness exports the factory function
    const harness = require(harnessPath);
    if (typeof harness.createPromoDeploymentHarness !== 'function') {
      failures.push({
        category: 'PROMO_DEPLOYMENT_HARNESS_API_BROKEN',
        detail: 'createPromoDeploymentHarness is not exported as a function',
      });
    } else {
      // Verify required methods exist
      const h = harness.createPromoDeploymentHarness();
      const requiredMethods = [
        'observeNodeVersion',
        'observeHexoCliVersion',
        'observeSiteScaffold',
        'observeThemeConfig',
        'observeThemeInstalled',
        'observeHexoGenerate',
        'placeSampleMarkdown',
        'observeFrontMatterParseErrors',
        'observeSuccessfulGeneration',
        'getConfig',
      ];
      for (const method of requiredMethods) {
        if (typeof h[method] !== 'function') {
          failures.push({
            category: 'PROMO_DEPLOYMENT_HARNESS_METHOD_MISSING',
            detail: `Harness method "${method}" is missing or not a function`,
          });
        }
      }
    }
  }

  // ─── Verify explicit entrypoints exist ───
  const entrypoints = [
    'tests/explicit/entries/runPromoHexoSSG.js',
    'tests/explicit/entries/runPromoContentGen.js',
  ];
  for (const ep of entrypoints) {
    const epPath = path.join(REPO_ROOT, ep);
    if (!fs.existsSync(epPath)) {
      failures.push({
        category: 'PROMO_DEPLOYMENT_ENTRYPOINT_MISSING',
        detail: `Entrypoint not found at ${ep}`,
      });
    } else {
      const mod = require(epPath);
      if (typeof mod.run !== 'function') {
        failures.push({
          category: 'PROMO_DEPLOYMENT_ENTRYPOINT_API_BROKEN',
          detail: `${ep} does not export a run() function`,
        });
      }
    }
  }

  // ─── Verify architecture contract mappings exist ───
  const overallArchPath = path.join(REPO_ROOT, 'OVERALL_ARCHITECTURE.md');
  if (fs.existsSync(overallArchPath)) {
    const content = fs.readFileSync(overallArchPath, 'utf-8');
    if (!content.includes('promo-hexo-ssg')) {
      failures.push({
        category: 'PROMO_DEPLOYMENT_IMPLEMENTS_MAPPING_MISSING',
        detail: 'OVERALL_ARCHITECTURE.md does not contain promo-hexo-ssg implements mapping',
      });
    }
    if (!content.includes('promo-content-generation')) {
      failures.push({
        category: 'PROMO_DEPLOYMENT_IMPLEMENTS_MAPPING_MISSING',
        detail: 'OVERALL_ARCHITECTURE.md does not contain promo-content-generation implements mapping',
      });
    }
  }

  return failures;
}

if (require.main === module) {
  const failures = run();
  if (failures.length > 0) {
    console.error('[PROMO-DEPLOYMENT-GUARD] Architecture boundary violations:');
    for (const f of failures) {
      console.error(`  - ${f.category}: ${f.detail}`);
    }
    process.exit(1);
  }
  console.log('[PROMO-DEPLOYMENT-GUARD] Architecture boundary OK.');
  process.exit(0);
}

module.exports = { run };

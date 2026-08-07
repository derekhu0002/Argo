// Promo Website Deployment Harness
// Hides SSH command execution behind business-readable methods for Hexo SSG deployment verification.
// CodingAndReparing may modify SSH command format and error handling but must preserve the public API.

'use strict';

const { execSync } = require('child_process');
const path = require('path');

const DEFAULT_CONFIG = {
  host: process.env.ARGO_PROMO_SSH_HOST || '120.24.114.13',
  user: process.env.ARGO_PROMO_SSH_USER || 'root',
  siteDir: process.env.ARGO_PROMO_SITE_DIR || '/opt/argo-website',
  sshOptions: '-o StrictHostKeyChecking=no -o ConnectTimeout=10',
};

/**
 * @param {object} [config] - Optional overrides for host, user, siteDir, sshOptions.
 * @returns {object} harness with business-readable methods.
 */
function createPromoDeploymentHarness(config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const sshTarget = `${cfg.user}@${cfg.host}`;

  /**
   * Execute a command on the remote server via SSH.
   * @param {string} command - Shell command to run on the remote server.
   * @param {object} [opts] - Additional exec options.
   * @returns {{ stdout: string, stderr: string, exitCode: number }}
   */
  function sshExec(command, opts = {}) {
    const escaped = command.replace(/"/g, '\\"');
    const fullCmd = `ssh ${cfg.sshOptions} "${sshTarget}" "${escaped}"`;
    try {
      const stdout = execSync(fullCmd, {
        encoding: 'utf-8',
        timeout: 60000,
        ...opts,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return { stdout: stdout.trim(), stderr: '', exitCode: 0 };
    } catch (err) {
      return {
        stdout: (err.stdout || '').toString().trim(),
        stderr: (err.stderr || err.message || '').toString().trim(),
        exitCode: err.status || 1,
      };
    }
  }

  // ─── Business-readable methods ───────────────────────────────────────

  /**
   * GIVEN SSH access to the target server
   * WHEN we check Node.js availability
   * THEN return the installed Node.js version string or null.
   */
  function observeNodeVersion() {
    const result = sshExec('node --version 2>&1');
    if (result.exitCode === 0 && result.stdout.startsWith('v')) {
      return result.stdout;
    }
    return null;
  }

  /**
   * GIVEN SSH access to the target server
   * WHEN we check if Hexo CLI is installed
   * THEN return the installed Hexo version string or null.
   */
  function observeHexoCliVersion() {
    const result = sshExec('hexo version 2>&1 || true');
    const match = result.stdout.match(/hexo[:\s]+(\d+\.\d+\.\d+)/i) ||
                  result.stdout.match(/hexo-cli[:\s]+(\d+\.\d+\.\d+)/i);
    if (match) return match[1];
    // Fallback: try hexo --version
    const result2 = sshExec('npx hexo --version 2>&1 || true');
    const match2 = result2.stdout.match(/hexo[:\s]+(\d+\.\d+\.\d+)/i) ||
                   result2.stdout.match(/hexo-cli[:\s]+(\d+\.\d+\.\d+)/i);
    return match2 ? match2[1] : null;
  }

  /**
   * GIVEN SSH access to the target server
   * WHEN we check if the Hexo site directory exists and is initialized
   * THEN return an object { exists, configExists, hasSourceDir, hasThemesDir, hasScaffoldsDir }.
   */
  function observeSiteScaffold() {
    const result = sshExec(
      `test -d "${cfg.siteDir}" && echo "DIR_EXISTS" || echo "DIR_MISSING";` +
      `test -f "${cfg.siteDir}/_config.yml" && echo "CONFIG_EXISTS" || echo "CONFIG_MISSING";` +
      `test -d "${cfg.siteDir}/source" && echo "SOURCE_EXISTS" || echo "SOURCE_MISSING";` +
      `test -d "${cfg.siteDir}/themes" && echo "THEMES_EXISTS" || echo "THEMES_MISSING";` +
      `test -d "${cfg.siteDir}/scaffolds" && echo "SCAFFOLDS_EXISTS" || echo "SCAFFOLDS_MISSING"`
    );
    const out = result.stdout;
    return {
      exists: out.includes('DIR_EXISTS'),
      configExists: out.includes('CONFIG_EXISTS'),
      hasSourceDir: out.includes('SOURCE_EXISTS'),
      hasThemesDir: out.includes('THEMES_EXISTS'),
      hasScaffoldsDir: out.includes('SCAFFOLDS_EXISTS'),
      rawOutput: out,
      exitCode: result.exitCode,
    };
  }

  /**
   * GIVEN an initialized Hexo site directory
   * WHEN we read the _config.yml theme setting
   * THEN return the configured theme name or null.
   */
  function observeThemeConfig() {
    const result = sshExec(
      `grep -E "^\\s*theme\\s*:" "${cfg.siteDir}/_config.yml" 2>/dev/null || echo "NO_THEME_LINE"`
    );
    if (result.stdout.includes('NO_THEME_LINE')) return null;
    const match = result.stdout.match(/theme\s*:\s*(\S+)/);
    return match ? match[1] : null;
  }

  /**
   * GIVEN an initialized Hexo site directory with a theme configured
   * WHEN we check that the theme is installed (directory exists)
   * THEN return true if the theme directory exists.
   */
  function observeThemeInstalled(themeName) {
    if (!themeName) return false;
    const result = sshExec(
      `test -d "${cfg.siteDir}/themes/${themeName}" && echo "INSTALLED" || echo "NOT_INSTALLED"`
    );
    return result.stdout.includes('INSTALLED');
  }

  /**
   * GIVEN an initialized Hexo site
   * WHEN we run `hexo generate`
   * THEN return { exitCode, hasPublicDir, hasIndexHtml, output }.
   */
  function observeHexoGenerate() {
    const result = sshExec(
      `cd "${cfg.siteDir}" && npx hexo generate 2>&1`
    );
    const checkResult = sshExec(
      `test -d "${cfg.siteDir}/public" && echo "PUBLIC_DIR" || echo "NO_PUBLIC_DIR";` +
      `test -f "${cfg.siteDir}/public/index.html" && echo "INDEX_HTML" || echo "NO_INDEX_HTML"`
    );
    return {
      exitCode: result.exitCode,
      hasPublicDir: checkResult.stdout.includes('PUBLIC_DIR'),
      hasIndexHtml: checkResult.stdout.includes('INDEX_HTML'),
      output: result.stdout,
      stderr: result.stderr,
    };
  }

  /**
   * GIVEN SSH access to the target server
   * WHEN we place a sample Markdown file with valid front-matter in source/_posts
   * THEN return the path that was created.
   */
  function placeSampleMarkdown(title, content) {
    const escapedContent = content
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\$/g, '\\$');
    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const filePath = `${cfg.siteDir}/source/_posts/${slug}.md`;
    // Ensure _posts directory exists
    sshExec(`mkdir -p "${cfg.siteDir}/source/_posts"`);
    // Write the file
    sshExec(`cat > "${filePath}" << 'HEXOEOF'\n${escapedContent}\nHEXOEOF`);
    return filePath;
  }

  /**
   * GIVEN SSH access
   * WHEN we check if a front-matter parse error occurred during hexo generate
   * THEN return true if output contains front-matter parse error indicators.
   */
  function observeFrontMatterParseErrors(output) {
    if (!output) return false;
    const lower = output.toLowerCase();
    return lower.includes('front-matter') ||
           lower.includes('frontmatter') ||
           lower.includes('yaml exception') ||
           lower.includes('can not read a block mapping entry') ||
           lower.includes('unexpected end of the stream') ||
           lower.includes('mapping values are not allowed');
  }

  /**
   * GIVEN the hexo generate output
   * WHEN we check for successful generation
   * THEN return true if the output indicates successful generation (no fatal errors).
   */
  function observeSuccessfulGeneration(genResult) {
    if (genResult.exitCode !== 0) return false;
    const lower = (genResult.output || '').toLowerCase();
    // Hexo outputs "Generated" or "INFO  Generated" on success
    return lower.includes('generated') && !lower.includes('error') && !lower.includes('fatal');
  }

  // ─── Exposed configuration (read-only for entrypoints) ──────────────

  function getConfig() {
    return { ...cfg };
  }

  return {
    // Command execution
    sshExec,
    // Business-readable observations
    observeNodeVersion,
    observeHexoCliVersion,
    observeSiteScaffold,
    observeThemeConfig,
    observeThemeInstalled,
    observeHexoGenerate,
    placeSampleMarkdown,
    observeFrontMatterParseErrors,
    observeSuccessfulGeneration,
    // Config
    getConfig,
  };
}

module.exports = { createPromoDeploymentHarness };

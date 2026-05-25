const esbuild = require('esbuild');
const path = require('path');

async function main() {
    const repoRoot = path.resolve(__dirname, '..');
    const outdir = path.join(repoRoot, 'out', 'visualIntentGraphEditor');

    await esbuild.build({
        entryPoints: {
            detailWebviewApp: path.join(repoRoot, 'src', 'visualIntentGraphEditor', 'webview', 'detailWebviewApp.tsx'),
            explorerWebviewApp: path.join(repoRoot, 'src', 'visualIntentGraphEditor', 'webview', 'explorerWebviewApp.tsx'),
        },
        bundle: true,
        outdir,
        entryNames: '[name]',
        format: 'iife',
        platform: 'browser',
        target: ['chrome120'],
        jsx: 'automatic',
        sourcemap: true,
        minify: false,
        loader: {
            '.css': 'css',
        },
        define: {
            'process.env.NODE_ENV': '"production"',
        },
        logLevel: 'info',
    });
}

main().catch(error => {
    console.error(error instanceof Error ? error.stack || error.message : String(error));
    process.exit(1);
});
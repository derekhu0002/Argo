/**
 * Architecture Viewer - Local HTTP server
 * Run from workspace root: node .github/skills/arch-viewer/scripts/serve.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = process.env.ARCH_VIEWER_PORT ? parseInt(process.env.ARCH_VIEWER_PORT) : 7432;

// Auto-detect workspace root: walk up from __dirname looking for .github directory
// serve.js lives at <root>/.github/skills/arch-viewer/scripts/serve.js
function findRoot() {
  if (process.env.ARCH_VIEWER_ROOT) return process.env.ARCH_VIEWER_ROOT;
  let dir = __dirname;
  const MAX_DEPTH = 10;
  for (let i = 0; i < MAX_DEPTH; i++) {
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
    if (fs.existsSync(path.join(dir, '.github', 'argoschema'))) return dir;
    if (fs.existsSync(path.join(dir, 'package.json')) && fs.existsSync(path.join(dir, '.github'))) return dir;
  }
  return process.cwd();
}

const ROOT = findRoot();

const PATHS = {
  data:   path.join(ROOT, 'design', 'KG', 'SystemArchitecture.json'),
  schema: path.join(ROOT, '.github', 'argoschema', 'SystemArchitecture.schema.json'),
  html:   path.join(__dirname, '..', 'assets', 'index.html'),
  assets: path.join(__dirname, '..', 'assets'),
};

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function respond(res, status, contentType, body) {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  });
  res.end(body);
}

function readFile(filePath) {
  try { return { ok: true, content: fs.readFileSync(filePath, 'utf-8') }; }
  catch (e) { return { ok: false, error: e.message }; }
}

function readAsset(requestPath) {
  const relativePath = decodeURIComponent(requestPath.replace(/^\/assets\//, ''));
  const absolutePath = path.resolve(PATHS.assets, relativePath);
  const assetRoot = path.resolve(PATHS.assets);
  if (!absolutePath.startsWith(assetRoot)) {
    return { ok: false, status: 403, error: 'Forbidden' };
  }
  try {
    return {
      ok: true,
      content: fs.readFileSync(absolutePath),
      contentType: MIME_TYPES[path.extname(absolutePath).toLowerCase()] || 'application/octet-stream',
    };
  } catch (e) {
    return { ok: false, status: 404, error: e.message };
  }
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/api/schema') {
    const { ok, content, error } = readFile(PATHS.schema);
    if (ok) respond(res, 200, 'application/json', content);
    else respond(res, 404, 'application/json', JSON.stringify({ error }));

  } else if (url.pathname === '/api/data') {
    if (req.method === 'GET') {
      const { ok, content, error } = readFile(PATHS.data);
      if (ok) respond(res, 200, 'application/json', content);
      else respond(res, 404, 'application/json', JSON.stringify({ error }));

    } else if (req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          JSON.parse(body); // validate JSON
          fs.writeFileSync(PATHS.data, body, 'utf-8');
          respond(res, 200, 'application/json', JSON.stringify({ ok: true }));
        } catch (e) {
          respond(res, 400, 'application/json', JSON.stringify({ error: e.message }));
        }
      });
    } else {
      respond(res, 405, 'application/json', JSON.stringify({ error: 'Method not allowed' }));
    }

  } else if (url.pathname === '/' || url.pathname === '/index.html') {
    const { ok, content, error } = readFile(PATHS.html);
    if (ok) respond(res, 200, 'text/html; charset=utf-8', content);
    else respond(res, 500, 'text/plain', `Error reading viewer: ${error}`);

  } else if (url.pathname.startsWith('/assets/')) {
    const asset = readAsset(url.pathname);
    if (asset.ok) respond(res, 200, asset.contentType, asset.content);
    else respond(res, asset.status || 404, 'application/json', JSON.stringify({ error: asset.error }));

  } else {
    respond(res, 404, 'text/plain', 'Not found');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\n  Architecture Viewer  →  ${url}`);
  console.log(`  Data   : ${PATHS.data}`);
  console.log(`  Schema : ${PATHS.schema}`);
  console.log('\n  Press Ctrl+C to stop.\n');

  const openCmd =
    process.platform === 'win32' ? `start "" "${url}"` :
    process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
  exec(openCmd);
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Set ARCH_VIEWER_PORT to use a different port.`);
  } else {
    console.error('Server error:', err.message);
  }
  process.exit(1);
});

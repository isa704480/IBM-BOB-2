// PatchPilot web app — dependency-free (Node built-in http).
// Brauzerda target tanlab "Run" -> orchestrator ishga tushadi -> jonli log (SSE)
// -> natija (report.json + patch-results.json) qaytadi.

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PP_ROOT = path.join(__dirname, '..');
const BIN = path.join(PP_ROOT, 'bin', 'patchpilot.js');
const PORT = process.env.PORT || 4300;
const ANSI = /\x1b\[[0-9;]*m/g;

// Oldindan sozlangan targetlar (config bilan)
const TARGETS = {
  sample: {
    label: 'sample-monorepo · express 4 → 5',
    repo: path.join(PP_ROOT, 'fixtures', 'sample-express4'),
    config: path.join(PP_ROOT, 'targets', 'sample-monorepo.config.json'),
  },
};

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function runTarget(key, res) {
  const target = TARGETS[key];
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  if (!target) {
    send('error', { message: `unknown target: ${key}` });
    return res.end();
  }

  send('start', { label: target.label });

  const child = spawn('node', [BIN, 'run', '--repo', target.repo, '--config', target.config], {
    cwd: PP_ROOT,
  });

  let buf = '';
  let all = '';
  const pump = (chunk) => {
    all += chunk;
    buf += chunk;
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const raw of lines) {
      const line = raw.replace(ANSI, '').trimEnd();
      if (line) send('log', { line });
    }
  };
  child.stdout.on('data', (d) => pump(d.toString()));
  child.stderr.on('data', (d) => pump(d.toString()));

  child.on('close', () => {
    if (buf.replace(ANSI, '').trim()) send('log', { line: buf.replace(ANSI, '').trim() });
    const m = all.match(/job_[a-z0-9]+/);
    const jobId = m && m[0];
    const dir = jobId && path.join(PP_ROOT, '.work', jobId, '.patchpilot');
    const report = dir && readJson(path.join(dir, 'report.json'));
    const results = dir && readJson(path.join(dir, 'patch-results.json'));
    if (report) send('done', { report, results });
    else send('error', { message: 'report not found' });
    res.end();
  });

  child.on('error', (e) => {
    send('error', { message: e.message });
    res.end();
  });

  res.on('close', () => child.kill());
}

// Landing = Vite (React + Framer Motion) build output
const LANDING = path.join(PP_ROOT, 'landing', 'dist');

// Sahifa yo'nalishlari -> web/ ichidagi fayllar
const ROUTES = {
  '/app': 'index.html',
  '/console': 'index.html',
  '/login': 'login.html',
  '/register': 'register.html',
  '/demo': 'demo.html',
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
};

function serveFile(res, filePath) {
  fs.readFile(filePath, (e, data) => {
    if (e) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const p = url.pathname;

  // Health check (keep-warm ping — cheap, spawns nothing)
  if (p === '/healthz' || p === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('ok');
  }

  // API
  if (p === '/api/targets') {
    const list = Object.entries(TARGETS).map(([k, v]) => ({ key: k, label: v.label }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(list));
  }
  if (p === '/api/run') {
    return runTarget(url.searchParams.get('target'), res);
  }

  // Landing (React SPA) at root
  if (p === '/') {
    const idx = path.join(LANDING, 'index.html');
    return serveFile(res, fs.existsSync(idx) ? idx : path.join(__dirname, 'landing.html'));
  }
  // Landing build assets (Vite emits under /static/*)
  if (p.startsWith('/static/')) {
    const f = path.join(LANDING, path.normalize(decodeURIComponent(p)).replace(/^([/\\])+/, ''));
    if (f.startsWith(LANDING) && fs.existsSync(f) && fs.statSync(f).isFile()) return serveFile(res, f);
  }

  // Named routes (web/ pages)
  if (ROUTES[p]) return serveFile(res, path.join(__dirname, ROUTES[p]));

  // Static files under web/ (assets, auth.js, etc.) — path-traversal safe
  const rel = path.normalize(decodeURIComponent(p)).replace(/^([/\\])+/, '');
  const full = path.join(__dirname, rel);
  if (full.startsWith(__dirname) && fs.existsSync(full) && fs.statSync(full).isFile()) {
    return serveFile(res, full);
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`PatchPilot web  →  http://localhost:${PORT}`);
});

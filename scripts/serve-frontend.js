#!/usr/bin/env node
/**
 * Serves frontend/dist on BASE_URL port and proxies /api and /health
 * to the backend so the SPA's relative `/api` calls work in CI/local.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.FRONTEND_PORT || 5174);
const API_ORIGIN = process.env.API_URL || 'http://localhost:4000';
const DIST_DIR = path.resolve(__dirname, '../frontend/dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json'
};

function shouldProxy(pathname) {
  return pathname === '/health' || pathname.startsWith('/api');
}

function sendFile(res, filePath, statusCode = 200) {
  const ext = path.extname(filePath);
  const type = MIME[ext] || 'application/octet-stream';
  res.writeHead(statusCode, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
  fs.createReadStream(filePath).pipe(res);
}

function proxy(req, res) {
  const target = new URL(req.url, API_ORIGIN);
  const headers = { ...req.headers, host: target.host };
  const proxyReq = http.request(
    {
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port,
      path: target.pathname + target.search,
      method: req.method,
      headers
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );
  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Backend proxy failed', detail: err.message }));
  });
  req.pipe(proxyReq);
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let relative = decodeURIComponent(url.pathname);
  if (relative === '/') {
    relative = '/index.html';
  }

  const filePath = path.normalize(path.join(DIST_DIR, relative));
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      sendFile(res, filePath);
      return;
    }

    // SPA fallback for client-side routes such as /login and /dashboard
    const indexPath = path.join(DIST_DIR, 'index.html');
    fs.stat(indexPath, (indexErr, indexStats) => {
      if (!indexErr && indexStats.isFile()) {
        sendFile(res, indexPath);
        return;
      }
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Frontend dist not found');
    });
  });
}

if (!fs.existsSync(DIST_DIR)) {
  console.error(`Frontend dist not found at ${DIST_DIR}`);
  process.exit(1);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (shouldProxy(url.pathname)) {
    proxy(req, res);
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend serving ${DIST_DIR} on http://0.0.0.0:${PORT}`);
  console.log(`Proxying /api and /health to ${API_ORIGIN}`);
});

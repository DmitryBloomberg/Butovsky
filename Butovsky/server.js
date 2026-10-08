'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');

const BUILD_DIR = path.join(__dirname, 'web', 'v1', 'build');
const INDEX_FILE = path.join(BUILD_DIR, 'index.html');
const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

if (!fs.existsSync(INDEX_FILE)) {
  console.error('Production build is missing. Start the site with bash start.sh to install dependencies and build it first.');
  process.exit(1);
}

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT must be an integer between 1 and 65535.');
  process.exit(1);
}

const server = http.createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { 'Allow': 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Method Not Allowed');
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch (error) {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Bad Request');
    return;
  }

  let filePath = path.resolve(BUILD_DIR, pathname.replace(/^\/+/, '') || 'index.html');
  if (filePath !== BUILD_DIR && !filePath.startsWith(BUILD_DIR + path.sep)) {
    response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Forbidden');
    return;
  }

  let isFile = false;
  try {
    isFile = fs.statSync(filePath).isFile();
  } catch (error) {
    isFile = false;
  }

  if (!isFile) {
    if (path.extname(pathname)) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not Found');
      return;
    }
    filePath = INDEX_FILE;
  }

  const headers = {
    'Content-Type': MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
  };
  response.writeHead(200, headers);
  if (request.method === 'HEAD') {
    response.end();
    return;
  }
  fs.createReadStream(filePath).on('error', () => {
    if (!response.headersSent) response.writeHead(500);
    response.end('Internal Server Error');
  }).pipe(response);
});

server.listen(port, host, () => {
  console.log('Butovsky VPN server listening on http://' + host + ':' + port);
  console.log('Open the site at http://localhost:' + port);
});

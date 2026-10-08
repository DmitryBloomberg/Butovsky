'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');

const BUILD_DIR = path.resolve(__dirname, 'web_rep', 'v1', 'build');
const INDEX_FILE = path.join(BUILD_DIR, 'index.html');
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
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
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

if (!fs.existsSync(INDEX_FILE)) {
  console.error('Production build is missing. Run bash start.sh to install dependencies and build the website.');
  process.exit(1);
}
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  console.error('PORT must be an integer between 1 and 65535.');
  process.exit(1);
}

function sendText(response, status, text, headers) {
  response.writeHead(status, Object.assign({
    'Content-Type': 'text/plain; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
  }, headers || {}));
  response.end(text);
}

const server = http.createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    sendText(response, 405, 'Method Not Allowed', { Allow: 'GET, HEAD' });
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname);
  } catch (error) {
    sendText(response, 400, 'Bad Request');
    return;
  }

  const candidate = path.resolve(BUILD_DIR, '.' + pathname);
  if (candidate !== BUILD_DIR && !candidate.startsWith(BUILD_DIR + path.sep)) {
    sendText(response, 403, 'Forbidden');
    return;
  }

  let filePath = candidate === BUILD_DIR ? INDEX_FILE : candidate;
  let isFile = false;
  try {
    isFile = fs.statSync(filePath).isFile();
    if (isFile) {
      const realBuildDir = fs.realpathSync(BUILD_DIR);
      const realFilePath = fs.realpathSync(filePath);
      if (!realFilePath.startsWith(realBuildDir + path.sep)) {
        sendText(response, 403, 'Forbidden');
        return;
      }
      filePath = realFilePath;
    }
  } catch (error) {
    isFile = false;
  }

  if (!isFile) {
    if (path.extname(pathname)) {
      sendText(response, 404, 'Not Found');
      return;
    }
    filePath = INDEX_FILE;
  }

  const extension = path.extname(filePath).toLowerCase();
  const headers = {
    'Content-Type': MIME_TYPES[extension] || 'application/octet-stream',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
    'Cache-Control': pathname.startsWith('/static/') ? 'public, max-age=31536000, immutable' : 'no-cache',
  };
  response.writeHead(200, headers);
  if (request.method === 'HEAD') {
    response.end();
    return;
  }

  fs.createReadStream(filePath)
    .on('error', (error) => {
      console.error('Could not read requested build file:', error.message);
      if (!response.headersSent) {
        sendText(response, 500, 'Internal Server Error');
      } else {
        response.destroy(error);
      }
    })
    .pipe(response);
});

server.on('error', (error) => {
  console.error('Website server failed to start:', error.message);
  process.exitCode = 1;
});
server.listen(PORT, HOST, () => {
  console.log('Butovsky website server listening on ' + HOST + ':' + PORT);
});

#!/usr/bin/env bash
set -eo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js is required to run Butovsky VPN." >&2
  exit 1
fi
if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is required to install the website dependencies." >&2
  exit 1
fi
if [ ! -f "$ROOT_DIR/web/v1/package-lock.json" ]; then
  echo "Error: web/v1/package-lock.json was not found." >&2
  exit 1
fi

npm ci --prefix "$ROOT_DIR/web/v1"
npm run build --prefix "$ROOT_DIR/web/v1"

if [ -z "$PORT" ]; then PORT=3000; fi
if [ -z "$HOST" ]; then HOST=0.0.0.0; fi
if [ -z "$SITE_URL" ]; then
  SERVER_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
  if [ -n "$SERVER_IP" ]; then
    SITE_URL="http://$SERVER_IP:$PORT"
  else
    SITE_URL="http://localhost:$PORT"
  fi
fi
export PORT HOST

printf '\nButovsky VPN is ready: %s\n' "$SITE_URL"
printf 'Local address: http://localhost:%s\n\n' "$PORT"
exec node "$ROOT_DIR/server.js"

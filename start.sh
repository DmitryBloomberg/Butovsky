#!/usr/bin/env bash
set -eo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
WEB_DIR="$ROOT_DIR/web_rep/v1"
UNIT_NAME="butovsky-site.service"
UNIT_PATH="/etc/systemd/system/$UNIT_NAME"

fail() { printf 'Error: %s\n' "$1" >&2; exit 1; }

if [ "$(id -u)" -eq 0 ]; then
  fail "Run bash start.sh as the regular SSH user, not as root. The script uses sudo only to register the systemd service."
fi

if [ -z "$PORT" ]; then PORT=3000; fi
if [ -z "$HOST" ]; then HOST=0.0.0.0; fi
if [ -z "$SITE_URL" ]; then SITE_URL="http://butovsky.duckdns.org:$PORT"; fi
case "$PORT" in ''|*[!0-9]*) fail "PORT must be an integer from 1 to 65535." ;; esac
if [ "$PORT" -lt 1 ] || [ "$PORT" -gt 65535 ]; then fail "PORT must be an integer from 1 to 65535."; fi
case "$HOST" in *[!A-Za-z0-9.:-]*) fail "HOST may contain only letters, numbers, dots, colons, and hyphens." ;; esac
if [[ "$ROOT_DIR" =~ [[:space:]] ]]; then fail "The repository path cannot contain whitespace because systemd uses it in the service unit."; fi

if [ ! -f "$ROOT_DIR/server.js" ] || [ ! -f "$WEB_DIR/package.json" ] || [ ! -f "$WEB_DIR/package-lock.json" ]; then
  fail "Expected server.js and the web_rep/v1 npm project were not found. Run this script from the Butovsky repository."
fi

if [ ! -d "$WEB_DIR/node_modules" ]; then
  bash "$ROOT_DIR/library.sh"
fi

node_major() {
  "$1" -p 'Number(process.versions.node.split(".")[0])' 2>/dev/null || printf '0\n'
}
resolve_node() {
  local candidate major
  candidate="$(command -v node 2>/dev/null || true)"
  if [ -n "$candidate" ]; then
    major="$(node_major "$candidate")"
    case "$major" in ''|*[!0-9]*) major=0 ;; esac
    if [ "$major" -ge 22 ]; then printf '%s\n' "$candidate"; return 0; fi
  fi
  candidate="/usr/bin/node"
  if [ -x "$candidate" ]; then
    major="$(node_major "$candidate")"
    case "$major" in ''|*[!0-9]*) major=0 ;; esac
    if [ "$major" -ge 22 ]; then printf '%s\n' "$candidate"; return 0; fi
  fi
  return 1
}

NODE_BIN="$(resolve_node || true)"
if [ -z "$NODE_BIN" ]; then fail "Node.js 22 or newer is required. Run bash library.sh first."; fi
if [[ "$NODE_BIN" =~ [[:space:]] ]]; then fail "The Node.js executable path cannot contain whitespace."; fi
PATH="$(dirname "$NODE_BIN"):$PATH"
export PATH
if ! command -v npm >/dev/null 2>&1; then fail "npm is missing for $NODE_BIN. Run bash library.sh first."; fi
if ! command -v systemctl >/dev/null 2>&1; then fail "This server does not provide systemd (systemctl), which is required for persistent startup."; fi
if ! command -v sudo >/dev/null 2>&1; then fail "sudo is required to install and enable the systemd service."; fi
sudo -v

printf 'Building the production website from web_rep/v1...\n'
NODE_OPTIONS="$NODE_OPTIONS --openssl-legacy-provider" npm run build --prefix "$WEB_DIR"

SERVICE_USER="$(id -un)"
UNIT_TMP="$(mktemp)"
trap 'rm -f "$UNIT_TMP"' EXIT
cat > "$UNIT_TMP" <<EOF
[Unit]
Description=Butovsky website
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$ROOT_DIR
Environment=NODE_ENV=production
Environment=PORT=$PORT
Environment=HOST=$HOST
ExecStart=$NODE_BIN $ROOT_DIR/server.js
Restart=always
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=read-only

[Install]
WantedBy=multi-user.target
EOF

run_root() {
  if [ "$(id -u)" -eq 0 ]; then "$@"; else sudo "$@"; fi
}
run_root install -o root -g root -m 0644 "$UNIT_TMP" "$UNIT_PATH"
run_root systemctl daemon-reload
run_root systemctl enable "$UNIT_NAME"
if run_root systemctl is-active --quiet "$UNIT_NAME"; then
  run_root systemctl restart "$UNIT_NAME"
else
  run_root systemctl start "$UNIT_NAME"
fi

HEALTHY=0
for attempt in $(seq 1 20); do
  if PORT="$PORT" "$NODE_BIN" -e 'const http=require("http"); const req=http.get({host:"127.0.0.1",port:Number(process.env.PORT),path:"/"},res=>{res.resume(); if(res.statusCode!==200) process.exitCode=1;}); req.on("error",()=>{process.exitCode=1;}); req.setTimeout(2000,()=>{req.destroy(); process.exitCode=1;});' >/dev/null 2>&1; then
    HEALTHY=1
    break
  fi
  sleep 1
done
if [ "$HEALTHY" -ne 1 ]; then
  run_root systemctl --no-pager --full status "$UNIT_NAME" || true
  fail "The systemd service started, but the local HTTP health check failed. Check logs with: sudo journalctl -u $UNIT_NAME -n 100 --no-pager"
fi

printf '\nButovsky website is running: %s\n' "$SITE_URL"
printf 'Systemd service: %s (enabled for startup after reboot)\n' "$UNIT_NAME"
printf 'Status: sudo systemctl status %s\n' "$UNIT_NAME"
printf 'Logs:   sudo journalctl -u %s -f\n' "$UNIT_NAME"
printf 'The domain must resolve to this server and inbound TCP port %s must be allowed.\n' "$PORT"

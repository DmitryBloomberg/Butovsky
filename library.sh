#!/usr/bin/env bash
set -eo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
WEB_DIR="$ROOT_DIR/web_rep/v1"
NODE_MIN_MAJOR=22

fail() { printf 'Error: %s\n' "$1" >&2; exit 1; }

root_cmd() {
  if [ "$(id -u)" -eq 0 ]; then
    "$@"
  elif command -v sudo >/dev/null 2>&1; then
    sudo "$@"
  else
    fail "sudo is required to install Node.js system packages."
  fi
}

node_major() {
  "$1" -p 'Number(process.versions.node.split(".")[0])' 2>/dev/null || printf '0\n'
}

resolve_node() {
  local candidate major
  candidate="$(command -v node 2>/dev/null || true)"
  if [ -n "$candidate" ]; then
    major="$(node_major "$candidate")"
    case "$major" in ''|*[!0-9]*) major=0 ;; esac
    if [ "$major" -ge "$NODE_MIN_MAJOR" ]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  fi

  candidate="/usr/bin/node"
  if [ -x "$candidate" ]; then
    major="$(node_major "$candidate")"
    case "$major" in ''|*[!0-9]*) major=0 ;; esac
    if [ "$major" -ge "$NODE_MIN_MAJOR" ]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  fi
  return 1
}

if [ ! -f "$WEB_DIR/package.json" ] || [ ! -f "$WEB_DIR/package-lock.json" ]; then
  fail "web_rep/v1/package.json or package-lock.json was not found."
fi

NODE_BIN="$(resolve_node || true)"
if [ -z "$NODE_BIN" ] || ! command -v npm >/dev/null 2>&1; then
  if ! command -v apt-get >/dev/null 2>&1 || [ ! -r /etc/os-release ]; then
    fail "Node.js 22 or newer and npm are required. Automatic setup supports Debian and Ubuntu; install Node.js 22+ and npm manually on this OS, then rerun bash library.sh."
  fi

  . /etc/os-release
  if [ "$ID" != "debian" ] && [ "$ID" != "ubuntu" ]; then
    fail "Automatic Node.js installation supports Debian and Ubuntu only. Install Node.js 22+ and npm manually on this OS, then rerun bash library.sh."
  fi
  CODENAME="$VERSION_CODENAME"
  if [ -n "$UBUNTU_CODENAME" ]; then CODENAME="$UBUNTU_CODENAME"; fi
  if [ -z "$CODENAME" ]; then
    fail "Could not determine the Debian/Ubuntu release codename. Install Node.js 22+ and npm manually."
  fi

  printf 'Installing Node.js 22 and required system tools...\n'
  root_cmd apt-get update
  root_cmd apt-get install -y ca-certificates curl gnupg
  root_cmd install -d -m 0755 /etc/apt/keyrings
  KEYRING="/etc/apt/keyrings/nodesource.gpg"
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | root_cmd gpg --dearmor --yes --output "$KEYRING"
  root_cmd chmod 0644 "$KEYRING"
  ARCH="$(dpkg --print-architecture)"
  printf 'deb [arch=%s signed-by=%s] https://deb.nodesource.com/node_22.x %s main\n' "$ARCH" "$KEYRING" "$CODENAME" | root_cmd tee /etc/apt/sources.list.d/nodesource.list >/dev/null
  root_cmd apt-get update
  root_cmd apt-get install -y nodejs
fi

NODE_BIN="$(resolve_node || true)"
if [ -z "$NODE_BIN" ]; then
  fail "Node.js 22 or newer is still unavailable. Check the installation output, then rerun bash library.sh."
fi
PATH="$(dirname "$NODE_BIN"):$PATH"
export PATH
if ! command -v npm >/dev/null 2>&1; then
  fail "npm is missing for $NODE_BIN. Install npm for this Node.js version and rerun bash library.sh."
fi

printf 'Installing locked website dependencies in web_rep/v1...\n'
npm ci --prefix "$WEB_DIR"
printf 'Dependencies are ready. Run bash start.sh to build and enable the systemd service.\n'

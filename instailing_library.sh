#!/usr/bin/env bash
set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
printf 'Notice: this legacy filename is retained for compatibility; use bash library.sh.\n' >&2
exec bash "$SCRIPT_DIR/library.sh" "$@"

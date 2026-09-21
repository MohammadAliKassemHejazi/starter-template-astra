#!/usr/bin/env bash
# Thin wrapper — the real logic is cross-platform Node.
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
exec node "$ROOT/.claude/setup/connect-deepseek.mjs" "$@"

#!/usr/bin/env bash
# Safe graphify invocation: tries the `graphify` executable first, falls back
# to `python -m graphify` when the executable is sandboxed/blocked (observed:
# Microsoft Store Python AppContainer throws "Permission denied" on
# graphify.exe while `python -m graphify` works fine). Never assumes either
# path works — probes once, uses whichever succeeds, fails LOUD (non-zero
# exit + stderr) if neither does, so a PreToolUse hook using this wrapper
# fails closed with a clear message instead of silently misbehaving.
set -uo pipefail

try_cmd() {
  "$@" --version >/dev/null 2>&1
}

if try_cmd graphify; then
  exec graphify "$@"
elif try_cmd python -m graphify; then
  exec python -m graphify "$@"
elif try_cmd python3 -m graphify; then
  exec python3 -m graphify "$@"
else
  echo "graphify-run.sh: no working graphify invocation found (tried: graphify, python -m graphify, python3 -m graphify)." >&2
  echo "  Run 'bash .claude/setup/bootstrap.sh' to (re)install, or install manually: uv tool install graphifyy" >&2
  exit 127
fi

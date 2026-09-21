#!/usr/bin/env bash
# AstraSyntx one-command environment bootstrap.
# The Founder never runs this directly — the CEO runs it on request
# ("set up my tools") after confirming. Idempotent: safe to re-run.
#
# HARD RULE (added after a real incident — see decision-log): this script
# NEVER lets a sub-installer's changes to .claude/settings.json or
# .claude/CLAUDE.md take effect silently. Both are snapshotted before any
# installer runs; if either changed afterward, the run STOPS, restores the
# pre-install version, and reports a diff for the CEO/Founder to review and
# apply deliberately. A hook or a routing-hub edit is a reviewed security
# decision (guardrail 8) — no installer gets to make that decision for us.
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT" || exit 1
echo "==> AstraSyntx bootstrap in: $ROOT"

log(){ printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }
warn(){ printf '\033[1;33m[skip] %s\033[0m\n' "$*"; }
err(){ printf '\033[1;31m[STOP] %s\033[0m\n' "$*"; }

SETTINGS="$ROOT/.claude/settings.json"
CLAUDEMD="$ROOT/.claude/CLAUDE.md"
SNAP_DIR="$ROOT/.claude/setup/.snapshots"
mkdir -p "$SNAP_DIR"

snapshot_guarded_files() {
  cp -f "$SETTINGS" "$SNAP_DIR/settings.json.before" 2>/dev/null || true
  cp -f "$CLAUDEMD" "$SNAP_DIR/CLAUDE.md.before" 2>/dev/null || true
}

# Compares current guarded files against the snapshot. If either changed,
# reverts them immediately and reports the diff — never applies silently.
check_guarded_files_unchanged() {
  local changed=0
  if [ -f "$SNAP_DIR/settings.json.before" ] && ! diff -q "$SNAP_DIR/settings.json.before" "$SETTINGS" >/dev/null 2>&1; then
    changed=1
    err "An installer modified .claude/settings.json without review. Reverting it now."
    echo "--- Unreviewed diff (settings.json) — re-apply deliberately if it should be kept ---"
    diff "$SNAP_DIR/settings.json.before" "$SETTINGS" || true
    cp -f "$SNAP_DIR/settings.json.before" "$ROOT/.claude/setup/.snapshots/settings.json.attempted-by-installer"
    cp -f "$SNAP_DIR/settings.json.before" "$SETTINGS"
  fi
  if [ -f "$SNAP_DIR/CLAUDE.md.before" ] && ! diff -q "$SNAP_DIR/CLAUDE.md.before" "$CLAUDEMD" >/dev/null 2>&1; then
    changed=1
    err "An installer modified .claude/CLAUDE.md (the binding routing hub) without review. Reverting it now."
    echo "--- Unreviewed diff (CLAUDE.md) — re-apply deliberately if it should be kept ---"
    diff "$SNAP_DIR/CLAUDE.md.before" "$CLAUDEMD" || true
    cp -f "$SNAP_DIR/CLAUDE.md.before" "$ROOT/.claude/setup/.snapshots/CLAUDE.md.attempted-by-installer"
    cp -f "$SNAP_DIR/CLAUDE.md.before" "$CLAUDEMD"
  fi
  if [ "$changed" = 1 ]; then
    err "Reverted. The attempted change is saved in .claude/setup/.snapshots/*.attempted-by-installer for review."
    err "If the change is wanted, the CEO files a decision request (templates/decision-request.md, guardrail 8) and applies it deliberately — never let a re-run of this script apply it automatically."
  fi
}

# 1. graphify (code knowledge graph — token saver)
snapshot_guarded_files
if command -v graphify >/dev/null 2>&1 || python -c "import graphify" >/dev/null 2>&1; then
  warn "graphify already installed"
else
  log "Installing graphify (graphifyy)"
  if command -v uv >/dev/null 2>&1; then uv tool install graphifyy
  elif command -v pipx >/dev/null 2>&1; then pipx install graphifyy
  elif command -v pip >/dev/null 2>&1; then pip install --user graphifyy
  else warn "no uv/pipx/pip found — install one, then re-run"; fi
fi
if command -v graphify >/dev/null 2>&1 || python -c "import graphify" >/dev/null 2>&1; then
  log "Verifying invocation (handles the graphify.exe / sandboxed-Python permission issue seen on some Windows setups)"
  if bash "$ROOT/.claude/setup/bin/graphify-run.sh" --version >/dev/null 2>&1; then
    log "graphify invocation OK via .claude/setup/bin/graphify-run.sh"
  else
    warn "graphify installed but no invocation form works yet (graphify / python -m graphify / python3 -m graphify all failed) — skipping graph build; fix invocation manually then re-run"
  fi
  if bash "$ROOT/.claude/setup/bin/graphify-run.sh" --version >/dev/null 2>&1; then
    log "Registering graphify skill (project scope; --strict deliberately NOT passed — it installs PreToolUse hooks, a reviewed security decision, not an installer's call)"
    bash "$ROOT/.claude/setup/bin/graphify-run.sh" install --project || warn "graphify install step failed (non-fatal)"
    log "Building initial knowledge graph"
    bash "$ROOT/.claude/setup/bin/graphify-run.sh" . || warn "graphify index failed (non-fatal)"
    log "Installing graphify git hook (incremental updates on commit)"
    bash "$ROOT/.claude/setup/bin/graphify-run.sh" hook install || warn "graphify hook install failed (non-fatal)"
    grep -qxF 'graphify-out/' .gitignore 2>/dev/null || echo 'graphify-out/' >> .gitignore
    # THE GUARD: if graphify's installer touched settings.json or CLAUDE.md, revert + report now.
    check_guarded_files_unchanged
    log "If graphify added hooks or edited CLAUDE.md, they were reverted above and staged for review — this is expected and correct, not an error in graphify itself."
  fi
fi

# 2. repomix (compressed codebase bundling for subagents)
if command -v repomix >/dev/null 2>&1 || command -v npx >/dev/null 2>&1; then
  log "repomix available via npx (npx repomix) — no global install needed. Config: repomix.config.json (verify schema against 'npx repomix --help')"
else
  warn "node/npx not found — install Node to use repomix"
fi

# 3. media/social folder scaffolding (never touches settings.json/CLAUDE.md — no guard needed)
log "Scaffolding media + social folders"
bash "$ROOT/.claude/setup/scaffold-folders.sh" || warn "scaffold step failed"

# 4. ensure hooks + helper scripts are executable
chmod +x "$ROOT"/.claude/hooks/*.mjs 2>/dev/null || true
chmod +x "$ROOT"/.claude/setup/*.sh "$ROOT"/.claude/setup/bin/*.sh 2>/dev/null || true

log "Bootstrap complete. See .claude/setup/SETUP.md. Any reverted installer change is in .claude/setup/.snapshots/ for deliberate review."

#!/usr/bin/env node
/**
 * Stop hook: deterministic, zero-token verification. Reads the active task's
 * verify_cmd from tasks.json and runs it. If it fails, blocks the stop and
 * feeds the real error back to Claude — no conversational review turn spent
 * deciding whether the code "looks right." This is what actually delivers on
 * "90% coding, 10% reporting": a shell command replaces a review agent for
 * the mechanical part (does it compile, do tests pass), for free.
 *
 * Mechanism verified against Claude Code's current docs (code.claude.com/
 * docs/en/hooks): exit 0 + JSON on STDOUT with {"decision":"block","reason"}
 * forces Claude to continue rather than stop. This exact feature has a real
 * history of instability (removed mid-2025, restored since) — treated here
 * as a strong PRIMARY layer, not the only one; safety-guard/lifecycle-guard/
 * orchestration-guard and the git-level hooks from v22 are unaffected and
 * still apply regardless of whether this one behaves as documented on any
 * given Claude Code version.
 *
 * DISABLE_STOP_GATE=1 skips this (prevents recursion if a subagent's own
 * Stop event would otherwise re-trigger verification while already
 * inside a verification pass).
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

if (process.env.DISABLE_STOP_GATE === '1') { await drain(); process.exit(0); }

await drain();
const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const tasksPath = path.join(projectDir, '.claude/company/sprints/current/tasks.json');

function block(reason) {
  // Exit 0 + JSON on stdout is the documented structured-control path for
  // Stop events. Truncate long output — the whole point is spending fewer
  // tokens, not pasting an entire failing test run back into context.
  const trimmed = reason.length > 4000 ? reason.slice(0, 4000) + '\n... (truncated)' : reason;
  process.stdout.write(JSON.stringify({ decision: 'block', reason: trimmed }));
  process.exit(0); // must exit immediately after — do not fall through to further checks
}

let tasks = [];
try {
  tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
} catch {
  // No tasks.json, or it's not valid JSON yet (e.g. fresh sprint, or a HIGH-tier
  // stream still in grooming that hasn't generated one). Not an error — fall
  // through to a final safety net below rather than blocking on its absence.
  tasks = null;
}

if (Array.isArray(tasks)) {
  const active = tasks.find(t => t.status === 'pending' || t.status === 'in_progress');
  if (active && active.verify_cmd) {
    try {
      execSync(active.verify_cmd, { cwd: projectDir, stdio: ['ignore', 'pipe', 'pipe'], timeout: 300000 });
      // verify_cmd passed — fall through to exit 0 below (allow stop)
    } catch (e) {
      const output = (e.stdout?.toString() || '') + (e.stderr?.toString() || '');
      block(`Verification failed for ${active.id} (${active.verify_cmd}). Fix the actual error below, do not narrate it:\n${output}`);
    }
  }
}

// Final fallback safety net: if a typecheck command is known and nothing
// above already validated the work, don't let obviously broken code stand
// just because tasks.json was empty or had no verify_cmd for this item.
try {
  const pkgPath = path.join(projectDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (pkg.scripts?.typecheck) {
    execSync('npm run typecheck', { cwd: projectDir, stdio: ['ignore', 'pipe', 'pipe'], timeout: 180000 });
  }
} catch (e) {
  const output = (e.stdout?.toString() || '') + (e.stderr?.toString() || '');
  if (output) block(`Typecheck failed. Fix compilation errors before stopping:\n${output}`);
  // If neither package.json nor a typecheck script exists yet, that's fine —
  // nothing to verify against; don't block on infrastructure that isn't there.
}

process.exit(0);

async function drain() { try { for await (const _ of process.stdin) {} } catch {} }

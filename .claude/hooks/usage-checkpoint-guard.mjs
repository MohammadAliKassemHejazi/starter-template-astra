#!/usr/bin/env node
/**
 * Stop hook: reminds the team to keep company/sprints/current/RESUME-POINT.md
 * current, so a session cut short by a usage-limit reset (or a context
 * compaction, or just closing the laptop) can resume exactly where it left
 * off. Never blocks — advisory only, same philosophy as sprint-reminder.mjs.
 *
 * Two independent checks:
 *  1. ALWAYS-RELIABLE: compare mtime(daily-log.md) vs mtime(RESUME-POINT.md).
 *     A newer daily-log entry means real work happened since the resume
 *     point was last rewritten — remind to bring it current. This needs no
 *     external tool and cannot fail to be available.
 *  2. BEST-EFFORT: if the optional `ccusage` tool is installed
 *     (usage-status.mjs), and reports high usage, escalate to an urgent
 *     "checkpoint NOW" reminder regardless of whether a unit of work just
 *     finished — better a mid-task checkpoint than none before a reset.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const HIGH_USAGE_THRESHOLD = 85;

await drain();
const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const cur = path.join(projectDir, '.claude/company/sprints/current');
const dailyLog = path.join(cur, 'daily-log.md');
const resumePoint = path.join(cur, 'RESUME-POINT.md');

// --- Check 1: always-reliable staleness ---
try {
  if (fs.existsSync(dailyLog)) {
    const logMtime = fs.statSync(dailyLog).mtimeMs;
    const rpMtime = fs.existsSync(resumePoint) ? fs.statSync(resumePoint).mtimeMs : 0;
    if (logMtime > rpMtime) {
      process.stderr.write(
        '[AstraSyntx checkpoint reminder] daily-log.md has newer entries than RESUME-POINT.md. ' +
        'Rewrite RESUME-POINT.md now to reflect current progress (what\'s done, exact next action, any ' +
        'outstanding delegation-tier sessions) — this is what lets the team resume cleanly after any session ' +
        'gap, including a usage-limit reset. templates/resume-point.md is the format.\n'
      );
    }
  }
} catch {}

// --- Check 2: best-effort usage escalation ---
try {
  const projectDirForScript = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const usageStatusPath = path.join(projectDirForScript, '.claude/setup/usage-status.mjs');
  const out = execFileSync('node', [usageStatusPath, '--json'], {
    stdio: ['ignore', 'pipe', 'ignore'], timeout: 6000,
  }).toString();
  const data = JSON.parse(out);
  if (data.available && (data.sessionPct >= HIGH_USAGE_THRESHOLD || data.weekPct >= HIGH_USAGE_THRESHOLD)) {
    process.stderr.write(
      `[AstraSyntx URGENT] Usage is high (session ${data.sessionPct ?? '?'}%, week ${data.weekPct ?? '?'}%). ` +
      'Checkpoint RESUME-POINT.md NOW, even if the current unit of work is only partly done — a partial ' +
      'checkpoint beats losing progress to a usage-limit reset. Include outstanding delegation-tier sessions ' +
      '(a Jules session awaiting an answer, a DeepSeek diff awaiting review) so nothing is silently ' +
      'orphaned across the gap.\n'
    );
  }
} catch {
  // ccusage absent or usage-status.mjs failed — silent, this check is best-effort only.
}

process.exit(0);

async function drain() { try { for await (const _ of process.stdin) {} } catch {} }

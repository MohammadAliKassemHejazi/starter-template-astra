#!/usr/bin/env node
/**
 * Best-effort Claude usage check — NOT required. Checks for `codeburn`
 * (npm install -g codeburn — reads local session logs directly, no network,
 * no API key: github.com/AgentSeal/codeburn) as the primary detector, since
 * it's the more current, more widely-adopted tool; falls back to `ccusage`
 * if codeburn isn't present. Neither is a documented Claude Code API — /usage
 * is a human-typed slash command, not something a hook can call — so this
 * stays best-effort by design. The checkpoint discipline
 * (usage-checkpoint-guard.mjs, RESUME-POINT.md) works identically either way.
 *
 * Usage: node .claude/setup/usage-status.mjs [--json]
 * Exit code: 0 = usage data available, 1 = unknown (neither tool present/working).
 */
import { execSync } from 'node:child_process';
import process from 'node:process';

function tryCodeburn() {
  try {
    // codeburn's exact structured-output schema (`codeburn export --format json`
    // or similar) wasn't independently confirmed at time of writing — rather
    // than guess a schema, just confirm the tool is present and callable, and
    // point to it for a human-readable read. Safer than fabricating a parser
    // for an unconfirmed format.
    execSync('codeburn --version', { stdio: 'ignore', timeout: 5000 });
    return { tool: 'codeburn', command: 'codeburn today' };
  } catch { return null; }
}

function tryCcusage() {
  try {
    // ccusage's plain-text output (confirmed real format):
    //   Session (5h) 39% resets 1h26m
    //   Week (all) 15% resets 143h26m
    const out = execSync('ccusage', { stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000 }).toString();
    const session = out.match(/Session\s*\(5h\)\s*(\d+)%/i);
    const weekAll = out.match(/Week\s*\(all\)\s*(\d+)%/i);
    if (!session && !weekAll) return null;
    return {
      tool: 'ccusage',
      sessionPct: session ? Number(session[1]) : null,
      weekPct: weekAll ? Number(weekAll[1]) : null,
      raw: out.trim(),
    };
  } catch { return null; }
}

const data = tryCodeburn() || tryCcusage();

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(data ? { available: true, ...data } : { available: false }));
} else if (data?.tool === 'codeburn') {
  console.log(`codeburn detected — run '${data.command}' for a full cost/token breakdown.`);
} else if (data) {
  console.log(`Usage data (via ccusage): session ${data.sessionPct ?? '?'}%, week ${data.weekPct ?? '?'}%`);
} else {
  console.log('Usage data: unknown (neither codeburn nor ccusage installed/runnable).');
  console.log('Recommended: npm install -g codeburn — then this reports real usage.');
  console.log('Not required — checkpoint discipline (RESUME-POINT.md) works the same either way.');
}
// sessionPct/weekPct only meaningful for ccusage; codeburn's own dashboard is the
// richer read, so usage-checkpoint-guard.mjs treats "codeburn present" alone as
// a signal to defer to the human running it, not as a numeric threshold check.
process.exit(data ? 0 : 1);

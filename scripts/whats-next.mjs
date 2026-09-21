#!/usr/bin/env node
/**
 * Cross-tool orientation script. Deliberately lives at the repo ROOT, outside
 * .claude/, and uses only plain Node (no Claude-Code-specific APIs) — this is
 * meant to be runnable by ANY coding agent (Claude Code, Codex, Jules, a
 * human) picking up mid-sprint. It reads the same plain files every tool can
 * already see (tasks.json, RESUME-POINT.md, escalations/) and prints one
 * clean orientation summary instead of requiring several separate reads.
 *
 * Usage: node scripts/whats-next.mjs [--json]
 * Exit code: 0 always (this is informational, never a gate).
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const SPRINT_DIR = path.join(ROOT, '.claude/company/sprints/current');
const ESCALATIONS_DIR = path.join(ROOT, '.claude/company/escalations');

function readJsonSafe(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}
function readTextSafe(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return null; }
}

// --- tasks.json: what's next ---
const tasks = readJsonSafe(path.join(SPRINT_DIR, 'tasks.json'));
let nextTask = null;
let taskCounts = { pending: 0, in_progress: 0, done: 0 };
if (Array.isArray(tasks)) {
  for (const t of tasks) {
    if (t.status in taskCounts) taskCounts[t.status]++;
  }
  nextTask = tasks.find(t => t.status === 'in_progress') || tasks.find(t => t.status === 'pending') || null;
}

// --- RESUME-POINT.md: the three fields that matter ---
const resumeRaw = readTextSafe(path.join(SPRINT_DIR, 'RESUME-POINT.md'));
const isPlaceholder = !resumeRaw || /currently no active sprint|nothing to resume/i.test(resumeRaw);
function extractSection(text, heading) {
  if (!text) return null;
  const re = new RegExp(`##\\s*${heading}[^\\n]*\\n([\\s\\S]*?)(?=\\n##|$)`, 'i');
  const m = text.match(re);
  if (!m) return null;
  const body = m[1].trim();
  if (!body || /^-\s*$/.test(body) || /^(none|n\/a|nothing)\b/i.test(body)) return null;
  return body;
}
const outstandingDelegations = extractSection(resumeRaw, 'Outstanding delegation-tier sessions');
const pendingQuestions = extractSection(resumeRaw, 'Pending questions');
const founderSummary = extractSection(resumeRaw, 'One-line summary for the Founder');

// --- open escalations ---
let openEscalations = [];
try {
  openEscalations = fs.readdirSync(ESCALATIONS_DIR)
    .filter(f => /^ESC-.+\.md$/i.test(f))
    .filter(f => {
      const content = readTextSafe(path.join(ESCALATIONS_DIR, f)) || '';
      const statusLine = content.split('\n').find(l => l.trim().startsWith('**Status:**'));
      return statusLine ? /🔴|open/i.test(statusLine) : true;
    });
} catch { /* no escalations dir yet */ }

const result = {
  hasActiveSprint: !isPlaceholder || Boolean(tasks),
  taskCounts,
  nextTask: nextTask ? { id: nextTask.id, description: nextTask.description, target_files: nextTask.target_files, verify_cmd: nextTask.verify_cmd } : null,
  outstandingDelegations,
  pendingQuestions,
  founderSummary,
  openEscalations,
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log('=== Project orientation ===');
  if (!result.hasActiveSprint) {
    console.log('No active sprint. Nothing to resume — start fresh classification.');
  } else {
    console.log(`Tasks: ${taskCounts.done} done, ${taskCounts.in_progress} in progress, ${taskCounts.pending} pending.`);
    if (nextTask) {
      console.log(`\nNext: ${nextTask.id} — ${nextTask.description}`);
      if (nextTask.target_files) console.log(`  Files: ${nextTask.target_files.join(', ')}`);
      if (nextTask.verify_cmd) console.log(`  Verify with: ${nextTask.verify_cmd}`);
      console.log('  (No Claude Code Stop-hook here if you are not running Claude Code —');
      console.log('   run verify_cmd yourself and confirm it exits 0 before marking this done.)');
    } else {
      console.log('\nNo pending/in-progress task in tasks.json.');
    }
    if (founderSummary) console.log(`\nLast summary: ${founderSummary}`);
    if (outstandingDelegations) console.log(`\nOutstanding delegation sessions (do not let these go silent):\n  ${outstandingDelegations}`);
    if (pendingQuestions) console.log(`\nPending question blocking progress:\n  ${pendingQuestions}`);
  }
  if (openEscalations.length) {
    console.log(`\n⚠ ${openEscalations.length} open escalation ticket(s): ${openEscalations.join(', ')} — read .claude/company/escalations/ before proceeding.`);
  }
  console.log('\nFull conventions: AGENTS.md (or docs/CONVENTIONS.md for depth).');
}
process.exit(0);

#!/usr/bin/env node
/**
 * PreToolUse guard on Task. Enforces the Agile/Scrum chain of command:
 * Founder ⇄ CEO ⇄ Team Lead ⇄ Specialists — specialists are dispatched BY a
 * Team Lead, never directly. Two responsibilities (both keyed off the same
 * lock file, .claude/company/.teamlead.lock):
 *
 *  1. Concurrency: only one Team Lead active at a time (unchanged from the
 *     prior single-teamlead-lock.mjs — merged in here since both rules
 *     revolve around the same lock).
 *  2. Orchestration: dispatching any of the 25 named specialists is BLOCKED
 *     unless a Team Lead is currently active (the lock exists and isn't
 *     stale). ceo and team-lead dispatches are exempt — the CEO is how a
 *     Team Lead gets started in the first place. Unrecognized/ad-hoc Task
 *     calls (subagent_type not matching a known name) are NOT gated — this
 *     hook only enforces the chain for OUR named roster, not generic
 *     subagent use.
 *
 * Fail-open on unparseable input; matches by subagent_type first (the
 * structured field), falling back to description/prompt text only if
 * subagent_type is absent.
 */
import process from 'node:process';
import fs from 'node:fs';
import path from 'node:path';

const SPECIALISTS = new Set([
  'a11y-auditor','ai-engineer','automation-integrations','backend-dotnet',
  'backend-nextjs','backend-node','backend-springboot','code-reviewer',
  'content-marketing','css-scss-developer','data-analytics','data-architect',
  'docs-sync','framer-motion-engineer','frontend-dev','growth-seo-specialist',
  'gsap-engineer','incident-commander','integration-merge',
  'media-prompt-director','product-manager','qa-devops','security-auditor',
  'support-triage','system-architect','threejs-engineer',
]);

const input = await readInput();
const tool = typeof input.tool_name === 'string' ? input.tool_name : '';
const ti = input.tool_input && typeof input.tool_input === 'object' ? input.tool_input : {};
const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

if (tool !== 'Task') process.exit(0);

const subagentField = typeof ti.subagent_type === 'string' ? ti.subagent_type.trim().toLowerCase()
  : typeof ti.subagentType === 'string' ? ti.subagentType.trim().toLowerCase() : '';
const freeText = [ti.description, ti.prompt, ti.name].filter(x => typeof x === 'string').join(' ').toLowerCase();

const isTeamLead = subagentField === 'team-lead' || (!subagentField && /\bteam-lead\b|\bteam lead\b/.test(freeText));
const isCeo = subagentField === 'ceo' || (!subagentField && /\bceo\b/.test(freeText));

const lockPath = path.join(projectDir, '.claude/company/.teamlead.lock');
// A sprint runs for days, but a lock must not outlive a genuinely dead session.
// Fix: the window is generous (12h) AND every specialist dispatch REFRESHES the
// lock's mtime — so an actively-working stream never goes stale mid-sprint,
// while a truly abandoned session expires on its own. Previously a 2h window
// with no refresh both blocked live work and silently dropped the concurrency
// guarantee on any sprint longer than 2 hours.
const STALE_AFTER_MS = 12 * 60 * 60 * 1000;

function lockActive() {
  try {
    const st = fs.statSync(lockPath);
    return (Date.now() - st.mtimeMs) < STALE_AFTER_MS;
  } catch { return false; }
}

function touchLock() {
  try { fs.utimesSync(lockPath, new Date(), new Date()); } catch {}
}

// --- Rule 1: Team Lead concurrency ---
if (isTeamLead) {
  if (lockActive()) {
    let holder = '';
    try { holder = fs.readFileSync(lockPath, 'utf8').trim(); } catch {}
    process.stderr.write(
      'Blocked by AstraSyntx orchestration hook: a Team Lead is already active' +
      (holder ? ` (${holder})` : '') + '.\n' +
      'Only one Team Lead runs at a time to prevent overlapping work on the same repo/DB/branch. ' +
      'Let the active stream finish (or hand off to integration-merge), then dispatch the next Team Lead. ' +
      'If the previous run truly ended, remove .claude/company/.teamlead.lock and retry.\n'
    );
    process.exit(2);
  }
  try {
    const stamp = new Date().toISOString();
    const label = (typeof ti.description === 'string' && ti.description) ? ti.description.slice(0, 80) : 'team-lead stream';
    fs.mkdirSync(path.dirname(lockPath), { recursive: true });
    fs.writeFileSync(lockPath, `${label} @ ${stamp}`);
  } catch {}
  process.exit(0);
}

// CEO is always dispatchable — it's how a Team Lead stream gets started, and it
// does Founder-facing work that doesn't require an active engineering stream.
if (isCeo) process.exit(0);

// --- Rule 2: specialist dispatch requires an active Team Lead ---
const isKnownSpecialist = subagentField
  ? SPECIALISTS.has(subagentField)
  : [...SPECIALISTS].some(name => new RegExp(`\\b${name}\\b`).test(freeText));

if (isKnownSpecialist && !lockActive()) {
  process.stderr.write(
    'Blocked by AstraSyntx orchestration hook: no active Team Lead.\n' +
    'Specialists are assigned by a Team Lead, never dispatched directly — this is the Agile/Scrum ' +
    'chain of command (Founder ⇄ CEO ⇄ Team Lead ⇄ Specialists), not a formality. ' +
    'Dispatch team-lead first (it classifies the task and assigns the specialist itself, even for ' +
    'LOW-tier work — LOW just means no grooming ceremony, not no Team Lead). ' +
    'If a Team Lead was running this stream, its lock expired after 12h of no activity — ' +
    're-dispatch team-lead to resume the stream.\n'
  );
  process.exit(2);
}

// An active stream just did work — keep the lock warm so a long sprint never
// goes stale underneath the specialists still working in it.
if (isKnownSpecialist) touchLock();

process.exit(0);

async function readInput() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

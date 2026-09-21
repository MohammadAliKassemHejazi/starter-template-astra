#!/usr/bin/env node
/**
 * Stop hook: when the assistant finishes, checks two things —
 *  1. Whether the current sprint's backlog is all-done but not yet archived
 *     (unchanged from the original version), and
 *  2. Whether enough sprints have closed since the last CEO process/optimization
 *     review that a nudge is due (default every 3 archived sprints).
 * Both are advisory reminders only — never blocking, never a decision on its
 * own. The CEO/Team Lead judge whether a real optimization is warranted; the
 * hook's only job is to make sure the question gets asked periodically
 * instead of forgotten in the daily grind.
 */
import process from 'node:process';
import fs from 'node:fs';
import path from 'node:path';

const REVIEW_EVERY_N_SPRINTS = 3; // adjust here if the team wants a different cadence

await drain(); // consume stdin (Stop event payload), we don't need it
const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const cur = path.join(projectDir, '.claude/company/sprints/current');
const archiveDir = path.join(projectDir, '.claude/company/sprints/archive');
const markerPath = path.join(projectDir, '.claude/company/.last-optimization-review');

try {
  const backlog = read(path.join(cur, 'backlog.md'));
  if (backlog) {
    // Parse the STATUS COLUMN of real table rows rather than word-matching the
    // whole file. Word-matching broke on two realistic shapes: a status-legend
    // row (which the template ships) made every sprint look unfinished, and a
    // story titled e.g. "Add code review tooling" read as an open item.
    const rows = backlog.split('\n')
      .map(l => l.trim())
      .filter(l => l.startsWith('|') && l.endsWith('|'))
      .map(l => l.slice(1, -1).split('|').map(c => c.trim()))
      // drop separator rows (---) and header rows
      .filter(cells => cells.length >= 2 && !cells.every(c => /^:?-+:?$/.test(c) || c === ''))
      // drop the legend row: a single cell listing several statuses at once
      .filter(cells => !cells.some(c => (c.match(/✅|🔲|⏳|🔎|❌/g) || []).length > 1))
      // drop the header row (no status emoji anywhere in it)
      .filter(cells => cells.some(c => /✅|🔲|⏳|🔎|❌/.test(c)));

    const statuses = rows.map(cells => cells[cells.length - 1]);
    const done = statuses.filter(s => /✅/.test(s)).length;
    const open = statuses.filter(s => /🔲|⏳|🔎|❌/.test(s)).length;

    if (done > 0 && open === 0) {
      process.stderr.write(
        `[AstraSyntx lifecycle reminder] All ${done} backlog item(s) are marked done. ` +
        'Do not skip closeout: (1) compile the sprint report (templates/sprint-report.md) and retro (templates/retro.md), ' +
        '(2) CEO presents to the Founder for acceptance, (3) on acceptance, archive ALL of ' +
        'company/sprints/current/ to company/sprints/archive/sprint-NN/ and recreate current/ from templates, ' +
        '(4) append decisions to company/decision-log.md, (5) release the team-lead lock ' +
        '(remove .claude/company/.teamlead.lock). Archiving after done is mandatory, not optional.\n'
      );
    }
  }
} catch {}

try {
  const archived = fs.existsSync(archiveDir)
    ? fs.readdirSync(archiveDir, { withFileTypes: true }).filter(d => d.isDirectory()).length
    : 0;
  const lastReviewedAt = Number(read(markerPath).trim() || 0);
  if (archived > 0 && archived >= lastReviewedAt + REVIEW_EVERY_N_SPRINTS) {
    process.stderr.write(
      `[AstraSyntx process reminder] ${archived} sprints have now closed (${archived - lastReviewedAt} since the last process review). ` +
      'The CEO should read the archived retros for recurring friction/bottleneck patterns, consult the Team Lead, and decide whether an ' +
      'optimization proposal is warranted this cycle — it is fine to conclude no change is needed, but the review itself should happen. ' +
      'If a proposal goes forward: templates/optimization-proposal.md → Founder approves or denies, same as any other decision request. ' +
      `After reviewing (whether or not a proposal results), record it: echo ${archived} > .claude/company/.last-optimization-review\n`
    );
  }
} catch {}

process.exit(0);

function read(p){ try { return fs.readFileSync(p,'utf8'); } catch { return ''; } }
async function drain(){ try { for await (const _ of process.stdin){} } catch {} }

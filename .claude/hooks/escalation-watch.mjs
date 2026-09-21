#!/usr/bin/env node
/**
 * Stop hook: reminds the Team Lead when an escalation ticket
 * (company/escalations/ESC-*.md) is sitting Open/unaddressed. Never blocks —
 * advisory, same philosophy as every other Stop hook in this package. This
 * exists because a dispatched subagent that hits real ambiguity has no
 * interactive channel back to the Founder — a written, stopped-cleanly
 * ticket is the whole point; this hook makes sure it doesn't get forgotten.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

await drain();
const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const dir = path.join(projectDir, '.claude/company/escalations');

try {
  if (!fs.existsSync(dir)) process.exit(0);
  const open = fs.readdirSync(dir)
    .filter(f => /^ESC-.+\.md$/i.test(f))
    .filter(f => {
      try {
        const content = fs.readFileSync(path.join(dir, f), 'utf8');
        // Look at the Status line specifically, not the whole file (a
        // resolved ticket's own template still contains the word "Open" in
        // its instructional header text above).
        const statusLine = content.split('\n').find(l => l.trim().startsWith('**Status:**'));
        return statusLine ? /🔴|open/i.test(statusLine) : true; // no status line = assume open, don't hide it
      } catch { return false; }
    });

  if (open.length > 0) {
    process.stderr.write(
      `[AstraSyntx escalation reminder] ${open.length} open escalation ticket(s) waiting: ${open.join(', ')}. ` +
      'A subagent stopped cleanly rather than guess — that only works if someone actually answers it. ' +
      'Team Lead: read company/escalations/, resolve or redirect, update the Status line, and let the filing ' +
      'agent resume.\n'
    );
  }
} catch {}
process.exit(0);

async function drain() { try { for await (const _ of process.stdin) {} } catch {} }

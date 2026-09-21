/**
 * Shared circuit breaker for delegation-tier task creation. Prevents a
 * retry/error loop from silently burning an hourly rate limit or an API
 * budget in minutes — this is a real, documented failure mode (recursive
 * subagent loops have been reported to burn 80%+ of a weekly plan limit in
 * under 30 minutes). Local, file-based, no external dependency.
 */
import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_MAX_PER_WINDOW = 5;
const DEFAULT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export function checkAndRecordRate(projectDir, tierName, {
  maxPerWindow = DEFAULT_MAX_PER_WINDOW,
  windowMs = DEFAULT_WINDOW_MS,
} = {}) {
  const logPath = path.join(projectDir, '.claude/company', `.${tierName}-rate-log.jsonl`);
  const now = Date.now();

  let entries = [];
  try {
    entries = fs.readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
  } catch { /* no log yet */ }

  const recent = entries.filter(e => now - e.ts < windowMs);

  if (recent.length >= maxPerWindow) {
    const oldestInWindow = Math.min(...recent.map(e => e.ts));
    const retryAfterMs = windowMs - (now - oldestInWindow);
    return {
      allowed: false,
      count: recent.length,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  recent.push({ ts: now });
  try {
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.writeFileSync(logPath, recent.map(e => JSON.stringify(e)).join('\n') + '\n');
  } catch { /* best-effort logging; never block on a write failure */ }

  return { allowed: true, count: recent.length };
}

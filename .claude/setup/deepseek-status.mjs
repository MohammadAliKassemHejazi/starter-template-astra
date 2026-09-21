#!/usr/bin/env node
/**
 * Single source of truth for whether the DeepSeek execution tier is ACTIVE.
 * Activation is automatic and key-driven: if DEEPSEEK_API_KEY exists in the
 * environment, the tier is on. No config file to edit, no flag to flip.
 * Remove the key and the team silently returns to Claude-only — every
 * workflow, gate, and review stays identical either way.
 *
 * Usage:
 *   node .claude/setup/deepseek-status.mjs          # human-readable
 *   node .claude/setup/deepseek-status.mjs --json   # machine-readable
 * Exit code: 0 = active, 1 = inactive (so scripts can branch on it).
 */
import process from 'node:process';

const key = process.env.DEEPSEEK_API_KEY || '';
const active = key.trim().length > 0;
const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({
    active,
    model: active ? model : null,
    keyLength: active ? key.trim().length : 0,   // never the key itself
    source: 'DEEPSEEK_API_KEY environment variable',
  }));
} else if (active) {
  console.log(`DeepSeek execution tier: ACTIVE (model: ${model}, key length ${key.trim().length} — value not printed).`);
  console.log('Claude architects and reviews; DeepSeek implements from the brief.');
  console.log('Rules: skills/deepseek-delegation-reference.md');
} else {
  console.log('DeepSeek execution tier: INACTIVE (no DEEPSEEK_API_KEY set).');
  console.log('The team runs Claude-only — identical workflow, gates, and quality bar.');
  console.log('To enable, set DEEPSEEK_API_KEY in your shell, then re-run. Nothing else to configure.');
}
process.exit(active ? 0 : 1);

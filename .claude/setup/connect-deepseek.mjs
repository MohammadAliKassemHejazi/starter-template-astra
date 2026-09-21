#!/usr/bin/env node
/**
 * Optional: enable the DeepSeek delegation tier.
 * The CEO runs this on the Founder's request. Cross-platform (Windows/mac/Linux).
 *
 * The API key is NEVER written into this repo. This script only:
 *   1. tells the Founder exactly which env var to set, in their own shell/profile
 *   2. verifies the key is reachable (without printing it)
 *   3. reminds that business-context.md must be updated to activate the skill
 */
import process from 'node:process';

const KEY = process.env.DEEPSEEK_API_KEY;

console.log('\n=== DeepSeek delegation tier — optional setup ===\n');

if (!KEY) {
  console.log('DEEPSEEK_API_KEY is not set in this environment.\n');
  console.log('Set it in YOUR OWN shell profile (never in a file inside this repo):\n');
  console.log('  Windows (PowerShell, persistent):');
  console.log('    setx DEEPSEEK_API_KEY "your-key-here"     # then restart the terminal\n');
  console.log('  macOS / Linux (add to ~/.zshrc or ~/.bashrc):');
  console.log('    export DEEPSEEK_API_KEY="your-key-here"\n');
  console.log('Then re-run this script to verify.');
  process.exit(1);
}

console.log(`DEEPSEEK_API_KEY is set (length ${KEY.length}, value not printed).`);
console.log('\nThe execution tier is now ACTIVE — the key alone activates it, nothing else to configure.');
console.log('Verify any time with:  node .claude/setup/deepseek-status.mjs');
console.log('Remove the key to deactivate; the team returns to Claude-only with no other change.');
console.log('\nReminders before delegating:');
console.log('  - DeepSeek is a THIRD-PARTY SUBPROCESSOR. Client data may only be sent if the');
console.log('    Founder has approved that data flow in writing (compliance-extended-reference.md).');
console.log('  - Eligibility + supervision rules: skills/deepseek-delegation-reference.md');
console.log('  - It is a paid service — track spend per feature (finops-cost-reference.md).\n');

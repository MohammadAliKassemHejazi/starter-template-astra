#!/usr/bin/env node
/**
 * Optional: enable the Jules execution tier. The CEO runs this on request.
 * Cross-platform. The API key is NEVER written into this repo.
 */
import process from 'node:process';

const KEY = process.env.JULES_API_KEY;
console.log('\n=== Jules execution tier — optional setup ===\n');

if (!KEY) {
  console.log('JULES_API_KEY is not set.\n');
  console.log('1. Connect your repo to Jules once, in the web UI: https://jules.google.com');
  console.log('   (the API can only READ connected repos, not connect new ones)');
  console.log('2. Get an API key: https://jules.google.com/settings  (max 3 keys at a time)');
  console.log('3. Set it in YOUR OWN shell profile (never in a file inside this repo):\n');
  console.log('   Windows (PowerShell, persistent):');
  console.log('     setx JULES_API_KEY "your-key-here"     # then restart the terminal\n');
  console.log('   macOS / Linux (add to ~/.zshrc or ~/.bashrc):');
  console.log('     export JULES_API_KEY="your-key-here"\n');
  console.log('Then re-run this script, or: node .claude/setup/jules-status.mjs');
  process.exit(1);
}

console.log('JULES_API_KEY is set — verifying it against the live API...');
const { execSync } = await import('node:child_process');
try {
  execSync('node .claude/setup/jules-status.mjs', { stdio: 'inherit' });
} catch {
  process.exit(1);
}
console.log('\nActivation is automatic from a valid key — nothing else to configure.');
console.log('Rules: skills/jules-delegation-reference.md');
console.log('Remember: client data is whatever is in the repo Jules is pointed at — never point');
console.log('it at a repo mixing multiple clients\' code (isolation guardrail).');

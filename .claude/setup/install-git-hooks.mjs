#!/usr/bin/env node
/**
 * Installs the tracked git-hooks (.claude/setup/git-hooks/*) into .git/hooks/,
 * where git actually reads them from. .git/hooks/ is never version-controlled
 * by git itself, so this copy step is what makes them active on a fresh
 * clone — the CEO runs this once per clone, same as every other setup step.
 * Cross-platform (Windows/macOS/Linux), no npm dependency (Husky) required.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(new URL('../..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SRC = path.join(ROOT, '.claude/setup/git-hooks');
const DEST = path.join(ROOT, '.git/hooks');

if (!fs.existsSync(path.join(ROOT, '.git'))) {
  console.error('[STOP] No .git directory found here — run this from the repo root, after `git init`.');
  process.exit(1);
}
fs.mkdirSync(DEST, { recursive: true });

let installed = 0;
for (const name of fs.readdirSync(SRC)) {
  const src = path.join(SRC, name);
  const dest = path.join(DEST, name);
  fs.copyFileSync(src, dest);
  fs.chmodSync(dest, 0o755);
  installed++;
  console.log(`Installed: .git/hooks/${name}`);
}
console.log(`\n${installed} git hook(s) active. These run at the OS/git level — independent of Claude Code's own subagent-hook-propagation reliability.`);

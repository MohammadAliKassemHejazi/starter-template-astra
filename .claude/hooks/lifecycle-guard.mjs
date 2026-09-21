#!/usr/bin/env node
/**
 * PreToolUse guard: enforces "every task is planned into the sprint before code."
 * Blocks Write/Edit to source files unless an active sprint plan exists
 * (sprint-goal + backlog with content) in .claude/company/sprints/current/.
 * Fail-open on bad input; never blocks writes to planning/docs/company files.
 */
import process from 'node:process';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const input = await readInput();
const tool = typeof input.tool_name === 'string' ? input.tool_name : '';
const ti = input.tool_input && typeof input.tool_input === 'object' ? input.tool_input : {};
const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

if (tool !== 'Write' && tool !== 'Edit') process.exit(0);

const filePath = String(ti.file_path ?? ti.path ?? '');
if (!filePath) process.exit(0);

const norm = filePath.replace(/\\/g, '/');

// Never gate planning artifacts, docs, config, memory, media/social prompt folders,
// tests, or dotfiles — only real source/implementation code needs a plan first.
// Exemptions are matched STRUCTURALLY, never by substring — a substring test
// let real source files through (e.g. src/schema.mdl.ts contains ".md",
// src/docs/helper.ts contains "/docs/"). Order matters: decide by extension
// first, then by where the file actually lives.

// 1. Non-code files are never gated (docs, config, markdown, JSON, etc.).
const codeExt = /\.(ts|tsx|js|jsx|mjs|cjs|vue|svelte|py|go|rs|java|cs|rb|php|sql|css|scss)$/i;
if (!codeExt.test(norm)) process.exit(0);

// 2. Code that is part of the AGENT PACKAGE itself (not the client's app) is
//    exempt — the team must be able to write its own plan/tooling. These are
//    anchored to the package root, so a client's own src/setup/ or
//    src/company/ folder is NOT accidentally exempt.
const packagePaths = [
  '/.claude/',        // anything inside the agent package
  '/graphify-out/',   // generated graph artifacts
];
if (packagePaths.some(p => norm.includes(p))) process.exit(0);

// 3. Repo-root tooling files, matched as exact basenames (not substrings).
const rootToolingFiles = new Set([
  'next.config.js', 'next.config.mjs', 'next.config.ts',
  'tailwind.config.js', 'tailwind.config.ts',
  'vite.config.ts', 'vite.config.js',
  'eslint.config.js', 'eslint.config.mjs',
  'jest.config.js', 'jest.config.ts',
  'playwright.config.ts', 'vitest.config.ts',
]);
if (rootToolingFiles.has(norm.split('/').pop() || '')) process.exit(0);

// Hotfix bypass: an active hotfix ticket OR being on a hotfix/ branch skips
// ONLY the sprint-plan requirement below — every exemption/gate above and
// every review/test gate downstream (qa-devops, code-reviewer, integration-merge)
// is completely unaffected. Detected structurally, never assumed from a claim.
// Fails CLOSED on detection failure (no git, no sprints dir) — an undetectable
// hotfix is treated as NOT a hotfix, never the reverse.
function hotfixActive() {
  try {
    const dir = path.join(projectDir, '.claude/company/sprints/current');
    if (fs.readdirSync(dir).some(f => /^HOTFIX-.+\.md$/i.test(f))) return true;
  } catch {}
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: projectDir, stdio: ['ignore', 'pipe', 'ignore'], timeout: 2000,
    }).toString().trim();
    if (/^hotfix\//.test(branch)) return true;
  } catch {}
  return false;
}
if (hotfixActive()) process.exit(0);

// Is there an active sprint plan?
const cur = path.join(projectDir, '.claude/company/sprints/current');
const planOk = hasContent(path.join(cur, 'sprint-goal.md')) && hasContent(path.join(cur, 'backlog.md'));

if (!planOk) {
  process.stderr.write(
    'Blocked by AstraSyntx lifecycle hook: no active sprint plan found.\n' +
    'Before writing code, the Team Lead must create the plan in ' +
    '.claude/company/sprints/current/ (sprint-goal.md + backlog.md with the task and acceptance criteria). ' +
    'Product spec (product-manager) → grooming (team-lead) → plan in sprint → THEN code. ' +
    'This is the plan-before-code rule; add the task to the sprint and retry.\n'
  );
  process.exit(2);
}
process.exit(0);

function hasContent(p) {
  try {
    const t = fs.readFileSync(p, 'utf8');
    // "has content" = more than the template placeholder: at least one non-comment,
    // non-heading, non-placeholder line with real text.
    const meaningful = t.split('\n').some(line => {
      const l = line.trim();
      if (!l) return false;
      if (l.startsWith('#') || l.startsWith('>')) return false;
      if (/no active sprint|currently no active|created from templates|\*\(/.test(l.toLowerCase())) return false;
      if (/^[|\-\s]+$/.test(l)) return false; // empty table rows / rules
      return l.length > 3;
    });
    return meaningful;
  } catch { return false; }
}

async function readInput() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

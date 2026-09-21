#!/usr/bin/env node
/**
 * Cross-platform bootstrap (Windows / macOS / Linux) — Node-only, no bash.
 * This is the DEFAULT entry point: `node .claude/setup/bootstrap.mjs`.
 * The .sh scripts remain for POSIX users who prefer them; this file is what
 * the CEO runs so a Windows Founder needs no Git Bash or WSL.
 *
 * Same hard rule as bootstrap.sh: no installer is allowed to silently change
 * .claude/settings.json or .claude/CLAUDE.md. Both are snapshotted before any
 * installer runs and reverted + staged for review if touched.
 */
import { execFileSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(new URL('../..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const CLAUDE = path.join(ROOT, '.claude');
const SETTINGS = path.join(CLAUDE, 'settings.json');
const CLAUDEMD = path.join(CLAUDE, 'CLAUDE.md');
const SNAP = path.join(CLAUDE, 'setup', '.snapshots');
const GUARDED = [
  { file: SETTINGS, name: 'settings.json' },
  { file: CLAUDEMD, name: 'CLAUDE.md' },
  { dir: path.join(CLAUDE, 'skills'), name: 'skills' },
];

const log  = m => console.log(`\n==> ${m}`);
const warn = m => console.log(`[skip] ${m}`);
const err  = m => console.error(`[STOP] ${m}`);

function has(cmd, args = ['--version']) {
  try { execFileSync(cmd, args, { stdio: 'ignore', shell: process.platform === 'win32' }); return true; }
  catch { return false; }
}
function run(cmd, args) {
  try { execFileSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', cwd: ROOT }); return true; }
  catch { return false; }
}

function snapshot() {
  fs.mkdirSync(SNAP, { recursive: true });
  for (const g of GUARDED) {
    if (g.file && fs.existsSync(g.file)) fs.copyFileSync(g.file, path.join(SNAP, `${g.name}.before`));
    if (g.dir && fs.existsSync(g.dir)) {
      fs.writeFileSync(path.join(SNAP, `${g.name}.listing.before`),
        fs.readdirSync(g.dir).sort().join('\n'));
    }
  }
}

function checkGuarded() {
  let changed = false;
  for (const g of GUARDED) {
    if (g.file) {
      const before = path.join(SNAP, `${g.name}.before`);
      if (fs.existsSync(before) && fs.readFileSync(before, 'utf8') !== fs.readFileSync(g.file, 'utf8')) {
        changed = true;
        err(`An installer modified .claude/${g.name} without review — reverting.`);
        fs.copyFileSync(g.file, path.join(SNAP, `${g.name}.attempted-by-installer`));
        fs.copyFileSync(before, g.file);
      }
    }
    if (g.dir) {
      const before = path.join(SNAP, `${g.name}.listing.before`);
      if (fs.existsSync(before)) {
        const was = fs.readFileSync(before, 'utf8').split('\n').filter(Boolean);
        const now = fs.readdirSync(g.dir).sort();
        const added = now.filter(f => !was.includes(f));
        if (added.length) {
          changed = true;
          err(`An installer added files to .claude/${g.name}/: ${added.join(', ')}`);
          err('These bypass the lean skill.md + skill-reference.md convention and are not in skills/INDEX.md.');
          err('Review them and either convert them to the convention (and add an INDEX row) or delete them.');
        }
      }
    }
  }
  if (changed) {
    err('Attempted changes saved in .claude/setup/.snapshots/ — apply deliberately via a decision request (guardrail 8), never automatically.');
  }
}

log(`AstraSyntx bootstrap in: ${ROOT}  (platform: ${process.platform})`);
snapshot();

// 1. graphify
const graphifyOk = () => has('graphify') || (() => {
  try { execSync('python -c "import graphify"', { stdio: 'ignore' }); return true; } catch { return false; }
})();

if (graphifyOk()) warn('graphify already installed');
else {
  log('Installing graphify (graphifyy)');
  if (has('uv')) run('uv', ['tool', 'install', 'graphifyy']);
  else if (has('pipx')) run('pipx', ['install', 'graphifyy']);
  else if (has('pip')) run('pip', ['install', '--user', 'graphifyy']);
  else warn('no uv/pipx/pip found — install one, then re-run');
}

if (graphifyOk()) {
  // Resolve a working invocation (handles sandboxed graphify.exe on Windows).
  const forms = [['graphify', []], ['python', ['-m', 'graphify']], ['python3', ['-m', 'graphify']]];
  const working = forms.find(([c, a]) => has(c, [...a, '--version']));
  if (!working) {
    warn('graphify installed but no invocation form works (graphify / python -m graphify / python3 -m graphify) — skipping graph build');
  } else {
    const [cmd, base] = working;
    log(`graphify invocation: ${cmd} ${base.join(' ')}`.trim());
    // NOTE: --strict deliberately NOT passed. It installs PreToolUse read/search
    // hooks, which are a reviewed security decision (guardrail 8), not an
    // installer's call. Agents query the graph via skills/project-graph.md.
    log('Registering graphify skill (project scope, no --strict)');
    run(cmd, [...base, 'install', '--project']);
    log('Building initial knowledge graph');
    run(cmd, [...base, '.']);
    log('Installing graphify git hook (incremental updates on commit)');
    run(cmd, [...base, 'hook', 'install']);
    const gi = path.join(ROOT, '.gitignore');
    const cur = fs.existsSync(gi) ? fs.readFileSync(gi, 'utf8') : '';
    if (!cur.split('\n').includes('graphify-out/')) fs.appendFileSync(gi, '\ngraphify-out/\n');
    checkGuarded();
  }
}

// 2. repomix
if (has('npx', ['--version'])) log('repomix available via `npx repomix` (config: repomix.config.json)');
else warn('node/npx not found — install Node to use repomix');

// 3. folders
log('Scaffolding media + social + product + feedback folders');
scaffold();

log('Bootstrap complete. See .claude/setup/SETUP.md. Any reverted installer change is in .claude/setup/.snapshots/.');

function scaffold() {
  const C = path.join(CLAUDE, 'company');
  const dirs = [
    'media/images/prompts', 'media/images/generated',
    'media/video/prompts', 'media/video/generated',
    'social/posts', 'social/prompts', 'product', 'feedback',
  ];
  for (const d of dirs) {
    const full = path.join(C, d);
    fs.mkdirSync(full, { recursive: true });
    const keep = path.join(full, '.gitkeep');
    if (!fs.existsSync(keep) && fs.readdirSync(full).length === 0) fs.writeFileSync(keep, '');
  }
  const seed = (rel, content) => {
    const f = path.join(C, rel);
    if (!fs.existsSync(f)) fs.writeFileSync(f, content);
  };
  seed('media/images/STYLE-GUIDE.md', '# Visual Style Guide (the brand spine)\n\n> Filled by media-prompt-director on the first media task, from the website\n> personality (web-design-rules.md) + business-context.md.\n\n## Personality:\n## Palette:\n## Medium/style:\n## Lighting & mood:\n## Recurring motif:\n## Do / Don\'t:\n');
  seed('social/calendar.md', '# Social Media Calendar\n\n| Date | Platform | Pillar | Format | Hook | Media (prompt ref) | Copy ref | Status |\n|---|---|---|---|---|---|---|---|\n');
  seed('feedback/feedback-log.md', '# Feedback Log (clustered)\n\n| Cluster / issue | Type | Count | Severity | Status | Routed to |\n|---|---|---|---|---|---|\n');
  seed('jules-lessons.md', '# Jules Lessons\n\n> Read automatically by run-jules-task.mjs create; written by whichever\n> specialist fixes a Jules PR issue. Cap ~150 lines, roll old entries into\n> a dated summary when exceeded.\n\n*(no lessons recorded yet)*\n');
  seed('product/README.md', '# Product specs\n\nPRDs, journeys, wireframe specs by product-manager. One file per feature: prd-<feature>.md.\n');
}

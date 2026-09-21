#!/usr/bin/env node
/**
 * Jules task lifecycle: create, poll, answer questions, approve plans.
 * Invoked directly via Bash by the owning specialist — Jules is a cloud
 * service, not a Task-dispatched persona, so this follows the same
 * tool script rather than a Task-dispatched subagent.
 *
 * API verified against https://jules.google/docs/api/reference (Sessions,
 * Activities, Sources pages) — base URL, auth header, states, and activity
 * shapes below are taken directly from that live documentation, not assumed.
 *
 * Subcommands:
 *   create <brief.md> --repo owner/name [--branch main] [--title "..."]
 *   poll <session-id-or-name> [--max-wait 180]
 *   answer <session-id-or-name> "<response text>"
 *   approve-plan <session-id-or-name>
 *   list
 */
import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import process from 'node:process';
import { checkAndRecordRate } from './lib/rate-guard.mjs';

const KEY = process.env.JULES_API_KEY;
if (!KEY) {
  console.error('[STOP] JULES_API_KEY is not set. Run: node .claude/setup/connect-jules.mjs');
  process.exit(1);
}

function call(method, apiPath, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'jules.googleapis.com',
      path: `/v1alpha/${apiPath}`,
      method,
      headers: {
        'x-goog-api-key': KEY,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
      timeout: 15000,
    }, res => {
      let out = '';
      res.on('data', c => out += c);
      res.on('end', () => {
        let parsed = {};
        try { parsed = out ? JSON.parse(out) : {}; } catch {}
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
        else reject(new Error(`HTTP ${res.statusCode}: ${parsed?.error?.message || out || 'no body'}`));
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('request timed out')); });
    if (data) req.write(data);
    req.end();
  });
}

function sessionName(idOrName) {
  return idOrName.startsWith('sessions/') ? idOrName : `sessions/${idOrName}`;
}

function readLessonsFile(root) {
  const p = path.join(root, '.claude/company/jules-lessons.md');
  try {
    const content = fs.readFileSync(p, 'utf8').trim();
    if (!content || /no lessons recorded yet/i.test(content)) return null;
    return content;
  } catch { return null; }
}

// ---------- create ----------
async function cmdCreate(args) {
  const briefPath = args._[0];
  if (!briefPath) { console.error('[STOP] Usage: create <brief.md> --repo owner/name [--branch main] [--title "..."]'); process.exit(1); }
  if (!args.repo) { console.error('[STOP] --repo owner/name is required (must already be connected to Jules via the web UI).'); process.exit(1); }

  // Circuit breaker: refuse to create more than 5 sessions per 10-minute
  // window. This is what stops a retry/error loop from silently burning
  // Jules' daily task quota or an hourly rate limit in minutes — a real,
  // documented failure mode for runaway agent loops generally.
  const rate = checkAndRecordRate(process.cwd(), 'jules', { maxPerWindow: 5, windowMs: 10 * 60 * 1000 });
  if (!rate.allowed) {
    console.error(`[STOP] Rate limit: ${rate.count} Jules sessions already created in the last 10 minutes.`);
    console.error(`This looks like a retry loop, not intentional use. Retry after ${rate.retryAfterSeconds}s, or if this`);
    console.error('volume is genuinely intentional, the Founder/CEO can proceed manually via the Jules web UI instead.');
    process.exit(1);
  }

  const brief = fs.readFileSync(briefPath, 'utf8');
  const root = process.cwd();
  const lessons = readLessonsFile(root);

  let prompt = brief.trim();
  prompt += '\n\n---\n## Conventions\nFollow docs/CONVENTIONS.md and shared-contracts-reference.md exactly — use existing shared/ types, never redeclare a contract shape. If anything in this brief is ambiguous or you would need to invent a pattern, ASK rather than guess.';
  if (lessons) {
    prompt += `\n\n---\n## Known issues from past sessions — do not repeat these\n${lessons}`;
  }

  const [owner, repo] = args.repo.split('/');
  const sourceId = `github-${owner}-${repo}`;
  const body = {
    prompt,
    title: args.title || path.basename(briefPath, '.md'),
    sourceContext: { source: `sources/${sourceId}`, githubRepoContext: { startingBranch: args.branch || 'main' } },
    requirePlanApproval: true,
    automationMode: 'AUTO_CREATE_PR',
  };

  const session = await call('POST', 'sessions', body);
  console.log(`Session created: ${session.name} (state: ${session.state})`);
  console.log(`Jules URL: ${session.url || '(not returned)'}`);
  console.log(lessons ? 'Included accumulated lessons from company/jules-lessons.md.' : 'No prior lessons file yet — sent brief + conventions only.');
  console.log(`\nCheck on it later with:  node .claude/setup/run-jules-task.mjs poll ${session.id || session.name}`);
}

// ---------- poll ----------
async function cmdPoll(args) {
  const id = args._[0];
  if (!id) { console.error('[STOP] Usage: poll <session-id-or-name>'); process.exit(1); }
  const name = sessionName(id);
  const maxWaitMs = (Number(args['max-wait']) || 180) * 1000;
  const start = Date.now();
  const POLL_INTERVAL_MS = 10000;

  while (true) {
    const session = await call('GET', name);
    const state = session.state;

    if (state === 'COMPLETED') {
      const pr = session.outputs?.find(o => o.pullRequest)?.pullRequest;
      console.log(`COMPLETED.`);
      if (pr) {
        console.log(`Pull request: ${pr.url}`);
        console.log(`Title: ${pr.title}`);
        console.log(`\nHand off to the review chain now (code-reviewer/security-auditor/a11y-auditor -> qa-devops -> integration-merge) — treat like any other PR, no shortcuts.`);
      } else {
        console.log('No pull request in outputs — check the session in the Jules web UI.');
      }
      return process.exit(0);
    }

    if (state === 'FAILED') {
      const activities = await call('GET', `${name}/activities?pageSize=20`);
      const failure = activities.activities?.find(a => a.sessionFailed)?.sessionFailed;
      console.log(`FAILED. Reason: ${failure?.reason || '(not provided — check activities in the web UI)'}`);
      console.log('Decide: revise the brief and retry, or escalate. Either way, record this in company/jules-lessons.md.');
      return process.exit(1);
    }

    if (state === 'AWAITING_PLAN_APPROVAL') {
      const activities = await call('GET', `${name}/activities?pageSize=20`);
      const plan = activities.activities?.find(a => a.planGenerated)?.planGenerated?.plan;
      console.log('NEEDS PLAN APPROVAL. Review against the brief before approving:');
      (plan?.steps || []).forEach(s => console.log(`  ${s.index}. ${s.title} — ${s.description}`));
      console.log(`\nIf it matches the brief:  node .claude/setup/run-jules-task.mjs approve-plan ${id}`);
      console.log(`If it needs redirecting:  node .claude/setup/run-jules-task.mjs answer ${id} "<feedback>"`);
      return process.exit(3);
    }

    if (state === 'AWAITING_USER_FEEDBACK' || state === 'PAUSED') {
      const activities = await call('GET', `${name}/activities?pageSize=20`);
      const msg = [...(activities.activities || [])].reverse().find(a => a.agentMessaged)?.agentMessaged?.agentMessage;
      console.log(`NEEDS AN ANSWER (state: ${state}). Jules asked:`);
      console.log(`  "${msg || '(no agent message found — check activities in the web UI)'}"`);
      console.log(`\nAnswer from the brief/conventions/lessons file, then:`);
      console.log(`  node .claude/setup/run-jules-task.mjs answer ${id} "<your answer>"`);
      return process.exit(4);
    }

    // QUEUED / PLANNING / IN_PROGRESS — keep waiting, within this call's budget.
    if (Date.now() - start >= maxWaitMs) {
      console.log(`Still ${state} after ${Math.round(maxWaitMs / 1000)}s. Not a failure — check back later:`);
      console.log(`  node .claude/setup/run-jules-task.mjs poll ${id}`);
      return process.exit(0);
    }
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
  }
}

// ---------- answer ----------
async function cmdAnswer(args) {
  const [id, text] = args._;
  if (!id || !text) { console.error('[STOP] Usage: answer <session-id-or-name> "<response text>"'); process.exit(1); }
  await call('POST', `${sessionName(id)}:sendMessage`, { prompt: text });
  console.log('Answer sent. Resume checking with:');
  console.log(`  node .claude/setup/run-jules-task.mjs poll ${id}`);
}

// ---------- approve-plan ----------
async function cmdApprovePlan(args) {
  const id = args._[0];
  if (!id) { console.error('[STOP] Usage: approve-plan <session-id-or-name>'); process.exit(1); }
  await call('POST', `${sessionName(id)}:approvePlan`, {});
  console.log('Plan approved. Jules will now start executing. Resume checking with:');
  console.log(`  node .claude/setup/run-jules-task.mjs poll ${id}`);
}

// ---------- list ----------
async function cmdList() {
  const res = await call('GET', 'sessions?pageSize=20');
  (res.sessions || []).forEach(s => console.log(`${s.id}\t${s.state}\t${s.title || '(untitled)'}`));
  if (!res.sessions?.length) console.log('No sessions found.');
}

// ---------- arg parsing + dispatch ----------
function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) { out[a.slice(2)] = argv[i + 1]; i++; }
    else out._.push(a);
  }
  return out;
}

const [, , cmd, ...rest] = process.argv;
const args = parseArgs(rest);

try {
  if (cmd === 'create') await cmdCreate(args);
  else if (cmd === 'poll') await cmdPoll(args);
  else if (cmd === 'answer') await cmdAnswer(args);
  else if (cmd === 'approve-plan') await cmdApprovePlan(args);
  else if (cmd === 'list') await cmdList();
  else {
    console.error('Usage: run-jules-task.mjs <create|poll|answer|approve-plan|list> ...');
    process.exit(1);
  }
} catch (e) {
  console.error(`[STOP] ${e.message}`);
  process.exit(1);
}

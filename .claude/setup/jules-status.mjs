#!/usr/bin/env node
/**
 * Single source of truth for whether the Jules execution tier is ACTIVE.
 * Unlike deepseek-status.mjs (which can only check key presence — no known
 * cheap validation call), Jules exposes GET /v1alpha/sources as a real,
 * side-effect-free read — so this ACTUALLY validates the key against the
 * live API, not just checks that an env var is non-empty.
 *
 * Usage: node .claude/setup/jules-status.mjs [--json]
 * Exit code: 0 = active (key present AND valid), 1 = inactive.
 */
import https from 'node:https';
import process from 'node:process';

const KEY = process.env.JULES_API_KEY || '';

function callJules(path) {
  return new Promise(resolve => {
    const req = https.request({
      hostname: 'jules.googleapis.com',
      path: `/v1alpha/${path}`,
      method: 'GET',
      headers: { 'x-goog-api-key': KEY },
      timeout: 5000,
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', () => resolve({ status: 0, body: '' }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, body: '' }); });
    req.end();
  });
}

if (!KEY.trim()) {
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ active: false, reason: 'JULES_API_KEY not set' }));
  } else {
    console.log('Jules execution tier: INACTIVE (no JULES_API_KEY set).');
    console.log('The team runs without it — identical workflow, gates, and quality bar.');
    console.log('To enable: get a key at https://jules.google.com/settings, set JULES_API_KEY');
    console.log('in your own shell (never in the repo), then re-run.');
  }
  process.exit(1);
}

const { status, body } = await callJules('sources?pageSize=1');
const valid = status === 200;
let sourceCount = null;
if (valid) {
  try { sourceCount = (JSON.parse(body).sources || []).length > 0 ? 'at least 1' : '0'; } catch {}
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ active: valid, httpStatus: status, keyLength: KEY.trim().length }));
} else if (valid) {
  console.log(`Jules execution tier: ACTIVE (key verified live against GET /sources, HTTP ${status}).`);
  console.log(`Connected repos visible to this key: ${sourceCount ?? 'unknown'}.`);
  console.log('Claude architects and reviews; Jules executes asynchronously and opens the PR.');
  console.log('Rules: skills/jules-delegation-reference.md');
} else {
  console.log(`Jules execution tier: INACTIVE — JULES_API_KEY is set but the API call failed (HTTP ${status || 'no response'}).`);
  console.log('Check the key at https://jules.google.com/settings — it may be invalid, revoked, or expired.');
  console.log('If this persists, verify https://jules.google/docs/api/reference hasn\'t changed the auth header or base URL.');
}
process.exit(valid ? 0 : 1);

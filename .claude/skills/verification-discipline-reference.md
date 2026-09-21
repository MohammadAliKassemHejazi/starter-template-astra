# Reference: verification-discipline

Deep detail for `verification-discipline.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## 1. Never trust an agent's own numbers — re-run and re-count
Self-reported counts have been wrong by 2x (e.g. "69 files/521 tests" was really
36/277; "41/41 success" was really 0 — a logic bug faked the success). The tool
output an agent quotes, or the sample it eyeballed, is a claim, not a fact.

Before ANY completion report leaves you:
- **Re-run fresh**, don't quote a cached result: `tsc --noEmit`, the test command, `build` — from clean, right now.
- **Re-count from source**, don't relay a specialist's or a script's tally: count the actual files changed (`git diff --name-only`), the actual tests (run them, read the summary), the actual rows affected.
- **Spot-check diffs**: open a random few changed files and confirm they contain what the report says.
- A script that reports its own success is suspect by default — verify the effect it claims (rows written, files created) independently of its exit message.

## 2. One fabricated detail poisons the whole report
A single confident, specific, INVENTED claim (a CSS value that wasn't in the
codebase; a bug that didn't exist) has appeared in both AI-generated and
external reports. The rule: **one proven fabrication = re-verify every other
claim in that report against source**, not just the bad one. In practice this
has surfaced additional fabrications every time. Cheap to re-check against real
code; a whole sprint built on invented findings is not.

Applies to: external audits passed in, specialist reports, your own drafts before
they go up the chain. Every load-bearing specific (a file path, a value, a count,
a "this function does X") must trace to something you actually observed.

## 3. Protect live data like production — even in dev
The worst incident in the prior project: a seed-script bug silently wiped two
days of AI-generated content on every container restart, undetected for weeks.
Separately, a debugging script injected literal test junk into a live published
DB.

Rules:
- **Destructive-adjacent DB work** (reseed, round-trip tests, migration verification, bulk update/delete scripts) gets the same caution as `git reset --hard`: run it against a **disposable copy or snapshot first**, never the shared dev DB as the sandbox.
- Seed scripts that run on startup are guilty until proven idempotent-and-non-destructive — a seed must never delete or overwrite existing data it didn't create this run.
- Any script touching data logs a **before/after row count**; an unexpected drop is an alarm, not a shrug.
- Models without a real unique key (a stable slug, not order-based matching) are fragile — flag them as a hardening item; order-based row matching silently corrupts under reordering.
- Actual destructive migrations/operations remain **Always-Stop** (Founder approval) regardless of the above.

## 4. Background / async task hygiene
A resumed background task was lost track of, then three more overlapping tasks
were dispatched against the same dev DB — hours of phantom "rogue session"
debugging that was really an orchestration error.

Rules:
- Once a background task is **resumed or launched, treat it as ACTIVE** until its own completion notification arrives. Do NOT dispatch another task against the same shared resource (same DB, same branch, same files) in the meantime.
- A **"FAILED" or "session-limit" notification is one run's snapshot, not proof of zero progress.** Before relaunching from scratch, check real state — `git status`, the daily log, the DB — and resume from where things actually are, not from zero.
- One shared resource = one active writer at a time. Serialize; never fan out overlapping writers.

## How this shows up in reports
Every completion/status report carries a one-line **verification stamp**:
`Verified: tsc ✓ / tests ✓ (N re-run, not quoted) / N files (counted from git) / data-safe ✓`.
No stamp → the report isn't done. The stamp means you re-ran and re-counted, not that a specialist told you so.

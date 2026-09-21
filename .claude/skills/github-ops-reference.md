# Reference: github-ops

Deep detail for `github-ops.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Jules-opened PRs
A PR Jules opened (`jules-delegation-reference.md`) is reviewed and merged through this exact same workflow — no special-casing. Treat it as an outside contribution: full review chain, no shortcut for "the agent already tested it in its own VM."

## PR workflow
- Branch per story: `story/NN-short-name`; conventional commits, one concern per commit.
- PR description template: **What** (1–2 lines) · **Why** (story link) · **How verified** (test evidence, Playwright screenshot ref) · **Risk/rollback** (one line).
- Small PRs — a story that produces a 2000-line PR was mis-split; flag to team-lead.
- Never force-push shared branches; never commit secrets (pre-check diffs for `.env`, keys, tokens before pushing).

## Review protocol (when reviewing others' PRs)
Read the story's acceptance criteria first → check the diff against CONVENTIONS.md → run the checks locally if executable → comment with specific, actionable items (file:line), never vague. Approve = you'd deploy it.

## Issues & tickets
Triage: label (bug/feature/debt) + severity + link to affected story. If the client uses **Linear/Jira via MCP**, mirror status transitions there on PR open/merge and write the PR summary into the ticket — one source of truth per client, stated in `business-context.md`.

## Releases
Tag from main only after QA PASS; changelog generated from conventional commits; deploy itself remains Always-Stop.

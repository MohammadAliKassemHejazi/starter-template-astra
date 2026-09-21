# Reference: jules-delegation

Deep detail for `jules-delegation.md`. Read when actually using this tier.
Assumes `deepseek-delegation-reference.md` has already been read for the
shared architect/executor discipline — this file covers what's different
about an async, cloud, PR-native tier.

## Tier selection
| Tier | Cost | Latency | Best for |
|---|---|---|---|
| Claude direct | Premium tokens | Immediate | Decisions, anything sensitive, ambiguous work |
| DeepSeek | Cheap API | Fast (seconds) | Well-specified bulk work too large for Claude to type itself |
| **Jules** | Free during beta, usage-limited | **Slow (minutes+), asynchronous** | Well-specified, SELF-CONTAINED features/fixes that can run unattended while the team does other work — Jules clones the repo, builds/tests in its own cloud VM, and opens the PR itself |

Jules is the right choice specifically when the task is well-specified but would otherwise tie up a turn waiting — hand it off, keep working, check back.

## The API (verified against Jules' current documentation — jules.google/docs/api/reference)
Base URL `https://jules.googleapis.com/v1alpha`. Auth: header `X-Goog-Api-Key: $JULES_API_KEY` (get the key at jules.google.com/settings — max 3 keys at a time).

- `GET /sources` — list repos connected to Jules (connecting a NEW repo is done once, in the Jules web UI, not via API — the API only reads sources).
- `POST /sessions` — create a task: `{prompt, title, sourceContext: {source: "sources/...", githubRepoContext: {startingBranch}}, requirePlanApproval: true, automationMode: "AUTO_CREATE_PR"}`. `AUTO_CREATE_PR` is what makes "Jules finishes and there's a PR" happen without a manual publish click. `requirePlanApproval: true` is our team's default — Claude reviews Jules' plan before it starts touching code, a cheap extra checkpoint on a tier that runs directly in a clone of the real repo (unlike a sandboxed local execution tier, Jules has no isolated worktree of its own).
- `GET /sessions/{id}` — poll. `state` is one of: `QUEUED`, `PLANNING`, `AWAITING_PLAN_APPROVAL`, `AWAITING_USER_FEEDBACK`, `IN_PROGRESS`, `PAUSED`, `COMPLETED`, `FAILED`. On `COMPLETED`, `outputs[].pullRequest.{url,title,description}` is the PR.
- `GET /sessions/{id}/activities` — the event log. An `agentMessaged.agentMessage` activity is Jules asking a question — this is the exact text to read and answer. A `planGenerated.plan.steps[]` activity is what to review before approving. `sessionFailed.reason` explains a failure.
- `POST /sessions/{id}:sendMessage` `{prompt}` — answer a question, or give the session general feedback/instructions.
- `POST /sessions/{id}:approvePlan` `{}` — approve a pending plan (only needed because we set `requirePlanApproval: true`).

## The lifecycle
1. Owning specialist writes `templates/implementation-brief.md` — full rigor, identical bar to DeepSeek (mirror an existing file, exact `@project/shared` contracts, explicit do-not-invent list, acceptance criteria).
2. `node .claude/setup/run-jules-task.mjs create path/to/brief.md --repo owner/name --branch main` — resolves the source, builds the prompt (brief content + a conventions pointer + the accumulated `company/jules-lessons.md` content, appended AUTOMATICALLY so this never depends on remembering to do it), creates the session, prints the session ID and Jules' own web URL. Returns immediately — does not block.
3. `node .claude/setup/run-jules-task.mjs poll <session-id>` — call this again across the specialist's own later turns (not a tight synchronous loop holding up everything else). Each call polls for up to a few minutes and returns one of:
   - **still working** — nothing to do, check again later.
   - **needs plan approval** — prints the plan's steps; the specialist reviews them against the brief and either `approve-plan <id>` or `answer <id> "<feedback>"` to redirect it.
   - **needs an answer** — prints Jules' exact question (from `agentMessaged`); THIS is where Claude's judgment matters — read the question, answer from the brief/conventions/lessons file, then `answer <id> "<response>"`. A script cannot answer a novel question; that's why this step hands control back to Claude rather than trying to auto-respond.
   - **completed** — prints the PR url/title/description. Hand off to review.
   - **failed** — prints `sessionFailed.reason`. Decide: revise the brief and retry, or escalate — and record why it failed as a lesson either way.
4. **Review the PR like any other outside contribution** — same checklist as `deepseek-delegation-reference.md`: contract conformance first (did it import from `@project/shared` or redeclare a shape locally), then conventions, then invented surface, then acceptance criteria, then a fresh `npm run check` — never assume Jules' own in-VM test run is sufficient; re-verify (`verification-discipline-reference.md`).
5. Standard review chain, unchanged, because this is already a real GitHub PR: `code-reviewer` → `security-auditor`/`a11y-auditor` if triggered → `qa-devops` → `integration-merge`. No special-casing — `github-ops.md`'s PR conventions apply exactly as to a human-opened PR.
6. **If review finds a problem**: fix it as an ordinary follow-up commit on the PR (don't assume sending Jules another message will correctly revise a session past `COMPLETED` — that behavior isn't well-documented; treat a completed session as done, and iterate via normal commits like you would on anyone's PR). Then — mandatory, not optional — append the issue and its fix to `company/jules-lessons.md`.

## The lessons file (`company/jules-lessons.md`) — the feedback loop the Founder asked for
Format per entry: `date · task summary · what Jules got wrong · the fix · the generalizable lesson`. The `create` subcommand reads this file automatically and appends a "Known issues from past sessions — do not repeat these" section to every new prompt — this is mechanical, not something a specialist needs to remember. Same size discipline as `ceo-memory.md`/`decision-log.md` (`token-efficiency-reference.md`'s Memory & log hygiene): cap around 150 lines, roll the oldest half into a compact dated summary when exceeded, keep recent entries at full detail.

## Guardrails
Jules works directly against a clone of the real repo (via GitHub, not an isolated worktree) — this is why plan approval is our default and why PR review is never skipped, not even for something that "looks small." Client data is whatever is in the repo Jules is pointed at — never point Jules at a repo containing a different client's code (isolation guardrail). Nothing here bypasses Always-Stop: Jules doesn't touch production, doesn't merge its own PR, and any task implying money/auth/destructive-data work is Claude-only, same list as the other two tiers.

## Failure modes
Sending a vague prompt and hoping Jules infers the conventions (attach them every time — the create script does this automatically, but a hand-crafted prompt bypassing the script won't) · approving a plan without actually reading it against the brief · treating Jules' own in-VM "tests passed" as sufficient without re-running `npm run check` after merge review · forgetting to record a lesson after fixing a PR issue (guarantees the same mistake next time) · letting `jules-lessons.md` grow unbounded instead of rolling old entries into a summary · polling in a tight loop that blocks all other work instead of checking back across natural turn boundaries · pointing a session at the wrong repo/branch.

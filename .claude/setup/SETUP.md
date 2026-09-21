# Setup & Automation — you talk to the CEO, the CEO runs setup

> **You never run these commands.** Tell the CEO "set up my tools" (or ask for a
> specific one). The CEO confirms what will run, then executes `setup/bootstrap.sh`
> or a single script on your behalf, and reports what happened. This file
> documents what the automation does so any agent (or you) can verify it.

## Cross-tool compatibility (Codex, Jules, etc.)
Root `AGENTS.md` carries the tool-agnostic essentials (stack, conventions,
build/test commands) — Codex and Jules read it natively; `CLAUDE.md` imports
it (`@AGENTS.md`) so nothing is duplicated. The 29-agent roster and
`.claude/hooks/` are Claude-Code-specific and don't port — that's expected.
`.claude/setup/git-hooks/` (installed via `install-git-hooks.mjs`) is the one
enforcement layer that works identically no matter which tool made the change.

## Git-level safety hooks (defense-in-depth, install once per clone)
`node .claude/setup/install-git-hooks.mjs` copies `.claude/setup/git-hooks/*` into
`.git/hooks/` — git itself invokes these on every commit/push, independent of
whether Claude Code's own hooks reached the agent that made the change. Not
optional in the same sense as the delegation tiers — every fresh clone should
run this once. Cross-platform, no npm dependency.

## Usage checkpointing (optional enhancement, always-on core)
`usage-status.mjs` — best-effort only. If the optional third-party `ccusage` CLI
is installed (`uv tool install ccusage`), it reports real Claude session/weekly
usage percentages, which `usage-checkpoint-guard.mjs` uses to escalate the
checkpoint reminder. **Not required** — the core discipline (rewrite
`company/sprints/current/RESUME-POINT.md` after every completed unit of work)
works identically with or without it, because there is no documented, stable
way for a hook to query Claude Code's own usage limit directly (`/usage` is a
human-typed slash command, not a scriptable API).

## Project-start tool setup (Ponytail, Headroom, CodeBurn — from day one; graphify after v1)

Four external tools, none written by this template — the Founder installs them, verified as real and current before being documented here:

- **Ponytail** (minimal-code discipline plugin — complements `engineering-craft-reference.md`'s simplicity rule with an actual enforcement hook). Install once, inside an active Claude Code session (these are slash commands, not shell commands — `bootstrap.mjs` cannot run them for you):
  ```
  /plugin marketplace add DietrichGebert/ponytail
  /plugin install ponytail@ponytail
  ```
  Start a new session after installing. Default mode is fine; `/ponytail-review` audits the current diff for over-engineering on demand.

- **Headroom** (compresses tool output/logs/files before they reach context — 20%+ fewer tokens on coding agents). Shell-installable, but activation changes how Claude Code itself is *launched*:
  ```
  pip install headroom-ai[proxy]
  ```
  From then on, start sessions with `headroom wrap claude` instead of `claude` directly — this is the project's standing launch command from here on, not a one-time setup step.

- **CodeBurn** (local usage/cost dashboard — reads session logs directly, no network, no API key). Fully shell-scriptable:
  ```
  npm install -g codeburn
  ```
  `usage-status.mjs` detects it automatically; run `codeburn today` any time for the full breakdown.

- **graphify** — deliberately set up AFTER v1 ships, not at project start. A repository knowledge graph is most useful once there's an actual codebase shape to graph; running it against an empty scaffold adds setup friction for no benefit. `bootstrap.mjs`/`bootstrap.sh` handle it whenever the Founder is ready — this is a judgment call for the CEO to make, not a mechanically-gated step.

## Windows, macOS, Linux — one cross-platform entry point
**`node .claude/setup/bootstrap.mjs`** is the default and works everywhere with no Git Bash or WSL.
The `.sh` scripts remain for POSIX users who prefer them; they do the same thing.
Every helper has both forms: `connect-mcp`, `connect-deepseek`, `scaffold-folders`.

## One command does everything
`bash .claude/setup/bootstrap.sh` — idempotent, safe to re-run. It:
1. Installs **graphify** (`graphifyy`) via uv/pipx/pip, runs `graphify install --project --strict`, builds the initial graph (`graphify .`), installs the git hook for incremental updates, and adds `graphify-out/` to `.gitignore`. → the code knowledge graph that cuts token use (pairs with `skills/project-graph.md`).
2. Confirms **repomix** is reachable via `npx repomix` (compressed codebase bundling for subagents; ~70% token savings — no global install needed).
3. Scaffolds the **media / social / product / feedback** folders (`setup/scaffold-folders.sh`).
4. Ensures hooks are executable.

## Individual scripts
- `setup/scaffold-folders.sh` — creates `company/media/`, `company/social/`, `company/product/`, `company/feedback/` with seed files. Safe to run anytime (media-prompt-director calls it before the first media task).
- `setup/connect-deepseek.mjs` (or `.sh`) — OPTIONAL execution tier. Prints the exact per-platform command to set `DEEPSEEK_API_KEY` in YOUR shell (never in the repo). **Activation is automatic from the key alone** — no file to edit. `setup/deepseek-status.mjs` reports ACTIVE/INACTIVE (exit 0/1). Remove the key to deactivate. The only thing recorded in `business-context.md` is the Founder's data-flow decision (whether client data may be sent at all), which is never automatic.
- `setup/connect-jules.mjs` (or `.sh`) — OPTIONAL execution tier. Same pattern: prints where to get/set `JULES_API_KEY`. `setup/jules-status.mjs` VALIDATES the key against a real API call (`GET /sources`), not just checks presence — a set-but-invalid key correctly reports INACTIVE. Connecting a repo to Jules itself is a one-time step in the Jules web UI (jules.google.com), not something the API or this script does.
- `setup/connect-mcp.sh <postgres|github>` — connects a CREDENTIALED MCP server to PERSONAL scope (`~/.claude.json`), never project scope. Nothing is ever written into this repo's `.mcp.json` for a server that needs a secret — that file only ever holds servers requiring no credential (currently: the docs server and Playwright's local browser server, both pre-included and safe to share).

## What the CEO does for you (no manual steps for the Founder)
- "Set up my tools" → CEO runs `bootstrap.sh`, reports results, flags anything that needs your input (e.g. a missing package manager).
- "I want social planning / images for X" → CEO routes to media-prompt-director, which ensures folders exist (scaffold) and writes prompt files you then run in Gemini.
- Any future tool a task needs → the CEO proposes it, gets your OK, and runs the install through a setup script rather than asking you to.

## Tools this integrates (all optional, all token-savers)
| Tool | Purpose | Invoked |
|---|---|---|
| graphify (`graphifyy`) | AST → queryable code graph; agents query the graph before reading raw files | `bootstrap.sh` |
| repomix | compressed single-file codebase slices for subagents | `npx repomix` on demand |
| (project-graph skill) | how agents USE the graph for impact/blast-radius analysis | always available |

## Guardrails
Installing tooling is a setup action the CEO runs transparently after your OK — never silently, and never anything with a cost without the Always-Stop money gate. Scripts fail-open (a failed optional step is non-fatal and reported, never a silent break). `graphify-out/` is gitignored by default.

## Verify it worked
- `graphify --version` and presence of `graphify-out/graph.json` + `GRAPH_REPORT.md`.
- Folders exist under `.claude/company/media|social|product|feedback`.
- Re-running `bootstrap.sh` reports "already installed" for graphify (idempotent).

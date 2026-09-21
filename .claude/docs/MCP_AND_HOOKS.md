# MCP and Hooks — Safe Project Setup

> This package supports **optional, project-local MCP servers and enforcement hooks**. Both are deliberately minimal: they must improve a real workflow, remain transparent to the Founder, and never contain secrets, implicit production access, or broad destructive authority.

## Why they were not included originally

MCP servers and hooks execute or connect outside the model. A project-scoped MCP server can connect to a remote service or launch a local process, while hooks run commands at lifecycle events. Their correct configuration depends on the Founder’s approved tools, operating system, credentials, access model, and risk tolerance. A generic bundle of pre-enabled integrations would waste context, prompt for unnecessary approval, and could create an unsafe trust boundary.

The package now includes a **safe baseline**: a root `.mcp.json` containing only a public, read-only documentation connector, and project-local hooks that block a narrow set of dangerous operations. The Founder must review and approve project MCP servers in Claude Code before they connect; this approval is a protection against a cloned repository launching processes without consent.[1]

## Configuration locations

| File | Scope | Commit it? | Intended use |
|---|---|---:|---|
| `.mcp.json` at repository root | Project | Yes, after review | Shared MCP configuration without secrets. |
| `.claude/settings.json` | Project | Yes, after review | Shared, transparent hook configuration. |
| `.claude/settings.local.json` | One developer in one project | No | Personal hook overrides or local-only commands; add to `.gitignore`. |
| `~/.claude.json` / `~/.claude/settings.json` | One developer | No | Personal MCP servers or settings that must not be shared. |

## MCP baseline

The committed `.mcp.json` includes `claude-code-docs` (public remote documentation, no token) and `playwright` (local stdio browser process, no credential) — both need no secret, so both are safe to commit and share across forks. Both remain subject to Claude Code's project approval flow.

Credentialed servers (Postgres, GitHub, Sentry, etc.) are never added to the committed `.mcp.json` — a secret in a shared, git-committed file is a leak waiting to happen. Instead, the CEO runs `setup/connect-mcp.sh <server>` on request, which connects the server at **personal scope** (`~/.claude.json` — not shared, not committed) using the Founder's own credentials, entered at the prompt, never written into this repo.

Do **not** add an MCP server merely because it exists. Each additional server may contribute tool definitions and instructions to sessions, which consumes context. Add an MCP only when it replaces repeated manual copying or enables a defined, approved workflow.[2]

| Candidate | Add only when | Authentication / safety rule |
|---|---|---|
| `claude-code-docs` | The team needs current Claude Code documentation. | Public, read-only HTTP server; still review project approval. |
| Playwright | Already included (pre-connected, no credential needed) | Local stdio process; verify the package source and approve the process launch. |
| GitHub / issue tracker | The Founder wants PR, issue, or release operations from Claude Code. | Use OAuth or a least-privilege token in personal/user configuration; never commit it. |
| Sentry / observability | The team needs incident diagnosis from the approved organization. | Use OAuth or a read-only, project-scoped account; redact sensitive results. |
| Database / filesystem | A narrowly scoped, reviewed workflow needs it. | Require explicit Founder approval, least privilege, read-only default, allowed-root/tenant restriction, and security-auditor review. |

Use remote HTTP MCP servers where supported. Prefer OAuth for hosted services. For local `stdio` servers, pin or review the package source; do not use a command from an untrusted README without a decision record. Do not add secrets to `.mcp.json`; use environment-variable expansion, personal settings, or OAuth instead.[1]

### Add an approved MCP server

```bash
# Shared, project-scoped server; review the URL and commit only non-secret config.
claude mcp add --scope project --transport http <server-name> <https-url>

# Personal, local stdio server; keep credentials in your environment or personal configuration.
claude mcp add --scope local <server-name> -- <command> <args>

# Check the configured server and its connection state.
claude mcp list
claude mcp get <server-name>
```

After editing `.mcp.json`, restart Claude Code, review the approval prompt, then use `/mcp` or `claude mcp list` to confirm the required server is connected.[1]

## Hook baseline

The committed `.claude/settings.json` activates **one narrow PreToolUse guard**. It observes only `Bash`, `Write`, and `Edit` operations and blocks a small set of clearly dangerous actions:

- destructive filesystem commands aimed at system/home roots;
- force pushes to protected default branches;
- direct `DROP DATABASE` commands;
- writes to real `.env`, private key, or credential files.

The guard does **not** approve commands, deploy code, modify source automatically, run tests after every edit, send network data, inspect credentials, or bypass Claude Code permissions. It provides a deterministic last line of defence; it does not replace the Founder gates, security review, or normal permission prompts.

> Hooks are executable code. Review any change to `.claude/settings.json` or `.claude/hooks/` with the same care as CI or deployment code. Keep hooks short, deterministic, and fail closed only for a clearly defined high-risk condition.

## Hook operations

| Need | Recommended implementation | Do not do |
|---|---|---|
| Block a known dangerous command | Narrow `PreToolUse` matcher plus a local, version-controlled guard script. | Broad regexes that block ordinary development. |
| Format or test after a change | Use an explicit command, CI, or a scoped manual hook after the project command is known. | Run the full test suite after every small edit. |
| Remind agents of a project rule | Put the rule in `CLAUDE.md`, a skill, or a short `SessionStart` context hook only if genuinely needed. | Repeat long policy text on every tool call. |
| Protect secrets | Block direct writes to real secret files; validate `.env.example` in CI. | Store secrets, tokens, or private headers in settings, hooks, scripts, logs, or reports. |
| Enforce production approvals | Use the existing Founder gate and explicit permission process. | Auto-approve deployment, payment, customer messaging, or destructive data commands. |

## Token-efficiency rules

MCPs and hooks are not free. Add a server only when it materially reduces repeated work. Keep the MCP set focused; disable unused servers via `/mcp`. Keep hook output silent on pass and specific on block. Do not use hooks to emit large context blocks, raw logs, or repeated reminders. The team's `token-efficiency.md` policy remains binding.

## References

[1] [Claude Code: Connect to MCP servers](https://code.claude.com/docs/en/mcp-quickstart)

[2] [Claude Code: Connect Claude Code to tools via MCP](https://code.claude.com/docs/en/mcp)

[3] [Claude Code: Hooks reference](https://code.claude.com/docs/en/hooks)

[4] [Claude Code: Automate actions with hooks](https://code.claude.com/docs/en/hooks-guide)

## Lifecycle hooks (v13 — active by default)

Beyond the safety guard, three hooks make the delivery lifecycle self-enforcing. All fail-open on malformed input and never approve, deploy, or run broad automation.

| Hook | Event | What it does |
|---|---|---|
| `lifecycle-guard.mjs` | PreToolUse `Write|Edit` | Blocks writing source code unless an active sprint plan exists (`company/sprints/current/sprint-goal.md` + `backlog.md` with a real task + acceptance criteria). Planning artifacts, `.claude/`, docs, and company files are exempt. Enforces plan-before-code. |
| `orchestration-guard.mjs` | PreToolUse `Task` | Two rules on the same lock (`company/.teamlead.lock`, stale after 2h): prevents a second concurrent Team Lead, AND blocks dispatching any of the 25 named specialists unless a Team Lead is active — no specialist executes without Team Lead orchestration. CEO is always exempt. Release the lock at sprint close. |
| `sprint-reminder.mjs` | Stop | Two reminders: (1) when the backlog reads all-done, run the sprint report + retro, get Founder acceptance, archive, log decisions, release the lock; (2) every ~3 closed sprints, nudges the CEO to review archived retros for recurring patterns and consider `templates/optimization-proposal.md` — advisory, the CEO may conclude no change is needed. |
| `usage-checkpoint-guard.mjs` | Stop | Reminds the Team Lead to rewrite `RESUME-POINT.md` when `daily-log.md` has newer entries (always-available check, no external tool). Escalates to urgent if the optional `ccusage` CLI reports session/weekly usage ≥85%. Never blocks. |

To temporarily disable a hook for one developer, use `.claude/settings.local.json` (git-ignored) — never weaken the shared `settings.json` without a decision record. The lock file and `graphify-out/` should be in `.gitignore`.

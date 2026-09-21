# Skill: Jules Delegation (async, cloud, PR-based execution tier)

> **Optional and auto-detected via `JULES_API_KEY`.** If unset, this tier is
> INACTIVE and the team works exactly as it does without it. Check with
> `node .claude/setup/jules-status.mjs` (validates the key against a real
> read call, not just presence). Nothing about the workflow, gates, or
> quality bar changes when it's active vs inactive.

Fundamentally different in kind from `deepseek-delegation.md`: Jules is
**asynchronous and cloud-based** — it
clones the repo into Google's own VM, works for minutes (not seconds), can
**pause to ask a clarifying question**, and on completion **opens a real
GitHub pull request itself**. There is no live back-and-forth inside one
Claude turn; the owning specialist creates a session, then checks back on it
across its own turns (or the next daily-log check-in) until it resolves.

Same non-negotiable split as the other two tiers: **Claude decides and
writes the brief; Jules does the cloud execution.** The owning specialist
writes `templates/implementation-brief.md` exactly as for any other tier,
then the create step sends it as Jules' `prompt` — with two things
automatically appended: a pointer to `docs/CONVENTIONS.md`/`shared-contracts-reference.md`,
and the **accumulated lessons from past Jules sessions**
(`company/jules-lessons.md`) so a mistake already caught once is never
repeated in a future prompt.

Full lifecycle (create → poll → answer questions → plan approval → PR →
review → merge → record lessons), the API contract, and failure modes:
`jules-delegation-reference.md`.

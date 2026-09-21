# Skill: DeepSeek Execution Tier (Claude architects, DeepSeek implements)

> **Auto-activated by the API key alone.** If `DEEPSEEK_API_KEY` is set, the
> tier is ACTIVE. If not, it's INACTIVE and the team runs Claude-only with an
> identical workflow, identical gates, identical quality bar — nothing depends
> on it. Check with `node .claude/setup/deepseek-status.mjs`. No config file to
> edit, no flag to flip.

The division: **Claude decides and specifies; DeepSeek types.** Claude writes
the architecture, the contracts, the file-by-file implementation brief, and the
rules to follow — then DeepSeek produces the bulk implementation against that
brief, and Claude reviews it against the same bar every specialist faces.

Claude's own coding effort concentrates where judgment actually pays: system
boundaries, data models, security-sensitive paths, tricky algorithms,
integration seams, and review. Volume typing moves to the cheaper tier.

**A brief good enough to delegate is most of the engineering.** If Claude can't
write a brief precise enough for DeepSeek to execute without guessing, the task
isn't understood well enough to delegate — Claude implements it directly.

Division of labor, the brief contract, review protocol, escalation, and failure modes: `deepseek-delegation-reference.md`.

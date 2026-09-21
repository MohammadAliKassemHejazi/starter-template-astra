# Reference: sentry-triage

Deep detail for `sentry-triage.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Triage workflow
1. Pull new/regressed issues; group by **root cause**, not by message text (one bug often fans into many signatures).
2. Prioritize by **users affected × frequency × flow criticality** (checkout error at 10/day beats a settings-page error at 1000/day if the latter is cosmetic).
3. Reproduce locally from the stack trace + breadcrumbs before proposing a patch — a fix without a repro is a guess.
4. Patch PR links the Sentry issue; after deploy (Founder-approved), verify the issue's event count actually drops — a "fixed" issue still firing reopens the story.

## Privacy guardrail
Stack traces and breadcrumbs may contain PII (emails, tokens in URLs). Never paste raw event payloads into reports, PRs, or logs — reference the Sentry issue ID and describe the pattern. Configure scrubbing (`sendDefaultPii: false`, beforeSend filters) as part of monitoring setup.

## Setup doctrine (when adding Sentry to a project)
Release tagging on every deploy (ties errors to versions) · environment separation (dev noise never pages anyone) · alert rules on NEW issues and regression spikes, not raw volume · source maps uploaded for readable frontend traces.

# Hotfix Ticket — HOTFIX-<id>

> Filename MUST be `HOTFIX-<id>.md` in `company/sprints/current/` — its presence
> is what the lifecycle hook detects to bypass discovery/grooming/sprint-planning
> ceremony (`orchestration-guard`/`lifecycle-guard`). It bypasses PLANNING ONLY.
> Testing, review, and the merge gate are UNCHANGED and mandatory.

**Opened:** YYYY-MM-DD HH:MM UTC | **Opened by:** incident-commander | **Status:** 🔴 Active / 🟡 Mitigated / ✅ Resolved
**Severity:** P0 (full outage / data at risk) / P1 (major function broken, workaround exists)
**Branch:** `hotfix/<id>-<short-name>`

## Impact scope
What's broken, who's affected (real numbers from monitoring/logs, not estimated), since when.

## Preliminary root cause
Best current understanding — will be superseded by the full analysis in `templates/incident-postmortem.md` after resolution. Explicitly mark speculation as speculation.

## Mitigation strategy
**Chosen:** Rollback / Fix-forward
**Why:** (rollback = fast, safe, buys time; fix-forward = rollback isn't viable or the fix is smaller than the rollback risk)

### If rollback
- Target: <last known-good deploy/tag>
- Rollback command: (`backup-disaster-recovery-reference.md` runbook)
- Data implications: none (code-only) / <describe> — a DATA rollback is Always-Stop regardless of hotfix status

### If fix-forward
- Change: <what, exactly>
- Owner: <specialist implementing it>
- Implementation brief (if delegated): `templates/implementation-brief.md` ref

## Verified tests (mandatory — hotfix bypasses planning, never verification)
- [ ] Reproduction case confirmed fixed
- [ ] `npm run check` green (re-run fresh — `verification-discipline-reference.md`)
- [ ] No regression in the adjacent critical path
- [ ] Code review completed (`code-reviewer`; `security-auditor`/`a11y-auditor` if triggered)

## Deployment gate
- [ ] Founder approval for the production deploy itself (Always-Stop — unchanged by hotfix status)
- [ ] Deployed at: YYYY-MM-DD HH:MM UTC
- [ ] Confirmed resolved in production (monitoring back to green)

## Status log (append-only, newest last)
| Time (UTC) | Update |
|---|---|

## Closeout
On resolution: rename status to ✅ Resolved, open `templates/incident-postmortem.md` for the full analysis, and this file's branch (`hotfix/<id>-*`) is merged and deleted — it does not become a permanent record; the postmortem is.

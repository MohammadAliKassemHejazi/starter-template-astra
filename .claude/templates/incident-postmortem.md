# Incident Postmortem — <short title>

**Severity:** Critical / High / Medium / Low | **Date:** YYYY-MM-DD
**Detected by:** uptime-monitoring alert / Sentry / support-triage / Founder report
**Duration:** start — end (real timestamps) | **Author:** support-triage or qa-devops

> Blameless. The goal is a system that fails better next time, not a person to
> blame. Every number here is re-checked from source (`verification-discipline.md`)
> — no estimated timelines or guessed impact counts.

## Summary (5 lines, written for the Founder first)
What broke, for how long, who/what was affected, current status, is it resolved.

## Timeline (from real logs/alerts, timestamped)
| Time (UTC) | Event |
|---|---|
| | First alert fired / first report received |
| | Triage began |
| | Root cause identified |
| | Mitigation applied |
| | Confirmed resolved |

## Detection
- How was it detected? (`uptime-monitoring-alerting.md` synthetic / Sentry / a user report via `support-triage`)
- Time-to-detect: was the alert fast enough? If not, what monitoring gap does this expose?

## Blast radius (real, not estimated)
- Users/requests affected (actual count from logs, re-counted, not guessed):
- Data affected — any data loss/corruption? Checked against `backup-disaster-recovery.md` before/after row counts if data was touched:
- Which client(s) — isolation confirmed, no cross-client bleed:

## Root cause
The actual mechanism, traced to source — not the first plausible guess. If root cause differs from the initial theory, say so explicitly (mid-incident self-correction is expected, not a failure).

## Mitigation applied
What stopped the bleeding: rollback (`backup-disaster-recovery.md` runbook used?), feature flag, config change, manual intervention. Was it a code rollback (fast, safe) or a data operation (Always-Stop — was Founder approval obtained)?

## Why existing safeguards didn't prevent it
Which guardrail, test, review, or monitor SHOULD have caught this earlier, and why it didn't. If nothing should have caught it (genuinely novel failure mode), say so.

## Prevention (the part that actually matters)
| Action | Type (test / monitor / process / architecture) | Owner | Becomes standing protocol? |
|---|---|---|---|

## Verification stamp
`root cause confirmed from logs ✓ / blast radius re-counted from source ✓ / mitigation verified in place ✓ / regression test added ✓ (if code-caused)`

## Feed the loop
- Add a regression test if code-caused (`test-driven-development.md`).
- Add/tune a monitor if detection was slow (`uptime-monitoring-alerting.md` / `sentry-triage.md`).
- Add to the next `retro.md` if it reveals a process gap.
- If it becomes a repeated pattern across incidents, promote it into `verification-discipline.md` as standing protocol (that file exists because past incidents were promoted this way).

# Reference: uptime-monitoring-alerting

Deep detail for `uptime-monitoring-alerting.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## What to monitor (layers)
- **Synthetic uptime**: HTTP checks on the public URL + `/health` endpoint, from multiple regions, every 1–5 min. Check status code AND a body assertion (a 200 rendering an error page is still down).
- **Critical-path synthetics**: scripted checks of the money path (login, checkout/booking reachable) — not just "homepage 200".
- **Certificate + domain expiry**: SSL expiry and domain-renewal alerts (a lapsed cert is a silent outage; domain renewal is Founder-owned but we alert).
- **API/webhook health**: dependency checks for the integrations that matter (payment, messaging).

## Tooling (pick per client)
- **UptimeRobot / Better Stack / Pingdom** for synthetics + status pages (free tiers cover most SMB). Self-hosted (Uptime Kuma) when the client wants ownership.
- `/health` returns dependency status (DB reachable, queue reachable) as JSON — the monitor asserts on it.

## Status page
- Public or private status page for client + their customers; components mapped (web, API, payments); incident history visible.
- Auto-updates from the monitors where supported.

## Response chain (who actually answers the page)
`Alert triggers → Team Lead dispatches incident-commander → triage protocol (confirm real, scope impact, preliminary root cause) → rollback-or-fix-forward decision, logged in templates/hotfix-ticket.md → Team Lead dispatches whichever specialists the fix needs → mandatory testing and the standard review chain (unchanged — a hotfix skips planning ceremony, never verification) → support-triage informed so any user-facing communication reflects reality.` `incident-commander` never dispatches specialists itself — it reports what's needed and the Team Lead assigns it, preserving the single chain of command.

## Alerting
- **Route to where the team lives**: Slack/Discord via **incoming webhook** — POST a structured message (service, check, status, since, link) to the ops channel. Escalate (SMS/phone) only for money-path/hard-down, to avoid alert fatigue.
- **Tiered severity**: hard-down / degraded / warning — different channels, so noise ≠ emergencies.
- **De-flap**: alert only after N consecutive failures (a single blip from one region isn't an incident) and send a recovery notification.
- **Runbook link in every alert**: the alert points to what to check first (ties to `backup-disaster-recovery.md` for rollback).

## Setup SOP
1. Stand up `/health` with real dependency checks.
2. Configure synthetics (public URL + health + one critical path), multi-region, sensible interval.
3. Create the status page; map components.
4. Wire Slack/Discord webhook; set severity tiers + de-flap + recovery.
5. Add SSL/domain-expiry monitors.
6. Test by forcing a failure (point a check at a known-bad path) — verify the alert actually arrives and recovery clears it. Don't assume; trigger it (`verification-discipline.md`).

## Guardrails
Webhook URLs are secrets (a Slack webhook is a post-anything token) — env only, never committed. Monitoring must not itself hammer the app (sane intervals). Alert routing changes are logged.

## Common failure modes
Checking status code but not body (error page = "up") · single-region check flapping · alert fatigue → real alert ignored · webhook committed to repo · no recovery notice (team thinks it's still down) · SSL expiry unmonitored → surprise outage · health endpoint always 200 regardless of DB state.

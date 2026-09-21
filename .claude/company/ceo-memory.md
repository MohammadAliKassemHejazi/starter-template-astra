# CEO Memory

> Persistent, per-client. Newest entries first. The CEO reads this at the start
> of every session and appends before ending any significant exchange.
> Format: `## YYYY-MM-DD — <topic>` + facts, decisions, open questions.

## 2026-09-21 — Project kickoff: auth/RBAC starter template
- Founder brief: starter template with authentication, roles, permissions, users; Express+TS backend, Next.js+TS frontend. Spend ~90% on code, ~10% on reports.
- Business context filled from the brief (internal template, default stack kept, payments OUT).
- Classified HIGH (auth/session/permission model = Always-Stop #4). Plan: Team Lead returns a SHORT grooming with recommended defaults → Founder approves once → build straight through.
- Note: root `AGENTS.md` is imported by CLAUDE.md but missing; Team Lead to create it as part of scaffolding.
- Team Lead groomed D1–D8 + stories S0–S8. Founder approved all as recommended (logged in decision-log). Build started.
- Mid-build Founder steer: build/run via Docker (Compose for db+server+client, tests in containers). Written to business-context Constraints; relay to Team Lead pending (no direct message tool this session).
- Team Lead paused on ESC-01 (no DB creds, Docker off). CEO treated Founder's "use docker" as choosing option (b); relaunched Team Lead to start Docker + build S2–S8. Five security open questions applied provisionally with CEO defaults (no reuse grace, no lockout, 409 on dup email, in-memory rate limit, per-request DB check) — flagged for Founder override at sprint report.
- Team Lead reports S0–S8 done (Docker stack, 87 server + 50 client tests, 10/10 e2e+axe, security retest passed). CEO confirmed test/Docker/README files exist; could not re-run (no shell). Awaiting Founder sprint-01 acceptance, then archive + lock release. Stop-hook S2 failures earlier were stale (tests didn't exist yet).
- Open (superseded): Postgres availability on this machine (Team Lead escalates if missing).

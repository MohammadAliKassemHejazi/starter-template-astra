# Decision Log

> Every Founder decision, recorded by the CEO. Append-only, newest first.
> Format per entry:
>
> ## YYYY-MM-DD — <decision title>
> **Context:** what forced the decision
> **Options considered:** 2–3, with trade-offs
> **Decision:** what the Founder chose
> **Consequences:** what this commits us to

## 2026-09-21 — Approve auth/RBAC design D1–D8 (Always-Stop #4 gate)
**Context:** Auth, session and permission model for the starter template.
**Options considered:** Team Lead's recommended defaults (cookie JWT access 15m + rotating refresh 7d, CSRF double-submit, argon2id, DB-backed RBAC, Pages Router) vs. changes to any of them.
**Decision:** Founder replied "approved" to the full plan as recommended: D1–D8, public registration ON by default (`ALLOW_REGISTRATION` toggle), token lifetimes 15 min / 7 days.
**Consequences:** Team Lead proceeds S0→S8. Out of scope: password reset, email verification, MFA, social login, multi-tenancy, deploy. README must flag the password-reset gap for forks. Any change to the auth design returns to the Founder.

## 2026-09-21 — Postgres via Docker; five open security questions defaulted (Founder may override)
**Decision:** Founder: "to build project use docker" — whole project builds/runs/tests via Docker Compose (local only). Security questions Q1-Q5 applied at CEO-recommended defaults: no refresh-reuse grace window; no per-account lockout (IP + IP+email limits); 409 on duplicate email; in-memory rate limits (Redis for multi-instance); per-request DB permission check.
**Consequences:** All in README "Known gaps". Deviation accepted by security-auditor: access cookie outlives the 15 min JWT so the expired JWT can bind CSRF tokens. Override of any Q1-Q5 is a code change in S2/S3 areas.

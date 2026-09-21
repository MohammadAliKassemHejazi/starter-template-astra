# Sprint Goal — 01 Auth + RBAC starter
Branch: epic/01-auth-rbac. Goal: working, tested cookie-JWT auth + DB-backed RBAC + admin users/roles UI in the npm-workspace monorepo (client/server/packages/shared).
Approved design (decision-log 2026-09-21, D1–D8): access JWT 15m + rotating refresh 7d in httpOnly/secure/sameSite=strict cookies; CSRF double-submit; argon2id; DB-backed roles/permissions; Next.js Pages Router; registration ON (ALLOW_REGISTRATION toggle).
OUT: password reset, email verify, MFA, social login, multi-tenancy, payments, deploy.

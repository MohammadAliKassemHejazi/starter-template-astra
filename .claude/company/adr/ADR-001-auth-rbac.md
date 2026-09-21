# ADR-001 — Authentication, session and RBAC model

**Status:** Accepted (Founder approved D1-D8, decision-log 2026-09-21)
**Date:** 2026-09-21
**Deciders:** system-architect; Founder (Always-Stop #4)
**Tier:** HIGH

## Context
Starter template needs auth, sessions and permissions that forks inherit. Stack is fixed (Express + Sequelize + Postgres, Next.js Pages Router, `@project/shared`). Browser client, same-site deployment. Out of scope: password reset, email verification, MFA, social login, multi-tenancy. Assumption: single Postgres, one or few server instances.

## Options Considered
- **A. Server sessions (opaque id in DB/Redis).** Simple revocation; needs a store hit per request, adds Redis when scaled.
- **B. JWT in localStorage / Authorization header.** XSS-stealable tokens. Rejected.
- **C. Short JWT access + rotating hashed refresh, both httpOnly cookies (chosen).** Tokens unreachable from JS, revocable via refresh family. Cost: CSRF defence and rotation logic.

## Decision
Option C.
- Access JWT 15 min (HS256, `JWT_ACCESS_SECRET`), claims: `sub`, `fid` (family id), `iat`, `exp` only. No roles/permissions in the token: `authenticate` loads user (`is_active`), family status and roles/permissions from DB per request, so role changes, deactivation and logout apply immediately.
- Refresh token: 32-byte random opaque value, 7 d, rotated on every use. Only its SHA-256 hash is stored, with `family_id`. Presenting a used/revoked token revokes the whole family (reuse detection) and logs a security event.
- Cookies: `access_token`, `refresh_token` httpOnly + `Secure` + `SameSite=Strict`; refresh cookie `Path=/api/auth`. `csrf_token` is NOT httpOnly (JS must read it), `Secure`, `SameSite=Strict`.
- CSRF: double-submit. POST/PUT/PATCH/DELETE require header `X-CSRF-Token` equal (constant-time) to the `csrf_token` cookie. Token is random 32 bytes, issued on login/refresh and by `GET /api/auth/csrf`.
- Passwords: argon2id (>= m=19456 KiB, t=2, p=1; env-tunable), length 12-128. Login verifies against a dummy hash when the user is missing (timing-safe) and returns one generic error for every failure.
- RBAC: `users`, `roles`, `permissions`, `user_roles` (M:N), `role_permissions` (M:N). Permission keys `resource:action` (e.g. `users:read`). Seeded roles: `admin` (all permissions), `user` (self-service only). `requirePermission(key)` server-side is the only authorization gate; client route guards are UX only.
- Last-admin protection: service-layer transaction with row lock; the last active admin cannot be deleted, deactivated or demoted.
- Rate limit: general tier on `/api/*`; strict tier on `/api/auth/*`, keyed by IP, plus IP+email for login.
- Registration gated by `ALLOW_REGISTRATION` (default true); new users get role `user`. Admin seeded by seeder from env, never hardcoded.
- Layering per AGENTS.md (routes -> controllers -> services -> models). Zod schemas, DTOs and the `Permission` enum live in `@project/shared`; Sequelize models stay server-only.

## Consequences
- **Positive:** tokens invisible to JS; immediate revocation of roles/sessions; refresh theft is detected; forks get a tested baseline.
- **Negative / accepted:** 1-2 extra DB reads per authenticated request; no password reset in v1 (README must flag); in-memory rate-limit store is per process; strict reuse detection can log out multi-tab users on a race (mitigated by client single-flight refresh).
- **Contracts introduced:** auth/user/role DTOs and schemas, `Permission` enum, error codes in `@project/shared`; endpoint set in the security design review.
- **Always-Stop triggered:** #4 (approved); #3 (new additive tables/migrations); #7 (JWT secret and admin seed credentials via `.env` only).

## Verification
security-auditor review of S2/S3 before Done; integration tests on real Postgres (reuse detection, CSRF, 401/403 matrix, last-admin). Revisit when: multi-instance deploy (shared limiter store), MFA/reset added, or multi-tenancy (would supersede this ADR).

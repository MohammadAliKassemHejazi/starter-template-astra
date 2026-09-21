# Security Design Review — Epic 01 Auth + RBAC (S2, S3, S5, S6)

## 1. Scope and decision status
| Field | Value |
|---|---|
| Project / story | Epic 01 auth + RBAC (backlog S2-S6); ADR-001 |
| Reviewers | system-architect (author); security-auditor (challenge before S2 build) |
| Environment | local/test; production is Always-Stop |
| Data sensitivity | restricted (credentials, tokens), confidential (email/name) |
| Objective | Only authenticated, authorized users act; token theft/replay, CSRF, brute force, privilege escalation contained |
| In scope | `/api/auth/*`, `/api/users`, `/api/roles`, `/api/permissions`, middlewares, seeders, client auth/admin UI |
| Out of scope | reset, email verify, MFA, social, multi-tenancy, deploy |
| Decision | Founder approved D1-D8 (decision-log 2026-09-21); "Founder questions" below are open |

## 2. Data and trust boundaries
| Asset | Class | Storage / transit | Access | Retention |
|---|---|---|---|---|
| password hash (argon2id) | restricted | `users.password_hash`; never serialized | server only | until user deleted |
| refresh token | restricted | cookie; DB holds SHA-256 hash only | owner cookie; server | 7 d; purge expired/revoked > 30 d |
| access JWT | restricted | httpOnly cookie | server verify | 15 min |
| email, name | confidential | `users` | self, `users:read` | until deleted |
| JWT secret, admin seed creds | restricted | `.env` only | server process | rotate on suspicion |

| Boundary | Untrusted input | Validation / authz | Failure-safe | Owner |
|---|---|---|---|---|
| browser -> server | body, cookies, headers | shared Zod schemas; CSRF; authenticate; requirePermission | envelope 400/401/403, no detail leak | backend-node |
| server -> Postgres | ORM params | parameterized; transactions | rollback, generic 500 | backend-node |
| client route guard | local state | UX only; server is authority | server 401 -> login redirect | frontend-dev |

## 3. Threat and control register
| ID | Threat | CIA | L/I | Control | Implementation | Verification |
|---|---|---|---|---|---|---|
| T1 | Credential stuffing / brute force | C | H/H | Strict limiter on `/api/auth/*` (IP) + IP+email on login; argon2id | `middlewares/rateLimit.ts` | N+1th login -> 429 |
| T2 | User enumeration via errors/timing | C | M/M | One generic message; dummy-hash verify | `services/auth.service.ts` | identical status/body; timing delta under threshold |
| T3 | Refresh token replay | C/I | M/H | Rotation, hashed storage, family reuse revoke | `services/token.service.ts`, RefreshToken model | reuse old token -> 401, family revoked |
| T4 | DB leak exposes secrets | C | L/H | SHA-256 token hash; argon2id | token/auth services | DB row has no raw token; `$argon2id$` prefix |
| T5 | CSRF on cookie auth | I | M/H | SameSite=Strict + double-submit, constant-time | `middlewares/csrf.ts` | missing/wrong header -> 403 |
| T6 | XSS token theft | C | M/H | httpOnly cookies; no tokens in JS/Redux/localStorage; Helmet | cookie util, client store | cookie flags asserted; grep client for token storage |
| T7 | Privilege escalation / missing authz | I | M/H | `requirePermission` on every non-public route; permissions from DB | `middlewares/requirePermission.ts` | 401/403/allow matrix per endpoint |
| T8 | Last admin removed | A/I | M/H | Locked-transaction check | `services/user.service.ts` | delete/deactivate/demote last admin -> 409 |
| T9 | Mass assignment (self-set role/isActive) | I | M/H | Strict Zod schemas; register ignores roles | shared schemas | register with `roles` -> rejected |
| T10 | Hardcoded/default admin creds | C/I | M/H | Seeder reads `SEED_ADMIN_*`; aborts if unset | `server/src/scripts` seeder | seeder w/o env aborts; repo grep clean |
| T11 | Secrets/tokens in logs | C | M/M | Winston redaction (cookie, authorization, password, token); no auth body logging | `utils/logger.ts` | log sink clean after login |
| T12 | Deactivated / role-changed / logged-out user keeps access | I | M/M | Per-request user+family+roles DB check | `middlewares/authenticate.ts` | deactivate/logout then old access -> 401 |
| T13 | Registration abuse | A | M/M | `ALLOW_REGISTRATION` -> 403 when off; strict limiter | auth service | flag off -> 403 |
| T14 | JWT forgery / alg confusion | I | L/H | Pin HS256, require `exp`, secret >= 32 chars at boot | `config/env.ts`, token service | alg none / wrong secret -> 401; weak secret fails boot |
| T15 | Argon2 CPU DoS | A | M/M | Limiter before hashing; body size cap; password max 128 | limiter + Zod | 129-char password -> 400 before hashing |
| T16 | Multi-tab refresh race trips reuse detection | A | M/L | Single-flight refresh in Axios interceptor | `client/src/services` | parallel 401s trigger one refresh |

## 4. CIA baseline
| Objective | Design decision | Control | Evidence | Status |
|---|---|---|---|---|
| Confidentiality | Minimal data returned; hashes never serialized | public-user DTO; log redaction | S2 tests, auditor | planned |
| Integrity | Server-side authz, CSRF, Zod, transactions | middlewares + services | S2/S3 tests | planned |
| Availability | Rate/body limits; generic 500; health endpoint | limiter, error handler | S2/S4 tests | planned |

## 5. Authorization matrix (enforcement: `authenticate` + `csrf` + `requirePermission`)
| Endpoint | Method | Permission | Negative test |
|---|---|---|---|
| `/api/auth/register` | POST | public + `ALLOW_REGISTRATION` | flag off -> 403 |
| `/api/auth/login` | POST | public | wrong pw -> generic 401 |
| `/api/auth/refresh` | POST | valid refresh cookie + CSRF | reuse -> 401 |
| `/api/auth/logout` | POST | authenticated | anonymous -> 401 |
| `/api/auth/me` | GET | authenticated | anonymous -> 401 |
| `/api/auth/csrf` | GET | public | n/a |
| `/api/users` | GET | `users:read` | user role -> 403 |
| `/api/users/:id` | GET | `users:read` or self | other user -> 403 |
| `/api/users/:id` | PATCH / DELETE | `users:write` / `users:delete` | 403; last admin 409 |
| `/api/users/:id/roles` | PUT | `users:assign-role` | 403; last admin 409 |
| `/api/roles`, `/api/permissions` | GET | `roles:read` | 403 |
| `/api/roles`, `/api/roles/:id` | POST/PATCH/DELETE | `roles:write` | 403; system roles undeletable |
| `/api/roles/:id/permissions` | PUT | `roles:write` | 403; `admin` cannot lose `roles:write`/`users:assign-role` |

## Data model (Sequelize migrations; UUID pks, snake_case)
- `users`: id, email (citext, unique), password_hash, name, is_active (default true), last_login_at, timestamps. Index: unique(email).
- `roles`: id, name (unique), description, is_system, timestamps.
- `permissions`: id, key (unique, `resource:action`), description.
- `user_roles`: user_id FK, role_id FK; PK(user_id, role_id); index(role_id).
- `role_permissions`: role_id FK, permission_id FK; PK(role_id, permission_id); index(permission_id).
- `refresh_tokens`: id, user_id FK (cascade), family_id (uuid), token_hash (char 64), expires_at, used_at, revoked_at, replaced_by_id, user_agent (<=255), ip (inet), created_at. Indexes: unique(token_hash), family_id, user_id, expires_at.

## Cookie and CSRF specifics
| Cookie | httpOnly | Secure | SameSite | Path | Max-Age |
|---|---|---|---|---|---|
| `access_token` | yes | yes | Strict | `/` | 900 |
| `refresh_token` | yes | yes | Strict | `/api/auth` | 604800 |
| `csrf_token` | no | yes | Strict | `/` | 604800 |

`Secure` is off only when `NODE_ENV` is `development`/`test`. CORS: single origin `CLIENT_ORIGIN`, `credentials: true`. Axios reads the cookie and sends `X-CSRF-Token` on unsafe methods. Client and API must be same-site (dev proxy or shared parent domain). Logout clears all three cookies and revokes the family.

## Env vars (`.env.example`, names only)
`DATABASE_URL`, `JWT_ACCESS_SECRET` (>= 32 chars), `ACCESS_TOKEN_TTL=15m`, `REFRESH_TOKEN_TTL_DAYS=7`, `ARGON2_MEMORY_KIB`, `ARGON2_TIME_COST`, `ALLOW_REGISTRATION=true`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `CLIENT_ORIGIN`, `TRUST_PROXY`, `RATE_LIMIT_GENERAL_MAX`, `RATE_LIMIT_AUTH_MAX`, `RATE_LIMIT_WINDOW_MS`, `NODE_ENV`, `LOG_LEVEL`.

## 6. Secure implementation checklist
| Area | Decision | Status |
|---|---|---|
| Auth/session | cookie JWT + rotating refresh; no MFA (out of scope) | planned |
| Input/output | shared strict Zod schemas, envelope, public-user DTO | planned |
| Secrets | `.env` only, boot validation | planned |
| Data protection | HTTPS mandatory in prod (deploy is Always-Stop) | planned |
| Abuse resistance | tiered limiter, body size cap | planned |
| Supply chain | lockfile; `npm audit` in CI (qa-devops) | planned |
| Logging | Winston redaction; events: login fail, reuse detected, role change, admin action | planned |
| Recovery | reversible migrations; reseed only on disposable DB | planned |

## 7. Approval and follow-through
| Item | Owner | Before | Status |
|---|---|---|---|
| ADR-001 | system-architect | S2 build | written |
| Founder approval | CEO | build | approved 2026-09-21 |
| Auditor challenge of this doc | security-auditor | S2 build | pending |
| Findings fixed and retested | backend-node + auditor | S2/S3 Done | pending |
| QA evidence (S7 e2e) | qa-devops | Done | pending |
| README flags password-reset gap | docs-sync | S8 | pending |

## Founder questions (deviations considered, NOT applied)
1. Refresh reuse grace window (e.g. 10 s) instead of strict family revoke, to avoid multi-tab false lockouts. Current: strict + client single-flight (T16).
2. Per-account temporary lockout after repeated failures. Current: IP and IP+email rate limits only.
3. Register returns 409 on duplicate email (enumeration possible without email verification). Accept for v1?
4. Rate-limit store is in-memory per process; multi-instance forks need Redis. Accept for the template?
5. Per-request DB check of user/family/roles (1-2 reads) is what makes revocation immediate. Confirm the cost is acceptable.

## Security-auditor required changes (binding on S2/S3; hardening within approved D1-D8, no design deviation)
1. Refresh rotation = one atomic conditional UPDATE (used_at/revoked_at IS NULL, expires_at>now, check rows affected) in a txn; absolute family lifetime 30d; re-check is_active.
2. Logout works from refresh cookie alone, always clears all 3 cookies, idempotent.
3. CSRF on every unsafe method incl. login/register/refresh + Origin/Referer check vs CLIENT_ORIGIN; `Cache-Control: no-store` on /auth/csrf and all auth responses.
4. CSRF token HMAC-bound to fid/session (or same-origin only); `__Host-` on csrf_token/access_token; `__Secure-` on refresh_token (Path=/api/auth).
5. CORS: boot fails if CLIENT_ORIGIN unset/`*`/list; exact match, Vary: Origin, allow only X-CSRF-Token + Content-Type.
6. Same-params dummy argon2 verify; inactive users get same generic error + full verify; lowercase/trim email before limiter key and citext lookup; 409 on register accepted risk (Founder Q3).
7. No self role change; assigner may grant only roles whose perms are a subset of own; admin/system role perms immutable; roles:write admin-only and documented as root-equivalent.
8. PATCH /users/:id split self vs admin schemas (self: name + password w/ current password, other families revoked; is_active/email/roles admin-only); `.strict()` on all bodies.
9. Last-admin protection by effective permission (role delete, perm removal from admin, user_roles edits) under advisory lock / FOR UPDATE.
10. Deactivate/delete/role change/password change revoke all refresh families in same txn; refresh rejects deactivated users.
11. JWT verify pins algorithms ['HS256']; no Authorization-header fallback; authenticate rejects revoked fid or fid not belonging to sub; document secret rotation.
12. Sequelize logging off; error handler never logs req.body/Zod input; sanitize IP/UA/email in logs, hash email on failed logins; audit events carry actor+target ids; TRUST_PROXY boot assertion.

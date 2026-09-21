# Starter template: auth + RBAC

Express + Sequelize + PostgreSQL API, Next.js client, shared Zod contracts (`packages/shared`).
Register, login, logout, refresh rotation, roles, permissions, admin users/roles screens. **Docker is the build and run path** (local only, nothing is pushed or deployed).

## Run (Docker Compose)

```bash
npm run setup                 # once: creates .env with random secrets (never overwrites an existing .env)
docker compose up --build     # db + server (migrate + seed on start) + client
```

- Client: http://localhost:3000 (set `CLIENT_HOST_PORT` **and** `CLIENT_ORIGIN` together if 3000 is taken, e.g. `3100` / `http://localhost:3100`)
- API docs (non-production only): http://localhost:4000/api/docs
- First admin: `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from your `.env` (the seeder aborts if either is unset; there are no default credentials, and an existing admin is never overwritten).
- Postgres is published on `127.0.0.1:${DB_HOST_PORT:-5433}` only. Images contain no secrets; everything comes from `.env` at run time.

## Tests (all in containers)

```bash
docker compose --profile test run --rm server-test    # 87 tests against the real Postgres db `app_test`
docker compose --profile test run --rm client-test    # component/unit tests
# e2e (Playwright + axe WCAG 2.2 AA). The browser talks to http://client:3000, so the server needs that origin
# and a higher auth rate limit for this run only:
CLIENT_ORIGIN=http://client:3000 RATE_LIMIT_AUTH_MAX=10000 docker compose up -d --force-recreate server
docker compose --profile e2e run --rm e2e
```

On the host (needs `docker compose up -d db` first): `npm install`, then `npm run check` (typecheck + lint + tests; server tests use the compose db `app_test`, never the dev database).

## Design summary (Founder-approved D1-D8, ADR-001)

- httpOnly cookies: access JWT (HS256 pinned, 15 min), rotating refresh token (7 d idle, 30 d absolute per session family), SameSite=Strict. `__Host-`/`__Secure-` prefixes and `Secure` when `NODE_ENV=production`.
- Refresh tokens are stored as SHA-256 only. Reuse of a rotated token revokes the whole family.
- CSRF on **every** unsafe method: `X-CSRF-Token` (from `GET /api/auth/csrf`, HMAC-bound to the session) + double-submit cookie + `Origin`/`Referer` must equal `CLIENT_ORIGIN`.
- Every request re-checks user active, session family live, and roles/permissions in the database, so logout, deactivation and role changes take effect immediately.
- Permissions: `users:read|write|delete|assign-role`, `roles:read|write`. `admin` and `user` are immutable system roles. `roles:write` is **root-equivalent** (it can define any role): grant it only to administrators. Assigners can only grant roles whose permissions they hold; nobody changes their own roles; the last effective administrator cannot be removed.
- API contract: `{ success, message, data | errors }` envelope; `/api/roles` and `/api/permissions` return arrays; register returns the user and does not log in; `403` on register means registration is disabled (`ALLOW_REGISTRATION=false`).

## Known gaps and provisional decisions (Founder may override)

| Item | Current behaviour |
|---|---|
| **Password reset / email verification** | **Not implemented** (out of scope). A user who forgets a password needs an administrator; there is no self-service recovery. |
| MFA, social login, multi-tenancy | Out of scope. |
| Refresh reuse | Strict: reuse revokes the family, no grace window. Two tabs refreshing at the exact same instant can therefore log the user out; the client single-flights refresh to avoid this. |
| Account lockout | None per account; rate limiting per IP and per IP+email only. |
| Duplicate registration | `409` reveals that an email exists (enumeration is possible without email verification). |
| Rate limits | In memory, per process. Running more than one API instance needs a shared store (Redis) or limits multiply per instance. |
| Permission check | One DB read per authenticated request (that is what makes revocation immediate). |
| Logout | Works from the refresh cookie alone and clears all three cookies; it still needs a valid CSRF token and origin. |

## Operations notes

- **JWT secret rotation**: set a new `JWT_ACCESS_SECRET` (>= 32 chars) and restart. All access tokens and CSRF tokens become invalid at once; clients recover through refresh (refresh tokens are opaque and unaffected) and re-fetch a CSRF token. To force everyone out, also revoke sessions: `UPDATE refresh_tokens SET revoked_at = now() WHERE revoked_at IS NULL;`
- `NODE_ENV` has no default and must be set. In production `TRUST_PROXY` must be set explicitly (`false` or a hop count; `true` is rejected). The compose stack sets `TRUST_PROXY=1` because the Next.js client proxies `/api` to the server.
- Migrations are plain SQL in `server/src/db/migrations`, applied under an advisory lock (`npm run db:migrate -w server`, `--down` reverts the last one on a disposable database). Purge of old refresh tokens runs at boot and every 6 h.
- Deploying is out of scope for this template; nothing here provisions infrastructure or pushes images.

# Reference: heroku

Deep detail for `heroku.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Platform facts
- **Dynos**: ephemeral filesystem (anything written dies on restart/deploy — uploads go to S3/R2), daily restarts, `$PORT` env is assigned — bind to it. Eco dynos sleep after 30 min idle (fine for staging, wrong for webhooks — a sleeping receiver misses platform retries).
- **Buildpacks**: auto-detected from repo (Node via `package.json`); `engines.node` pins the version; build runs `build` script; `Procfile` defines processes (`web:`, `worker:`, `release:` for migrations).
- **Release phase**: `release: npm run migrate` runs migrations before the new code serves traffic — the correct migration hook; failing release aborts the deploy.
- **Config vars** are the env: `heroku config:set` (values are Always-Stop if secrets — prepare the command, Founder runs it). `heroku local` runs from `.env` for parity.
- **Pipelines**: staging → production promotion (promotes the BUILD, no rebuild — env differences are config-var only); review apps per PR (paid → grooming line item).
- **Postgres**: plans differ in connection limits (dev tiers ~20 — use PgBouncer or pool tight); `heroku pg:backups schedule` on day one; attachment via `DATABASE_URL` (parse SSL requirements per tier).

## Integration doctrine
- `Procfile`, `app.json` (review-app config), and `.nvmrc`/`engines` checked into the repo — a fresh clone deploys.
- Workers for anything >30s (web dynos hit the 30s router timeout); queue via Redis (paid add-on → grooming).
- Dyno/add-on provisioning or plan changes = Always-Stop: prepare the exact `heroku` commands, halt.
- Logs are ephemeral (~1500 lines) — a log drain to a retention target is part of production readiness, not an afterthought.

## Common failure modes
File uploads to dyno disk (vanish on restart) · webhook receiver on a sleeping Eco dyno · migrations run manually instead of release phase · connection-limit exhaustion on dev-tier Postgres · 30s router timeout on long requests that needed a worker.

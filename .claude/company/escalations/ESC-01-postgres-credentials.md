# ESC-01 Postgres credentials
**Status:** resolved 2026-09-21 — Founder chose (b): Docker Compose Postgres (local Postgres 18 untouched)
Local Postgres 18 (service postgresql-x64-18, port 5432) is running; Docker daemon is not. Connection needs a password (not supplied; not guessed). 
Need from Founder: either (a) a DATABASE_URL for a disposable dev DB (e.g. postgres://user:pass@localhost:5432/astra_auth_dev + astra_auth_test) placed in server/.env (never committed), or (b) approval to start Docker Desktop and use docker compose Postgres.
Blocks: S2/S3 integration tests, S7 e2e. Unblocked meanwhile: S0, S1, S4 skeleton, client code S5/S6.

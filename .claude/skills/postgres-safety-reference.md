# Reference: postgres-safety

Deep detail for `postgres-safety.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Inspect before you migrate
`\d table` equivalent via MCP: current columns, indexes, constraints, row counts. Migrations written against assumed schema instead of actual schema are the top source of failed deploys.

## Migration safety checklist (every migration)
- **Additive-first**: add nullable → backfill → add NOT NULL in a follow-up. Never drop + replace in one step.
- **Lock analysis**: `ALTER TABLE ... ADD COLUMN` with volatile default rewrites the table (Postgres <11 semantics — verify version); `CREATE INDEX` locks writes → use `CREATE INDEX CONCURRENTLY` (outside transactions) on any table with traffic.
- **Backfills batched**: `UPDATE ... WHERE id IN (batch)` loops with sleep, never one giant UPDATE holding locks for minutes.
- **Rollback tested**: the down-migration runs clean locally before the up-migration ships.
- **Row-count awareness**: read the actual count first — a "quick" backfill on 40M rows is an incident.

## Read-only diagnostics that answer most questions
`pg_stat_user_indexes` (unused indexes) · `pg_stat_activity` (what's blocking) · `EXPLAIN (ANALYZE, BUFFERS)` on the slow query · `pg_indexes` to verify an ORM's `@Index` actually materialized (camelCase/snake_case traps).

Destructive or data-migrating changes remain **Always-Stop** regardless of how safe the checklist makes them look.

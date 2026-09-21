# Database Migration Request — <short title>

**Author:** data-architect | **Date:** YYYY-MM-DD | **Tier:** MEDIUM / HIGH
**Table(s) affected:** | **Estimated row count:** (real number, checked — not guessed)

> Every migration follows expand/contract (`postgres-safety.md`,
> `verification-discipline.md`): add → backfill → enforce → drop, as SEPARATE
> deploys for anything on a live table. Destructive or data-migrating changes
> are Always-Stop regardless of how safe this form makes them look.

## Pre-checks (before writing SQL)
- [ ] Blast radius checked (`project-graph.md`): every consumer of this table/column listed below
- [ ] Current schema inspected from the actual DB (`postgres-safety.md`), not assumed from memory
- [ ] Row count confirmed for the target table (a "quick" change on 40M rows is an incident, not a task)
- [ ] Lock behavior analyzed: does this statement lock reads/writes? For how long, at this row count?

**Consumers of this table/column** (from the graph, not guessed):
-

## Forward migration (SQL)
```sql
-- expand step (additive, safe on a live table)

```

## Backfill (if applicable)
```sql
-- batched, never one giant UPDATE holding locks for minutes
-- e.g. UPDATE ... WHERE id IN (batch) LOOP with a sleep between batches
```
**Before/after row count check:** (log the actual numbers — an unexpected drop is an alarm, not a shrug)

## Enforce step (separate deploy, after backfill verified complete)
```sql
-- e.g. ALTER TABLE ... ALTER COLUMN ... SET NOT NULL
```

## Rollback (down-migration — tested, not assumed to work)
```sql

```
**Rollback tested on a disposable copy:** ✅ / ❌ (must be ✅ before this ships — `verification-discipline.md`)

## Verification queries (run after each step)
```sql
-- confirm the change did what it should, and nothing else
```

## Index impact
| Index | New / dropped / unaffected | `CREATE INDEX CONCURRENTLY` used? (required on a live table) |
|---|---|---|

## Cache invalidation (if this table is cached — `data-architect.md`)
-

## Sign-off
- [ ] Tested on a disposable copy/snapshot, never the shared dev DB as sandbox
- [ ] `EXPLAIN ANALYZE` evidence attached for any changed hot-path query
- [ ] Reviewed by Team Lead; Founder approval obtained if destructive/data-migrating (Always-Stop)

# Reference: data-pipelines

Deep detail for `data-pipelines.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Doctrine
- **ELT over ETL**: land raw data first (staging tables, immutable), transform into modeled tables after — you can re-run transforms; you can't re-fetch history you never landed.
- **Incremental loads**: watermark on `updated_at`/cursor per source; full refresh only as an explicit repair action. Every job answers "what happens when I run it twice?" — idempotent upserts, always.
- Layered warehouse (even inside one Postgres): `raw_` (as-received) → `stg_` (typed, deduped) → `mart_` (business-ready, what dashboards read). Dashboards NEVER read raw.
- **Pragmatic warehouse choice**: client's existing Postgres handles most SMB analytics; a dedicated warehouse (BigQuery et al) is a grooming-level cost decision, not a default.
- Scheduling: n8n or cron; every job emits success/failure + row counts; silent staleness is the enemy — freshness alert when a source hasn't updated in its expected window.

## Data quality gates (per pipeline, minimum)
Row-count sanity vs previous run (±X% alert) · null-rate on key columns · uniqueness on business keys · freshness timestamp exposed to dashboards ("data as of…").

## Privacy in pipelines
Minimize PII: pseudonymize where analysis doesn't need identity; PII columns inventoried (feeds `gdpr-compliance.md` data map); retention applied in the pipeline (old raw data purged per policy), not "eventually".

## Common failure modes
Timezone drift (store UTC, convert at display) · duplicates from overlapping incremental windows (dedupe on business key + latest wins) · schema drift from a source API silently adding fields · transform depending on run order that changed.

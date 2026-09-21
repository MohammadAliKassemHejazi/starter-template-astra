# Reference: backup-disaster-recovery

Deep detail for `backup-disaster-recovery.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Define the two numbers first
- **RPO (Recovery Point Objective)**: max acceptable data loss (e.g. 1h → hourly backups). 
- **RTO (Recovery Time Objective)**: max acceptable downtime to restore.
These come from the Founder/client (business call) and size everything else. Put them in `business-context.md`.

## Database backups
- **Automated snapshots**: managed Postgres (Heroku PG, RDS, Render) → enable scheduled backups day one; retention per RPO. Self-hosted → `pg_dump` on a cron to object storage (R2/S3), encrypted, with lifecycle rules.
- **Point-in-Time Recovery (PITR)**: enable where the platform supports it (RDS/managed) — restore to any second within the window, the strongest protection against "a script corrupted data at 14:32".
- **Off-platform copy**: at least one backup lives in a different account/provider (a backup only in the same account that gets locked/deleted is not a backup).

## The rule that makes backups real: test the restore
- A backup you've never restored is a hope, not a backup. **Periodically restore into a disposable environment and verify integrity** (row counts, key records, referential integrity).
- Document the exact restore steps in a runbook so recovery under pressure is a checklist, not improvisation.

## Application/config recovery
- Infra is code (IaC in repo) so environments are rebuildable; DNS records checked in (`production-deployment-gsc.md`); env-var inventory documented (values in the secret store, names in repo).
- Object storage (uploads/media) versioned + backed up — not just the DB.

## Emergency rollback procedures
- **Code rollback**: redeploy the last known-good build/tag (hosts keep previous deploys — Vercel/Render instant rollback; document the command). Fast and safe because it's not a data operation.
- **Data rollback**: restore from snapshot/PITR into a NEW instance first, verify, then cut over — **never restore-in-place over live data without Founder approval** (Always-Stop). A bad restore over good data is a second incident.
- **Migration rollback**: reversible down-migrations tested in advance (`postgres-safety.md`); if a migration corrupted data, prefer PITR to the moment before it.
- Every rollback is logged; a post-incident note feeds the retro (`retro.md`).

## Setup SOP
1. Set RPO/RTO with the Founder → record them.
2. Enable automated snapshots + PITR (or scheduled encrypted `pg_dump` off-platform).
3. Verify a real restore into a disposable env; write the restore runbook.
4. Document rollback commands (code + data + migration) and link them from uptime alerts.
5. Schedule a periodic restore drill.

## Guardrails
Restoring/overwriting live data = Always-Stop. Backups are encrypted; backup storage access is least-privilege (backups contain all the PII). Never test recovery against the live DB — disposable copies only.

## Common failure modes
Backups enabled but never restore-tested (corrupt/incomplete, discovered during a real incident) · backup in the same account as the thing it protects · PITR window shorter than detection time · restore-in-place making it worse · media/uploads not backed up (only DB) · rollback steps undocumented → slow recovery · unencrypted backups leaking PII.

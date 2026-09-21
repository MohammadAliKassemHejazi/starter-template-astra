import { migration as init } from './migrations/001-init';
import { sequelize } from './sequelize';

export interface Migration {
  name: string;
  up: string;
  down: string;
}

/** Ordered list; append new migrations, never edit applied ones. */
export const MIGRATIONS: Migration[] = [init];

const LOCK_KEY = 872_001;

/** Applies all pending migrations in ONE transaction, serialized by an advisory lock (safe for parallel boots). */
export async function migrateUp(): Promise<string[]> {
  const applied: string[] = [];
  await sequelize.transaction(async (t) => {
    await sequelize.query('SELECT pg_advisory_xact_lock(:k)', { replacements: { k: LOCK_KEY }, transaction: t });
    await sequelize.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())', { transaction: t });
    const [rows] = await sequelize.query('SELECT name FROM schema_migrations', { transaction: t });
    const done = new Set((rows as { name: string }[]).map((r) => r.name));
    for (const m of MIGRATIONS) {
      if (done.has(m.name)) continue;
      await sequelize.query(m.up, { transaction: t });
      await sequelize.query('INSERT INTO schema_migrations (name) VALUES (:n)', { replacements: { n: m.name }, transaction: t });
      applied.push(m.name);
    }
  });
  return applied;
}

/** Reverts the most recent migration (disposable databases only). */
export async function migrateDownLast(): Promise<string | null> {
  return sequelize.transaction(async (t) => {
    await sequelize.query('SELECT pg_advisory_xact_lock(:k)', { replacements: { k: LOCK_KEY }, transaction: t });
    const [rows] = await sequelize.query('SELECT name FROM schema_migrations ORDER BY applied_at DESC, name DESC LIMIT 1', { transaction: t });
    const last = (rows as { name: string }[])[0]?.name;
    const m = MIGRATIONS.find((x) => x.name === last);
    if (!m) return null;
    await sequelize.query(m.down, { transaction: t });
    await sequelize.query('DELETE FROM schema_migrations WHERE name = :n', { replacements: { n: m.name }, transaction: t });
    return m.name;
  });
}

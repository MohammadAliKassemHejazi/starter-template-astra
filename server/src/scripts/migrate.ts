import { migrateDownLast, migrateUp } from '../db/migrate';
import { sequelize } from '../db/sequelize';

async function main(): Promise<void> {
  if (process.argv.includes('--down')) {
    const reverted = await migrateDownLast();
    console.log(reverted ? `reverted ${reverted}` : 'nothing to revert');
  } else {
    const applied = await migrateUp();
    console.log(applied.length ? `applied: ${applied.join(', ')}` : 'database up to date');
  }
}

main()
  .then(() => sequelize.close())
  .catch((err: unknown) => {
    console.error('migration failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  });

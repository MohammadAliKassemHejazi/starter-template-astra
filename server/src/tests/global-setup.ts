import { migrateUp } from '../db/migrate';
import { sequelize } from '../db/sequelize';

export default async function setup(): Promise<() => Promise<void>> {
  await migrateUp();
  return async () => {
    await sequelize.close();
  };
}

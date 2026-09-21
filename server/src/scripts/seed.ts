import { sequelize } from '../db/sequelize';
import { rowCounts, seedAdminUser, seedRolesAndPermissions } from '../services/seed.service';

async function main(): Promise<void> {
  // No default credentials, ever: without both variables the seeder aborts.
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must both be set; refusing to seed');
  }
  const before = await rowCounts();
  await seedRolesAndPermissions();
  const admin = await seedAdminUser(email, password);
  const after = await rowCounts();
  console.log(`seed ok (admin ${admin}); rows before ${JSON.stringify(before)} after ${JSON.stringify(after)}`);
}

main()
  .then(() => sequelize.close())
  .catch((err: unknown) => {
    console.error('seed failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  });

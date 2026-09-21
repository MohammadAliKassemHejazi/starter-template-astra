import { afterAll, beforeEach } from 'vitest';
import { sequelize } from '../db/sequelize';
import { seedRolesAndPermissions } from '../services/seed.service';

// Clean slate per test: wipe data (never schema) and re-seed the system roles/permissions.
beforeEach(async () => {
  await sequelize.query('TRUNCATE refresh_tokens, user_roles, role_permissions, users, roles, permissions CASCADE');
  await seedRolesAndPermissions();
});

afterAll(async () => {
  await sequelize.close();
});

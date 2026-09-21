import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

/** Parses the repo-root .env (docker compose expands ${VAR}; plain dotenv parsing does not). */
function rootEnv(): Record<string, string> {
  try {
    const out: Record<string, string> = {};
    for (const line of readFileSync(resolve(__dirname, '../.env'), 'utf8').split(/\r?\n/)) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (m?.[1] !== undefined && m[2] !== undefined) out[m[1]] = m[2];
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * Tests run ONLY against the dedicated `app_test` database of the docker compose Postgres
 * (in a container: TEST_DATABASE_URL is injected; on the host: built from .env via the published port).
 */
function testDatabaseUrl(): string {
  const injected = process.env.TEST_DATABASE_URL;
  if (injected && !injected.includes('${')) return injected;
  const e = rootEnv();
  const { POSTGRES_USER: u, POSTGRES_PASSWORD: p, DB_HOST_PORT: port } = e;
  if (!u || !p) throw new Error('No test database configured: run `npm run setup` and `docker compose up -d db`');
  return `postgres://${u}:${encodeURIComponent(p)}@localhost:${port ?? '5433'}/app_test`;
}

const url = testDatabaseUrl();
if (!/\/app_test(\?|$)/.test(url)) throw new Error('Refusing to run tests against a database that is not app_test');

const env = {
  NODE_ENV: 'test',
  DATABASE_URL: url,
  TEST_DATABASE_URL: url,
  // Random per run; never a committed secret.
  JWT_ACCESS_SECRET: randomBytes(32).toString('hex'),
  CLIENT_ORIGIN: 'http://localhost:3000',
  TRUST_PROXY: 'false',
  ARGON2_MEMORY_KIB: '1024',
  ARGON2_TIME_COST: '2',
  ALLOW_REGISTRATION: 'true',
  RATE_LIMIT_GENERAL_MAX: '100000',
  RATE_LIMIT_AUTH_MAX: '100000',
  RATE_LIMIT_LOGIN_MAX: '100000',
  LOG_LEVEL: 'error',
};
Object.assign(process.env, env);

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globalSetup: ['./src/tests/global-setup.ts'],
    setupFiles: ['./src/tests/setup.ts'],
    env,
    fileParallelism: false, // one shared test database
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});

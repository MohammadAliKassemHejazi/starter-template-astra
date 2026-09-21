#!/usr/bin/env node
// Creates .env from the template with fresh random secrets. Never overwrites an existing .env.
// Secrets are NOT printed; read them from .env.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, '.env');

if (existsSync(target)) {
  console.log('.env already exists - left untouched.');
  process.exit(0);
}

const templatePath = [join(root, 'scripts', 'env.example.txt'), join(root, '.env.example')].find(existsSync);
if (!templatePath) {
  console.error('No template found (.env.example or scripts/env.example.txt).');
  process.exit(1);
}

const secrets = {
  POSTGRES_PASSWORD: randomBytes(24).toString('hex'),
  JWT_ACCESS_SECRET: randomBytes(48).toString('hex'),
  SEED_ADMIN_PASSWORD: randomBytes(18).toString('base64url'), // 24 chars
};

let out = readFileSync(templatePath, 'utf8');
for (const [key, value] of Object.entries(secrets)) {
  const re = new RegExp(`^${key}=.*$`, 'm');
  if (!re.test(out)) {
    console.error(`Template is missing ${key}=`);
    process.exit(1);
  }
  out = out.replace(re, () => `${key}=${value}`);
}

writeFileSync(target, out, { flag: 'wx', mode: 0o600 });
console.log('Created .env with generated secrets. Read POSTGRES_PASSWORD / SEED_ADMIN_PASSWORD from .env (not printed).');

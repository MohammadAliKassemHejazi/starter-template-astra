import { defineConfig } from '@playwright/test';

// BASE_URL set (e.g. docker compose e2e profile) => test that running stack, no dev server.
const baseURL = process.env.BASE_URL;

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: baseURL ?? 'http://localhost:3000' },
  ...(baseURL
    ? {}
    : { webServer: { command: 'npm run dev', url: 'http://localhost:3000', reuseExistingServer: true } }),
});

import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

// Use a preinstalled Chromium when available (CI images / sandboxes), else Playwright's own.
const localChromium = process.env.PW_CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const launchOptions = existsSync(localChromium) ? { executablePath: localChromium } : {};

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    launchOptions,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npx vite build && npx vite preview --port 4173 --strictPort',
    port: 4173,
    reuseExistingServer: true,
    timeout: 180_000,
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1360, height: 900 } }, testIgnore: /mobile\.spec/ },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /mobile\.spec/ },
  ],
});

import { defineConfig, devices } from '@playwright/test';

// Optional local overrides (accounts, target site) live in .env.e2e, which is
// not committed. See e2e/README.md.
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config({ path: '.env.e2e' });
} catch {
  // dotenv is optional — environment variables work on their own.
}

const BASE_URL = process.env.E2E_BASE_URL || 'https://qa.wevoro.com';

/**
 * End-to-end tests: a real browser doing what an agency or caregiver does.
 *
 * These run against a deployed site (QA by default) or a local dev server, so
 * they check the app as it is actually served, not a mocked copy of it.
 */
export default defineConfig({
  testDir: './e2e',
  // The suite writes and reads real data on the target site, so the tests are
  // deliberately serial: two of them buying the same packet at once would be
  // testing the race, not the feature.
  fullyParallel: false,
  workers: 1,
  timeout: 150_000,
  expect: { timeout: 30_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'e2e-report' }]],
  use: {
    baseURL: BASE_URL,
    viewport: { width: 1440, height: 900 },
    actionTimeout: 30_000,
    navigationTimeout: 90_000,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Locally this drives the Chrome that is already installed, so nobody
        // has to download a browser first. CI installs Playwright's own.
        channel: process.env.CI ? undefined : 'chrome',
      },
    },
  ],
});

import { defineConfig, devices } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

// Ensure the storageState file exists before Playwright evaluates config.
// global-setup.js will overwrite it with real auth data at runtime.
const authDir = path.resolve(__dirname, 'tests-e2e', '.auth')
const storageStatePath = path.join(authDir, 'storageState.json')
if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true })
if (!fs.existsSync(storageStatePath)) {
  fs.writeFileSync(storageStatePath, JSON.stringify({ cookies: [], origins: [] }))
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  globalSetup: require.resolve('./tests-e2e/global-setup'),
  testDir: './tests-e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Store all Playwright output under a single artifacts directory */
  outputDir: 'artifacts/test-results',

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html', { outputFolder: 'artifacts/playwright-report', open: 'never' }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3034',
    /* Use storageState produced by global-setup for authenticated tests */
    storageState: storageStatePath,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3034',
    reuseExistingServer: !process.env.CI,
  },
})

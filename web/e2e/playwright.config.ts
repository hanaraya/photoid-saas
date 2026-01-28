import { defineConfig, devices } from '@playwright/test';

/**
 * E2E Test Configuration for SafePassportPic
 * Focuses on US and UK passport photo testing
 */
export default defineConfig({
  testDir: './specs',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,
  
  /* Parallel workers */
  workers: process.env.CI ? 1 : 2,
  
  /* Reporter configuration */
  reporter: [
    ['list'],
    ['html', { outputFolder: '../playwright-report/e2e', open: 'never' }],
    ['json', { outputFile: '../test-results/e2e-results.json' }],
  ],
  
  /* Shared settings */
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    /* Wait longer for model loading */
    actionTimeout: 30_000,
    navigationTimeout: 30_000,
  },

  /* Test timeout - passport photo processing can be slow */
  timeout: 60_000,
  
  expect: {
    timeout: 15_000,
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
    },
  },

  /* Projects */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Web server */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },

  /* Output */
  outputDir: '../test-results/e2e',
});

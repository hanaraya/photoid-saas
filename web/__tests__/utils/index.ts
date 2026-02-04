/**
 * Test Utilities Index
 *
 * Exports all testing utilities for easy import
 */

export {
  analyzeImageQuality,
  compareImages,
  type QualityAnalysisResult,
  type QualityCheck,
  type ColorDistribution,
  type RegionStats,
} from './visual-quality-analyzer';

export {
  generateTestFixture,
  generateAllFixtures,
  getFixturePath,
  getPassingFixtures,
  getFailingFixtures,
  TEST_FIXTURES,
  type TestFixtureConfig,
} from './test-fixture-generator';

/**
 * Common test helpers
 */

import type { Page, Download } from '@playwright/test';
import path from 'path';

// Test fixture paths
export const FIXTURE_PATHS = {
  testPortrait: path.join(__dirname, '../fixtures/test-portrait.jpg'),
  validPortrait: path.join(__dirname, '../fixtures/valid-portrait.jpg'),
  largePhoto: path.join(__dirname, '../fixtures/large-photo.jpg'),
  lowResolution: path.join(__dirname, '../fixtures/low-resolution.jpg'),
  multipleFaces: path.join(__dirname, '../fixtures/multiple-faces.jpg'),
  noFace: path.join(__dirname, '../fixtures/landscape-no-face.jpg'),
  corrupted: path.join(__dirname, '../fixtures/corrupted.jpg'),
  qualityTests: path.join(__dirname, '../fixtures/quality-tests'),
};

/**
 * Country standards configuration
 */
export const COUNTRY_STANDARDS = {
  us: { width: 600, height: 600, unit: 'in' as const, specW: 2, specH: 2 },
  uk: { width: 413, height: 531, unit: 'mm' as const, specW: 35, specH: 45 },
  eu: { width: 413, height: 531, unit: 'mm' as const, specW: 35, specH: 45 },
  canada: {
    width: 591,
    height: 827,
    unit: 'mm' as const,
    specW: 50,
    specH: 70,
  },
  india: { width: 600, height: 600, unit: 'in' as const, specW: 2, specH: 2 },
  australia: {
    width: 413,
    height: 531,
    unit: 'mm' as const,
    specW: 35,
    specH: 45,
  },
  china: { width: 390, height: 567, unit: 'mm' as const, specW: 33, specH: 48 },
  japan: { width: 413, height: 531, unit: 'mm' as const, specW: 35, specH: 45 },
};

/**
 * Bypass payment verification in session storage
 */
export async function bypassPayment(page: Page): Promise<void> {
  await page.evaluate(() => {
    sessionStorage.setItem('passport-photo-verified', 'test-session');
  });
}

/**
 * Upload a photo and wait for processing
 */
export async function uploadPhoto(
  page: Page,
  imagePath: string
): Promise<void> {
  await page.locator('input[type="file"]').setInputFiles(imagePath);
  await page
    .locator('canvas')
    .first()
    .waitFor({ state: 'visible', timeout: 15000 });
  await page
    .locator('text=Face detected')
    .or(page.locator('text=No face found'))
    .first()
    .waitFor({ state: 'visible', timeout: 15000 });
}

/**
 * Complete the flow from upload to output
 */
export async function completeFlow(
  page: Page,
  imagePath: string
): Promise<void> {
  await uploadPhoto(page, imagePath);
  await page.getByRole('button', { name: /Generate Printable Sheet/i }).click();
  await page
    .locator('text=Your Passport Photos')
    .waitFor({ state: 'visible', timeout: 10000 });
}

/**
 * Wait for download and return the buffer
 */
export async function waitForDownload(
  page: Page,
  action: () => Promise<void>
): Promise<{ download: Download; buffer: Buffer }> {
  const fs = await import('fs');

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    action(),
  ]);

  const downloadPath = await download.path();
  if (!downloadPath) throw new Error('Download failed');

  return {
    download,
    buffer: fs.readFileSync(downloadPath),
  };
}

/**
 * Select a country standard in the UI
 */
export async function selectCountryStandard(
  page: Page,
  standardId: string
): Promise<void> {
  await page.locator('button[role="combobox"]').first().click();
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
}

/**
 * Take a screenshot and save it for debugging
 */
export async function debugScreenshot(page: Page, name: string): Promise<void> {
  const fs = await import('fs');
  const screenshotDir = path.join(__dirname, '../../test-results/debug');

  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  await page.screenshot({
    path: path.join(screenshotDir, `${name}-${Date.now()}.png`),
    fullPage: true,
  });
}

/**
 * Wait for a specific compliance check to appear
 */
export async function waitForComplianceCheck(
  page: Page,
  checkName: string
): Promise<void> {
  await page
    .locator(`text=${checkName}`)
    .first()
    .waitFor({ state: 'visible', timeout: 5000 });
}

/**
 * Get all compliance check statuses from the page
 */
export async function getComplianceStatuses(
  page: Page
): Promise<Map<string, 'pass' | 'fail' | 'warn'>> {
  const statuses = new Map<string, 'pass' | 'fail' | 'warn'>();

  // Find all compliance check items
  const checks = await page
    .locator('[class*="compliance"], [data-testid*="check"]')
    .all();

  for (const check of checks) {
    const text = await check.textContent();
    if (text) {
      const hasPass = text.includes('✓') || text.includes('pass');
      const hasFail = text.includes('✗') || text.includes('fail');
      const hasWarn = text.includes('!') || text.includes('warn');

      // Extract check name (simplified)
      const name = text.split(':')[0]?.trim() || text.substring(0, 20);

      if (hasPass) statuses.set(name, 'pass');
      else if (hasFail) statuses.set(name, 'fail');
      else if (hasWarn) statuses.set(name, 'warn');
    }
  }

  return statuses;
}
